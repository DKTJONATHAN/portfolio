// netlify/functions/login.js
exports.handler = async (event) => {
  try {
    // Parse the incoming request
    const { password } = JSON.parse(event.body);
    
    if (!password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Password is required" })
      };
    }

    // Compare with the password from environment variables
    if (password !== process.env.ADMIN_PASSWORD) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid password" })
      };
    }

    // Successful login
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