const { Octokit } = require("@octokit/rest");

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const { token, slug } = JSON.parse(event.body);
  if (token !== Buffer.from(process.env.ADMIN_PASSWORD).toString("base64")) {
    return { statusCode: 403, body: JSON.stringify({ error: "Unauthorized" }) };
  }
  if (!slug) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing slug" }) };
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = "DKTJONATHAN";
  const repo = "portfolio";
  const path = `content/blog/${slug}.md`;
  const branch = "main";

  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path, ref: branch });
    await octokit.repos.deleteFile({
      owner,
      repo,
      path,
      message: `Delete post: ${slug}`,
      sha: data.sha,
      branch,
    });
    return { statusCode: 200, body: JSON.stringify({ message: "Post deleted" }) };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Failed to delete post: ${error.message}` }),
    };
  }
};