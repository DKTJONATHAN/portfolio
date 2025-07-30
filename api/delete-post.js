import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { slug } = req.body;
    if (!slug) {
      return res.status(400).json({ error: 'Slug is required' });
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const filePath = `content/articles/${slug}.html`.toLowerCase();
    const metadataPath = `content/articles.json`;

    // Attempt to delete the HTML file, but continue if it doesn't exist
    let htmlDeleted = false;
    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: filePath,
      });
      await octokit.repos.deleteFile({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: filePath,
        message: `Delete post: ${slug}`,
        sha: data.sha,
      });
      htmlDeleted = true;
    } catch (error) {
      if (error.status !== 404) {
        console.error('Error deleting HTML file:', error.message);
        return res.status(500).json({ error: `Failed to delete HTML file: ${error.message}` });
      }
      console.log(`HTML file not found for slug: ${slug}, proceeding with metadata deletion`);
    }

    // Delete metadata from articles.json
    let metadata = [];
    let metadataSha;
    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: metadataPath,
      });
      metadata = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
      metadataSha = data.sha;
    } catch (error) {
      if (error.status !== 404) {
        console.error('Error fetching articles.json:', error.message);
        return res.status(500).json({ error: `Failed to fetch metadata: ${error.message}` });
      }
      console.log('articles.json not found, no metadata to delete');
      return res.status(200).json({
        message: htmlDeleted
          ? 'HTML file deleted successfully, no metadata found'
          : 'No HTML file or metadata found',
      });
    }

    // Check if metadata exists for the slug
    const metadataExists = metadata.some(post => post.slug === slug);
    if (!metadataExists) {
      return res.status(200).json({
        message: htmlDeleted
          ? 'HTML file deleted successfully, no metadata found for slug'
          : 'No HTML file or metadata found for slug',
      });
    }

    // Filter out the post with the matching slug
    const updatedMetadata = metadata.filter(post => post.slug !== slug);

    // Update articles.json
    const metadataContent = Buffer.from(JSON.stringify(updatedMetadata, null, 2)).toString('base64');
    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: metadataPath,
      message: `Remove metadata for post: ${slug}`,
      content: metadataContent,
      sha: metadataSha,
    });

    return res.status(200).json({
      message: htmlDeleted
        ? 'HTML file and metadata deleted successfully'
        : 'Metadata deleted successfully, no HTML file found',
    });
  } catch (error) {
    console.error('Error in delete-post handler:', error.message, error.stack);
    return res.status(500).json({ error: `Failed to delete post: ${error.message}` });
  }
}