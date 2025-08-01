import { Octokit } from '@octokit/rest';

export async function GET() {
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
  
  <!-- Articles -->
  ${posts.map(post => `
    <url>
      <loc>${baseUrl}/articles/${post.slug}</loc>
      <lastmod>${new Date(post.date).toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
    </url>
  `).join('')}
</urlset>`;

    // 3. Return response
    return new Response(sitemap, {
      headers: { 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    console.error('Sitemap Error:', error);
    return new Response(`
      <error>
        <message>Sitemap generation failed</message>
        <details>${error.message}</details>
      </error>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}