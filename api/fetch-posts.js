import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const metadataPath = 'content/articles.json';

    // Get query parameters
    const { page = 1, limit = 10, category = '', search = '', sort = 'newest' } = req.query;

    // Fetch metadata from GitHub
    let metadata = [];
    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: metadataPath,
        headers: {
          'Accept': 'application/vnd.github.v3.raw' // Get raw JSON
        }
      });
      
      // If using getContent with raw header, data is already parsed
      metadata = typeof data === 'string' ? JSON.parse(data) : data;
      
    } catch (error) {
      console.error('Error fetching articles:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch posts',
        details: error.message 
      });
    }

    // Filter and sort logic
    let filteredPosts = [...metadata];
    
    if (category) {
      filteredPosts = filteredPosts.filter(post => 
        post.category?.toLowerCase() === category.toLowerCase()
      );
    }

    if (search) {
      const searchTerm = search.toLowerCase();
      filteredPosts = filteredPosts.filter(post => 
        post.title?.toLowerCase().includes(searchTerm) || 
        post.description?.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by date
    filteredPosts.sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return sort === 'oldest' ? dateA - dateB : dateB - dateA;
    });

    // Pagination
    const totalPosts = filteredPosts.length;
    const totalPages = Math.ceil(totalPosts / limit);
    const currentPage = Math.min(Math.max(parseInt(page), 1), totalPages);
    const startIndex = (currentPage - 1) * limit;
    const paginatedPosts = filteredPosts.slice(startIndex, startIndex + parseInt(limit));

    return res.status(200).json({
      posts: paginatedPosts.map(post => ({
        title: post.title,
        description: post.description,
        image: post.image || '/images/Jonathan-Mwaniki-logo.png',
        date: post.date,
        category: post.category,
        tags: post.tags,
        slug: post.slug,
        url: `/content/articles/${post.slug}.html`
      })),
      totalPosts,
      totalPages,
      currentPage
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}