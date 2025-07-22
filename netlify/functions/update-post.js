const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const { title, slug, category, tags, image, date, content } = JSON.parse(event.body);

    try {
        const filePath = path.join('content', 'blog', `${slug}.md`);
        const markdownContent = `---
title: ${title}
slug: ${slug}
category: ${category}
tags: [${tags.join(', ')}]
image: ${image || ''}
date: ${date}
---
${content}
`;

        await fs.writeFile(filePath, markdownContent, 'utf8');
        return { statusCode: 200, body: JSON.stringify({ message: 'Post updated successfully' }) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};