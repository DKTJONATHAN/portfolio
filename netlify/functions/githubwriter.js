const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
  // 1. Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  // 2. Parse and validate input
  let payload;
  try {
    payload = JSON.parse(event.body);
    if (!payload?.formType || !payload?.data) {
      throw new Error("Missing formType or data");
    }
  } catch (err) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid JSON input", details: err.message })
    };
  }

  // 3. Initialize GitHub with your token (from Netlify env vars)
  const octokit = new Octokit({
    auth: process.env.GITHUB_ACCESS_TOKEN
  });

  // 4. Your repository details
  const owner = "DKTJONATHAN";
  const repo = "portfolio";
  const path = "data/forms.json"; 
  const branch = "main";

  try {
    // 5. Get existing file or initialize new array
    let existingContent = [];
    let sha = null;
    
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path, ref: branch });
      existingContent = JSON.parse(Buffer.from(data.content, "base64").toString());
      sha = data.sha;
    } catch (error) {
      if (error.status !== 404) throw error; // Ignore "file not found"
    }

    // 6. Add new submission with timestamp
    existingContent.push({
      ...payload.data,
      formType: payload.formType,
      timestamp: new Date().toISOString()
    });

    // 7. Write to GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `New ${payload.formType} submission`,
      content: Buffer.from(JSON.stringify(existingContent, null, 2)).toString("base64"),
      sha,
      branch
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error("GitHub Error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Failed to save data",
        details: error.message
      })
    };
  }
};