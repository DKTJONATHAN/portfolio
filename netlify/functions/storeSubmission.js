const { Octokit } = require("@octokit/rest");

exports.handler = async (event, context) => {
    console.log('Function triggered with event:', event.body);

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) };
    }

    try {
        const formData = JSON.parse(event.body);

        // Validation
        if (!formData.name || !formData.email || !formData.message) {
            return { 
                statusCode: 400, 
                body: JSON.stringify({ 
                    success: false,
                    message: 'Missing required fields' 
                }) 
            };
        }

        // Verify GitHub token
        if (!process.env.GITHUB_TOKEN) {
            throw new Error('GitHub token not configured in environment variables');
        }

        const octokit = new Octokit({ 
            auth: process.env.GITHUB_TOKEN,
            userAgent: 'Netlify Form Handler v1.0'
        });

        const owner = process.env.GITHUB_OWNER || 'DKTJONATHAN';
        const repo = process.env.GITHUB_REPO || 'Portfolio';
        const path = 'data/forms.json';

        console.log(`Attempting to access ${owner}/${repo}/${path}`);

        // Get existing file or initialize
        let existingData = [];
        let sha = null;

        try {
            const { data: fileData } = await octokit.rest.repos.getContent({ 
                owner, 
                repo, 
                path 
            });
            const content = Buffer.from(fileData.content, 'base64').toString();
            existingData = content ? JSON.parse(content) : [];
            sha = fileData.sha;
            console.log('Found existing file with SHA:', sha);
        } catch (error) {
            if (error.status !== 404) {
                console.error('Error accessing file:', error);
                throw new Error(`Could not access repository file: ${error.message}`);
            }
            console.log('No existing file found, will create new one');
        }

        // Add new submission
        const newSubmission = {
            id: Date.now().toString(),
            ...formData,
            timestamp: new Date().toISOString()
        };
        existingData.push(newSubmission);

        // Prepare update
        const content = Buffer.from(JSON.stringify(existingData, null, 2)).toString('base64');
        const commitMessage = `Add submission from ${formData.name} (${formData.email})`;

        const updateResponse = await octokit.rest.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message: commitMessage,
            content,
            sha,
            committer: { name: 'Netlify Bot', email: 'netlify@bot.com' },
            author: { name: formData.name, email: formData.email }
        });

        console.log('GitHub API response status:', updateResponse.status);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                success: true,
                message: 'Submission stored successfully',
                id: newSubmission.id,
                commitSha: updateResponse.data.commit.sha,
                html_url: updateResponse.data.content.html_url
            })
        };

    } catch (error) {
        console.error('Full error details:', {
            message: error.message,
            stack: error.stack,
            status: error.status,
            response: error.response?.data
        });

        return {
            statusCode: error.status || 500,
            body: JSON.stringify({ 
                success: false,
                message: 'Failed to store submission',
                error: error.message,
                details: error.response?.data || 'No additional details available'
            })
        };
    }
};