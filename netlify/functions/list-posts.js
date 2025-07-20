const fs = require('fs').promises;
const path = require('path');

exports.handler = async function () {
  try {
    const blogDir = path.join(__dirname, '../content/blog');
    const files = await fs.readdir(blogDir);
    const mdFiles = files.filter(file => file.endsWith('.md'));
    return {
      statusCode: 200,
      body: JSON.stringify(mdFiles),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to list posts' }),
    };
  }
};