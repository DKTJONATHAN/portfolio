// news-website/pages/api/sitemap.js
import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'content/articles.json',
    });

    const metadata = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://jonathanmwaniki.co.ke/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://jonathanmwaniki.co.ke/about</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://jonathanmwaniki.co.ke/contact</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  ${metadata
    .map(post => `
      <url>
        <loc>https://jonathanmwaniki.co.ke/articles/${post.slug}</loc>
        <lastmod>${post.date}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
      </url>
    `).join('')}
</urlset>`;

    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({
      error: 'Failed to generate sitemap',
      details: error.message
    });
  }
}