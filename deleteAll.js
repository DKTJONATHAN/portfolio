const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    try {
        const { type } = JSON.parse(event.body);
        
        if (!type) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing type' })
            };
        }
        
        const filePath = path.join(process.cwd(), `${type}.json`);
        
        // Write empty array to file
        fs.writeFileSync(filePath, JSON.stringify([], null, 2));
        
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'All items deleted successfully' })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error deleting items', error: error.message })
        };
    }
}; 