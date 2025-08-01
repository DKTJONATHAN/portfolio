import { Octokit } from '@octokit/rest';

// Cache configuration
const CACHE_CONFIG = {
  lifetime: 300000, // 5 minutes
  lastFetch: 0,
  data: null
};

// Background update helper (runs independently)
const triggerStaticRegeneration = async () => {
  if (process.env.NODE_ENV !== 'production') return;
  
  const endpoints = [
    `${process.env.VERCEL_URL}/api/sitemap`,
    `${process.env.VERCEL_URL}/api/rss.xml`
  ];

  try {
    await Promise.allSettled(
      endpoints.map(url => 
        fetch(url, { 
          method: 'HEAD',
          headers: { 'x-regeneration-secret': process.env.REGENERATION_SECRET }
        })
      )
    );
    console.log('[Background] Triggered static regeneration');
  } catch (e) {
    console.error('[Background] Regeneration skipped:', e.message);
  }
};

export default async function handler(req, res) {
  // 1. Cache handling
  if (CACHE_CONFIG.data && Date.now() - CACHE_CONFIG.lastFetch < CACHE_CONFIG.lifetime) {
    return res.status(200).json({
      data: CACHE_CONFIG.data,
      error: null,
      cached: true,
      timestamp: new Date(CACHE_CONFIG.lastFetch).toISOString()
    });
  }

  try {
    // 2. Fetch fresh data
    const octokit = new Octokit({ 
      auth: process.env.GITHUB_TOKEN,
      request: { timeout: 5000 } // 5s timeout
    });

    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'content/articles.json',
      headers: { 'If-None-Match': req.headers['if-none-match'] }
    });

    // 3. Process posts
    const allowedCategories = ['News', 'Breaking News', 'Opinions', 'Business', 'Sports', 'Tech', 'Entertainment'];
    const metadata = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));

    const posts = metadata
      .filter(post => 
        post?.slug && 
        post?.title && 
        post?.date && 
        allowedCategories.includes(post?.category)
      .map(post => ({
        // Core fields
        slug: post.slug,
        title: post.title,
        description: post.description || '',
        image: post.image ? 
          post.image.startsWith('http') ? 
            post.image : 
            `${process.env.BASE_URL || 'https://jonathanmwaniki.co.ke'}${post.image}`
          : '',
        date: post.date,
        category: post.category,
        tags: post.tags ? post.tags.split(',').map(t => t.trim()) : [],
        content: post.content || '',
        
        // Computed fields
        url: `${process.env.BASE_URL || 'https://jonathanmwaniki.co.ke'}/articles/${post.slug}`,
        last_updated: new Date().toISOString()
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first

    // 4. Update cache
    CACHE_CONFIG.data = posts;
    CACHE_CONFIG.lastFetch = Date.now();

    // 5. Trigger background jobs
    if (process.env.NODE_ENV === 'production') {
      triggerStaticRegeneration();
    }

    // 6. Response
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).json({
      data: posts,
      error: null,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Graceful fallbacks
    if (error.status === 304) {
      return res.status(304).end(); // Not Modified
    }

    if (error.status === 404) {
      return res.status(200).json({ 
        data: [], 
        error: null 
      });
    }

    if (CACHE_CONFIG.data) {
      console.error('Using cache after error:', error.message);
      return res.status(200).json({
        data: CACHE_CONFIG.data,
        error: `Warning: ${error.message}`,
        cached: true,
        timestamp: new Date(CACHE_CONFIG.lastFetch).toISOString()
      });
    }

    console.error('Critical fetch error:', error);
    return res.status(500).json({ 
      data: [], 
      error: 'Failed to load content. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : null
    });
  }
}