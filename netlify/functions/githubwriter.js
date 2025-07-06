const { Octokit } = require("@octokit/rest");

exports.handler = async function(event, context) {
    // 1. Validate request method
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Method Not Allowed" })
        };
    }

    // 2. Parse and validate request body
    let payload;
    try {
        payload = JSON.parse(event.body);
        if (!payload.formType || !payload.data) {
            throw new Error("Missing required fields: formType or data");
        }
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ 
                error: "Invalid request format",
                details: error.message 
            })
        };
    }

    try {
        // 3. Initialize GitHub client
        const octokit = new Octokit({
            auth: process.env.GITHUB_ACCESS_TOKEN
        });

        const owner = "DKTJONATHAN";
        const repo = "portfolio";
        const path = "data/forms.json";
        const branch = "main";

        // 4. Try to get existing file
        let existingContent = [];
        let sha = null;
        
        try {
            const { data } = await octokit.repos.getContent({
                owner,
                repo,
                path,
                ref: branch
            });
            
            const content = Buffer.from(data.content, "base64").toString("utf8");
            existingContent = content ? JSON.parse(content) : [];
            sha = data.sha;
        } catch (error) {
            // Only ignore 404 (not found) errors
            if (error.status !== 404) throw error;
        }

        // 5. Prepare new submission
        const newSubmission = {
            ...payload.data,
            formType: payload.formType,
            timestamp: new Date().toISOString()
        };

        // 6. Validate data isn't empty
        if (Object.keys(newSubmission).length === 0) {
            throw new Error("No valid data to save");
        }

        existingContent.push(newSubmission);

        // 7. Update file on GitHub
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message: `New ${payload.formType} submission from website`,
            content: Buffer.from(JSON.stringify(existingContent, null, 2)).toString("base64"),
            sha, // Will be null for new files
            branch
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true,
                message: "Data saved successfully"
            })
        };

    } catch (error) {
        console.error("GitHub API Error:", error);
        return {
            statusCode: error.status || 500,
            body: JSON.stringify({ 
                error: "Failed to save form data",
                details: error.message,
                ...(error.response && { githubError: error.response.data })
            })
        };
    }
};