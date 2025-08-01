import { Octokit } from '@octokit/rest';
import { Buffer } from 'buffer';

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

    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Mwaniki Reports</title>
  <link>${baseUrl}</link>
  <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
  ${posts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/articles/${post.slug}</link>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description><![CDATA[${post.description || ''}]]></description>
    </item>
  `).join('')}
</channel>
</rss>`;

    return new Response(rssFeed, {
      headers: { 'Content-Type': 'application/rss+xml' },
    });

  } catch (error) {
    return new Response(`<error>${error.message}</error>`, {
      status: 500,
      headers: { 'Content-Type': 'application/rss+xml' },
    });
  }
}