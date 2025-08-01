import { promises as fs } from 'fs';
import path from 'path';
import { getPostsMetadata } from './list-posts';

export default async function handler(req, res) {
  try {
    const { data: posts } = await getPostsMetadata();
    const baseUrl = 'https://jonathanmwaniki.co.ke';
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${posts.map(post => `
    <url>
      <loc>${baseUrl}/articles/${post.slug}</loc>
      <lastmod>${new Date(post.date).toISOString()}</lastmod>
    </url>
  `).join('')}
</urlset>`;

    // Write file
    await fs.writeFile(sitemapPath, xml);
    
    // Return response
    res.setHeader('Content-Type', 'text/xml');
    res.send(xml);

  } catch (error) {
    console.error('CRITICAL ERROR:', error);
    res.status(500).send(`Sitemap generation failed: ${error.message}`);
  }
}