/**
 * Jonathan Mwaniki - Portfolio Main JS
 * Optimized for performance and GitHub form storage
 */

// DOM Elements Cache
const elements = {
  splashScreen: document.getElementById('splashScreen'),
  mainContent: document.getElementById('mainContent'),
  progressBar: document.getElementById('progressBar'),
  contactForm: document.getElementById('contactForm'),
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toastMessage')
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initSplashScreen();
  initActiveNav();
  if (elements.contactForm) initFormHandler();
  initSmoothScrolling();
});

// Splash screen with loading animation
function initSplashScreen() {
  if (!elements.splashScreen || !elements.mainContent || !elements.progressBar) return;

  let width = 0;
  const interval = setInterval(() => {
    width += 5;
    elements.progressBar.style.width = `${width}%`;
    
    if (width >= 100) {
      clearInterval(interval);
      elements.splashScreen.style.opacity = '0';
      setTimeout(() => {
        elements.splashScreen.style.display = 'none';
        elements.mainContent.style.display = 'block';
      }, 300);
    }
  }, 30);
}

// Form submission handler for GitHub storage
function initFormHandler() {
  elements.contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!validateForm(elements.contactForm)) return;

    const formData = new FormData(elements.contactForm);
    const submitBtn = elements.contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
      // Show loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Sending...';

      // Prepare data for GitHub
      const submission = {
        name: formData.get('name'),
        email: formData.get('email'),
        service: formData.get('service'),
        message: formData.get('message'),
        timestamp: new Date().toISOString(),
        pageUrl: window.location.href
      };

      // Send to Netlify function
      const response = await fetch('/.netlify/functions/github-form-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission)
      });

      if (!response.ok) throw new Error(await response.text());

      showToast('Message sent successfully!');
      elements.contactForm.reset();
    } catch (error) {
      showToast(error.message || 'Failed to send message', 'error');
      console.error('Submission error:', error);
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
  if (!elements.toast || !elements.toastMessage) return;

  elements.toastMessage.textContent = message;
  elements.toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${
    type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
  }`;
  
  elements.toast.classList.remove('hidden', 'opacity-0', 'translate-y-10');
  elements.toast.classList.add('opacity-100', 'translate-y-0');

  setTimeout(() => {
    elements.toast.classList.add('opacity-0', 'translate-y-10');
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
        history.pushState(null, null, targetId);
      }
    });
  });
}

// Active navigation tracking
function initActiveNav() {
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-link');
  
  function updateActiveNav() {
    const scrollPosition = window.scrollY + 200;
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        const id = section.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('active-nav', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }
  
  let isScrolling;
  window.addEventListener('scroll', () => {
    window.clearTimeout(isScrolling);
    isScrolling = setTimeout(updateActiveNav, 100);
  }, { passive: true });
  
  updateActiveNav();
}
