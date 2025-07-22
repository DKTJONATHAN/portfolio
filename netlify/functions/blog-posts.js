const { Octokit } = require('@octokit/rest');

exports.handler = async (event) => {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const { title, slug, category, tags, image, excerpt, date, content } = JSON.parse(event.body);

    // Validate input
    if (!title || !slug || !content) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing required fields: title, slug, or content' })
        };
    }

    const path = `content/blog/${slug}.md`;
    const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
date: ${date}
category: ${category || 'Uncategorized'}
tags: ${tags?.length ? tags.join(', ') : ''}
image: ${image || ''}
excerpt: ${excerpt?.replace(/"/g, '\\"') || ''}
---
${content}`;

    try {
        // Check if file already exists
        try {
            await octokit.repos.getContent({
                owner: process.env.GITHUB_OWNER,
                repo: process.env.GITHUB_REPO,
                path
            });
            return {
                statusCode: 409,
                body: JSON.stringify({ error: `Post with slug ${slug} already exists` })
            };
        } catch (error) {
            if (error.status !== 404) {
                throw error; // Rethrow non-404 errors
            }
        }

        // Create new file
        const response = await octokit.repos.createOrUpdateFileContents({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path,
            message: `Create post ${slug}`,
            content: Buffer.from(frontmatter).toString('base64')
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Post created', sha: response.data.content.sha })
        };
    } catch (error) {
        console.error('Save post error:', error);
        return {
            statusCode: error.status || 500,
            body: JSON.stringify({ error: `Failed to save post: ${error.message}` })
        };
    }
};