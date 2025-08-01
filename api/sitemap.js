import fs from 'fs';
import path from 'path';
import { getPostsMetadata } from './list-posts';

export default async function handler(req, res) {
  try {
    // 1. Get ALL posts from your working list-posts.js
    const { data: posts } = await getPostsMetadata();
    const baseUrl = 'https://jonathanmwaniki.co.ke';

    // 2. Generate ALL article URLs (no checks, no filters)
    const articleUrls = posts.map(post => `
      <url>
        <loc>${baseUrl}/articles/${post.slug}</loc>
        <lastmod>${new Date(post.date).toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>
    `).join('');

    // 3. Create fresh sitemap skeleton
    const staticPages = [
      { url: '/', priority: '1.0' },
      { url: '/about', priority: '0.7' },
      { url: '/contact', priority: '0.5' }
    ].map(page => `
      <url>
        <loc>${baseUrl}${page.url}</loc>
        <priority>${page.priority}</priority>
      </url>
    `).join('');

    // 4. Combine ALL content
    const fullSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages}
  ${articleUrls}
</urlset>`;

    // 5. Overwrite sitemap.xml
    fs.writeFileSync(
      path.join(process.cwd(), 'public/sitemap.xml'),
      fullSitemap
    );

    // 6. Return the new sitemap
    res.setHeader('Content-Type', 'text/xml');
    res.send(fullSitemap);

  } catch (error) {
    console.error('Sitemap generation failed:', error);
    res.status(500).send('Internal Server Error');
  }
}