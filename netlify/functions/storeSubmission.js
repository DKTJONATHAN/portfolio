const { Octokit } = require('@octokit/rest');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' })
        };
    }

    try {
        const data = JSON.parse(event.body);
        
        // Initialize Octokit with GitHub token
        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });

        // Get the current content of forms.json
        const repoInfo = process.env.GITHUB_REPO.split('/');
        const owner = repoInfo[0];
        const repo = repoInfo[1];
        const path = 'data/forms.json';

        let currentContent = [];
        let sha = null;

        try {
            const { data: fileData } = await octokit.repos.getContent({
                owner,
                repo,
                path,
                ref: 'main'
            });

            currentContent = JSON.parse(Buffer.from(fileData.content, 'base64').toString());
            sha = fileData.sha;
        } catch (error) {
            if (error.status !== 404) throw error;
            // File doesn't exist yet, we'll create it
        }

        // Add new submission
        currentContent.push(data);

        // Update the file on GitHub
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message: `Add new contact form submission from ${data.email}`,
            content: Buffer.from(JSON.stringify(currentContent, null, 2)).toString('base64'),
            sha,
            branch: 'main'
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Submission stored successfully' })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                message: 'Failed to store submission',
                error: error.message 
            })
        };
    }
};