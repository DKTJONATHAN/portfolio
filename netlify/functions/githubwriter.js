const { Octokit } = require("@octokit/rest");

exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Method Not Allowed" })
        };
    }

    try {
        // Parse the incoming data
        const body = JSON.parse(event.body);
        const { formType, data } = body;

        // Initialize Octokit with the access token from Netlify env
        const octokit = new Octokit({
            auth: process.env.GITHUB_ACCESS_TOKEN
        });

        // Your GitHub repo details
        const [owner, repo] = process.env.GITHUB_REPO.split("/");
        const path = "data/forms.json";
        const branch = "main"; // or "master" depending on your repo

        // Try to get the existing file first
        let existingContent = [];
        let sha = null;

        try {
            const { data: fileData } = await octokit.repos.getContent({
                owner,
                repo,
                path,
                ref: branch
            });

            // Decode the existing content
            const content = Buffer.from(fileData.content, "base64").toString("utf8");
            existingContent = content ? JSON.parse(content) : [];
            sha = fileData.sha;
        } catch (error) {
            // File doesn't exist yet, we'll create it
            if (error.status !== 404) throw error;
        }

        // Add the new form submission
        existingContent.push(data);

        // Encode the content for GitHub
        const contentEncoded = Buffer.from(JSON.stringify(existingContent, null, 2)).toString("base64");

        // Create or update the file
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message: `Add new ${formType} form submission`,
            content: contentEncoded,
            sha, // This will be null if creating a new file
            branch
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };

    } catch (error) {
        console.error("Error writing to GitHub:", error);
        return {
            statusCode: error.status || 500,
            body: JSON.stringify({ 
                error: error.message || "Failed to save form data"
            })
        };
    }
};