const bcrypt = require('bcryptjs');

exports.handler = async (event) => {
  try {
    const { password } = JSON.parse(event.body);
    
    if (!password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Password is required" })
      };
    }

    // Compare with hashed admin password from environment
    const isMatch = await bcrypt.compare(password, process.env.ADMIN_PASSWORD);

    if (!isMatch) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid password" })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};