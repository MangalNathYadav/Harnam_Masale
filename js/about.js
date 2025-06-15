// About page specific functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize animations
    initializeAnimations();
    
    // Initialize cart functionality if HarnamCart is available
    if (typeof window.HarnamCart !== 'undefined') {
        // Add cart button to navigation
        window.HarnamCart.addCartButton();
        
        // Update cart count based on stored data
        window.HarnamCart.updateCartCount();
        
        console.log('Cart system initialized on About page');
    } else {
        console.error('HarnamCart not available - make sure cart.js is loaded');
    }
});

// Animation and other about page specific functions
function initializeAnimations() {
    // Animation for timeline and other about page elements
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    if (animateElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Get any delay attribute
                    const delay = entry.target.dataset.delay || 0;
                    
                    // Apply animation with delay
                    setTimeout(() => {
                        entry.target.classList.add('animate');
                    }, delay * 1000);
                    
                    // Stop observing after animation
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px'
        });

        // Observe all elements that should animate on scroll
        animateElements.forEach(element => {
            observer.observe(element);
        });
    }
}
