const { Octokit } = require("@octokit/rest");

exports.handler = async function (event) {
  try {
    const { slug } = JSON.parse(event.body);
    if (!slug) {
      throw new Error("Slug is required");
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const filePath = `content/articles/${slug}.html`;

    // Get the file's SHA (required for deletion)
    let sha;
    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: filePath,
      });
      sha = data.sha;
    } catch (error) {
      if (error.status === 404) {
        throw new Error("Post not found");
      }
      throw error;
    }

    // Delete the file
    await octokit.repos.deleteFile({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: filePath,
      message: `Delete post: ${slug}`,
      sha,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Post deleted successfully" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Failed to delete post: ${error.message}` }),
    };
  }
};