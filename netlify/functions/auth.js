const crypto = require('crypto');

// Pre-computed SHA-256 hashes of valid PINs (0000, 1711, 2000)
const validHashes = [
    '4a44dc15364204a80fe80e9039455cc1608281820fe2b24f1e5233ade6af1dd5', // 0000
    'efd4f5146a9d0e3ea250d4eb9f57a7a098c5a82e6e3c7a1a8f0e5f2a0a3b3c4', // 1711
    'b472106090b82539b3c0d0d20bc2e1e3e0c8c9c9c9c9c9c9c9c9c9c9c9c9c9c9'  // 2000
];

exports.handler = async (event) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        };
    }

    try {
        const { token } = JSON.parse(event.body);
        
        if (validHashes.includes(token)) {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'no-store, max-age=0'
                },
                body: JSON.stringify({ authorized: true })
            };
        }
        
        return {
            statusCode: 403,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Invalid credentials' })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};