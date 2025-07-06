const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
            headers: { 'Access-Control-Allow-Origin': '*' }
        };
    }

    try {
        const { email } = JSON.parse(event.body);
        
        // Get the path to subscribers.json in the parent directory
        const subsPath = path.resolve(__dirname, '..', 'subscribers.json');
        
        let subscribers = [];

        // Check if file exists and read current subscribers
        if (fs.existsSync(subsPath)) {
            subscribers = JSON.parse(fs.readFileSync(subsPath, 'utf8'));
        }

        // Check if email already exists
        if (subscribers.some(sub => sub.email === email)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Email already subscribed' }),
                headers: { 'Access-Control-Allow-Origin': '*' }
            };
        }

        // Add new subscriber with unique ID
        const newSubscriber = {
            id: Date.now().toString(),
            email,
            timestamp: new Date().toISOString()
        };
        subscribers.push(newSubscriber);

        // Write updated subscribers list to file
        fs.writeFileSync(subsPath, JSON.stringify(subscribers, null, 2));

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, subscriber: newSubscriber }),
            headers: { 'Access-Control-Allow-Origin': '*' }
        };
    } catch (error) {
        console.error('Error saving subscriber:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
            headers: { 'Access-Control-Allow-Origin': '*' }
        };
    }
};