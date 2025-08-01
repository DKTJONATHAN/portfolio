import fs from 'fs';
import path from 'path';
import { getPostsMetadata } from './list-posts';

export default async function handler(req, res) {
  try {
    // 1. Get current articles from list-posts.js
    const { data: posts } = await getPostsMetadata();
    
    // 2. Read existing sitemap
    const sitemapPath = path.join(process.cwd(), 'public/sitemap.xml');
    let sitemap = fs.existsSync(sitemapPath) 
      ? fs.readFileSync(sitemapPath, 'utf8') 
      : `<?xml version="1.0" encoding="UTF-8"?>
         <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;

    // 3. Extract existing URLs
    const existingUrls = new Set();
    sitemap.replace(/<loc>(.*?)<\/loc>/g, (_, url) => existingUrls.add(url));

    // 4. Generate new article URLs
    const baseUrl = 'https://jonathanmwaniki.co.ke';
    const newArticleUrls = posts
      .filter(post => !existingUrls.has(`${baseUrl}/articles/${post.slug}`))
      .map(post => `
        <url>
          <loc>${baseUrl}/articles/${post.slug}</loc>
          <lastmod>${new Date(post.date).toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
        </url>
      `).join('');

    // 5. Insert new URLs while preserving existing content
    const updatedSitemap = sitemap.replace(
      '</urlset>',
      `${newArticleUrls}</urlset>`
    );

    // 6. Save changes
    fs.writeFileSync(sitemapPath, updatedSitemap);
    
    // 7. Return the updated sitemap
    res.setHeader('Content-Type', 'text/xml');
    res.send(updatedSitemap);

  } catch (error) {
    console.error('Sitemap error:', error);
    res.status(500).send('Error updating sitemap');
  }
}