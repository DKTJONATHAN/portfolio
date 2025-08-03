import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ error: 'Slug is required' });
  }

  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: `content/articles/${slug}.html`,
    });

    const content = Buffer.from(data.content, 'base64').toString('utf-8');

    return res.status(200).json({
      content,
      error: null
    });

  } catch (error) {
    console.error('Error fetching article content:', error);
    return res.status(500).json({
      error: 'Failed to fetch article content',
      details: error.message
    });
  }
}