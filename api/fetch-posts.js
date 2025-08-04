// fetch-posts.js - API endpoint to fetch posts from GitHub repository

import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const metadataPath = 'content/articles.json';

    // Get query parameters
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
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: metadataPath,
      });
      metadata = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
    } catch (error) {
      console.error('Error fetching articles metadata:', error);
      if (error.status === 404) {
        return res.status(200).json({ 
          posts: [], 
          totalPosts: 0,
          totalPages: 0,
          currentPage: 1
        });
      }
      return res.status(500).json({ error: 'Failed to fetch posts metadata' });
    }

    // Filter posts based on query parameters
    let filteredPosts = metadata.map(post => {
      // Ensure all posts have required fields with fallbacks
      return {
        ...post,
        title: post.title || 'Untitled Post',
        description: post.description || '',
        image: post.image || 'https://www.jonathanmwaniki.co.ke/images/Jonathan-Mwaniki-logo.png',
        date: post.date || new Date().toISOString(),
        category: post.category || 'Uncategorized',
        tags: post.tags || '',
        slug: post.slug || ''
      };
    });

    // Apply category filter
    if (category) {
      filteredPosts = filteredPosts.filter(post => 
        post.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Apply tag filter
    if (tag) {
      filteredPosts = filteredPosts.filter(post => 
        post.tags && post.tags.toLowerCase().includes(tag.toLowerCase())
      );
    }

    // Apply search filter
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredPosts = filteredPosts.filter(post => 
        post.title.toLowerCase().includes(searchTerm) || 
        (post.description && post.description.toLowerCase().includes(searchTerm)) ||
        (post.tags && post.tags.toLowerCase().includes(searchTerm))
      );
    }

    // Sort posts
    if (sort === 'newest') {
      filteredPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sort === 'oldest') {
      filteredPosts.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // Pagination logic
    const totalPosts = filteredPosts.length;
    const totalPages = Math.ceil(totalPosts / limit);
    const currentPage = Math.min(Math.max(parseInt(page), totalPages);
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

    // Format response
    const response = {
      posts: paginatedPosts.map(post => ({
        title: post.title,
        description: post.description,
        image: post.image,
        date: post.date,
        category: post.category,
        tags: post.tags,
        slug: post.slug,
        url: `https://www.jonathanmwaniki.co.ke/content/articles/${post.slug}.html`
      })),
      totalPosts,
      totalPages,
      currentPage
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error in fetch-posts handler:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}