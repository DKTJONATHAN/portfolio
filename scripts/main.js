// /scripts/main.js
document.addEventListener('DOMContentLoaded', () => {
    // Debounce utility for scroll events
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Lazy-Loading Images
    if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll('img.lazy-image');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.add('loaded');
                    img.removeAttribute('loading');
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '100px',
            threshold: 0.1
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    } else {
        const lazyImages = document.querySelectorAll('img.lazy-image');
        lazyImages.forEach(img => {
            img.src = img.dataset.src || img.src;
            img.classList.add('loaded');
            img.removeAttribute('loading');
        });
    }

    // Scroll-Based Animations
    const sections = document.querySelectorAll('section');
    const observerOptions = {
        rootMargin: '0px 0px -100px 0px',
        threshold: 0.1
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('opacity-100', 'translate-y-0');
                entry.target.classList.remove('opacity-0', 'translate-y-10');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        section.classList.add('opacity-0', 'translate-y-10', 'transition-all', 'duration-500');
        sectionObserver.observe(section);
    });

    // Sticky Nav Scroll Effect
    window.addEventListener('scroll', debounce(() => {
        const desktopNav = document.querySelector('.desktop-nav');
        if (window.scrollY > 50) {
            desktopNav.classList.add('bg-white', 'shadow-nav');
            desktopNav.classList.remove('bg-opacity-95');
        } else {
            desktopNav.classList.add('bg-opacity-95');
            desktopNav.classList.remove('bg-white', 'shadow-nav');
        }
    }, 16));
});