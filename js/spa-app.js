// SPA Router and Core Functionality
class SPARouter {
    constructor() {
        this.routes = {
            home: '#home',
            products: '#products',
            about: '#about',
            contact: '#contact',
            cart: '#cart',
            login: '#login',
            register: '#register',
            profile: '#profile',
            productDetail: '#product-detail'
        };
        
        this.activeSection = null;
        this.init();
    }

    init() {
        // Handle initial route
        this.handleRoute();

        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleRoute());

        // Add navigation event listeners
        this.setupNavigationListeners();
    }    setupNavigationListeners() {
        const navLinks = document.querySelectorAll('a[href^="#"]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const hash = link.getAttribute('href');
                // Only update if it's a different section
                if (window.location.hash !== hash) {
                    window.location.hash = hash;
                }
            });
        });
    }    async handleRoute() {
        // Get current hash or default to home
        const hash = window.location.hash || '#home';
        const sections = document.querySelectorAll('.page-section');
        
        // Hide all sections with transition
        sections.forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            setTimeout(() => {
                section.style.display = 'none';
                section.classList.remove('active');
            }, 300);
        });        // Show active section with transition
        const activeSection = document.querySelector(`[data-route="${hash}"]`);
        if (activeSection) {
            // First make it visible but transparent
            activeSection.style.display = 'block';
            activeSection.style.opacity = '0';
            activeSection.style.transform = 'translateY(20px)';
            
            // Force a reflow
            activeSection.offsetHeight;
            
            // Then fade it in
            setTimeout(() => {
                activeSection.style.opacity = '1';
                activeSection.style.transform = 'translateY(0)';
                activeSection.classList.add('active');
            }, 10);
            
            this.activeSection = hash;
            this.updateActiveNavLink();
        }

        // Handle special routes
        if (hash === '#cart') {
            CartManager.updateCartDisplay();
        } else if (hash.startsWith('#product-detail')) {
            const productId = hash.split('=')[1];
            if (productId) {
                await ProductManager.loadProductDetail(productId);
            }
        }
    }

    updateActiveNavLink() {
        // Remove active class from all links
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
        });

        // Add active class to current route's link
        const activeLink = document.querySelector(`.nav-links a[href="${this.activeSection}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    navigateTo(route) {
        window.location.hash = route;
    }
}

// Cart Manager
class CartManager {
    static cart = [];

    static init() {
        // Load cart from localStorage
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

    static addToCart(product, quantity = 1) {
        const existingItem = this.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({ ...product, quantity });
        }

        this.saveCart();
        this.showNotification('Product added to cart!', 'success');
        this.updateCartDisplay();
    }

    static removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartDisplay();
    }

    static updateQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity = Math.max(1, quantity);
            this.saveCart();
            this.updateCartDisplay();
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
        const cartSection = document.querySelector('#cart-items');
        if (!cartSection) return;

        if (this.cart.length === 0) {
            cartSection.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                    <a href="#products" class="btn">Continue Shopping</a>
                </div>
            `;
            return;
        }

        let html = `
            <div class="cart-header">
                <span>Product</span>
                <span>Price</span>
                <span>Quantity</span>
                <span>Total</span>
                <span></span>
            </div>
        `;

        this.cart.forEach(item => {
            html += `
                <div class="cart-item" data-id="${item.id}">
                    <div class="item-image">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="item-details">
                        <h3>${item.name}</h3>
                    </div>
                    <div class="item-price">₹${item.price}</div>
                    <div class="item-quantity">
                        <button class="quantity-btn minus">-</button>
                        <input type="text" class="quantity-input" value="${item.quantity}" readonly>
                        <button class="quantity-btn plus">+</button>
                    </div>
                    <div class="item-total">₹${item.price * item.quantity}</div>
                    <button class="remove-btn" onclick="CartManager.removeFromCart('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });

        // Add cart summary
        html += `
            <div class="cart-summary">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>₹${this.getTotal()}</span>
                </div>
                <div class="summary-row">
                    <span>Shipping:</span>
                    <span>Free</span>
                </div>
                <div class="summary-row">
                    <span>Total:</span>
                    <span>₹${this.getTotal()}</span>
                </div>
                <button class="btn checkout-btn" onclick="CartManager.checkout()">Proceed to Checkout</button>
            </div>
        `;

        cartSection.innerHTML = html;
    }

    static setupCartListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.quantity-btn')) {
                const btn = e.target.closest('.quantity-btn');
                const cartItem = btn.closest('.cart-item');
                const productId = cartItem.dataset.id;
                const currentQty = parseInt(cartItem.querySelector('.quantity-input').value);
                
                if (btn.classList.contains('plus')) {
                    this.updateQuantity(productId, currentQty + 1);
                } else if (btn.classList.contains('minus') && currentQty > 1) {
                    this.updateQuantity(productId, currentQty - 1);
                }
            }
        });
    }

    static checkout() {
        if (!AuthManager.isLoggedIn()) {
            this.showNotification('Please log in to checkout', 'error');
            window.location.hash = '#login';
            return;
        }
        // Implement checkout logic
        this.showNotification('Checkout functionality coming soon!', 'info');
    }

    static showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="notification-icon fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span class="notification-message">${message}</span>
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Authentication Manager
class AuthManager {
    static user = null;

    static init() {
        this.checkAuth();
        this.setupAuthListeners();
    }

    static checkAuth() {
        const userData = localStorage.getItem('user');
        if (userData) {
            this.user = JSON.parse(userData);
            this.updateAuthUI();
        }
    }

    static updateAuthUI() {
        const authNav = document.getElementById('auth-nav');
        const userNav = document.getElementById('user-nav');
        const userName = document.getElementById('user-name');

        if (this.user) {
            authNav.style.display = 'none';
            userNav.style.display = 'flex';
            userName.textContent = this.user.name;
        } else {
            authNav.style.display = 'flex';
            userNav.style.display = 'none';
        }
    }

    static login(email, password) {
        // For demo, using test@test.com/test
        if (email === 'test@test.com' && password === 'test') {
            this.user = {
                name: 'Test User',
                email: email
            };
            localStorage.setItem('user', JSON.stringify(this.user));
            this.updateAuthUI();
            CartManager.showNotification('Login successful!', 'success');
            window.location.hash = '#products';
            return true;
        }
        CartManager.showNotification('Invalid credentials', 'error');
        return false;
    }

    static logout() {
        this.user = null;
        localStorage.removeItem('user');
        this.updateAuthUI();
        window.location.hash = '#home';
        CartManager.showNotification('Logged out successfully', 'success');
    }

    static isLoggedIn() {
        return !!this.user;
    }

    static setupAuthListeners() {
        document.addEventListener('submit', (e) => {
            if (e.target.matches('#login-form')) {
                e.preventDefault();
                const email = e.target.email.value;
                const password = e.target.password.value;
                this.login(email, password);
            }
        });

        // Logout button listener
        document.addEventListener('click', (e) => {
            if (e.target.matches('#logout-btn')) {
                e.preventDefault();
                this.logout();
            }
        });
    }
}

// Initialize SPA
document.addEventListener('DOMContentLoaded', () => {
    window.router = new SPARouter();
    CartManager.init();
    AuthManager.init();
});
