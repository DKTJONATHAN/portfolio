const fs = require('fs').promises;
const path = require('path');

exports.handler = async () => {
    try {
        const filePath = path.join(process.cwd(), 'subscribers.json');
        const data = await fs.readFile(filePath, 'utf8');
        const subscribers = JSON.parse(data);
        
        return {
            statusCode: 200,
            body: JSON.stringify(subscribers)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to read subscribers data' })
        };
    }
};