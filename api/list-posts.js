import { Octokit } from '@octokit/rest';

// Cache variables
let cachedPosts = null;
let lastFetchTime = 0;

export default async function handler(req, res) {
  try {
    // Cache check (5-minute cache)
    if (cachedPosts && Date.now() - lastFetchTime < 300000) {
      return res.status(200).json({ 
        data: cachedPosts,
        error: null,
        cached: true
      });
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    // 1. Fetch metadata
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'content/articles.json',
      headers: { 'If-None-Match': req.headers['if-none-match'] } // ETag support
    });

    if (data.encoding !== 'base64') {
      throw new Error('Unsupported encoding for articles.json');
    }

    const metadata = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));

    // 2. Process posts
    const allowedCategories = ['News', 'Breaking News', 'Opinions', 'Business', 'Sports', 'Tech', 'Entertainment'];
    const posts = metadata
      .filter(post => post?.slug && post?.title && post?.date && allowedCategories.includes(post?.category))
      .map(post => ({
        slug: post.slug,
        title: post.title,
        description: post.description || '',
        image: post.image ? post.image.startsWith('http') ? post.image : `https://jonathanmwaniki.co.ke${post.image}` : '',
        date: post.date,
        category: post.category,
        tags: post.tags ? post.tags.split(',').map(tag => tag.trim()) : [],
        content: post.content || '',
        url: `https://jonathanmwaniki.co.ke/articles/${post.slug}`
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first

    // Update cache
    cachedPosts = posts;
    lastFetchTime = Date.now();

    // 3. Auto-trigger sitemap/RSS updates in production
    if (process.env.VERCEL_ENV === 'production') {
      try {
        await Promise.allSettled([
          fetch(`${process.env.VERCEL_URL}/api/sitemap`, { method: 'HEAD' }),
          fetch(`${process.env.VERCEL_URL}/api/rss.xml`, { method: 'HEAD' })
        ]);
      } catch (e) {
        console.log('Background update failed:', e);
      }
    }

    return res.status(200).json({
      data: posts,
      error: null,
      cached: false
    });

  } catch (error) {
    if (error.status === 304) {
      return res.status(304).end(); // Not Modified
    }
    if (error.status === 404) {
      return res.status(200).json({ data: [], error: null });
    }
    
    console.error('Error fetching posts:', error);
    return res.status(500).json({ 
      data: [], 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}