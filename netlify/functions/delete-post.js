const { Octokit } = require('@octokit/rest');

exports.handler = async (event) => {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const { slug } = JSON.parse(event.body);

    if (!slug) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing slug' }) };
    }

    const path = `content/blog/${slug}.md`;

    try {
        const { data: { sha } } = await octokit.repos.getContent({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path
        });
        await octokit.repos.deleteFile({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path,
            message: `Delete post ${slug}`,
            sha
        });
        return { statusCode: 200, body: JSON.stringify({ message: 'Post deleted' }) };
    } catch (error) {
        console.error('Delete post error:', error);
        return { statusCode: error.status || 500, body: JSON.stringify({ error: `Failed to delete post: ${error.message}` }) };
    }
};