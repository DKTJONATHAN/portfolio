// netlify/functions/github-update.js
const { Octokit } = require("@octokit/core");

// Reusable Octokit instance (better performance)
const octokit = new Octokit({ 
  auth: process.env.GITHUB_ACCESS_TOKEN,
  userAgent: "Netlify-Portfolio/1.0"
});

// Repository configuration
const REPO_CONFIG = {
  owner: "DKTJONATHAN",
  repo: "portfolio",
  path: "data/forms.json",
  branch: "main"
};

exports.handler = async (event) => {
  // 1. Request Validation
  if (event.httpMethod !== "POST") {
    return formatResponse(405, { error: "Method Not Allowed" });
  }

  // 2. Payload Processing
  let payload;
  try {
    payload = parsePayload(event.body);
    validatePayload(payload);
  } catch (err) {
    return formatResponse(400, { 
      error: "Invalid request", 
      details: err.message 
    });
  }

  // 3. Data Processing
  try {
    const { content, sha } = await getCurrentContent();
    const updatedContent = prepareUpdatedContent(content, payload, sha);
    
    await commitChanges(updatedContent, payload.formType);

    return formatResponse(200, { success: true });

  } catch (error) {
    console.error("Processing Error:", error);
    return formatResponse(error.status || 500, {
      error: "Failed to process request",
      details: error.response?.data?.message || error.message
    });
  }
};

// Helper Functions
function formatResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

function parsePayload(body) {
  if (!body) throw new Error("Empty request body");
  return JSON.parse(body);
}

function validatePayload(payload) {
  if (!payload?.formType) throw new Error("Missing formType");
  if (!payload?.data) throw new Error("Missing data");
}

async function getCurrentContent() {
  try {
    const { data } = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      { ...REPO_CONFIG, ref: REPO_CONFIG.branch }
    );
    return {
      content: JSON.parse(Buffer.from(data.content, "base64").toString()),
      sha: data.sha
    };
  } catch (error) {
    if (error.status === 404) return { content: [], sha: null };
    throw error;
  }
}

function prepareUpdatedContent(currentContent, payload, sha) {
  return {
    content: [
      ...currentContent,
      {
        ...payload.data,
        formType: payload.formType,
        _metadata: {
          submitted_at: new Date().toISOString(),
          ip: event.headers["x-nf-client-connection-ip"],
          request_id: event.headers["x-nf-request-id"]
        }
      }
    ],
    sha
  };
}

async function commitChanges(content, formType) {
  await octokit.request(
    "PUT /repos/{owner}/{repo}/contents/{path}",
    {
      ...REPO_CONFIG,
      message: `New ${formType} submission via Netlify`,
      content: Buffer.from(JSON.stringify(content.content, null, 2)).toString("base64"),
      sha: content.sha
    }
  );
}
