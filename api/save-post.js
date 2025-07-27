import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  try {
    // Validate request method
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Extract and validate request body
    const { isUpdate, slug, title, description, image, date, category, tags, content } = req.body;
    if (!slug || !title || !date || !content) {
      return res.status(400).json({ error: 'Missing required fields: slug, title, date, or content' });
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const filePath = `content/articles/${slug}.html`;
    const metadataPath = `content/articles.json`;

    // Validate image URLs (basic check for URL-like strings)
    const isUrlLike = (str) => str && /^https?:\/\/.+/i.test(str);
    const isValidImageUrl = (str) => isUrlLike(str) && /\.(?:png|jpg|jpeg|gif|webp|svg)$/i.test(str);
    const placeholderImage = 'https://via.placeholder.com/800x400?text=Image+Not+Available';

    // Process content to ensure image URLs are rendered as <img> tags
    const processContent = (content) => {
      if (!content) return content;
      // Regular expression to match standalone URLs that look like images
      const urlRegex = /(https?:\/\/[^\s<>"']+\.(?:png|jpg|jpeg|gif|webp|svg))/gi;
      return content.replace(urlRegex, (url) => {
        return `<img src="${isValidImageUrl(url) ? url : placeholderImage}" alt="Embedded image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 1em 0;" />`;
      });
    };

    // Process main image and content
    const mainImageUrl = isUrlLike(image) ? (isValidImageUrl(image) ? image : placeholderImage) : null;
    const processedContent = processContent(content);

    // Generate HTML content with professional article layout
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} | Mwaniki Reports</title>
        <link rel="stylesheet" href="/content/blog-style.css">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
        <style>
          .blog-container { max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
          .post-title { font-size: 2.5em; margin-bottom: 0.5em; }
          .post-meta { display: flex; gap: 15px; color: #666; margin-bottom: 1em; }
          .post-tags { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 1.5em; }
          .post-tag { background: #e0e0e0; padding: 5px 10px; border-radius: 5px; text-decoration: none; color: #333; }
          .post-image img { max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 1.5em; }
          .post-content { line-height: 1.6; font-size: 1.1em; }
          .post-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 1em 0; }
          .post-footer { margin-top: 2em; padding-top: 1em; border-top: 1px solid #e0e0e0; text-align: center; color: #666; }
          .post-footer .social-links a { margin: 0 10px; color: #333; }
        </style>
      </head>
      <body>
        <main class="blog-container">
          <article class="blog-post" itemscope itemtype="https://schema.org/BlogPosting">
            <meta itemprop="mainEntityOfPage" content="/content/articles/${slug}.html">
            <h1 class="post-title" itemprop="headline">${title}</h1>
            <div class="post-meta">
              <time datetime="${date}" itemprop="datePublished">${new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
              <span class="post-category" itemprop="articleSection">${category || 'Uncategorized'}</span>
            </div>
            ${tags ? `
              <div class="post-tags">
                ${tags.split(',').map(tag => tag.trim()).filter(tag => tag).map(tag => `<a href="/blogs.html?tag=${encodeURIComponent(tag)}" class="post-tag" itemprop="keywords">${tag}</a>`).join('')}
              </div>
            ` : ''}
            ${mainImageUrl ? `<div class="post-image"><img src="${mainImageUrl}" alt="${title}" itemprop="image"></div>` : ''}
            <div class="post-content" itemprop="articleBody">
              ${description ? `<p class="post-excerpt" itemprop="description">${description}</p>` : ''}
              ${processedContent}
            </div>
            <footer class="post-footer">
              <p>Written by <span itemprop="author">Jonathan Mwaniki</span></p>
              <p>Published on <time datetime="${date}" itemprop="datePublished">${new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time></p>
              <p>Last updated on <time datetime="${date}" itemprop="dateModified">${new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time></p>
              <div class="social-links">
                <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://your-site.com/content/articles/${slug}.html`)}&text=${encodeURIComponent(title)}" target="_blank"><i class="fab fa-twitter"></i> Share on Twitter</a>
                <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://your-site.com/content/articles/${slug}.html`)}" target="_blank"><i class="fab fa-linkedin"></i> Share on LinkedIn</a>
              </div>
              <p>&copy; ${new Date().getFullYear()} Mwaniki Reports. All rights reserved.</p>
            </footer>
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

    // Prepare metadata object with all fields
    const postMetadata = {
      slug,
      title,
      description: description || '',
      image: isUrlLike(image) ? image : null,
      date,
      category: category || 'Uncategorized',
      tags: tags || '',
      content, // Include raw content in metadata
    };

    if (isUpdate) {
      // Update existing post metadata
      metadata = metadata.map(post => (post.slug === slug ? postMetadata : post));
    } else {
      // Check for duplicate slug
      if (metadata.some(post => post.slug === slug)) {
        return res.status(400).json({ error: 'Slug already exists' });
      }
      metadata.push(postMetadata);
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

    // Save or update metadata file
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
      url: `/content/articles/${slug}.html`,
    });
  } catch (error) {
    console.error('Error saving post:', error);
    return res.status(500).json({ error: `Failed to save post: ${error.message}` });
  }
}