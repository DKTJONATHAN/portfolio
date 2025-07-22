const { Octokit } = require('@octokit/rest');

exports.handler = async (event) => {
    const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = process.env;
    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    try {
        const content = Buffer.from(event.body, 'base64');
        const filename = `content/uploads/${Date.now()}-${Math.random().toString(36).substring(2)}.${event.headers['content-type'].split('/')[1]}`;
        
        await octokit.repos.createOrUpdateFileContents({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: filename,
            message: `Upload image ${filename}`,
            content: content.toString('base64')
        });

        const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${filename}`;
        return {
            statusCode: 200,
            body: JSON.stringify({ url })
        };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ message: err.message }) };
    }
};