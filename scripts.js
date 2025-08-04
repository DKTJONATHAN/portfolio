// ===== DEBUG MODE =====
const DEBUG_MODE = true; // Set to false in production
function debugLog(message, data = null) {
    if (DEBUG_MODE) {
        console.log('🐛 [MWANIKI DEBUG]', message, data || '');
    }
}

// ===== STATE MANAGEMENT =====
let allPosts = [];
let filteredPosts = [];
let currentPage = 1;
const postsPerPage = 9;

// ===== DOM ELEMENTS =====
let searchInput, categoryFilter, sortFilter, postsContainer, loadingState, noPostsState, pagination, pageInfo, prevBtn, nextBtn;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    debugLog('DOM Content Loaded');
    initializeElements();
    handleUrlParams();
    fetchPosts();
    initEventListeners();
});

function initializeElements() {
    searchInput = document.getElementById('searchInput');
    categoryFilter = document.getElementById('categoryFilter');
    sortFilter = document.getElementById('sortFilter');
    postsContainer = document.getElementById('postsContainer');
    loadingState = document.getElementById('loadingState');
    noPostsState = document.getElementById('noPostsState');
    pagination = document.getElementById('pagination');
    pageInfo = document.getElementById('pageInfo');
    prevBtn = document.getElementById('prevBtn');
    nextBtn = document.getElementById('nextBtn');

    // Check if all elements exist
    const elements = {
        searchInput, categoryFilter, sortFilter, postsContainer, 
        loadingState, noPostsState, pagination, pageInfo, prevBtn, nextBtn
    };
    
    Object.entries(elements).forEach(([name, element]) => {
        if (!element) {
            debugLog(`❌ Missing element: ${name}`);
        } else {
            debugLog(`✅ Found element: ${name}`);
        }
    });
}

function initEventListeners() {
    if (searchInput) searchInput.addEventListener('input', debounce(filterPosts, 300));
    if (categoryFilter) categoryFilter.addEventListener('change', filterPosts);
    if (sortFilter) sortFilter.addEventListener('change', filterPosts);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === '/') {
            e.preventDefault();
            if (searchInput) searchInput.focus();
        }
        if (e.key === 'Escape') {
            if (searchInput) searchInput.blur();
        }
    });
    
    // Pagination event listeners
    if (prevBtn) prevBtn.addEventListener('click', () => changePage(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => changePage(1));
    
    debugLog('Event listeners initialized');
}

// ===== UTILITY FUNCTIONS =====
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
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        debugLog('Date formatting error:', error);
        return 'Unknown date';
    }
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

function getImageUrl(post) {
    if (post.image && post.image !== 'https://www.jonathanmwaniki.co.ke/images/Jonathan-Mwaniki-logo.png') {
        return post.image;
    }
    return 'https://via.placeholder.com/400x200/1a73e8/ffffff?text=Mwaniki+Reports';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== API FUNCTIONS =====
async function fetchPosts() {
    debugLog('Starting to fetch posts...');
    
    try {
        showLoading();
        
        // Try multiple API endpoints
        const endpoints = [
            '/api/fetch-posts',
            './api/fetch-posts',
            `${window.location.origin}/api/fetch-posts`
        ];
        
        let lastError = null;
        
        for (const endpoint of endpoints) {
            try {
                debugLog(`Trying endpoint: ${endpoint}`);
                
                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
                
                debugLog(`Response status: ${response.status} for ${endpoint}`);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    debugLog(`API Error Response: ${errorText}`);
                    
                    if (response.status === 404) {
                        lastError = new Error(`API endpoint not found: ${endpoint}`);
                        continue;
                    } else if (response.status === 500) {
                        lastError = new Error(`Server error: ${errorText}`);
                        continue;
                    } else {
                        lastError = new Error(`HTTP ${response.status}: ${errorText}`);
                        continue;
                    }
                }
                
                const data = await response.json();
                debugLog('API Response received:', data);
                
                allPosts = data.posts || [];
                filteredPosts = [...allPosts];
                
                debugLog(`Loaded ${allPosts.length} posts`);
                
                if (allPosts.length === 0) {
                    showNoPosts('No articles available yet. Posts will appear here once published.');
                } else {
                    filterPosts();
                }
                
                return; // Success - exit the function
                
            } catch (networkError) {
                debugLog(`Network error for ${endpoint}:`, networkError);
                lastError = networkError;
                continue;
            }
        }
        
        // If we get here, all endpoints failed
        throw lastError || new Error('All API endpoints failed');
        
    } catch (error) {
        debugLog('Final error in fetchPosts:', error);
        showError(`Failed to load articles: ${error.message}`);
    }
}

// ===== DISPLAY FUNCTIONS =====
function showLoading() {
    debugLog('Showing loading state');
    if (loadingState) loadingState.classList.remove('hidden');
    if (postsContainer) postsContainer.classList.add('hidden');
    if (noPostsState) noPostsState.classList.add('hidden');
    if (pagination) pagination.classList.add('hidden');
}

function showNoPosts(customMessage = null) {
    debugLog('Showing no posts state');
    if (loadingState) loadingState.classList.add('hidden');
    if (postsContainer) postsContainer.classList.add('hidden');
    if (noPostsState) {
        noPostsState.classList.remove('hidden');
        if (customMessage) {
            const messageElement = noPostsState.querySelector('p');
            if (messageElement) {
                messageElement.textContent = customMessage;
            }
        }
    }
    if (pagination) pagination.classList.add('hidden');
}

function showPosts() {
    debugLog('Showing posts');
    if (loadingState) loadingState.classList.add('hidden');
    if (postsContainer) postsContainer.classList.remove('hidden');
    if (noPostsState) noPostsState.classList.add('hidden');
    if (pagination) pagination.classList.toggle('hidden', filteredPosts.length <= postsPerPage);
}

function showError(message) {
    debugLog('Showing error:', message);
    if (loadingState) loadingState.classList.add('hidden');
    if (postsContainer) postsContainer.classList.add('hidden');
    if (pagination) pagination.classList.add('hidden');
    
    if (noPostsState) {
        noPostsState.classList.remove('hidden');
        noPostsState.innerHTML = `
            <div class="text-center py-20">
                <i class="fas fa-exclamation-triangle text-6xl text-red-400 mb-6"></i>
                <h2 class="text-2xl font-semibold text-gray-700 mb-2">Error Loading Articles</h2>
                <p class="text-gray-500 mb-6">${escapeHtml(message)}</p>
                <div class="space-y-3">
                    <button onclick="fetchPosts()" class="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 font-semibold mr-3">
                        <i class="fas fa-refresh mr-2"></i>Try Again
                    </button>
                    <button onclick="debugAPI()" class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-semibold">
                        <i class="fas fa-bug mr-2"></i>Debug Info
                    </button>
                </div>
                <div class="mt-6 text-left bg-gray-100 p-4 rounded-lg max-w-2xl mx-auto">
                    <h3 class="font-semibold mb-2">Troubleshooting:</h3>
                    <ul class="text-sm text-gray-600 space-y-1">
                        <li>• Check if your Vercel environment variables are set (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)</li>
                        <li>• Verify that content/articles.json exists in your GitHub repository</li>
                        <li>• Ensure your GitHub token has proper repository access</li>
                        <li>• Check the browser console for detailed error messages</li>
                    </ul>
                </div>
            </div>
        `;
    }
}

// ===== POST CARD CREATION =====
function createPostCard(post, isFeatured = false) {
    const imageUrl = getImageUrl(post);
    const tags = post.tags ? post.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    const formattedDate = formatDate(post.date);
    
    if (isFeatured) {
        return `
            <article class="col-span-full bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 cursor-pointer animate-fade-in mb-8" onclick="openPost('${post.slug}')">
                <div class="grid lg:grid-cols-2 gap-0 min-h-[400px]">
                    <div class="p-8 lg:p-12 flex flex-col justify-center relative z-10">
                        <div class="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-6 w-fit">
                            <i class="fas fa-star text-yellow-400"></i>
                            Featured Article
                        </div>
                        <h2 class="text-3xl lg:text-4xl font-bold mb-4 leading-tight">${escapeHtml(post.title)}</h2>
                        <p class="text-lg opacity-90 mb-6 leading-relaxed">${escapeHtml(post.description)}</p>
                        <div class="flex items-center gap-4 text-sm">
                            <span class="bg-white/20 px-3 py-1 rounded-full font-medium">${escapeHtml(post.category)}</span>
                            <span class="flex items-center gap-2">
                                <i class="fas fa-calendar"></i>
                                ${formattedDate}
                            </span>
                        </div>
                    </div>
                    <div class="lg:order-last">
                        <img src="${imageUrl}" alt="${escapeHtml(post.title)}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300/1a73e8/ffffff?text=Image+Not+Available'">
                    </div>
                </div>
            </article>
        `;
    }

    return `
        <article class="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer animate-slide-in group" onclick="openPost('${post.slug}')">
            <div class="relative overflow-hidden">
                <img src="${imageUrl}" alt="${escapeHtml(post.title)}" class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" onerror="this.src='https://via.placeholder.com/400x200/1a73e8/ffffff?text=Image+Not+Available'">
                <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            <div class="p-6">
                <div class="flex items-center gap-3 mb-4 text-sm">
                    <span class="bg-primary-500 text-white px-3 py-1 rounded-full font-semibold text-xs uppercase tracking-wide">${escapeHtml(post.category)}</span>
                    <span class="text-gray-500 flex items-center gap-1">
                        <i class="fas fa-calendar text-xs"></i>
                        ${formattedDate}
                    </span>
                </div>
                
                <h3 class="text-xl font-semibold mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors duration-200">${escapeHtml(truncateText(post.title, 80))}</h3>
                
                <p class="text-gray-600 mb-4 line-clamp-3 leading-relaxed">${escapeHtml(truncateText(post.description, 150))}</p>
                
                ${tags.length > 0 ? `
                    <div class="flex flex-wrap gap-2">
                        ${tags.slice(0, 3).map(tag => `
                            <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium hover:bg-primary-500 hover:text-white transition-colors duration-200 cursor-pointer" onclick="event.stopPropagation(); filterByTag('${escapeHtml(tag)}')">${escapeHtml(tag)}</span>
                        `).join('')}
                        ${tags.length > 3 ? `<span class="bg-gray-100 text-gray-500 px-2 py-1 rounded-md text-xs">+${tags.length - 3} more</span>` : ''}
                    </div>
                ` : ''}
            </div>
        </article>
    `;
}

function renderPosts() {
    debugLog(`Rendering posts: ${filteredPosts.length} total, page ${currentPage}`);
    
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const postsToShow = filteredPosts.slice(startIndex, endIndex);

    if (postsToShow.length === 0) {
        showNoPosts();
        return;
    }

    let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">';
    
    // Add featured post only on first page and if we have posts
    if (currentPage === 1 && postsToShow.length > 0) {
        html = createPostCard(postsToShow[0], true);
        html += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">';
        
        // Show remaining posts (exclude the featured one)
        const remainingPosts = postsToShow.slice(1);
        html += remainingPosts.map(post => createPostCard(post)).join('');
    } else {
        html += postsToShow.map(post => createPostCard(post)).join('');
    }
    
    html += '</div>';

    if (postsContainer) {
        postsContainer.innerHTML = html;
    }
    
    showPosts();
    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    
    if (totalPages <= 1) {
        if (pagination) pagination.classList.add('hidden');
        return;
    }

    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
    if (pagination) pagination.classList.remove('hidden');
}

function changePage(direction) {
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderPosts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ===== FILTER FUNCTIONS =====
function filterPosts() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedCategory = categoryFilter ? categoryFilter.value : '';
    const sortOrder = sortFilter ? sortFilter.value : 'newest';

    debugLog('Filtering posts:', { searchTerm, selectedCategory, sortOrder });

    // Filter posts
    filteredPosts = allPosts.filter(post => {
        const matchesSearch = !searchTerm || 
            post.title.toLowerCase().includes(searchTerm) ||
            post.description.toLowerCase().includes(searchTerm) ||
            (post.tags && post.tags.toLowerCase().includes(searchTerm));
        
        const matchesCategory = !selectedCategory || post.category === selectedCategory;
        
        return matchesSearch && matchesCategory;
    });

    // Sort posts
    filteredPosts.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        if (sortOrder === 'newest') {
            return dateB - dateA;
        } else {
            return dateA - dateB;
        }
    });

    debugLog(`Filtered to ${filteredPosts.length} posts`);

    currentPage = 1;
    renderPosts();
    
    // Track search if there's a search term
    if (searchTerm) {
        trackSearch(searchTerm, filteredPosts.length);
    }
}

function filterByTag(tag) {
    if (searchInput) searchInput.value = tag;
    if (categoryFilter) categoryFilter.value = '';
    filterPosts();
    
    // Update URL
    const url = new URL(window.location);
    url.searchParams.set('tag', tag);
    window.history.pushState({}, '', url);
}

// ===== NAVIGATION FUNCTIONS =====
function openPost(slug) {
    debugLog('Opening post:', slug);
    
    // Track post click
    const post = allPosts.find(p => p.slug === slug);
    if (post) {
        trackPostView(slug, post.title);
    }
    
    window.open(`/content/articles/${slug}.html`, '_blank');
}

// ===== UTILITY FUNCTIONS FOR FOOTER =====
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function subscribeNewsletter() {
    const emailInput = document.getElementById('newsletterEmail');
    const email = emailInput ? emailInput.value : '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && emailRegex.test(email)) {
        showNotification('Thank you for subscribing! We\'ll keep you updated.', 'success');
        if (emailInput) emailInput.value = '';
        trackEvent('newsletter_signup', { email: email });
    } else {
        showNotification('Please enter a valid email address.', 'error');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 max-w-sm ${
        type === 'success' ? 'bg-green-500 text-white' : 
        type === 'error' ? 'bg-red-500 text-white' : 
        'bg-blue-500 text-white'
    }`;
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span class="flex-1">${escapeHtml(message)}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white/80 hover:text-white">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.remove('translate-x-full'), 10);
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// ===== URL PARAMETER HANDLING =====
function handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const tag = urlParams.get('tag');
    const search = urlParams.get('search');

    debugLog('URL Parameters:', { category, tag, search });

    if (category && categoryFilter) {
        categoryFilter.value = category;
    }
    if (tag && searchInput) {
        searchInput.value = tag;
    }
    if (search && searchInput) {
        searchInput.value = search;
    }
}

// ===== ANALYTICS & TRACKING =====
function trackEvent(eventName, eventData = {}) {
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, eventData);
    }
    debugLog('Event tracked:', eventName, eventData);
}

function trackPostView(slug, title) {
    trackEvent('post_view', {
        post_slug: slug,
        post_title: title
    });
}

function trackSearch(query, resultsCount) {
    trackEvent('search', {
        search_term: query,
        results_count: resultsCount
    });
}

// ===== DEBUG FUNCTIONS =====
window.debugAPI = async function() {
    debugLog('Manual API debug triggered');
    
    console.group('🔍 API Debug Information');
    
    // Environment info
    console.log('Environment:', {
        domain: window.location.origin,
        pathname: window.location.pathname,
        userAgent: navigator.userAgent
    });
    
    // Test different endpoints
    const endpoints = [
        '/api/fetch-posts',
        './api/fetch-posts',
        window.location.origin + '/api/fetch-posts'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`\n🔗 Testing: ${endpoint}`);
            
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`Status: ${response.status} ${response.statusText}`);
            console.log('Headers:', Object.fromEntries(response.headers.entries()));
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Success! Data:', data);
                
                if (data.posts && data.posts.length > 0) {
                    console.log(`Found ${data.posts.length} posts`);
                    console.log('Sample post:', data.posts[0]);
                } else {
                    console.log('⚠️ No posts in response');
                }
            } else {
                const errorText = await response.text();
                console.log('❌ Error response:', errorText);
            }
            
        } catch (error) {
            console.log('❌ Network error:', error);
        }
    }
    
    console.groupEnd();
    
    // Show debug info on page
    showNotification('Debug info logged to console. Press F12 to view.', 'info');
};

// ===== ERROR HANDLING =====
window.addEventListener('error', function(e) {
    debugLog('JavaScript error:', e);
    trackEvent('javascript_error', {
        error_message: e.error?.message || 'Unknown error',
        error_filename: e.filename || 'Unknown file',
        error_lineno: e.lineno || 0
    });
});

window.addEventListener('unhandledrejection', function(e) {
    debugLog('Unhandled promise rejection:', e);
    trackEvent('promise_rejection', {
        error_message: e.reason?.message || 'Unknown rejection'
    });
});

// Make functions globally available for debugging
window.fetchPosts = fetchPosts;
window.debugLog = debugLog;

debugLog('Scripts loaded successfully');