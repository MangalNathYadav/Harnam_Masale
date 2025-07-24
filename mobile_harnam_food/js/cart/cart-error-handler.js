/**
 * Error handling utilities for cart page
 */

/**
 * Add a global error handler for uncaught exceptions
 */
window.addEventListener('error', function(e) {
    console.log('Global error handler caught:', e.error);
    
    // Handle specific errors
    if (e.error && e.error.toString().includes('FREE_SHIPPING_THRESHOLD')) {
        console.log('Handling shipping threshold error');
        
        // Add error indicator to UI
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-indicator';
        errorDiv.textContent = 'Cart constants loaded incorrectly. Refresh to fix.';
        document.body.appendChild(errorDiv);
        
        // Log detailed info
        console.log('SHIPPING_COST available:', typeof SHIPPING_COST !== 'undefined');
        console.log('FREE_SHIPPING_THRESHOLD available:', typeof FREE_SHIPPING_THRESHOLD !== 'undefined');
        
        // Define fallbacks if needed
        if (typeof SHIPPING_COST === 'undefined') {
            window.SHIPPING_COST = 40;
            console.log('Defined fallback SHIPPING_COST');
        }
        
        if (typeof FREE_SHIPPING_THRESHOLD === 'undefined') {
            window.FREE_SHIPPING_THRESHOLD = 500;
            console.log('Defined fallback FREE_SHIPPING_THRESHOLD');
        }
        
        // Remove error indicator after a few seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
});

// Add global error recovery
window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.toString().includes('cart')) {
        console.error('Cart operation failed:', event.reason);
        
        // Try to recover cart state
        try {
            const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
            if (Array.isArray(localCart)) {
                window.cartItems = localCart;
                if (typeof updateCartUI === 'function') {
                    updateCartUI();
                }
            }
        } catch (e) {
            console.error('Cart recovery failed:', e);
        }
    }
});

/**
 * Safe function to check if cart constants are properly loaded
 * @returns {boolean} - Whether constants are available
 */
function checkCartConstants() {
    const shippingCostAvailable = typeof SHIPPING_COST !== 'undefined';
    const thresholdAvailable = typeof FREE_SHIPPING_THRESHOLD !== 'undefined';
    
    console.log('Cart constants check - SHIPPING_COST:', shippingCostAvailable);
    console.log('Cart constants check - FREE_SHIPPING_THRESHOLD:', thresholdAvailable);
    
    return shippingCostAvailable && thresholdAvailable;
}

// Run check when loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(checkCartConstants, 500); // Check after a delay to ensure scripts have loaded
});
