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

    // Get current file to obtain SHA
    let sha;
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path });
      sha = data.sha;
    } catch (error) {
      if (error.status === 404) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Post not found' }),
        };
      }
      console.error('Get file error:', error);
      throw error;
    }

    // Create markdown content with front matter
    const markdownContent = `---
title: ${title}
slug: ${slug}
date: ${date}
${category ? `category: ${category}` : ''}
${tags ? `tags: [${tags.split(',').map(tag => tag.trim()).join(', ')}]` : ''}
${image ? `image: ${image}` : ''}
---
${content}
`;

    // Update file in GitHub
    const response = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `Update post: ${title}`,
      content: Buffer.from(markdownContent).toString('base64'),
      sha,
    });

    console.log('Update post response:', response.data);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Post updated successfully', commit: response.data.commit.sha }),
    };
  } catch (error) {
    console.error('Update post error:', error.message, error.stack);
    return {
      statusCode: error.status || 500,
      body: JSON.stringify({ error: `Failed to update post: ${error.message}` }),
    };
  }
};