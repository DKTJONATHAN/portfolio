document.addEventListener('DOMContentLoaded', function() {
    // Simplified splash screen (1 second only)
    setTimeout(() => {
        const splashScreen = document.getElementById('splashScreen');
        splashScreen.classList.add('fade-out');
        
        setTimeout(() => {
            splashScreen.style.display = 'none';
            document.getElementById('mainContent').classList.add('visible');
        }, 300);
    }, 1000);

    // Enhanced form submission handler
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const formValues = Object.fromEntries(formData.entries());
            const timestamp = new Date().toISOString();
            
            // Prepare submission data
            const submission = {
                ...formValues,
                timestamp,
                status: 'new',
                ip: await getClientIP() // Optional: Get client IP
            };

            // Get form elements
            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            const originalHTML = submitButton.innerHTML;
            
            // Set loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            
            try {
                // Show loading toast
                showToast('Submitting your message...', 'info');
                
                // Send to Netlify function
                const response = await fetch('/.netlify/functions/storeSubmission', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(submission),
                });

                const responseData = await response.json();
                
                if (!response.ok) {
                    throw new Error(responseData.message || 'Failed to send message');
                }
                
                // Success handling
                showToast('Message sent successfully! We will get back to you soon.', 'success');
                contactForm.reset();
                
                // Optional: Track conversion
                trackConversion('form_submission');
                
            } catch (error) {
                console.error('Submission error:', error);
                showToast(error.message || 'Failed to send message. Please try again or contact us directly.', 'error');
                
                // Optional: Track error
                trackError('form_submission_error', error);
                
            } finally {
                // Reset button state
                submitButton.disabled = false;
                submitButton.textContent = originalText;
                submitButton.innerHTML = originalHTML;
            }
        });
    }
});

// Get client IP (optional)
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch {
        return 'unknown';
    }
}

// Toast notification system
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) return;
    
    // Clear any existing toasts
    toast.className = 'toast-notification hidden';
    
    // Set new toast content
    toastMessage.textContent = message;
    toast.className = `toast-notification ${type} visible`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        toast.classList.remove('visible');
    }, 5000);
}

// Analytics functions (optional)
function trackConversion(eventName) {
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName);
    }
    // Add other analytics providers as needed
}

function trackError(errorType, error) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'exception', {
            description: errorType,
            fatal: false
        });
    }
    // Consider sending error to your error tracking service
}