// Mobile Main JavaScript - Core functionality for all pages

// Document ready function
document.addEventListener('DOMContentLoaded', function() {
    // Initialize loader
    initializeLoader();
    
    // Initialize cart badge
    updateCartBadge();
    
    // Initialize authentication state
    checkAuthState();
    
    // Setup global event listeners
    setupGlobalEventListeners();
});

// Function to initialize the loader
function initializeLoader() {
    const loader = document.querySelector('.modern-loader');
    if (loader) {
        // Show loader first
        loader.style.opacity = '1';
        loader.style.display = 'flex';
        
        // Hide loader after page load
        window.addEventListener('load', function() {
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 300); // Match transition time
            }, 500); // Delay before hiding
        });
    }
}

// Function to update cart badge count
function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    
    // Update all cart count indicators
    const cartCountElements = document.querySelectorAll('.cart-count, .cart-count-nav');
    cartCountElements.forEach(element => {
        element.textContent = cartCount;
        
        if (cartCount > 0) {
            element.classList.add('active');
        } else {
            element.classList.remove('active');
        }
    });
}

// Function to check authentication state
function checkAuthState() {
    if (window.firebase && firebase.auth) {
        firebase.auth().onAuthStateChanged(function(user) {
            // Update UI based on auth state
            updateAuthUI(user);
            
            // Call page-specific auth handlers if they exist
            if (typeof handleAuthStateChange === 'function') {
                handleAuthStateChange(user);
            }
        });
    }
}

// Update UI elements based on auth state
function updateAuthUI(user) {
    // Update profile nav item
    const profileNavItem = document.querySelector('.nav-item[href="profile.html"]');
    
    if (profileNavItem) {
        if (user) {
            // User is signed in
            profileNavItem.classList.add('logged-in');
        } else {
            // No user is signed in
            profileNavItem.classList.remove('logged-in');
        }
    }
    
    // Handle redirect from login
    handleAuthRedirect(user);
}

// Handle redirects after login
function handleAuthRedirect(user) {
    // Check URL parameters for redirect
    const urlParams = new URLSearchParams(window.location.search);
    const redirectPage = urlParams.get('redirect');
    
    // If we have a redirect parameter and user is logged in
    if (redirectPage && user) {
        // Remove redirect parameter from URL and redirect
        history.replaceState(null, null, window.location.pathname);
        window.location.href = redirectPage + '.html';
    }
}

// Setup global event listeners
function setupGlobalEventListeners() {
    // Cart icon click
    const cartIcons = document.querySelectorAll('.cart-icon, .cart-btn');
    cartIcons.forEach(icon => {
        icon.addEventListener('click', function(e) {
            e.preventDefault();
            openCartModal();
        });
    });
    
    // Close modal buttons
    const closeModalButtons = document.querySelectorAll('.close-modal');
    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeModals();
        });
    });
    
    // Checkout button
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            // Check if user is logged in
            if (window.firebase && firebase.auth && firebase.auth().currentUser) {
                window.location.href = 'checkout.html';
            } else {
                // Not logged in - show login prompt
                showLoginPrompt('checkout');
            }
        });
    }
}

// Open cart modal
function openCartModal() {
    const cartModal = document.getElementById('cart-modal');
    if (!cartModal) return;
    
    cartModal.classList.add('active');
    loadCartItems();
    
    // Add body class to prevent scrolling
    document.body.classList.add('modal-open');
}

// Close all modals
function closeModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('active');
    });
    
    // Remove body class to enable scrolling
    document.body.classList.remove('modal-open');
}

// Load cart items into cart modal
function loadCartItems() {
    const cartItemsContainer = document.querySelector('.cart-items');
    const emptyCart = document.querySelector('.empty-cart');
    const cartSummary = document.querySelector('.cart-summary');
    const totalAmount = document.querySelector('.total-amount');
    
    if (!cartItemsContainer) return;
    
    // Get cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    if (cart.length === 0) {
        // Show empty cart message
        if (emptyCart) emptyCart.style.display = 'flex';
        if (cartSummary) cartSummary.style.display = 'none';
        cartItemsContainer.innerHTML = '';
        return;
    }
    
    // Hide empty cart message, show cart summary
    if (emptyCart) emptyCart.style.display = 'none';
    if (cartSummary) cartSummary.style.display = 'flex';
    
    // Clear container
    cartItemsContainer.innerHTML = '';
    
    let total = 0;
    
    // Add each cart item
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'cart-item';
        cartItemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <h3 class="cart-item-name">${item.name}</h3>
                <div class="cart-item-price">₹${parseFloat(item.price).toFixed(2)}</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn minus" data-id="${item.id}">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn plus" data-id="${item.id}">+</button>
                </div>
            </div>
            <button class="remove-item" data-id="${item.id}">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        cartItemsContainer.appendChild(cartItemElement);
    });
    
    // Update total
    if (totalAmount) {
        totalAmount.textContent = `₹${total.toFixed(2)}`;
    }
    
    // Add event listeners to buttons
    addCartItemEventListeners();
}

// Add event listeners to cart item buttons
function addCartItemEventListeners() {
    // Quantity decrease buttons
    const minusButtons = document.querySelectorAll('.quantity-btn.minus');
    minusButtons.forEach(button => {
        button.addEventListener('click', function() {
            const itemId = this.getAttribute('data-id');
            updateCartItemQuantity(itemId, -1);
        });
    });
    
    // Quantity increase buttons
    const plusButtons = document.querySelectorAll('.quantity-btn.plus');
    plusButtons.forEach(button => {
        button.addEventListener('click', function() {
            const itemId = this.getAttribute('data-id');
            updateCartItemQuantity(itemId, 1);
        });
    });
    
    // Remove item buttons
    const removeButtons = document.querySelectorAll('.remove-item');
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const itemId = this.getAttribute('data-id');
            removeCartItem(itemId);
        });
    });
}

// Update cart item quantity
function updateCartItemQuantity(itemId, change) {
    // Get cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Find the item
    const itemIndex = cart.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;
    
    // Update quantity
    cart[itemIndex].quantity += change;
    
    // Remove item if quantity is 0 or less
    if (cart[itemIndex].quantity <= 0) {
        cart.splice(itemIndex, 1);
    }
    
    // Save updated cart
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update UI
    updateCartBadge();
    loadCartItems();
}

// Remove cart item
function removeCartItem(itemId) {
    // Get cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Filter out the item to remove
    cart = cart.filter(item => item.id !== itemId);
    
    // Save updated cart
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update UI
    updateCartBadge();
    loadCartItems();
    
    // Show notification
    showNotification('Item removed from cart');
}

// Show a notification
function showNotification(message, type = 'success') {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Add type class
    notification.className = `notification ${type}`;
    
    // Set message
    notification.textContent = message;
    
    // Show notification
    notification.classList.add('show');
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Show login prompt
function showLoginPrompt(redirectTo) {
    // Create modal if it doesn't exist
    let loginModal = document.getElementById('login-prompt-modal');
    
    if (!loginModal) {
        loginModal = document.createElement('div');
        loginModal.id = 'login-prompt-modal';
        loginModal.className = 'modal';
        
        loginModal.innerHTML = `
            <div class="modal-content">
                <button class="close-modal">&times;</button>
                <div class="login-prompt">
                    <i class="fas fa-user-lock"></i>
                    <h2>Login Required</h2>
                    <p>Please log in to continue</p>
                    <div class="login-prompt-buttons">
                        <button id="login-now-btn" class="btn btn-primary">Login Now</button>
                        <button id="cancel-login-btn" class="btn btn-outline">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(loginModal);
        
        // Add event listeners to buttons
        const loginNowBtn = document.getElementById('login-now-btn');
        const cancelLoginBtn = document.getElementById('cancel-login-btn');
        const closeModalBtn = loginModal.querySelector('.close-modal');
        
        if (loginNowBtn) {
            loginNowBtn.addEventListener('click', function() {
                window.location.href = `index.html?redirect=${redirectTo}`;
            });
        }
        
        if (cancelLoginBtn) {
            cancelLoginBtn.addEventListener('click', function() {
                loginModal.classList.remove('active');
            });
        }
        
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', function() {
                loginModal.classList.remove('active');
            });
        }
    }
    
    // Show the modal
    loginModal.classList.add('active');
}

// Utility function: Format currency
function formatCurrency(amount) {
    return '₹' + parseFloat(amount).toFixed(2);
}
