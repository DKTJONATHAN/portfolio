import { Octokit } from '@octokit/rest';

// Cache setup
let cachedPosts = null;
let lastFetchTime = 0;
const CACHE_LIFETIME_MS = 300000;

// Background update helper
async function triggerStaticRegeneration() {
  try {
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
    // 1. Cache check
    if (cachedPosts && Date.now() - lastFetchTime < CACHE_LIFETIME_MS) {
      return res.status(200).json({ 
        data: cachedPosts,
        error: null,
        cached: true
      });
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    // 2. Fetch and process posts
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'content/articles.json',
    }).catch(error => {
      throw new Error(`GitHub API error: ${error.status} - ${error.message}`);
    });

    if (!data.content) {
      throw new Error('No content found in articles.json');
    }

    const metadata = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));

    const allowedCategories = ['News', 'Breaking News', 'Opinions', 'Business', 'Sports', 'Tech', 'Entertainment'];
    const posts = metadata
      .filter(post => post && post.slug && post.title && post.date && allowedCategories.includes(post.category))
      .map(post => ({
        ...post,
        url: `https://jonathanmwaniki.co.ke/articles/${post.slug}`
      }));

    // 3. Update cache
    cachedPosts = posts;
    lastFetchTime = Date.now();

    // 4. Trigger background updates
    if (process.env.NODE_ENV === 'production') {
      triggerStaticRegeneration();
    }

    return res.status(200).json({
      data: posts,
      error: null,
      cached: false
    });
  } catch (error) {
    console.error('list-posts error:', error.message);
    return res.status(500).json({
      data: [],
      error: error.message,
      cached: false
    });
  }
}