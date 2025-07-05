const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event) => {
    try {
        const { id } = JSON.parse(event.body);
        const filePath = path.join(process.cwd(), 'subscribers.json');
        
        let subscribers = [];
        try {
            const data = await fs.readFile(filePath, 'utf8');
            subscribers = JSON.parse(data);
        } catch (error) {
            // File doesn't exist or is empty
        }
        
        subscribers = subscribers.filter(sub => sub.id !== id);
        await fs.writeFile(filePath, JSON.stringify(subscribers, null, 2));
        
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to delete subscriber' })
        };
    }
};