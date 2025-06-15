// Contact page specific functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize form functionality
    initializeContactForm();
    
    // Initialize animations
    initializeAnimations();
    
    // Initialize cart functionality
    if (typeof window.HarnamCart !== 'undefined') {
        // Add cart button to navigation
        window.HarnamCart.addCartButton();
        
        // Update cart count based on stored data
        window.HarnamCart.updateCartCount();
        
        console.log('Cart system initialized on Contact page');
    } else {
        console.error('HarnamCart not available - make sure cart.js is loaded');
    }
});

// Initialize contact form functionality
function initializeContactForm() {
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const formObject = {};
            formData.forEach((value, key) => {
                formObject[key] = value;
            });
            
            // Show form submission animation
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
                submitBtn.disabled = true;
                
                // Simulate form submission delay
                setTimeout(() => {
                    // Show success message
                    const formContainer = contactForm.parentElement;
                    if (formContainer) {
                        formContainer.innerHTML = `
                            <div class="success-message">
                                <div class="success-icon">
                                    <i class="fas fa-check-circle"></i>
                                </div>
                                <h3>Thank You!</h3>
                                <p>Your message has been sent successfully. We'll get back to you soon.</p>
                                <button class="btn" id="reset-form">Send Another Message</button>
                            </div>
                        `;
                        
                        // Add event listener to reset form button
                        const resetBtn = document.getElementById('reset-form');
                        if (resetBtn) {
                            resetBtn.addEventListener('click', () => {
                                window.location.reload();
                            });
                        }
                    }
                }, 2000);
            }
        });
        
        // Add form input animations
        const formInputs = contactForm.querySelectorAll('input, textarea');
        formInputs.forEach(input => {
            // Create and add focus border if it doesn't exist
            if (!input.parentElement.querySelector('.focus-border')) {
                const focusBorder = document.createElement('span');
                focusBorder.className = 'focus-border';
                input.parentElement.appendChild(focusBorder);
            }
            
            // Add focused class on focus
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
            });
            
            // Remove focused class on blur if empty
            input.addEventListener('blur', () => {
                if (!input.value) {
                    input.parentElement.classList.remove('focused');
                }
            });
            
            // If input has value on load, add focused class
            if (input.value) {
                input.parentElement.classList.add('focused');
            }
        });
    }
}

// Initialize animations
function initializeAnimations() {
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
