const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    try {
        const { type, id } = JSON.parse(event.body);
        
        if (!type || !id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing type or id' })
            };
        }
        
        const filePath = path.join(process.cwd(), `${type}s.json`);
        
        // Read existing data
        let existingData = [];
        try {
            const fileData = fs.readFileSync(filePath, 'utf8');
            existingData = JSON.parse(fileData);
        } catch (err) {
            if (err.code !== 'ENOENT') throw err;
        }
        
        // Filter out the item to delete
        const updatedData = existingData.filter(item => item.timestamp !== id);
        
        // Write back to file
        fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
        
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Item deleted successfully' })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error deleting item', error: error.message })
        };
    }
}; 
