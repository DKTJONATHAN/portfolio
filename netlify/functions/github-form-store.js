// /netlify/functions/github-form-store.js
const { Octokit } = require('@octokit/rest');

exports.handler = async function(event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse form data
    const formData = JSON.parse(event.body);
    
    // GitHub configuration
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const owner = 'your-github-username'; // CHANGE THIS
    const repo = 'your-repo-name'; // CHANGE THIS
    const branch = 'main'; // CHANGE IF USING DIFFERENT BRANCH
    const filePath = 'data/submissions.json'; // File path in your repo
    
    // 1. Get existing file data (if exists)
    let existingData = [];
    let sha;
    
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: branch
      });
      sha = data.sha;
      existingData = JSON.parse(Buffer.from(data.content, 'base64').toString());
    } catch (error) {
      if (error.status !== 404) throw error;
    }
    
    // 2. Add new submission
    existingData.push(formData);
    
    // 3. Update file on GitHub
    const { data: updateResponse } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: `New submission from ${formData.name}`,
      content: Buffer.from(JSON.stringify(existingData, null, 2)).toString('base64'),
      sha,
      branch,
      committer: {
        name: 'Website Form Bot',
        email: 'forms@example.com'
      }
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        commitUrl: updateResponse.commit.html_url
      })
    };
    
  } catch (error) {
    console.error('GitHub storage error:', error);
    return {
      statusCode: error.status || 500,
      body: JSON.stringify({ 
        error: error.message,
        details: error.response?.data?.message || 'Unknown error'
      })
    };
  }
};
