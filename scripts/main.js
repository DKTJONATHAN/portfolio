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
                showToast('Please fill in all required fields', 'error');
                return;
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showToast('Please enter a valid email address', 'error');
                return;
            }

            // Disable button during submission
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Sending...';

            try {
                const response = await fetch('/.netlify/functions/saveContact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        service,
                        message,
                        timestamp: new Date().toISOString()
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Submission failed');
                }

                showToast('Thank you for your message! I will get back to you soon.', 'success');
                form.reset();
            } catch (error) {
                console.error('Form submission error:', error);
                showToast(error.message || 'Failed to send message. Please try again.', 'error');
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
                showToast('Please enter your email address', 'error');
                return;
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showToast('Please enter a valid email address', 'error');
                return;
            }

            // Disable button during submission
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Subscribing...';

            try {
                const response = await fetch('/.netlify/functions/saveSubscriber', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        email,
                        timestamp: new Date().toISOString(),
                        source: 'website'
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Subscription failed');
                }

                showToast('Thank you for subscribing!', 'success');
                form.reset();
            } catch (error) {
                console.error('Subscription error:', error);
                showToast(error.message || 'Failed to subscribe. Please try again.', 'error');
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

// Toast Notification Functions
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    if (!toast || !toastMessage) return;

    // Clear previous toast state
    toast.className = 'fixed bottom-4 right-4 shadow-xl rounded-lg px-6 py-3 transform translate-y-10 opacity-0 transition-all duration-300 z-50 hidden';

    // Set message and style
    toastMessage.textContent = message;
    toast.classList.add(
        type === 'error' ? 'bg-red-100 text-red-700' : 
        type === 'success' ? 'bg-green-100 text-green-700' : 
        'bg-white text-gray-800'
    );

    // Show toast
    toast.classList.remove('hidden', 'opacity-0', 'translate-y-10');
    toast.classList.add('opacity-100', 'translate-y-0');

    // Auto-hide after 5 seconds
    const hideTimer = setTimeout(hideToast, 5000);

    // Allow manual close
    toast.onclick = function() {
        clearTimeout(hideTimer);
        hideToast();
    };
}

function hideToast() {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'translate-y-10');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 300);
}