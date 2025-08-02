document.addEventListener('DOMContentLoaded', () => {
    const postList = document.getElementById('post-list');
    let allPosts = [];

    // Debounce function for search
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }

    // Format date for display
    function formatDate(dateString) {
        if (!dateString) return 'No date';
        try {
            return new Date(dateString).toLocaleDateString('en-KE', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'Invalid date';
        }
    }

    // Render posts
    function renderPosts(posts) {
        postList.innerHTML = '';
        if (!posts || posts.length === 0) {
            postList.innerHTML = '<div class="no-posts">No posts found.</div>';
            return;
        }

        // Sort posts by date (newest first)
        const sortedPosts = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));

        const section = document.createElement('section');
        section.className = 'posts-container';

        sortedPosts.forEach((post, index) => {
            if (!post.title || !post.slug || !post.url) return;

            const postElement = document.createElement('article');
            postElement.className = 'post-card';
            postElement.setAttribute('itemscope', '');
            postElement.setAttribute('itemtype', 'https://schema.org/NewsArticle');

            const imageUrl = post.image || '/images/default-blog.jpg';
            const excerpt = post.description || 'No description available.';
            const formattedDate = formatDate(post.date);
            const keywords = post.tags ? post.tags.split(',').map(tag => tag.trim()).filter(tag => tag).slice(0, 3) : [];

            postElement.innerHTML = `
                <meta itemprop="mainEntityOfPage" content="${post.url}">
                <div class="post-image">
                    <img src="${imageUrl}" alt="${post.title} - Kenya News" loading="lazy" width="360" height="180" fetchpriority="${index === 0 ? 'high' : 'auto'}" onerror="this.src='/images/default-blog.jpg'" itemprop="image">
                </div>
                <div class="post-content">
                    <div class="post-meta">
                        <time datetime="${post.date}" itemprop="datePublished">${formattedDate}</time> • 
                        <span class="post-category" itemprop="articleSection">${post.category || 'Uncategorized'}</span>
                    </div>
                    <h3 class="post-title" itemprop="headline">
                        <a href="${post.url}" target="_blank" itemprop="url">${post.title}</a>
                    </h3>
                    <div class="post-excerpt" itemprop="description">${excerpt}</div>
                    ${keywords.length > 0 ? `
                        <div class="post-tags">
                            ${keywords.map(keyword => `
                                <a class="post-tag" href="/blogs.html?tag=${encodeURIComponent(keyword)}" data-tag="${encodeURIComponent(keyword)}" itemprop="keywords">${keyword}</a>
                            `).join('')}
                        </div>
                    ` : ''}
                    <a href="${post.url}" class="btn-primary" target="_blank" itemprop="url">Read More</a>
                </div>
                <meta itemprop="author" content="Jonathan Mwaniki">
                <meta itemprop="dateModified" content="${post.date}">
                <meta itemprop="publisher" content="Jonathan Mwaniki Reports">
                <script type="application/ld+json">
                {
                    "@context": "https://schema.org",
                    "@type": "NewsArticle",
                    "headline": "${post.title}",
                    "image": "${imageUrl}",
                    "datePublished": "${post.date}",
                    "dateModified": "${post.date}",
                    "author": {
                        "@type": "Person",
                        "name": "Jonathan Mwaniki"
                    },
                    "publisher": {
                        "@type": "Organization",
                        "name": "Jonathan Mwaniki Reports",
                        "logo": {
                            "@type": "ImageObject",
                            "url": "https://www.jonathanmwaniki.co.ke/images/Jonathan-Mwaniki-logo.png"
                        }
                    },
                    "description": "${excerpt}",
                    "keywords": "${keywords.join(', ')}"
                }
                </script>
            `;

            section.appendChild(postElement);
        });

        postList.appendChild(section);

        // Add search bar after posts are loaded
        const searchBar = document.createElement('div');
        searchBar.className = 'search-bar';
        searchBar.innerHTML = `
            <input type="text" id="search-input" placeholder="Search posts..." aria-label="Search posts">
            <i class="fas fa-search"></i>
        `;
        postList.insertBefore(searchBar, section);
    }

    // Fetch posts from API
    async function fetchPosts() {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        try {
            const response = await fetch('/api/list-posts.js', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const { data, error } = await response.json();
            if (error) throw new Error(error);
            return data || [];
        } catch (error) {
            console.error('Error fetching posts:', error.message);
            postList.innerHTML = `<div class="error-message">Failed to load posts. Please try again or <a href="/contact">contact support</a>.</div>`;
            return [];
        }
    }

    // Filter posts based on search
    const filterPosts = debounce(() => {
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase().trim() || '';
        const posts = searchTerm
            ? allPosts.filter(post =>
                  (post.title && post.title.toLowerCase().includes(searchTerm)) ||
                  (post.description && post.description.toLowerCase().includes(searchTerm)) ||
                  (post.tags && post.tags.split(',').map(tag => tag.trim()).some(tag => tag.toLowerCase().includes(searchTerm))) ||
                  (post.category && post.category.toLowerCase().includes(searchTerm))
              )
            : allPosts;
        renderPosts(posts);
    }, 300);

    // Initialize
    (async () => {
        try {
            allPosts = await fetchPosts();
            renderPosts(allPosts);
            // Add search input event listener after posts are loaded
            const searchInput = document.getElementById('search-input');
            if (searchInput) searchInput.addEventListener('input', filterPosts);
        } catch (error) {
            console.error('Initialization error:', error.message);
            postList.innerHTML = `<div class="error-message">Failed to load posts. Please try again or <a href="/contact">contact support</a>.</div>`;
        }
    })();
});