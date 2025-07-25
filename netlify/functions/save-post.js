const { Octokit } = require("@octokit/rest");
const { marked } = require("marked");

exports.handler = async function (event) {
  try {
    const { update, ...postData } = JSON.parse(event.body);

    // Initialize GitHub API client
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const filePath = `content/articles/${postData.slug}.html`;

    // Convert content to HTML if it's markdown, otherwise use as-is
    let htmlContent = postData.content;
    if (postData.content.trim().startsWith("---") || postData.content.includes("\n# ") || postData.content.includes("\n* ")) {
      // Assume markdown if it starts with frontmatter or contains markdown syntax
      htmlContent = marked(postData.content);
    } else if (!postData.content.includes("<") && !postData.content.includes(">")) {
      // Treat as raw text if no HTML tags
      htmlContent = `<p>${postData.content.replace(/\n/g, "<br>")}</p>`;
    }
    // If content is already HTML (e.g., from Quill), use it directly

    // Generate HTML file content
    const fileContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${postData.title}</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        <article>
          <header>
            <h1>${postData.title}</h1>
            <p>${postData.date} • ${postData.category}</p>
            ${postData.image ? `<img src="${postData.image}" alt="${postData.title}" class="w-full h-64 object-cover rounded-lg mb-6">` : ""}
            ${postData.description ? `<p>${postData.description}</p>` : ""}
            ${postData.tags ? `<div class="tags">${postData.tags
              .split(",")
              .map((tag) => `<span class="tag">${tag.trim()}</span>`)
              .join("")}</div>` : ""}
          </header>
          <main>
            ${htmlContent}
          </main>
        </article>
      </body>
      </html>
    `;

    // Encode content to base64 for GitHub API
    const contentBase64 = Buffer.from(fileContent).toString("base64");

    // Check if file exists (for updates)
    let sha;
    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: filePath,
      });
      sha = data.sha;
    } catch (error) {
      if (error.status !== 404) throw error; // Ignore 404 (file not found)
    }

    // Create or update file in GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: filePath,
      message: update ? `Update post: ${postData.title}` : `Create post: ${postData.title}`,
      content: contentBase64,
      sha: sha || undefined,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Post saved successfully" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Failed to save post: ${error.message}` }),
    };
  }
};