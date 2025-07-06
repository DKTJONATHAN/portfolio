const { Octokit } = require('@octokit/rest');

exports.handler = async (event) => {
    try {
        const { formType, data } = JSON.parse(event.body);
        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

        // 1. Get existing data
        let currentData = [];
        let fileSha = null;
        
        try {
            const { data: file } = await octokit.repos.getContent({
                owner: 'DKTJONATHAN',
                repo: 'portfolio',
                path: 'data/forms.json',
                ref: 'main'
            });
            
            fileSha = file.sha;
            currentData = JSON.parse(Buffer.from(file.content, 'base64').toString());
        } catch (e) {
            if (e.status !== 404) throw e;
        }

        // 2. Append new submission
        currentData.push(data);

        // 3. Update file
        await octokit.repos.createOrUpdateFileContents({
            owner: 'DKTJONATHAN',
            repo: 'portfolio',
            path: 'data/forms.json',
            message: `New ${formType} submission`,
            content: Buffer.from(JSON.stringify(currentData, null, 2)).toString('base64'),
            sha: fileSha,
            branch: 'main'
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false,
                error: error.message 
            })
        };
    }
};