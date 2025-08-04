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
    if (categoryFilter && currentCategory) {
        categoryFilter.value = currentCategory;
    }
    
    // Load posts
    fetchPosts();
    
    // Event listeners
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            currentSearch = searchInput.value.trim();
            currentPage = 1;
            fetchPosts();
        }, 500));
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            currentCategory = categoryFilter.value;
            currentPage = 1;
            updateURL();
            fetchPosts();
        });
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', () => {
            currentSort = sortFilter.value;
            currentPage = 1;
            fetchPosts();
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                fetchPosts();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                fetchPosts();
            }
        });
    }
    
    // Enable debug panel if debug parameter exists
    if (urlParams.has('debug') && debugPanel) {
        debugPanel.style.display = 'block';
    }
});

// Fetch posts from API
async function fetchPosts() {
    try {
        // Show loading state
        postsContainer.classList.add('hidden');
        noPostsState.classList.add('hidden');
        loadingState.classList.remove('hidden');
        pagination.classList.add('hidden');
        
        // Build API URL with query parameters
        const params = new URLSearchParams({
            page: currentPage,
            limit: 10,
            ...(currentCategory && { category: currentCategory }),
            ...(currentSearch && { search: currentSearch }),
            ...(currentTag && { tag: currentTag }),
            sort: currentSort
        });
        
        const url = `/api/fetch-posts?${params.toString()}`; // Use relative path for flexibility
        console.log('Fetching posts from:', url);
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Posts fetched successfully:', data);

        // Validate response
        if (!data.posts || !Array.isArray(data.posts)) {
            throw new Error('Invalid response format: posts is not an array');
        }

        // Update pagination
        totalPages = data.totalPages || 1;
        updatePagination();

        // Render posts
        renderPosts(data.posts);

        // Update debug info
        updateDebugInfo(data);
        
    } catch (error) {
        console.error('Error in fetchPosts:', error);
        showErrorState();
        updateDebugInfo({ error: error.message });
    } finally {
        // Ensure loading state is cleared
        loadingState.classList.add('hidden');
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
                    <img class="h-48 w-full object-cover md:h-full" src="${post.image}" alt="${post.title || 'Article image'}" onerror="this.src='https://www.jonathanmwaniki.co.ke/images/Jonathan-Mwaniki-logo.png'">
                </div>
                ` : ''}
                <div class="p-8 ${post.image ? 'md:w-2/3' : ''}">
                    <div class="uppercase tracking-wide text-sm text-primary-500 font-semibold">${post.category || 'Uncategorized'}</div>
                    <a href="${post.url}" class="block mt-1 text-xl leading-tight font-medium text-gray-900 hover:text-primary-500">${post.title || 'Untitled'}</a>
                    <p class="mt-2 text-gray-500">${post.description || 'No description available'}</p>
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
    const email = emailInput ? emailInput.value.trim() : '';
    
    if (!email) {
        alert('Please enter your email address');
        return;
    }
    
    console.log('Subscribing email:', email);
    alert('Thank you for subscribing! You will receive updates soon.');
    emailInput.value = '';
}

// Debug API function
function debugAPI() {
    console.log('Debugging API...');
    fetchPosts();
}

// Expose functions to window for debugging
window.fetchPosts = fetchPosts;
window.debugAPI = debugAPI;