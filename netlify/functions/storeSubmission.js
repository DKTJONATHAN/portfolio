const { Octokit } = require('@octokit/rest');

exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ 
                success: false,
                message: 'Method Not Allowed' 
            })
        };
    }

    try {
        // Parse incoming data
        const data = JSON.parse(event.body);
        
        // Validate required fields
        if (!data.name || !data.email || !data.message) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    message: 'Name, email, and message are required fields'
                })
            };
        }

        // Initialize GitHub client
        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });

        const [owner, repo] = process.env.GITHUB_REPO.split('/');
        const filePath = 'data/forms.json';
        const branch = 'main';
        const commitMessage = `New form submission from ${data.name}`;
        
        // Try to get existing content
        let currentContent = [];
        try {
            const { data: fileData } = await octokit.repos.getContent({
                owner,
                repo,
                path: filePath,
                ref: branch
            });
            
            const content = Buffer.from(fileData.content, 'base64').toString('utf8');
            currentContent = JSON.parse(content);
        } catch (error) {
            // If file doesn't exist, we'll create it
            if (error.status !== 404) throw error;
        }

        // Add new submission
        currentContent.push(data);
        
        // Convert to pretty-printed JSON
        const newContent = JSON.stringify(currentContent, null, 2);
        
        // Create or update file
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: filePath,
            message: commitMessage,
            content: Buffer.from(newContent).toString('base64'),
            branch,
            committer: {
                name: 'Website Form Bot',
                email: 'bot@jonathanmwaniki.co.ke'
            },
            author: {
                name: data.name,
                email: data.email
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true,
                message: 'Submission stored successfully' 
            })
        };
        
    } catch (error) {
        console.error('Error storing submission:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false,
                message: 'Failed to store submission',
                error: error.message
            })
        };
    }
};