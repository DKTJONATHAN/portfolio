const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
    try {
        // Only allow POST requests
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                body: JSON.stringify({ error: 'Method not allowed' })
            };
        }

        // Parse the form data
        const data = JSON.parse(event.body);
        const formType = data.formType || 'unknown';
        const timestamp = new Date().toISOString();

        // Prepare the form entry
        const formEntry = {
            type: formType,
            data: data,
            timestamp: timestamp
        };

        // Path to the forms.json file
        const dataDir = path.join(process.cwd(), 'data');
        const filePath = path.join(dataDir, 'forms.json');

        // Create data directory if it doesn't exist
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Read existing data or initialize empty array
        let formsData = [];
        if (fs.existsSync(filePath)) {
            formsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }

        // Add new form entry
        formsData.push(formEntry);

        // Write back to file
        fs.writeFileSync(filePath, JSON.stringify(formsData, null, 2));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Form submitted successfully' })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};