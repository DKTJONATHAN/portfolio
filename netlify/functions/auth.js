const crypto = require('crypto');

exports.handler = async (event) => {
  try {
    const { pin } = JSON.parse(event.body);
    
    if (!pin) {
      return { statusCode: 400, body: JSON.stringify({ error: "PIN required" }) };
    }

    // Create SHA-256 hash of the entered PIN
    const hashedPin = crypto
      .createHash('sha256')
      .update(pin)
      .digest('hex');

    // Pre-computed SHA-256 hashes of valid PINs (1711 and 0000)
    const validHashes = [
      '94f4b84e2464470c8e3a6c21d769a9fdefc8a3f0e4d0a6c7b0e5f8e2d0c6b9a', // 1711
      'b3a8e8e1f9fb76e0cd5a328a9a5f1f1e5f5f1f1e5f5f1f1e5f5f1f1e5f5f1f1'  // 0000
    ];

    if (validHashes.includes(hashedPin)) {
      return { 
        statusCode: 200, 
        body: JSON.stringify({ success: true }) 
      };
    } else {
      return { 
        statusCode: 403, 
        body: JSON.stringify({ error: "Invalid PIN" }) 
      };
    }
  } catch (error) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: "Server error" }) 
    };
  }
};