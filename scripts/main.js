// Cache DOM elements and reusable variables at the top
const splashScreen = document.getElementById('splashScreen');
const mainContent = document.getElementById('mainContent');
const progressBar = document.getElementById('progressBar');
const spinnerHtml = '<span class="inline-block animate-spin mr-2">↻</span>';
let isScrolling;

// Optimized splash screen animation
function initSplashScreen() {
    if (!splashScreen || !mainContent || !progressBar) return;

    let width = 0;
    const totalTime = 1000; // Reduced from 2000ms
    const interval = setInterval(() => {
        width += 5; // Increased increment
        progressBar.style.width = `${width}%`;
        
        if (width >= 100) {
            clearInterval(interval);
            splashScreen.style.opacity = '0';
            // Remove setTimeout for immediate content display
            splashScreen.style.display = 'none';
            mainContent.style.display = 'block';
        }
    }, totalTime / 20); // Fewer intervals
}

// Optimized active nav link tracking
function initActiveNav() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    const windowHeight = window.innerHeight;

    function updateActiveNav() {
        let current = '';
        const scrollPosition = window.scrollY + 200;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            // Only check sections near viewport
            if (scrollPosition >= sectionTop - windowHeight && 
                scrollPosition < sectionTop + section.clientHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            const isActive = link.getAttribute('href') === `#${current}`;
            // Only update if state changed
            if (isActive !== link.classList.contains('active-nav')) {
                link.classList.toggle('active-nav', isActive);
            }
        });
    }

    // More aggressive throttling
    window.addEventListener('scroll', () => {
        window.clearTimeout(isScrolling);
        isScrolling = setTimeout(updateActiveNav, 200); // Increased from 100ms
    }, { passive: true });

    updateActiveNav();
}

// Optimized form handling with shared functionality
function initForms() {
    const contactForm = document.getElementById('contactForm');
    const newsletterForm = document.getElementById('newsletterForm');

    async function handleFormSubmit(e, formType) {
        e.preventDefault();
        const form = e.target;
        
        if (!validateForm(form)) return;

        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;

        submitButton.disabled = true;
        submitButton.innerHTML = `${spinnerHtml}${formType === 'contact' ? 'Sending...' : 'Subscribing...'}`;

        try {
            const formData = new FormData(form);
            const data = {
                form_name: formType,
                timestamp: new Date().toISOString()
            };

            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }

            const response = await fetch('/.netlify/functions/github-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `${formType === 'contact' ? 'Submission' : 'Subscription'} failed`);
            }

            showSuccessPopup(formType === 'contact' 
                ? 'Message sent successfully!' 
                : 'Thank you for subscribing!');
            form.reset();
        } catch (error) {
            showErrorPopup(error.message || 
                `Failed to ${formType === 'contact' ? 'send message' : 'subscribe'}. Please try again.`);
            console.error(`${formType} error:`, error);
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    }

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => handleFormSubmit(e, 'contact'));
    }

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => handleFormSubmit(e, 'newsletter'));
    }
}

// Optimized smooth scrolling with event delegation
function initSmoothScrolling() {
    document.body.addEventListener('click', (e) => {
        if (e.target.matches('a[href^="#"]')) {
            e.preventDefault();
            const targetId = e.target.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                if (history.pushState) {
                    history.pushState(null, null, targetId);
                } else {
                    location.hash = targetId;
                }
            }
        }
    });
}

// Optimized form validation
function validateForm(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    requiredFields.forEach(field => {
        const hasValue = field.value.trim();
        
        if (!hasValue) {
            field.classList.add('border-red-500');
            isValid = false;
        } else {
            field.classList.remove('border-red-500');
            
            if (field.type === 'email' && !emailRegex.test(field.value)) {
                field.classList.add('border-red-500');
                isValid = false;
            }
        }
    });

    if (!isValid) {
        showErrorPopup('Please fill all required fields correctly');
    }

    return isValid;
}

// Optimized popup notifications
function showPopup(message, { bgColor, textColor, borderColor, icon }) {
    let popupContainer = document.getElementById('popupContainer');
    
    if (!popupContainer) {
        popupContainer = document.createElement('div');
        popupContainer.id = 'popupContainer';
        popupContainer.className = 'fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50';
        document.body.appendChild(popupContainer);
    }

    const popup = document.createElement('div');
    popup.className = `max-w-sm w-full ${bgColor} shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transition-all transform translate-y-4 opacity-0`;
    popup.style.transition = 'all 0.3s ease-out';

    popup.innerHTML = `
        <div class="p-4">
            <div class="flex items-start">
                <div class="flex-shrink-0">${icon}</div>
                <div class="ml-3 w-0 flex-1 pt-0.5">
                    <p class="text-sm font-medium ${textColor}">${message}</p>
                </div>
                <div class="ml-4 flex-shrink-0 flex">
                    <button class="${bgColor} rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none">
                        <span class="sr-only">Close</span>
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;

    popupContainer.appendChild(popup);

    // Use requestAnimationFrame for smoother animation
    requestAnimationFrame(() => {
        popup.classList.remove('translate-y-4', 'opacity-0');
        popup.classList.add('translate-y-0', 'opacity-100');
    });

    const hideTimer = setTimeout(() => hidePopup(popup), 5000);
    popup.querySelector('button').addEventListener('click', () => {
        clearTimeout(hideTimer);
        hidePopup(popup);
    }, { once: true });
}

function hidePopup(popup) {
    popup.classList.add('translate-y-4', 'opacity-0');
    setTimeout(() => popup.remove(), 300);
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initSplashScreen();
    initActiveNav();
    initForms();
    initSmoothScrolling();
});

// Export functions for testing if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateForm,
        showPopup,
        hidePopup
    };
}