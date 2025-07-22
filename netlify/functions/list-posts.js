const { Octokit } = require('@octokit/rest');
const yaml = require('js-yaml');

exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    console.log('list-posts: Invoked with method:', event.httpMethod); // Debug log
    if (event.httpMethod === 'OPTIONS') {
        console.log('list-posts: Handling OPTIONS request');
        return { statusCode: 200, headers, body: '' };
    }

    try {
        console.log('list-posts: Environment:', {
            GITHUB_TOKEN: process.env.GITHUB_TOKEN ? 'Set' : 'Missing',
            GITHUB_OWNER: process.env.GITHUB_OWNER,
            GITHUB_REPO: process.env.GITHUB_REPO
        });
        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        console.log('list-posts: Fetching content from content/blog');

        let data;
        try {
            const response = await octokit.repos.getContent({
                owner: process.env.GITHUB_OWNER,
                repo: process.env.GITHUB_REPO,
                path: 'content/blog'
            });
            data = response.data;
        } catch (error) {
            if (error.status === 404) {
                console.log('list-posts: content/blog directory not found, returning empty list');
                return { statusCode: 200, headers, body: JSON.stringify([]) };
            }
            throw error;
        }

        console.log('list-posts: Found files:', data.map(file => file.name));
        const posts = await Promise.all(data.filter(file => file.name.endsWith('.md')).map(async (file) => {
            console.log('list-posts: Processing file:', file.name);
            const { data: fileData } = await octokit.repos.getContent({
                owner: process.env.GITHUB_OWNER,
                repo: process.env.GITHUB_REPO,
                path: file.path
            });
            const content = Buffer.from(fileData.content, 'base64').toString();
            const frontmatterMatch = content.match(/---\n([\s\S]*?)\n---/);
            if (!frontmatterMatch) {
                console.log('list-posts: Invalid frontmatter in', file.name);
                throw new Error(`Invalid frontmatter in ${file.name}`);
            }
            const frontmatter = frontmatterMatch[1];
            const metadata = yaml.load(frontmatter);
            return {
                ...metadata,
                slug: file.name.replace('.md', ''),
                content: content.replace(/---\n[\s\S]*?\n---/, '').trim()
            };
        }));

        console.log('list-posts: Posts processed:', posts);
        return { statusCode: 200, headers, body: JSON.stringify(posts) };
    } catch (error) {
        console.error('list-posts: Error:', error.message, error.stack);
        return { statusCode: error.status || 500, headers, body: JSON.stringify({ error: `Failed to fetch posts: ${error.message}` }) };
    }
}; 