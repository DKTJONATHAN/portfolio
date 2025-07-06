// netlify/functions/github-update.js
const { Octokit } = require("@octokit/rest");

exports.handler = async (event, context) => {
  // Only process POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    // Parse the form submission data
    const submission = JSON.parse(event.body);
    
    // Initialize GitHub client
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
      userAgent: "Netlify Forms to GitHub v1.0"
    });

    // 1. Get current file content
    let currentContent = [];
    let fileSha = null;
    
    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: "data/forms.json",
      });
      
      currentContent = JSON.parse(Buffer.from(data.content, "base64").toString());
      fileSha = data.sha;
    } catch (error) {
      // If file doesn't exist yet, we'll create it
      if (error.status !== 404) throw error;
    }

    // 2. Add new submission
    const updatedContent = [
      ...currentContent,
      {
        ...submission,
        ip_address: event.headers["client-ip"] || null,
        user_agent: event.headers["user-agent"] || null
      }
    ];

    // 3. Commit to GitHub
    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: "data/forms.json",
      message: `New ${submission.form_name} submission from ${submission.email || "anonymous"}`,
      content: Buffer.from(JSON.stringify(updatedContent, null, 2)).toString("base64"),
      sha: fileSha, // Required for updates, null for new files
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Saved to GitHub",
        commit_url: data.commit.html_url
      })
    };

  } catch (error) {
    console.error("GitHub save error:", error);
    return {
      statusCode: error.status || 500,
      body: JSON.stringify({
        error: "Failed to save to GitHub",
        details: error.message
      })
    };
  }
};