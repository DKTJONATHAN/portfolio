const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const yaml = require('js-yaml');
const marked = require('marked');
const sanitizeHtml = require('sanitize-html');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function generateFiles() {
    const { data: files } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: 'content/articles'
    });

    const posts = [];
    for (const file of files) {
        if (file.name.endsWith('.md')) {
            const { data: content } = await octokit.repos.getContent({
                owner: process.env.GITHUB_OWNER,
                repo: process.env.GITHUB_REPO,
                path: file.path
            });
            const fileContent = Buffer.from(content.content, 'base64').toString();
            const frontmatter = yaml.load(fileContent.split('---')[1]);
            const markdown = fileContent.split('---')[2];
            posts.push({
                slug: file.name.replace('.md', ''),
                title: frontmatter.title,
                date: frontmatter.date,
                category: frontmatter.category,
                tags: frontmatter.tags,
                image: frontmatter.image,
                content: sanitizeHtml(marked.parse(markdown))
            });
        }
    }

    fs.writeFileSync('posts.json', JSON.stringify(posts));
}

generateFiles().catch(console.error);