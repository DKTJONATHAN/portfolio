/**
 * Main JavaScript - Optimized for Performance
 * Key Improvements:
 * 1. Reduced blocking time with smarter loading
 * 2. Better event delegation
 * 3. Optimized animations
 * 4. Improved lazy loading
 * 5. Reduced memory leaks
 */

// ==================== CORE FUNCTIONS ====================

/**
 * Initialize the application
 */
function initApp() {
    // Load critical functions first
    initSplashScreen();
    initMobileNavigation();
    
    // Defer non-critical initializations
    requestIdleCallback(() => {
        initSmoothScrolling();
        initContactForm();
        initToastSystem();
        initBlogPosts();
    });
    
    // Load remaining features after 1s
    setTimeout(() => {
        initLazyLoading();
        initCategoryFilter();
    }, 1000);
}

// ==================== SPLASH SCREEN ====================

function initSplashScreen() {
    const splashScreen = document.getElementById('splashScreen');
    const mainContent = document.getElementById('mainContent');
    const progressBar = document.getElementById('progressBar');
    
    if (!splashScreen || !progressBar) return;

    let progress = 0;
    const duration = 2000; // 2 seconds total
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

// ==================== MOBILE NAVIGATION ====================

function initMobileNavigation() {
    // Use event delegation for mobile nav
    document.body.addEventListener('click', (e) => {
        const navLink = e.target.closest('.mobile-nav-link');
        if (navLink) {
            e.preventDefault();
            document.querySelectorAll('.mobile-nav-link').forEach(link => {
                link.classList.toggle('active', link === navLink);
            });
            
            // Smooth scroll to section
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

// ==================== SMOOTH SCROLLING ====================

function initSmoothScrolling() {
    // Use passive event listeners for better scrolling performance
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

// ==================== CONTACT FORM ====================

function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: contactForm.querySelector('#name').value.trim(),
            email: contactForm.querySelector('#email').value.trim(),
            service: contactForm.querySelector('#service').value,
            message: contactForm.querySelector('#message').value.trim()
        };

        // Validate form
        if (!validateForm(formData)) return;

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner"></span> Sending...';

            const response = await fetch('/.netlify/functions/storeSubmission', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Submission failed');
            }

            showToast(result.message || 'Message sent successfully!', 'success');
            contactForm.reset();

        } catch (error) {
            showToast(error.message || 'Failed to send message', 'error');
            console.error('Submission error:', error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

function validateForm(formData) {
    if (!formData.name || !formData.email || !formData.message) {
        showToast('Please fill all required fields', 'error');
        return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        showToast('Please enter a valid email', 'error');
        return false;
    }

    return true;
}

// ==================== TOAST SYSTEM ====================

function initToastSystem() {
    // Create toast element if it doesn't exist
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
        
        // Add styles dynamically
        const toastStyles = document.createElement('style');
        toastStyles.textContent = `
            .toast-notification {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                padding: 12px 24px;
                border-radius: 4px;
                color: white;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 12px;
                max-width: 90%;
                animation: fadeIn 0.3s ease-out;
            }
            .toast-success { background-color: #10B981; }
            .toast-error { background-color: #EF4444; }
            .toast-close {
                background: transparent;
                border: none;
                color: white;
                cursor: pointer;
                margin-left: 12px;
                padding: 0;
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateX(-50%) translateY(20px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
            .hidden { display: none !important; }
        `;
        document.head.appendChild(toastStyles);
    }

    // Close button functionality
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

    // Clear any existing timeout
    if (toast.timeoutId) clearTimeout(toast.timeoutId);

    // Update toast content
    toastMessage.textContent = message;
    toast.className = `toast-notification toast-${type}`;
    toast.classList.remove('hidden');

    // Auto-hide after 5 seconds
    toast.timeoutId = setTimeout(() => {
        toast.classList.add('hidden');
    }, 5000);

    // Pause on hover
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

// ==================== BLOG POSTS ====================

function initBlogPosts() {
    const showMoreBtn = document.getElementById('showMoreBtn');
    const morePosts = document.getElementById('morePosts');
    
    if (showMoreBtn && morePosts) {
        showMoreBtn.addEventListener('click', () => {
            const isExpanded = morePosts.style.display === 'grid';
            morePosts.style.display = isExpanded ? 'none' : 'grid';
            showMoreBtn.innerHTML = isExpanded 
                ? 'Show More Articles <i class="fas fa-chevron-down"></i>'
                : 'Show Less Articles <i class="fas fa-chevron-up"></i>';
        });
    }

    // Add hover effects using CSS class toggles instead of inline styles
    document.querySelectorAll('.blog-post').forEach(post => {
        post.addEventListener('mouseenter', () => {
            post.classList.add('hover-effect');
        });
        
        post.addEventListener('mouseleave', () => {
            post.classList.remove('hover-effect');
        });
    });
}

// ==================== LAZY LOADING ====================

function initLazyLoading() {
    const lazyLoad = () => {
        const lazyElements = document.querySelectorAll('[loading="lazy"]');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const elem = entry.target;
                    if (elem.tagName === 'IMG') {
                        elem.src = elem.dataset.src || elem.src;
                    }
                    elem.removeAttribute('loading');
                    observer.unobserve(elem);
                }
            });
        }, {
            rootMargin: '200px' // Load 200px before entering viewport
        });

        lazyElements.forEach(elem => observer.observe(elem));
    };

    // Run immediately and after dynamic content loads
    lazyLoad();
    document.addEventListener('DOMContentLoaded', lazyLoad);
}

// ==================== CATEGORY FILTER ====================

function initCategoryFilter() {
    document.querySelectorAll('.category-tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
            e.preventDefault();
            filterPostsByCategory(tag.textContent.trim());
        });
    });
}

function filterPostsByCategory(category) {
    const posts = document.querySelectorAll('.blog-post');
    let hasMatches = false;

    posts.forEach(post => {
        const postCategory = post.querySelector('.post-category').textContent.trim();
        const shouldShow = category === 'All' || postCategory === category;
        post.style.display = shouldShow ? '' : 'none';
        hasMatches = hasMatches || shouldShow;
    });

    // Handle no results
    const noResults = document.querySelector('.no-results-message');
    if (!hasMatches && !noResults) {
        const message = document.createElement('p');
        message.className = 'no-results-message';
        message.textContent = `No posts in "${category}" category`;
        document.querySelector('.blog-posts').appendChild(message);
    } else if (hasMatches && noResults) {
        noResults.remove();
    }
}

// ==================== INITIALIZATION ====================

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Update copyright year
const yearElement = document.querySelector('.copyright');
if (yearElement) {
    yearElement.textContent = yearElement.textContent.replace('2025', new Date().getFullYear());
}