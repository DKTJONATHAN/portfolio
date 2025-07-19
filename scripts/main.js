document.addEventListener('DOMContentLoaded', function() {
    // Create toast element dynamically
    if (!document.getElementById('toast')) {
        const toastElement = document.createElement('div');
        toastElement.id = 'toast';
        toastElement.className = 'toast-notification hidden';
        toastElement.innerHTML = `
            <div class="toast-content">
                <span id="toastMessage"></span>
                <button class="toast-close" aria-label="Close notification">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        document.body.appendChild(toastElement);
    }

    // Splash screen animation
    const progressBar = document.getElementById('progressBar');
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(progressInterval);
        }
        progressBar.style.width = progress + '%';
    }, 200);

    setTimeout(() => {
        document.getElementById('splashScreen').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
    }, 3000);

    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Form submission handler
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            const formData = {
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                service: document.getElementById('service').value,
                message: document.getElementById('message').value.trim()
            };

            // Validation
            if (!formData.name || !formData.email || !formData.message) {
                showToast('Please fill in all required fields', 'error');
                return;
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                showToast('Please enter a valid email address', 'error');
                return;
            }

            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

                const response = await fetch('/.netlify/functions/storeSubmission', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result.message || 'Failed to send message');
                }

                // Use the message from backend or fallback
                showToast(result.message || 'Thank you! Your message has been sent successfully.', 'success');
                contactForm.reset();

            } catch (error) {
                console.error('Submission error:', error);
                showToast(error.message || 'Failed to send message. Please try again later.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // Toast notification system
    window.showToast = function(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        const toastClose = toast.querySelector('.toast-close');

        // Set message and type
        toastMessage.textContent = message;
        toast.className = `toast-notification toast-${type}`;
        toast.classList.remove('hidden');

        // Close button functionality
        toastClose.onclick = function() {
            toast.classList.add('hidden');
        };

        // Auto-hide after 5 seconds
        let timeoutId = setTimeout(() => {
            toast.classList.add('hidden');
        }, 5000);

        // Reset timeout on interaction
        toast.addEventListener('mouseenter', () => {
            clearTimeout(timeoutId);
        });

        toast.addEventListener('mouseleave', () => {
            timeoutId = setTimeout(() => {
                toast.classList.add('hidden');
            }, 3000);
        });
    };

    window.hideToast = function() {
        document.getElementById('toast').classList.add('hidden');
    };
});

// Toast styles
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

.toast-success {
    background-color: #10B981;
}

.toast-error {
    background-color: #EF4444;
}

.toast-content {
    display: flex;
    align-items: center;
}

.toast-close {
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 1.2em;
    margin-left: 12px;
    padding: 0;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.hidden {
    display: none !important;
}
`;
document.head.appendChild(toastStyles);
// Show More Button Functionality
document.addEventListener('DOMContentLoaded', function() {
    const showMoreBtn = document.getElementById('showMoreBtn');
    const morePosts = document.getElementById('morePosts');
    
    if (showMoreBtn && morePosts) {
        showMoreBtn.addEventListener('click', function() {
            if (morePosts.style.display === 'none') {
                morePosts.style.display = 'grid';
                showMoreBtn.innerHTML = 'Show Less Articles <i class="fas fa-chevron-up"></i>';
            } else {
                morePosts.style.display = 'none';
                showMoreBtn.innerHTML = 'Show More Articles <i class="fas fa-chevron-down"></i>';
            }
        });
    }
    
    // Splash screen functionality
    const splashScreen = document.getElementById('splashScreen');
    const mainContent = document.getElementById('mainContent');
    const progressBar = document.getElementById('progressBar');
    
    if (splashScreen && mainContent && progressBar) {
        // Simulate loading progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                // Hide splash screen and show main content
                setTimeout(() => {
                    splashScreen.style.opacity = '0';
                    splashScreen.style.transition = 'opacity 0.5s ease';
                    
                    setTimeout(() => {
                        splashScreen.style.display = 'none';
                        mainContent.classList.remove('hidden');
                    }, 500);
                }, 300);
            }
            progressBar.style.width = `${progress}%`;
        }, 100);
    }
});
// main.js

// DOM Elements
const splashScreen = document.getElementById('splashScreen');
const mainContent = document.getElementById('mainContent');
const progressBar = document.getElementById('progressBar');

// Function to simulate loading progress
function simulateLoading() {
    let width = 0;
    const interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                splashScreen.style.opacity = '0';
                setTimeout(() => {
                    splashScreen.style.display = 'none';
                    mainContent.classList.remove('hidden');
                }, 500);
            }, 300);
        } else {
            width += 10;
            progressBar.style.width = width + '%';
        }
    }, 100);
}

// Initialize mobile menu toggle
function initMobileMenu() {
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Remove active class from all links
            mobileNavLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            link.classList.add('active');
        });
    });
}

// Initialize smooth scrolling for anchor links
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Initialize blog post interactions
function initBlogPosts() {
    const blogPosts = document.querySelectorAll('.blog-post');
    
    blogPosts.forEach(post => {
        post.addEventListener('click', (e) => {
            // If the click wasn't on a link or button, navigate to the post
            if (!e.target.closest('a') && !e.target.closest('button')) {
                const link = post.querySelector('.btn-primary');
                if (link) {
                    window.location.href = link.href;
                }
            }
        });
        
        // Add hover effects
        post.addEventListener('mouseenter', () => {
            post.style.transform = 'translateY(-5px)';
            post.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
        });
        
        post.addEventListener('mouseleave', () => {
            post.style.transform = 'translateY(0)';
            post.style.boxShadow = '0 5px 15px rgba(0,0,0,0.05)';
        });
    });
}

// Initialize lazy loading for images
function initLazyLoading() {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });
        
        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Initialize category filter functionality
function initCategoryFilter() {
    const categoryTags = document.querySelectorAll('.category-tag');
    
    categoryTags.forEach(tag => {
        tag.addEventListener('click', (e) => {
            e.preventDefault();
            const category = tag.textContent.trim();
            filterPostsByCategory(category);
        });
    });
}

function filterPostsByCategory(category) {
    const posts = document.querySelectorAll('.blog-post');
    let hasMatches = false;
    
    posts.forEach(post => {
        const postCategory = post.querySelector('.post-category').textContent.trim();
        if (category === 'All' || postCategory === category) {
            post.style.display = 'flex';
            hasMatches = true;
        } else {
            post.style.display = 'none';
        }
    });
    
    // Show message if no posts match the category
    const noResultsMessage = document.querySelector('.no-results-message');
    if (!hasMatches) {
        if (!noResultsMessage) {
            const message = document.createElement('p');
            message.className = 'no-results-message';
            message.textContent = `No posts found in the ${category} category.`;
            document.querySelector('.blog-posts').appendChild(message);
        }
    } else if (noResultsMessage) {
        noResultsMessage.remove();
    }
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    simulateLoading();
    initMobileMenu();
    initSmoothScrolling();
    initBlogPosts();
    initLazyLoading();
    initCategoryFilter();
    
    // Add current year to copyright
    const yearElement = document.querySelector('.copyright');
    if (yearElement) {
        yearElement.textContent = yearElement.textContent.replace('2025', new Date().getFullYear());
    }
});

// Handle window resize events
window.addEventListener('resize', () => {
    // You can add responsive behaviors here if needed
});
