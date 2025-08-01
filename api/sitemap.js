import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    
    // Fetch metadata (reusing your existing logic)
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'content/articles.json',
    });
    
    const metadata = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
    
    // Filter valid posts (same as your list-posts.js)
    const allowedCategories = ['News', 'Breaking News', 'Opinions', 'Business', 'Sports', 'Tech', 'Entertainment'];
    const validPosts = metadata.filter(post => 
      post?.slug && post?.title && post?.date && allowedCategories.includes(post?.category)
    );
    
    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${validPosts.map(post => `
    <url>
      <loc>https://yourdomain.com/articles/${post.slug}</loc>
      <lastmod>${new Date(post.date).toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>
  `).join('')}
  <!-- Include other important pages -->
  <url>
    <loc>https://yourdomain.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    
    // Set response headers
    res.setHeader('Content-Type', 'text/xml');
    res.write(sitemap);
    res.end();
    
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).end();
  }
}