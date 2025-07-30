document.addEventListener('DOMContentLoaded', () => {
    const postList = document.getElementById('post-list');
    const searchInput = document.getElementById('search-input');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function formatDate(dateString) {
        if (!dateString) return 'No date';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    function getCurrentCategory() {
        const path = window.location.pathname;
        const categories = ['news', 'tech', 'opinions', 'sports', 'entertainment'];
        const category = categories.find(cat => path.includes(cat));
        return category ? category.charAt(0).toUpperCase() + category.slice(1) : 'News';
    }

    function setActiveNavLink(category) {
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(category.toLowerCase())) {
                link.classList.add('active');
            }
        });
    }

    function renderPosts(posts, category) {
        postList.innerHTML = '';
        if (!posts || posts.length === 0) {
            postList.innerHTML = `<div class="no-posts">No ${category} posts found.</div>`;
            return;
        }

        const section = document.createElement('section');
        section.className = 'category-section';
        const title = document.createElement('h2');
        title.className = 'category-title';
        title.textContent = category;
        section.appendChild(title);

        // Ad after category title
        const adScript = document.createElement('script');
        adScript.type = 'text/javascript';
        adScript.textContent = `
            atOptions = {
                'key': '1610960d9ced232cc76d8f5510ee4608',
                'format': 'iframe',
                'height': 60,
                'width': 468,
                'params': {}
            };
        `;
        const adInvoke = document.createElement('script');
        adInvoke.src = '//www.highperformanceformat.com/1610960d9ced232cc76d8f5510ee4608/invoke.js';
        section.appendChild(adScript);
        section.appendChild(adInvoke);

        const postsContainer = document.createElement('div');
        postsContainer.className = 'blog-posts';

        posts.forEach((post, index) => {
            if (!post.category) return;
            const postElement = document.createElement('article');
            postElement.className = 'blog-post';
            postElement.setAttribute('itemscope', '');
            postElement.setAttribute('itemtype', 'https://schema.org/NewsArticle');

            const imageUrl = post.image || '/images/default-blog.jpg';
            const excerpt = post.description || '';
            const formattedDate = formatDate(post.date);
            const keywords = post.tags ? post.tags.split(',').map(tag => tag.trim()).filter(tag => tag).slice(0, 3) : [];

            postElement.innerHTML = `
                <meta itemprop="mainEntityOfPage" content="/content/articles/${post.slug}.html">
                <div class="post-image">
                    <img src="${imageUrl}" alt="${post.title || 'Post image'}" loading="lazy" width="800" height="450" onerror="this.src='/images/default-blog.jpg'" itemprop="image">
                </div>
                <div class="post-content">
                    <div class="post-meta">
                        <time datetime="${post.date}" itemprop="datePublished">${formattedDate}</time>
                        <span class="post-category" itemprop="articleSection">${post.category || ''}</span>
                    </div>
                    <h3 class="post-title" itemprop="headline">
                        <a href="/content/articles/${post.slug}.html" itemprop="url">${post.title || 'Untitled Post'}</a>
                    </h3>
                    ${excerpt ? `<div class="post-excerpt" itemprop="description">${excerpt}</div>` : ''}
                    ${keywords.length > 0 ? `
                    <div class="post-tags">
                        ${keywords.map(keyword => `<a href="/${category.toLowerCase()}?tag=${encodeURIComponent(keyword)}" class="post-tag" itemprop="keywords">${keyword}</a>`).join('')}
                    </div>
                    ` : ''}
                    <a href="/content/articles/${post.slug}.html" class="btn-primary" itemprop="url">
                        Read More <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
                <meta itemprop="author" content="Jonathan Mwaniki">
                <meta itemprop="dateModified" content="${post.date}">
                <meta itemprop="publisher" content="Mwaniki Reports">
            `;

            postsContainer.appendChild(postElement);

            // Insert ad after every 3 posts
            if ((index + 1) % 3 === 0) {
                const adScript = document.createElement('script');
                adScript.type = 'text/javascript';
                adScript.textContent = `
                    atOptions = {
                        'key': '1610960d9ced232cc76d8f5510ee4608',
                        'format': 'iframe',
                        'height': 60,
                        'width': 468,
                        'params': {}
                    };
                `;
                const adInvoke = document.createElement('script');
                adInvoke.src = '//www.highperformanceformat.com/1610960d9ced232cc76d8f5510ee4608/invoke.js';
                postsContainer.appendChild(adScript);
                postsContainer.appendChild(adInvoke);
            }
        });

        section.appendChild(postsContainer);
        postList.appendChild(section);
    }

    async function fetchPosts() {
        try {
            postList.innerHTML = '<div class="loading-posts"><i class="fas fa-spinner"></i>Loading posts...</div>';
            const response = await fetch('/api/list-posts.js', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const { data, error } = await response.json();
            if (error) throw new Error(error);
            return data || [];
        } catch (error) {
            console.error('Error fetching posts:', error);
            postList.innerHTML = '<div class="error-message">Failed to load posts. Please try again later or <a href="/portfolio.html#contact">contact support</a>.</div>';
            return [];
        }
    }

    const filterPosts = debounce(async () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const category = getCurrentCategory();
        let posts = await fetchPosts();

        posts = posts.filter(post => post.category && post.category.toLowerCase() === category.toLowerCase());

        if (searchTerm) {
            posts = posts.filter(post =>
                (post.title && post.title.toLowerCase().includes(searchTerm)) ||
                (post.description && post.description.toLowerCase().includes(searchTerm)) ||
                (post.tags && post.tags.split(',').map(tag => tag.trim()).some(tag => tag.toLowerCase().includes(searchTerm)))
            );
        }

        renderPosts(posts, category);
        setActiveNavLink(category);
    }, 300);

    filterPosts();

    searchInput.addEventListener('input', filterPosts);

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = link.href;
        });
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