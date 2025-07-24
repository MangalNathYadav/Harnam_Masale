// Mobile Cart Module
const MobileCart = {
    cart: [],
    listeners: [],

    // Initialize cart
    async initialize() {
        this.loadCartFromStorage();
        this.setupEventListeners();
        await this.syncWithFirebase();
        this.updateUI();
    },

    // Load cart from local storage
    loadCartFromStorage() {
        try {
            this.cart = JSON.parse(localStorage.getItem('cart') || '[]');
        } catch (error) {
            console.error('Error loading cart:', error);
            this.cart = [];
        }
    },

    // Save cart to local storage
    saveCartToStorage() {
        try {
            localStorage.setItem('cart', JSON.stringify(this.cart));
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    },

    // Sync with Firebase
    async syncWithFirebase() {
        try {
            const user = firebase.auth().currentUser;
            if (!user) return;

            // Get cart from Firebase
            const snapshot = await firebase.database().ref(`users/${user.uid}/cart`).once('value');
            const firebaseCart = snapshot.val() || [];

            // Convert to array if needed
            const normalizedFirebaseCart = Array.isArray(firebaseCart) ? firebaseCart : Object.values(firebaseCart);
            
            // Merge with local cart
            this.cart = this.mergeCart(this.cart, normalizedFirebaseCart);
            
            // Save merged cart back to both storages
            await this.saveToFirebase(this.cart);
            this.saveCartToStorage();
            
            return this.cart;
        } catch (error) {
            console.error('Error syncing cart:', error);
            throw error;
        }
    },

    // Add new method for Firebase save
    async saveToFirebase(cart) {
        const user = firebase.auth().currentUser;
        if (!user) return;

        try {
            await firebase.database().ref(`users/${user.uid}/cart`).set(cart);
        } catch (error) {
            console.error('Error saving to Firebase:', error);
            throw error;
        }
    },

    // Merge two cart arrays
    mergeCart(localCart, firebaseCart) {
        const mergedCart = [...localCart];
        
        firebaseCart.forEach(firebaseItem => {
            const existingItem = mergedCart.find(item => item.id === firebaseItem.id);
            if (existingItem) {
                existingItem.quantity = Math.max(existingItem.quantity, firebaseItem.quantity);
            } else {
                mergedCart.push(firebaseItem);
            }
        });

        return mergedCart;
    },

    // Add item to cart
    async addItem(product, quantity = 1) {
        if (!product || !product.id) {
            console.error('Invalid product:', product);
            return;
        }

        try {
            const existingItem = this.cart.find(item => item.id === product.id);
            
            if (existingItem) {
                existingItem.quantity = (parseInt(existingItem.quantity) || 0) + quantity;
            } else {
                this.cart.push({
                    id: product.id,
                    name: product.name,
                    price: parseFloat(product.price) || 0,
                    image: product.imageBase64 || product.image || '../assets/images/placeholder.png',
                    quantity: quantity
                });
            }

            await this.saveToFirebase(this.cart);
            this.saveCartToStorage();
            this.updateUI();
            this.notifyListeners();
            
            return true;
        } catch (error) {
            console.error('Error adding item:', error);
            throw error;
        }
    },

    // Update item quantity
    async updateQuantity(productId, quantity) {
        try {
            const itemIndex = this.cart.findIndex(item => item.id === productId);
            if (itemIndex === -1) return;

            const newQuantity = parseInt(quantity);
            if (isNaN(newQuantity) || newQuantity < 0) {
                throw new Error('Invalid quantity');
            }

            if (newQuantity === 0) {
                this.cart.splice(itemIndex, 1);
            } else {
                this.cart[itemIndex].quantity = newQuantity;
            }

            await this.saveToFirebase(this.cart);
            this.saveCartToStorage();
            this.updateUI();
            this.notifyListeners();
            
            return true;
        } catch (error) {
            console.error('Error updating quantity:', error);
            throw error;
        }
    },

    // Remove item from cart
    async removeItem(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCartToStorage();
        await this.syncWithFirebase();
        this.updateUI();
        this.notifyListeners();
    },

    // Clear cart
    async clearCart() {
        this.cart = [];
        this.saveCartToStorage();
        await this.syncWithFirebase();
        this.updateUI();
        this.notifyListeners();
    },

    // Get cart total
    getTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    // Get cart count
    getCount() {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
    },

    // Update UI elements
    updateUI() {
        // Update cart count badges
        const count = this.getCount();
        document.querySelectorAll('.cart-count-nav').forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'flex' : 'none';
        });

        // Update cart modal if it's open
        this.updateCartModal();
    },

    // Update cart modal contents
    updateCartModal() {
        const cartModal = document.getElementById('cart-modal');
        if (!cartModal) return;

        const cartItems = cartModal.querySelector('.cart-items');
        const emptyCart = cartModal.querySelector('.empty-cart');
        const cartSummary = cartModal.querySelector('.cart-summary');
        const totalAmount = cartModal.querySelector('.total-amount');

        if (this.cart.length === 0) {
            if (cartItems) cartItems.innerHTML = '';
            if (emptyCart) emptyCart.style.display = 'flex';
            if (cartSummary) cartSummary.style.display = 'none';
            return;
        }

        if (emptyCart) emptyCart.style.display = 'none';
        if (cartSummary) cartSummary.style.display = 'flex';
        if (totalAmount) totalAmount.textContent = `₹${this.getTotal().toLocaleString('en-IN')}`;

        if (cartItems) {
            cartItems.innerHTML = this.cart.map(item => `
                <div class="cart-item" data-product-id="${item.id}">
                    <img src="${item.image || '../assets/images/placeholder.png'}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h3 class="cart-item-name">${item.name}</h3>
                        <div class="cart-item-price">₹${(item.price * item.quantity).toLocaleString('en-IN')}</div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn minus">-</button>
                            <input type="number" value="${item.quantity}" min="1" max="99" class="quantity-input">
                            <button class="quantity-btn plus">+</button>
                        </div>
                    </div>
                    <button class="remove-item-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');

            // Add event listeners to cart items
            this.setupCartItemEvents();
        }
    },

    // Setup cart item event listeners
    setupCartItemEvents() {
        const cartItems = document.querySelectorAll('.cart-item');
        
        cartItems.forEach(item => {
            const productId = item.getAttribute('data-product-id');
            const quantityInput = item.querySelector('.quantity-input');
            const minusBtn = item.querySelector('.minus');
            const plusBtn = item.querySelector('.plus');
            const removeBtn = item.querySelector('.remove-item-btn');

            if (quantityInput) {
                quantityInput.addEventListener('change', () => {
                    const quantity = parseInt(quantityInput.value) || 1;
                    this.updateQuantity(productId, quantity);
                });
            }

            if (minusBtn) {
                minusBtn.addEventListener('click', () => {
                    const currentQty = parseInt(quantityInput.value) || 1;
                    if (currentQty > 1) {
                        this.updateQuantity(productId, currentQty - 1);
                    }
                });
            }

            if (plusBtn) {
                plusBtn.addEventListener('click', () => {
                    const currentQty = parseInt(quantityInput.value) || 1;
                    this.updateQuantity(productId, currentQty + 1);
                });
            }

            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    this.removeItem(productId);
                });
            }
        });
    },

    // Setup general event listeners
    setupEventListeners() {
        // Listen for cart button clicks
        document.querySelectorAll('.cart-btn').forEach(btn => {
            btn.addEventListener('click', () => this.openCartModal());
        });

        // Listen for checkout button clicks
        document.querySelectorAll('.checkout-btn').forEach(btn => {
            btn.addEventListener('click', () => this.proceedToCheckout());
        });

        // Listen for Firebase auth state changes
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                this.syncWithFirebase();
            }
        });

        // Listen for storage changes from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'cart') {
                this.loadCartFromStorage();
                this.updateUI();
            }
        });
    },

    // Open cart modal
    openCartModal() {
        const cartModal = document.getElementById('cart-modal');
        if (cartModal) {
            cartModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            this.updateCartModal();
        }
    },

    // Close cart modal
    closeCartModal() {
        const cartModal = document.getElementById('cart-modal');
        if (cartModal) {
            cartModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    },

    // Proceed to checkout
    proceedToCheckout() {
        if (this.cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        // Check if user is logged in
        const user = firebase.auth().currentUser;
        if (!user) {
            // Show auth modal
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                authModal.style.display = 'flex';
                document.body.classList.add('modal-open');
            } else {
                window.location.href = 'login.html?redirect=checkout';
            }
            return;
        }

        // Proceed to checkout page
        window.location.href = 'checkout.html';
    },

    // Add change listener
    addChangeListener(callback) {
        this.listeners.push(callback);
    },

    // Remove change listener
    removeChangeListener(callback) {
        this.listeners = this.listeners.filter(listener => listener !== callback);
    },

    // Notify all listeners of changes
    notifyListeners() {
        this.listeners.forEach(listener => listener(this.cart));
    }
};

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    MobileCart.initialize();

    // Set up close modal functionality
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            MobileCart.closeCartModal();
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        const cartModal = document.getElementById('cart-modal');
        if (e.target === cartModal) {
            MobileCart.closeCartModal();
        }
    });
});

// Export cart module globally
window.MobileCart = MobileCart;
