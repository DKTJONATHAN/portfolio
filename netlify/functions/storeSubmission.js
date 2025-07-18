const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
  try {
    // Validate request
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ 
          success: false,
          message: "Method not allowed" 
        })
      };
    }

    const formData = JSON.parse(event.body);

    // Validate form data
    if (!formData.name || !formData.email || !formData.message) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "All fields are required"
        })
      };
    }

    // Initialize GitHub client
    const octokit = new Octokit({ 
      auth: process.env.GITHUB_TOKEN,
      userAgent: "Netlify Form Handler v1.0"
    });

    const owner = process.env.GITHUB_OWNER || "DKTJONATHAN";
    const repo = process.env.GITHUB_REPO || "Portfolio";
    const path = "data/forms.json";

    // Get existing file or initialize
    let existingData = [];
    let sha = null;

    try {
      const { data: fileData } = await octokit.repos.getContent({ owner, repo, path });
      existingData = JSON.parse(Buffer.from(fileData.content, "base64").toString());
      sha = fileData.sha;
    } catch (error) {
      if (error.status !== 404) throw error;
    }

    // Add new submission
    const newSubmission = {
      id: Date.now().toString(),
      ...formData,
      timestamp: new Date().toISOString()
    };
    existingData.push(newSubmission);

    // Commit changes
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `New submission from ${formData.name}`,
      content: Buffer.from(JSON.stringify(existingData, null, 2)).toString("base64"),
      sha,
      committer: {
        name: "Netlify Bot",
        email: "netlify@bot.com"
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Thank you! Your message has been sent successfully.",
        id: newSubmission.id
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: error.message || "Failed to process your submission"
      })
    };
  }
};