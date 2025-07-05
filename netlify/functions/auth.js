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
    
    // Validate input exists and is 4 digits
    if (!pin || !/^\d{4}$/.test(pin)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Please enter a 4-digit PIN' })
      };
    }

    // These are the ONLY valid raw PINs
    const validPins = ['1711', '0000'];
    
    // Compare directly (no hashing for guaranteed results)
    if (validPins.includes(pin)) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    } else {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Invalid PIN' })
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};