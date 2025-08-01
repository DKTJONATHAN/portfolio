// pages/api/sitemap.js
import { getPostsMetadata } from './list-posts'; // Reuse your existing logic

export default async function handler(req, res) {
  try {
    // Reuse your post filtering logic from list-posts.js
    const { data: posts } = await getPostsMetadata();
    
    // Get base URL dynamically
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.SITE_URL || 'https://yourdomain.com';

    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Dynamic Posts -->
  ${posts.map(post => `
    <url>
      <loc>${baseUrl}/articles/${post.slug}</loc>
      <lastmod>${new Date(post.date).toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>${post.category === 'Breaking News' ? 0.9 : 0.7}</priority>
    </url>
  `).join('')}
  
  <!-- Static Pages -->
  <url>
    <loc>${baseUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;

    res.setHeader('Content-Type', 'text/xml');
    res.write(sitemap);
    res.end();

  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).end();
  }
}