import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    // 1. Fetch metadata (original working code)
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'content/articles.json',
    });
    
    const metadata = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));

    // 2. Process posts (original filter logic)
    const allowedCategories = ['News', 'Breaking News', 'Opinions', 'Business', 'Sports', 'Tech', 'Entertainment'];
    const posts = metadata
      .filter(post => post && post.slug && post.title && post.date && allowedCategories.includes(post.category))
      .map(post => ({
        // Keep original fields exactly as your site expects
        slug: post.slug,
        title: post.title,
        description: post.description || '',
        image: post.image || '',
        date: post.date,
        category: post.category,
        tags: post.tags || '', // Maintain string format if your frontend expects this
        content: post.content || ''
      }));

    // 3. Return original response structure
    return res.status(200).json({
      data: posts,
      error: null
    });

  } catch (error) {
    // Original error handling
    if (error.status === 404) {
      return res.status(200).json({ data: [], error: null });
    }
    console.error('Error fetching posts:', error);
    return res.status(500).json({ 
      data: [], 
      error: `Failed to fetch posts: ${error.message}`
    });
  }
}