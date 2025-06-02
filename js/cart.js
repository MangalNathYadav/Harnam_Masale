// Cart Manager
class CartManager {
    static cart = [];

    static init() {
        this.loadCart();
        this.setupCartListeners();
        this.updateCartCount();
    }

    static loadCart() {
        const savedCart = localStorage.getItem('cart');
        this.cart = savedCart ? JSON.parse(savedCart) : [];
    }

    static saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
        this.updateCartCount();
    }

    static addToCart(productId, quantity = 1) {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const existingItem = this.cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({ ...product, quantity });
        }

        this.saveCart();
        this.showNotification('Product added to cart');
        this.updateCartDisplay();
    }

    static removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartDisplay();
    }

    static updateQuantity(productId, change) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity = Math.max(1, item.quantity + change);
            if (item.quantity === 0) {
                this.removeFromCart(productId);
            } else {
                this.saveCart();
                this.updateCartDisplay();
            }
        }
    }

    static getTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    static updateCartCount() {
        const count = this.cart.reduce((total, item) => total + item.quantity, 0);
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = count;
            cartCount.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    static updateCartDisplay() {
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');

        if (!cartItems || !cartTotal) return;

        if (this.cart.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        } else {
            cartItems.innerHTML = this.cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>₹${item.price} × ${item.quantity}</p>
                    </div>
                    <div class="cart-item-controls">
                        <button onclick="CartManager.updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="CartManager.updateQuantity(${item.id}, 1)">+</button>
                    </div>
                    <button class="remove-item" onclick="CartManager.removeFromCart(${item.id})">×</button>
                </div>
            `).join('');
        }

        // Update total
        cartTotal.textContent = `₹${this.getTotal()}`;
    }

    static setupCartListeners() {
        // Cart Modal
        const cartButton = document.querySelector('.cart-button');
        const cartModal = document.getElementById('cart-modal');
        const closeModal = document.querySelector('.close-modal');

        if (cartButton && cartModal) {
            cartButton.addEventListener('click', () => {
                cartModal.style.display = 'block';
                this.updateCartDisplay();
            });
        }

        if (closeModal && cartModal) {
            closeModal.addEventListener('click', () => {
                cartModal.style.display = 'none';
            });

            window.addEventListener('click', (e) => {
                if (e.target === cartModal) {
                    cartModal.style.display = 'none';
                }
            });
        }

        // Checkout button
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                this.checkout();
            });
        }
    }

    static checkout() {
        // For now just show notification
        this.showNotification('Checkout functionality coming soon!');
    }

    static showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = message;

        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}
