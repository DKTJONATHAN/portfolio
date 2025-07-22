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

    const { slug } = JSON.parse(event.body);
    const githubToken = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const path = `content/blog/${slug}.md`;

    try {
        const getResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
            headers: { 'Authorization': `token ${githubToken}` }
        });
        const fileData = await getResponse.json();
        const sha = fileData.sha;

        const deleteResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Delete post: ${slug}`,
                sha,
                branch: 'main' // Adjust branch if needed
            })
        });

        if (!deleteResponse.ok) {
            const errorData = await deleteResponse.json();
            throw new Error(errorData.message || 'Failed to delete post');
        }

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: 'Post deleted successfully' })
        };
    } catch (error) {
        console.error('Delete post error:', error);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: error.message })
        };
    }
};