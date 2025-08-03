const { Octokit } = require('@octokit/rest');

let cachedPosts = null;
let lastFetchTime = 0;
const CACHE_LIFETIME_MS = 300000;

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

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    if (cachedPosts && Date.now() - lastFetchTime < CACHE_LIFETIME_MS) {
      return res.status(200).json({
        data: cachedPosts,
        error: null,
        cached: true
      });
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'content/articles.json',
    });
    if (!data.content) throw new Error('No content in articles.json');
    const metadata = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
    if (!Array.isArray(metadata)) throw new Error('articles.json is not an array');

    const allowedCategories = ['News', 'Breaking News', 'Opinions', 'Business', 'Sports', 'Tech', 'Entertainment'];
    const posts = metadata
      .filter(post => post && post.slug && post.title && post.date && allowedCategories.includes(post.category))
      .map(post => ({
        ...post,
        url: `https://jonathanmwaniki.co.ke/articles/${post.slug}`
      }));

    cachedPosts = posts;
    lastFetchTime = Date.now();

    if (process.env.NODE_ENV === 'production') {
      triggerStaticRegeneration();
    }

    res.status(200).json({
      data: posts,
      error: null,
      cached: false
    });
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(error.status || 500).json({ error: error.message });
  }
};