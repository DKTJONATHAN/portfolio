/**
 * Jonathan Mwaniki - Portfolio Main JS
 * Simple and Reliable Implementation
 */

// DOM Elements
const splashScreen = document.getElementById('splashScreen');
const mainContent = document.getElementById('mainContent');
const progressBar = document.getElementById('progressBar');
const contactForm = document.getElementById('contactForm');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Simple Splash Screen Loader
    if (splashScreen && mainContent && progressBar) {
        let width = 0;
        const interval = setInterval(function() {
            width += 2;
            progressBar.style.width = width + '%';
            
            if (width >= 100) {
                clearInterval(interval);
                splashScreen.style.opacity = '0';
                
                setTimeout(function() {
                    splashScreen.style.display = 'none';
                    mainContent.style.display = 'block';
                    setTimeout(() => mainContent.style.opacity = '1', 10);
                }, 300);
            }
        }, 20);
    } else if (mainContent) {
        // If splash elements don't exist, show main content immediately
        mainContent.style.display = 'block';
        mainContent.style.opacity = '1';
    }

    // Initialize other functionality
    initActiveNav();
    if (contactForm) initFormHandler();
    initSmoothScrolling();
});

// Active navigation tracking
function initActiveNav() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    function updateActiveNav() {
        const scrollPosition = window.scrollY + 200;
        let currentActive = null;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentActive = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.toggle('active-nav', link.getAttribute('href') === `#${currentActive}`);
        });
    }
    
    window.addEventListener('scroll', updateActiveNav);
    updateActiveNav();
}

// Form submission handler
function initFormHandler() {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateForm(contactForm)) return;

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner"></span> Sending...';

            const formData = new FormData(contactForm);
            const response = await fetch('/.netlify/functions/storeSubmission', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    name: formData.get('name'),
                    email: formData.get('email'),
                    service: formData.get('service'),
                    message: formData.get('message'),
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) throw new Error('Failed to send message');
            
            showToast('Message sent successfully!');
            contactForm.reset();
        } catch (error) {
            showToast(error.message || 'Failed to send message. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

// Form validation
function validateForm(form) {
    let isValid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const requiredFields = form.querySelectorAll('[required]');

    requiredFields.forEach(field => {
        field.classList.remove('border-red-500');
        
        if (!field.value.trim()) {
            field.classList.add('border-red-500');
            isValid = false;
        } else if (field.type === 'email' && !emailRegex.test(field.value)) {
            field.classList.add('border-red-500');
            isValid = false;
        }
    });

    if (!isValid) {
        showToast('Please fill all required fields correctly', 'error');
    }

    return isValid;
}

// Toast notification system
function showToast(message, type = 'success') {
    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;
    toast.className = `toast-notification ${type}`;
    
    // Show toast
    toast.classList.remove('hidden');
    toast.classList.add('show');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 5000);
}

// Smooth scrolling for anchor links
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update URL without reload
                if (history.pushState) {
                    history.pushState(null, null, targetId);
                } else {
                    location.hash = targetId;
                }
            }
        });
    });
}