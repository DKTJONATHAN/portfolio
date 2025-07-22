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
    console.log('save-post: Raw body:', event.body); // Debug log
    if (event.httpMethod === 'OPTIONS') {
        console.log('save-post: Handling OPTIONS request');
        return { statusCode: 200, headers, body: '' };
    }

    try {
        console.log('save-post: Environment:', {
            GITHUB_TOKEN: process.env.GITHUB_TOKEN ? 'Set' : 'Missing',
            GITHUB_OWNER: process.env.GITHUB_OWNER,
            GITHUB_REPO: process.env.GITHUB_REPO
        });

        let postData;
        const contentType = (event.headers['content-type'] || '').toLowerCase();
        if (contentType.includes('application/x-www-form-urlencoded')) {
            console.log('save-post: Processing form data');
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
            console.log('save-post: Processing JSON data');
            try {
                postData = event.body ? JSON.parse(event.body) : {};
            } catch (parseError) {
                console.error('save-post: JSON parse error:', parseError.message);
                return { statusCode: 400, headers, body: JSON.stringify({ error: `Invalid JSON: ${parseError.message}` }) };
            }
        }

        const { title, slug, category, tags, image, date, content } = postData;
        if (!title || !slug || !content || !date) {
            console.log('save-post: Missing fields:', { title, slug, content, date });
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
        }

        // Validate slug to avoid 422 errors
        if (!/^[a-z0-9-]+$/.test(slug)) {
            console.log('save-post: Invalid slug:', slug);
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Slug must contain only lowercase letters, numbers, and hyphens' }) };
        }

        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        const path = `content/blog/${slug}.md`;
        console.log('save-post: Checking if file exists:', path);

        // Check for existing file to avoid 422 errors
        let sha;
        try {
            const { data } = await octokit.repos.getContent({
                owner: process.env.GITHUB_OWNER,
                repo: process.env.GITHUB_REPO,
                path
            });
            sha = data.sha;
            console.log('save-post: File exists, updating with SHA:', sha);
        } catch (error) {
            if (error.status !== 404) {
                console.error('save-post: Error checking file:', error.message);
                throw error;
            }
            console.log('save-post: File does not exist, creating new');
        }

        const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
date: ${date}
category: ${category || 'Uncategorized'}
tags: ${tags?.length ? tags.join(', ') : ''}
image: ${image || ''}
---
${content}`;

        console.log('save-post: Creating/updating file:', path);
        await octokit.repos.createOrUpdateFileContents({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path,
            message: sha ? `Update post ${slug}` : `Create post ${slug}`,
            content: Buffer.from(frontmatter).toString('base64'),
            sha
        });

        console.log('save-post: Post created/updated successfully');
        return { statusCode: 200, headers, body: JSON.stringify({ message: 'Post created' }) };
    } catch (error) {
        console.error('save-post: Error:', error.message, error.stack);
        return { statusCode: error.status || 500, headers, body: JSON.stringify({ error: `Failed to save post: ${error.message}` }) };
    }
};