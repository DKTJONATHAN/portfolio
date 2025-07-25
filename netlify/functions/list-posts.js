const { Octokit } = require("@octokit/rest");

exports.handler = async function () {
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    // List all files in the /content/articles directory
    const { data: files } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: "content/articles",
    });

    const posts = await Promise.all(
      files
        .filter((file) => file.name.endsWith(".html"))
        .map(async (file) => {
          // Get file content
          const { data } = await octokit.repos.getContent({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path: file.path,
          });

          // Decode base64 content
          const content = Buffer.from(data.content, "base64").toString("utf-8");

          // Extract metadata and content (assuming HTML structure)
          const titleMatch = content.match(/<h1>(.*?)<\/h1>/i);
          const dateMatch = content.match(/<p>(\d{4}-\d{2}-\d{2})\s*•\s*(.*?)</i);
          const descriptionMatch = content.match(/<p>(.*?)</p>\s*(?=<div class="tags"|$)/i);
          const tagsMatch = content.match(/<div class="tags">(.*?)<\/div>/i);
          const imageMatch = content.match(/<img src="(.*?)" alt=".*?"/i);
          const contentStart = content.indexOf("<main>") + 6;
          const contentEnd = content.indexOf("</main>");
          const postContent = content.slice(contentStart, contentEnd).trim();

          return {
            slug: file.name.replace(".html", ""),
            title: titleMatch ? titleMatch[1] : "Untitled",
            date: dateMatch ? dateMatch[1] : "",
            category: dateMatch ? dateMatch[2] : "Uncategorized",
            description: descriptionMatch ? descriptionMatch[1] : "",
            tags: tagsMatch
              ? tagsMatch[1]
                  .match(/<span class="tag">(.*?)<\/span>/g)
                  ?.map((tag) => tag.match(/<span class="tag">(.*?)<\/span>/)[1])
                  .join(",")
              : "",
            image: imageMatch ? imageMatch[1] : "",
            content: postContent,
          };
        })
    );

    return {
      statusCode: 200,
      body: JSON.stringify(posts),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Failed to list posts: ${error.message}` }),
    };
  }
};