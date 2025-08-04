// api/fetch-posts.js
import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  try {
    // Debug: Verify environment variables are loaded
    console.log('[DEBUG] Environment Variables:', {
      hasToken: !!process.env.GITHUB_TOKEN,
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO
    });

    if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_OWNER || !process.env.GITHUB_REPO) {
      throw new Error('Missing required GitHub environment variables');
    }

    const octokit = new Octokit({ 
      auth: process.env.GITHUB_TOKEN 
    });

    const metadataPath = 'content/articles.json';

    // Get query parameters with defaults
    const { 
      page = 1, 
      limit = 10, 
      category = '', 
      search = '', 
      sort = 'newest',
      tag = ''
    } = req.query;

    // Fetch metadata from GitHub
    let metadata = [];
    try {
      console.log(`[DEBUG] Fetching content from: ${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/${metadataPath}`);
      
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: metadataPath,
        headers: {
          'Accept': 'application/vnd.github.v3.raw' // Get raw JSON
        }
      });

      metadata = typeof data === 'string' ? JSON.parse(data) : data;
      console.log(`[DEBUG] Found ${metadata.length} posts in metadata`);
      
    } catch (error) {
      console.error('[ERROR] Failed to fetch articles:', error.message);
      if (error.status === 404) {
        return res.status(200).json({ 
          posts: [], 
          totalPosts: 0,
          totalPages: 0,
          currentPage: 1,
          message: 'No articles found in repository'
        });
      }
      return res.status(500).json({ 
        error: 'Failed to fetch posts metadata',
        details: error.message 
      });
    }

    // Process posts with fallbacks
    let filteredPosts = metadata.map(post => ({
      title: post.title || 'Untitled Post',
      description: post.description || '',
      image: isValidImageUrl(post.image) ? post.image : '/images/Jonathan-Mwaniki-logo.png',
      date: post.date || new Date().toISOString(),
      category: post.category || 'Uncategorized',
      tags: post.tags || '',
      slug: post.slug || generateSlug(post.title),
      content: post.content || ''
    }));

    // Filtering logic
    if (category) {
      filteredPosts = filteredPosts.filter(post => 
        post.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (tag) {
      filteredPosts = filteredPosts.filter(post => 
        post.tags.toLowerCase().includes(tag.toLowerCase())
      );
    }

    if (search) {
      const searchTerm = search.toLowerCase();
      filteredPosts = filteredPosts.filter(post => 
        post.title.toLowerCase().includes(searchTerm) || 
        post.description.toLowerCase().includes(searchTerm) ||
        (post.tags && post.tags.toLowerCase().includes(searchTerm))
      );
    }

    // Sorting
    filteredPosts.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sort === 'oldest' ? dateA - dateB : dateB - dateA;
    });

    // Pagination
    const totalPosts = filteredPosts.length;
    const totalPages = Math.ceil(totalPosts / limit);
    const currentPage = Math.min(Math.max(parseInt(page), totalPages);
    const startIndex = (currentPage - 1) * limit;
    const paginatedPosts = filteredPosts.slice(startIndex, startIndex + parseInt(limit));

    // Response
    return res.status(200).json({
      posts: paginatedPosts.map(post => ({
        ...post,
        url: `/content/articles/${post.slug}.html`
      })),
      totalPosts,
      totalPages,
      currentPage
    });

  } catch (error) {
    console.error('[CRITICAL] Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Helper functions
function generateSlug(title) {
  return title 
    ? title.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-')
    : 'untitled-' + Math.random().toString(36).substring(2, 7);
}

function isValidImageUrl(url) {
  if (!url) return false;
  try {
    new URL(url);
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  } catch {
    return false;
  }
}
