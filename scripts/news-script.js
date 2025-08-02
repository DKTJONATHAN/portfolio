let allPosts = [];
let categories = ['News', 'Breaking News', 'Opinions', 'Business', 'Sports', 'Tech', 'Entertainment'];

async function loadPosts() {
    try {
        const response = await fetch('/api/list-posts.js?t=' + Date.now());
        if (!response.ok) throw new error('Failed to fetch posts');
        const { data, error } = await response.json();
        if (error) throw new error(error);
        allPosts = data;
        displayPosts();
        hideSplashScreen();
    } catch (err) {
        console.error('Error loading posts:', err);
        document.getElementById('post-list').innerHTML = '<p class="text-red-500 text-center py-8">Failed to load posts</p>';
        hideSplashScreen();
    }
}

function hideSplashScreen() {
    const splash = document.getElementById('splash-screen');
    splash.classList.add('hidden');
}

function displayPosts() {
    const postList = document.getElementById('post-list');
    const featuredPost = document.getElementById('featured-post-content');
    const categoryList = document.getElementById('category-list');

    // Display Featured Post (most recent)
    const latestPost = allPosts[0] || {};
    featuredPost.innerHTML = latestPost.title ? generatePostHTML(latestPost, true) : '<p class="p-6 text-gray-500">No featured post available.</p>';

    // Display Categories
    categoryList.innerHTML = categories.map(category => `
        <a href="#${category.toLowerCase().replace(/\s+/g, '-')}" class="category-card bg-white rounded-lg shadow-md p-4 text-center hover:bg-blue-50">
            <h3 class="text-lg font-semibold text-gray-900">${category}</h3>
            <p class="text-sm text-gray-600">${allPosts.filter(post => post.category === category).length} articles</p>
        </a>
    `).join('');

    // Display Latest Posts
    const displayPosts = allPosts.slice(1, 7); // Show next 6 posts after featured
    postList.innerHTML = displayPosts.length ? displayPosts.map(post => generatePostHTML(post)).join('') : '<p class="text-gray-500 text-center py-8">No posts available.</p>';
}

function generatePostHTML(post, isFeatured = false) {
    const formattedDate = new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const tags = post.tags ? post.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    return `
        <article class="post-card bg-white rounded-lg shadow-md overflow-hidden ${isFeatured ? 'md:flex' : ''}">
            ${post.image ? `<img src="${post.image}" alt="${post.title}" class="${isFeatured ? 'md:w-1/2 h-64 md:h-auto' : 'w-full h-48'} object-cover">` : ''}
            <div class="${isFeatured ? 'p-6 md:w-1/2' : 'p-4'}">
                <h3 class="text-xl font-semibold text-gray-900 mb-2">${post.title || 'Untitled'}</h3>
                ${post.description ? `<p class="text-gray-600 mb-3 line-clamp-3">${post.description}</p>` : ''}
                <div class="flex items-center space-x-4 text-gray-600 mb-3">
                    <time datetime="${post.date}">${formattedDate}</time>
                    ${post.category ? `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">${post.category}</span>` : ''}
                </div>
                ${tags.length ? `
                    <div class="flex flex-wrap gap-2 mb-3">
                        ${tags.map(tag => `<span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">#${tag}</span>`).join('')}
                    </div>
                ` : ''}
                <a href="/content/articles/${post.slug}.html" class="text-blue-600 hover:underline font-medium">Read More</a>
            </div>
        </article>
    `;
}

function handleSearch() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const searchTerm = searchInput.value.toLowerCase().trim();

    if (!searchTerm) {
        searchResults.innerHTML = '<p class="text-gray-500 text-center py-4">Enter a search term to find articles.</p>';
        return;
    }

    const filteredPosts = allPosts.filter(post => 
        (post.title && post.title.toLowerCase().includes(searchTerm)) ||
        (post.category && post.category.toLowerCase().includes(searchTerm)) ||
        (post.tags && post.tags.split(',').map(tag => tag.trim()).some(tag => tag.toLowerCase().includes(searchTerm))) ||
        (post.description && post.description.toLowerCase().includes(searchTerm))
    );

    searchResults.innerHTML = filteredPosts.length ? filteredPosts.map(post => `
        <a href="/content/articles/${post.slug}.html" class="block bg-gray-50 rounded-lg p-3 mb-2 hover:bg-blue-50">
            <h4 class="text-lg font-medium text-gray-900">${post.title || 'Untitled'}</h4>
            <p class="text-sm text-gray-600 line-clamp-2">${post.description || ''}</p>
        </a>
    `).join('') : '<p class="text-gray-500 text-center py-4">No results found.</p>';
}

document.getElementById('open-search').addEventListener('click', () => {
    document.getElementById('search-overlay').classList.add('active');
    document.getElementById('search-input').focus();
});

document.getElementById('mobile-search-toggle').addEventListener('click', () => {
    document.getElementById('search-overlay').classList.add('active');
    document.getElementById('search-input').focus();
});

document.getElementById('mobile-search-nav').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('search-overlay').classList.add('active');
    document.getElementById('search-input').focus();
});

document.getElementById('close-search').addEventListener('click', () => {
    document.getElementById('search-overlay').classList.remove('active');
    document.getElementById('search-input').value = '';
    document.getElementById('search-results').innerHTML = '';
});

document.getElementById('search-input').addEventListener('input', handleSearch);

document.addEventListener('DOMContentLoaded', loadPosts);