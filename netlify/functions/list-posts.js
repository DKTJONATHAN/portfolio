const { Octokit } = require('@octokit/rest');

exports.handler = async () => {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    try {
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
            const frontmatter = content.match(/---\n([\s\S]*?)\n---/)[1];
            const yaml = require('js-yaml');
            const metadata = yaml.load(frontmatter);
            return {
                ...metadata,
                slug: file.name.replace('.md', ''),
                content: content.replace(/---\n[\s\S]*?\n---/, '').trim()
            };
        }));

        return { statusCode: 200, body: JSON.stringify(posts) };
    } catch (error) {
        console.error('List posts error:', error);
        return { statusCode: error.status || 500, body: JSON.stringify({ error: `Failed to fetch posts: ${error.message}` }) };
    }
};