/**
 * Mobile Cart Initialization Module
 * Based on desktop pattern but simplified for mobile experience
 */

// Cart initialization state
let isCartInitialized = false;
let cartInitializationInProgress = false;

/**
 * Initialize the cart system
 * Must be called before any cart operations
 * @returns {Promise<Array>} - The cart items
 */
async function initializeCartSystem() {
    // Prevent multiple simultaneous initializations
    if (cartInitializationInProgress) {
        console.log('Cart initialization already in progress');
        return window.cartItems || [];
    }
    
    if (isCartInitialized) {
        console.log('Cart already initialized');
        return window.cartItems || [];
    }
    
    cartInitializationInProgress = true;
    console.log('Initializing mobile cart system...');
    
    try {
        // Check if user is logged in
        if (window.firebase && firebase.auth) {
            const user = firebase.auth().currentUser;
            
            if (user) {
                console.log('User logged in, loading Firebase cart');
                
                // Set up Firebase reference
                window.userCartRef = firebase.database().ref('users/' + user.uid + '/cart');
                
                // Load cart from Firebase
                await loadCartFromFirebase();
            } else {
                console.log('User not logged in, showing auth modal');
                
                // Initialize empty cart
                window.cartItems = [];
                
                // Show auth modal if available
                if (typeof showAuthModal === 'function') {
                    showAuthModal();
                }
            }
        } else {
            console.error('Firebase not available');
            window.cartItems = [];
            
            // Show error message
            if (typeof showToast === 'function') {
                showToast('Unable to access cart. Please try again later.', 'error');
            }
        }
        
        // Cart is now initialized
        isCartInitialized = true;
        
        // Update UI if function exists
        if (typeof updateCartUI === 'function') {
            updateCartUI();
        }
        
        // Update cart badge if function exists
        if (typeof updateCartBadge === 'function') {
            updateCartBadge();
        }
        
        return window.cartItems || [];
        
    } catch (error) {
        console.error('Error initializing cart:', error);
        window.cartItems = [];
        
        // Show error message
        if (typeof showToast === 'function') {
            showToast('Error initializing cart. Please try again later.', 'error');
        }
        
        return [];
    } finally {
        // Hide loading state if function exists
        if (typeof hideLoadingState === 'function') {
            hideLoadingState();
        }
        
        cartInitializationInProgress = false;
    }
}

/**
 * Load cart from Firebase
 * @returns {Promise<Array>} - The cart items
 */
async function loadCartFromFirebase() {
    if (!window.userCartRef) {
        console.error('userCartRef is not defined');
        return [];
    }
    
    try {
        // Get cart data from Firebase
        const snapshot = await window.userCartRef.once('value');
        const cartData = snapshot.val();
        
        // Process cart data
        if (!cartData) {
            console.log('Cart is empty or not found in database');
            window.cartItems = [];
        } else if (Array.isArray(cartData)) {
            window.cartItems = cartData;
        } else if (typeof cartData === 'object') {
            window.cartItems = Object.values(cartData);
        } else {
            console.error('Unexpected cart data format:', cartData);
            window.cartItems = [];
        }
        
        // Make sure cartItems is always an array
        if (!Array.isArray(window.cartItems)) {
            console.error('CartItems is not an array after processing:', window.cartItems);
            window.cartItems = [];
        }
        
        console.log('Cart loaded from Firebase:', window.cartItems);
        
        // Fetch complete product details if function exists
        if (typeof fetchCompleteProductDetails === 'function') {
            await fetchCompleteProductDetails();
        }
        
        return window.cartItems;
        
    } catch (error) {
        console.error('Error loading cart from Firebase:', error);
        window.cartItems = [];
        
        // Show error message
        if (typeof showToast === 'function') {
            showToast('Error loading cart. Please try again.', 'error');
        }
        
        return [];
    }
}

// Export functions for global access
window.cartInitializer = {
    initializeCartSystem,
    loadCartFromFirebase
};
