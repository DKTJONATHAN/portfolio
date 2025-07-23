const { Octokit } = require('@octokit/rest');
const qs = require('querystring');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = qs.parse(event.body);
    const { title, slug, category, tags, image, date, content } = body;

    if (!title || !slug || !date || !content) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: title, slug, date, content' }),
      };
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const path = `content/blog/${slug}.md`;

    // Check if file exists
    try {
      await octokit.repos.getContent({ owner, repo, path });
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Post with this slug already exists' }),
      };
    } catch (error) {
      if (error.status !== 404) {
        console.error('Check file error:', error.message, error.stack);
        throw new Error(`GitHub API error: ${error.message}`);
      }
    }

    // Create markdown with front matter
    const markdownContent = `---
title: "${title.replace(/"/g, '\\"')}"
slug: ${slug}
date: ${date}
${category ? `category: "${category.replace(/"/g, '\\"')}"` : ''}
${tags ? `tags: [${tags.split(',').map(tag => `"${tag.trim().replace(/"/g, '\\"')}"`).join(', ')}]` : ''}
${image ? `image: "${image.replace(/"/g, '\\"')}"` : ''}
---
${content}
`;

    // Commit to GitHub
    const response = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `Create post: ${title}`,
      content: Buffer.from(markdownContent).toString('base64'),
    });

    console.log('Save post commit:', response.data.commit.sha);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Post saved', commit: response.data.commit.sha }),
    };
  } catch (error) {
    console.error('Save post error:', error.message, error.stack);
    return {
      statusCode: error.status || 500,
      body: JSON.stringify({ error: `Failed to save post: ${error.message}` }),
    };
  }
};