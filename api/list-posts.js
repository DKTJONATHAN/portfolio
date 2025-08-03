import { Octokit } from '@octokit/rest';

// Cache setup (keep existing)
let cachedPosts = null;
let lastFetchTime = 0;
const CACHE_LIFETIME_MS = 300000;

// Background update helper
async function triggerStaticRegeneration() {
  try {
    // Fire-and-forget requests (no await)
    const urls = [
      `${process.env.VERCEL_URL}/api/sitemap`,
      `${process.env.VERCEL_URL}/api/rss.xml`
    ];
    
    urls.forEach(url => {
      fetch(url, { method: 'HEAD' })
        .catch(e => console.log('Background update skipped:', e.message));
    });
  } catch (e) {
    console.log('Regeneration error:', e.message);
  }
}

export default async function handler(req, res) {
  try {
    // 1. Cache check (existing logic)
    if (cachedPosts && Date.now() - lastFetchTime < CACHE_LIFETIME_MS) {
      return res.status(200).json({ 
        data: cachedPosts,
        error: null,
        cached: true
      });
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    // 2. Fetch and process posts (existing logic)
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
        url: `https://jonathanmwaniki.co.ke/articles/${post.slug}`
      }));

    // 3. Update cache (existing)
    cachedPosts = posts;
    lastFetchTime = Date.now();

    // 4. Trigger background updates (NEW)
    if (process.env.NODE_ENV === 'production') {
      triggerStaticRegeneration(); // No await - runs in background
    }

    return res.status(200).json({
      data: posts,
      error: null,
      cached: false
    });

  } catch (error) {
    // Existing error handling
  }
}