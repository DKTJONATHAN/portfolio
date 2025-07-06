// netlify/functions/saveSubscriber.js
const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed'
        };
    }

    try {
        const data = JSON.parse(event.body);
        const { email, source } = data;

        // Validate email
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Valid email is required' })
            };
        }

        // Path to the subscribers.json file in the parent directory
        const filePath = path.join(process.cwd(), '..', 'subscribers.json');
        const newEntry = {
            email,
            source: source || 'website',
            timestamp: new Date().toISOString(),
            active: true
        };

        // Read existing data or create new array if file doesn't exist
        let subscribers = [];
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            subscribers = JSON.parse(fileContent);
        }

        // Check if email already exists
        const exists = subscribers.some(sub => sub.email === email);
        if (exists) {
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Email already subscribed' })
            };
        }

        // Add new subscriber
        subscribers.push(newEntry);

        // Write back to file
        fs.writeFileSync(filePath, JSON.stringify(subscribers, null, 2));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Subscription successful' })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to process subscription' })
        };
    }
};