import { Octokit } from '@octokit/rest';

// Cache variables (5-minute lifetime)
let cachedPosts = null;
let lastFetchTime = 0;
const CACHE_LIFETIME_MS = 300000; // 5 minutes

export default async function handler(req, res) {
  try {
    // 1. Return cached data if valid
    if (cachedPosts && Date.now() - lastFetchTime < CACHE_LIFETIME_MS) {
      return res.status(200).json({
        data: cachedPosts,
        error: null,
        cached: true // Optional flag for debugging
      });
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    // 2. Original fetch + processing
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'content/articles.json',
    });
    const metadata = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));

    const allowedCategories = ['News', 'Breaking News', 'Opinions', 'Business', 'Sports', 'Tech', 'Entertainment'];
    const posts = metadata
      .filter(post => post && post.slug && post.title && post.date && allowedCategories.includes(post.category))
      .map(post => ({
        ...post,
        description: post.description || '',
        image: post.image || '',
        tags: post.tags || '',
        content: post.content || '',
        url: `https://jonathanmwaniki.co.ke/articles/${post.slug}`
      }));

    // 3. Update cache
    cachedPosts = posts;
    lastFetchTime = Date.now();

    return res.status(200).json({
      data: posts,
      error: null,
      cached: false
    });

  } catch (error) {
    // Fallback to cache if available
    if (cachedPosts) {
      console.warn('Using cached data due to error:', error.message);
      return res.status(200).json({
        data: cachedPosts,
        error: null,
        cached: true
      });
    }
    
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