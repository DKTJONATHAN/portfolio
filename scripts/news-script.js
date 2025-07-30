document.addEventListener('DOMContentLoaded', () => {
    const postList = document.getElementById('post-list');
    const searchInput = document.getElementById('search-input');
    const categoryList = document.getElementById('category-list');

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

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function formatDate(dateString) {
        if (!dateString) return 'No date';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    function renderCategories(posts) {
        const categories = new Set(['News', 'Tech', 'Gossip', 'Opinions', 'Sports', 'Entertainment']);
        posts.forEach(post => {
            if (post.category) categories.add(post.category);
        });
        categoryList.innerHTML = '<span class="category-tag active" data-category="all" role="button" tabindex="0">All</span>';
        categories.forEach(category => {
            const categoryElement = document.createElement('span');
            categoryElement.className = 'category-tag';
            categoryElement.dataset.category = category;
            categoryElement.setAttribute('role', 'button');
            categoryElement.setAttribute('tabindex', '0');
            categoryElement.textContent = category;
            categoryList.appendChild(categoryElement);
        });
        document.querySelectorAll('.category-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                document.querySelectorAll('.category-tag').forEach(t => t.classList.remove('active'));
                tag.classList.add('active');
                filterPosts();
            });
            tag.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    tag.click();
                }
            });
        });
    }

    function renderPosts(posts) {
        if (!posts || posts.length === 0) {
            postList.innerHTML = '<div class="no-posts">No posts found.</div>';
            return;
        }

        const isHomePage = window.location.pathname === '/';
        const postsToRender = isHomePage ? shuffleArray([...posts]) : posts;

        postList.innerHTML = '';
        const section = document.createElement('section');
        section.className = 'category-section';
        const postsContainer = document.createElement('div');
        postsContainer.className = 'blog-posts';

        postsToRender.forEach(post => {
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
                        ${keywords.map(keyword => `<a href="/?tag=${encodeURIComponent(keyword)}" class="post-tag" itemprop="keywords">${keyword}</a>`).join('')}
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
        const activeCategory = document.querySelector('.category-tag.active').dataset.category;
        let posts = await fetchPosts();

        if (searchTerm) {
            posts = posts.filter(post =>
                (post.title && post.title.toLowerCase().includes(searchTerm)) ||
                (post.description && post.description.toLowerCase().includes(searchTerm)) ||
                (post.tags && post.tags.split(',').map(tag => tag.trim()).some(tag => tag.toLowerCase().includes(searchTerm)))
            );
        }

        if (activeCategory !== 'all') {
            posts = posts.filter(post => post.category.toLowerCase() === activeCategory.toLowerCase());
        }

        renderPosts(posts);
    }, 300);

    fetchPosts().then(posts => {
        renderCategories(posts);
        renderPosts(posts);
    });

    searchInput.addEventListener('input', filterPosts);

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

    // Refresh posts every 60 seconds on homepage
    if (window.location.pathname === '/') {
        setInterval(() => {
            fetchPosts().then(posts => renderPosts(posts));
        }, 60000);
    }
});