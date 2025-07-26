// scripts/main.js
document.addEventListener('DOMContentLoaded', function() {
    // Splash screen animation
    const progressBar = document.getElementById('progressBar');
    const splashScreen = document.getElementById('splashScreen');
    const mainContent = document.getElementById('mainContent');
    
    if (progressBar && splashScreen && mainContent) {
        let progress = 0;
        const interval = setInterval(function() {
            progress += 5;
            progressBar.style.width = progress + '%';
            
            if (progress >= 100) {
                clearInterval(interval);
                splashScreen.style.opacity = '0';
                splashScreen.style.transition = 'opacity 0.5s ease';
                
                setTimeout(function() {
                    splashScreen.style.display = 'none';
                    mainContent.classList.remove('hidden');
                }, 500);
            }
        }, 50);
    }

    // Load non-critical resources
    function loadCSS(href) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }

    function loadJS(src, cb) {
        const script = document.createElement('script');
        script.src = src;
        script.defer = true;
        if (cb) script.onload = cb;
        document.body.appendChild(script);
    }

    window.addEventListener('load', function() {
        loadCSS('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        loadCSS('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
    });

    // Blog posts functionality
    const blogList = document.getElementById('blog-list');
    if (blogList) {
        loadBlogPosts();
    }

    async function loadBlogPosts() {
        try {
            blogList.innerHTML = '<div class="loading-posts"><i class="fas fa-spinner"></i> Loading blog posts...</div>';
            
            const response = await fetch('/api/list-posts?t=' + Date.now());
            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
            
            const { data } = await response.json();
            renderPosts(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
            
        } catch (error) {
            console.error('Error loading posts:', error);
            blogList.innerHTML = `
                <div style="text-align: center; padding: 60px 0; color: #d9534f; font-size: 1.1rem;">
                    Failed to load posts. <a href="javascript:location.reload()" style="color: #4f46e5; text-decoration: underline;">Try again</a>
                    <p><small>${error.message}</small></p>
                </div>
            `;
        }
    }

    function renderPosts(posts) {
        if (!blogList) return;
        
        blogList.innerHTML = '';
        
        if (!posts.length) {
            blogList.innerHTML = '<div style="text-align: center; padding: 60px 0; color: #6b7280; font-size: 1.1rem;">No posts found.</div>';
            return;
        }

        const postsToShow = posts.slice(0, 2); // Show only first two posts
        const postsContainer = document.createElement('div');
        postsContainer.className = 'blog-posts';

        postsToShow.forEach(post => {
            const postElement = document.createElement('article');
            postElement.className = 'blog-post';
            postElement.setAttribute('itemscope', '');
            postElement.setAttribute('itemtype', 'https://schema.org/BlogPosting');
            
            // Get first image from content or use default
            const firstImage = getFirstImageFromContent(post.content) || '/images/default-blog.jpg';
            const tags = post.tags ? post.tags.split(',').map(tag => tag.trim()).filter(tag => tag).slice(0, 3) : [];

            postElement.innerHTML = `
                <meta itemprop="mainEntityOfPage" content="/content/articles/${post.slug}.html">
                <div class="post-image">
                    <img src="${firstImage}" alt="${post.title || 'Blog Post'}" itemprop="image" loading="lazy" width="800" height="450" onerror="this.src='/images/default-blog.jpg'">
                </div>
                <div class="post-content">
                    <div class="post-meta">
                        <time datetime="${post.date}" itemprop="datePublished">${new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                        <span class="post-category" itemprop="articleSection">${post.category || 'Uncategorized'}</span>
                    </div>
                    <h3 class="post-title" itemprop="headline">${post.title || 'Untitled'}</h3>
                    <div class="post-excerpt" itemprop="description">
                        <p>${getExcerpt(post.content)}</p>
                    </div>
                    ${tags.length > 0 ? `
                    <div class="post-tags">
                        ${tags.map(tag => `<a href="/blogs.html?tag=${encodeURIComponent(tag)}" class="tag">${tag}</a>`).join('')}
                    </div>
                    ` : ''}
                    <div class="post-actions">
                        <a href="/content/articles/${post.slug}.html" class="btn-primary" itemprop="url" aria-label="Read full article">Read Full Article</a>
                    </div>
                </div>
                <meta itemprop="author" content="Jonathan Mwaniki">
                <meta itemprop="dateModified" content="${post.date}">
                <meta itemprop="publisher" content="Jonathan Mwaniki">
            `;
            
            postsContainer.appendChild(postElement);
        });

        blogList.appendChild(postsContainer);
    }

    function getFirstImageFromContent(content) {
        if (!content) return null;
        const imgRegex = /<img[^>]+src="([^">]+)"/i;
        const match = content.match(imgRegex);
        return match ? match[1] : null;
    }

    function getExcerpt(content) {
        const unescapedContent = unescapeHTML(content);
        const parser = new DOMParser();
        const doc = parser.parseFromString(unescapedContent, 'text/html');
        const firstP = doc.querySelector('p');
        if (!firstP) return 'No excerpt available.';
        const text = firstP.textContent.trim().replace(/\s+/g, ' ');
        const words = text.split(/\s+/).slice(0, 50);
        return words.join(' ') + (words.length < text.split(/\s+/).length ? '...' : '');
    }

    function unescapeHTML(str) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = str || '';
        return textarea.value;
    }

    // Lazy load images
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

        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });
    }

    // Contact form handling
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Add your form submission logic here
            alert('Form submission would be handled here');
        });
    }
});