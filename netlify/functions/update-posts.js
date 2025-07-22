const { Octokit } = require('@octokit/rest');
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

exports.handler = async (event) => {
    const { title, slug, category, tags, image, excerpt, date, content } = JSON.parse(event.body);
    const path = `content/blog/${slug}.md`;
    const frontmatter = `---
title: "${title}"
date: ${date}
category: ${category}
tags: ${tags.join(', ')}
image: ${image || ''}
excerpt: ${excerpt || ''}
---
${content}`;

    try {
        const { data: { sha } } = await octokit.repos.getContent({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path
        });
        await octokit.repos.createOrUpdateFileContents({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path,
            message: `Update post ${slug}`,
            content: Buffer.from(frontmatter).toString('base64'),
            sha
        });
        return { statusCode: 200, body: JSON.stringify({ message: 'Post updated' }) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};