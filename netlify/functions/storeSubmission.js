const { Octokit } = require("@octokit/rest");

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

        // Initialize Octokit with the GitHub token
        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });

        const owner = process.env.GITHUB_OWNER || 'DKTJONATHAN';
        const repo = process.env.GITHUB_REPO || 'Portfolio';
        const path = 'data/forms.json';

        let existingData = [];
        let sha = null;

        try {
            // Try to get existing file
            const { data: fileData } = await octokit.rest.repos.getContent({
                owner,
                repo,
                path,
                ref: 'main' // Explicitly specify branch
            });

            // Decode and parse existing content
            const content = Buffer.from(fileData.content, 'base64').toString('utf8');
            existingData = content.trim() ? JSON.parse(content) : [];
            sha = fileData.sha;
        } catch (error) {
            if (error.status !== 404) { // Only ignore 404 errors
                console.error('GitHub API error:', error);
                throw error;
            }
            console.log('Creating new file as it doesn\'t exist');
        }

        // Add new submission with additional metadata
        existingData.push({
            id: Date.now().toString(),
            ...formData,
            timestamp: new Date().toISOString(),
            ip: event.headers['client-ip'] || null,
            userAgent: event.headers['user-agent'] || null
        });

        // Convert to JSON string
        const newContent = JSON.stringify(existingData, null, 2);

        // Update or create the file
        const response = await octokit.rest.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message: `New submission from ${formData.name}`,
            content: Buffer.from(newContent).toString('base64'),
            sha: sha || undefined, // Only include if updating
            branch: 'main',
            committer: {
                name: 'Form Submission Bot',
                email: 'bot@portfolio.com'
            },
            author: {
                name: formData.name || 'Anonymous',
                email: formData.email || 'anonymous@example.com'
            }
        });

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST'
            },
            body: JSON.stringify({ 
                message: 'Submission stored successfully',
                id: Date.now().toString(),
                commitUrl: response.data.commit.html_url
            })
        };

    } catch (error) {
        console.error('Full error:', {
            message: error.message,
            status: error.status,
            response: error.response?.data
        });
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                message: 'Internal server error',
                error: error.message,
                details: error.response?.data || null
            })
        };
    }
};
