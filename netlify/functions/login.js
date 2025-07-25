exports.handler = async function (event) {
  try {
    const { password } = JSON.parse(event.body);

    if (!password) {
      throw new Error("Password is required");
    }

    // Compare provided password with ADMIN_PASSWORD environment variable (plain text)
    if (password !== process.env.ADMIN_PASSWORD) {
      throw new Error("Invalid password");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Login successful" }),
    };
  } catch (error) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: `Login failed: ${error.message}` }),
    };
  }
};