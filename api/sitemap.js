import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    
    // 1. Fetch posts from GitHub
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'content/articles.json',
    });
    const posts = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));

    // 2. Generate sitemap XML
    const baseUrl = 'https://jonathanmwaniki.co.ke';
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages -->
  <url>
    <loc>${baseUrl}</loc>
    <priority>1.0</priority>
  </url>
  
  <!-- Dynamic Articles -->
  ${posts.map(post => `
    <url>
      <loc>${baseUrl}/articles/${post.slug}</loc>
      <lastmod>${new Date(post.date).toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
    </url>
  `).join('')}
</urlset>`;

    // 3. Send response
    res.setHeader('Content-Type', 'text/xml');
    res.send(sitemap);

  } catch (error) {
    console.error('Sitemap Error:', error);
    res.status(500).send(`
      <error>
        <message>Sitemap generation failed</message>
        <details>${error.message}</details>
      </error>
    `);
  }
}