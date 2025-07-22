exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    console.log('login: Invoked with method:', event.httpMethod);
    console.log('login: Headers:', event.headers);
    console.log('login: Raw body:', event.body);
    if (event.httpMethod === 'OPTIONS') {
        console.log('login: Handling OPTIONS request');
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        console.log('login: Invalid method:', event.httpMethod);
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        let postData;
        const contentType = (event.headers['content-type'] || '').toLowerCase();
        console.log('login: Content-Type:', contentType);

        // Prioritize form data parsing
        if (contentType.includes('application/x-www-form-urlencoded') || !event.body || event.body.includes('password=')) {
            console.log('login: Processing form data');
            const params = new URLSearchParams(event.body || '');
            postData = { password: params.get('password') || '' };
        } else if (contentType.includes('application/json')) {
            console.log('login: Processing JSON data');
            try {
                postData = event.body ? JSON.parse(event.body) : {};
            } catch (parseError) {
                console.error('login: JSON parse error:', parseError.message);
                return { statusCode: 400, headers, body: JSON.stringify({ error: `Invalid JSON: ${parseError.message}` }) };
            }
        } else {
            console.log('login: Unsupported Content-Type or no body');
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unsupported Content-Type or missing body' }) };
        }

        const { password } = postData;
        if (!password) {
            console.log('login: Missing password');
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing password' }) };
        }

        if (!process.env.ADMIN_PASSWORD) {
            console.error('login: ADMIN_PASSWORD environment variable missing');
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server configuration error' }) };
        }

        if (password === process.env.ADMIN_PASSWORD) {
            console.log('login: Authentication successful');
            return { statusCode: 200, headers, body: JSON.stringify({ message: 'Authenticated' }) };
        } else {
            console.log('login: Invalid password');
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid password' }) };
        }
    } catch (error) {
        console.error('login: Error:', error.message, error.stack);
        return { statusCode: 500, headers, body: JSON.stringify({ error: `Failed to login: ${error.message}` }) };
    }
};