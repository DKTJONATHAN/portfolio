document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    const postList = document.getElementById('post-list');
    const searchInput = document.getElementById('search-input');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

    let currentCategory = 'News';
    let allPosts = {};

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
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function setActiveNavLink(category) {
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.category === category) {
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

        const postsContainer = document.createElement('div');
        postsContainer.className = 'blog-posts';

        posts.forEach((post, index) => {
            // console.log('Rendering post:', post); // Debug
            if (!post.category) return;
            const postElement = document.createElement('article');
            postElement.className = 'blog-post';
            postElement.setAttribute('itemscope', '');
            postElement.setAttribute('itemtype', 'https://schema.org/NewsArticle');

            const imageUrl = post.image || '/images/default-blog.jpg';
            const excerpt = post.description || 'No description available.';
            const formattedDate = formatDate(post.date);
            const keywords = post.tags ? post.tags.split(',').map(tag => tag.trim()).filter(tag => tag).slice(0, 3) : [];

            postElement.innerHTML = `
                <meta itemprop="mainEntityOfPage" content="/content/articles/${post.slug}.html">
                <div class="post-image">
                    <img src="${imageUrl}" alt="${post.title || 'Post image'}" loading="lazy" width="360" height="180" onerror="this.src='/images/default-blog.jpg'" itemprop="image">
                </div>
                <div class="post-content">
                    <div class="post-meta">
                        <time datetime="${post.date}" itemprop="datePublished">${formattedDate}</time> • 
                        <span class="post-category" itemprop="articleSection">${post.category || ''}</span>
                    </div>
                    <h3 class="post-title" itemprop="headline">
                        <a href="/content/articles/${post.slug}.html" itemprop="url">${post.title || 'Untitled Post'}</a>
                    </h3>
                    <div class="post-excerpt" itemprop="description">${excerpt}</div>
                    ${keywords.length > 0 ? `
                    <div class="post-tags">
                        ${keywords.map(keyword => `<a class="post-tag" data-tag="${encodeURIComponent(keyword)}" itemprop="keywords">${keyword}</a>`).join('')}
                    </div>
                    ` : ''}
                    <a href="/content/articles/${post.slug}.html" class="btn-primary" itemprop="url">Read More</a>
                </div>
                <meta itemprop="author" content="Jonathan Mwaniki">
                <meta itemprop="dateModified" content="${post.date}">
                <meta itemprop="publisher" content="Mwaniki Reports">
            `;

            postsContainer.appendChild(postElement);

            if ((index + 1) % 4 === 0) {
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
                adInvoke.setAttribute('defer', '');
                postsContainer.appendChild(adScript);
                postsContainer.appendChild(adInvoke);
            }
        });

        section.appendChild(postsContainer);
        postList.appendChild(section);
    }

    async function fetchPosts() {
        try {
            const response = await fetch('/api/list-posts.js', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-store'
            });
            // console.log('API Response Status:', response.status); // Debug
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const json = await response.json();
            // console.log('API Response JSON:', json); // Debug
            const { data, error } = json;
            if (error) throw new Error(error);
            return data || [];
        } catch (error) {
            console.error('Error fetching posts:', error);
            postList.innerHTML = '<div class="error-message">Failed to load posts. Please try again later or <a href="/portfolio.html#contact">contact support</a>.</div>';
            return [];
        }
    }

    async function preloadAllPosts() {
        const categories = ['News', 'Breaking News', 'Opinions', 'Business', 'Sports', 'Tech', 'Entertainment'];
        const posts = await fetchPosts();
        categories.forEach(category => {
            allPosts[category] = posts.filter(post => post.category && post.category.toLowerCase() === category.toLowerCase());
        });
        return allPosts;
    }

    const filterPosts = debounce(() => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        let posts = allPosts[currentCategory] || [];

        if (searchTerm) {
            posts = posts.filter(post =>
                (post.title && post.title.toLowerCase().includes(searchTerm)) ||
                (post.description && post.description.toLowerCase().includes(searchTerm)) ||
                (post.tags && post.tags.split(',').map(tag => tag.trim()).some(tag => tag.toLowerCase().includes(searchTerm)))
            );
        }

        renderPosts(posts, currentCategory);
        setActiveNavLink(currentCategory);
    }, 250);

    // Initial load with preloading
    (async () => {
        await preloadAllPosts();
        renderPosts(allPosts[currentCategory] || [], currentCategory);
        splashScreen.classList.add('hidden');
    })();

    // Navigation link click handlers
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentCategory = link.dataset.category;
            searchInput.value = '';
            filterPosts();
        });
        link.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                currentCategory = link.dataset.category;
                searchInput.value = '';
                filterPosts();
            }
        });
    });

    // Tag click handlers
    postList.addEventListener('click', (e) => {
        if (e.target.classList.contains('post-tag')) {
            e.preventDefault();
            searchInput.value = e.target.dataset.tag;
            filterPosts();
        }
    });

    // Search input handler
    searchInput.addEventListener('input', filterPosts);

    // Lazy loading images
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
        }, { rootMargin: '100px' });
        lazyImages.forEach(img => imageObserver.observe(img));
    }
});