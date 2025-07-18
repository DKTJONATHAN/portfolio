// netlify/functions/storeSubmission.js
exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method not allowed' })
        };
    }

    try {
        const formData = JSON.parse(event.body);
        
        // Validate required fields
        if (!formData.name || !formData.email || !formData.message) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing required fields' })
            };
        }

        const { Octokit } = require("@octokit/rest");
        
        // Initialize Octokit with the GitHub token
        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });

        const owner = 'DKTJONATHAN';
        const repo = 'Portfolio';
        const path = 'data/forms.json';

        let existingData = [];
        let sha = null;

        try {
            // Try to get existing file
            const { data: fileData } = await octokit.rest.repos.getContent({
                owner,
                repo,
                path
            });

            // Decode the existing content
            const content = Buffer.from(fileData.content, 'base64').toString();
            existingData = JSON.parse(content);
            sha = fileData.sha;
        } catch (error) {
            // File doesn't exist yet, that's okay
            console.log('File does not exist yet, creating new one');
        }

        // Add new submission to existing data
        existingData.push({
            id: Date.now().toString(),
            ...formData,
            timestamp: new Date().toISOString()
        });

        // Convert to JSON string with proper formatting
        const newContent = JSON.stringify(existingData, null, 2);

        // Update or create the file
        const updateParams = {
            owner,
            repo,
            path,
            message: `Add new form submission from ${formData.name}`,
            content: Buffer.from(newContent).toString('base64'),
            committer: {
                name: 'Netlify Bot',
                email: 'netlify@bot.com'
            },
            author: {
                name: 'Netlify Bot',
                email: 'netlify@bot.com'
            }
        };

        // Add SHA if file exists (for updates)
        if (sha) {
            updateParams.sha = sha;
        }

        await octokit.rest.repos.createOrUpdateFileContents(updateParams);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST'
            },
            body: JSON.stringify({ 
                message: 'Form submission stored successfully',
                id: Date.now().toString()
            })
        };

    } catch (error) {
        console.error('Error storing form submission:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                message: 'Internal server error',
                error: error.message 
            })
        };
    }
};