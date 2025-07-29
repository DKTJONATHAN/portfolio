import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  try {
    // Validate request method
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Extract and validate request body
    const { isUpdate, slug, title, description, image, date, category, tags, content } = req.body;
    if (!slug || !title || !date || !content || !description || !tags || !category) {
      return res.status(400).json({ error: 'Missing required fields: slug, title, date, content, description, tags, or category' });
    }

    // Define allowed categories from the admin panel dropdown
    const allowedCategories = ['News', 'Breaking News', 'Opinions', 'Business', 'Sports', 'Tech', 'Entertainment'];
    
    // Validate category
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${allowedCategories.join(', ')}` });
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const filePath = `content/articles/${slug}.html`;
    const metadataPath = `content/articles.json`;

    // Validate image URLs
    const isUrlLike = (str) => str && /^https?:\/\/.+/i.test(str);
    const isValidImageUrl = (str) => isUrlLike(str) && /\.(?:png|jpg|jpeg|gif|webp|svg)$/i.test(str);
    const fallbackImage = 'https://www.jonathanmwaniki.co.ke/images/Jonathan-Mwaniki-logo.png';
    const placeholderImage = 'https://via.placeholder.com/1200x630?text=Image+Not+Available';

    // Extract first image from content
    const extractFirstImage = (content) => {
      if (!content) return null;
      const imgRegex = /<img[^>]+src=["'](.*?)["']/i;
      const match = content.match(imgRegex);
      return match && isValidImageUrl(match[1]) ? match[1] : null;
    };

    // Ad snippet to be used exactly as provided
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

    // Split content into first three paragraphs and remaining content
    const splitContent = (content) => {
      if (!content) return { firstThree: '', remaining: '' };
      const parts = content.split(/(<p[^>]*>.*?<\/p>)/);
      let paragraphCount = 0;
      let firstThree = [];
      let remaining = [];
      let inFirstThree = true;

      parts.forEach((part) => {
        if (part.match(/<p[^>]*>.*?<\/p>/) && !part.includes('class="post-excerpt"')) {
          paragraphCount++;
          if (paragraphCount <= 3) {
            firstThree.push(part);
            if (paragraphCount === 2) {
              firstThree.push(adSnippet);
            }
          } else {
            inFirstThree = false;
            remaining.push(part);
            if (paragraphCount % 2 === 0) {
              remaining.push(adSnippet);
            }
          }
        } else {
          (inFirstThree ? firstThree : remaining).push(part);
        }
      });

      return {
        firstThree: firstThree.join(''),
        remaining: remaining.join('')
      };
    };

    // Determine the social media preview image
    const firstContentImage = extractFirstImage(content);
    const mainImageUrl = isValidImageUrl(image) ? image : (firstContentImage || fallbackImage);

    // Process content
    const { firstThree, remaining } = splitContent(content);

    // Generate keywords from tags
    const keywords = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag).join(', ') : '';

    // Generate HTML content
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
        <meta property="og:image:width" content="800">
        <meta property="og:image:height" content="450">
        <meta property="og:image:alt" content="${title}">
        <meta property="og:site_name" content="Mwaniki Reports">
        <meta property="og:locale" content="en_KE">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:site" content="@maestropuns">
        <meta name="twitter:creator" content="@maestropuns">
        <meta name="twitter:url" content="https://www.jonathanmwaniki.co.ke/content/articles/${slug}.html">
        <meta name="twitter:title" content="${title}">
        <meta name="twitter:description" content="${description}">
        <meta property="twitter:image" content="${mainImageUrl}">
        <meta name="twitter:image:alt" content="${title}">
        <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="16x16 32x32">
        <link rel="icon" href="/images/favicon-96x96.png" type="image/png" sizes="96x96">
        <link rel="apple-touch-icon" href="/images/apple-touch-icon.png">
        <link rel="stylesheet" href="/styles.css" media="print" onload="this.media='all'">
        <link rel="preload" href="/styles.css" as="style">
        <link rel="preload" href="/scripts/main.js" as="script">
        <link rel="preload" href="${mainImageUrl}" as="image" type="image/jpeg">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" media="print" onload="this.media='all'">
        <style>
          :root {
            --primary-color: #4f46e5;
            --primary-dark: #3b82f6;
            --secondary-color: #10b981;
            --text-color: #1f2937;
            --light-text: #6b7280;
            --background-color: #ffffff;
            --light-bg: #f9fafb;
            --border-color: #e5e7eb;
            --font-main: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html { scroll-behavior: smooth; }
          body {
            font-family: var(--font-main);
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--light-bg);
            overflow-x: hidden;
          }
          .bg-white { background-color: var(--background-color); }
          .flex { display: flex; }
          .flex-col { flex-direction: column; }
          .items-center { align-items: center; }
          .justify-center { justify-content: center; }
          .text-center { text-align: center; }
          .gradient-text {
            background: linear-gradient(135deg, var(--primary-color) 0%, --primary-dark 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .blog-container {
            max-width: 1280px;
            margin: 0 auto;
            padding: 40px 20px;
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
            color: var(--light-text);
            max-width: 800px;
            margin: 0 auto;
          }
          .post-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
          }
          .post-meta {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            font-size: 0.9rem;
            color: var(--light-text);
            margin-bottom: 1rem;
          }
          .post-meta time {
            position: relative;
            padding-right: 12px;
          }
          .post-meta time::after {
            content: '';
            position: absolute;
            right: 6px;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 4px;
            background: var(--light-text);
            border-radius: 50%;
          }
          .post-category {
            font-weight: 600;
            color: var(--primary-color);
            text-transform: uppercase;
            font-size: 0.85rem;
          }
          .post-tags {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 8px;
            margin-bottom: 15px;
          }
          .post-tag {
            padding: 5px 12px;
            background: var(--light-bg);
            color: var(--primary-color);
            border-radius: 15px;
            font-size: 0.85rem;
            text-decoration: none;
            border: 1px solid var(--border-color);
            transition: all 0.3s ease;
          }
          .post-tag:hover {
            background: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
          }
          .post-image {
            height: 220px;
            overflow: hidden;
            position: relative;
            border-radius: 12px;
            margin-bottom: 1rem;
          }
          .post-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 12px;
            display: block;
            margin: 0 auto;
          }
          .post-content {
            display: flex;
            flex-direction: column;
            gap: 10px;
            text-align: left;
          }
          .post-content p {
            margin-bottom: 0.75rem;
          }
          .post-content img.content-image {
            width: 100%;
            height: 220px;
            object-fit: cover;
            border-radius: 12px;
            margin: 1rem 0;
          }
          .post-excerpt {
            font-style: italic;
            color: var(--light-text);
            margin-bottom: 1rem;
          }
          .post-body {
            display: grid;
            grid-template-columns: 65% 30%;
            gap: 5%;
            margin-top: 1rem;
          }
          .category-section {
            margin-bottom: 60px;
          }
          .category-title {
            font-size: 1.8rem;
            font-weight: 600;
            margin-bottom: 20px;
            color: var(--text-color);
            position: relative;
            display: inline-block;
          }
          .category-title::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 0;
            width: 60%;
            height: 3px;
            background: linear-gradient(135deg, var(--primary-color) 0%, --primary-dark 100%);
          }
          .blog-posts {
            display: grid;
            grid-template-columns: 1fr;
            gap: 30px;
            margin-bottom: 40px;
          }
          .blog-post {
            background: var(--background-color);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border: 1px solid var(--border-color);
          }
          .blog-post:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          }
          .blog-post:hover .post-image img {
            transform: scale(1.05);
          }
          .btn-primary {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            background: linear-gradient(135deg, var(--primary-color) 0%, --primary-dark 100%);
            color: white;
            border-radius: 25px;
            font-weight: 500;
            text-decoration: none;
            transition: all 0.3s ease;
            align-self: center;
          }
          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(79, 70, 229, 0.3);
          }
          .site-footer {
            background: var(--background-color);
            padding: 40px 0;
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
          }
          .footer-container {
            max-width: 1280px;
            margin: 0 auto;
            padding: 0 20px;
          }
          .footer-brand {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 20px;
          }
          .footer-logo img {
            border-radius: 8px;
            width: 40px;
            height: 40px;
          }
          .footer-name {
            font-weight: 600;
            font-size: 1.2rem;
            color: var(--text-color);
          }
          .footer-description {
            color: var(--light-text);
            font-size: 0.95rem;
          }
          .footer-legal {
            border-top: 1px solid var(--border-color);
            padding-top: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .copyright {
            color: var(--light-text);
            font-size: 0.9rem;
          }
          .legal-links {
            display: flex;
            gap: 20px;
          }
          .legal-link {
            color: var(--light-text);
            font-size: 0.9rem;
            text-decoration: none;
            transition: color 0.3s ease;
          }
          .legal-link:hover {
            color: var(--primary-color);
          }
          .ad-container {
            margin: 2rem auto;
            text-align: center;
            max-width: 468px;
            min-height: 60px;
          }
          .ad-container iframe {
            display: block;
            margin: 0 auto;
            border: none;
            width: 468px;
            height: 60px;
            max-width: 100%;
          }
          .loading-posts, .no-posts, .error-message {
            text-align: center;
            padding: 40px 0;
            color: var(--light-text);
            font-size: 1.1rem;
          }
          .loading-posts i {
            margin-right: 10px;
            color: var(--primary-color);
            animation: spin 1s linear infinite;
          }
          .error-message a {
            color: var(--primary-color);
            text-decoration: underline;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @media (min-width: 1024px) {
            .post-content-first {
              max-width: 1280px;
              margin: 0 auto;
              text-align: center;
            }
            .post-content-first .post-image,
            .post-content-first .post-meta,
            .post-content-first .post-tags,
            .post-content-first .post-excerpt {
              margin-left: auto;
              margin-right: auto;
              max-width: 800px;
            }
            .post-content-remaining {
              grid-column: 1;
            }
            .category-section {
              grid-column: 2;
              margin-bottom: 0;
            }
            .blog-posts {
              grid-template-columns: 1fr;
            }
          }
          @media (max-width: 1024px) {
            .blog-posts {
              grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            }
            .post-body {
              display: block;
            }
            .post-content-first,
            .post-content-remaining {
              max-width: 800px;
              margin: 0 auto;
              text-align: left;
            }
            .category-section {
              margin-top: 2rem;
            }
          }
          @media (max-width: 768px) {
            .blog-container {
              padding: 20px;
            }
            .section-title, .post-title {
              font-size: 2rem;
            }
            .post-image, .post-content img.content-image {
              height: 200px;
            }
            .post-meta {
              flex-direction: column;
              align-items: center;
              gap: 5px;
            }
            .post-meta time::after {
              display: none;
            }
            .blog-posts {
              grid-template-columns: 1fr;
            }
            .ad-container iframe {
              width: 100%;
              max-width: 468px;
            }
          }
          @media (max-width: 480px) {
            .section-title, .post-title {
              font-size: 1.8rem;
            }
            .section-description {
              font-size: 1rem;
            }
            .post-title {
              font-size: 1.3rem;
            }
            .footer-brand {
              flex-direction: column;
              text-align: center;
            }
            .footer-legal {
              flex-direction: column;
              gap: 10px;
              text-align: center;
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
          <article class="blog-post" itemscope itemtype="https://schema.org/BlogPosting">
            <meta itemprop="mainEntityOfPage" content="/content/articles/${slug}.html">
            <div class="post-content-first">
              <h1 class="post-title" itemprop="headline">${title}</h1>
              <div class="post-meta">
                <time datetime="${date}" itemprop="datePublished">${new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                <span class="post-category" itemprop="articleSection">${category}</span>
              </div>
              <div class="post-tags">
                ${tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag).map(tag => `<a href="/blogs.html?tag=${encodeURIComponent(tag)}" class="post-tag" itemprop="keywords">${tag}</a>`).join('') : ''}
              </div>
              ${adSnippet}
              ${mainImageUrl ? `
              <div class="post-image">
                <img src="${mainImageUrl}" 
                     srcset="${mainImageUrl.replace(/\.(png|jpg|jpeg|gif|webp|svg)$/i, '-300.$1')} 300w, ${mainImageUrl} 800w" 
                     sizes="(max-width: 768px) 300px, 800px" 
                     alt="${title}" 
                     loading="lazy" 
                     width="800" 
                     height="450" 
                     itemprop="image">
              </div>
              ` : ''}
              <div class="post-content">
                ${description ? `<p class="post-excerpt" itemprop="description">${description}</p>` : ''}
                ${firstThree}
              </div>
            </div>
            <div class="post-body">
              <div class="post-content-remaining">
                <div class="post-content" itemprop="articleBody">
                  ${remaining}
                </div>
              </div>
              <section class="category-section" aria-labelledby="category-${category.toLowerCase().replace(/\s+/g, '-')}">
                <h2 class="category-title" id="category-${category.toLowerCase().replace(/\s+/g, '-')}">More ${category} Stories</h2>
                <div id="related-posts" class="blog-posts">
                  <div class="loading-posts"><i class="fas fa-spinner"></i>Loading related posts...</div>
                </div>
                <a href="/blogs.html" class="btn-primary">Read More Stories <i class="fas fa-arrow-right"></i></a>
              </section>
            </div>
            <meta itemprop="author" content="Jonathan Mwaniki">
            <meta itemprop="dateModified" content="${date}">
            <meta itemprop="publisher" content="Mwaniki Reports">
          </article>
        </main>
        <footer class="site-footer">
          <div class="footer-container">
            <div class="footer-brand">
              <div class="footer-logo">
                <img src="/images/Jonathan-Mwaniki-logo.png" 
                     srcset="/images/Jonathan-Mwaniki-logo-300.png 300w, /images/Jonathan-Mwaniki-logo.png 600w" 
                     sizes="(max-width: 768px) 300px, 600px" 
                     alt="Jonathan Mwaniki Logo" 
                     loading="lazy" 
                     width="40" 
                     height="40">
              </div>
              <div class="footer-info">
                <span class="footer-name">Jonathan Mwaniki</span>
                <p class="footer-description">Your trusted source for news, sports, tech, and entertainment.</p>
              </div>
            </div>
            <div class="ad-container">
              ${adSnippet}
            </div>
            <div class="footer-legal">
              <p class="copyright">© ${new Date().getFullYear()} Jonathan Mwaniki. All Rights Reserved.</p>
              <div class="legal-links">
                <a href="/privacy-policy" class="legal-link">Privacy Policy</a>
                <a href="/terms-of-service" class="legal-link">Terms of Service</a>
                <a href="/sitemap.xml" class="legal-link">Sitemap</a>
              </div>
            </div>
          </div>
        </footer>
        <script src="/scripts/main.js" defer></script>
        <script>
          document.addEventListener('DOMContentLoaded', () => {
            const relatedPosts = document.getElementById('related-posts');

            function formatDate(dateString) {
              if (!dateString) return 'No date';
              const options = { year: 'numeric', month: 'long', day: 'numeric' };
              return new Date(dateString).toLocaleDateString('en-US', options);
            }

            async function fetchPosts() {
              try {
                relatedPosts.innerHTML = '<div class="loading-posts"><i class="fas fa-spinner"></i>Loading related posts...</div>';
                const response = await fetch('/api/list-posts.js', {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json'
                  }
                });
                if (!response.ok) {
                  throw new Error('HTTP error! status: ' + response.status);
                }
                const { data, error } = await response.json();
                if (error) {
                  throw new Error(error);
                }
                return data || [];
              } catch (error) {
                console.error('Error fetching posts:', error);
                relatedPosts.innerHTML = '<div class="error-message">Failed to load related posts. Please try again later or <a href="/index.html#contact">contact support</a>.</div>';
                return [];
              }
            }

            function renderRelatedPosts(posts) {
              const filtered = posts.filter(post => post.category === '${category}' && post.slug !== '${slug}');
              if (!filtered || filtered.length === 0) {
                relatedPosts.innerHTML = '<div class="no-posts">No other ${category} posts found.</div>';
                return;
              }

              filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
              relatedPosts.innerHTML = '';

              filtered.forEach(post => {
                const postElement = document.createElement('article');
                postElement.className = 'blog-post';
                postElement.setAttribute('itemscope', '');
                postElement.setAttribute('itemtype', 'https://schema.org/BlogPosting');

                const imageUrl = post.image || '/images/default-blog.jpg';
                const formattedDate = formatDate(post.date);
                const keywords = post.tags ? post.tags.split(',').map(tag => tag.trim()).filter(tag => tag).slice(0, 3) : [];

                postElement.innerHTML = \`
                  <meta itemprop="mainEntityOfPage" content="/content/articles/\${post.slug}.html">
                  <div class="post-image">
                    <img src="\${imageUrl}" alt="\${post.title || 'Post image'}" loading="lazy" width="800" height="450" onerror="this.src='/images/default-blog.jpg'" itemprop="image">
                  </div>
                  <div class="post-content">
                    <div class="post-meta">
                      <time datetime="\${post.date}" itemprop="datePublished">\${formattedDate}</time>
                      <span class="post-category" itemprop="articleSection">\${post.category || ''}</span>
                    </div>
                    <h3 class="post-title" itemprop="headline">
                      <a href="/content/articles/\${post.slug}.html" itemprop="url">\${post.title || 'Untitled Post'}</a>
                    </h3>
                    \${post.description ? \`<div class="post-excerpt" itemprop="description">\${post.description}</div>\` : ''}
                    \${keywords.length > 0 ? \`
                    <div class="post-tags">
                      \${keywords.map(keyword => \`<a href="/blogs.html?tag=\${encodeURIComponent(keyword)}" class="post-tag" itemprop="keywords">\${keyword}</a>\`).join('')}
                    </div>
                    \` : ''}
                    <a href="/content/articles/\${post.slug}.html" class="btn-primary" itemprop="url">
                      Continue Reading <i class="fas fa-arrow-right"></i>
                    </a>
                  </div>
                  <meta itemprop="author" content="Jonathan Mwaniki">
                  <meta itemprop="dateModified" content="\${post.date}">
                  <meta itemprop="publisher" content="Mwaniki Reports">
                \`;

                relatedPosts.appendChild(postElement);
              });
            }

            fetchPosts().then(posts => {
              renderRelatedPosts(posts);
            });

            if ('IntersectionObserver' in window) {
              const lazyImages = document.querySelectorAll('img[loading="lazy"]');
              const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                  if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.removeAttribute('loading');
                    observer.unobserve(img);
                  }
                });
              });

              lazyImages.forEach(img => imageObserver.observe(img));
            }
          });
        </script>
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
      image: mainImageUrl,
      date,
      category,
      tags: tags || '',
      content,
    };

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
  } catch (error) {
    console.error('Error saving post:', error);
    return res.status(500).json({ error: `Failed to save post: ${error.message}` });
  }
}