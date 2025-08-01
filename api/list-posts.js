import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    // Fetch metadata from content/articles.json
    let metadata = [];
    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: 'content/articles.json',
      });
      if (data.encoding !== 'base64') {
        throw new Error('Unsupported encoding for articles.json');
      }
      metadata = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
    } catch (error) {
      if (error.status === 404) {
        return res.status(200).json({ data: [], error: null });
      }
      throw new Error(`GitHub API error: ${error.message}`);
    }

    // Validate and filter posts
    const allowedCategories = ['News', 'Breaking News', 'Opinions', 'Business', 'Sports', 'Tech', 'Entertainment'];
    const posts = metadata
      .filter(post => post && post.slug && post.title && post.date && allowedCategories.includes(post.category))
      .map(post => ({
        slug: post.slug,
        title: post.title,
        description: post.description || '',
        image: post.image || '',
        date: post.date,
        category: post.category,
        tags: post.tags || '',
        content: post.content || ''
      }));

    return res.status(200).json({
      data: posts,
      error: null,
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return res.status(500).json({ data: [], error: `Failed to fetch posts: ${error.message}` });
  }
} 