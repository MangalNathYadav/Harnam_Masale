// Cart functionality for Harnam Masale

(function() {
    // Initialize cart from localStorage or create empty cart
    let cart = [];
    let isInitialized = false;
    let useFirebase = false;  // Flag to determine whether to use Firebase or localStorage
    let initializationInProgress = false; // Flag to prevent multiple initializations
    let lastUrl = window.location.pathname; // Track the last URL to detect page changes
    let preserveCartOnLogout = false; // New flag to preserve cart on certain pages
    let syncInProgress = false; // Flag to prevent multiple syncs

    // Initialize cart - new function to handle initialization only once
    async function initializeCart() {
        console.log('Initializing cart on page: ' + window.location.pathname);
        
        // CRITICAL FIX: Always check localStorage first before using in-memory cart
        const localStorageCart = getCartFromLocalStorage();
        if (localStorageCart && localStorageCart.length > 0) {
            console.log('Found cart in localStorage with', localStorageCart.length, 'items');
            cart = localStorageCart;
            isInitialized = true;
            updateCartCount();
            return cart;
        }
        
        // If cart is already initialized and has items, use it
        if (isInitialized && cart.length > 0) {
            console.log('Using cart already initialized in memory with', cart.length, 'items');
            updateCartCount();
            return cart;
        }
        
        // Prevent multiple simultaneous initializations
        if (initializationInProgress) {
            console.log('Cart initialization already in progress, waiting...');
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (!initializationInProgress) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            });
            return cart;
        }
        
        initializationInProgress = true;
        
        try {
            // Check if user is logged in first
            let userId = null;
            
            // First try to get Firebase user explicitly from auth
            if (typeof firebase !== 'undefined' && firebase.auth) {
                try {
                    const firebaseUser = firebase.auth().currentUser;
                    if (firebaseUser) {
                        userId = firebaseUser.uid;
                        useFirebase = true;
                    }
                } catch (err) {
                    console.warn('Error checking Firebase auth:', err);
                }
            }
            
            // If no Firebase user, try HarnamAuth
            if (!userId && window.HarnamAuth?.getCurrentUser) {
                try {
                    const localUser = window.HarnamAuth.getCurrentUser();
                    if (localUser && localUser.id) {
                        userId = localUser.id;
                        useFirebase = true;
                    }
                } catch (err) {
                    console.warn('Error checking HarnamAuth:', err);
                }
            }
            
            // If user is logged in, try to use Firebase cart
            if (useFirebase && userId && typeof window.FirebaseUtil !== 'undefined') {
                console.log('User is logged in, fetching cart from Firebase');
                try {
                    const result = await window.FirebaseUtil.cart.getUserCart(userId);
                    
                    if (result.success && Array.isArray(result.cart) && result.cart.length > 0) {
                        cart = result.cart;
                        console.log('Successfully loaded Firebase cart with', cart.length, 'items');
                    } else {
                        // If Firebase cart is empty, check localStorage first before using empty cart
                        const localCart = getCartFromLocalStorage();
                        if (localCart && localCart.length > 0) {
                            console.log('No Firebase cart, but found localStorage cart with', localCart.length, 'items');
                            cart = localCart;
                            
                            // Sync this localStorage cart to Firebase
                            try {
                                await window.FirebaseUtil.cart.updateUserCart(userId, cart);
                                console.log('Synced localStorage cart to Firebase');
                            } catch (syncErr) {
                                console.error('Error syncing to Firebase:', syncErr);
                            }
                        } else {
                            console.log('No cart found in Firebase or localStorage, using empty cart');
                            cart = [];
                        }
                    }
                } catch (err) {
                    console.error('Error fetching Firebase cart:', err);
                    // Fall back to localStorage if Firebase fails
                    const localCart = getCartFromLocalStorage();
                    cart = localCart || [];
                }
            } else {
                // Not logged in, use localStorage
                console.log('User not logged in, using localStorage cart');
                const localCart = getCartFromLocalStorage();
                cart = localCart || [];
                console.log('Final cart state has', cart.length, 'items');
            }
            
            isInitialized = true;
            updateCartCount();
            
        } catch (error) {
            console.error('Error initializing cart:', error);
            // Fallback to localStorage on error
            const localCart = getCartFromLocalStorage();
            cart = localCart || [];
            console.log('Error recovery: loaded localStorage cart with', cart.length, 'items');
        } finally {
            initializationInProgress = false;
        }
        
        return cart;
    }
    
    // Helper function to get cart from localStorage with error handling and backup
    function getCartFromLocalStorage() {
        try {
            // Try normal cart first
            const cartStr = localStorage.getItem('harnamCart');
            if (cartStr) {
                const parsedCart = JSON.parse(cartStr);
                if (Array.isArray(parsedCart) && parsedCart.length > 0) {
                    return parsedCart;
                }
            }
            
            // If main cart is missing or empty, try backup
            const backupCartStr = localStorage.getItem('harnamCart_backup');
            if (backupCartStr) {
                const backupCart = JSON.parse(backupCartStr);
                if (Array.isArray(backupCart) && backupCart.length > 0) {
                    console.log('Restored cart from backup');
                    // Restore main cart from backup
                    localStorage.setItem('harnamCart', backupCartStr);
                    return backupCart;
                }
            }
            
            return [];
        } catch (error) {
            console.error('Error reading cart from localStorage:', error);
            return [];
        }
    }

    // Save cart data - improved to be more reliable
    async function saveCart() {
        try {
            let userId = null;
            
            // Get Firebase user ID if available
            if (typeof firebase !== 'undefined' && firebase.auth) {
                try {
                    const firebaseUser = firebase.auth().currentUser;
                    if (firebaseUser) userId = firebaseUser.uid;
                } catch (e) {
                    console.warn('Error checking Firebase user in saveCart:', e);
                }
            }
            
            if (!userId && window.HarnamAuth?.getCurrentUser) {
                try {
                    const localUser = window.HarnamAuth.getCurrentUser();
                    if (localUser && localUser.id) userId = localUser.id;
                } catch (e) {
                    console.warn('Error checking HarnamAuth in saveCart:', e);
                }
            }
            
            // ALWAYS save to localStorage regardless of login status for redundancy
            localStorage.setItem('harnamCart', JSON.stringify(cart));
            localStorage.setItem('harnamCart_backup', JSON.stringify(cart));
            localStorage.setItem('harnamCartTimestamp', Date.now());
            console.log('Saved cart to localStorage with', cart.length, 'items');
            
            // If logged in, also use Firebase
            if (userId && useFirebase && typeof window.FirebaseUtil !== 'undefined') {
                await window.FirebaseUtil.cart.updateUserCart(userId, cart);
                console.log('Also saved cart to Firebase');
            }
            
            updateCartCount();
        } catch (error) {
            console.error('Error saving cart:', error);
            // Ensure cart is saved to localStorage even if there's an error
            try {
                localStorage.setItem('harnamCart', JSON.stringify(cart));
                localStorage.setItem('harnamCart_backup', JSON.stringify(cart));
            } catch (e) {
                console.error('Critical: Failed to save cart to localStorage:', e);
            }
            throw error;
        }
    }

    // Add item to cart
    async function addToCart(product) {
        try {
            // Check if product already exists in cart
            const existingItemIndex = cart.findIndex(item => item.id === product.id);
            
            // Ensure product has all required properties
            const processedProduct = {
                id: product.id || `product-${Math.random().toString(36).substr(2, 9)}`,
                name: product.name || 'Product',
                price: product.price || '₹0',
                image: product.image || '',
                quantity: product.quantity || 1
            };
            
            console.log('Adding product to cart:', processedProduct);
            
            // Create new cart array to avoid direct mutations
            const updatedCart = [...cart];
            
            if (existingItemIndex > -1) {
                // Create new item with updated quantity to avoid direct mutation
                updatedCart[existingItemIndex] = {
                    ...updatedCart[existingItemIndex],
                    quantity: updatedCart[existingItemIndex].quantity + processedProduct.quantity
                };
            } else {
                // Add new item
                updatedCart.push(processedProduct);
            }
            
            // Update cart reference
            cart = updatedCart;
            
            // Save cart and show notification
            await saveCart();
            showCartNotification(processedProduct.name);
            
            return true;
        } catch (error) {
            console.error('Error adding to cart:', error);
            return false;
        }
    }

    // Remove item from cart by ID
    async function removeFromCart(productId) {
        try {
            const initialLength = cart.length;
            
            // Create new cart array without the item
            const updatedCart = cart.filter(item => item.id !== productId);
            
            if (updatedCart.length !== initialLength) {
                // Update cart reference
                cart = updatedCart;
                
                // Save changes
                await saveCart();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error removing from cart:', error);
            return false;
        }
    }

    // Update item quantity by ID
    async function updateCartItemQuantity(productId, quantity) {
        try {
            // Create new cart array
            const updatedCart = cart.map(item => {
                if (item.id === productId) {
                    // If quantity is 0 or less, this item will be filtered out
                    if (quantity <= 0) return null;
                    // Create new item with updated quantity
                    return { ...item, quantity: quantity };
                }
                return item;
            }).filter(Boolean); // Remove null items (quantity <= 0)
            
            // Update cart reference
            cart = updatedCart;
            
            // Save changes
            await saveCart();
            return true;
        } catch (error) {
            console.error('Error updating cart quantity:', error);
            return false;
        }
    }

    // Calculate cart total
    function calculateCartTotal() {
        return cart.reduce((total, item) => {
            // Extract numerical price from string (e.g., "₹250" -> 250)
            const price = parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
            return total + (price * item.quantity);
        }, 0);
    }

    // Update cart count in the UI
    function updateCartCount() {
        const cartCountElements = document.querySelectorAll('.cart-count');
        const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
        
        console.log('Updating cart count to:', itemCount);
        
        cartCountElements.forEach(element => {
            element.textContent = itemCount;
            
            // Show/hide badge based on count
            if (itemCount > 0) {
                element.style.display = 'flex';
            } else {
                element.style.display = 'none';
            }
        });
        
        // If no cart count elements found, try again after a short delay
        // This helps when navigation is loaded dynamically
        if (cartCountElements.length === 0) {
            setTimeout(() => {
                const delayedCartCounts = document.querySelectorAll('.cart-count');
                if (delayedCartCounts.length > 0) {
                    delayedCartCounts.forEach(element => {
                        element.textContent = itemCount;
                        if (itemCount > 0) {
                            element.style.display = 'flex';
                        } else {
                            element.style.display = 'none';
                        }
                    });
                }
            }, 500);
        }
    }

    // Show cart notification when item is added
    function showCartNotification(productName) {
        // Create notification element if it doesn't exist
        let notification = document.querySelector('.cart-notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'cart-notification';
            document.body.appendChild(notification);
        }
        
        // Set notification content
        notification.textContent = `"${productName}" added to cart!`;
        notification.classList.add('show');
        
        // Hide notification after timeout
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // This is the direct HTML structure for the cart modal
    const cartModalHTML = `
    <div id="cart-modal" class="modal">
        <div class="modal-content cart-modal-content">
            <div class="modal-header">
                <h2>Your Shopping Cart</h2>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <div class="cart-items-container">
                    <div class="empty-cart-message">Your cart is empty!</div>
                    <div class="cart-items"></div>
                </div>
                <div class="cart-footer">
                    <div class="cart-total">
                        <span>Total:</span>
                        <span class="cart-total-amount">₹0.00</span>
                    </div>
                    <div class="cart-actions">
                        <button class="btn continue-shopping">Continue Shopping</button>
                        <button class="btn checkout-btn">Checkout</button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    // Ensure the cart modal exists in the DOM
    function ensureCartModalExists() {
        // First check if the cart modal already exists
        let cartModal = document.getElementById('cart-modal');
        
        // If it exists, remove it to avoid duplicates or inconsistent state
        if (cartModal) {
            cartModal.remove();
        }
        
        // Create a fresh cart modal
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cartModalHTML;
        document.body.appendChild(tempDiv.firstElementChild);
        
        console.log('Cart modal created successfully');
        
        // Get the newly created modal
        cartModal = document.getElementById('cart-modal');
        
        // Setup event listeners for the modal
        setupCartModalListeners(cartModal);
        
        return cartModal;
    }

    // Render cart items in the cart modal
    function renderCart() {
        // Make sure the cart modal exists
        const cartModal = ensureCartModalExists();
        
        if (!cartModal) {
            console.error('Failed to create or find cart modal');
            return;
        }
        
        const cartItemsContainer = cartModal.querySelector('.cart-items');
        const cartTotalElement = cartModal.querySelector('.cart-total-amount');
        const emptyCartMessage = cartModal.querySelector('.empty-cart-message');
        
        if (!cartItemsContainer) {
            console.error('Cart items container not found in modal structure');
            return;
        }
        
        console.log('Found cart items container, rendering', cart.length, 'items');
        
        // Clear current items
        cartItemsContainer.innerHTML = '';
        
        if (cart.length === 0) {
            // Show empty cart message
            if (emptyCartMessage) {
                emptyCartMessage.style.display = 'block';
            }
            if (cartTotalElement) {
                cartTotalElement.textContent = '₹0.00';
            }
            return;
        }
        
        // Hide empty cart message
        if (emptyCartMessage) {
            emptyCartMessage.style.display = 'none';
        }
        
        // Generate cart items HTML
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.dataset.id = item.id;
            
            // Ensure image URL is valid
            const imageUrl = item.image || 'assets/images/placeholder-product.jpg';
            
            cartItem.innerHTML = `
                <div class="cart-item-image">
                    <img src="${imageUrl}" alt="${item.name}" onerror="this.src='assets/images/placeholder-product.jpg'">
                </div>
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <p class="cart-item-price">${item.price}</p>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn decrement">−</button>
                        <input type="number" min="1" value="${item.quantity}" class="quantity-input">
                        <button class="quantity-btn increment">+</button>
                    </div>
                </div>
                <button class="remove-item-btn">×</button>
            `;
            
            cartItemsContainer.appendChild(cartItem);
            
            // Add event listeners for quantity buttons
            const decrementBtn = cartItem.querySelector('.decrement');
            const incrementBtn = cartItem.querySelector('.increment');
            const quantityInput = cartItem.querySelector('.quantity-input');
            const removeBtn = cartItem.querySelector('.remove-item-btn');
            
            decrementBtn.addEventListener('click', (e) => {
                // Prevent any potential parent handlers from being triggered
                e.preventDefault();
                e.stopPropagation();
                
                const newQuantity = parseInt(quantityInput.value) - 1;
                if (newQuantity >= 1) {
                    quantityInput.value = newQuantity;
                    updateCartItemQuantity(item.id, newQuantity);
                    
                    // Update only specific parts without recreating entire modal
                    updateCartDisplay();
                }
            });
            
            incrementBtn.addEventListener('click', (e) => {
                // Prevent any potential parent handlers from being triggered
                e.preventDefault();
                e.stopPropagation();
                
                const newQuantity = parseInt(quantityInput.value) + 1;
                quantityInput.value = newQuantity;
                updateCartItemQuantity(item.id, newQuantity);
                
                // Update only specific parts without recreating entire modal
                updateCartDisplay();
            });
            
            quantityInput.addEventListener('change', (e) => {
                // Prevent any potential parent handlers from being triggered
                e.preventDefault();
                e.stopPropagation();
                
                let newQuantity = parseInt(quantityInput.value);
                if (isNaN(newQuantity) || newQuantity < 1) {
                    newQuantity = 1;
                    quantityInput.value = 1;
                }
                updateCartItemQuantity(item.id, newQuantity);
                
                // Update only specific parts without recreating entire modal
                updateCartDisplay();
            });
            
            removeBtn.addEventListener('click', (e) => {
                // Prevent any potential parent handlers from being triggered
                e.preventDefault();
                e.stopPropagation();
                
                removeFromCart(item.id);
                
                // Update only specific parts without recreating entire modal
                updateCartDisplay();
            });
        });
        
        // Update total amount
        if (cartTotalElement) {
            const total = calculateCartTotal();
            cartTotalElement.textContent = `₹${total.toFixed(2)}`;
        }
        
        console.log('Cart rendered successfully with', cart.length, 'items');
    }

    // New function to update cart display without recreating the modal
    function updateCartDisplay() {
        // Get existing cart modal
        const cartModal = document.getElementById('cart-modal');
        if (!cartModal) return;
        
        // Update the cart items container content
        const cartItemsContainer = cartModal.querySelector('.cart-items');
        const cartTotalElement = cartModal.querySelector('.cart-total-amount');
        const emptyCartMessage = cartModal.querySelector('.empty-cart-message');
        
        if (!cartItemsContainer) return;
        
        // Clear and rebuild cart items
        cartItemsContainer.innerHTML = '';
        
        // Check for empty cart
        if (cart.length === 0) {
            if (emptyCartMessage) {
                emptyCartMessage.style.display = 'block';
            }
            if (cartTotalElement) {
                cartTotalElement.textContent = '₹0.00';
            }
            return;
        }
        
        // Hide empty cart message
        if (emptyCartMessage) {
            emptyCartMessage.style.display = 'none';
        }
        
        // Regenerate cart items
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.dataset.id = item.id;
            
            // Ensure image URL is valid
            const imageUrl = item.image || 'assets/images/placeholder-product.jpg';
            
            cartItem.innerHTML = `
                <div class="cart-item-image">
                    <img src="${imageUrl}" alt="${item.name}" onerror="this.src='assets/images/placeholder-product.jpg'">
                </div>
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <p class="cart-item-price">${item.price}</p>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn decrement">−</button>
                        <input type="number" min="1" value="${item.quantity}" class="quantity-input">
                        <button class="quantity-btn increment">+</button>
                    </div>
                </div>
                <button class="remove-item-btn">×</button>
            `;
            
            cartItemsContainer.appendChild(cartItem);
            
            // Add event listeners for new buttons
            const decrementBtn = cartItem.querySelector('.decrement');
            const incrementBtn = cartItem.querySelector('.increment');
            const quantityInput = cartItem.querySelector('.quantity-input');
            const removeBtn = cartItem.querySelector('.remove-item-btn');
            
            decrementBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const newQuantity = parseInt(quantityInput.value) - 1;
                if (newQuantity >= 1) {
                    quantityInput.value = newQuantity;
                    updateCartItemQuantity(item.id, newQuantity);
                    updateCartDisplay();
                }
            });
            
            incrementBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const newQuantity = parseInt(quantityInput.value) + 1;
                quantityInput.value = newQuantity;
                updateCartItemQuantity(item.id, newQuantity);
                updateCartDisplay();
            });
            
            quantityInput.addEventListener('change', (e) => {
                e.preventDefault();
                e.stopPropagation();
                let newQuantity = parseInt(quantityInput.value);
                if (isNaN(newQuantity) || newQuantity < 1) {
                    newQuantity = 1;
                    quantityInput.value = 1;
                }
                updateCartItemQuantity(item.id, newQuantity);
                updateCartDisplay();
            });
            
            removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                removeFromCart(item.id);
                updateCartDisplay();
            });
        });
        
        // Update total amount
        if (cartTotalElement) {
            const total = calculateCartTotal();
            cartTotalElement.textContent = `₹${total.toFixed(2)}`;
        }
        
        // Update cart count badge
        updateCartCount();
    }

    // Setup event listeners for the cart modal
    function setupCartModalListeners(cartModal) {
        if (!cartModal) {
            console.error('Cannot setup cart modal listeners - modal not provided');
            return;
        }
        
        const closeModalBtn = cartModal.querySelector('.close-modal');
        const continueShoppingBtn = cartModal.querySelector('.continue-shopping');
        const checkoutBtn = cartModal.querySelector('.checkout-btn');
        
        // Add click event to close button
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                closeCartModal();
            });
        } else {
            console.error('Close modal button not found');
        }
        
        // Ensure continue shopping button works
        if (continueShoppingBtn) {
            continueShoppingBtn.addEventListener('click', () => {
                closeCartModal();
            });
        }
        
        // When clicking outside the modal content, close the modal
        cartModal.addEventListener('click', (event) => {
            // Only close if clicking directly on the modal background
            // not on any of its children elements
            if (event.target === cartModal) {
                closeCartModal();
            }
        });
        
        // Setup checkout button if it exists
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                // Check if cart has items
                if (cart.length === 0) {
                    alert('Your cart is empty. Add some products before checkout.');
                    return;
                }
                
                // Check if user is logged in
                const isLoggedIn = window.HarnamAuth && window.HarnamAuth.getCurrentUser();
                
                if (isLoggedIn) {
                    // Proceed to checkout page
                    window.location.href = '/checkout.html';
                } else {
                    // Redirect to login page with return URL
                    window.location.href = '/login.html?redirect=/checkout.html';
                }
            });
        }
        
        console.log('Cart modal listeners set up successfully');
    }

    // Close cart modal - explicit function
    function closeCartModal() {
        const cartModal = document.getElementById('cart-modal');
        if (!cartModal) {
            console.error('Cannot close cart modal - not found');
            return;
        }
        
        cartModal.classList.remove('show');
        
        setTimeout(() => {
            cartModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
        
        console.log('Cart modal closed');
    }

    // Add cart button with counter to navigation
    function addCartButton() {
        // First remove any existing cart button to avoid duplicates and ensure fresh state
        const existingCartButton = document.querySelector('.cart-button');
        if (existingCartButton) {
            const parentLi = existingCartButton.closest('li');
            if (parentLi) {
                parentLi.remove();
            } else {
                existingCartButton.remove();
            }
        }
        
        // Find navigation
        const nav = document.querySelector('header nav .nav-links');
        if (nav) {
            // Create a new list item for the cart button
            const cartListItem = document.createElement('li');
            
            // Create the cart button
            const cartButton = document.createElement('button');
            cartButton.className = 'cart-button';
            
            // Calculate total quantity for cart badge
            const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
            
            cartButton.innerHTML = `
                <i class="fas fa-shopping-cart"></i>
                <span class="cart-count" style="${totalQuantity > 0 ? 'display:flex;' : 'display:none;'}">${totalQuantity}</span>
            `;
            
            // Add the button to the list item
            cartListItem.appendChild(cartButton);
            
            // Add the list item to the nav
            nav.appendChild(cartListItem);
            
            // Add click event
            cartButton.addEventListener('click', openCartModal);
            
            console.log('Cart button added to navigation with', totalQuantity, 'items');
        } else {
            console.warn('Navigation not found, cannot add cart button');
            
            // Try again in a moment - navigation might not be loaded yet
            setTimeout(() => {
                const delayedNav = document.querySelector('header nav .nav-links');
                if (delayedNav && !document.querySelector('.cart-button')) {
                    addCartButton();
                }
            }, 500);
        }
    }

    // Open cart modal
    function openCartModal() {
        console.log('Opening cart modal');
        
        // Make sure cart modal exists and is up-to-date
        renderCart();
        
        // Get the freshly rendered modal
        const cartModal = document.getElementById('cart-modal');
        if (!cartModal) {
            console.error('Cart modal not found when trying to open');
            return;
        }
        
        // Show modal
        cartModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Trigger animation
        setTimeout(() => {
            cartModal.classList.add('show');
        }, 10);
        
        console.log('Cart modal opened');
    }

    // Setup add to cart buttons
    function setupAddToCartButtons() {
        const addToCartButtons = document.querySelectorAll('.add-to-cart-btn, .product-action-btn');
        let buttonsFound = 0;
        
        addToCartButtons.forEach(button => {
            // Check if this is a cart button by finding cart icon
            const isCartButton = button.querySelector('.fa-shopping-cart') !== null || 
                               button.classList.contains('add-to-cart-btn');
            
            if (isCartButton) {
                buttonsFound++;
                
                // Remove any existing click handlers
                const newBtn = button.cloneNode(true);
                if (button.parentNode) {
                    button.parentNode.replaceChild(newBtn, button);
                }
                
                newBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Get product details from the card
                    const productCard = this.closest('.product-card');
                    if (!productCard) {
                        console.error('Product card not found');
                        return;
                    }
                    
                    const productId = productCard.dataset.id || `product-${Math.random().toString(36).substr(2, 9)}`;
                    const productName = productCard.querySelector('.product-title')?.textContent || 'Product';
                    const productPrice = productCard.querySelector('.price')?.textContent || '₹0';
                    const productImage = productCard.querySelector('.product-img')?.src || '';
                    
                    console.log('Product found:', {
                        id: productId,
                        name: productName,
                        price: productPrice,
                        image: productImage
                    });
                    
                    // Create product object
                    const product = {
                        id: productId,
                        name: productName,
                        price: productPrice,
                        image: productImage,
                        quantity: 1
                    };
                    
                    // Add to cart
                    addToCart(product);
                    
                    // Animation feedback
                    this.classList.add('added');
                    setTimeout(() => {
                        this.classList.remove('added');
                    }, 1000);
                });
            }
        });
        
        console.log(`Setup ${buttonsFound} add to cart buttons`);
    }

    // Initialize cart when DOM is loaded
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('Cart system initializing...');
        
        // First check localStorage for cart data 
        const localStorageCart = getCartFromLocalStorage();
        if (localStorageCart && localStorageCart.length > 0) {
            console.log('Found cart in localStorage during initialization with', localStorageCart.length, 'items');
            cart = localStorageCart;
            isInitialized = true;
            updateCartCount();
        } else if (!isInitialized || cart.length === 0) {
            console.log('No cart in memory or localStorage, initializing from storage');
            await initializeCart();
        } else {
            console.log('Using existing cart in memory with', cart.length, 'items');
            updateCartCount();
        }
        
        // Set data-id attributes for product cards if they don't have one
        document.querySelectorAll('.product-card').forEach((card, index) => {
            if (!card.dataset.id) {
                card.dataset.id = `product-${index + 1}`;
            }
        });
        
        // Initialize cart components with retry for better reliability
        addCartButton();
        // Retry adding cart button after short delays to ensure nav is loaded
        setTimeout(() => {
            if (document.querySelector('.cart-button') === null) {
                console.log('Retrying cart button addition (first attempt)');
                addCartButton();
            }
        }, 300);
        setTimeout(() => {
            if (document.querySelector('.cart-button') === null) {
                console.log('Retrying cart button addition (second attempt)');
                addCartButton();
            }
        }, 1000);
        setupAddToCartButtons();
        
        // Setup keyboard support for modal (ESC key to close)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const cartModal = document.getElementById('cart-modal');
                if (cartModal && cartModal.style.display === 'block') {
                    closeCartModal();
                }
            }
        });
        
        // Listen for auth state changes to update cart accordingly
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged(async (user) => {
                if (user) {
                    // User is signed in
                    console.log('Auth state changed: user logged in on ' + window.location.pathname);
                    
                    try {
                        // Use the dedicated sync function to handle merging local and Firebase carts
                        const userId = user.uid;
                        
                        // Check if we already have Firebase cart data
                        const hasFirebaseCart = useFirebase && cart && cart.length > 0;
                        
                        // Check if we have local cart data to merge
                        const localCart = JSON.parse(localStorage.getItem('harnamCart')) || [];
                        const hasLocalCart = localCart && localCart.length > 0;
                        
                        if (hasLocalCart) {
                            console.log('Local cart found with', localCart.length, 'items, syncing with Firebase');
                            // We have local cart data to merge, use sync function
                            await syncCartAfterLogin(userId);
                        } else if (!hasFirebaseCart) {
                            // No local cart but we need to fetch Firebase cart
                            console.log('No local cart, fetching Firebase cart');
                            const firebaseCartResult = await window.FirebaseUtil?.cart?.getUserCart(userId);
                            
                            if (firebaseCartResult?.success && Array.isArray(firebaseCartResult.cart)) {
                                console.log('Got cart from Firebase after login:', firebaseCartResult.cart.length, 'items');
                                
                                // Update cart with Firebase data
                                cart = firebaseCartResult.cart;
                                useFirebase = true;
                                
                                // Clear localStorage to avoid conflicts
                                localStorage.removeItem('harnamCart');
                            } else {
                                // Fall back to normal initialization
                                await initializeCart();
                            }
                        }
                        
                        // Always update UI after handling cart
                        updateCartCount();
                        addCartButton();
                        
                        // Re-render the cart if the modal is open
                        const cartModal = document.getElementById('cart-modal');
                        if (cartModal && window.getComputedStyle(cartModal).display === 'block') {
                            renderCart();
                        }
                    } catch (error) {
                        console.error('Error handling cart after login:', error);
                        // Fallback to safe initialization
                        await initializeCart();
                        updateCartCount();
                        addCartButton();
                    }
                } else {
                    // User logged out
                    console.log('Auth state changed: user logged out');
                    
                    // Check if we should preserve the cart (on contact, login, signup pages)
                    if (preserveCartOnLogout) {
                        console.log('Preserving cart on logout because we are on a special page');
                        
                        // Get local cart to preserve
                        const localCart = JSON.parse(localStorage.getItem('harnamCart')) || [];
                        if (localCart.length > 0) {
                            // Keep the cart from localStorage
                            cart = localCart;
                            useFirebase = false;
                            isInitialized = true;
                            
                            // Update UI
                            updateCartCount();
                            addCartButton();
                            
                            console.log('Cart preserved with', cart.length, 'items');
                            return;
                        }
                    }
                    
                    // Clear cart data completely on logout (for other pages)
                    cart = [];
                    useFirebase = false;
                    isInitialized = false; // Force reinitialization on next page load
                    
                    // Clear localStorage cart
                    localStorage.removeItem('harnamCart');
                    
                    // Update UI
                    updateCartCount();
                    addCartButton(); // Ensure cart button is properly updated after logout
                    
                    // Re-render the cart if the modal is open
                    const cartModal = document.getElementById('cart-modal');
                    if (cartModal && window.getComputedStyle(cartModal).display === 'block') {
                        renderCart();
                    }
                    
                    console.log('Cart cleared after logout');
                }
            });
        }
        
        console.log('Initial cart contents:', JSON.parse(JSON.stringify(cart)));
        
        // Add a navigation detection listener to preserve cart state
        if ('navigation' in window) {
            window.navigation.addEventListener('navigate', (e) => {
                if (e.destination.url.includes('/contact')) {
                    console.log('Navigating to contact page, preserving cart state');
                    // Ensure cart is saved before navigation
                    if (cart.length > 0) {
                        if (useFirebase) {
                            try {
                                const userId = firebase.auth().currentUser?.uid;
                                if (userId) {
                                    window.FirebaseUtil?.cart?.updateUserCart(userId, cart);
                                }
                            } catch (err) {
                                console.error('Failed to save cart to Firebase before navigation:', err);
                            }
                        } else {
                            localStorage.setItem('harnamCart', JSON.stringify(cart));
                        }
                    }
                }
            });
        }
        
        // Improved window events to recover cart data
        document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState === 'visible') {
                console.log('Page visibility changed to visible, checking cart');
                
                // Always check localStorage first
                const localStorageCart = getCartFromLocalStorage();
                
                if (localStorageCart && localStorageCart.length > 0 && 
                    (cart.length === 0 || localStorageCart.length > cart.length)) {
                    console.log('Found more items in localStorage cart, restoring', localStorageCart.length, 'items');
                    cart = localStorageCart;
                    isInitialized = true;
                    updateCartCount();
                    addCartButton();
                }
            }
        });
        
        // Listen for page unload to save cart
        window.addEventListener('beforeunload', () => {
            if (cart.length > 0) {
                try {
                    localStorage.setItem('harnamCart', JSON.stringify(cart));
                    localStorage.setItem('harnamCart_backup', JSON.stringify(cart));
                    console.log('Saved cart before page unload');
                } catch (err) {
                    console.error('Error saving cart before unload:', err);
                }
            }
        });
    });
    
    // Replace the syncCartWithUserAccount function with a more reliable implementation
    async function syncCartWithUserAccount() {
        try {
            // Check if user is logged in and Firebsase is available
            if (typeof window.FirebaseUtil !== 'undefined' &&
                typeof window.HarnamAuth !== 'undefined') {
                
                const currentUser = window.HarnamAuth.getCurrentUser();
                if (currentUser && currentUser.id) {
                    console.log('Starting cart sync for user:', currentUser.id);
                    
                    // First get Firebase cart data
                    const result = await window.FirebaseUtil.cart.getUserCart(currentUser.id);
                    
                    if (result.success) {
                        const firebaseCart = result.cart || [];
                        const localCart = cart; // Use the current cart variable directly
                        
                        console.log('Firebase cart:', firebaseCart.length, 'items');
                        console.log('Local cart:', localCart.length, 'items');
                        
                        // Only merge if either cart has items
                        if (firebaseCart.length > 0 || localCart.length > 0) {
                            // Merge carts with priority to local cart for duplicates
                            const mergedCart = mergeCart(firebaseCart, localCart);
                            
                            // Update local cart with merged result
                            cart = mergedCart;
                            
                            // Update both localStorage and Firebase with final result
                            localStorage.setItem('harnamCart', JSON.stringify(cart));
                            await window.FirebaseUtil.cart.updateUserCart(currentUser.id, cart);
                            
                            // Update UI
                            updateCartCount();
                            console.log('Cart synced with user account -', cart.length, 'total items');
                        }
                    } else {
                        console.warn('Failed to get Firebase cart:', result.message);
                        
                        // If there was an error getting Firebase cart but local cart has items,
                        // try to update Firebase with local cart
                        if (cart.length > 0) {
                            await window.FirebaseUtil.cart.updateUserCart(currentUser.id, cart);
                            console.log('Updated Firebase with local cart');
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error syncing cart with user account:', error);
        }
    }

    // Improved function to sync cart after login
    async function syncCartAfterLogin(userId) {
        if (syncInProgress) {
            console.log('Sync already in progress, skipping');
            return;
        }
        
        syncInProgress = true;
        
        try {
            if (!userId || !window.FirebaseUtil) {
                console.error('Cannot sync cart: missing userId or Firebase');
                return false;
            }
            
            console.log('Syncing cart after login for user:', userId);
            
            // Set Firebase mode
            useFirebase = true;
            
            // Get local cart
            const localCart = JSON.parse(localStorage.getItem('harnamCart')) || [];
            
            // Get Firebase cart
            const firebaseResult = await window.FirebaseUtil.cart.getUserCart(userId);
            const firebaseCart = firebaseResult.success ? firebaseResult.cart : [];
            
            // Merge carts giving priority to Firebase items
            const mergedCart = [];
            const processedIds = new Set();
            
            // First add Firebase items
            firebaseCart.forEach(item => {
                if (item && item.id) {
                    mergedCart.push({ ...item });
                    processedIds.add(item.id);
                }
            });
            
            // Then merge local items
            localCart.forEach(localItem => {
                if (localItem && localItem.id) {
                    const existingItem = mergedCart.find(item => item.id === localItem.id);
                    if (existingItem) {
                        // For duplicates, sum the quantities
                        existingItem.quantity += localItem.quantity;
                    } else {
                        // New item, add it
                        mergedCart.push({ ...localItem });
                    }
                }
            });
            
            // Update Firebase with merged cart
            await window.FirebaseUtil.cart.updateUserCart(userId, mergedCart);
            
            // Update local reference
            cart = mergedCart;
            
            // Clear localStorage
            localStorage.removeItem('harnamCart');
            
            // Update UI
            isInitialized = true;
            updateCartCount();
            
            console.log('Cart synced after login with', mergedCart.length, 'items');
            return true;
            
        } catch (error) {
            console.error('Error syncing cart after login:', error);
            return false;
        } finally {
            syncInProgress = false;
        }
    }

    // Handle logout - simplified
    async function handleLogout() {
        try {
            console.log('Handling logout in cart system');
            
            // Clear all cart data
            cart = [];
            useFirebase = false;
            isInitialized = false;
            
            // Clear storage
            localStorage.removeItem('harnamCart');
            
            // Update UI
            updateCartCount();
            
            console.log('Cart cleared after logout');
            return true;
        } catch (error) {
            console.error('Error handling logout:', error);
            return false;
        }
    }
    
    // Expose HarnamCart API - streamlined and simplified
    window.HarnamCart = {
        // Core cart operations
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        
        // UI operations
        addCartButton,
        updateCartCount,
        openCartModal,
        closeCartModal,
        
        // Cart state management
        syncCartAfterLogin,
        handleLogout,
        
        // Clear cart completely
        clearCart: function() {
            cart = [];
            localStorage.removeItem('harnamCart');
            updateCartCount();
            
            // Clear Firebase if logged in
            if (useFirebase && window.FirebaseUtil) {
                const userId = window.HarnamAuth?.getCurrentUser()?.id ||
                             firebase.auth()?.currentUser?.uid;
                if (userId) {
                    window.FirebaseUtil.cart.updateUserCart(userId, []);
                }
            }
            return true;
        },
        
        // Initialize/reinitialize cart
        initializeCart: async function() {
            console.log('Reinitializing cart via API');
            isInitialized = false; // Force reinitialization
            return initializeCart();
        },
        
        // Update cart with new data
        updateCart: function(newCart) {
            if (!Array.isArray(newCart)) return false;
            
            cart = [...newCart];
            updateCartCount();
            console.log('Cart updated with', newCart.length, 'items');
            return true;
        },
        
        // Get current cart (returns copy to prevent direct mutation)
        getCart: function() {
            return [...cart];
        },
        
        // Check if cart is empty
        isCartEmpty: function() {
            return cart.length === 0;
        }
    };
    
    // Initialize cart when DOM is loaded
    document.addEventListener('DOMContentLoaded', async () => {
        await initializeCart();
        addCartButton();
        setupAddToCartButtons();
        
        // Listen for auth state changes
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged(async (user) => {
                if (user) {
                    // User logged in - sync cart if needed
                    const localCart = JSON.parse(localStorage.getItem('harnamCart')) || [];
                    if (localCart.length > 0) {
                        await syncCartAfterLogin(user.uid);
                    } else {
                        // Just initialize from Firebase
                        isInitialized = false;
                        await initializeCart();
                    }
                } else {
                    // User logged out
                    if (!preserveCartOnLogout) {
                        await handleLogout();
                    }
                }
                updateCartCount();
            });
        }
    });
})();
