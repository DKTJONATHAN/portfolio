const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'GET') {
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

    const githubToken = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;

    try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/content/blog`, {
            headers: { 'Authorization': `token ${githubToken}` }
        });
        if (!response.ok) throw new Error('Failed to fetch directory');

        const files = await response.json();
        const posts = await Promise.all(files
            .filter(file => file.name.endsWith('.md'))
            .map(async file => {
                const contentResponse = await fetch(file.download_url);
                const content = await contentResponse.text();
                const [frontMatter, body] = content.split('---\n').slice(1);
                const metadata = {};
                frontMatter.split('\n').forEach(line => {
                    const [key, value] = line.split(': ').map(s => s.trim());
                    if (key && value) metadata[key] = value.replace(/^["']|["']$/g, '');
                });
                return { ...metadata, content: body, slug: file.name.replace('.md', '') };
            }));

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(posts)
        };
    } catch (error) {
        console.error('List posts error:', error);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: error.message })
        };
    }
};