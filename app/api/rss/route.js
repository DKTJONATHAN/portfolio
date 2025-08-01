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

    // 2. Generate RSS feed
    const baseUrl = 'https://jonathanmwaniki.co.ke';
    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Mwaniki Reports</title>
    <link>${baseUrl}</link>
    <description>Latest news updates</description>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${posts.map(post => `
      <item>
        <title><![CDATA[${post.title}]]></title>
        <link>${baseUrl}/articles/${post.slug}</link>
        <guid>${baseUrl}/articles/${post.slug}</guid>
        <pubDate>${new Date(post.date).toUTCString()}</pubDate>
        <description><![CDATA[${post.description || 'Read full article'}]]></description>
        ${post.image ? `
        <enclosure url="${post.image}" type="image/${post.image.endsWith('.png') ? 'png' : 'jpeg'}" />
        ` : ''}
      </item>
    `).join('')}
  </channel>
</rss>`;

    // 3. Return response
    return new Response(rssFeed, {
      headers: { 'Content-Type': 'application/rss+xml' },
    });

  } catch (error) {
    console.error('RSS Error:', error);
    return new Response(`
      <error>
        <message>RSS generation failed</message>
        <details>${error.message}</details>
      </error>
    `, {
      status: 500,
      headers: { 'Content-Type': 'application/rss+xml' },
    });
  }
}