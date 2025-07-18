document.addEventListener('DOMContentLoaded', function() {
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
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Form submission handler
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        const originalSubmitText = contactForm.querySelector('button[type="submit"]').innerHTML;

        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            
            try {
                // Prepare form data
                const formData = {
                    name: document.getElementById('name').value.trim(),
                    email: document.getElementById('email').value.trim(),
                    service: document.getElementById('service').value,
                    message: document.getElementById('message').value.trim()
                };

                // Validation
                if (!formData.name || !formData.email || !formData.message) {
                    throw new Error('Please fill in all required fields');
                }

                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                    throw new Error('Please enter a valid email address');
                }

                // UI feedback
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

                // Send to Netlify function
                const response = await fetch('/.netlify/functions/storeSubmission', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Failed to send message');
                }

                // Success
                showToast('✅ Message sent successfully!', 'success');
                contactForm.reset();
                console.log('Submission stored:', result.id);
                
                // Optional: Show commit link
                if (result.commitUrl) {
                    console.log('GitHub commit:', result.commitUrl);
                }

            } catch (error) {
                console.error('Submission error:', error);
                showToast(`❌ Error: ${error.message}`, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalSubmitText;
            }
        });
    }

    // Toast notification system
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    window.hideToast = function() {
        toast.classList.add('hidden');
    };

    window.showToast = function(message, type = 'success') {
        toastMessage.textContent = message;
        toast.className = `toast-notification ${type}`;
        toast.classList.remove('hidden');
        setTimeout(hideToast, 5000);
    };

    // Active nav link highlighting
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        let currentSection = '';
        sections.forEach(section => {
            if (window.scrollY >= section.offsetTop - 200) {
                currentSection = section.getAttribute('id');
            }
        });

        document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${currentSection}`);
        });
    });
});
