const { Octokit } = require('@octokit/rest');
const fs = require('fs').promises;
const path = require('path');
const marked = require('marked');
const yaml = require('js-yaml');

exports.handler = async function () {
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const postsDir = 'content/blog';
    const outputDir = path.join(__dirname, '../../content/articles');
    const template = await fs.readFile(path.join(__dirname, '../../blog-post.html'), 'utf8');

    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });

    // Clear existing HTML files
    const existingFiles = await fs.readdir(outputDir);
    for (const file of existingFiles) {
      if (file.endsWith('.html')) {
        await fs.unlink(path.join(outputDir, file));
      }
    }

    // Fetch Markdown files from GitHub
    const { data } = await octokit.repos.getContent({ owner, repo, path: postsDir });
    const posts = [];

    for (const file of data) {
      if (file.type === 'file' && file.name.endsWith('.md')) {
        const { data: fileData } = await octokit.repos.getContent({
          owner,
          repo,
          path: file.path,
        });
        const content = Buffer.from(fileData.content, 'base64').toString();
        const frontMatterMatch = content.match(/---\n([\s\S]*?)\n---\n([\s\S]*)/);
        if (frontMatterMatch) {
          const frontMatter = yaml.load(frontMatterMatch[1]);
          const markdownContent = frontMatterMatch[2];
          const slug = frontMatter.slug || file.name.replace('.md', '');
          const htmlContent = marked.parse(markdownContent);
          const dateFormatted = frontMatter.date ? new Date(frontMatter.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US');

          // Generate HTML
          const html = template
            .replace(/POST_TITLE/g, frontMatter.title || 'Untitled')
            .replace(/POST_DESCRIPTION/g, frontMatter.description || 'Read the latest insights from Mwaniki Reports.')
            .replace(/POST_SLUG/g, slug)
            .replace(/POST_DATE/g, frontMatter.date || new Date().toISOString().split('T')[0])
            .replace(/POST_DATE_FORMATTED/g, dateFormatted)
            .replace(/POST_CATEGORY/g, frontMatter.category || 'Uncategorized')
            .replace(/POST_IMAGE/g, frontMatter.image || '/images/default-blog.jpg')
            .replace(/POST_CONTENT/g, htmlContent)
            .replace(/POST_TAGS/g, frontMatter.tags ? frontMatter.tags.map(tag => `<a href="/blog.html?tag=${encodeURIComponent(tag)}" class="post-tag">${tag}</a>`).join('') : '');

          await fs.writeFile(path.join(outputDir, `${slug}.html`), html);

          // Collect post data
          posts.push({
            slug,
            title: frontMatter.title || 'Untitled',
            description: frontMatter.description || '',
            date: frontMatter.date || new Date().toISOString().split('T')[0],
            category: frontMatter.category || 'Uncategorized',
            image: frontMatter.image || '/images/default-blog.jpg',
            content: htmlContent,
            tags: frontMatter.tags || [],
          });
        }
      }
    }

    // Generate sitemap.xml
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.jonathanmwaniki.co.ke/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.jonathanmwaniki.co.ke/blog.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.jonathanmwaniki.co.ke/privacy-policy</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://www.jonathanmwaniki.co.ke/terms-of-service</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>`;

    posts.forEach(post => {
      sitemap += `
  <url>
    <loc>https://www.jonathanmwaniki.co.ke/content/articles/${post.slug}.html</loc>
    <lastmod>${post.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    sitemap += `
</urlset>`;
    await fs.writeFile(path.join(__dirname, '../../sitemap.xml'), sitemap);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Files generated successfully', posts: posts.length }),
    };
  } catch (error) {
    console.error('Error generating files:', error.message, error.stack);
    return {
      statusCode: error.status || 500,
      body: JSON.stringify({ error: `Failed to generate files: ${error.message}` }),
    };
  }
};