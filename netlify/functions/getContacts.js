const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    try {
        const contactsPath = path.join(process.cwd(), 'contact.json');
        const contactsData = JSON.parse(fs.readFileSync(contactsPath, 'utf8'));
        
        return {
            statusCode: 200,
            body: JSON.stringify(contactsData)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to load contacts' })
        };
    }
};