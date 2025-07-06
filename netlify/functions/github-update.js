const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
  try {
    const formData = JSON.parse(event.body);
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    // Get current file
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: "data/forms.json",
    });

    // Update file
    const content = Buffer.from(data.content, "base64").toString();
    const submissions = JSON.parse(content);
    submissions.push({ ...formData, date: new Date().toISOString() });

    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: "data/forms.json",
      message: `New form submission: ${formData.name || "Anonymous"}`,
      content: Buffer.from(JSON.stringify(submissions, null, 2)).toString("base64"),
      sha: data.sha,
    });

    return { statusCode: 200, body: "Success!" };
  } catch (error) {
    return { statusCode: 500, body: "Error saving to GitHub." };
  }
};