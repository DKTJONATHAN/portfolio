const { Octokit } = require('@octokit/rest');

exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    console.log('delete-post: Invoked with method:', event.httpMethod); // Debug log
    console.log('delete-post: Headers:', event.headers); // Debug log
    console.log('delete-post: Raw body:', event.body); // Debug log
    if (event.httpMethod === 'OPTIONS') {
        console.log('delete-post: Handling OPTIONS request');
        return { statusCode: 200, headers, body: '' };
    }

    try {
        console.log('delete-post: Environment:', {
            GITHUB_TOKEN: process.env.GITHUB_TOKEN ? 'Set' : 'Missing',
            GITHUB_OWNER: process.env.GITHUB_OWNER,
            GITHUB_REPO: process.env.GITHUB_REPO
        });

        let postData;
        const contentType = (event.headers['content-type'] || '').toLowerCase();
        if (contentType.includes('application/x-www-form-urlencoded')) {
            console.log('delete-post: Processing form data');
            const params = new URLSearchParams(event.body);
            postData = { slug: params.get('slug') };
        } else {
            console.log('delete-post: Processing JSON data');
            try {
                postData = event.body ? JSON.parse(event.body) : {};
            } catch (parseError) {
                console.error('delete-post: JSON parse error:', parseError.message);
                return { statusCode: 400, headers, body: JSON.stringify({ error: `Invalid JSON: ${parseError.message}` }) };
            }
        }

        const { slug } = postData;
        if (!slug) {
            console.log('delete-post: Missing slug');
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing slug' }) };
        }

        // Validate slug
        if (!/^[a-z0-9-]+$/.test(slug)) {
            console.log('delete-post: Invalid slug:', slug);
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Slug must contain only lowercase letters, numbers, and hyphens' }) };
        }

        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        const path = `content/blog/${slug}.md`;
        console.log('delete-post: Checking if file exists:', path);

        // Ensure file exists
        let sha;
        try {
            const { data } = await octokit.repos.getContent({
                owner: process.env.GITHUB_OWNER,
                repo: process.env.GITHUB_REPO,
                path
            });
            sha = data.sha;
            console.log('delete-post: File exists, deleting with SHA:', sha);
        } catch (error) {
            console.error('delete-post: File not found:', error.message);
            return { statusCode: 404, headers, body: JSON.stringify({ error: `Post not found: ${slug}` }) };
        }

        console.log('delete-post: Deleting file:', path);
        await octokit.repos.deleteFile({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path,
            message: `Delete post ${slug}`,
            sha
        });

        console.log('delete-post: Post deleted successfully');
        return { statusCode: 200, headers, body: JSON.stringify({ message: 'Post deleted' }) };
    } catch (error) {
        console.error('delete-post: Error:', error.message, error.stack);
        return { statusCode: error.status || 500, headers, body: JSON.stringify({ error: `Failed to delete post: ${error.message}` }) };
    }
};