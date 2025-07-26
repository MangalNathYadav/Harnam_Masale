// Mobile Cart Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the cart page
    initializeCartPage();

    // Setup event listeners
    setupCartPageEvents();
});

// Firebase reference for user cart
let userCartRef = null;
// Current cart data
let cartItems = [];

// Initialize the cart page
function initializeCartPage() {
    // Show loading state
    showLoadingState();

    // Always use onAuthStateChanged to determine login status before initializing cart
    if (window.firebase && firebase.auth) {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                // User is signed in, use cart initializer if available
                if (window.cartInitializer && typeof window.cartInitializer.initializeCartSystem === 'function') {
                    window.cartInitializer.initializeCartSystem()
                        .then(cartData => {
                            console.log('Cart initialized through cart initializer:', cartData);
                            cartItems = cartData;
                            setupRealtimeCartSync(user.uid);
                        })
                        .catch(error => {
                            console.error('Error in cart initialization:', error);
                            cartItems = [];
                            updateCartUI();
                            hideLoadingState();
                        });
                } else {
                    // Fallback to direct initialization
                    userCartRef = firebase.database().ref('users/' + user.uid + '/cart');
                    loadCartFromFirebaseDirectly();
                    setupRealtimeCartSync(user.uid);
                }
            } else {
                // User is not signed in, prompt them to login
                showAuthModal();
                cartItems = [];
                updateCartUI();
                hideLoadingState();
            }
        });
    } else {
        // Firebase not available, show error
        console.error('Firebase is not available');
        showToast('Unable to access cart. Please try again later.', 'error');
        cartItems = [];
        updateCartUI();
        hideLoadingState();
    }
}

// Direct implementation of loadCartFromFirebase for backward compatibility
function loadCartFromFirebaseDirectly() {
    // Show loading state
    showLoadingState();
    
    // Ensure userCartRef is valid
    if (!userCartRef) {
        console.error('User cart reference is not available');
        cartItems = [];
        updateCartUI();
        hideLoadingState();
        showToast('Error loading cart. Please try again.', 'error');
        return;
    }
    
    userCartRef.once('value')
        .then(snapshot => {
            try {
                // Get cart data with proper handling
                const cartData = snapshot.val();
                
                // Check if cartData exists and has proper format
                if (!cartData) {
                    console.log('Cart is empty or not found in database');
                    cartItems = [];
                } else if (Array.isArray(cartData)) {
                    cartItems = cartData;
                } else if (typeof cartData === 'object') {
                    cartItems = Object.values(cartData);
                } else {
                    console.error('Unexpected cart data format:', cartData);
                    cartItems = [];
                }
                
                // Make sure cartItems is always an array
                if (!Array.isArray(cartItems)) {
                    console.error('CartItems is not an array after processing:', cartItems);
                    cartItems = [];
                }
                
                console.log('Cart data loaded:', cartItems);
                
                // Fetch complete product details for each cart item
                return fetchCompleteProductDetails();
            } catch (err) {
                console.error('Error processing cart data:', err);
                cartItems = [];
                throw err; // Rethrow to be caught in the catch block
            }
        })
        .then(() => {
            // Update the UI
            updateCartUI();
            
            // Hide loading state
            hideLoadingState();
        })
        .catch(error => {
            console.error('Error loading cart from Firebase:', error);
            
            // Initialize empty cart
            cartItems = [];
            updateCartUI();
            
            // Show error message
            showToast('Error loading cart data. Please try again.', 'error');
            
            // Hide loading state
            hideLoadingState();
        });
}

// Wrapper for loadCartFromFirebase to use the cart initializer when available
function loadCartFromFirebase() {
    if (window.cartInitializer && typeof window.cartInitializer.loadCartFromFirebase === 'function') {
        return window.cartInitializer.loadCartFromFirebase()
            .then(result => {
                cartItems = result;
                updateCartUI();
                return result;
            });
    } else {
        return loadCartFromFirebaseDirectly();
    }
}

// Fetch complete product details for all cart items
async function fetchCompleteProductDetails() {
    // Skip if cart is empty
    if (!cartItems || cartItems.length === 0) return;
    
    console.log('Fetching complete product details for', cartItems.length, 'items');
    
    // Create a new array to hold the enhanced cart items
    const enhancedCartItems = [];
    
    // Process each item sequentially to avoid rate limiting
    for (const item of cartItems) {
        try {
            // Fetch full product details from Firebase
            const productSnapshot = await firebase.database().ref(`products/${item.id}`).once('value');
            const productData = productSnapshot.val();
            
            if (productData) {
                // Merge product data with cart item (keeping cart quantity)
                enhancedCartItems.push({
                    ...productData,
                    id: item.id,
                    quantity: item.quantity
                });
                console.log('Enhanced product:', item.id);
            } else {
                // Product not found in database, use existing cart item
                enhancedCartItems.push(item);
                console.log('Product not found in database:', item.id);
            }
        } catch (error) {
            console.error('Error fetching product details for', item.id, error);
            // Keep original cart item
            enhancedCartItems.push(item);
        }
    }
    
    // Update cart items with enhanced data
    cartItems = enhancedCartItems;
    console.log('Cart items enhanced with product details:', cartItems.length, 'items');
}

// Show authentication modal
function showAuthModal() {
    const authModal = document.getElementById('auth-modal');
    const minibar = document.getElementById('auth-minibar');
    if (authModal) {
        authModal.style.display = 'flex';
        if (minibar) minibar.style.display = 'none';
    }
}

// Fetch complete product details from Firebase
function fetchProductDetails(productId, callback) {
    if (window.firebase && firebase.database) {
        firebase.database().ref(`products/${productId}`).once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    // Product found in Firebase
                    const productData = {
                        id: snapshot.key,
                        ...snapshot.val()
                    };
                    callback(productData);
                } else {
                    // Product not found in Firebase, try to use dummy data or fallback
                    const dummyProduct = getDummyProductById(productId);
                    if (dummyProduct) {
                        callback(dummyProduct);
                    } else {
                        // No product data available, use fallback data
                        callback({
                            id: productId,
                            name: 'Product',
                            price: 0,
                            image: '../assets/images/placeholder.png'
                        });
                    }
                }
            })
            .catch(error => {
                console.error(`Error fetching product ${productId} details:`, error);
                // Use fallback data on error
                callback({
                    id: productId,
                    name: 'Product',
                    price: 0,
                    image: '../assets/images/placeholder.png'
                });
            });
    } else {
        // Firebase not available, use dummy data or fallback
        const dummyProduct = getDummyProductById(productId);
        if (dummyProduct) {
            callback(dummyProduct);
        } else {
            // No product data available, use fallback data
            callback({
                id: productId,
                name: 'Product',
                price: 0,
                image: '../assets/images/placeholder.png'
            });
        }
    }
}

// Get dummy product by ID
function getDummyProductById(productId) {
    const dummyProducts = [
        {
            id: 'product1',
            name: 'Garam Masala',
            price: 120,
            originalPrice: 150,
            image: '../assets/images/garam.jpeg',
            rating: 4.8
        },
        {
            id: 'product2',
            name: 'Chicken Masala',
            price: 99,
            image: '../assets/images/chiken.jpeg',
            rating: 4.5
        },
        {
            id: 'product3',
            name: 'Meat Masala',
            price: 140,
            originalPrice: 175,
            image: '../assets/images/meat.jpeg',
            rating: 4.7
        },
        {
            id: 'product4',
            name: 'Sabji Masala',
            price: 85,
            image: '../assets/images/sabji.jpeg',
            rating: 4.3
        },
        {
            id: 'product5',
            name: 'Chana Masala',
            price: 95,
            image: '../assets/images/chola.jpeg',
            rating: 4.6
        },
        {
            id: 'product6',
            name: 'Paneer Masala',
            price: 110,
            image: '../assets/images/paneer.jpeg',
            rating: 4.9
        }
    ];
    
    return dummyProducts.find(product => product.id === productId);
}

// Setup real-time cart sync with Firebase
function setupRealtimeCartSync(userId) {
    firebase.database().ref('users/' + userId + '/cart').on('value', function(snapshot) {
        const cartData = snapshot.val() || [];
        cartItems = Array.isArray(cartData) ? cartData : Object.values(cartData);
        
        // Show loading indicator
        showLoadingState();
        
        // Fetch complete product details for updated cart
        fetchCompleteProductDetails()
            .then(() => {
                // Update the UI with enhanced product data
                updateCartUI();
                
                // Update cart badge across all pages
                updateCartBadge();
                
                // Hide loading indicator
                hideLoadingState();
            })
            .catch(error => {
                console.error('Error fetching product details during sync:', error);
                // Still update UI with whatever data we have
                updateCartUI();
                updateCartBadge();
                hideLoadingState();
            });
    });
}

// Update cart UI
function updateCartUI() {
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const cartSummary = document.getElementById('cartSummary');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (!cartItemsContainer || !emptyCartMessage || !cartSummary) return;
    
    // Clear cart items container
    cartItemsContainer.innerHTML = '';
    
    if (cartItems.length === 0) {
        // Show empty cart message
        emptyCartMessage.style.display = 'flex';
        cartSummary.style.display = 'none';
        
        // Update cart badge
        updateCartBadge();
        
        return;
    }
    
    // Hide empty cart message and show cart summary
    emptyCartMessage.style.display = 'none';
    cartSummary.style.display = 'block';
    
    // Render each cart item (should already have full details from fetchCompleteProductDetails)
    cartItems.forEach(item => {
        renderCartItem(item, cartItemsContainer);
    });
    
    // Update summary
    updateCartSummary();
    
    // Enable/disable checkout button based on cart
    checkoutBtn.disabled = cartItems.length === 0;
}

// Render a single cart item
function renderCartItem(item, container) {
    // Log item data for debugging
    console.log('Rendering cart item:', item);
    
    // Ensure we have basic required properties
    if (!item || !item.id) {
        console.error('Invalid item data:', item);
        return;
    }
    
    // Process price - handle various formats with improved parser
    const parsePriceFn = window.parsePrice || function(priceValue) {
        let price = 0;
        if (typeof priceValue === 'string') {
            price = parseFloat(priceValue.replace(/[₹,]/g, '').trim());
        } else if (typeof priceValue === 'number') {
            price = priceValue;
        }
        return isNaN(price) ? 0 : price;
    };
    
    const safePrice = parsePriceFn(item.price);
    
    // Determine image source with fallbacks
    let imageSrc = '../assets/images/placeholder.png'; // Default fallback
    
    if (item.imageBase64) {
        imageSrc = item.imageBase64; // Base64 image data
    } else if (item.image) {
        imageSrc = item.image; // Image URL
    } else if (item.imageUrl) {
        imageSrc = item.imageUrl; // Alternative image URL property
    } else if (item.img) {
        imageSrc = item.img; // Another alternative
    }
    
    // Format name with fallback
    const name = item.name || item.title || 'Product';
    
    // Get quantity with fallback
    const quantity = item.quantity || 1;
    
    // Create cart item element
    const cartItemElement = document.createElement('div');
    cartItemElement.className = 'cart-item';
    cartItemElement.dataset.id = item.id;
    
    // Build HTML with product details
    cartItemElement.innerHTML = `
        <img src="${imageSrc}" alt="${name}" class="cart-item-image" onerror="this.src='../assets/images/placeholder.png'">
        <div class="cart-item-details">
            <h3 class="cart-item-name">${name}</h3>
            <div class="cart-item-price">₹${safePrice.toFixed(2)}</div>
            <div class="cart-item-quantity">
                <button class="quantity-btn minus" data-id="${item.id}">-</button>
                <span class="quantity">${quantity}</span>
                <button class="quantity-btn plus" data-id="${item.id}">+</button>
            </div>
        </div>
        <button class="remove-item" data-id="${item.id}">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    // Add to container
    container.appendChild(cartItemElement);
    
    // Set up event listeners for this cart item
    setupCartItemEventListeners(cartItemElement);
}

// Setup event listeners for individual cart item
function setupCartItemEventListeners(cartItemElement) {
    if (!cartItemElement) return;
    
    // Get elements
    const minusButton = cartItemElement.querySelector('.quantity-btn.minus');
    const plusButton = cartItemElement.querySelector('.quantity-btn.plus');
    const removeButton = cartItemElement.querySelector('.remove-item');
    const itemId = cartItemElement.dataset.id;
    
    if (minusButton) {
        minusButton.addEventListener('click', function() {
            updateCartItemQuantity(itemId, -1);
        });
    }
    
    if (plusButton) {
        plusButton.addEventListener('click', function() {
            updateCartItemQuantity(itemId, 1);
        });
    }
    
    if (removeButton) {
        removeButton.addEventListener('click', function() {
            removeCartItem(itemId);
        });
    }
}

// Update cart summary
function updateCartSummary() {
    const subtotalElement = document.getElementById('subtotalAmount');
    const shippingElement = document.getElementById('shippingAmount');
    const totalElement = document.getElementById('totalAmount');
    
    if (!subtotalElement || !shippingElement || !totalElement) return;
    
    // Calculate subtotal
    const subtotal = calculateSubtotal();
    
    // Calculate shipping cost
    const shippingCost = calculateShippingCost(subtotal);
    
    // Calculate total
    const total = subtotal + shippingCost;
    
    // Update UI with improved formatting
    const formatPriceFn = window.formatIndianPrice || function(amount) {
        return `₹${amount.toFixed(2)}`;
    };

    subtotalElement.textContent = formatPriceFn(subtotal);
    shippingElement.textContent = formatPriceFn(shippingCost);
    totalElement.textContent = formatPriceFn(total);
}

// Calculate subtotal with improved price handling
function calculateSubtotal() {
    // If window.parsePrice exists (from cart-price-formatter.js), use it
    const parsePriceFn = window.parsePrice || function(priceValue) {
        let price = 0;
        if (typeof priceValue === 'string') {
            // Remove currency symbol, commas and parse
            price = parseFloat(priceValue.replace(/[₹,]/g, '').trim());
        } else if (typeof priceValue === 'number') {
            price = priceValue;
        }
        return isNaN(price) ? 0 : price;
    };

    return cartItems.reduce((total, item) => {
        // Use the improved price parser
        const safePrice = parsePriceFn(item.price);
        
        // Ensure quantity is a valid number
        const quantity = parseInt(item.quantity) || 1;
        
        // Log for debugging
        console.log(`Item: ${item.name}, Price: ${item.price}, Parsed: ${safePrice}, Qty: ${quantity}, Subtotal: ${safePrice * quantity}`);
        
        return total + (safePrice * quantity);
    }, 0);
}

// Calculate shipping cost with fallbacks
function calculateShippingCost(subtotal) {
    // Use constants from cart-constants.js if available, or fallback to default values
    const freeShippingThreshold = 
        typeof FREE_SHIPPING_THRESHOLD !== 'undefined' ? 
        FREE_SHIPPING_THRESHOLD : 500;
    
    const shippingCost = 
        typeof SHIPPING_COST !== 'undefined' ? 
        SHIPPING_COST : 40;
    
    // Free shipping over threshold
    if (subtotal >= freeShippingThreshold) {
        return 0;
    }
    
    return shippingCost;
}

// Setup cart page event listeners
function setupCartPageEvents() {
    // Setup checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            // If cart is empty, show message and return
            if (cartItems.length === 0) {
                showToast('Your cart is empty!', 'error');
                return;
            }
            
            // If user is not logged in, show auth modal and return
            if (!firebase.auth().currentUser) {
                showAuthModal();
                return;
            }
            
            // Redirect to checkout page
            window.location.href = 'checkout.html';
        });
    }
    
    // Setup auth modal close button and minibar open button
    const closeModalBtn = document.querySelector('#auth-modal .close-modal');
    const minibar = document.getElementById('auth-minibar');
    const openMinibarBtn = document.getElementById('auth-minibar-open');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                authModal.style.display = 'none';
            }
            if (minibar) {
                minibar.style.display = 'flex';
            }
        });
    }
    if (openMinibarBtn) {
        openMinibarBtn.addEventListener('click', function() {
            showAuthModal();
        });
    }
    
    // Setup clear cart button
    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', function() {
            // If cart is already empty, do nothing
            if (cartItems.length === 0) {
                return;
            }
            
            // Clear cart data
            clearCart();
        });
    }
    
    // Delegate click event for cart item buttons
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', function(e) {
            // Get the clicked element
            const target = e.target;
            
            // Handle plus button click
            if (target.closest('.quantity-btn.plus')) {
                const itemId = target.closest('.quantity-btn.plus').dataset.id;
                updateCartItemQuantity(itemId, 1);
            }
            
            // Handle minus button click
            if (target.closest('.quantity-btn.minus')) {
                const itemId = target.closest('.quantity-btn.minus').dataset.id;
                updateCartItemQuantity(itemId, -1);
            }
            
            // Handle remove button click
            if (target.closest('.remove-item')) {
                const itemId = target.closest('.remove-item').dataset.id;
                removeCartItem(itemId);
            }
        });
    }
}

// Update cart item quantity
function updateCartItemQuantity(itemId, change) {
    // Prevent rapid changes while processing
    if (window.isCartProcessing) {
        showToast('Please wait...', 'info');
        return;
    }
    
    // Set processing flag
    window.isCartProcessing = true;
    
    try {
        // Find the item in the cart
        const itemIndex = cartItems.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) {
            window.isCartProcessing = false;
            return;
        }
        
        // Update quantity
        cartItems[itemIndex].quantity += change;
        
        // Provide immediate visual feedback
        const quantityEl = document.querySelector(`[data-id="${itemId}"] .quantity`);
        if (quantityEl) {
            quantityEl.textContent = cartItems[itemIndex].quantity;
            
            // Add flash effect
            quantityEl.classList.add('quantity-updated');
            setTimeout(() => quantityEl.classList.remove('quantity-updated'), 300);
        }
        
        // If quantity <= 0, remove the item
        if (cartItems[itemIndex].quantity <= 0) {
            cartItems.splice(itemIndex, 1);
        }
        
        // Use debounced update if available, otherwise normal save
        if (window.debouncedCartUpdate) {
            window.debouncedCartUpdate();
        } else {
            saveCart();
        }
        
        // Reset processing flag after short delay
        setTimeout(() => {
            window.isCartProcessing = false;
        }, 300);
        
    } catch (error) {
        console.error('Error updating quantity:', error);
        showToast('Error updating cart', 'error');
        window.isCartProcessing = false;
    }
}

// Remove item from cart
function removeCartItem(itemId) {
    try {
        // Prevent multiple rapid removals
        if (window.isCartProcessing) {
            showToast('Please wait...', 'info');
            return;
        }
        
        window.isCartProcessing = true;
        
        // Find the cart item element
        const cartItemElement = document.querySelector(`.cart-item[data-id="${itemId}"]`);
        
        if (cartItemElement) {
            // Add animation class
            cartItemElement.classList.add('removing');
            
            // Wait for animation to complete before removing from DOM
            setTimeout(() => {
                // Filter out the item
                cartItems = cartItems.filter(item => item.id !== itemId);
                
                // Save updated cart
                saveCart();
                
                // Show toast notification
                showToast('Item removed from cart');
                
                // Reset processing flag
                window.isCartProcessing = false;
            }, 300); // Match with CSS animation duration
        } else {
            // No element found, just remove from array
            cartItems = cartItems.filter(item => item.id !== itemId);
            saveCart();
            showToast('Item removed from cart');
            window.isCartProcessing = false;
        }
    } catch (error) {
        console.error('Error removing item:', error);
        showToast('Error removing item', 'error');
        window.isCartProcessing = false;
    }
}

// Clear cart with confirmation and animation
function clearCart() {
    // Add confirmation to prevent accidental clearing
    const confirmed = confirm('Are you sure you want to clear your cart?');
    
    if (confirmed) {
        // Show loading state briefly
        showLoadingState();
        
        // Animate all cart items removal
        const cartItems = document.querySelectorAll('.cart-item');
        let animationDelay = 0;
        
        cartItems.forEach(item => {
            setTimeout(() => {
                item.classList.add('removing');
            }, animationDelay);
            animationDelay += 100; // Stagger the animations
        });
        
        // Wait for animations to complete
        setTimeout(() => {
            // Reset cart items - ensure we're using the correct reference
        cartItems = [];
        if (window.cartItems !== undefined) {
            window.cartItems = [];
        }
        
        // Save updated cart
        saveCart();
            
            // Hide loading state
            hideLoadingState();
            
            // Show toast notification
            showToast('Cart cleared');
        }, animationDelay + 300); // Add extra time for the last animation
    }
}

// Save cart to Firebase RTDB with improved error handling
function saveCart() {
    // If user is logged in, save to Firebase
    if (window.firebase && firebase.auth && firebase.auth().currentUser) {
        const user = firebase.auth().currentUser;
        
        // Show subtle loading indicator for network activity
        const saveIndicator = document.createElement('div');
        saveIndicator.className = 'save-indicator';
        saveIndicator.innerHTML = '<i class="fas fa-cloud-upload-alt"></i>';
        document.body.appendChild(saveIndicator);
        
        firebase.database().ref('users/' + user.uid + '/cart').set(cartItems)
            .then(() => {
                // Success - show quick feedback
                saveIndicator.classList.add('success');
                setTimeout(() => {
                    document.body.removeChild(saveIndicator);
                }, 1000);
                
                // Update cart badge with animation for visual feedback
                updateCartBadge(true);
            })
            .catch(error => {
                console.error('Error saving cart to Firebase:', error);
                showToast('Error saving cart. Please try again.', 'error');
                
                // Error feedback
                saveIndicator.classList.add('error');
                setTimeout(() => {
                    document.body.removeChild(saveIndicator);
                }, 1000);
            });
    } else {
        // User not signed in, prompt to sign in
        showAuthModal();
    }
    
    // Update UI
    updateCartUI();
    
    // Update cart badge across all pages (without animation in this case)
    updateCartBadge(false);
}

// Update cart badge with animation option
function updateCartBadge(animated = false) {
    // Make sure cartItems is defined
    if (!Array.isArray(cartItems)) {
        console.error('cartItems is not an array:', cartItems);
        return;
    }
    
    const cartCount = cartItems.reduce((total, item) => {
        // Handle case where quantity might be undefined or a string
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
                // Force reflow to restart animation
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

// Show toast message
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast-message');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = 'toast-message';
    
    if (type) {
        toast.classList.add(type);
    }
    
    toast.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Show loading state with animation
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

// Hide loading state with animation
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
