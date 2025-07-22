const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const { slug } = JSON.parse(event.body);

    try {
        const filePath = path.join('content', 'blog', `${slug}.md`);
        await fs.unlink(filePath);
        return { statusCode: 200, body: JSON.stringify({ message: 'Post deleted successfully' }) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};