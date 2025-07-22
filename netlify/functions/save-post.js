const { Octokit } = require('@octokit/rest');

exports.handler = async (event) => {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const { title, slug, category, tags, image, date, content } = JSON.parse(event.body);

    if (!title || !slug || !content || !date) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const path = `content/blog/${slug}.md`;
    const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
date: ${date}
category: ${category || 'Uncategorized'}
tags: ${tags?.length ? tags.join(', ') : ''}
image: ${image || ''}
---
${content}`;

    try {
        await octokit.repos.createOrUpdateFileContents({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path,
            message: `Create post ${slug}`,
            content: Buffer.from(frontmatter).toString('base64')
        });
        return { statusCode: 200, body: JSON.stringify({ message: 'Post created' }) };
    } catch (error) {
        console.error('Save post error:', error);
        return { statusCode: error.status || 500, body: JSON.stringify({ error: `Failed to save post: ${error.message}` }) };
    }
};