const { Octokit } = require("@octokit/rest");

exports.handler = async function(event, context) {
    // Validate request method
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Method Not Allowed" })
        };
    }

    // Parse and validate request body
    let payload;
    try {
        payload = JSON.parse(event.body);
        if (!payload.formType || !payload.data) {
            throw new Error("Missing formType or data");
        }
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid request: " + error.message })
        };
    }

    try {
        // Initialize GitHub client
        const octokit = new Octokit({
            auth: process.env.GITHUB_ACCESS_TOKEN
        });

        const owner = "DKTJONATHAN";
        const repo = "portfolio";
        const path = "data/forms.json";
        const branch = "main";

        // Try to get existing file
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
            if (error.status !== 404) throw error;
        }

        // Add new submission with timestamp
        const newSubmission = {
            ...payload.data,
            formType: payload.formType,
            timestamp: new Date().toISOString()
        };
        existingContent.push(newSubmission);

        // Update file on GitHub
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message: `New ${payload.formType} submission from website`,
            content: Buffer.from(JSON.stringify(existingContent, null, 2)).toString("base64"),
            sha,
            branch
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };
    } catch (error) {
        console.error("GitHub Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: "Failed to save form data",
                details: error.message
            })
        };
    }
};