const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event) => {
    try {
        const { email } = JSON.parse(event.body);
        const filePath = path.join(process.cwd(), 'subscribers.json');
        
        let subscribers = [];
        try {
            const data = await fs.readFile(filePath, 'utf8');
            subscribers = JSON.parse(data);
        } catch (error) {
            // File doesn't exist or is empty
        }
        
        // Check if email already exists
        if (subscribers.some(sub => sub.email === email)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Email already subscribed' })
            };
        }
        
        subscribers.push({
            email,
            id: Date.now().toString(),
            timestamp: new Date().toISOString()
        });
        
        await fs.writeFile(filePath, JSON.stringify(subscribers, null, 2));
        
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to save subscriber' })
        };
    }
};