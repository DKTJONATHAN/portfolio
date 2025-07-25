const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
  const { slug } = JSON.parse(event.body);
  
  if (!slug) {
    return { statusCode: 400, body: JSON.stringify({ error: "Slug is required" }) };
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const path = `content/articles/${slug}.html`;

  try {
    // First get the file to get its SHA (required for deletion)
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    
    await octokit.repos.deleteFile({
      owner,
      repo,
      path,
      message: `Delete ${slug}`,
      sha: data.sha
    });

    // Trigger Netlify rebuild
    await fetch(process.env.NETLIFY_BUILD_HOOK, { method: 'POST' });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};