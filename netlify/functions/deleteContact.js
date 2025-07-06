const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
            headers: { 
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        };
    }

    try {
        const formData = JSON.parse(event.body);
        
        // Validate required fields
        if (!formData.name || !formData.email || !formData.message) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields' }),
                headers: { 'Access-Control-Allow-Origin': '*' }
            };
        }

        // Get the path to forms.json in the parent directory
        const formsPath = path.resolve(__dirname, '..', 'forms.json');
        
        let forms = [];

        // Check if file exists and read current forms
        if (fs.existsSync(formsPath)) {
            forms = JSON.parse(fs.readFileSync(formsPath, 'utf8'));
        }

        // Add new form submission with unique ID
        const newForm = {
            id: Date.now().toString(),
            ...formData,
            timestamp: new Date().toISOString(),
            ip: event.headers['client-ip'] || null, // Capture IP address if available
            userAgent: event.headers['user-agent'] || null // Capture user agent
        };

        forms.push(newForm);

        // Write updated forms list to file
        fs.writeFileSync(formsPath, JSON.stringify(forms, null, 2));

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                formId: newForm.id,
                message: 'Form submitted successfully'
            }),
            headers: { 'Access-Control-Allow-Origin': '*' }
        };
    } catch (error) {
        console.error('Error saving form:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Internal Server Error',
                details: error.message 
            }),
            headers: { 'Access-Control-Allow-Origin': '*' }
        };
    }
};
