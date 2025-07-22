const { Octokit } = require('@octokit/rest');

exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        const content = Buffer.from(event.body, 'base64');
        const contentType = event.headers['content-type'] || 'image/jpeg';
        const extension = contentType.split('/')[1];
        const filename = `content/uploads/${Date.now()}-${Math.random().toString(36).substring(2)}.${extension}`;

        await octokit.repos.createOrUpdateFileContents({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path: filename,
            message: `Upload image ${filename}`,
            content: content.toString('base64'),
            committer: { name: 'Netlify Bot', email: 'netlify@bot.com' }
        });

        const url = `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/main/${filename}`;
        return { statusCode: 200, headers, body: JSON.stringify({ url }) };
    } catch (error) {
        console.error('Upload image error:', error);
        return { statusCode: error.status || 500, headers, body: JSON.stringify({ error: `Failed to upload image: ${error.message}` }) };
    }
};