// netlify/functions/saveContact.js
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
        const { name, email, service, message } = data;

        // Validate required fields
        if (!name || !email || !service || !message) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'All fields are required' })
            };
        }

        // Path to the contact.json file in the parent directory
        const filePath = path.join(process.cwd(), '..', 'contact.json');
        const newEntry = {
            name,
            email,
            service,
            message,
            timestamp: new Date().toISOString()
        };

        // Read existing data or create new array if file doesn't exist
        let contacts = [];
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            contacts = JSON.parse(fileContent);
        }

        // Add new entry
        contacts.push(newEntry);

        // Write back to file
        fs.writeFileSync(filePath, JSON.stringify(contacts, null, 2));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Contact form submitted successfully' })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to process contact form' })
        };
    }
};