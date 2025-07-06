const { Octokit } = require("@octokit/rest");

exports.handler = async function(event, context) {
    // First add proper error handling for JSON parsing
    let body;
    try {
        body = JSON.parse(event.body || "{}");
    } catch (e) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid JSON input" })
        };
    }

    // Rest of your existing code with improved error handling
    try {
        const { formType, data } = body;

        if (!formType || !data) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing formType or data" })
            };
        }

        const octokit = new Octokit({
            auth: process.env.GITHUB_ACCESS_TOKEN
        });

        const [owner, repo] = process.env.GITHUB_REPO.split("/");
        const path = "data/forms.json";
        const branch = "main";

        let existingContent = [];
        let sha = null;

        try {
            const { data: fileData } = await octokit.repos.getContent({
                owner,
                repo,
                path,
                ref: branch
            });

            const content = Buffer.from(fileData.content, "base64").toString("utf8");
            existingContent = content ? JSON.parse(content) : [];
            sha = fileData.sha;
        } catch (error) {
            if (error.status !== 404) throw error;
        }

        // Validate data before pushing
        if (typeof data !== "object") {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid data format" })
            };
        }

        existingContent.push(data);

        const contentEncoded = Buffer.from(JSON.stringify(existingContent, null, 2)).toString("base64");

        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message: `Add new ${formType} form submission`,
            content: contentEncoded,
            sha,
            branch
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };

    } catch (error) {
        console.error("Full error:", error);
        return {
            statusCode: error.status || 500,
            body: JSON.stringify({ 
                error: error.message || "Failed to save form data",
                details: error.response?.data || null
            })
        };
    }
};