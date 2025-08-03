const { Octokit } = require('@octokit/rest');

let cachedPosts = null;
let lastFetchTime = 0;
const CACHE_LIFETIME_MS = 300000; // 5 minutes cache

async function triggerStaticRegeneration() {
  try {
    const urls = [
      `${process.env.VERCEL_URL}/api/sitemap`,
      `${process.env.VERCEL_URL}/api/rss`
    ];
    
    await Promise.all(urls.map(url => 
      fetch(url).catch(e => console.log('Regeneration skipped for', url, e.message))
    ));
  } catch (e) {
    console.log('Regeneration error:', e.message);
  }
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    // Check for cache first
    if (cachedPosts && Date.now() - lastFetchTime < CACHE_LIFETIME_MS) {
      return res.status(200).json({
        data: cachedPosts,
        cached: true,
        timestamp: new Date(lastFetchTime).toISOString()
      });
    }

    // Validate environment variables
    if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_OWNER || !process.env.GITHUB_REPO) {
      throw new Error('Missing required GitHub configuration');
    }

    const octokit = new Octokit({ 
      auth: process.env.GITHUB_TOKEN,
      userAgent: 'MwanikiReports/1.0'
    });

    // Fetch content from GitHub
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'content/articles.json',
      headers: {
        'Accept': 'application/vnd.github.v3.raw'
      }
    });

    // Parse and validate response
    const metadata = typeof data === 'string' ? JSON.parse(data) : data;
    if (!Array.isArray(metadata)) {
      throw new Error('Invalid data format: Expected array');
    }

    // Process posts
    const allowedCategories = ['News', 'Breaking News', 'Opinions', 'Business', 'Sports', 'Tech', 'Entertainment'];
    const posts = metadata
      .filter(post => post?.slug && post?.title && post?.date)
      .map(post => ({
        ...post,
        category: allowedCategories.includes(post.category) ? post.category : 'Uncategorized',
        url: `https://${process.env.VERCEL_URL}/articles/${post.slug}`,
        date: new Date(post.date).toISOString()
      }));

    // Update cache
    cachedPosts = posts;
    lastFetchTime = Date.now();

    // Trigger background regeneration in production
    if (process.env.NODE_ENV === 'production') {
      await triggerStaticRegeneration();
    }

    // Send response
    res.status(200).json({
      data: posts,
      cached: false,
      timestamp: new Date().toISOString(),
      count: posts.length
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
};