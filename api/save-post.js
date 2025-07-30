import { Octokit } from '@octokit/rest';

// Handle cheerio import for both ES Modules and CommonJS
let cheerio;
try {
  cheerio = await import('cheerio');
} catch (err) {
  // Fallback for CommonJS
  cheerio = require('cheerio');
}

export default async function handler(req, res) {
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const metadataPath = `content/articles.json`;

    if (req.method === 'GET') {
      const { slug } = req.query;
      if (!slug) {
        return res.status(400).json({ error: 'Slug is required' });
      }

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

      const postMetadata = metadata.find(post => post.slug === slug);
      if (!postMetadata) {
        return res.status(404).json({ error: 'Post not found in metadata' });
      }

      const filePath = `content/articles/${slug}.html`.toLowerCase();
      let htmlContent;
      try {
        const { data } = await octokit.repos.getContent({
          owner: process.env.GITHUB_OWNER,
          repo: process.env.GITHUB_REPO,
          path: filePath,
        });
        htmlContent = Buffer.from(data.content, 'base64').toString('utf-8');
      } catch (error) {
        if (error.status === 404) {
          return res.status(404).json({ error: 'HTML file not found' });
        }
        throw error;
      }

      const $ = cheerio.load(htmlContent);
      const firstContent = $('.post-content').first().html() || '';
      const remainingContent = $('.post-content-remaining .post-content').html() || '';
      const content = (firstContent + remainingContent).trim();

      if (!content) {
        console.warn(`No content found in HTML for slug: ${slug}`);
      }

      return res.status(200).json({
        ...postMetadata,
        content: content || '',
      });
    }

    if (req.method === 'POST') {
      const { isUpdate, slug, title, description, image, date, category, tags, content } = req.body;
      if (!slug || !title || !date || !content || !description || !tags || !category) {
        return res.status(400).json({ error: 'Missing required fields: slug, title, date, content, description, tags, or category' });
      }

      const allowedCategories = ['News', 'Breaking News', 'Opinions', 'Business', 'Sports', 'Tech', 'Entertainment'];
      if (!allowedCategories.includes(category)) {
        return res.status(400).json({ error: `Invalid category. Must be one of: ${allowedCategories.join(', ')}` });
      }

      const filePath = `content/articles/${slug}.html`.toLowerCase();

      const isUrlLike = (str) => str && /^https?:\/\/.+/i.test(str);
      const isValidImageUrl = (str) => isUrlLike(str) && /\.(?:png|jpg|jpeg|gif|webp|svg)$/i.test(str);
      const fallbackImage = 'https://www.jonathanmwaniki.co.ke/images/Jonathan-Mwaniki-logo.png';
      const placeholderImage = 'https://via.placeholder.com/1200x630?text=Image+Not+Available';

      const extractFirstImage = (content) => {
        if (!content) return null;
        const imgRegex = /<img[^>]+src=["'](.*?)["']/i;
        const match = content.match(imgRegex);
        return match && isValidImageUrl(match[1]) ? match[1] : null;
      };

      const processContent = (content) => {
        if (!content) return content;
        const urlRegex = /(https?:\/\/[^\s<>"']+\.(?:png|jpg|jpeg|gif|webp|svg))/gi;
        return content.replace(urlRegex, (url) => {
          return `<img src="${isValidImageUrl(url) ? url : placeholderImage}" alt="Embedded image" class="content-image" />`;
        });
      };

      const adSnippet = `
<script type="text/javascript">
  atOptions = {
    'key' : '1610960d9ced232cc76d8f5510ee4608',
    'format' : 'iframe',
    'height' : 60,
    'width' : 468,
    'params' : {}
  };
</script>
<script type="text/javascript" src="//www.highperformanceformat.com/1610960d9ced232cc76d8f5510ee4608/invoke.js"></script>
`;

      const splitContent = (content) => {
        if (!content) return { firstThree: '', remaining: '' };
        const parts = content.split(/(<p[^>]*>.*?(?:[^>]+>|<\/p>))/);
        let paragraphCount = 0;
        let firstThree = [];
        let remaining = [];

        parts.forEach((part) => {
          if (part.match(/<p[^>]*>.*?(?:[^>]+>|<\/p>)/) && !part.includes('class="post-excerpt"')) {
            paragraphCount++;
            if (paragraphCount <= 3) {
              firstThree.push(part);
            } else {
              remaining.push(part);
            }
          } else {
            if (paragraphCount <= 3) {
              firstThree.push(part);
            } else {
              remaining.push(part);
            }
          }
        });

        return {
          firstThree: firstThree.join(''),
          remaining: remaining.join('')
        };
      };

      const firstContentImage = extractFirstImage(content);
      const mainImageUrl = isValidImageUrl(image) ? image : (firstContentImage || fallbackImage);

      const processedContent = processContent(content);
      const { firstThree, remaining } = splitContent(processedContent);

      const keywords = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag).join(', ') : '';

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="description" content="${description}">
          <meta name="keywords" content="${keywords}">
          <meta name="author" content="Jonathan Mwaniki">
          <meta name="robots" content="index, follow">
          <meta name="geo.region" content="KE">
          <meta name="geo.placename" content="Nairobi">
          <meta name="geo.position" content="-1.286389;36.817223">
          <title>${title} | Mwaniki Reports</title>
          <link rel="canonical" href="https://www.jonathanmwaniki.co.ke/content/articles/${slug}.html">
          <meta property="og:type" content="article">
          <meta property="og:url" content="https://www.jonathanmwaniki.co.ke/content/articles/${slug}.html">
          <meta property="og:title" content="${title}">
          <meta property="og:description" content="${description}">
          <meta property="og:image" content="${mainImageUrl}">
          <meta property="og:site_name" content="Mwaniki Reports">
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:site" content="@maestropuns">
          <meta name="twitter:creator" content="@maestropuns">
          <meta name="twitter:url" content="https://www.jonathanmwaniki.co.ke/content/articles/${slug}.html">
          <meta name="twitter:title" content="${title}">
          <meta name="twitter:description" content="${description}">
          <meta property="twitter:image" content="${mainImageUrl}">
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
          <style>
            :root {
              --primary-color: #1a73e8;
              --text-color: #333;
              --muted-color: #666;
              --bg-color: #fff;
              --border-color: #e0e0e0;
              --primary-dark: #3b82f6;
              --font-main: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: var(--font-main);
              line-height: 1.5;
              color: var(--text-color);
              background: var(--bg-color);
            }
            .blog-container {
              max-width: 800px;
              margin: 1.5rem auto;
              padding: 0 1rem;
            }
            .section-header {
              text-align: center;
              margin-bottom: 40px;
            }
            .section-title {
              font-size: 2.5rem;
              font-weight: 700;
              margin-bottom: 1rem;
            }
            .section-description {
              font-size: 1.1rem;
              color: var(--muted-color);
              max-width: 800px;
              margin: 0 auto;
            }
            .gradient-text {
              color: var(--text-color);
              font-weight: 700;
            }
            .post-title {
              font-size: 2rem;
              font-weight: 700;
              margin-bottom: 0.75rem;
              color: var(--text-color);
            }
            .post-meta {
              display: flex;
              gap: 0.75rem;
              font-size: 0.9rem;
              color: var(--muted-color);
              margin-bottom: 0.75rem;
            }
            .post-tags {
              display: flex;
              flex-wrap: wrap;
              gap: 0.5rem;
              margin-bottom: 1rem;
            }
            .post-tag {
              background: var(--border-color);
              padding: 0.25rem 0.75rem;
              border-radius: 1rem;
              font-size: 0.85rem;
              text-decoration: none;
              color: var(--text-color);
              transition: background 0.2s;
            }
            .post-tag:hover {
              background: var(--primary-color);
              color: #fff;
            }
            .post-image img {
              width: 100%;
              max-height: 350px;
              object-fit: cover;
              border-radius: 8px;
              margin-bottom: 1rem;
            }
            .post-content {
              font-size: 1rem;
              margin-bottom: 1.5rem;
            }
            .post-content p {
              margin-bottom: 0.75rem;
            }
            .post-content img.content-image {
              width: 100%;
              max-height: 350px;
              object-fit: cover;
              border-radius: 8px;
              margin: 1rem 0;
            }
            .post-excerpt {
              font-style: italic;
              color: var(--muted-color);
              margin-bottom: 1rem;
            }
            .post-footer {
              border-top: 1px solid var(--border-color);
              padding-top: 1rem;
              text-align: center;
              font-size: 0.9rem;
              color: var(--muted-color);
            }
            .post-footer p {
              margin-bottom: 0.5rem;
            }
            .post-footer .logo {
              max-width: 150px;
              margin: 1rem auto;
              display: block;
            }
            .post-footer .social-links {
              display: flex;
              justify-content: center;
              gap: 1rem;
              margin: 0.75rem 0;
            }
            .post-footer .social-links a {
              color: var(--primary-color);
              text-decoration: none;
              transition: color 0.2s;
            }
            .post-footer .social-links a:hover {
              color: #0d47a1;
            }
            .ad-space {
              width: 468px;
              height: 60px;
              display: block;
              margin: 1rem auto;
            }
            @media (max-width: 600px) {
              .post-title {
                font-size: 1.5rem;
              }
              .blog-container {
                margin: 1rem auto;
                padding: 0 0.75rem;
              }
              .post-meta {
                flex-direction: column;
                gap: 0.5rem;
              }
              .post-image img,
              .post-content img.content-image {
                max-height: 300px;
              }
              .post-footer .logo {
                max-width: 120px;
              }
              .ad-space {
                width: 100%;
                max-width: 468px;
              }
            }
          </style>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": "${title}",
            "image": "${mainImageUrl}",
            "datePublished": "${date}",
            "dateModified": "${date}",
            "author": {
              "@type": "Person",
              "name": "Jonathan Mwaniki"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Mwaniki Reports",
              "logo": {
                "@type": "ImageObject",
                "url": "https://www.jonathanmwaniki.co.ke/images/Jonathan-Mwaniki-logo.png"
              }
            },
            "description": "${description}",
            "keywords": "${keywords}",
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": "https://www.jonathanmwaniki.co.ke/content/articles/${slug}.html"
            }
          }
          </script>
        </head>
        <body>
          <main class="blog-container">
            <div class="section-header">
              <h1 class="section-title">Mwaniki <span class="gradient-text">Reports</span></h1>
              <p class="section-description">Your trusted source for news, sports, tech, and entertainment.</p>
            </div>
            <div class="ad-space">${adSnippet}</div>
            <article class="blog-post" itemscope itemtype="https://schema.org/BlogPosting">
              <meta itemprop="mainEntityOfPage" content="/content/articles/${slug}.html">
              <h1 class="post-title" itemprop="headline">${title}</h1>
              <div class="post-meta">
                <time datetime="${date}" itemprop="datePublished">${new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                <span class="post-category" itemprop="articleSection">${category}</span>
              </div>
              <div class="post-tags">
                ${tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag).map(tag => `<a href="/blogs.html?tag=${encodeURIComponent(tag)}" class="post-tag" itemprop="keywords">${tag}</a>`).join('') : ''}
              </div>
              <div class="ad-space">${adSnippet}</div>
              ${mainImageUrl ? `
              <div class="post-image">
                <img src="${mainImageUrl}" alt="${title}" itemprop="image">
              </div>
              ` : ''}
              <div class="post-content" itemprop="articleBody">
                ${description ? `<p class="post-excerpt" itemprop="description">${description}</p>` : ''}
                ${firstThree}
              </div>
              ${remaining ? `
              <div class="ad-space">${adSnippet}</div>
              <div class="post-content-remaining">
                <div class="post-content" itemprop="articleBody">
                  ${remaining}
                </div>
              </div>
              <div class="ad-space">${adSnippet}</div>
              ` : ''}
              <footer class="post-footer">
                <img src="/images/Jonathan-Mwaniki-logo.png" alt="Jonathan Mwaniki Logo" class="logo">
                <p>Written by <span itemprop="author">Jonathan Mwaniki</span></p>
                <p>Published on <time datetime="${date}" itemprop="datePublished">${new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time></p>
                <p>Last updated on <time datetime="${date}" itemprop="dateModified">${new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time></p>
                <div class="social-links">
                  <a href="https://x.com/intent/tweet?url=https%3A%2F%2Fwww.jonathanmwaniki.co.ke%2Fcontent%2Farticles%2F${encodeURIComponent(slug)}.html&text=${encodeURIComponent(title)}&via=Maestropuns" target="_blank"><i class="fab fa-x-twitter"></i> Share on X</a>
                  <a href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fwww.jonathanmwaniki.co.ke%2Fcontent%2Farticles%2F${encodeURIComponent(slug)}.html" target="_blank"><i class="fab fa-linkedin"></i> Share on LinkedIn</a>
                </div>
                <p>&copy; ${new Date().getFullYear()} Jonathan Mwaniki. All rights reserved.</p>
              </footer>
            </article>
          </main>
        </body>
        </html>
      `;

      const contentBase64 = Buffer.from(htmlContent).toString('base64');

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

      await octokit.repos.createOrUpdateFileContents({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: filePath,
        message: isUpdate ? `Update post: ${title}` : `Create post: ${title}`,
        content: contentBase64,
        sha: sha || undefined,
      });

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

      const postMetadata = {
        slug,
        title,
        description: description || '',
        image: mainImageUrl,
        date,
        category,
        tags: tags || '',
      };

      metadata = metadata.map(post => {
        const { content, ...rest } = post;
        return rest;
      });

      if (isUpdate) {
        metadata = metadata.map(post => (post.slug === slug ? postMetadata : post));
      } else {
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
        url: `https://www.jonathanmwaniki.co.ke/content/articles/${slug}.html`,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in handler:', error);
    return res.status(500).json({ error: `Failed to process request: ${error.message}` });
  }
}