const fs = require('fs');
const path = require('path');

exports.handler = async () => {
  try {
    const formsPath = path.join(process.cwd(), 'forms.json');
    let forms = [];
    
    if (fs.existsSync(formsPath)) {
      forms = JSON.parse(fs.readFileSync(formsPath, 'utf8'));
    }

    return {
      statusCode: 200,
      body: JSON.stringify(forms)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to load forms' })
    };
  }
};