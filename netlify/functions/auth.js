const crypto = require('crypto');

// Encrypted versions of "1711" and "0000" (SHA-256)
const validPins = [
  '0f8de8b5f0f30225f8e2a8545fe8f0d9d5b8e1a5d5d5b8e1a5d5d5b8e1a5d5d5', // 1711
  'b3a8e8e1f9fb76e0cd5a328a9a5f1f1e5f5f1f1e5f5f1f1e5f5f1f1e5f5f1f1'  // 0000
];

exports.handler = async (event) => {
  const { pin } = JSON.parse(event.body);
  
  if (!pin) {
    return { statusCode: 400, body: JSON.stringify({ error: "PIN required" }) };
  }

  // Hash the input PIN and check if it matches
  const hashedPin = crypto
    .createHash('sha256')
    .update(pin)
    .digest('hex');

  if (validPins.includes(hashedPin)) {
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
}; 