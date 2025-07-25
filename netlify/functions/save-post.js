const { Octokit } = require("@octokit/rest");
const sanitizeHtml = require('sanitize-html');

exports.handler = async (event) => {
  const { title, slug, content, category, tags, image, date, description } = JSON.parse(event.body);
  
  // Validate inputs
  if (!title || !slug) {
    return { statusCode: 400, body: JSON.stringify({ error: "Title and slug are required" }) };
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const path = `content/articles/${slug}.html`;
  
  // Sanitize HTML content
  const cleanContent = sanitizeHtml(content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'width', 'height']
    }
  });

  // Front matter for metadata
  const frontMatter = `---
title: "${title.replace(/"/g, '\\"')}"
date: "${date}"
category: "${category}"
tags: [${tags.split(',').map(t => `"${t.trim()}"`).join(', ')}]
image: "${image}"
description: "${description.replace(/"/g, '\\"')}"
---\n\n`;

  const fullContent = frontMatter + cleanContent;
  const message = event.queryStringParameters.update ? `Update ${slug}` : `Create ${slug}`;

  try {
    let sha = null;
    // Check if file exists (for updates)
    if (event.queryStringParameters.update) {
      try {
        const { data } = await octokit.repos.getContent({ owner, repo, path });
        sha = data.sha;
      } catch (e) {
        // File doesn't exist yet (new post)
      }
    }

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(fullContent).toString('base64'),
      sha,
    });

    // Trigger Netlify rebuild
    await fetch(process.env.NETLIFY_BUILD_HOOK, { method: 'POST' });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};