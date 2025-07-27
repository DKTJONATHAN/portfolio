import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { isUpdate, slug, title, description, image, date, category, tags, content } = req.body;

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const filePath = `content/articles/${slug}.html`;
    const metadataPath = `content/articles.json`;

    // Generate HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title || 'Untitled Post'} | Mwaniki Reports</title>
        <link rel="stylesheet" href="/content/blog-style.css">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
      </head>
      <body>
        <main class="blog-container">
          <article class="blog-post" itemscope itemtype="https://schema.org/BlogPosting">
            <meta itemprop="mainEntityOfPage" content="/content/articles/${slug}.html">
            ${image ? `<div class="post-image"><img src="${image}" alt="${title || 'Post image'}" itemprop="image"></div>` : ''}
            <div class="post-content">
              <div class="post-meta">
                <time datetime="${date}" itemprop="datePublished">${new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                <span class="post-category" itemprop="articleSection">${category || 'Uncategorized'}</span>
              </div>
              <h1 class="post-title" itemprop="headline">${title || 'Untitled Post'}</h1>
              ${description ? `<div class="post-excerpt" itemprop="description">${description}</div>` : ''}
              <div class="post-body">${content}</div>
              ${tags ? `
              <div class="post-tags">
                ${tags.split(',').map(tag => tag.trim()).filter(tag => tag).map(tag => `<a href="/blogs.html?tag=${encodeURIComponent(tag)}" class="post-tag" itemprop="keywords">${tag}</a>`).join('')}
              </div>
              ` : ''}
            </div>
            <meta itemprop="author" content="Jonathan Mwaniki">
            <meta itemprop="dateModified" content="${date}">
            <meta itemprop="publisher" content="Mwaniki Reports">
          </article>
        </main>
      </body>
      </html>
    `;

    const contentBase64 = Buffer.from(htmlContent).toString('base64');

    // Check if the file exists to get its SHA (for updates)
    let sha;
    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: filePath,
      });
      sha = data.sha;
    } catch (error) {
      if (error.status !== 404) throw error;
    }

    // Save or update the HTML file
    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: filePath,
      message: isUpdate ? `Update post: ${title}` : `Create post: ${title}`,
      content: contentBase64,
      sha: sha || undefined,
    });

    // Update metadata.json
    let metadata = [];
    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: metadataPath,
      });
      metadata = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
    } catch (error) {
      if (error.status !== 404) throw error;
    }

    if (isUpdate) {
      metadata = metadata.map(post => post.slug === slug ? { slug, title, description, image, date, category, tags } : post);
    } else {
      if (metadata.some(post => post.slug === slug)) {
        return res.status(400).json({ error: 'Slug already exists' });
      }
      metadata.push({ slug, title, description, image, date, category, tags });
    }

    const metadataContent = Buffer.from(JSON.stringify(metadata, null, 2)).toString('base64');
    let metadataSha;
    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: metadataPath,
      });
      metadataSha = data.sha;
    } catch (error) {
      if (error.status !== 404) throw error;
    }

    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: metadataPath,
      message: isUpdate ? `Update metadata for post: ${title}` : `Add metadata for post: ${title}`,
      content: metadataContent,
      sha: metadataSha || undefined,
    });

    return res.status(200).json({
      message: 'Post saved successfully',
      url: `/content/articles/${slug}.html`
    });
  } catch (error) {
    return res.status(500).json({ error: `Failed to save post: ${error.message}` });
  }
}