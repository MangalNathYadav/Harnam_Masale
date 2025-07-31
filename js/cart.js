// =============== Cart functionality for Harnam Masale - Centralized Implementation ===============

(function() {
    // Cart state variables
    let cart = [];
    let isInitialized = false;
    let useFirebase = true;  // Always use Firebase (for both logged in and guest)
    let initializationInProgress = false;
    let currentGuestId = null;

    // Initialize cart - completely rewritten for better logic
    async function initializeCart() {
        if (initializationInProgress) {
            console.log('Cart initialization already in progress');
            return cart;
        }
        
        initializationInProgress = true;
        
        try {
            console.log('Initializing cart system...');
            
            // Check if user is logged in
            const currentUser = getCurrentUser();
            
            if (currentUser && currentUser.id) {
                // User is logged in - Use Firebase with user ID
                console.log('User logged in, switching to user Firebase mode');
                await switchToFirebaseMode(currentUser.id);
            } else {
                // User not logged in - Use Firebase with guest ID
                console.log('User not logged in, switching to guest Firebase mode');
                await switchToGuestFirebaseMode();
            }
            
            isInitialized = true;
            updateCartCount();
            
        } catch (error) {
            console.error('Error initializing cart:', error);
            // Fallback to empty guest cart using localStorage as last resort
            cart = [];
            useFirebase = false;
            isInitialized = true;
            updateCartCount();
            
            // Save empty cart to localStorage as fallback
            localStorage.setItem('harnamCart', JSON.stringify([]));
        } finally {
            initializationInProgress = false;
        }
        
        return cart;
    }

    // Switch to Firebase mode (when user logs in)
    async function switchToFirebaseMode(userId) {
        console.log('Switching to Firebase mode for user:', userId);
        
        try {
            // Get current guest cart from Firebase guest cart if available
            let guestCart = [];
            
            // Check if we have a guest ID in localStorage
            const guestId = localStorage.getItem('harnamGuestId');
            
            if (guestId && window.FirebaseUtil && window.FirebaseUtil.cart) {
                // Get the guest cart from Firebase
                const guestResult = await window.FirebaseUtil.cart.getGuestCart(guestId);
                if (guestResult.success && Array.isArray(guestResult.cart)) {
                    guestCart = guestResult.cart;
                }
                
                // Clear guest ID and cart from localStorage
                localStorage.removeItem('harnamGuestId');
                localStorage.removeItem('harnamGuestIdExpires');
            } else {
                // If no guest ID, try local storage as fallback
                guestCart = getCartFromLocalStorage();
            }
            
            // Get Firebase cart for user
            let firebaseCart = [];
            if (window.FirebaseUtil && window.FirebaseUtil.cart) {
                const result = await window.FirebaseUtil.cart.getUserCart(userId);
                if (result.success && Array.isArray(result.cart)) {
                    firebaseCart = result.cart;
                }
            }
            
            // Merge guest cart into Firebase cart if guest cart has items
            if (guestCart.length > 0) {
                console.log('Merging guest cart with Firebase cart');
                const mergedCart = mergeCartItems(firebaseCart, guestCart);
                
                // Save merged cart to Firebase
                if (window.FirebaseUtil && window.FirebaseUtil.cart) {
                    await window.FirebaseUtil.cart.updateUserCart(userId, mergedCart);
                }
                
                cart = mergedCart;
                console.log('Cart merged and saved to Firebase:', cart.length, 'items');
            } else {
                // No guest cart, just use Firebase cart
                cart = firebaseCart;
                console.log('Using Firebase cart:', cart.length, 'items');
            }
            
            // Clear any guest data
            if (guestId && window.FirebaseUtil && window.FirebaseUtil.cart) {
                // Delete the guest cart data
                await database.ref('guest_carts/' + guestId).remove();
            }
            
            // Clear localStorage cart data
            localStorage.removeItem('harnamCart');
            localStorage.removeItem('harnamCart_backup');
            
            useFirebase = true;
            currentGuestId = null;
            
        } catch (error) {
            console.error('Error switching to Firebase mode:', error);
            // Fallback: use guest cart from localStorage if Firebase fails
            cart = getCartFromLocalStorage();
            useFirebase = false;
        }
    }

    // Switch to guest mode using Firebase RTDB
    async function switchToGuestFirebaseMode() {
        console.log('Switching to guest Firebase mode');
        
        try {
            // Check for guest ID expiration
            if (window.checkGuestIdExpiration) {
                const expired = window.checkGuestIdExpiration();
                if (expired) {
                    console.log('Guest ID expired, will create new one');
                }
            }
            
            // Get or create guest ID
            const guestId = window.getOrCreateGuestId ? 
                window.getOrCreateGuestId() : 
                createLocalGuestId();
            
            currentGuestId = guestId;
            
            console.log('Using guest ID:', guestId);
            
            // Try to get cart from Firebase for this guest ID
            let guestCart = [];
            if (window.FirebaseUtil && window.FirebaseUtil.cart) {
                const result = await window.FirebaseUtil.cart.getGuestCart(guestId);
                if (result.success && Array.isArray(result.cart)) {
                    guestCart = result.cart;
                    console.log('Retrieved guest cart from Firebase:', guestCart.length, 'items');
                }
            }
            
            cart = guestCart;
            useFirebase = true;
            
            // Clear any existing localStorage cart data but keep the guest ID
            localStorage.removeItem('harnamCart');
            localStorage.removeItem('harnamCart_backup');
            
        } catch (error) {
            console.error('Error switching to guest Firebase mode:', error);
            // Fallback to localStorage if Firebase fails
            cart = getCartFromLocalStorage();
            if (!Array.isArray(cart)) cart = [];
            useFirebase = false;
        }
    }
    
    // Fallback function to create a guest ID if the global one isn't available
    function createLocalGuestId() {
        let guestId = localStorage.getItem('harnamGuestId');
        if (!guestId) {
            const timestamp = new Date().getTime();
            const randomSuffix = Math.random().toString(36).substring(2, 10);
            guestId = `guest_${timestamp}_${randomSuffix}`;
            localStorage.setItem('harnamGuestId', guestId);
            
            // Set expiration (7 days from now)
            const expirationTime = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
            localStorage.setItem('harnamGuestIdExpires', expirationTime.toString());
        }
        return guestId;
    }

    // Merge cart items with priority to quantities
    function mergeCartItems(firebaseCart, guestCart) {
        const merged = [...firebaseCart];
        
        guestCart.forEach(guestItem => {
            const existingIndex = merged.findIndex(item => item.id === guestItem.id);
            if (existingIndex >= 0) {
                // Item exists, increase quantity
                merged[existingIndex].quantity += guestItem.quantity;
            } else {
                // New item, add it
                merged.push({...guestItem});
            }
        });
        
        return merged;
    }
    
    // Get current user helper
    function getCurrentUser() {
        // Try Firebase first
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
            return { id: firebase.auth().currentUser.uid };
        }
        
        // Try HarnamAuth
        if (window.HarnamAuth && window.HarnamAuth.getCurrentUser) {
            return window.HarnamAuth.getCurrentUser();
        }
        
        return null;
    }
    
    // Helper function to get cart from localStorage (used only for guest mode)
    function getCartFromLocalStorage() {
        try {
            const cartStr = localStorage.getItem('harnamCart');
            if (cartStr) {
                const parsedCart = JSON.parse(cartStr);
                if (Array.isArray(parsedCart)) {
                    return parsedCart;
                }
            }
            return [];
        } catch (error) {
            console.error('Error reading cart from localStorage:', error);
            return [];
        }
    }

    // Save cart data based on current mode (simplified)
    async function saveCart() {
        try {
            if (useFirebase) {
                // Firebase mode - save to Firebase for both users and guests
                const currentUser = getCurrentUser();
                
                if (currentUser && currentUser.id && window.FirebaseUtil && window.FirebaseUtil.cart) {
                    // Logged in user - save to user's cart
                    await window.FirebaseUtil.cart.updateUserCart(currentUser.id, cart);
                    console.log('Saved cart to Firebase for user:', cart.length, 'items');
                } else if (window.FirebaseUtil && window.FirebaseUtil.cart) {
                    // Guest user - save to guest cart
                    const guestId = currentGuestId || (window.getOrCreateGuestId ? window.getOrCreateGuestId() : createLocalGuestId());
                    
                    await window.FirebaseUtil.cart.updateUserCart(guestId, cart);
                    console.log('Saved cart to Firebase for guest:', cart.length, 'items');
                } else {
                    console.error('Cannot save to Firebase - FirebaseUtil not available');
                    // Fallback to localStorage
                    localStorage.setItem('harnamCart', JSON.stringify(cart));
                }
            } else {
                // Fallback guest mode - save to localStorage only
                localStorage.setItem('harnamCart', JSON.stringify(cart));
                console.log('Saved cart to localStorage (fallback):', cart.length, 'items');
            }
            
            updateCartCount();
        } catch (error) {
            console.error('Error saving cart:', error);
            // Emergency fallback to localStorage
            localStorage.setItem('harnamCart', JSON.stringify(cart));
        }
    }

    // Transactional increment for cart item quantity in Firebase RTDB
    async function incrementCartItemQuantity(productId, incrementBy = 1, productData = {}) {
        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.id || !window.FirebaseUtil || !window.FirebaseUtil.cart) return false;

        const cartRef = firebase.database().ref('users/' + currentUser.id + '/cart');
        return cartRef.transaction(cartArr => {
            if (!cartArr) cartArr = [];
            if (!Array.isArray(cartArr)) cartArr = Object.values(cartArr);

            const idx = cartArr.findIndex(item => item.id === productId);
            if (idx !== -1) {
                cartArr[idx].quantity = (parseInt(cartArr[idx].quantity) || 0) + incrementBy;
            } else {
                cartArr.push({ ...productData, quantity: incrementBy });
            }
            return cartArr;
        }).then(result => {
            if (result.committed && Array.isArray(result.snapshot.val())) {
                cart = result.snapshot.val();
                updateCartCount();
                return true;
            }
            return false;
        }).catch(err => {
            console.error('Transaction error:', err);
            return false;
        });
    }

    // Add item to cart (transactional for logged-in users)
    async function addToCart(product) {
        try {
            // Ensure cart is initialized
            if (!isInitialized) {
                await initializeCart();
            }

            // Validate product
            if (!product || !product.id) {
                console.error('Invalid product provided to addToCart');
                return false;
            }

            // Ensure product has all required properties
            const processedProduct = {
                id: product.id,
                name: product.name || 'Product',
                price: product.price || '₹0',
                image: product.image || '',
                quantity: product.quantity || 1
            };

            const currentUser = getCurrentUser();

            if (useFirebase && currentUser && currentUser.id && typeof firebase !== 'undefined' && firebase.database) {
                // Use transaction for logged-in user
                await incrementCartItemQuantity(processedProduct.id, processedProduct.quantity, processedProduct);
                showCartNotification(processedProduct.name);
                return true;
            } else if (useFirebase && currentGuestId && typeof firebase !== 'undefined' && firebase.database) {
                // Guest cart in RTDB (transactional)
                const cartRef = firebase.database().ref('guest_carts/' + currentGuestId);
                await cartRef.transaction(cartArr => {
                    if (!cartArr) cartArr = [];
                    if (!Array.isArray(cartArr)) cartArr = Object.values(cartArr);

                    const idx = cartArr.findIndex(item => item.id === processedProduct.id);
                    if (idx !== -1) {
                        cartArr[idx].quantity = (parseInt(cartArr[idx].quantity) || 0) + processedProduct.quantity;
                    } else {
                        cartArr.push({ ...processedProduct });
                    }
                    return cartArr;
                }).then(result => {
                    if (result.committed && Array.isArray(result.snapshot.val())) {
                        cart = result.snapshot.val();
                        updateCartCount();
                    }
                });
                showCartNotification(processedProduct.name);
                return true;
            } else {
                // Fallback: local cart logic
                const existingItemIndex = cart.findIndex(item => item.id === processedProduct.id);
                const updatedCart = [...cart];
                if (existingItemIndex > -1) {
                    updatedCart[existingItemIndex] = {
                        ...updatedCart[existingItemIndex],
                        quantity: updatedCart[existingItemIndex].quantity + processedProduct.quantity
                    };
                } else {
                    updatedCart.push(processedProduct);
                }
                cart = updatedCart;
                await saveCart();
                showCartNotification(processedProduct.name);
                return true;
            }
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

    // Set up universal add to cart button functionality
    // This replaces all the duplicate implementations across files
    function setupUniversalCartButtons() {
        // Remove any existing click handlers and set up new ones
        const buttons = document.querySelectorAll('.add-to-cart-btn, .product-action-btn');
        
        buttons.forEach(button => {
            // Check if this is actually a cart button
            const isCartButton = button.querySelector('.fa-shopping-cart') !== null || 
                               button.classList.contains('add-to-cart-btn') ||
                               button.textContent.toLowerCase().includes('cart');
            
            if (!isCartButton) return;
            
            // Remove existing listeners by cloning
            const newBtn = button.cloneNode(true);
            if (button.parentNode) {
                button.parentNode.replaceChild(newBtn, button);
            }
            
            // Add centralized click handler
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Visual feedback
                this.classList.add('added');
                
                // Get product information
                const product = extractProductInfo(this);
                
                if (product) {
                    // Add to cart using centralized function
                    addToCart(product);
                    
                    // Remove visual feedback after delay
                    setTimeout(() => {
                        this.classList.remove('added');
                    }, 1000);
                } else {
                    console.error('Could not extract product information');
                    this.classList.remove('added');
                }
            });
        });
        
        console.log(`Set up ${buttons.length} cart buttons`);
    }

    // Extract product information from button context
    function extractProductInfo(button) {
        // Try to get from data attribute first
        if (button.dataset.productInfo) {
            try {
                return JSON.parse(button.dataset.productInfo);
            } catch (e) {
                console.warn('Failed to parse product info from data attribute');
            }
        }
        
        // Try to get from product card
        const productCard = button.closest('.product-card');
        if (productCard) {
            const productId = productCard.dataset.id || `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const productName = productCard.querySelector('.product-title, .product-name, h3, h4')?.textContent?.trim() || 'Product';
            const productPrice = productCard.querySelector('.price, .product-price')?.textContent?.trim() || '₹0';
            const productImage = productCard.querySelector('.product-img, .product-image, img')?.src || '';
            
            return {
                id: productId,
                name: productName,
                price: productPrice,
                image: productImage,
                quantity: 1
            };
        }
        
        // Try to get from modal context
        const modal = button.closest('.modal');
        if (modal) {
            const productId = modal.dataset.productId || `modal-product-${Date.now()}`;
            const productName = modal.querySelector('.modal-product-title, .product-title')?.textContent?.trim() || 'Product';
            const productPrice = modal.querySelector('.modal-product-price, .price')?.textContent?.trim() || '₹0';
            const productImage = modal.querySelector('.modal-product-image img, img')?.src || '';
            
            return {
                id: productId,
                name: productName,
                price: productPrice,
                image: productImage,
                quantity: 1
            };
        }
        
        return null;
    }

    // Auto-setup cart buttons when content changes
    function observeForNewButtons() {
        const observer = new MutationObserver((mutations) => {
            let shouldSetup = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            if (node.querySelector && 
                                (node.querySelector('.add-to-cart-btn') || 
                                 node.querySelector('.product-action-btn'))) {
                                shouldSetup = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldSetup) {
                setTimeout(setupUniversalCartButtons, 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Initialize everything when DOM is ready
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('Cart system initializing...');
        
        // Check if Firebase is available
        if (typeof firebase === 'undefined' || !firebase.database) {
            console.error('Firebase is not available. Loading Firebase scripts...');
            await loadFirebaseDependencies();
        }
        
        // Initialize cart
        await initializeCart();
        
        // Set up UI components
        addCartButton();
        setupUniversalCartButtons();
        
        // Start observing for dynamically added buttons
        observeForNewButtons();
        
        // Set up auth state monitoring
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged(async (user) => {
                if (user && user.uid) {
                    // User logged in
                    console.log('User logged in:', user.uid);
                    await handleLogin(user.uid);
                } else {
                    // User logged out or not logged in
                    console.log('User logged out or not logged in');
                    await handleLogout();
                }
            });
        } else {
            console.warn('Firebase auth not available for auth state monitoring');
        }
        
        console.log('Cart system initialization complete');
    });
    
    // Helper function to load Firebase dependencies if they're missing
    async function loadFirebaseDependencies() {
        return new Promise((resolve) => {
            // Check if firebase-config.js is already loaded
            if (window.FirebaseUtil) {
                console.log('Firebase config already loaded');
                resolve();
                return;
            }
            
            // Load required Firebase scripts
            const scripts = [
                'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
                'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js',
                'https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js',
                '../js/firebase-config.js'
            ];
            
            let loaded = 0;
            
            scripts.forEach(src => {
                // Check if script is already loaded
                if (Array.from(document.querySelectorAll('script')).some(s => s.src.includes(src))) {
                    loaded++;
                    if (loaded === scripts.length) resolve();
                    return;
                }
                
                const script = document.createElement('script');
                script.src = src;
                script.async = false; // Load in order
                
                script.onload = () => {
                    loaded++;
                    if (loaded === scripts.length) {
                        console.log('All Firebase dependencies loaded');
                        setTimeout(resolve, 200); // Give a small delay for scripts to initialize
                    }
                };
                
                script.onerror = () => {
                    console.error(`Failed to load script: ${src}`);
                    loaded++;
                    if (loaded === scripts.length) resolve(); // Continue even if some fail
                };
                
                document.head.appendChild(script);
            });
        });
    }
    
    // Handle login - transfer guest cart to Firebase and switch modes
    async function handleLogin(userId) {
        try {
            console.log('Handling login for user:', userId);
            
            // Get current guest cart before switching modes
            const guestCart = [...cart];  // Make a copy of current cart
            
            // Switch to Firebase mode (this will merge guest cart with Firebase cart)
            await switchToFirebaseMode(userId);
            
            // Update UI
            updateCartCount();
            
            console.log('Login handled successfully. Cart now has', cart.length, 'items');
            return true;
            
        } catch (error) {
            console.error('Error handling login:', error);
            return false;
        }
    }
    
    // Handle logout - reset to guest mode
    async function handleLogout() {
        try {
            console.log('Handling logout - resetting to guest mode');
            
            // Switch to guest Firebase mode (since we've replaced localStorage with Firebase)
            await switchToGuestFirebaseMode();
            
            // Reset initialization flag to force re-initialization
            isInitialized = false;
            
            // Update UI
            updateCartCount();
            
            console.log('Logout handled successfully. Cart reset to guest mode');
            return true;
            
        } catch (error) {
            console.error('Error handling logout:', error);
            return false;
        }
    }
    
    // Expose HarnamCart API - centralized interface
    window.HarnamCart = {
        // Core cart operations
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        calculateCartTotal,
        
        // Cart data access
        getCart: function() {
            return [...cart];
        },
        
        getCartCount: function() {
            return cart.reduce((total, item) => total + item.quantity, 0);
        },
        
        isCartEmpty: function() {
            return cart.length === 0;
        },
        
        // UI operations
        updateCartCount,
        openCartModal,
        closeCartModal,
        renderCart,
        
        // Auth operations
        handleLogin,
        handleLogout,
        
        // Utility functions
        clearCart: async function() {
            cart = [];
            await saveCart();
            return true;
        },
        
        initializeCart: async function() {
            return await initializeCart();
        },
        
        updateCart: function(newCart) {
            if (!Array.isArray(newCart)) return false;
            cart = [...newCart];
            updateCartCount();
            return true;
        },
        
        // Setup functions for external use
        setupCartButtons: setupUniversalCartButtons,
        
        // Debug functions
        getMode: function() {
            return useFirebase ? 'firebase' : 'guest';
        },
        
        isInitialized: function() {
            return isInitialized;
        },
        
        // Legacy compatibility (deprecated but kept for existing code)
        addCartButton: function() {
            console.warn('addCartButton is deprecated. Cart button is added automatically.');
            return addCartButton();
        }
    };
})();
