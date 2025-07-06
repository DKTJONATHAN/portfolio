const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const data = JSON.parse(event.body);
        const dir = path.join(process.cwd(), 'data');
        const filePath = path.join(dir, `${data.formType}.json`);

        // Create data directory if it doesn't exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        // Read existing data
        let fileData = [];
        if (fs.existsSync(filePath)) {
            fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }

        // Add new data
        fileData.push(data);

        // Write back to file
        fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };
    } catch (error) {
        return { 
            statusCode: 500, 
            body: JSON.stringify({ 
                success: false,
                error: error.message || 'Failed to save data'
            }) 
        };
    }
};