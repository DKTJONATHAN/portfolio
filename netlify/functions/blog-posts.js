const { Octokit } = require('@octokit/rest');
const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
    const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, JWT_SECRET } = process.env;
    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    try {
        const authHeader = event.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
        }
        const token = authHeader.split(' ')[1];
        jwt.verify(token, JWT_SECRET);

        if (event.httpMethod === 'POST') {
            const data = JSON.parse(event.body);
            const { slug, title, category, tags, image, date, content } = data;
            if (!title || !category || !date || !content || !slug) {
                return { statusCode: 400, body: JSON.stringify({ message: 'Missing required fields' }) };
            }

            const path = `content/blog/${slug}.md`;
            const contentBase64 = Buffer.from(
                `---\ntitle: "${title}"\ndate: ${date}\ncategory: ${category}\ntags: ${tags.join(',')}\n${image ? `image: ${image}\n` : ''}---\n${content}`
            ).toString('base64');

            let sha;
            try {
                const { data: file } = await octokit.repos.getContent({
                    owner: GITHUB_OWNER,
                    repo: GITHUB_REPO,
                    path
                });
                sha = file.sha;
            } catch (err) {
                if (err.status !== 404) throw err;
            }

            await octokit.repos.createOrUpdateFileContents({
                owner: GITHUB_OWNER,
                repo: GITHUB_REPO,
                path,
                message: sha ? `Update post ${slug}` : `Create post ${slug}`,
                content: contentBase64,
                sha,
                committer: { name: 'Netlify Bot', email: 'netlify@bot.com' }
            });

            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Post saved' })
            };
        } else if (event.httpMethod === 'DELETE') {
            const { slug } = JSON.parse(event.body);
            if (!slug) {
                return { statusCode: 400, body: JSON.stringify({ message: 'Missing slug' }) };
            }

            const path = `content/blog/${slug}.md`;
            const { data: file } = await octokit.repos.getContent({
                owner: GITHUB_OWNER,
                repo: GITHUB_REPO,
                path
            });

            await octokit.repos.deleteFile({
                owner: GITHUB_OWNER,
                repo: GITHUB_REPO,
                path,
                message: `Delete post ${slug}`,
                sha: file.sha,
                committer: { name: 'Netlify Bot', email: 'netlify@bot.com' }
            });

            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Post deleted' })
            };
        }

        return { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) };
    } catch (err) {
        return { statusCode: err.status || 500, body: JSON.stringify({ message: err.message }) };
    }
};