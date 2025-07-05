const fs = require('fs').promises;
const path = require('path');

exports.handler = async () => {
    try {
        const filePath = path.join(process.cwd(), 'forms.json');
        const data = await fs.readFile(filePath, 'utf8');
        const forms = JSON.parse(data);
        
        return {
            statusCode: 200,
            body: JSON.stringify(forms)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to read forms data' })
        };
    }
};