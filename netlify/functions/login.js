exports.handler = async (event) => {
    const { password } = JSON.parse(event.body);

    if (!password) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Password is required' })
        };
    }

    const adminPassword = process.env.ADMIN_PASSWORD;

    if (password !== adminPassword) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Invalid password' })
        };
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Login successful' })
    };
};