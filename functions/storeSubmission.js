// functions/storeSubmission.js
exports.handler = async (event, context) => {
    console.log('Function called with method:', event.httpMethod);
    console.log('Environment variables check:', {
        hasGithubToken: !!process.env.GITHUB_TOKEN,
        githubRepo: process.env.GITHUB_REPO
    });
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ message: 'Method not allowed' })
        };
    }

    try {
        console.log('Request body:', event.body);
        const formData = JSON.parse(event.body);
        console.log('Parsed form data:', formData);
        
        // Validate required fields
        if (!formData.name || !formData.email || !formData.message) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ message: 'Missing required fields' })
            };
        }

        // Check if GitHub token exists
        if (!process.env.GITHUB_TOKEN) {
            console.error('GitHub token is missing');
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ message: 'GitHub token not configured' })
            };
        }

        // Dynamic import for ES modules
        const { Octokit } = await import("@octokit/rest");
        
        // Initialize Octokit with the GitHub token
        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });

        const owner = 'DKTJONATHAN';
        const repo = 'Portfolio';
        const path = 'data/forms.json';

        console.log('Attempting to access GitHub repo:', `${owner}/${repo}`);

        let existingData = [];
        let sha = null;

        try {
            // Try to get existing file
            console.log('Fetching existing file...');
            const { data: fileData } = await octokit.rest.repos.getContent({
                owner,
                repo,
                path
            });

            // Decode the existing content
            const content = Buffer.from(fileData.content, 'base64').toString();
            existingData = JSON.parse(content);
            sha = fileData.sha;
            console.log('Existing data loaded:', existingData.length, 'entries');
        } catch (error) {
            console.log('File does not exist yet, creating new one. Error:', error.message);
        }

        // Add new submission to existing data
        const newEntry = {
            id: Date.now().toString(),
            ...formData,
            timestamp: new Date().toISOString()
        };
        
        existingData.push(newEntry);
        console.log('New entry added:', newEntry);

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

        console.log('Attempting to update/create file...');
        const result = await octokit.rest.repos.createOrUpdateFileContents(updateParams);
        console.log('File updated successfully:', result.data.commit.sha);

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
                id: newEntry.id,
                commitSha: result.data.commit.sha
            })
        };

    } catch (error) {
        console.error('Error storing form submission:', error);
        console.error('Error stack:', error.stack);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                message: 'Internal server error',
                error: error.message,
                details: error.stack
            })
        };
    }
};