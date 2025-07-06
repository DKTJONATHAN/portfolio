const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { formType, email, name } = JSON.parse(event.body);
        const filePath = path.join(process.cwd(), 'data', `${formType}.json`);

        if (!fs.existsSync(filePath)) {
            return { 
                statusCode: 200,
                body: JSON.stringify({ exists: false })
            };
        }

        const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const exists = fileData.some(item => {
            if (formType === 'newsletter') {
                return item.email === email;
            } else {
                return item.email === email && item.name === name;
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ exists })
        };
    } catch (error) {
        return { 
            statusCode: 500, 
            body: JSON.stringify({ 
                exists: false,
                error: error.message || 'Verification failed'
            }) 
        };
    }
};