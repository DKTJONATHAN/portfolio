// netlify/functions/github-update.js
const { Octokit } = require("@octokit/core");

// Initialize Octokit outside handler for better performance
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  userAgent: "Netlify-GitHub-Forms/2.0"
});

// Constants for GitHub API
const REPO_CONFIG = {
  owner: process.env.GITHUB_OWNER,
  repo: process.env.GITHUB_REPO,
  path: "data/forms.json",
  branch: process.env.GITHUB_BRANCH || "main"
};

exports.handler = async (event) => {
  // 1. Validate request
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // 2. Parse and validate payload
  let submission;
  try {
    submission = JSON.parse(event.body);
    if (!submission?.form_name) {
      throw new Error("Missing required field: form_name");
    }
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({
      error: "Invalid submission",
      details: error.message
    })};
  }

  // 3. Process submission
  try {
    // Get existing content
    const { data: currentFile, sha } = await getCurrentFile();
    const currentContent = currentFile ? JSON.parse(currentFile) : [];
    
    // Prepare new entry
    const newEntry = {
      ...submission,
      _metadata: {
        submitted_at: new Date().toISOString(),
        ip: event.headers["x-nf-client-connection-ip"] || null,
        netlify_id: event.headers["x-nf-request-id"] || null
      }
    };

    // Update and commit
    const commit = await updateFile(
      [...currentContent, newEntry],
      sha
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        commit_url: commit.data.commit.html_url
      })
    };

  } catch (error) {
    console.error("Submission failed:", error);
    return {
      statusCode: error.status || 500,
      body: JSON.stringify({
        error: "Failed to process submission",
        details: error.response?.data?.message || error.message
      })
    };
  }
};

// Helper functions
async function getCurrentFile() {
  try {
    const { data } = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      REPO_CONFIG
    );
    return {
      data: Buffer.from(data.content, "base64").toString(),
      sha: data.sha
    };
  } catch (error) {
    if (error.status === 404) return {}; // File doesn't exist yet
    throw error;
  }
}

async function updateFile(content, sha) {
  return octokit.request(
    "PUT /repos/{owner}/{repo}/contents/{path}",
    {
      ...REPO_CONFIG,
      message: `Form submission: ${new Date().toISOString()}`,
      content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
      sha: sha
    }
  );
      }
