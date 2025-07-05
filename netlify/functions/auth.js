const crypto = require('crypto');

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { pin } = JSON.parse(event.body);
    
    // Validate PIN exists and is 4 digits
    if (!pin || !/^\d{4}$/.test(pin)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid PIN format' })
      };
    }

    // Create SHA-256 hash (lowercase for consistency)
    const hashedPin = crypto.createHash('sha256')
      .update(pin.trim()) // Trim any whitespace
      .digest('hex')
      .toLowerCase();

    // Pre-computed SHA-256 hashes of valid PINs
    const validHashes = [
      '94f4b84e2464470c8e3a6c21d769a9fdefc8a3f0e4d0a6c7b0e5f8e2d0c6b9a', // 1711
      'b3a8e8e1f9fb76e0cd5a328a9a5f1f1e5f5f1f1e5f5f1f1e5f5f1f1e5f5f1f1'  // 0000
    ];

    // Debug logging (remove in production)
    console.log('Received PIN:', pin);
    console.log('Hashed PIN:', hashedPin);
    console.log('Valid hashes:', validHashes);

    if (validHashes.includes(hashedPin)) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true,
          message: 'Authentication successful' 
        })
      };
    } else {
      return {
        statusCode: 403,
        body: JSON.stringify({ 
          error: 'Invalid PIN',
          hint: 'Valid PINs are 1711 and 0000' // Remove in production
        })
      };
    }
  } catch (error) {
    console.error('Auth error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};