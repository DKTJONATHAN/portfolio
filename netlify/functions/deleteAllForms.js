const fs = require('fs').promises;
const path = require('path');

exports.handler = async () => {
    try {
        const filePath = path.join(process.cwd(), 'forms.json');
        await fs.writeFile(filePath, JSON.stringify([], null, 2));
        
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to clear forms' })
        };
    }
};