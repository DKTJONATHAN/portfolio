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