const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const token = event.headers['authorization']?.replace('Bearer ', '');
    if (!token || !jwt.verify(token, process.env.JWT_SECRET)) {
        return { 
            statusCode: 401, 
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Unauthorized' }) 
        };
    }

    const { title, slug, category, tags, image, date, content } = JSON.parse(event.body);
    const githubToken = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const path = `content/blog/${slug}.md`;

    try {
        const markdownContent = `---
title: ${title}
slug: ${slug}
category: ${category}
tags: [${tags.join(', ')}]
image: ${image || ''}
date: ${date}
---
${content}
`;

        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Create post: ${title}`,
                content: Buffer.from(markdownContent).toString('base64'),
                branch: 'main' // Adjust branch if needed
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save post');
        }

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: 'Post created successfully' })
        };
    } catch (error) {
        console.error('Save post error:', error);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: error.message })
        };
    }
};