import { promises as fs } from 'fs';
import path from 'path';
import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  try {
    // 1. Fetch posts
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'content/articles.json',
    });
    const posts = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));

    // 2. Generate RSS XML
    const baseUrl = 'https://jonathanmwaniki.co.ke';
    const rssContent = `<?xml version="1.0"?><rss ...></rss>`; // (Use full XML from previous examples)

    // 3. Write to public/rss.xml
    const filePath = path.join(process.cwd(), 'public', 'rss.xml');
    await fs.writeFile(filePath, rssContent);

    // 4. Return the XML
    res.setHeader('Content-Type', 'text/xml');
    res.send(rssContent);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
}