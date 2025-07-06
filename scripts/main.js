// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Splash Screen Animation
    const splashScreen = document.getElementById('splashScreen');
    const mainContent = document.getElementById('mainContent');
    const progressBar = document.getElementById('progressBar');

    if (splashScreen && mainContent && progressBar) {
        let width = 0;
        const totalTime = 2000; // 2 seconds
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

    // Active Navigation Link
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

    // Throttle scroll events for better performance
    let isScrolling;
    window.addEventListener('scroll', function() {
        window.clearTimeout(isScrolling);
        isScrolling = setTimeout(updateActiveNav, 100);
    }, { passive: true });

    // Initial check
    updateActiveNav();

    // Contact Form Handler
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const form = e.target;
            const formData = new FormData(form);
            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;

            // Get form values
            const name = formData.get('name').trim();
            const email = formData.get('email').trim();
            const service = formData.get('service');
            const message = formData.get('message').trim();

            // Validation
            if (!name || !email || !service || !message) {
                showPopup('Please fill in all required fields', 'error');
                return;
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showPopup('Please enter a valid email address', 'error');
                return;
            }

            // Disable button during submission
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Sending...';

            try {
                const response = await fetch('/.netlify/functions/saveForm', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        formType: 'contact',
                        name,
                        email,
                        service,
                        message
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Submission failed');
                }

                // Verify data was written
                const verifyResponse = await fetch('/.netlify/functions/verifyData', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        formType: 'contact',
                        email
                    })
                });

                const verifyData = await verifyResponse.json();

                if (!verifyResponse.ok || !verifyData.exists) {
                    throw new Error('Failed to verify data was saved');
                }

                showPopup('Message sent successfully!', 'success');
                form.reset();
            } catch (error) {
                console.error('Form submission error:', error);
                showPopup(error.message || 'Failed to send message. Please try again.', 'error');
            } finally {
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        });
    }

    // Newsletter Form Handler
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const form = e.target;
            const formData = new FormData(form);
            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            const email = formData.get('email').trim();

            // Validation
            if (!email) {
                showPopup('Please enter your email address', 'error');
                return;
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showPopup('Please enter a valid email address', 'error');
                return;
            }

            // Disable button during submission
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Subscribing...';

            try {
                const response = await fetch('/.netlify/functions/saveForm', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        formType: 'newsletter',
                        email
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Subscription failed');
                }

                // Verify data was written
                const verifyResponse = await fetch('/.netlify/functions/verifyData', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        formType: 'newsletter',
                        email
                    })
                });

                const verifyData = await verifyResponse.json();

                if (!verifyResponse.ok || !verifyData.exists) {
                    throw new Error('Failed to verify subscription was saved');
                }

                showPopup('Thank you for subscribing!', 'success');
                form.reset();
            } catch (error) {
                console.error('Subscription error:', error);
                showPopup(error.message || 'Failed to subscribe. Please try again.', 'error');
            } finally {
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        });
    }

    // Smooth scrolling for anchor links
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

                // Update URL without page jump
                if (history.pushState) {
                    history.pushState(null, null, targetId);
                } else {
                    location.hash = targetId;
                }
            }
        });
    });
});

// Popup Notification Functions
function showPopup(message, type = 'success') {
    // Create popup container if it doesn't exist
    let popupContainer = document.getElementById('customPopupContainer');
    if (!popupContainer) {
        popupContainer = document.createElement('div');
        popupContainer.id = 'customPopupContainer';
        popupContainer.className = 'fixed inset-0 flex items-center justify-center z-50 pointer-events-none';
        document.body.appendChild(popupContainer);
    }

    // Create popup element
    const popup = document.createElement('div');
    popup.className = `bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4 transform transition-all duration-300 pointer-events-auto ${
        type === 'error' ? 'border-l-4 border-red-500' : 
        type === 'success' ? 'border-l-4 border-green-500' : 
        'border-l-4 border-blue-500'
    }`;
    
    // Add content
    popup.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0">
                ${type === 'error' ? '<svg class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>' : 
                type === 'success' ? '<svg class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>' : 
                '<svg class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'}
            </div>
            <div class="ml-3">
                <h3 class="text-lg leading-6 font-medium ${
                    type === 'error' ? 'text-red-800' : 
                    type === 'success' ? 'text-green-800' : 
                    'text-gray-800'
                }">
                    ${type === 'error' ? 'Error' : 
                    type === 'success' ? 'Success' : 
                    'Notice'}
                </h3>
                <div class="mt-2 text-sm ${
                    type === 'error' ? 'text-red-600' : 
                    type === 'success' ? 'text-green-600' : 
                    'text-gray-600'
                }">
                    <p>${message}</p>
                </div>
            </div>
        </div>
    `;

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'absolute top-2 right-2 text-gray-400 hover:text-gray-500';
    closeButton.innerHTML = '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';
    closeButton.addEventListener('click', () => {
        popup.remove();
    });
    popup.appendChild(closeButton);

    // Add to container and animate in
    popupContainer.appendChild(popup);
    popup.style.opacity = '0';
    popup.style.transform = 'translateY(20px)';
    
    // Force reflow to enable transition
    void popup.offsetWidth;
    
    popup.style.opacity = '1';
    popup.style.transform = 'translateY(0)';

    // Auto-hide after 5 seconds
    const hideTimer = setTimeout(() => {
        popup.style.opacity = '0';
        popup.style.transform = 'translateY(20px)';
        setTimeout(() => {
            popup.remove();
        }, 300);
    }, 5000);

    // Allow manual close
    popup.addEventListener('click', (e) => {
        if (e.target === popup || e.target.closest('button')) {
            clearTimeout(hideTimer);
            popup.style.opacity = '0';
            popup.style.transform = 'translateY(20px)';
            setTimeout(() => {
                popup.remove();
            }, 300);
        }
    });
}