// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Splash Screen Animation (UNCHANGED)
    const splashScreen = document.getElementById('splashScreen');
    const mainContent = document.getElementById('mainContent');
    const progressBar = document.getElementById('progressBar');

    if (splashScreen && mainContent && progressBar) {
        let width = 0;
        const totalTime = 2000;
        const interval = setInterval(function() {
            width += 2;
            progressBar.style.width = width + '%';
            if (width >= 100) {
                clearInterval(interval);
                splashScreen.style.opacity = '0';
                setTimeout(function() {
                    splashScreen.style.display = 'none';
                    mainContent.style.display = 'block';
                }, 300);
            }
        }, totalTime / 50);
    }

    // Active Navigation Link (UNCHANGED)
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    function updateActiveNav() {
        let current = '';
        const scrollPosition = window.scrollY + 200;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.toggle('active-nav', link.getAttribute('href') === `#${current}`);
        });
    }

    let isScrolling;
    window.addEventListener('scroll', function() {
        window.clearTimeout(isScrolling);
        isScrolling = setTimeout(updateActiveNav, 100);
    }, { passive: true });

    updateActiveNav();

    // Contact Form Handler (FIXED)
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (!validateForm(contactForm)) return;

            const form = e.target;
            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;

            // Disable button during submission
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="inline-block animate-spin mr-2">↻</span> Sending...';

            try {
                const formData = new FormData(form);
                const data = {
                    form_name: 'contact',
                    timestamp: new Date().toISOString()
                };
                
                // Convert FormData to object
                for (let [key, value] of formData.entries()) {
                    data[key] = value;
                }

                // Send to GitHub function with proper headers
                const response = await fetch('/.netlify/functions/github-update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Submission failed');
                }

                showSuccessPopup('Message sent successfully!');
                form.reset();
            } catch (error) {
                showErrorPopup(error.message || 'Failed to send message. Please try again.');
                console.error('Contact form error:', error);
            } finally {
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        });
    }

    // Newsletter Form Handler (FIXED)
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (!validateForm(newsletterForm)) return;

            const form = e.target;
            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;

            // Disable button during submission
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="inline-block animate-spin mr-2">↻</span> Subscribing...';

            try {
                const formData = new FormData(form);
                const data = {
                    form_name: 'newsletter',
                    timestamp: new Date().toISOString()
                };
                
                // Convert FormData to object
                for (let [key, value] of formData.entries()) {
                    data[key] = value;
                }

                // Send to GitHub function with proper headers
                const response = await fetch('/.netlify/functions/github-update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Subscription failed');
                }

                showSuccessPopup('Thank you for subscribing!');
                form.reset();
            } catch (error) {
                showErrorPopup(error.message || 'Failed to subscribe. Please try again.');
                console.error('Newsletter error:', error);
            } finally {
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        });
    }

    // Smooth scrolling (UNCHANGED)
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

                if (history.pushState) {
                    history.pushState(null, null, targetId);
                } else {
                    location.hash = targetId;
                }
            }
        });
    });

    // Basic form validation (UNCHANGED)
    function validateForm(form) {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('border-red-500');
                isValid = false;
            } else {
                field.classList.remove('border-red-500');
            }

            // Email validation
            if (field.type === 'email' && field.value.trim()) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(field.value)) {
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
});

// Popup Notifications (UNCHANGED)
function showSuccessPopup(message) {
    showPopup(message, {
        bgColor: 'bg-green-50',
        textColor: 'text-green-800',
        borderColor: 'border-green-500',
        icon: `<svg class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>`
    });
}

function showErrorPopup(message) {
    showPopup(message, {
        bgColor: 'bg-red-50',
        textColor: 'text-red-800',
        borderColor: 'border-red-500',
        icon: `<svg class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>`
    });
}

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
                <div class="flex-shrink-0">
                    ${icon}
                </div>
                <div class="ml-3 w-0 flex-1 pt-0.5">
                    <p class="text-sm font-medium ${textColor}">
                        ${message}
                    </p>
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

    setTimeout(() => {
        popup.classList.remove('translate-y-4', 'opacity-0');
        popup.classList.add('translate-y-0', 'opacity-100');
    }, 10);

    const hideTimer = setTimeout(() => {
        hidePopup(popup);
    }, 5000);

    const closeButton = popup.querySelector('button');
    closeButton.addEventListener('click', () => {
        clearTimeout(hideTimer);
        hidePopup(popup);
    });
}

function hidePopup(popup) {
    popup.classList.add('translate-y-4', 'opacity-0');
    setTimeout(() => {
        popup.remove();
    }, 300);
}