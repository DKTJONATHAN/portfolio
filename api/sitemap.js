import fs from 'fs';
import path from 'path';
import { getPostsMetadata } from './list-posts';

export default async function handler(req, res) {
  try {
    // 1. Get ALL current articles
    const { data: posts } = await getPostsMetadata();
    const baseUrl = 'https://jonathanmwaniki.co.ke';

    // 2. Generate ALL article URLs (force-add all posts)
    const allArticleUrls = posts.map(post => `
      <url>
        <loc>${baseUrl}/articles/${post.slug}</loc>
        <lastmod>${new Date(post.date).toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
      </url>
    `).join('');

    // 3. Preserve non-article URLs (Home, About, etc.)
    const sitemapPath = path.join(process.cwd(), 'public/sitemap.xml');
    let existingSitemap = '';
    
    if (fs.existsSync(sitemapPath)) {
      existingSitemap = fs.readFileSync(sitemapPath, 'utf8');
      // Remove old article URLs to avoid duplicates
      existingSitemap = existingSitemap.replace(
        /<url>\s*<loc>https:\/\/jonathanmwaniki\.co\.ke\/articles\/.*?<\/loc>.*?<\/url>/gs, 
        ''
      );
    }

    // 4. Combine old (non-article) + new (all articles)
    const updatedSitemap = existingSitemap.replace(
      '</urlset>',
      `${allArticleUrls}</urlset>`
    );

    // 5. Save
    fs.writeFileSync(sitemapPath, updatedSitemap);
    
    // 6. Return the updated sitemap
    res.setHeader('Content-Type', 'text/xml');
    res.send(updatedSitemap);

  } catch (error) {
    console.error('Sitemap error:', error);
    res.status(500).send('Error updating sitemap');
  }
}