// =============== Contact page specific functionality ===============

document.addEventListener('DOMContentLoaded', function() {
    // =============== Initialize form functionality ===============
    initializeContactForm();
    
    // =============== Initialize animations ===============
    initializeAnimations();
    
    // =============== Cart is now handled centrally by cart.js ===============
    // initCartOnContactPage(); // DEPRECATED
});

// =============== DEPRECATED: Cart initialization is now handled centrally by cart.js ===============
/*
function initCartOnContactPage() {
    // =============== This functionality has been moved to cart.js and is automatically handled ===============
    // =============== initCartOnContactPage is deprecated. Cart is handled centrally by cart.js ===============
    console.warn('initCartOnContactPage is deprecated. Cart is handled centrally by cart.js');
}
*/

// =============== Initialize contact form functionality ===============
function initializeContactForm() {
    const contactForm = document.querySelector('.contact-form form');
    if (!contactForm) return;
    
    // =============== Add UI interaction enhancements for form inputs ===============
    setupContactFormUI(contactForm);
    
    // =============== Use the universal contact form handler ===============
    window.ContactFormHandler.setupFormSubmission(contactForm, showNotification);
}

// =============== Setup form UI interactions (visual effects only, no submission logic) ===============
function setupContactFormUI(form) {
    // =============== Add form input animations ===============
    const formInputs = form.querySelectorAll('input, textarea');
    formInputs.forEach(input => {
        // =============== Create and add focus border if it doesn't exist ===============
        if (!input.parentElement.querySelector('.focus-border')) {
            const focusBorder = document.createElement('span');
            focusBorder.className = 'focus-border';
            input.parentElement.appendChild(focusBorder);
        }
        
        // =============== Add focused class on focus ===============
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        
        // =============== Remove focused class on blur if empty ===============
        input.addEventListener('blur', () => {
            if (!input.value) {
                input.parentElement.classList.remove('focused');
            }
        });
        
        // =============== If input has value on load, add focused class ===============
        if (input.value) {
            input.parentElement.classList.add('focused');
        }
    });
}

/**
 * Show notification message
 * @param {string} message - Message to display
 * @param {string} type - Type of notification ('success' or 'error')
 */
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Add icon based on type
    const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
    
    // Set notification content
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
        <button class="close-btn"><i class="fas fa-times"></i></button>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Add close functionality
    const closeBtn = notification.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Initialize animations
function initializeAnimations() {
    // Add animation delay based on data-delay attribute
    const animatedElements = document.querySelectorAll('[data-delay]');
    animatedElements.forEach(el => {
        el.style.transitionDelay = el.getAttribute('data-delay') + 's';
    });

    // Animate info items on scroll
    const infoItems = document.querySelectorAll('.info-item');
    const animateInfoItems = () => {
        infoItems.forEach((item, index) => {
            if (item.getBoundingClientRect().top < window.innerHeight * 0.85) {
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateX(0)';
                }, index * 100);
            }
        });
    };

    // Initial check for visible elements
    animateInfoItems();

    // Check on scroll
    window.addEventListener('scroll', animateInfoItems);
    
    // Use Intersection Observer for scroll animations if available
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = entry.target.dataset.delay || 0;
                    setTimeout(() => {
                        entry.target.classList.add('animate');
                    }, delay * 1000);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px'
        });

        // Observe all elements with animate-on-scroll class
        document.querySelectorAll('.animate-on-scroll').forEach(element => {
            observer.observe(element);
        });
    } else {
        // Fallback for browsers that don't support IntersectionObserver
        document.querySelectorAll('.animate-on-scroll').forEach(element => {
            element.classList.add('animate');
        });
    }
    
    // Initialize map if present
    initializeMap();
}

// Initialize map if applicable
function initializeMap() {
    const mapContainer = document.getElementById('contact-map');
    if (mapContainer && typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
        // Google Maps initialization would go here
        // This is a placeholder since we don't have the actual Google Maps API key
        console.log('Map would initialize here if Google Maps API was loaded');
    }
}