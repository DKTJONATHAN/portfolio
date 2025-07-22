const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const blogDir = path.join('content', 'blog');
        const files = await fs.readdir(blogDir);
        const posts = await Promise.all(files.filter(file => file.endsWith('.md')).map(async file => {
            const content = await fs.readFile(path.join(blogDir, file), 'utf8');
            const [frontMatter, body] = content.split('---\n').slice(1);
            const metadata = {};
            frontMatter.split('\n').forEach(line => {
                const [key, value] = line.split(': ').map(s => s.trim());
                if (key && value) metadata[key] = value.replace(/^["']|["']$/g, '');
            });
            return { ...metadata, content: body, slug: file.replace('.md', '') };
        }));
        return { statusCode: 200, body: JSON.stringify(posts) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};