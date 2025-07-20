/**
 * Blog Page JavaScript - Optimized for Performance
 * Key Features:
 * 1. Blog-specific enhancements
 * 2. Category filtering
 * 3. Improved reading experience
 * 4. Optimized image loading
 * 5. SEO-friendly interactions
 */

// ==================== CORE FUNCTIONS ====================

/**
 * Initialize the blog page
 */
function initBlogPage() {
    // Load critical functions first
    initSplashScreen();
    initMobileNavigation();
    initBlogInteractions();

    // Defer non-critical initializations
    requestIdleCallback(() => {
        initSmoothScrolling();
        initToastSystem();
        initLazyLoading();
    });
}

// ==================== BLOG-SPECIFIC FUNCTIONS ====================

function initBlogInteractions() {
    // Initialize category filtering
    initCategoryFilter();

    // Add hover effects to blog posts
    document.querySelectorAll('.blog-post').forEach(post => {
        post.addEventListener('mouseenter', () => {
            post.classList.add('post-hover');
        });

        post.addEventListener('mouseleave', () => {
            post.classList.remove('post-hover');
        });
    });

    // Add reading time estimation
    estimateReadingTimes();
}

function estimateReadingTimes() {
    const posts = document.querySelectorAll('.blog-post');
    const wordsPerMinute = 200; // Average reading speed
    
    posts.forEach(post => {
        const excerpt = post.querySelector('.post-excerpt p');
        const title = post.querySelector('.post-title');
        const meta = post.querySelector('.post-meta');
        
        if (!excerpt || !title || !meta) return;
        
        const excerptWords = excerpt.textContent.split(/\s+/).length;
        const titleWords = title.textContent.split(/\s+/).length;
        const totalWords = excerptWords + titleWords;
        const readingTime = Math.ceil(totalWords / wordsPerMinute);
        
        const timeElement = document.createElement('span');
        timeElement.className = 'reading-time';
        timeElement.innerHTML = ` <span class="dot-separator">•</span> ${readingTime} min read`;
        meta.appendChild(timeElement);
    });
}

// ==================== CATEGORY FILTERING ====================

function initCategoryFilter() {
    const categoryTags = document.querySelectorAll('.category-tag');
    
    if (!categoryTags.length) return;
    
    // Use event delegation for better performance
    document.querySelector('.category-list').addEventListener('click', (e) => {
        const tag = e.target.closest('.category-tag');
        if (!tag) return;
        
        e.preventDefault();
        filterPostsByCategory(tag.textContent.trim());
        updateActiveTag(tag);
    });
}

function filterPostsByCategory(category) {
    const posts = document.querySelectorAll('.blog-post');
    let hasMatches = false;
    
    // First, try to remove any existing no-results message
    const existingMessage = document.querySelector('.no-results-message');
    if (existingMessage) existingMessage.remove();
    
    posts.forEach(post => {
        const postCategory = post.querySelector('.post-category').textContent.trim();
        const shouldShow = category === 'All' || postCategory === category;
        post.style.display = shouldShow ? '' : 'none';
        hasMatches = hasMatches || shouldShow;
    });
    
    // Handle no results
    if (!hasMatches) {
        const message = document.createElement('p');
        message.className = 'no-results-message';
        message.textContent = `No posts found in "${category}" category`;
        document.querySelector('.blog-posts').appendChild(message);
    }
}

function updateActiveTag(activeTag) {
    document.querySelectorAll('.category-tag').forEach(tag => {
        tag.classList.toggle('active', tag === activeTag);
    });
}

// ==================== LAZY LOADING (BLOG-SPECIFIC) ====================

function initLazyLoading() {
    const lazyImages = document.querySelectorAll('.post-image img[loading="lazy"]');
    
    if (!('IntersectionObserver' in window)) {
        // Fallback for browsers without IntersectionObserver
        lazyImages.forEach(img => {
            img.src = img.dataset.src || img.src;
        });
        return;
    }
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                observer.unobserve(img);
                
                // Add fade-in effect
                img.style.opacity = '0';
                img.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    img.style.opacity = '1';
                }, 50);
            }
        });
    }, {
        rootMargin: '200px',
        threshold: 0.1
    });
    
    lazyImages.forEach(img => observer.observe(img));
}

// ==================== SHARED FUNCTIONS (from original script) ====================

function initSplashScreen() {
    const splashScreen = document.getElementById('splashScreen');
    const mainContent = document.getElementById('mainContent');
    const progressBar = document.getElementById('progressBar');

    if (!splashScreen || !progressBar) return;

    let progress = 0;
    const duration = 2000;
    const startTime = performance.now();

    function updateProgress(timestamp) {
        const elapsed = timestamp - startTime;
        progress = Math.min(elapsed / duration * 100, 100);
        progressBar.style.width = `${progress}%`;

        if (progress < 100) {
            requestAnimationFrame(updateProgress);
        } else {
            splashScreen.style.opacity = '0';
            splashScreen.style.transition = 'opacity 300ms ease-out';

            setTimeout(() => {
                splashScreen.style.display = 'none';
                mainContent.classList.remove('hidden');
            }, 300);
        }
    }

    requestAnimationFrame(updateProgress);
}

function initMobileNavigation() {
    document.body.addEventListener('click', (e) => {
        const navLink = e.target.closest('.mobile-nav-link');
        if (navLink) {
            e.preventDefault();
            document.querySelectorAll('.mobile-nav-link').forEach(link => {
                link.classList.toggle('active', link === navLink);
            });

            const targetId = navLink.getAttribute('href');
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
}

function initSmoothScrolling() {
    document.addEventListener('click', (e) => {
        const anchor = e.target.closest('a[href^="#"]');
        if (anchor) {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop,
                    behavior: 'smooth'
                });
            }
        }
    }, { passive: true });
}

function initToastSystem() {
    if (!document.getElementById('toast')) {
        const toastHTML = `
            <div id="toast" class="toast-notification hidden">
                <div class="toast-content">
                    <span id="toastMessage"></span>
                    <button class="toast-close" aria-label="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', toastHTML);
    }

    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.toast-close')) {
            hideToast();
        }
    });
}

window.showToast = function(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    if (!toast || !toastMessage) return;

    if (toast.timeoutId) clearTimeout(toast.timeoutId);

    toastMessage.textContent = message;
    toast.className = `toast-notification toast-${type}`;
    toast.classList.remove('hidden');

    toast.timeoutId = setTimeout(() => {
        toast.classList.add('hidden');
    }, 5000);

    toast.addEventListener('mouseenter', () => {
        clearTimeout(toast.timeoutId);
    });

    toast.addEventListener('mouseleave', () => {
        toast.timeoutId = setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    });
};

window.hideToast = function() {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.classList.add('hidden');
        if (toast.timeoutId) clearTimeout(toast.timeoutId);
    }
};

// ==================== INITIALIZATION ====================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlogPage);
} else {
    initBlogPage();
}

// Update copyright year
const yearElement = document.querySelector('.copyright');
if (yearElement) {
    yearElement.textContent = yearElement.textContent.replace('2025', new Date().getFullYear());
}