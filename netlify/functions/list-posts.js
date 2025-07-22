const { Octokit } = require('@octokit/rest');

exports.handler = async () => {
    const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = process.env;
    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    try {
        const { data: files } = await octokit.repos.getContent({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: 'content/blog'
        });

        const posts = await Promise.all(files.map(async (file) => {
            if (file.type !== 'file' || !file.name.endsWith('.md')) return null;
            const { data: content } = await octokit.repos.getContent({
                owner: GITHUB_OWNER,
                repo: GITHUB_REPO,
                path: file.path
            });
            const decoded = Buffer.from(content.content, 'base64').toString();
            const match = decoded.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
            if (!match) return null;
            const frontmatter = match[1].split('\n').reduce((acc, line) => {
                const [key, value] = line.split(': ').map(s => s.trim().replace(/^["']|["']$/g, ''));
                if (key && value) acc[key] = key === 'tags' ? value.split(',').map(t => t.trim()) : value;
                return acc;
            }, {});
            return { ...frontmatter, content: match[2], slug: file.name.replace('.md', '') };
        }));

        return {
            statusCode: 200,
            body: JSON.stringify(posts.filter(p => p))
        };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ message: err.message }) };
    }
};