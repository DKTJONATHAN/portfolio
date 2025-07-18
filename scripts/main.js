document.addEventListener('DOMContentLoaded', function() {
    // Create toast element dynamically if it doesn't exist
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

    // Form submission
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
                message: document.getElementById('message').value.trim(),
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                referrer: document.referrer || 'Direct'
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

                // Force writing the message to the function
                const response = await fetch('/.netlify/functions/storeSubmission', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to send message');
                }

                const result = await response.json();
                
                // Only show success message if we get a successful response
                if (result.success) {
                    showToast('✅ Message sent successfully!', 'success');
                    contactForm.reset();
                } else {
                    throw new Error(result.message || 'Message submission failed');
                }
            } catch (error) {
                console.error('Submission error:', error);
                showToast(`❌ Error: ${error.message || 'Failed to send message'}`, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // Toast functions
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
        const timeoutId = setTimeout(() => {
            toast.classList.add('hidden');
        }, 5000);

        // Clear timeout if user hovers over toast
        toast.addEventListener('mouseenter', () => {
            clearTimeout(timeoutId);
        });

        // Reset timeout when mouse leaves
        toast.addEventListener('mouseleave', () => {
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 3000);
        });
    };

    window.hideToast = function() {
        document.getElementById('toast').classList.add('hidden');
    };
});

// Add toast styles dynamically
const toastStyles = document.createElement('style');
toastStyles.textContent = `
.toast-notification {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    z-index: 9999;
    max-width: 90%;
    width: auto;
    min-width: 300px;
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
    gap: 0.75rem;
}

.toast-close {
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    margin-left: 1rem;
    padding: 0.25rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.toast-close:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

@keyframes fadeIn {
    from { opacity: 0; transform: translate(-50%, -40%); }
    to { opacity: 1; transform: translate(-50%, -50%); }
}

.hidden {
    display: none !important;
}
`;
document.head.appendChild(toastStyles);