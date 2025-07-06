// netlify/functions/github-update.js
const { Octokit } = require("@octokit/rest");

exports.handler = async (event, context) => {
  // 1. Verify the request method
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  // 2. Safely parse the incoming data
  let submission;
  try {
    if (!event.body) {
      throw new Error("Empty request body");
    }
    submission = JSON.parse(event.body);
    
    // Validate required fields
    if (!submission.form_name) {
      throw new Error("Missing form_name in submission");
    }
  } catch (parseError) {
    console.error("JSON parse error:", parseError);
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Invalid form data",
        details: parseError.message
      })
    };
  }

  // 3. Initialize GitHub client
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
    userAgent: "Netlify-GitHub-Forms/1.0"
  });

  try {
    // 4. Get existing file or initialize new
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
    } catch (repoError) {
      if (repoError.status !== 404) throw repoError;
      console.log("forms.json not found, will create new file");
    }

    // 5. Prepare new content
    const newEntry = {
      ...submission,
      _metadata: {
        submitted_at: new Date().toISOString(),
        ip: event.headers["client-ip"] || null,
        user_agent: event.headers["user-agent"] || null
      }
    };

    const updatedContent = [...currentContent, newEntry];

    // 6. Commit to GitHub
    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: "data/forms.json",
      message: `New ${submission.form_name} submission`,
      content: Buffer.from(JSON.stringify(updatedContent, null, 2)).toString("base64"),
      sha: fileSha
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Form submission saved",
        commit_url: data.commit.html_url
      })
    };

  } catch (error) {
    console.error("GitHub API error:", error);
    return {
      statusCode: error.status || 500,
      body: JSON.stringify({
        error: "Failed to save submission",
        details: error.message
      })
    };
  }
};