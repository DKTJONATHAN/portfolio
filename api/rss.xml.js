import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    
    // 1. Fetch posts
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'content/articles.json',
    });
    const posts = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));

    // 2. Generate basic RSS
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Mwaniki Reports</title>
  <link>https://jonathanmwaniki.co.ke</link>
  ${posts.slice(0, 10).map(post => `
    <item>
      <title>${post.title}</title>
      <link>https://jonathanmwaniki.co.ke/articles/${post.slug}</link>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    </item>
  `).join('')}
</channel>
</rss>`;

    res.setHeader('Content-Type', 'text/xml');
    res.send(rss);

  } catch (error) {
    console.error('RSS Error:', error);
    res.status(500).send(`<error>${error.message}</error>`);
  }
}