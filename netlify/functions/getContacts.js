const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    try {
        const contactsPath = path.join(process.cwd(), 'contact.json');
        
        // Check if file exists first
        if (!fs.existsSync(contactsPath)) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify([])
            };
        }

        const data = fs.readFileSync(contactsPath, 'utf8');
        const contacts = JSON.parse(data);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contacts)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                error: 'Failed to load contacts',
                details: error.message 
            })
        };
    }
};