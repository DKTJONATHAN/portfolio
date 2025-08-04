// scripts.js - Frontend logic for fetching and displaying posts

// DOM Elements
const postsContainer = document.getElementById('postsContainer');
const loadingState = document.getElementById('loadingState');
const noPostsState = document.getElementById('noPostsState');
const pagination = document.getElementById('pagination');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');
const debugPanel = document.getElementById('debugPanel');

// State variables
let currentPage = 1;
let totalPages = 1;
let currentCategory = '';
let currentSearch = '';
let currentSort = 'newest';
let currentTag = '';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    currentCategory = urlParams.get('category') || '';
    currentTag = urlParams.get('tag') || '';
    
    // Set filters from URL
    if (currentCategory) {
        categoryFilter.value = currentCategory;
    }
    
    // Load posts
    fetchPosts();
    
    // Event listeners
    searchInput.addEventListener('input', debounce(() => {
        currentSearch = searchInput.value.trim();
        currentPage = 1;
        fetchPosts();
    }, 500));
    
    categoryFilter.addEventListener('change', () => {
        currentCategory = categoryFilter.value;
        currentPage = 1;
        updateURL();
        fetchPosts();
    });
    
    sortFilter.addEventListener('change', () => {
        currentSort = sortFilter.value;
        currentPage = 1;
        fetchPosts();
    });
    
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchPosts();
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchPosts();
        }
    });
    
    // Enable debug panel if debug parameter exists
    if (urlParams.has('debug')) {
        debugPanel.style.display = 'block';
    }
});

// Fetch posts from articles.json
async function fetchPosts() {
    try {
        // Show loading state
        postsContainer.classList.add('hidden');
        noPostsState.classList.add('hidden');
        loadingState.classList.remove('hidden');
        pagination.classList.add('hidden');
        
        // Fetch articles.json
        const response = await fetch('/content/articles.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch articles.json: ${response.statusText}`);
        }
        const posts = await response.json();
        console.log('Posts fetched successfully:', posts);

        // Filter posts by category, search, and tag
        let filteredPosts = posts;
        if (currentCategory) {
            filteredPosts = filteredPosts.filter(post => post.category === currentCategory);
        }
        if (currentSearch) {
            const searchLower = currentSearch.toLowerCase();
            filteredPosts = filteredPosts.filter(post =>
                post.title.toLowerCase().includes(searchLower) ||
                post.description.toLowerCase().includes(searchLower) ||
                post.tags.toLowerCase().includes(searchLower)
            );
        }
        if (currentTag) {
            filteredPosts = filteredPosts.filter(post => post.tags.toLowerCase().includes(currentTag.toLowerCase()));
        }

        // Sort posts
        filteredPosts.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return currentSort === 'newest' ? dateB - dateA : dateA - dateB;
        });

        // Paginate posts
        const postsPerPage = 10;
        totalPages = Math.ceil(filteredPosts.length / postsPerPage);
        const start = (currentPage - 1) * postsPerPage;
        const paginatedPosts = filteredPosts.slice(start, start + postsPerPage);

        // Update pagination
        updatePagination();

        // Render posts
        renderPosts(paginatedPosts.map(post => ({
            ...post,
            url: `/articles/${post.slug}` // Construct URL for each post
        })));

        // Update debug info
        updateDebugInfo({ posts: paginatedPosts, totalPages });
        
    } catch (error) {
        console.error('Error fetching posts:', error);
        showErrorState();
        updateDebugInfo({ error: error.message });
    }
}

// Render posts to the DOM
function renderPosts(posts) {
    if (!posts || posts.length === 0) {
        loadingState.classList.add('hidden');
        noPostsState.classList.remove('hidden');
        postsContainer.classList.add('hidden');
        return;
    }
    
    postsContainer.innerHTML = '';
    
    posts.forEach(post => {
        const postDate = new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const postElement = document.createElement('div');
        postElement.className = 'bg-white rounded-xl shadow-md overflow-hidden mb-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1';
        postElement.innerHTML = `
            <div class="md:flex">
                ${post.image ? `
                <div class="md:flex-shrink-0 md:w-1/3">
                    <img class="h-48 w-full object-cover md:h-full" src="${post.image}" alt="${post.title}" onerror="this.src='https://www.jonathanmwaniki.co.ke/images/Jonathan-Mwaniki-logo.png'">
                </div>
                ` : ''}
                <div class="p-8 ${post.image ? 'md:w-2/3' : ''}">
                    <div class="uppercase tracking-wide text-sm text-primary-500 font-semibold">${post.category}</div>
                    <a href="${post.url}" class="block mt-1 text-xl leading-tight font-medium text-gray-900 hover:text-primary-500">${post.title}</a>
                    <p class="mt-2 text-gray-500">${post.description}</p>
                    <div class="mt-4 flex items-center">
                        <div class="text-sm text-gray-500">
                            <time datetime="${post.date}">${postDate}</time>
                        </div>
                        ${post.tags ? `
                        <div class="ml-4 flex flex-wrap gap-2">
                            ${post.tags.split(',').map(tag => `
                                <span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">${tag.trim()}</span>
                            `).join('')}
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        postsContainer.appendChild(postElement);
    });
    
    loadingState.classList.add('hidden');
    postsContainer.classList.remove('hidden');
}

// Update pagination controls
function updatePagination() {
    if (totalPages <= 1) {
        pagination.classList.add('hidden');
        return;
    }
    
    pagination.classList.remove('hidden');
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
}

// Show error state
function showErrorState() {
    loadingState.classList.add('hidden');
    noPostsState.classList.remove('hidden');
    pagination.classList.add('hidden');
}

// Update URL without reloading
function updateURL() {
    const url = new URL(window.location);
    
    if (currentCategory) {
        url.searchParams.set('category', currentCategory);
    } else {
        url.searchParams.delete('category');
    }
    
    if (currentTag) {
        url.searchParams.set('tag', currentTag);
    } else {
        url.searchParams.delete('tag');
    }
    
    window.history.pushState({}, '', url);
}

// Update debug info
function updateDebugInfo(data) {
    if (!debugPanel) return;
    
    const debugInfo = document.getElementById('debugInfo');
    if (!debugInfo) return;
    
    debugInfo.innerHTML = `
        <strong>Current State:</strong>
        <div>Page: ${currentPage}</div>
        <div>Category: ${currentCategory || 'None'}</div>
        <div>Search: ${currentSearch || 'None'}</div>
        <div>Tag: ${currentTag || 'None'}</div>
        <div>Sort: ${currentSort}</div>
        <div>Total Pages: ${totalPages}</div>
        ${data.error ? `
        <div class="text-red-600">Error: ${data.error}</div>
        ` : ''}
        ${data.posts ? `
        <div>Posts Loaded: ${data.posts.length}</div>
        ` : ''}
    `;
}

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// Scroll to top function
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Newsletter subscription
function subscribeNewsletter() {
    const emailInput = document.getElementById('newsletterEmail');
    const email = emailInput.value.trim();
    
    if (!email) {
        alert('Please enter your email address');
        return;
    }
    
    // In a real implementation, you would send this to your backend
    console.log('Subscribing email:', email);
    alert('Thank you for subscribing! You will receive updates soon.');
    emailInput.value = '';
}

// Expose functions to window for debugging
window.fetchPosts = fetchPosts;
window.debugAPI = debugAPI;