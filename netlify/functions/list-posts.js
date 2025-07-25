const { Octokit } = require("@octokit/rest");

exports.handler = async function () {
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    // Fetch files from /content/articles
    let files = [];
    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: "content/articles",
      });
      files = Array.isArray(data) ? data.filter((item) => item.type === "file") : [];
    } catch (error) {
      if (error.status === 404) {
        console.log("Directory not found, returning empty array");
        return {
          statusCode: 200,
          body: JSON.stringify({ data: [], error: null }),
        };
      }
      throw new Error(`GitHub API error: ${error.message}`);
    }

    const results = await Promise.allSettled(
      files
        .filter((file) => file.name.endsWith(".html"))
        .map(async (file) => {
          const { data } = await octokit.repos.getContent({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path: file.path,
          });
          if (data.encoding !== "base64") {
            throw new Error(`Unsupported encoding for ${file.name}`);
          }
          const content = Buffer.from(data.content, "base64").toString("utf-8");

          // Parse HTML
          const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i) || ["", "Untitled"];
          const dateCategoryMatch = content.match(/<p[^>]*>(\d{4}-\d{2}-\d{2})\s*•\s*([^<]*?)(?=<|$)/i) || ["", "", "Uncategorized"];
          const descriptionMatch = content.match(/<p[^>]*>(\d{4}-\d{2}-\d{2})\s*•\s*[^<]*<\/p>\s*<p[^>]*>(.*?)(?=<div class="tags"|$)/is) || ["", "", ""];
          const tagsMatch = content.match(/<div class="tags">([\s\S]*?)<\/div>/i) || ["", ""];
          const imageMatch = content.match(/<img[^>]+src=["'](.*?)["']/i) || ["", ""];
          const contentStart = content.indexOf("<main>") + 6;
          const contentEnd = content.indexOf("</main>");
          const postContent = contentStart > 5 && contentEnd > contentStart ? content.slice(contentStart, contentEnd).trim() : content;

          return {
            slug: file.name.replace(".html", ""),
            title: titleMatch[1],
            date: dateCategoryMatch[1],
            category: dateCategoryMatch[2].trim(),
            description: descriptionMatch[2] || "",
            tags: tagsMatch[1]
              ? tagsMatch[1]
                  .match(/<span class="tag">([\s\S]*?)<\/span>/g)
                  ?.map((tag) => tag.match(/<span class="tag">([\s\S]*?)<\/span>/)[1])
                  .join(",") || ""
              : "",
            image: imageMatch[1],
            content: postContent,
          };
        })
    );

    // Process results
    const posts = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);
    const errors = results
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason.message);

    console.log("Processed posts:", posts); // Debug log
    return {
      statusCode: 200,
      body: JSON.stringify({
        data: posts,
        error: errors.length