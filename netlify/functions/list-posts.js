const { Octokit } = require('@octokit/rest');
const yaml = require('js-yaml');

exports.handler = async () => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        const { data } = await octokit.repos.getContent({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path: 'content/blog'
        });

        const posts = await Promise.all(data.filter(file => file.name.endsWith('.md')).map(async (file) => {
            const { data: fileData } = await octokit.repos.getContent({
                owner: process.env.GITHUB_OWNER,
                repo: process.env.GITHUB_REPO,
                path: file.path
            });
            const content = Buffer.from(fileData.content, 'base64').toString();
            const frontmatterMatch = content.match(/---\n([\s\S]*?)\n---/);
            if (!frontmatterMatch) throw new Error(`Invalid frontmatter in ${file.name}`);
            const frontmatter = frontmatterMatch[1];
            const metadata = yaml.load(frontmatter);
            return {
                ...metadata,
                slug: file.name.replace('.md', ''),
                content: content.replace(/---\n[\s\S]*?\n---/, '').trim()
            };
        }));

        return { statusCode: 200, headers, body: JSON.stringify(posts) };
    } catch (error) {
        console.error('List posts error:', error);
        return { statusCode: error.status || 500, headers, body: JSON.stringify({ error: `Failed to fetch posts: ${error.message}` }) };
    }
};