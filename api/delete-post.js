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

    // Delete the HTML file
    let sha;
    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: filePath,
      });
      sha = data.sha;
    } catch (error) {
      if (error.status === 404) {
        return res.status(404).json({ error: 'Post not found' });
      }
      throw error;
    }

    await octokit.repos.deleteFile({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: filePath,
      message: `Delete post: ${slug}`,
      sha,
    });

    // Update articles.json to remove the post's metadata
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
      if (error.status !== 404) throw error;
      // If articles.json doesn't exist, no metadata to remove
    }

    // Filter out the post with the matching slug
    const updatedMetadata = metadata.filter(post => post.slug !== slug);

    // If metadata was unchanged, no need to update
    if (metadata.length === updatedMetadata.length) {
      return res.status(200).json({ message: 'Post deleted successfully, no metadata found to remove' });
    }

    // Update articles.json
    const metadataContent = Buffer.from(JSON.stringify(updatedMetadata, null, 2)).toString('base64');
    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: metadataPath,
      message: `Remove metadata for post: ${slug}`,
      content: metadataContent,
      sha: metadataSha || undefined,
    });

    return res.status(200).json({ message: 'Post and metadata deleted successfully' });
  } catch (error) {
    console.error('Error in delete-post handler:', error);
    return res.status(500).json({ error: `Failed to delete post: ${error.message}` });
  }
}