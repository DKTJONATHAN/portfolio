import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const metadataPath = 'content/articles.json';

    // Extract query parameters
    const {
      page = 1,
      limit = 50,
      category,
      tag,
      search,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    let metadata = [];
    
    try {
      // Fetch the articles metadata from GitHub
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: metadataPath,
      });
      
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      metadata = JSON.parse(content);
      
    } catch (error) {
      if (error.status === 404) {
        console.log('articles.json not found, returning empty array');
        return res.status(200).json({
          posts: [],
          pagination: {
            page: 1,
            limit: parseInt(limit),
            total: 0,
            totalPages: 0
          },
          message: 'No articles found'
        });
      } else {
        console.error('Error fetching articles.json:', error);
        throw error;
      }
    }

    // Ensure we have an array
    if (!Array.isArray(metadata)) {
      metadata = [];
    }

    // Filter posts based on query parameters
    let filteredPosts = metadata.filter(post => {
      let matches = true;

      // Category filter
      if (category && post.category !== category) {
        matches = false;
      }

      // Tag filter
      if (tag && post.tags) {
        const postTags = post.tags.split(',').map(t => t.trim().toLowerCase());
        if (!postTags.includes(tag.toLowerCase())) {
          matches = false;
        }
      }

      // Search filter (search in title, description, and tags)
      if (search && matches) {
        const searchTerm = search.toLowerCase();
        const titleMatch = post.title?.toLowerCase().includes(searchTerm);
        const descriptionMatch = post.description?.toLowerCase().includes(searchTerm);
        const tagsMatch = post.tags?.toLowerCase().includes(searchTerm);
        
        if (!titleMatch && !descriptionMatch && !tagsMatch) {
          matches = false;
        }
      }

      return matches;
    });

    // Sort posts
    filteredPosts.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'title':
          aValue = a.title?.toLowerCase() || '';
          bValue = b.title?.toLowerCase() || '';
          break;
        case 'category':
          aValue = a.category?.toLowerCase() || '';
          bValue = b.category?.toLowerCase() || '';
          break;
        case 'date':
        default:
          aValue = new Date(a.date || 0);
          bValue = new Date(b.date || 0);
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    // Calculate pagination
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const total = filteredPosts.length;
    const totalPages = Math.ceil(total / limitNumber);
    const startIndex = (pageNumber - 1) * limitNumber;
    const endIndex = startIndex + limitNumber;

    // Get paginated results
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

    // Enhance posts with additional metadata
    const enhancedPosts = paginatedPosts.map(post => ({
      ...post,
      // Ensure required fields exist
      slug: post.slug || '',
      title: post.title || 'Untitled',
      description: post.description || '',
      image: post.image || 'https://www.jonathanmwaniki.co.ke/images/Jonathan-Mwaniki-logo.png',
      date: post.date || new Date().toISOString(),
      category: post.category || 'Uncategorized',
      tags: post.tags || '',
      // Add computed fields
      url: `https://www.jonathanmwaniki.co.ke/content/articles/${post.slug}.html`,
      excerpt: post.description ? 
        (post.description.length > 160 ? 
          post.description.substring(0, 160) + '...' : 
          post.description) : '',
      readingTime: estimateReadingTime(post.description || ''),
      isRecent: isRecentPost(post.date),
    }));

    // Prepare response
    const response = {
      posts: enhancedPosts,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages,
        hasNext: pageNumber < totalPages,
        hasPrev: pageNumber > 1,
        nextPage: pageNumber < totalPages ? pageNumber + 1 : null,
        prevPage: pageNumber > 1 ? pageNumber - 1 : null,
      },
      filters: {
        category: category || null,
        tag: tag || null,
        search: search || null,
        sortBy,
        sortOrder
      },
      meta: {
        totalPosts: metadata.length,
        filteredPosts: total,
        categories: getUniqueCategories(metadata),
        tags: getUniqueTags(metadata),
        timestamp: new Date().toISOString(),
      }
    };

    // Cache headers for better performance
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in fetch-posts handler:', error);
    
    return res.status(500).json({
      error: 'Failed to fetch posts',
      message: error.message,
      posts: [],
      pagination: {
        page: 1,
        limit: parseInt(req.query.limit || 50),
        total: 0,
        totalPages: 0
      }
    });
  }
}

// Helper function to estimate reading time
function estimateReadingTime(text) {
  if (!text) return 1;
  
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  
  return Math.max(1, readingTime);
}

// Helper function to check if post is recent (within last 7 days)
function isRecentPost(dateString) {
  if (!dateString) return false;
  
  const postDate = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - postDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays <= 7;
}

// Helper function to get unique categories
function getUniqueCategories(posts) {
  const categories = posts
    .map(post => post.category)
    .filter(Boolean)
    .filter((category, index, arr) => arr.indexOf(category) === index)
    .sort();
  
  return categories;
}

// Helper function to get unique tags
function getUniqueTags(posts) {
  const allTags = posts
    .map(post => post.tags)
    .filter(Boolean)
    .flatMap(tags => tags.split(',').map(tag => tag.trim()))
    .filter(Boolean)
    .filter((tag, index, arr) => arr.indexOf(tag) === index)
    .sort();
  
  return allTags;
}