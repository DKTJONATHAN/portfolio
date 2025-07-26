import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        success: false,
        message: 'Method not allowed' 
      });
    }

    const formData = req.body;
    if (!formData.name || !formData.email || !formData.message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const octokit = new Octokit({ 
      auth: process.env.GITHUB_TOKEN,
      userAgent: 'Vercel Form Handler v1.0'
    });

    const owner = process.env.GITHUB_OWNER || 'DKTJONATHAN';
    const repo = process.env.GITHUB_REPO || 'portfolio';
    const path = 'data/forms.json';

    let existingData = [];
    let sha = null;

    try {
      const { data: fileData } = await octokit.repos.getContent({ owner, repo, path });
      existingData = JSON.parse(Buffer.from(fileData.content, 'base64').toString());
      sha = fileData.sha;
    } catch (error) {
      if (error.status !== 404) throw error;
    }

    const newSubmission = {
      id: Date.now().toString(),
      ...formData,
      timestamp: new Date().toISOString()
    };
    existingData.push(newSubmission);

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `New submission from ${formData.name}`,
      content: Buffer.from(JSON.stringify(existingData, null, 2)).toString('base64'),
      sha,
      committer: {
        name: 'Vercel Bot',
        email: 'vercel@bot.com'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Thank you! Your message has been sent successfully.',
      id: newSubmission.id
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process your submission'
    });
  }
}