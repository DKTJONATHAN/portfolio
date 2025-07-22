const { Octokit } = require('@octokit/rest');

exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    console.log('save-post: Invoked with method:', event.httpMethod); // Debug log
    console.log('save-post: Headers:', event.headers); // Debug log
    if (event.httpMethod === 'OPTIONS') {
        console.log('save-post: Handling OPTIONS request');
        return { statusCode: 200, headers, body: '' };
    }

    try {
        console.log('save-post: Raw body:', event.body);
        console.log('save-post: Environment:', {
            GITHUB_TOKEN: process.env.GITHUB_TOKEN ? 'Set' : 'Missing',
            GITHUB_OWNER: process.env.GITHUB_OWNER,
            GITHUB_REPO: process.env.GITHUB_REPO
        });

        let body;
        try {
            body = event.body ? JSON.parse(event.body) : {};
        } catch (parseError) {
            console.error('save-post: JSON parse error:', parseError.message);
            return { statusCode: 400, headers, body: JSON.stringify({ error: `Invalid JSON: ${parseError.message}` }) };
        }

        const { title, slug, category, tags, image, date, content } = body;
        if (!title || !slug || !content || !date) {
            console.log('save-post: Missing fields:', { title, slug, content, date });
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
        }

        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        const path = `content/blog/${slug}.md`;
        const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
date: ${date}
category: ${category || 'Uncategorized'}
tags: ${tags?.length ? tags.join(', ') : ''}
image: ${image || ''}
---
${content}`;

        console.log('save-post: Creating file:', path);
        await octokit.repos.createOrUpdateFileContents({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path,
            message: `Create post ${slug}`,
            content: Buffer.from(frontmatter).toString('base64')
        });

        console.log('save-post: Post created successfully');
        return { statusCode: 200, headers, body: JSON.stringify({ message: 'Post created' }) };
    } catch (error) {
        console.error('save-post: Error:', error.message, error.stack);
        return { statusCode: error.status || 500, headers, body: JSON.stringify({ error: `Failed to save post: ${error.message}` }) };
    }
};