import { promises as fs } from 'fs';
import path from 'path';
import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  try {
    // 1. Fetch live posts from GitHub
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'content/articles.json',
    });
    const posts = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));

    // 2. Generate XML
    const baseUrl = 'https://jonathanmwaniki.co.ke';
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <priority>1.0</priority>
  </url>
  
  <!-- Articles -->
  ${posts.map(post => `
    <url>
      <loc>${baseUrl}/articles/${post.slug}</loc>
      <lastmod>${new Date(post.date).toISOString()}</lastmod>
    </url>
  `).join('')}
</urlset>`;

    // 3. Write to file (with error handling)
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    try {
      await fs.writeFile(sitemapPath, sitemapContent);
      console.log('Successfully updated sitemap.xml');
    } catch (writeError) {
      console.error('Filesystem write failed, streaming instead...', writeError);
    }

    // 4. Always return the XML (even if file write failed)
    res.setHeader('Content-Type', 'text/xml');
    res.send(sitemapContent);

  } catch (error) {
    console.error('Sitemap generation failed:', error);
    res.status(500).send(`<error>${error.message}</error>`);
  }
}