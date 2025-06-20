// Cart functionality for Harnam Masale

(function() {
    // Initialize cart from localStorage or create empty cart
    let cart = [];
    let isInitialized = false;

    // Initialize cart - new function to handle initialization only once
    async function initializeCart() {
        if (isInitialized) return;
        
        try {
            // Load local cart from localStorage first
            const localCart = JSON.parse(localStorage.getItem('harnamCart')) || [];
            
            // Check Firebase auth first for the most reliable user ID, but only if Firebase is available
            let userId = null;
            
            // Add defensive check before accessing firebase
            if (typeof firebase !== 'undefined' && firebase.auth) {
                const firebaseUser = firebase.auth().currentUser;
                
                if (firebaseUser) {
                    userId = firebaseUser.uid;
                }
            } else {
                console.log('Firebase not available, falling back to local user data');
            }
            
            // Fall back to localStorage user if Firebase user not found
            if (!userId) {
                const localUser = window.HarnamAuth?.getCurrentUser();
                if (localUser && localUser.id) {
                    userId = localUser.id;
                }
            }
            
            // If user is logged in, sync cart with Firebase
            if (userId && typeof window.FirebaseUtil !== 'undefined') {
                console.log('User is logged in, fetching cart from Firebase');
                
                try {
                    const result = await window.FirebaseUtil.cart.getUserCart(userId);
                    
                    if (result.success && Array.isArray(result.cart)) {
                        if (result.cart.length > 0) {
                            // If Firebase has items, use those
                            cart = result.cart;
                        } else if (localCart.length > 0) {
                            // If Firebase cart is empty but local has items, sync local to Firebase
                            cart = localCart;
                            await window.FirebaseUtil.cart.updateUserCart(userId, localCart);
                        } else {
                            // Both empty, initialize with empty array
                            cart = [];
                        }
                    } else {
                        // Error or invalid result, use local cart
                        cart = localCart;
                    }
                } catch (firebaseError) {
                    console.error('Firebase cart fetch failed:', firebaseError);
                    // Use local cart on error
                    cart = localCart;
                }
            } else {
                // No user logged in, just use local cart
                console.log('No user logged in, using local cart only');
                cart = localCart;
            }
        } catch (error) {
            console.error('Error initializing cart:', error);
            // Don't clear cart on error, try to load from localStorage
            cart = JSON.parse(localStorage.getItem('harnamCart')) || [];
        }
        
        // Always save cart to localStorage for consistency
        localStorage.setItem('harnamCart', JSON.stringify(cart));
        
        isInitialized = true;
        updateCartCount();
    }

    // Save cart to localStorage and sync with Firebase if user is logged in
    async function saveCart() {
        try {
            // Always save to localStorage for immediate access
            localStorage.setItem('harnamCart', JSON.stringify(cart));
            updateCartCount();
            
            // Sync with Firebase if user is logged in and Firebase is available
            if (typeof window.FirebaseUtil !== 'undefined') {
                // Check Firebase auth first with defensive check
                let userId = null;
                
                // Only attempt to use Firebase if it's available
                if (typeof firebase !== 'undefined' && firebase.auth) {
                    const currentUser = firebase.auth().currentUser;
                    if (currentUser) {
                        userId = currentUser.uid;
                    }
                }
                
                // Fall back to localStorage user if Firebase auth not available
                if (!userId) {
                    const localUser = window.HarnamAuth?.getCurrentUser();
                    if (localUser && localUser.id) {
                        userId = localUser.id;
                    }
                }
                
                if (userId) {
                    console.log('Updating Firebase cart for user:', userId, 'with items:', cart.length);
                    // Directly call the Firebase update function
                    await window.FirebaseUtil.cart.updateUserCart(userId, cart);
                } else {
                    console.log('User not logged in or missing ID, skipping Firebase cart update');
                }
            }
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }

    // Add item to cart
    function addToCart(product) {
        // Check if product already exists in cart
        const existingItemIndex = cart.findIndex(item => 
            item.id === product.id);
        
        // Ensure product has all required properties
        const processedProduct = {
            id: product.id || `product-${Math.random().toString(36).substr(2, 9)}`,
            name: product.name || 'Product',
            price: product.price || '₹0',
            image: product.image || '',
            quantity: product.quantity || 1
        };
        
        console.log('Adding product to cart:', processedProduct);
        
        if (existingItemIndex > -1) {
            // Update quantity if product already in cart
            cart[existingItemIndex].quantity += processedProduct.quantity;
        } else {
            // Add new item
            cart.push(processedProduct);
        }
        
        // Save cart and show notification
        saveCart();
        showCartNotification(processedProduct.name);
        
        return true;
    }

    // Remove item from cart
    function removeFromCart(productId) {
        const initialLength = cart.length;
        cart = cart.filter(item => item.id !== productId);
        
        if (cart.length !== initialLength) {
            saveCart();
            return true;
        }
        return false;
    }

    // Update item quantity in cart
    function updateCartItemQuantity(productId, quantity) {
        const item = cart.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                return removeFromCart(productId);
            } else {
                item.quantity = quantity;
                saveCart();
                return true;
            }
        }
        return false;
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
        // Check if cart button already exists
        if (!document.querySelector('.cart-button')) {
            const nav = document.querySelector('header nav .nav-links');
            if (nav) {
                // Create a new list item for the cart button
                const cartListItem = document.createElement('li');
                
                // Create the cart button
                const cartButton = document.createElement('button');
                cartButton.className = 'cart-button';
                cartButton.innerHTML = `
                    <i class="fas fa-shopping-cart"></i>
                    <span class="cart-count">0</span>
                `;
                
                // Add the button to the list item
                cartListItem.appendChild(cartButton);
                
                // Add the list item to the nav
                nav.appendChild(cartListItem);
                
                // Add click event
                cartButton.addEventListener('click', openCartModal);
                
                console.log('Cart button added to navigation');
            } else {
                console.warn('Navigation not found, cannot add cart button');
            }
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
        
        // Initialize cart only once
        await initializeCart();
        
        // Set data-id attributes for product cards if they don't have one
        document.querySelectorAll('.product-card').forEach((card, index) => {
            if (!card.dataset.id) {
                card.dataset.id = `product-${index + 1}`;
            }
        });
        
        // Initialize cart components
        addCartButton();
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
        
        console.log('Initial cart contents:', JSON.parse(JSON.stringify(cart)));
    });

    // Replace the syncCartWithUserAccount function with a more reliable implementation
    async function syncCartWithUserAccount() {
        try {
            // Check if user is logged in and Firebase is available
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

    // Add this function to sync cart after login
    async function syncCartAfterLogin(userId) {
        try {
            // Get local cart items first
            const localCart = JSON.parse(localStorage.getItem('harnamCart')) || [];
            
            // Get user's cart from Firebase
            const result = await window.FirebaseUtil.cart.getUserCart(userId);
            
            // Merge carts with Firebase cart
            let finalCart = [];
            if (result.success && Array.isArray(result.cart)) {
                finalCart = mergeCart(result.cart, localCart);
            } else {
                finalCart = localCart;
            }
            
            // Update cart variable
            cart = finalCart;
            
            // Save merged cart back to both localStorage and Firebase
            localStorage.setItem('harnamCart', JSON.stringify(cart));
            await window.FirebaseUtil.cart.updateUserCart(userId, cart);
            
            // Update UI
            updateCartCount();
            console.log('Cart synced after login:', cart.length, 'items');
        } catch (error) {
            console.error('Error syncing cart after login:', error);
        }
    }

    // Helper function to merge two carts
    function mergeCart(firebaseCart, localCart) {
        // Start with Firebase cart items
        const mergedCart = [...firebaseCart];
        
        // Add or update with local cart items
        localCart.forEach(localItem => {
            const existingItemIndex = mergedCart.findIndex(item => item.id === localItem.id);
            
            if (existingItemIndex > -1) {
                // Update quantity if item exists in both carts
                mergedCart[existingItemIndex].quantity += localItem.quantity;
            } else {
                // Add new item if not in Firebase cart
                mergedCart.push(localItem);
            }
        });
        
        return mergedCart;
    }

    // Update the DOM loaded event listener to sync with Firebase
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Cart system initializing...');
        
        // Initialize cart only once
        initializeCart();
        
        // Set data-id attributes for product cards if they don't have one
        document.querySelectorAll('.product-card').forEach((card, index) => {
            if (!card.dataset.id) {
                card.dataset.id = `product-${index + 1}`;
            }
        });
        
        // Initialize cart components
        addCartButton();
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
        
        // Debug existing cart
        console.log('Initial cart contents:', JSON.parse(JSON.stringify(cart)));
    });

    // Update addToCart function to sync with user account
    const originalAddToCart = addToCart;
    addToCart = async function(product) {
        // Call the original function
        const result = originalAddToCart(product);
        
        // Sync with user account if available
        await syncCartWithUserAccount();
        
        return result;
    };

    // Update removeFromCart function to sync with user account
    const originalRemoveFromCart = removeFromCart;
    removeFromCart = async function(productId) {
        // Call the original function
        const result = originalRemoveFromCart(productId);
        
        // Sync with user account if available
        await syncCartWithUserAccount();
        
        return result;
    };

    // Update updateCartItemQuantity function to sync with user account
    const originalUpdateCartItemQuantity = updateCartItemQuantity;
    updateCartItemQuantity = async function(productId, quantity) {
        // Call the original function
        const result = originalUpdateCartItemQuantity(productId, quantity);
        
        // Sync with user account if available
        await syncCartWithUserAccount();
        
        return result;
    };

    // Add new function to clear cart
    function clearCart() {
        cart = [];
        localStorage.removeItem('harnamCart');
        updateCartCount();
        updateCartDisplay();
        // Also clear Firebase cart if user is logged in
        if (typeof window.FirebaseUtil !== 'undefined') {
            let userId = null;
            if (typeof firebase !== 'undefined' && firebase.auth) {
                const currentUser = firebase.auth().currentUser;
                if (currentUser) {
                    userId = currentUser.uid;
                }
            }
            if (!userId && window.HarnamAuth?.getCurrentUser) {
                const localUser = window.HarnamAuth.getCurrentUser();
                if (localUser && localUser.id) {
                    userId = localUser.id;
                }
            }
            if (userId) {
                // Remove cart from Firebase
                firebase.database().ref('users/' + userId + '/cart').remove();
            }
        }
    }

    // Add new function to handle user logout
    async function handleLogout() {
        clearCart();
        isInitialized = false; // Reset initialization flag
        console.log('Cart cleared on logout');
    }

    // Expose only HarnamCart:
    window.HarnamCart = {
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        openCartModal,
        renderCart,
        closeCartModal,
        ensureCartModalExists,
        updateCartDisplay,
        syncCartWithUserAccount,
        syncCartAfterLogin,
        clearCart,
        handleLogout,
        // Add this function to fix the resetCartModal error in home.js
        verifyCartModal: function() {
            console.log('Verifying cart modal exists');
            // Simply ensures cart modal exists, using the existing function
            return ensureCartModalExists();
        },
        // Add function to get cart count
        addCartButton: function() {
            return addCartButton();
        },
        // Expose updateCartCount function for other pages to use
        updateCartCount: function() {
            updateCartCount();
        },
        // Add function to update cart from outside
        updateCart: function(newCart) {
            if (Array.isArray(newCart)) {
                cart = newCart;
                updateCartCount();
                updateCartDisplay();
            }
        },
        mergeCart // expose mergeCart for cart sync after login
    };
})();
