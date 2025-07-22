const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
    const { password } = JSON.parse(event.body);
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'your-secure-password'; // Set in Netlify dashboard

    if (password === ADMIN_PASSWORD) {
        const token = jwt.sign({ user: 'admin' }, 'your-jwt-secret', { expiresIn: '1h' });
        return {
            statusCode: 200,
            body: JSON.stringify({ token })
        };
    }
    return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid password' })
    };
};