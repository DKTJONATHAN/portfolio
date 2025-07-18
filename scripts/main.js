// DOM Elements
const splashScreen = document.getElementById('splashScreen');
const mainContent = document.getElementById('mainContent');
const progressBar = document.getElementById('progressBar');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const toastClose = document.querySelector('.toast-close');

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Show splash screen immediately
    splashScreen.style.display = 'flex';
    
    // Start progress bar animation
    animateProgressBar();
    
    // Initialize other functionality
    initSmoothScrolling();
    initMobileNavigation();
    initFormSubmission();
    initScrollSpy();
    
    // When everything is loaded
    window.addEventListener('load', function() {
        // Mark body as loaded
        document.body.classList.add('loaded');
        
        // Hide splash screen after delay
        setTimeout(function() {
            splashScreen.style.opacity = '0';
            splashScreen.style.visibility = 'hidden';
            
            // Show main content
            mainContent.classList.remove('hidden');
            
            // Remove splash screen from DOM after transition
            setTimeout(function() {
                splashScreen.remove();
            }, 800);
        }, 1500);
    });
});

// Progress bar animation
function animateProgressBar() {
    let width = 0;
    const interval = setInterval(function() {
        if (width >= 100) {
            clearInterval(interval);
        } else {
            width++;
            progressBar.style.width = width + '%';
        }
    }, 15);
}

// Smooth scrolling for anchor links
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Mobile navigation
function initMobileNavigation() {
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            link.classList.add('active');
            mobileNavLinks.forEach(otherLink => {
                if (otherLink !== link) otherLink.classList.remove('active');
            });
        });
    });
}

// Form submission
function initFormSubmission() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const submitBtn = this.querySelector('button[type="submit"]');
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner"></i> Sending...';
            
            // Simulate form submission
            setTimeout(() => {
                showToast('Message sent successfully!');
                this.reset();
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Message';
            }, 1500);
        });
    }
}

// Scroll spy for navigation
function initScrollSpy() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    
    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// Toast notification functions
function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 5000);
}

if (toastClose) {
    toastClose.addEventListener('click', hideToast);
}

function hideToast() {
    toast.classList.add('hidden');
}

// Add spin animation class to spinners
document.addEventListener('DOMContentLoaded', function() {
    const spinners = document.querySelectorAll('.fa-spinner');
    spinners.forEach(spinner => {
        spinner.classList.add('spin-animation');
    });
});