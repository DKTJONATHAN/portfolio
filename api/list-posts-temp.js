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
    // Log environment variables (without exposing token)
    console.log('Environment check:', {
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      vercel_url: process.env.VERCEL_URL,
      has_token: !!process.env.GITHUB_TOKEN
    });

    // 1. Cache check
    if (cachedPosts && Date.now() - lastFetchTime < CACHE_LIFETIME_MS) {
      console.log('Returning cached posts');
      return res.status(200).json({ 
        data: cachedPosts,
        error: null,
        cached: true
      });
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    // 2. Fetch and process posts
    console.log('Fetching content/articles.json');
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
    console.log('Articles fetched:', metadata.length);

    const allowedCategories = ['News', 'Breaking News', 'Opinions', 'Business', 'Sports', 'Tech', 'Entertainment'];
    const posts = metadata
      .filter(post => {
        const isValid = post && post.slug && post.title && post.date && allowedCategories.includes(post.category);
        if (!isValid) {
          console.log('Filtered out post:', { slug: post?.slug, category: post?.category });
        }
        return isValid;
      })
      .map(post => ({
        ...post,
        url: `https://test-r0ut3hzoq-jonito2s-projects.vercel.app/articles/${post.slug}`
      }));
    console.log('Filtered posts:', posts.length);

    // 3. Update cache
    cachedPosts = posts;
    lastFetchTime = Date.now();

    // 4. Trigger background updates
    if (process.env.NODE_ENV === 'production') {
      console.log('Triggering background updates');
      triggerStaticRegeneration();
    }

    return res.status(200).json({
      data: posts,
      error: null,
      cached: false
    });
  } catch (error) {
    console.error('list-posts-temp error:', error.message);
    return res.status(500).json({
      data: [],
      error: error.message,
      cached: false
    });
  }
}