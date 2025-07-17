/**
 * Jonathan Mwaniki - Portfolio Main JS
 * Netlify Function-powered form handling
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

// Form submission handler for Netlify Functions
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

      // Prepare submission data
      const submission = {
        name: formData.get('name'),
        email: formData.get('email'),
        service: formData.get('service'),
        message: formData.get('message'),
        timestamp: new Date().toISOString(),
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        referrer: document.referrer
      };

      // Send to Netlify function
      const response = await fetch('/.netlify/functions/storeSubmission', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(submission)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to store submission');
      }

      showToast('Message sent successfully!');
      elements.contactForm.reset();

      // Optional: Track conversion
      if (typeof gtag !== 'undefined') {
        gtag('event', 'contact_form_submit', {
          event_category: 'engagement',
          event_label: 'Contact Form Submission'
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      showToast(error.message || 'Failed to send message. Please try again.', 'error');
      
      // Fallback: Store in localStorage if Netlify function fails
      storeSubmissionLocally(submission);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

// Local storage fallback
function storeSubmissionLocally(submission) {
  try {
    const submissions = JSON.parse(localStorage.getItem('pendingSubmissions') || [];
    submissions.push(submission);
    localStorage.setItem('pendingSubmissions', JSON.stringify(submissions));
    console.warn('Submission stored locally. Will retry later.');
  } catch (e) {
    console.error('Local storage error:', e);
  }
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
  elements.toast.className = `toast-notification ${type === 'error' ? 'error' : 'success'}`;
  
  // Show toast
  elements.toast.classList.remove('hidden');
  elements.toast.classList.add('show');
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    elements.toast.classList.remove('show');
    setTimeout(() => elements.toast.classList.add('hidden'), 300);
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
        
        // Update URL without reload
        if (history.pushState) {
          history.pushState(null, null, targetId);
        } else {
          location.hash = targetId;
        }
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
    let currentActive = null;
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        currentActive = section.getAttribute('id');
      }
    });
    
    navLinks.forEach(link => {
      link.classList.toggle('active-nav', link.getAttribute('href') === `#${currentActive}`);
    });
  }
  
  // Debounced scroll event
  let isScrolling;
  window.addEventListener('scroll', () => {
    window.clearTimeout(isScrolling);
    isScrolling = setTimeout(updateActiveNav, 100);
  }, { passive: true });
  
  // Initial update
  updateActiveNav();
}

// Retry failed submissions when back online
function initSubmissionRetry() {
  if (navigator.onLine) {
    const pendingSubmissions = JSON.parse(localStorage.getItem('pendingSubmissions') || [];
    if (pendingSubmissions.length > 0) {
      pendingSubmissions.forEach(async (submission) => {
        try {
          const response = await fetch('/.netlify/functions/storeSubmission', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submission)
          });
          
          if (response.ok) {
            // Remove successfully sent submission
            const updatedSubmissions = pendingSubmissions.filter(s => s.timestamp !== submission.timestamp);
            localStorage.setItem('pendingSubmissions', JSON.stringify(updatedSubmissions));
          }
        } catch (error) {
          console.error('Retry failed:', error);
        }
      });
    }
  }
}

// Initialize network recovery handler
window.addEventListener('online', initSubmissionRetry);
initSubmissionRetry();