const { Octokit } = require('@octokit/rest');

exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    console.log('update-post: Invoked with method:', event.httpMethod); // Debug log
    console.log('update-post: Headers:', event.headers); // Debug log
    console.log('update-post: Raw body:', event.body); // Debug log
    if (event.httpMethod === 'OPTIONS') {
        console.log('update-post: Handling OPTIONS request');
        return { statusCode: 200, headers, body: '' };
    }

    try {
        console.log('update-post: Environment:', {
            GITHUB_TOKEN: process.env.GITHUB_TOKEN ? 'Set' : 'Missing',
            GITHUB_OWNER: process.env.GITHUB_OWNER,
            GITHUB_REPO: process.env.GITHUB_REPO
        });

        let postData;
        const contentType = (event.headers['content-type'] || '').toLowerCase();
        if (contentType.includes('application/x-www-form-urlencoded')) {
            console.log('update-post: Processing form data');
            const params = new URLSearchParams(event.body);
            postData = {
                title: params.get('title'),
                slug: params.get('slug'),
                category: params.get('category'),
                tags: params.get('tags') ? params.get('tags').split(',').map(tag => tag.trim()) : [],
                image: params.get('image') || '',
                date: params.get('date'),
                content: params.get('content')
            };
        } else {
            console.log('update-post: Processing JSON data');
            try {
                postData = event.body ? JSON.parse(event.body) : {};
            } catch (parseError) {
                console.error('update-post: JSON parse error:', parseError.message);
                return { statusCode: 400, headers, body: JSON.stringify({ error: `Invalid JSON: ${parseError.message}` }) };
            }
        }

        const { title, slug, category, tags, image, date, content } = postData;
        if (!title || !slug || !content || !date) {
            console.log('update-post: Missing fields:', { title, slug, content, date });
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
        }

        // Validate slug
        if (!/^[a-z0-9-]+$/.test(slug)) {
            console.log('update-post: Invalid slug:', slug);
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Slug must contain only lowercase letters, numbers, and hyphens' }) };
        }

        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        const path = `content/blog/${slug}.md`;
        console.log('update-post: Checking if file exists:', path);

        // Ensure file exists for update
        let sha;
        try {
            const { data } = await octokit.repos.getContent({
                owner: process.env.GITHUB_OWNER,
                repo: process.env.GITHUB_REPO,
                path
            });
            sha = data.sha;
            console.log('update-post: File exists, updating with SHA:', sha);
        } catch (error) {
            console.error('update-post: File not found:', error.message);
            return { statusCode: 404, headers, body: JSON.stringify({ error: `Post not found: ${slug}` }) };
        }

        const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
date: ${date}
category: ${category || 'Uncategorized'}
tags: ${tags?.length ? tags.join(', ') : ''}
image: ${image || ''}
---
${content}`;

        console.log('update-post: Updating file:', path);
        await octokit.repos.createOrUpdateFileContents({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path,
            message: `Update post ${slug}`,
            content: Buffer.from(frontmatter).toString('base64'),
            sha
        });

        console.log('update-post: Post updated successfully');
        return { statusCode: 200, headers, body: JSON.stringify({ message: 'Post updated' }) };
    } catch (error) {
        console.error('update-post: Error:', error.message, error.stack);
        return { statusCode: error.status || 500, headers, body: JSON.stringify({ error: `Failed to update post: ${error.message}` }) };
    }
}; 