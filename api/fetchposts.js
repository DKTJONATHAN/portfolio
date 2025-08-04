import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    // 1. Read data
    const articles = await readArticles();
    
    // 2. Process query params
    const { category, search } = req.query;
    let filtered = [...articles];

    if (category) {
      filtered = filtered.filter(a => 
        a.category?.toLowerCase() === category.toLowerCase()
      );
    }

    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(a =>
        a.title?.toLowerCase().includes(term) ||
        a.description?.toLowerCase().includes(term)
      );
    }

    // 3. Return results
    res.status(200).json({
      posts: filtered,
      total: filtered.length
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: error.message,
      triedPaths: [
        '/content/articles.json',
        './content/articles.json',
        path.join(process.cwd(), 'content', 'articles.json')
      ]
    });
  }
}

// Path resolver (from above)
async function readArticles() {
  // ... (use the implementation above)
}