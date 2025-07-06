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
        const contactsPath = path.join(process.cwd(), 'contact.json');
        
        // Read current contacts
        let contacts = [];
        if (fs.existsSync(contactsPath)) {
            contacts = JSON.parse(fs.readFileSync(contactsPath, 'utf8'));
        }

        // Filter out the contact to delete
        const initialLength = contacts.length;
        contacts = contacts.filter(contact => contact.email !== email);

        // If nothing was deleted
        if (contacts.length === initialLength) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Contact not found' })
            };
        }

        // Save updated contacts
        fs.writeFileSync(contactsPath, JSON.stringify(contacts, null, 2));

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true,
                message: 'Contact deleted successfully',
                remainingContacts: contacts.length
            })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Failed to delete contact',
                details: error.message 
            })
        };
    }
};
