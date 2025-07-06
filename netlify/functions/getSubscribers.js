const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { email } = JSON.parse(event.body);
        const subsPath = path.join(process.cwd(), 'subscribers.json');
        
        // Read current subscribers
        let subscribers = [];
        if (fs.existsSync(subsPath)) {
            subscribers = JSON.parse(fs.readFileSync(subsPath, 'utf8'));
        }

        // Filter out the subscriber to delete
        const initialLength = subscribers.length;
        subscribers = subscribers.filter(sub => sub.email !== email);

        // If nothing was deleted
        if (subscribers.length === initialLength) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Subscriber not found' })
            };
        }

        // Save updated subscribers
        fs.writeFileSync(subsPath, JSON.stringify(subscribers, null, 2));

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true,
                message: 'Subscriber deleted successfully',
                remainingSubscribers: subscribers.length
            })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Failed to delete subscriber',
                details: error.message 
            })
        };
    }
};