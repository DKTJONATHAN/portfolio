const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    try {
        const subsPath = path.join(process.cwd(), 'subscribers.json');
        
        // Check if file exists first
        if (!fs.existsSync(subsPath)) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify([])
            };
        }

        const data = fs.readFileSync(subsPath, 'utf8');
        const subscribers = JSON.parse(data);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscribers)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                error: 'Failed to load subscribers',
                details: error.message 
            })
        };
    }
};