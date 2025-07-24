// Show cart notification as toaster and auto-hide after 3 seconds
function showCartNotification(message, type = '') {
    let notif = document.querySelector('.cart-notification');
    if (!notif) {
        notif = document.createElement('div');
        notif.className = 'cart-notification';
        document.body.appendChild(notif);
    }
    notif.textContent = message;
    notif.classList.remove('success', 'error', 'info');
    if (type) notif.classList.add(type);
    notif.classList.add('show');
    // Auto-hide after 3 seconds
    setTimeout(() => {
        notif.classList.remove('show');
    }, 3000);
}
// Mobile Main JavaScript - Core functionality for all pages

// Document ready function
document.addEventListener('DOMContentLoaded', function() {
    // Initialize loader
    initializeLoader();
    
    // Initialize cart badge
    updateCartBadge();
    // Live cart badge from Firebase for logged-in users
    if (window.firebase && firebase.auth) {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user && user.uid) {
                const cartRef = firebase.database().ref('users/' + user.uid + '/cart');
                cartRef.on('value', function(snapshot) {
                    const cart = snapshot.val() || [];
                    let cartArr = Array.isArray(cart) ? cart : Object.values(cart);
                    const count = cartArr.reduce((total, item) => total + (item.quantity || 0), 0);
                    document.querySelectorAll('.cart-count-nav').forEach(el => {
                        el.textContent = count;
                        if (count > 0) {
                            el.classList.add('active');
                        } else {
                            el.classList.remove('active');
                        }
                    });
                });
            } else {
                // Not logged in, fallback to localStorage
                updateCartBadge();
                window.addEventListener('storage', function(e) {
                    if (e.key === 'cart') updateCartBadge();
                });
                // MutationObserver for localStorage cart changes (realtime for guest)
                let lastCart = localStorage.getItem('cart');
                setInterval(function() {
                    const currentCart = localStorage.getItem('cart');
                    if (currentCart !== lastCart) {
                        lastCart = currentCart;
                        updateCartBadge();
                    }
                }, 300);
            }
        });
    }
    
    // Initialize authentication state
    checkAuthState();
    
    // Setup global event listeners
    document.addEventListener('DOMContentLoaded', setupGlobalEventListeners);
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
    // Check if user is logged in
    if (window.firebase && firebase.auth && firebase.auth().currentUser) {
        const user = firebase.auth().currentUser;
        firebase.database().ref('users/' + user.uid + '/cart').once('value')
            .then(snapshot => {
                const cartData = snapshot.val() || [];
                let cart = Array.isArray(cartData) ? cartData : Object.values(cartData);
                
                const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
                
                // Update all cart count indicators
                updateCartCountUI(cartCount);
            })
            .catch(error => {
                console.error('Error updating cart badge:', error);
                updateCartCountUI(0);
            });
    } else {
        updateCartCountUI(0);
    }
}

// Update cart count UI
function updateCartCountUI(cartCount) {
    // Update all cart count indicators in tab only
    const cartCountElements = document.querySelectorAll('.cart-count-nav');
    cartCountElements.forEach(element => {
        element.textContent = cartCount;
        if (cartCount > 0) {
            element.classList.add('active');
        } else {
            element.classList.remove('active');
        }
    });
    // Also update cart modal products if open
    const cartModal = document.getElementById('cart-modal');
    if (cartModal && cartModal.classList.contains('active')) {
        loadCartItems();
    }
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
    // Redirect cart button clicks to cart page
    const cartBtns = document.querySelectorAll('.cart-btn');
    cartBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'cart.html';
        });
    });

    // Prevent reload/redirect if already on profile page
    const profileNav = document.querySelector('.nav-item[href="profile.html"]');
    if (profileNav) {
        profileNav.addEventListener('click', function(e) {
            if (window.location.pathname.endsWith('profile.html')) {
                e.preventDefault();
            }
        });
    }

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
    
    // Helper to render cart array
    function renderCart(cart) {
        if (!cart || cart.length === 0) {
            if (emptyCart) emptyCart.style.display = 'flex';
            if (cartSummary) cartSummary.style.display = 'none';
            cartItemsContainer.innerHTML = '';
            updateCartBadge();
            return;
        }
        if (emptyCart) emptyCart.style.display = 'none';
        if (cartSummary) cartSummary.style.display = 'flex';
        cartItemsContainer.innerHTML = '';
        let total = 0;
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
                        <input type="number" min="1" class="quantity-input" value="${item.quantity}" data-id="${item.id}" style="width:40px;text-align:center;">
                        <button class="quantity-btn plus" data-id="${item.id}">+</button>
                    </div>
                </div>
                <button class="remove-item" data-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            cartItemsContainer.appendChild(cartItemElement);
        });
        if (totalAmount) {
            totalAmount.textContent = `₹${total.toFixed(2)}`;
        }
        updateCartBadge();
        // Add event listeners for quantity and remove
        cartItemsContainer.querySelectorAll('.quantity-btn.minus').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const input = cartItemsContainer.querySelector(`.quantity-input[data-id="${id}"]`);
                let qty = parseInt(input.value) || 1;
                if (qty > 1) {
                    qty--;
                    updateCartItemQuantity(id, -1);
                }
            });
        });
        cartItemsContainer.querySelectorAll('.quantity-btn.plus').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const input = cartItemsContainer.querySelector(`.quantity-input[data-id="${id}"]`);
                let qty = parseInt(input.value) || 1;
                qty++;
                updateCartItemQuantity(id, 1);
            });
        });
        cartItemsContainer.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', function() {
                const id = this.getAttribute('data-id');
                const oldValue = this.defaultValue;
                let qty = parseInt(this.value) || 1;
                if (qty < 1) qty = 1;
                const difference = qty - oldValue;
                updateCartItemQuantity(id, difference);
            });
        });
        cartItemsContainer.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                removeCartItem(id);
            });
        });
    }

    // Check if user is logged in
    if (window.firebase && firebase.auth && firebase.auth().currentUser) {
        const user = firebase.auth().currentUser;
        firebase.database().ref('users/' + user.uid + '/cart').once('value')
            .then(snapshot => {
                let cart = snapshot.val() || [];
                cart = Array.isArray(cart) ? cart : Object.values(cart);
                renderCart(cart);
            })
            .catch(error => {
                console.error('Error loading cart items:', error);
                renderCart([]);
            });
    } else {
        // User not logged in, show empty cart
        renderCart([]);
        
        // If on cart page, redirect to login
        if (window.location.pathname.endsWith('cart.html')) {
            showLoginPrompt('cart');
        }
    }
}

// Get dummy products data
function getDummyProducts() {
    return [
        {
            id: 'product1',
            name: 'Garam Masala',
            price: 120,
            originalPrice: 150,
            image: '../assets/images/garam.jpeg',
            rating: 4.8,
            description: 'A blend of ground spices common in Indian cuisine. The mix typically includes coriander, cumin, cardamom, cloves, black pepper, cinnamon, and nutmeg.',
            category: 'blend'
        },
        {
            id: 'product2',
            name: 'Chicken Masala',
            price: 99,
            image: '../assets/images/chiken.jpeg',
            rating: 4.5,
            description: 'A perfect blend of spices specially created to enhance the flavor of chicken dishes. Great for curries, grills, and roasts.',
            category: 'blend'
        },
        {
            id: 'product3',
            name: 'Meat Masala',
            price: 140,
            originalPrice: 175,
            image: '../assets/images/meat.jpeg',
            rating: 4.7,
            description: 'A robust spice blend designed for meat dishes. Adds rich flavor and aroma to lamb, mutton, and beef preparations.',
            category: 'blend'
        },
        {
            id: 'product4',
            name: 'Sabji Masala',
            price: 85,
            image: '../assets/images/sabji.jpeg',
            rating: 4.3,
            description: 'A versatile spice mix perfect for all vegetable dishes. Brings out the natural flavors of vegetables while adding aromatic spice notes.',
            category: 'blend'
        },
        {
            id: 'product5',
            name: 'Chana Masala',
            price: 95,
            image: '../assets/images/chola.jpeg',
            rating: 4.6,
            description: 'A specialty blend for chickpea curry and other legume dishes. Creates the authentic taste of restaurant-style chana masala at home.',
            category: 'blend'
        },
        {
            id: 'product6',
            name: 'Paneer Masala',
            price: 110,
            image: '../assets/images/paneer.jpeg',
            rating: 4.9,
            description: 'A delicate spice blend crafted specifically for paneer (Indian cottage cheese) dishes. Creates rich, flavorful gravies.',
            category: 'blend'
        }
    ];
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

// Add to cart function
function addToCart(productId) {
    // Check if user is logged in
    if (window.firebase && firebase.auth && firebase.auth().currentUser) {
        const user = firebase.auth().currentUser;
        
        // Get product details
        getProductDetails(productId, function(product) {
            if (!product) {
                showNotification('Error: Product not found!', 'error');
                return;
            }
            
            // Get user's cart
            const cartRef = firebase.database().ref('users/' + user.uid + '/cart');
            cartRef.once('value')
                .then(snapshot => {
                    let cart = snapshot.val() || [];
                    if (!Array.isArray(cart)) {
                        cart = Object.values(cart);
                    }
                    
                    // Check if product already exists in cart
                    const existingItemIndex = cart.findIndex(item => item.id === productId);
                    
                    if (existingItemIndex !== -1) {
                        // Update quantity of existing item
                        cart[existingItemIndex].quantity += 1;
                    } else {
                        // Add new item to cart with complete product details
                        cart.push({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            image: product.image || product.imageBase64 || '../assets/images/placeholder.png',
                            imageUrl: product.imageUrl || null,
                            imageBase64: product.imageBase64 || null,
                            description: product.description || '',
                            category: product.category || '',
                            originalPrice: product.originalPrice || null,
                            quantity: 1
                        });
                    }
                    
                    // Save cart to Firebase
                    return cartRef.set(cart);
                })
                .then(() => {
                    showNotification('Added to cart!');
                    updateCartBadge();
                })
                .catch(error => {
                    console.error('Error adding to cart:', error);
                    showNotification('Error adding to cart', 'error');
                });
        });
    } else {
        // User not logged in, show auth modal
        showLoginPrompt('cart');
    }
}

// Get product details
function getProductDetails(productId, callback) {
    if (window.firebase && firebase.database) {
        firebase.database().ref(`products/${productId}`).once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    const product = {
                        id: snapshot.key,
                        ...snapshot.val()
                    };
                    callback(product);
                } else {
                    // Try to get from dummy products
                    const dummyProducts = getDummyProducts();
                    const dummyProduct = dummyProducts.find(p => p.id === productId);
                    if (dummyProduct) {
                        callback(dummyProduct);
                    } else {
                        callback(null);
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching product:', error);
                callback(null);
            });
    } else {
        // Fallback to dummy products
        const dummyProducts = getDummyProducts();
        const dummyProduct = dummyProducts.find(p => p.id === productId);
        callback(dummyProduct || null);
    }
}

// Update cart item quantity
function updateCartItemQuantity(itemId, change) {
    // Check if user is logged in
    if (window.firebase && firebase.auth && firebase.auth().currentUser) {
        const user = firebase.auth().currentUser;
        const cartRef = firebase.database().ref('users/' + user.uid + '/cart');
        
        cartRef.once('value')
            .then(snapshot => {
                let cart = snapshot.val() || [];
                if (!Array.isArray(cart)) {
                    cart = Object.values(cart);
                }
                
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
                return cartRef.set(cart);
            })
            .then(() => {
                updateCartBadge();
                loadCartItems();
            })
            .catch(error => {
                console.error('Error updating cart:', error);
                showNotification('Error updating cart', 'error');
            });
    } else {
        // User not logged in, show auth modal
        showLoginPrompt('cart');
    }
}

// Remove cart item
function removeCartItem(itemId) {
    // Also update cart modal products if open
    const cartModal = document.getElementById('cart-modal');
    if (cartModal && cartModal.classList.contains('active')) {
        loadCartItems();
    }
    
    // Check if user is logged in
    if (window.firebase && firebase.auth && firebase.auth().currentUser) {
        const user = firebase.auth().currentUser;
        const cartRef = firebase.database().ref('users/' + user.uid + '/cart');
        
        cartRef.once('value')
            .then(snapshot => {
                let cart = snapshot.val() || [];
                if (!Array.isArray(cart)) {
                    cart = Object.values(cart);
                }
                
                // Filter out the item to remove
                cart = cart.filter(item => item.id !== itemId);
                
                // Save updated cart
                return cartRef.set(cart);
            })
            .then(() => {
                // Update UI
                updateCartBadge();
                loadCartItems();
                
                // Show notification
                showNotification('Item removed from cart');
            })
            .catch(error => {
                console.error('Error removing item from cart:', error);
                showNotification('Error removing item from cart', 'error');
            });
    } else {
        // User not logged in, show auth modal
        showLoginPrompt('cart');
    }
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
