// Enhanced cart functionality for mobile experience

// Declare global variables for cart processing state
let isCartProcessing = false;
let lastQtyUpdateTimeout = null;

/**
 * Show loading state with animation
 */
function showLoadingState() {
    const loader = document.querySelector('.modern-loader');
    if (loader) {
        loader.style.display = 'flex';
        // Add animation class for smooth appearance
        setTimeout(() => {
            loader.classList.add('active');
        }, 10);
    }
}

/**
 * Hide loading state with animation
 */
function hideLoadingState() {
    const loader = document.querySelector('.modern-loader');
    if (loader) {
        // Remove animation class first for smooth disappearance
        loader.classList.remove('active');
        setTimeout(() => {
            loader.style.display = 'none';
        }, 300); // Match this timing with CSS transition
    }
}

/**
 * Update cart badge with animation
 * @param {boolean} animated - Whether to show animation
 */
function updateCartBadge(animated = false) {
    // Make sure we're accessing the correct cartItems variable
    // Try to get it from the parent scope or window
    const items = typeof cartItems !== 'undefined' ? cartItems : 
                  (window.cartItems || []);
                  
    const cartCount = items.reduce((total, item) => {
        // Handle case where quantity might be undefined
        const quantity = parseInt(item.quantity) || 0;
        return total + quantity;
    }, 0);
    
    // Update all cart count badges
    const cartCountElements = document.querySelectorAll('.cart-count-nav');
    cartCountElements.forEach(element => {
        element.textContent = cartCount;
        
        if (cartCount > 0) {
            element.style.display = 'flex';
            
            // Apply animation if requested
            if (animated) {
                // Remove existing animation class
                element.classList.remove('item-added');
                // Force reflow
                void element.offsetWidth;
                // Add animation class
                element.classList.add('item-added');
            }
        } else {
            element.style.display = 'none';
        }
    });
    
    console.log('Cart badge updated with count:', cartCount);
}

/**
 * Debounced cart update to prevent too many Firebase updates
 */
function debouncedCartUpdate() {
    // Clear any existing timeout
    if (lastQtyUpdateTimeout) {
        clearTimeout(lastQtyUpdateTimeout);
    }
    
    // Set a new timeout
    lastQtyUpdateTimeout = setTimeout(() => {
        // Save cart to Firebase
        saveCart();
    }, 500); // Wait for 500ms of inactivity before saving
}

/**
 * Error handler for cart operations
 * @param {Error} error - The error object
 * @param {string} context - Context where the error occurred
 */
function handleCartError(error, context) {
    console.error(`Cart Error (${context}):`, error);
    showToast(`Error: ${error.message || 'Something went wrong'}`, 'error');
    
    // Reset processing state
    isCartProcessing = false;
    hideLoadingState();
}
