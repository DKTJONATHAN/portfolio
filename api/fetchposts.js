import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  try {
    const octokit = new Octokit({ 
      auth: process.env.GITHUB_TOKEN 
    });

    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'content/articles.json',
      headers: {
        'Accept': 'application/vnd.github.v3.raw'
      }
    });

    const metadata = JSON.parse(data);
    
    return res.status(200).json({
      posts: metadata,
      message: "Successfully fetched posts"
    });

  } catch (error) {
    console.error('Fetch Error:', error);
    return res.status(500).json({
      error: error.message,
      details: "Failed to fetch posts"
    });
  }
}