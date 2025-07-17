const { Octokit } = require('@octokit/rest');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { filePath, content, repo, branch } = JSON.parse(event.body);
        const [owner, repoName] = repo.split('/');

        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });

        // Check if file exists to get its SHA for update
        let sha;
        try {
            const { data } = await octokit.repos.getContent({
                owner,
                repo: repoName,
                path: filePath,
                ref: branch
            });
            sha = data.sha;
        } catch (error) {
            // File doesn't exist yet, we'll create it
            if (error.status === 404) {
                sha = null;
            } else {
                throw error;
            }
        }

        // Create or update the file
        const { data } = await octokit.repos.createOrUpdateFileContents({
            owner,
            repo: repoName,
            path: filePath,
            message: `Update ${filePath} via contact form`,
            content: Buffer.from(content).toString('base64'),
            sha,
            branch
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'File updated successfully' })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: error.status || 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
