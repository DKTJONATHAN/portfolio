import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const response = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'content/articles.json',
    });
    const posts = JSON.parse(Buffer.from(response.data.content, 'base64').toString('utf-8'));
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch posts: ${error.message}` });
  }
}