// ===== STATE MANAGEMENT =====
let allPosts = [];
let filteredPosts = [];
let currentPage = 1;
const postsPerPage = 9;

// ===== DOM ELEMENTS =====
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');
const postsContainer = document.getElementById('postsContainer');
const loadingState = document.getElementById('loadingState');
const noPostsState = document.getElementById('noPostsState');
const pagination = document.getElementById('pagination');
const pageInfo = document.getElementById('pageInfo');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', function() {
    handleUrlParams();
    fetchPosts();
    initEventListeners();
});

function initEventListeners() {
    searchInput.addEventListener('input', debounce(filterPosts, 300));
    categoryFilter.addEventListener('change', filterPosts);
    sortFilter.addEventListener('change', filterPosts);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === '/') {
            e.preventDefault();
            searchInput.focus();
        }
        if (e.key === 'Escape') {
            searchInput.blur();
        }
    });
    
    // Pagination event listeners
    prevBtn.addEventListener('click', () => changePage(-1));
    nextBtn.addEventListener('click', () => changePage(1));
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
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
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== API FUNCTIONS =====
async function fetchPosts() {
    try {
        showLoading();
        const response = await fetch('/api/fetch-posts');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        allPosts = data.posts || [];
        filteredPosts = [...allPosts];
        
        if (allPosts.length === 0) {
            showNoPosts();
        } else {
            filterPosts();
        }
        
    } catch (error) {
        console.error('Error fetching posts:', error);
        showError('Failed to load articles. Please try again later.');
    }
}

// ===== DISPLAY FUNCTIONS =====
function showLoading() {
    loadingState.classList.remove('hidden');
    postsContainer.classList.add('hidden');
    noPostsState.classList.add('hidden');
    pagination.classList.add('hidden');
}

function showNoPosts() {
    loadingState.classList.add('hidden');
    postsContainer.classList.add('hidden');
    noPostsState.classList.remove('hidden');
    pagination.classList.add('hidden');
}

function showPosts() {
    loadingState.classList.add('hidden');
    postsContainer.classList.remove('hidden');
    noPostsState.classList.add('hidden');
    pagination.classList.toggle('hidden', filteredPosts.length <= postsPerPage);
}

function showError(message) {
    loadingState.classList.add('hidden');
    postsContainer.classList.add('hidden');
    noPostsState.classList.remove('hidden');
    pagination.classList.add('hidden');
    
    noPostsState.innerHTML = `
        <div class="text-center py-20">
            <i class="fas fa-exclamation-triangle text-6xl text-red-400 mb-6"></i>
            <h2 class="text-2xl font-semibold text-gray-700 mb-2">Error Loading Articles</h2>
            <p class="text-gray-500 mb-6">${escapeHtml(message)}</p>
            <button onclick="fetchPosts()" class="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 font-semibold">
                <i class="fas fa-refresh mr-2"></i>Try Again
            </button>
        </div>
    `;
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
                        <img src="${imageUrl}" alt="${escapeHtml(post.title)}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy">
                    </div>
                </div>
            </article>
        `;
    }

    return `
        <article class="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer animate-slide-in group" onclick="openPost('${post.slug}')">
            <div class="relative overflow-hidden">
                <img src="${imageUrl}" alt="${escapeHtml(post.title)}" class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy">
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

    postsContainer.innerHTML = html;
    showPosts();
    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    
    if (totalPages <= 1) {
        pagination.classList.add('hidden');
        return;
    }

    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    pagination.classList.remove('hidden');
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
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedCategory = categoryFilter.value;
    const sortOrder = sortFilter.value;

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

    currentPage = 1;
    renderPosts();
    
    // Track search if there's a search term
    if (searchTerm) {
        trackSearch(searchTerm, filteredPosts.length);
    }
}

function filterByTag(tag) {
    searchInput.value = tag;
    categoryFilter.value = '';
    filterPosts();
    
    // Update URL
    const url = new URL(window.location);
    url.searchParams.set('tag', tag);
    window.history.pushState({}, '', url);
}

// ===== NAVIGATION FUNCTIONS =====
function openPost(slug) {
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
    const email = document.getElementById('newsletterEmail').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && emailRegex.test(email)) {
        // Here you would typically send the email to your backend
        showNotification('Thank you for subscribing! We\'ll keep you updated.', 'success');
        document.getElementById('newsletterEmail').value = '';
        
        // Track newsletter signup
        trackEvent('newsletter_signup', { email: email });
    } else {
        showNotification('Please enter a valid email address.', 'error');
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
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
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// ===== URL PARAMETER HANDLING =====
function handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const tag = urlParams.get('tag');
    const search = urlParams.get('search');

    if (category) {
        categoryFilter.value = category;
    }
    if (tag) {
        searchInput.value = tag;
    }
    if (search) {
        searchInput.value = search;
    }
}

// ===== SEARCH ENHANCEMENTS =====
function setupSearchSuggestions() {
    let searchTimeout;
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-b-xl shadow-lg z-10 hidden max-h-64 overflow-y-auto';
    searchInput.parentElement.appendChild(suggestionsContainer);
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = this.value.toLowerCase().trim();
            if (query.length > 2) {
                showSearchSuggestions(query, suggestionsContainer);
            } else {
                suggestionsContainer.classList.add('hidden');
            }
        }, 300);
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.parentElement.contains(e.target)) {
            suggestionsContainer.classList.add('hidden');
        }
    });
    
    // Hide suggestions on escape
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            suggestionsContainer.classList.add('hidden');
        }
    });
}

function showSearchSuggestions(query, container) {
    const suggestions = allPosts
        .filter(post => 
            post.title.toLowerCase().includes(query) ||
            post.description.toLowerCase().includes(query) ||
            (post.tags && post.tags.toLowerCase().includes(query))
        )
        .slice(0, 5)
        .map(post => ({
            title: post.title,
            type: 'post',
            slug: post.slug
        }));
    
    // Add tag suggestions
    const tagSuggestions = [];
    allPosts.forEach(post => {
        if (post.tags) {
            const tags = post.tags.split(',').map(tag => tag.trim());
            tags.forEach(tag => {
                if (tag.toLowerCase().includes(query) && !tagSuggestions.find(t => t.title === tag)) {
                    tagSuggestions.push({
                        title: tag,
                        type: 'tag'
                    });
                }
            });
        }
    });
    
    const allSuggestions = [...suggestions, ...tagSuggestions.slice(0, 3)];
    
    if (allSuggestions.length > 0) {
        container.innerHTML = allSuggestions.map(suggestion => `
            <div class="px-4 py-3 hover:bg-gray-100 cursor-pointer flex items-center gap-3 border-b border-gray-100 last:border-b-0" onclick="handleSuggestionClick('${suggestion.type}', '${escapeHtml(suggestion.title)}', '${suggestion.slug || ''}')">
                <i class="fas fa-${suggestion.type === 'post' ? 'newspaper' : 'tag'} text-gray-400"></i>
                <div class="flex-1">
                    <div class="font-medium text-gray-900">${escapeHtml(truncateText(suggestion.title, 60))}</div>
                </div>
                <span class="text-xs text-gray-500 uppercase font-semibold">${suggestion.type}</span>
            </div>
        `).join('');
        container.classList.remove('hidden');
    } else {
        container.innerHTML = `
            <div class="px-4 py-3 text-gray-500 text-center">
                <i class="fas fa-search text-gray-300 mb-2"></i>
                <div>No suggestions found</div>
            </div>
        `;
        container.classList.remove('hidden');
    }
}

function handleSuggestionClick(type, title, slug = '') {
    if (type === 'tag') {
        filterByTag(title);
    } else if (type === 'post' && slug) {
        openPost(slug);
    }
    
    // Hide suggestions
    const container = document.querySelector('.absolute.top-full');
    if (container) {
        container.classList.add('hidden');
    }
}

// ===== ANALYTICS & TRACKING =====
function trackEvent(eventName, eventData = {}) {
    // Google Analytics 4 event tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, eventData);
    }
    
    // Console log for development
    console.log('Event tracked:', eventName, eventData);
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

// ===== ACCESSIBILITY FEATURES =====
function addSkipLink() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-500 text-white px-4 py-2 rounded-lg z-50 font-semibold';
    skipLink.setAttribute('tabindex', '1');
    document.body.insertBefore(skipLink, document.body.firstChild);
}

// ===== PROGRESSIVE WEB APP FEATURES =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function(registration) {
            console.log('ServiceWorker registration successful');
        }).catch(function(err) {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    addSkipLink();
    setupSearchSuggestions();
    
    // Add main content ID for accessibility
    const mainElement = document.querySelector('main');
    if (mainElement) {
        mainElement.id = 'main-content';
    }
    
    // Initialize lazy loading
    setupLazyLoading();
});

// ===== PERFORMANCE OPTIMIZATIONS =====
function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });

        // Observe images with data-src attribute
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// ===== ERROR HANDLING =====
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    trackEvent('javascript_error', {
        error_message: e.error?.message || 'Unknown error',
        error_filename: e.filename || 'Unknown file',
        error_lineno: e.lineno || 0
    });
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    trackEvent('promise_rejection', {
        error_message: e.reason?.message || 'Unknown rejection'
    });
});

// ===== NETWORK STATUS =====
window.addEventListener('online', function() {
    showNotification('Connection restored!', 'success');
    // Retry failed requests
    if (allPosts.length === 0) {
        fetchPosts();
    }
});

window.addEventListener('offline', function() {
    showNotification('You are currently offline. Some features may not work.', 'error');
});

// ===== THEME DETECTION =====
function detectTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
    }
}

// Listen for theme changes
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', detectTheme);
}

// ===== PERFORMANCE MONITORING =====
window.addEventListener('load', function() {
    // Track page load time
    if (window.performance) {
        const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
        trackEvent('page_load_time', {
            load_time: loadTime,
            page_type: 'blog_index'
        });
    }
});

// ===== CLEANUP =====
window.addEventListener('beforeunload', function() {
    // Clean up any running intervals or timeouts
    // This is good practice for SPA navigation
});