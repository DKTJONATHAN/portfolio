const { Octokit } = require("@octokit/rest");

exports.handler = async (event, context) => {
  // 1. Verify the request is POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Only POST requests allowed" })
    };
  }

  // 2. Parse the body safely
  let payload;
  try {
    payload = JSON.parse(event.body);
    if (!payload.formType || !payload.data) {
      throw new Error("Missing formType or data in payload");
    }
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON input", details: err.message })
    };
  }

  // 3. Initialize GitHub client
  const octokit = new Octokit({
    auth: process.env.GITHUB_ACCESS_TOKEN
  });

  // 4. Set repository details - using your actual repo
  const owner = "DKTJONATHAN";
  const repo = "portfolio";
  const path = "data/forms.json";
  const branch = "main";

  try {
    // 5. Check for existing file
    let existingContent = [];
    let sha = null;
    
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch
      });
      const content = Buffer.from(data.content, "base64").toString("utf8");
      existingContent = content ? JSON.parse(content) : [];
      sha = data.sha;
    } catch (error) {
      if (error.status !== 404) throw error;
    }

    // 6. Add new submission
    existingContent.push({
      ...payload.data,
      formType: payload.formType,
      timestamp: new Date().toISOString()
    });

    // 7. Update file
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
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error("GitHub Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to save to GitHub",
        details: error.message
      })
    };
  }
};