import { Octokit } from '@octokit/rest';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'content/articles.json',
    });

    const posts = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
    const baseUrl = 'https://jonathanmwaniki.co.ke';

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${posts.map(post => `
    <url>
      <loc>${baseUrl}/articles/${post.slug}</loc>
      <lastmod>${new Date(post.date).toISOString()}</lastmod>
    </url>
  `).join('')}
</urlset>`;

    return new Response(sitemap, {
      headers: { 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    return new Response(`<error>${error.message}</error>`, {
      status: 500,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}