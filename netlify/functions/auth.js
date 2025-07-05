// Plain-text PIN verification
const validPins = ['0000', '1711', '2000'];
let failedAttempts = 0;
const MAX_ATTEMPTS = 5;
const BLOCK_TIME_MS = 5 * 60 * 1000; // 5 minutes
let lastFailedAttempt = 0;

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
        const { pin } = JSON.parse(event.body);
        
        // Check if temporarily blocked
        const now = Date.now();
        if (failedAttempts >= MAX_ATTEMPTS && (now - lastFailedAttempt) < BLOCK_TIME_MS) {
            return {
                statusCode: 429,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Too many attempts. Try again later.' })
            };
        }

        if (validPins.includes(pin)) {
            failedAttempts = 0; // Reset on success
            return {
                statusCode: 200,
                headers: { 
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'no-store'
                },
                body: JSON.stringify({ authorized: true })
            };
        }
        
        // Track failed attempts
        failedAttempts++;
        lastFailedAttempt = now;
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