const fs = require('fs').promises;
const path = require('path');
const marked = require('marked');

exports.handler = async function (event, context) {
  try {
    const postsDir = path.join(__dirname, '../../content/blog');
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

    // Read Markdown files
    const files = await fs.readdir(postsDir);
    const posts = [];

    for (const file of files) {
      if (file.endsWith('.md')) {
        const mdContent = await fs.readFile(path.join(postsDir, file), 'utf8');
        const frontMatterMatch = mdContent.match(/---\n([\s\S]*?)\n---/);
        const frontMatter = frontMatterMatch ? frontMatterMatch[1] : '';
        const content = mdContent.replace(/---\n[\s\S]*?\n---/, '');
        const metadata = frontMatter.split('\n').reduce((acc, line) => {
          const [key, value] = line.split(':').map(s => s.trim());
          if (key && value) acc[key] = value;
          return acc;
        }, {});
        const slug = metadata.slug || file.replace('.md', '');
        const htmlContent = marked.parse(content);
        const dateFormatted = metadata.date ? new Date(metadata.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US');

        // Generate HTML
        const html = template
          .replace(/POST_TITLE/g, metadata.title || 'Untitled')
          .replace(/POST_DESCRIPTION/g, metadata.description || 'Read the latest insights from Mwaniki Reports.')
          .replace(/POST_SLUG/g, slug)
          .replace(/POST_DATE/g, metadata.date || new Date().toISOString().split('T')[0])
          .replace(/POST_DATE_FORMATTED/g, dateFormatted)
          .replace(/POST_CATEGORY/g, metadata.category || 'Uncategorized')
          .replace(/POST_IMAGE/g, metadata.image || '/images/Jonathan-Mwaniki-logo.png')
          .replace(/POST_CONTENT/g, htmlContent);
        await fs.writeFile(path.join(outputDir, `${slug}.html`), html);

        // Collect post data for sitemap and API
        posts.push({
          slug,
          title: metadata.title || 'Untitled',
          description: metadata.description || '',
          date: metadata.date || new Date().toISOString().split('T')[0],
          category: metadata.category || 'Uncategorized',
          image: metadata.image || '/images/Jonathan-Mwaniki-logo.png',
          content: htmlContent
        });
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

    // Update list-posts function response
    return {
      statusCode: 200,
      body: JSON.stringify(posts)
    };
  } catch (error) {
    console.error('Error generating files:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate files' })
    };
  }
};