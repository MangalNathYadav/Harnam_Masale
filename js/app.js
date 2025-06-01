// Single Page Application functionality
const app = {
    pages: {},
    init: function() {
        // Initialize pages
        this.pages = {
            home: document.getElementById('home-section'),
            products: document.getElementById('products-section'),
            about: document.getElementById('about-section'),
            contact: document.getElementById('contact-section'),
            cart: document.getElementById('cart-section'),
            login: document.getElementById('login-section'),
            profile: document.getElementById('profile-section'),
            checkout: document.getElementById('checkout-section')
        };

        // Set up navigation
        this.setupNavigation();
        
        // Initialize theme toggle
        this.setupThemeToggle();
        
        // Initialize mobile menu
        this.setupMobileMenu();
        
        // Initialize product display
        this.setupProducts();
        
        // Initialize cart system
        this.setupCart();
        
        // Initialize auth system
        this.setupAuth();
        
        // Show home page by default
        this.showPage('home');
    },
    
    setupNavigation: function() {
        const navLinks = document.querySelectorAll('.nav-links a, .nav-btn');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Get page id from href attribute
                const pageId = link.getAttribute('href').replace('#', '');
                
                // Show the page
                this.showPage(pageId);
                
                // Highlight active link
                this.setActiveNavLink(pageId);
                
                // Close mobile menu if open
                const mobileMenu = document.querySelector('.mobile-menu');
                const navLinks = document.querySelector('.nav-links');
                if (navLinks.classList.contains('active')) {
                    mobileMenu.classList.remove('active');
                    navLinks.classList.remove('active');
                }
            });
        });
    },
    
    showPage: function(pageId) {
        // Hide all pages
        Object.values(this.pages).forEach(page => {
            if (page) page.classList.remove('active');
        });
        
        // Show requested page
        if (this.pages[pageId]) {
            this.pages[pageId].classList.add('active');
            window.scrollTo(0, 0);
        }
        
        // Update URL hash without triggering page reload
        history.pushState(null, null, `#${pageId}`);
    },
    
    setActiveNavLink: function(pageId) {
        const navLinks = document.querySelectorAll('.nav-links a');
        
        navLinks.forEach(link => {
            const linkPageId = link.getAttribute('href').replace('#', '');
            if (linkPageId === pageId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },
    
    setupThemeToggle: function() {
        const themeToggle = document.querySelector('.theme-toggle');
        const body = document.body;
        const storedTheme = localStorage.getItem('theme');
        
        // Set initial theme based on localStorage or system preference
        if (storedTheme === 'light') {
            body.classList.add('light-theme');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        } else if (storedTheme === 'dark') {
            body.classList.remove('light-theme');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            // Check system preference if no stored theme
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                body.classList.remove('light-theme');
                themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
                localStorage.setItem('theme', 'dark');
            } else {
                body.classList.add('light-theme');
                themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
                localStorage.setItem('theme', 'light');
            }
        }
        
        themeToggle.addEventListener('click', () => {
            if (body.classList.contains('light-theme')) {
                body.classList.remove('light-theme');
                themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
                localStorage.setItem('theme', 'dark');
            } else {
                body.classList.add('light-theme');
                themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
                localStorage.setItem('theme', 'light');
            }
        });
    },
    
    setupMobileMenu: function() {
        const mobileMenu = document.querySelector('.mobile-menu');
        const navLinks = document.querySelector('.nav-links');
        
        mobileMenu.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    },
    
    // Product section functionality
    setupProducts: function() {
        // Product data (in a real app, this would come from an API or database)
        const products = [
            {
                id: 1,
                name: 'Garam Masala',
                description: 'A blend of ground spices used in Indian cuisine. Adds warmth and depth to dishes.',
                price: 250,
                image: 'assets/images/garam.jpeg',
                badge: 'Popular'
            },
            {
                id: 2,
                name: 'Chola Masala',
                description: 'Perfect spice blend for delicious chickpea curry. Brings authentic flavor to your chola dish.',
                price: 180,
                image: 'assets/images/chola.jpeg',
                badge: 'New'
            },
            {
                id: 3,
                name: 'Sabji Masala',
                description: 'Essential mix for vegetable dishes. Enhances the flavor of any vegetable preparation.',
                price: 200,
                image: 'assets/images/sabji.jpeg',
                badge: ''
            },
            {
                id: 4,
                name: 'Chicken Masala',
                description: 'Perfect blend for chicken dishes. Creates rich and aromatic flavors.',
                price: 220,
                image: 'assets/images/chiken.jpeg',
                badge: 'Best Seller'
            },
            {
                id: 5,
                name: 'Meat Masala',
                description: 'Special blend for meat dishes. Enhances the taste of all meat preparations.',
                price: 230,
                image: 'assets/images/meat.jpeg',
                badge: ''
            },
            {
                id: 6,
                name: 'Paneer Masala',
                description: 'Specially crafted for paneer dishes. Brings restaurant quality taste to your kitchen.',
                price: 210,
                image: 'assets/images/paneer.jpeg',
                badge: 'New'
            }
        ];

        // Render products
        this.renderProducts(products);
        
        // Initialize 3D view for products
        this.setup3DProductView();
    },
    
    renderProducts: function(products) {
        const productGrid = document.querySelector('#products-section .product-grid');
        if (!productGrid) return;
        
        // Clear existing products
        productGrid.innerHTML = '';
        
        // Add products to grid
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.dataset.productId = product.id;
            
            // Create product HTML
            productCard.innerHTML = `
                ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                <div class="product-circle product-3d-container" data-tilt data-product-id="${product.id}">
                    <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <div class="price">₹${product.price}</div>
                    <div class="product-actions">
                        <button class="add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
                        <button class="buy-now-btn" data-product-id="${product.id}">Buy Now</button>
                    </div>
                </div>
            `;
            
            productGrid.appendChild(productCard);
        });
        
        // Add event listeners to buttons
        this.setupProductButtons();
    },
    
    setup3DProductView: function() {
        // Load VanillaTilt.js library dynamically
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/vanilla-tilt@1.7.0/dist/vanilla-tilt.min.js';
        script.onload = () => {
            // Initialize 3D effect on product images
            VanillaTilt.init(document.querySelectorAll('.product-3d-container'), {
                max: 25,
                speed: 400,
                glare: true,
                'max-glare': 0.5,
                scale: 1.05
            });
        };
        document.head.appendChild(script);
    },
    
    setupProductButtons: function() {
        // Add to cart buttons
        const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
        addToCartButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.dataset.productId;
                this.addToCart(productId);
                
                // Show notification
                this.showNotification('Product added to cart!');
            });
        });
        
        // Buy now buttons
        const buyNowButtons = document.querySelectorAll('.buy-now-btn');
        buyNowButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.dataset.productId;
                this.addToCart(productId);
                
                // Navigate to checkout
                this.showPage('checkout');
            });
        });
    },
    
    // Cart functionality
    setupCart: function() {
        // Initialize cart from localStorage or empty
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        // Update cart count
        this.updateCartCount();
        
        // Setup cart view events
        const viewCartBtn = document.getElementById('view-cart-btn');
        if (viewCartBtn) {
            viewCartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPage('cart');
            });
        }
        
        // Render cart contents
        this.renderCart();
        
        // Setup checkout button
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                if (this.cart.length > 0) {
                    this.showPage('checkout');
                } else {
                    this.showNotification('Your cart is empty!', 'error');
                }
            });
        }
    },
    
    addToCart: function(productId) {
        // Find product with matching id
        const productId_int = parseInt(productId);
        const existingItem = this.cart.find(item => item.id === productId_int);
        
        if (existingItem) {
            // Increment quantity if product already in cart
            existingItem.quantity++;
        } else {
            // Add new product to cart
            // In a real app, you'd fetch full product details here
            const products = [
                {id: 1, name: 'Garam Masala', price: 250, image: 'assets/images/garam.jpeg'},
                {id: 2, name: 'Chola Masala', price: 180, image: 'assets/images/chola.jpeg'},
                {id: 3, name: 'Sabji Masala', price: 200, image: 'assets/images/sabji.jpeg'},
                {id: 4, name: 'Chicken Masala', price: 220, image: 'assets/images/chiken.jpeg'},
                {id: 5, name: 'Meat Masala', price: 230, image: 'assets/images/meat.jpeg'},
                {id: 6, name: 'Paneer Masala', price: 210, image: 'assets/images/paneer.jpeg'}
            ];
            
            const product = products.find(p => p.id === productId_int);
            if (product) {
                this.cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: 1
                });
            }
        }
        
        // Save cart to localStorage
        localStorage.setItem('cart', JSON.stringify(this.cart));
        
        // Update cart count
        this.updateCartCount();
        
        // Re-render cart if on cart page
        if (this.pages.cart.classList.contains('active')) {
            this.renderCart();
        }
    },
    
    removeFromCart: function(productId) {
        // Remove product from cart
        this.cart = this.cart.filter(item => item.id !== parseInt(productId));
        
        // Save cart to localStorage
        localStorage.setItem('cart', JSON.stringify(this.cart));
        
        // Update cart count
        this.updateCartCount();
        
        // Re-render cart
        this.renderCart();
    },
    
    updateCartQuantity: function(productId, quantity) {
        // Find product in cart
        const item = this.cart.find(item => item.id === parseInt(productId));
        
        if (item) {
            // Update quantity
            item.quantity = parseInt(quantity);
            
            // Remove if quantity is 0
            if (item.quantity <= 0) {
                this.removeFromCart(productId);
                return;
            }
            
            // Save cart to localStorage
            localStorage.setItem('cart', JSON.stringify(this.cart));
            
            // Update cart count
            this.updateCartCount();
            
            // Re-render cart
            this.renderCart();
        }
    },
    
    updateCartCount: function() {
        // Calculate total quantity
        const totalQuantity = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        // Update cart count display
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            cartCount.textContent = totalQuantity;
            cartCount.style.display = totalQuantity > 0 ? 'flex' : 'none';
        }
    },
    
    renderCart: function() {
        const cartItemsContainer = document.getElementById('cart-items');
        if (!cartItemsContainer) return;
        
        if (this.cart.length === 0) {
            // Show empty cart message
            cartItemsContainer.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-basket"></i><p>Your cart is empty</p><a href="#products" class="btn">Shop Now</a></div>';
            
            // Hide cart summary
            const cartSummary = document.getElementById('cart-summary');
            if (cartSummary) cartSummary.style.display = 'none';
            return;
        }
        
        // Show cart summary
        const cartSummary = document.getElementById('cart-summary');
        if (cartSummary) cartSummary.style.display = 'block';
        
        // Clear existing items
        cartItemsContainer.innerHTML = '';
        
        // Add cart items
        this.cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            
            cartItem.innerHTML = `
                <div class="item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="item-details">
                    <h3>${item.name}</h3>
                    <div class="item-price">₹${item.price}</div>
                </div>
                <div class="item-quantity">
                    <button class="quantity-btn decrease" data-product-id="${item.id}">-</button>
                    <input type="number" value="${item.quantity}" min="1" data-product-id="${item.id}" class="quantity-input">
                    <button class="quantity-btn increase" data-product-id="${item.id}">+</button>
                </div>
                <div class="item-total">
                    ₹${item.price * item.quantity}
                </div>
                <button class="remove-btn" data-product-id="${item.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
            
            cartItemsContainer.appendChild(cartItem);
        });
        
        // Add event listeners to cart buttons
        this.setupCartButtons();
        
        // Update cart summary
        this.updateCartSummary();
    },
    
    setupCartButtons: function() {
        // Remove buttons
        const removeButtons = document.querySelectorAll('.remove-btn');
        removeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.closest('.remove-btn').dataset.productId;
                this.removeFromCart(productId);
            });
        });
        
        // Decrease quantity buttons
        const decreaseButtons = document.querySelectorAll('.quantity-btn.decrease');
        decreaseButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.dataset.productId;
                const item = this.cart.find(item => item.id === parseInt(productId));
                if (item && item.quantity > 1) {
                    this.updateCartQuantity(productId, item.quantity - 1);
                } else if (item) {
                    this.removeFromCart(productId);
                }
            });
        });
        
        // Increase quantity buttons
        const increaseButtons = document.querySelectorAll('.quantity-btn.increase');
        increaseButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.dataset.productId;
                const item = this.cart.find(item => item.id === parseInt(productId));
                if (item) {
                    this.updateCartQuantity(productId, item.quantity + 1);
                }
            });
        });
        
        // Quantity inputs
        const quantityInputs = document.querySelectorAll('.quantity-input');
        quantityInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const productId = e.target.dataset.productId;
                const quantity = parseInt(e.target.value);
                if (quantity > 0) {
                    this.updateCartQuantity(productId, quantity);
                } else {
                    this.removeFromCart(productId);
                }
            });
        });
    },
    
    updateCartSummary: function() {
        const subtotalElement = document.getElementById('cart-subtotal');
        const totalElement = document.getElementById('cart-total');
        
        if (!subtotalElement || !totalElement) return;
        
        // Calculate subtotal
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Set delivery cost (could be dynamic based on address, etc.)
        const deliveryCost = subtotal > 0 ? 50 : 0;
        
        // Calculate total
        const total = subtotal + deliveryCost;
        
        // Update summary display
        subtotalElement.textContent = `₹${subtotal}`;
        document.getElementById('cart-delivery').textContent = `₹${deliveryCost}`;
        totalElement.textContent = `₹${total}`;
    },
    
    // Checkout functionality
    processCheckout: function() {
        // In a real app, this would send the order to a backend
        // Here we'll just simulate success
        
        // Show loading indicator
        const checkoutBtn = document.getElementById('place-order-btn');
        if (checkoutBtn) {
            const originalText = checkoutBtn.textContent;
            checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            checkoutBtn.disabled = true;
            
            // Simulate API call
            setTimeout(() => {
                // Order number for tracking
                const orderNumber = 'ORD' + Date.now().toString().slice(-6);
                
                // Clear cart
                this.cart = [];
                localStorage.setItem('cart', JSON.stringify(this.cart));
                this.updateCartCount();
                
                // Show success message
                const checkoutContent = document.querySelector('#checkout-section .checkout-content');
                if (checkoutContent) {
                    checkoutContent.innerHTML = `
                        <div class="checkout-success">
                            <i class="fas fa-check-circle"></i>
                            <h2>Order Placed Successfully!</h2>
                            <p>Your order number is: <strong>${orderNumber}</strong></p>
                            <p>You will receive an email confirmation shortly.</p>
                            <a href="#home" class="btn">Back to Home</a>
                        </div>
                    `;
                }
                
                // Add order to user's orders if logged in
                const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                if (currentUser) {
                    const users = JSON.parse(localStorage.getItem('users')) || [];
                    const userIndex = users.findIndex(user => user.email === currentUser.email);
                    
                    if (userIndex !== -1) {
                        users[userIndex].orders = users[userIndex].orders || [];
                        users[userIndex].orders.push({
                            id: orderNumber,
                            date: new Date().toISOString(),
                            total: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 50,
                            status: 'Processing',
                            items: this.cart
                        });
                        
                        localStorage.setItem('users', JSON.stringify(users));
                        localStorage.setItem('currentUser', JSON.stringify(users[userIndex]));
                    }
                }
            }, 2000);
        }
    },
    
    // Authentication functionality
    setupAuth: function() {
        // Create test user if not exists
        const users = JSON.parse(localStorage.getItem('users')) || [];
        if (!users.some(user => user.email === 'test@test.com')) {
            users.push({
                name: 'Test User',
                email: 'test@test.com',
                password: 'test', // In a real app, this would be hashed
                orders: []
            });
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        // Check if user is already logged in
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            this.updateAuthUI(true, currentUser);
        }
        
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                
                this.login(email, password);
            });
        }
        
        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const name = document.getElementById('register-name').value;
                const email = document.getElementById('register-email').value;
                const password = document.getElementById('register-password').value;
                
                this.register(name, email, password);
            });
        }
        
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
        
        // Switch between login and register forms
        const switchToRegister = document.getElementById('switch-to-register');
        const switchToLogin = document.getElementById('switch-to-login');
        
        if (switchToRegister) {
            switchToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('login-container').classList.remove('active');
                document.getElementById('register-container').classList.add('active');
            });
        }
        
        if (switchToLogin) {
            switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('register-container').classList.remove('active');
                document.getElementById('login-container').classList.add('active');
            });
        }
    },
    
    login: function(email, password) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(user => user.email === email && user.password === password);
        
        if (user) {
            // Set current user in localStorage
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // Update UI
            this.updateAuthUI(true, user);
            
            // Show profile page
            this.showPage('profile');
            
            // Show success message
            this.showNotification('Login successful!');
        } else {
            // Show error message
            this.showNotification('Invalid email or password!', 'error');
        }
    },
    
    register: function(name, email, password) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        // Check if email already exists
        if (users.some(user => user.email === email)) {
            this.showNotification('Email already in use!', 'error');
            return;
        }
        
        // Create new user
        const newUser = {
            name,
            email,
            password, // In a real app, this would be hashed
            orders: []
        };
        
        // Add to users array
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Set as current user
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        
        // Update UI
        this.updateAuthUI(true, newUser);
        
        // Show profile page
        this.showPage('profile');
        
        // Show success message
        this.showNotification('Registration successful!');
    },
    
    logout: function() {
        // Remove current user from localStorage
        localStorage.removeItem('currentUser');
        
        // Update UI
        this.updateAuthUI(false);
        
        // Show home page
        this.showPage('home');
        
        // Show success message
        this.showNotification('Logged out successfully!');
    },
    
    updateAuthUI: function(isLoggedIn, user = null) {
        const authNav = document.getElementById('auth-nav');
        const userNav = document.getElementById('user-nav');
        
        if (isLoggedIn && user) {
            // Show user info
            if (authNav) authNav.style.display = 'none';
            if (userNav) {
                userNav.style.display = 'flex';
                const userNameElement = document.getElementById('user-name');
                if (userNameElement) userNameElement.textContent = user.name;
            }
            
            // Update profile page
            const profileName = document.getElementById('profile-name');
            const profileEmail = document.getElementById('profile-email');
            
            if (profileName) profileName.textContent = user.name;
            if (profileEmail) profileEmail.textContent = user.email;
            
            // Render orders
            this.renderOrders(user.orders || []);
        } else {
            // Show login/register links
            if (authNav) authNav.style.display = 'flex';
            if (userNav) userNav.style.display = 'none';
        }
    },
    
    renderOrders: function(orders) {
        const ordersContainer = document.getElementById('user-orders');
        if (!ordersContainer) return;
        
        if (orders.length === 0) {
            ordersContainer.innerHTML = '<p class="no-orders">You have no orders yet.</p>';
            return;
        }
        
        ordersContainer.innerHTML = '';
        
        // Sort orders by date (newest first)
        orders.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        orders.forEach(order => {
            const orderElement = document.createElement('div');
            orderElement.className = 'order-item';
            
            // Format date
            const orderDate = new Date(order.date);
            const formattedDate = orderDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // Create status badge
            let statusClass = '';
            switch (order.status.toLowerCase()) {
                case 'processing':
                    statusClass = 'status-processing';
                    break;
                case 'shipped':
                    statusClass = 'status-shipped';
                    break;
                case 'delivered':
                    statusClass = 'status-delivered';
                    break;
                default:
                    statusClass = 'status-processing';
            }
            
            orderElement.innerHTML = `
                <div class="order-header">
                    <div>
                        <h3>Order #${order.id}</h3>
                        <span class="order-date">${formattedDate}</span>
                    </div>
                    <div>
                        <span class="order-status ${statusClass}">${order.status}</span>
                        <span class="order-amount">₹${order.total}</span>
                    </div>
                </div>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item-detail">
                            <img src="${item.image}" alt="${item.name}" class="order-item-image">
                            <div class="order-item-info">
                                <p>${item.name} × ${item.quantity}</p>
                                <p class="order-item-price">₹${item.price * item.quantity}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            ordersContainer.appendChild(orderElement);
        });
    },
    
    // Utility function for showing notifications
    showNotification: function(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            </div>
            <div class="notification-message">${message}</div>
        `;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Show notification with animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Initialize application
    app.init();
    
    // Handle browser navigation
    window.addEventListener('hashchange', () => {
        const pageId = window.location.hash.replace('#', '') || 'home';
        app.showPage(pageId);
    });
    
    // Load page based on hash if present
    if (window.location.hash) {
        const pageId = window.location.hash.replace('#', '');
        app.showPage(pageId);
    }
});

// Equal heights for product cards
function equalizeProductCardHeights() {
    const productCards = document.querySelectorAll('.product-card');
    if (productCards.length === 0) return;

    // Reset heights first
    productCards.forEach(card => {
        const infoSection = card.querySelector('.product-info');
        if (infoSection) {
            infoSection.style.minHeight = 'auto';
        }
    });

    // Only equalize on larger screens
    if (window.innerWidth > 768) {
        // Find max height
        let maxInfoHeight = 0;
        productCards.forEach(card => {
            const infoSection = card.querySelector('.product-info');
            if (infoSection && infoSection.offsetHeight > maxInfoHeight) {
                maxInfoHeight = infoSection.offsetHeight;
            }
        });

        // Apply max height to all
        if (maxInfoHeight > 0) {
            productCards.forEach(card => {
                const infoSection = card.querySelector('.product-info');
                if (infoSection) {
                    infoSection.style.minHeight = `${maxInfoHeight}px`;
                }
            });
        }
    }
}

// Animate elements on scroll
function initScrollAnimation() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
    
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// Call this function after the DOM is loaded
window.addEventListener('load', initScrollAnimation);
window.addEventListener('resize', equalizeProductCardHeights);
