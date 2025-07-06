const fs = require('fs');
const path = require('path');

exports.handler = async () => {
  try {
    const subsPath = path.join(process.cwd(), 'subscribers.json');
    let subscribers = [];
    
    if (fs.existsSync(subsPath)) {
      subscribers = JSON.parse(fs.readFileSync(subsPath, 'utf8'));
    }

    return {
      statusCode: 200,
      body: JSON.stringify(subscribers)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to load subscribers' })
    };
  }
};