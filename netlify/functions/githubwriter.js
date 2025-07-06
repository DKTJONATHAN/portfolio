const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
  // 1. Force JSON response headers
  const headers = { 'Content-Type': 'application/json' };

  // 2. Validate POST method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Only POST requests allowed' })
    };
  }

  // 3. Parse JSON body safely
  let payload;
  try {
    payload = JSON.parse(event.body);
    if (!payload.formType || !payload.data) {
      throw new Error('Missing formType or data');
    }
  } catch (err) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid JSON data' })
    };
  }

  try {
    // 4. Initialize GitHub
    const octokit = new Octokit({
      auth: process.env.GITHUB_ACCESS_TOKEN
    });

    // 5. Define repo details (YOUR REPO)
    const owner = "DKTJONATHAN";
    const repo = "portfolio";
    const path = "data/forms.json";
    const branch = "main";

    // 6. Get existing data (or create new)
    let existingData = [];
    let sha = null;
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path, ref: branch });
      existingData = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
      sha = data.sha;
    } catch (err) {
      if (err.status !== 404) throw err; // Ignore "file not found"
    }

    // 7. Add new submission
    existingData.push({
      ...payload.data,
      formType: payload.formType,
      timestamp: new Date().toISOString()
    });

    // 8. Save to GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `New ${payload.formType} submission`,
      content: Buffer.from(JSON.stringify(existingData, null, 2)).toString('base64'),
      sha,
      branch
    });

    // 9. Return success
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    console.error('GitHub Error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to save data',
        details: err.message 
      })
    };
  }
};