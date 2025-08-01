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
        <title>${post.title}</title>
        <link>${baseUrl}/articles/${post.slug}</link>
        <guid>${baseUrl}/articles/${post.slug}</guid>
        <pubDate>${new Date(post.date).toUTCString()}</pubDate>
        <description>${post.description || 'Read full article'}</description>
        ${post.image ? `<enclosure url="${post.image}" type="image/jpeg"/>` : ''}
      </item>
    `).join('')}
  </channel>
</rss>`;

    // 3. Send response
    res.setHeader('Content-Type', 'application/rss+xml');
    res.send(rssFeed);

  } catch (error) {
    console.error('RSS Error:', error);
    res.status(500).send(`
      <error>
        <message>RSS generation failed</message>
        <details>${error.message}</details>
      </error>
    `);
  }
}