const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    try {
        // Parse the incoming data
        const data = JSON.parse(event.body);
        
        // Define the path to the contact.json file
        const filePath = path.join(process.cwd(), '..', 'contact.json');
        
        // Read existing data or initialize empty array
        let contacts = [];
        if (fs.existsSync(filePath)) {
            contacts = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        
        // Add new contact
        contacts.push(data);
        
        // Write back to file
        fs.writeFileSync(filePath, JSON.stringify(contacts, null, 2));
        
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Contact saved successfully' })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};