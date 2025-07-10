// About page specific functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize animations
    initializeAnimations();
    
    // Initialize cart functionality - Use setTimeout to ensure cart.js is fully loaded first
    setTimeout(async () => {
        if (typeof window.HarnamCart !== 'undefined') {
            console.log('Initializing cart on About page');
            
            try {
                // DIRECT APPROACH: Get user ID directly from HarnamAuth first
                let userId = null;
                
                // Get user from HarnamAuth (most reliable method)
                if (window.HarnamAuth && typeof window.HarnamAuth.getCurrentUser === 'function') {
                    const user = window.HarnamAuth.getCurrentUser();
                    if (user && user.id) {
                        userId = user.id;
                        console.log('Found user in HarnamAuth:', userId);
                    }
                }
                
                // If not found, try Firebase
                if (!userId && typeof firebase !== 'undefined' && firebase.auth) {
                    const firebaseUser = firebase.auth().currentUser;
                    if (firebaseUser) {
                        userId = firebaseUser.uid;
                        console.log('Found user in Firebase:', userId);
                    }
                }
                
                // If we have a user ID, directly fetch the cart from Firebase
                if (userId && window.FirebaseUtil && window.FirebaseUtil.cart) {
                    console.log('Directly fetching cart from Firebase for user:', userId);
                    const result = await window.FirebaseUtil.cart.getUserCart(userId);
                    console.log('Firebase cart result:', result);
                    
                    if (result.success && Array.isArray(result.cart)) {
                        console.log('Successfully loaded cart from Firebase with', result.cart.length, 'items');
                        // Update HarnamCart with the Firebase cart
                        window.HarnamCart.updateCart(result.cart);
                    }
                } else {
                    // Try HarnamCart.initializeCart() as fallback
                    console.log('No user ID found, trying HarnamCart API to initialize cart');
                    if (window.HarnamCart.initializeCart) {
                        await window.HarnamCart.initializeCart();
                    }
                }
            } catch (error) {
                console.error('Error initializing cart:', error);
            }
            
            // Add cart button to navigation
            window.HarnamCart.addCartButton();
            
            // Update cart count based on stored data
            window.HarnamCart.updateCartCount();
            
            console.log('Cart system initialized on About page');
        } else {
            console.error('HarnamCart not available - make sure cart.js is loaded');
        }
    }, 300); // Small delay to ensure cart.js is fully loaded and initialized
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
