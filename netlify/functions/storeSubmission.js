const axios = require('axios');

exports.handler = async (event, context) => {
  try {
    // Parse form data
    const formData = JSON.parse(event.body);
    const newSubmission = {
      ...formData,
      timestamp: new Date().toISOString(),
    };

    // GitHub API setup
    const GITHUB_REPO = process.env.GITHUB_REPO; // "DKTJONATHAN/Portfolio"
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const FILE_PATH = "data/forms.json"; // Path in your repo
    const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`;

    // 1. Fetch current file content from GitHub
    const { data: fileData } = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    // 2. Decode and update the file
    const currentContent = Buffer.from(fileData.content, 'base64').toString('utf8');
    const submissions = currentContent ? JSON.parse(currentContent) : [];
    submissions.push(newSubmission);

    // 3. Push updated file back to GitHub
    await axios.put(
      API_URL,
      {
        message: "Update forms.json with new submission",
        content: Buffer.from(JSON.stringify(submissions, null, 2)).toString('base64'),
        sha: fileData.sha, // Required to update existing file
      },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Submission saved to GitHub!" }),
    };
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to save submission." }),
    };
  }
};