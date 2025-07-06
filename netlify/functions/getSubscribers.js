const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    try {
        const subsPath = path.join(process.cwd(), 'subscribers.json');
        const subsData = JSON.parse(fs.readFileSync(subsPath, 'utf8'));
        
        return {
            statusCode: 200,
            body: JSON.stringify(subsData)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to load subscribers' })
        };
    }
};