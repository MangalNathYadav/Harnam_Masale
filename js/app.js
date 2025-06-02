// Single Page Application functionality
const app = {
    pages: {},
    products: [],
    cart: [],
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
            checkout: document.getElementById('checkout-section'),
            productDetail: document.getElementById('product-detail-section')
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
        
        // Initialize wishlist
        this.setupWishlist();
        
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
        // Hide all pages first
        Object.values(this.pages).forEach(page => {
            if (page) {
                page.classList.remove('active');
                // Ensure display is none to prevent any visibility issues
                page.style.display = 'none';
            }
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
    
    // Product section functionality    setupProducts: function() {
        // Initialize filtering and search variables
        this.filteredProducts = [];
        this.searchQuery = '';
        this.filters = {
            price: 'all',
            rating: 'all',
            category: 'all'
        };
        
        // Product data
        this.products = [
            {
                id: 1,
                name: 'Garam Masala',
                description: 'A premium blend of ground spices used in Indian cuisine. Adds warmth and depth to dishes.',
                price: 250,
                image: 'assets/images/garam.jpeg',
                badge: 'Popular',
                rating: 4.8,
                reviewCount: 124,
                stock: 50,
                category: 'Blended Spices',
                details: 'Harnam\'s Garam Masala is a premium blend of carefully selected spices that creates the perfect balance of flavors. This aromatic mixture includes cardamom, cinnamon, cloves, cumin, coriander, and black pepper.',
                features: [
                    'Premium Quality Ingredients',
                    'No Artificial Colors',
                    'Authentic Flavors',
                    'Traditional Recipe'
                ]
            },
            {
                id: 2,
                name: 'Chola Masala', 
                description: 'Perfect spice blend for delicious chickpea curry. Brings authentic flavor to your chola dish.',
                price: 180,
                image: 'assets/images/chola.jpeg',
                badge: 'New',
                rating: 4.5,
                reviewCount: 86,
                stock: 45,
                category: 'Vegetarian Masalas',
                details: 'Specially crafted for the perfect Chola (Chickpea Curry), this masala blend combines the authentic flavors of cumin, coriander, dried mango powder, and our secret spice mix.',
                features: [
                    'Perfect Blend of Spices',
                    'Authentic Flavor',
                    'No Preservatives',
                    'Specially Crafted for Chickpea Dishes'
                ]
            },
            {
                id: 3,
                name: 'Sabji Masala',
                description: 'Essential mix for vegetable dishes. Enhances the flavor of any vegetable preparation.',
                price: 200,
                image: 'assets/images/sabji.jpeg',
                badge: '',
                rating: 4.6,
                reviewCount: 102,
                stock: 60,
                category: 'Vegetarian Masalas',
                details: 'Harnam\'s Sabji Masala is a versatile spice blend designed to enhance the flavor of any vegetable dish. This carefully balanced mix combines fennel, cumin, coriander, turmeric, and other aromatic spices.',
                features: [
                    'Versatile for All Vegetable Dishes',
                    'Balanced Flavor Profile',
                    'No Artificial Additives',
                    'Family Recipe'
                ]
            },
            {
                id: 4,
                name: 'Chicken Masala',
                description: 'Perfect blend for chicken dishes. Creates rich and aromatic flavors.',
                price: 220,
                image: 'assets/images/chiken.jpeg',
                badge: 'Best Seller',
                rating: 4.9,
                reviewCount: 156,
                stock: 40,
                category: 'Non-Vegetarian Masalas',
                details: 'Our premium Chicken Masala is a carefully crafted blend of over 15 spices designed to create the perfect chicken curry. This aromatic mix combines warm spices like cardamom and clove with earthy flavors.',
                features: [
                    'Perfect for All Chicken Preparations',
                    'Rich and Complex Flavor Profile',
                    'No MSG or Artificial Colors',
                    'Specially Formulated for Curries'
                ]
            },
            {
                id: 5,
                name: 'Meat Masala',
                description: 'Special blend for meat dishes. Enhances the taste of all meat preparations.',
                price: 230,
                image: 'assets/images/meat.jpeg',
                badge: '',
                rating: 4.7,
                reviewCount: 94,
                stock: 35,
                category: 'Non-Vegetarian Masalas',
                details: 'Harnam\'s Meat Masala is crafted specifically for red meat dishes. This robust blend combines warm spices like black cardamom, bay leaves, and black pepper with aromatic elements.',
                features: [
                    'Specially Formulated for Meat Dishes',
                    'Rich and Robust Flavor',
                    'No Artificial Ingredients',
                    'Perfect for Slow Cooking'
                ]
            },
            {
                id: 6,
                name: 'Paneer Masala',
                description: 'Specially crafted for paneer dishes. Brings restaurant quality taste to your kitchen.',
                price: 210,
                image: 'assets/images/paneer.jpeg',
                badge: 'New',
                rating: 4.6,
                reviewCount: 78,
                stock: 55,
                category: 'Vegetarian Masalas',
                details: 'Our special Paneer Masala blend is designed to bring restaurant-quality taste to your paneer dishes at home. This balanced mix combines tomato powder, dried fenugreek leaves, and complementary spices.',
                features: [
                    'Perfect for All Paneer Preparations',
                    'Balanced Blend for Creamy Dishes',
                    'Restaurant-Quality Taste',
                    'No Artificial Colors'
                ]
            }
        ];

        // Product data
        this.products = [
            {
                id: 1,
                name: 'Garam Masala',
                description: 'A premium blend of ground spices used in Indian cuisine. Adds warmth and depth to dishes.',
                price: 250,
                image: 'assets/images/garam.jpeg',
                badge: 'Popular',
                rating: 4.8,
                reviewCount: 124,
                stock: 50,
                category: 'Blended Spices',
                details: 'Harnam\'s Garam Masala is a premium blend of carefully selected spices that creates the perfect balance of flavors. This aromatic mixture includes cardamom, cinnamon, cloves, cumin, coriander, and black pepper.',
                features: [
                    'Premium Quality Ingredients',
                    'No Artificial Colors',
                    'Authentic Flavors',
                    'Traditional Recipe'
                ]
            },
            {
                id: 2,
                name: 'Chola Masala',
                description: 'Perfect spice blend for delicious chickpea curry. Brings authentic flavor to your chola dish.',
                price: 180,
                image: 'assets/images/chola.jpeg',
                badge: 'New',
                rating: 4.5,
                reviewCount: 86,
                stock: 45,
                category: 'Vegetarian Masalas',
                details: 'Specially crafted for the perfect Chola (Chickpea Curry), this masala blend combines the authentic flavors of cumin, coriander, dried mango powder, and our secret spice mix.',
                features: [
                    'Perfect Blend of Spices',
                    'Authentic Flavor',
                    'No Preservatives',
                    'Specially Crafted for Chickpea Dishes'
                ]
            },
            {
                id: 3,
                name: 'Sabji Masala',
                description: 'Essential mix for vegetable dishes. Enhances the flavor of any vegetable preparation.',
                price: 200,
                image: 'assets/images/sabji.jpeg',
                badge: '',
                rating: 4.6,
                reviewCount: 102,
                stock: 60,
                category: 'Vegetarian Masalas',
                details: 'Harnam\'s Sabji Masala is a versatile spice blend designed to enhance the flavor of any vegetable dish. This carefully balanced mix combines fennel, cumin, coriander, turmeric, and other aromatic spices.',
                features: [
                    'Versatile for All Vegetable Dishes',
                    'Balanced Flavor Profile', 
                    'No Artificial Additives',
                    'Family Recipe'
                ]
            },
            {
                id: 4,
                name: 'Chicken Masala',
                description: 'Perfect blend for chicken dishes. Creates rich and aromatic flavors.',
                price: 220,
                image: 'assets/images/chiken.jpeg',
                badge: 'Best Seller',
                rating: 4.9,
                reviewCount: 156,
                stock: 40,
                category: 'Non-Vegetarian Masalas',
                details: 'Our premium Chicken Masala is a carefully crafted blend of over 15 spices designed to create the perfect chicken curry. This aromatic mix combines warm spices like cardamom and clove with earthy flavors.',
                features: [
                    'Perfect for All Chicken Preparations',
                    'Rich and Complex Flavor Profile',
                    'No MSG or Artificial Colors',
                    'Specially Formulated for Curries'
                ]
            },
            {
                id: 5,
                name: 'Meat Masala',
                description: 'Special blend for meat dishes. Enhances the taste of all meat preparations.',
                price: 230,
                image: 'assets/images/meat.jpeg',
                badge: '',
                rating: 4.7,
                reviewCount: 94,
                stock: 35,
                category: 'Non-Vegetarian Masalas',
                details: 'Harnam\'s Meat Masala is crafted specifically for red meat dishes. This robust blend combines warm spices like black cardamom, bay leaves, and black pepper with aromatic elements.',
                features: [
                    'Specially Formulated for Meat Dishes',
                    'Rich and Robust Flavor',
                    'No Artificial Ingredients',
                    'Perfect for Slow Cooking'
                ]
            },
            {
                id: 6,
                name: 'Paneer Masala',
                description: 'Specially crafted for paneer dishes. Brings restaurant quality taste to your kitchen.',
                price: 210,
                image: 'assets/images/paneer.jpeg',
                badge: 'New',
                rating: 4.6,
                reviewCount: 78,
                stock: 55,
                category: 'Vegetarian Masalas',
                details: 'Our special Paneer Masala blend is designed to bring restaurant-quality taste to your paneer dishes at home. This balanced mix combines tomato powder, dried fenugreek leaves, and complementary spices.',
                features: [
                    'Perfect for All Paneer Preparations',
                    'Balanced Blend for Creamy Dishes',
                    'Restaurant-Quality Taste',
                    'No Artificial Colors'
                ]
            }
        ];

        // Render products
        this.renderProducts(this.products);
        
        // Initialize 3D view for products
        this.setup3DProductView();
        
        // Setup product detail view
        this.setupProductDetail();
    },
      renderProducts: function(products) {
        const productGrid = document.querySelector('#products-section .product-grid');
        const homeProductGrid = document.querySelector('#home-section .product-grid');
        const noProductsMessage = document.getElementById('no-products-message');
        
        if (productGrid) {
            // Clear existing products
            productGrid.innerHTML = '';
            
            // Show no products message if array is empty
            if (products.length === 0 && noProductsMessage) {
                noProductsMessage.style.display = 'block';
                return;
            } else if (noProductsMessage) {
                noProductsMessage.style.display = 'none';
            }
            
            // Add products to grid
            products.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.dataset.productId = product.id;
                
                // Create product HTML with enhanced features
                productCard.innerHTML = `
                    ${product.badge ? `<div class="product-badge ${product.badge === 'Best Seller' ? 'deal-badge' : ''}">${product.badge}</div>` : ''}
                    <div class="wishlist-icon" data-product-id="${product.id}">
                        <i class="far fa-heart"></i>
                    </div>
                    <div class="product-image-container">
                        <div class="product-circle product-3d-container" data-tilt data-product-id="${product.id}">
                            <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
                        </div>
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
                    <div class="product-card-footer">
                        <div class="product-rating">
                            <div class="stars">
                                ${this.getStarsHTML(product.rating)}
                            </div>
                            <span class="count">(${product.reviewCount})</span>
                        </div>
                        <a href="#productDetail" class="quick-view-btn view-details" data-product-id="${product.id}">Quick View</a>
                    </div>
                `;
                
                productCard.appendChild(productCard);
            });
            
            // Add event listeners to buttons
            this.setupProductButtons();
        }
        
        // Also add featured products to home page
        if (homeProductGrid) {
            homeProductGrid.innerHTML = '';
            
            // Show only first 3 products on home page
            const featuredProducts = products.slice(0, 3);
            
            featuredProducts.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.dataset.productId = product.id;
                
                productCard.innerHTML = `
                    ${product.badge ? `<div class="product-badge ${product.badge === 'Best Seller' ? 'deal-badge' : ''}">${product.badge}</div>` : ''}
                    <div class="wishlist-icon" data-product-id="${product.id}">
                        <i class="far fa-heart"></i>
                    </div>
                    <div class="product-image-container">
                        <div class="product-circle product-3d-container" data-tilt data-product-id="${product.id}">
                            <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
                        </div>
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
                    <div class="product-card-footer">
                        <div class="product-rating">
                            <div class="stars">
                                ${this.getStarsHTML(product.rating)}
                            </div>
                            <span class="count">(${product.reviewCount})</span>
                        </div>
                        <a href="#productDetail" class="quick-view-btn view-details" data-product-id="${product.id}">Quick View</a>
                    </div>
                `;
                
                homeProductGrid.appendChild(productCard);
            });
            
            // Add event listeners to home page product buttons
            this.setupProductButtons();
        }
    },
    
    getStarsHTML: function(rating) {
        let starsHTML = '';
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                starsHTML += '<i class="fas fa-star"></i>';
            } else if (i === fullStars + 1 && halfStar) {
                starsHTML += '<i class="fas fa-star-half-alt"></i>';
            } else {
                starsHTML += '<i class="far fa-star"></i>';
            }
        }
        
        return starsHTML;
    },
    
    setup3DProductView: function() {
        // Load VanillaTilt.js library dynamically
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/vanilla-tilt@1.7.0/dist/vanilla-tilt.min.js';
        script.onload = () => {
            // Initialize 3D effect on product images with enhanced options
            VanillaTilt.init(document.querySelectorAll('.product-3d-container'), {
                max: 25,
                speed: 400,
                glare: true,
                'max-glare': 0.5,
                scale: 1.05,
                perspective: 1000,
                transition: true,
                easing: "cubic-bezier(.03,.98,.52,.99)"
            });
            
            // Initialize 3D effect on product detail image if it exists
            VanillaTilt.init(document.querySelectorAll('.product-detail-3d-container'), {
                max: 20,
                speed: 400,
                glare: true,
                'max-glare': 0.3,
                scale: 1.03
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
        
        // Add method to show notifications
        if (!app.showNotification) {
            app.showNotification = function(message, type = 'success') {
                // Create notification element if it doesn't exist
                let notification = document.querySelector('.notification');
                if (!notification) {
                    notification = document.createElement('div');
                    notification.className = 'notification';
                    document.body.appendChild(notification);
                }
                
                // Update notification content
                notification.textContent = message;
                notification.className = `notification ${type}`;
                notification.classList.add('show');
                
                // Hide notification after 3 seconds
                setTimeout(() => {
                    notification.classList.remove('show');
                }, 3000);
            };
        }
        
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
        
        // View detail buttons
        const viewDetailButtons = document.querySelectorAll('.view-details');
        viewDetailButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = e.target.dataset.productId;
                this.showProductDetail(productId);
            });
        });
        
        // Product cards can also navigate to detail page
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Only navigate if the click wasn't on a button
                if (
                    !e.target.classList.contains('add-to-cart-btn') && 
                    !e.target.classList.contains('buy-now-btn') && 
                    !e.target.closest('.wishlist-icon') && 
                    !e.target.classList.contains('view-details')
                ) {
                    const productId = card.dataset.productId;
                    this.showProductDetail(productId);
                }
            });
        });
        
        // Wishlist buttons
        const wishlistIcons = document.querySelectorAll('.wishlist-icon');
        wishlistIcons.forEach(icon => {
            const productId = icon.dataset.productId;
            
            // Check if this product is in wishlist
            const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
            if (wishlist.includes(parseInt(productId))) {
                icon.classList.add('active');
                icon.querySelector('i').classList.remove('far');
                icon.querySelector('i').classList.add('fas');
            }
            
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleWishlist(productId, icon);
            });
        });
    },
    
    setupProductDetail: function() {
        // Initialize product detail page
        
        // Set up tab switching
        const tabBtns = document.querySelectorAll('.product-detail-tabs .tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all tabs
                document.querySelectorAll('.product-detail-tabs .tab-btn').forEach(tab => {
                    tab.classList.remove('active');
                });
                document.querySelectorAll('.product-detail-tabs .tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                // Add active class to clicked tab
                btn.classList.add('active');
                const tabId = btn.dataset.tab;
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
        
        // Set up quantity controls
        const quantityInput = document.getElementById('product-detail-quantity');
        const decreaseBtn = document.getElementById('product-detail-decrease');
        const increaseBtn = document.getElementById('product-detail-increase');
        
        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', () => {
                const currentValue = parseInt(quantityInput.value);
                if (currentValue > 1) {
                    quantityInput.value = currentValue - 1;
                }
            });
        }
        
        if (increaseBtn) {
            increaseBtn.addEventListener('click', () => {
                const currentValue = parseInt(quantityInput.value);
                quantityInput.value = currentValue + 1;
            });
        }
        
        // Set up add to cart button
        const addToCartBtn = document.getElementById('product-detail-add-to-cart');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => {
                const productId = addToCartBtn.dataset.productId;
                const quantity = parseInt(quantityInput.value);
                
                this.addToCart(productId, quantity);
                this.showNotification('Product added to cart!');
            });
        }
        
        // Set up buy now button
        const buyNowBtn = document.getElementById('product-detail-buy-now');
        if (buyNowBtn) {
            buyNowBtn.addEventListener('click', () => {
                const productId = buyNowBtn.dataset.productId;
                const quantity = parseInt(quantityInput.value);
                
                this.addToCart(productId, quantity);
                this.showPage('checkout');
            });
        }
        
        // Set up wishlist button
        const wishlistBtn = document.getElementById('product-detail-wishlist');
        if (wishlistBtn) {
            wishlistBtn.addEventListener('click', () => {
                const productId = wishlistBtn.dataset.productId;
                this.toggleWishlist(productId);
                
                // Update button state
                if (wishlistBtn.querySelector('i').classList.contains('far')) {
                    wishlistBtn.querySelector('i').classList.remove('far');
                    wishlistBtn.querySelector('i').classList.add('fas');
                    this.showNotification('Added to wishlist!');
                } else {
                    wishlistBtn.querySelector('i').classList.remove('fas');
                    wishlistBtn.querySelector('i').classList.add('far');
                    this.showNotification('Removed from wishlist!');
                }
            });
        }
    },
    
    showProductDetail: function(productId) {
        // Find product
        const product = this.products.find(p => p.id === parseInt(productId));
        if (!product) return;
        
        // Set product data on detail page        document.querySelector('.product-detail-title').textContent = product.name;
        document.querySelector('.product-detail-price').textContent = `₹${product.price}`;
        document.querySelector('.product-detail_description').textContent = product.description;
        document.querySelector('.product-tab_description').textContent = product.details;
        document.querySelector('.category-label').textContent = product.category;
        
        // Set image
        const detailImg = document.getElementById('product-detail-img');
        detailImg.src = product.image;
        detailImg.alt = product.name;
        
        // Set badge if exists
        const badge = document.querySelector('.product-detail-badge');
        if (product.badge) {
            badge.textContent = product.badge;
            badge.style.display = 'block';
            
            if (product.badge === 'Best Seller') {
                badge.classList.add('deal-badge');
            } else {
                badge.classList.remove('deal-badge');
            }
        } else {
            badge.style.display = 'none';
        }
        
        // Reset quantity
        document.getElementById('product-detail-quantity').value = 1;
        
        // Set product ID on buttons
        document.getElementById('product-detail-add-to-cart').dataset.productId = product.id;
        document.getElementById('product-detail-buy-now').dataset.productId = product.id;
        document.getElementById('product-detail-wishlist').dataset.productId = product.id;
        
        // Check if product is in wishlist
        const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        const wishlistBtn = document.getElementById('product-detail-wishlist');
        
        if (wishlist.includes(parseInt(productId))) {
            wishlistBtn.querySelector('i').classList.remove('far');
            wishlistBtn.querySelector('i').classList.add('fas');
        } else {
            wishlistBtn.querySelector('i').classList.remove('fas');
            wishlistBtn.querySelector('i').classList.add('far');
        }
        
        // Set up related products (exclude current product and show up to 4)
        const relatedProducts = this.products
            .filter(p => p.id !== parseInt(productId))
            .slice(0, 4);
            
        const relatedGrid = document.querySelector('.related-products-grid');
        relatedGrid.innerHTML = '';
        
        relatedProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.dataset.productId = product.id;
            
            productCard.innerHTML = `
                ${product.badge ? `<div class="product-badge ${product.badge === 'Best Seller' ? 'deal-badge' : ''}">${product.badge}</div>` : ''}
                <div class="wishlist-icon" data-product-id="${product.id}">
                    <i class="${wishlist.includes(product.id) ? 'fas' : 'far'} fa-heart"></i>
                </div>
                <div class="product-circle product-3d-container" data-tilt data-product-id="${product.id}">
                    <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="price">₹${product.price}</div>
                    <div class="product-actions">
                        <button class="add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
                    </div>
                </div>
            `;
            
            relatedGrid.appendChild(productCard);
            
            // Add event listener
            productCard.addEventListener('click', () => {
                this.showProductDetail(product.id);
            });
        });
        
        // Initialize 3D effect on related products
        setTimeout(() => {
            this.setup3DProductView();
        }, 100);
        
        // Add event listeners to related product buttons
        const relatedAddToCartBtns = relatedGrid.querySelectorAll('.add-to-cart-btn');
        relatedAddToCartBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = btn.dataset.productId;
                this.addToCart(productId);
                this.showNotification('Product added to cart!');
            });
        });
        
        // Add event listeners to related product wishlist icons
        const relatedWishlistIcons = relatedGrid.querySelectorAll('.wishlist-icon');
        relatedWishlistIcons.forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = icon.dataset.productId;
                this.toggleWishlist(productId, icon);
            });
        });
        
        // Show product detail page
        this.showPage('productDetail');
    },
    
    // Wishlist functionality
    setupWishlist: function() {
        // Initialize wishlist from localStorage or empty
        this.wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        
        // Add wishlist tab to profile tabs if it doesn't exist
        const tabsContainer = document.querySelector('.profile-content .tabs');
        
        if (tabsContainer && !document.querySelector('[data-tab="wishlist"]')) {
            const wishlistTab = document.createElement('button');
            wishlistTab.className = 'tab-btn';
            wishlistTab.dataset.tab = 'wishlist';
            wishlistTab.textContent = 'Wishlist';
            tabsContainer.appendChild(wishlistTab);
            
            // Add wishlist tab content
            const tabContentContainer = document.querySelector('.profile-content');
            const wishlistTabContent = document.createElement('div');
            wishlistTabContent.id = 'wishlist-tab';
            wishlistTabContent.className = 'tab-content';
            wishlistTabContent.innerHTML = `
                <h3>Your Wishlist</h3>
                <div class="wishlist-grid">
                    <!-- Wishlist items will be shown here -->
                </div>
            `;
            tabContentContainer.appendChild(wishlistTabContent);
            
            // Add click event to tab
            wishlistTab.addEventListener('click', () => {
                // Hide all tab content
                document.querySelectorAll('.profile-content .tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                // Remove active class from all tabs
                document.querySelectorAll('.profile-content .tab-btn').forEach(tab => {
                    tab.classList.remove('active');
                });
                
                // Show wishlist tab
                wishlistTab.classList.add('active');
                wishlistTabContent.classList.add('active');
                
                // Render wishlist items
                this.renderWishlist();
            });
        }
    },
    
    toggleWishlist: function(productId, iconElement) {
        productId = parseInt(productId);
        
        // Check if product is already in wishlist
        const index = this.wishlist.indexOf(productId);
        
        if (index === -1) {
            // Add to wishlist
            this.wishlist.push(productId);
            
            // Update UI if icon element is provided
            if (iconElement) {
                iconElement.classList.add('active');
                const icon = iconElement.querySelector('i');
                icon.classList.remove('far');
                icon.classList.add('fas');
            }
            
            this.showNotification('Added to wishlist!');
        } else {
            // Remove from wishlist
            this.wishlist.splice(index, 1);
            
            // Update UI if icon element is provided
            if (iconElement) {
                iconElement.classList.remove('active');
                const icon = iconElement.querySelector('i');
                icon.classList.remove('fas');
                icon.classList.add('far');
            }
            
            this.showNotification('Removed from wishlist!');
        }
        
        // Save to localStorage
        localStorage.setItem('wishlist', JSON.stringify(this.wishlist));
        
        // Update wishlist display if on profile page
        if (this.pages.profile.classList.contains('active')) {
            this.renderWishlist();
        }
    },
    
    renderWishlist: function() {
        const wishlistGrid = document.querySelector('.wishlist-grid');
        if (!wishlistGrid) return;
        
        wishlistGrid.innerHTML = '';
        
        if (this.wishlist.length === 0) {
            wishlistGrid.innerHTML = `
                <div class="no-wishlist">
                    <i class="far fa-heart"></i>
                    <p>Your wishlist is empty</p>
                    <a href="#products" class="btn">Shop Now</a>
                </div>
            `;
            return;
        }
        
        // Get products in wishlist
        const wishlistProducts = this.products.filter(p => this.wishlist.includes(p.id));
        
        wishlistProducts.forEach(product => {
            const wishlistItem = document.createElement('div');
            wishlistItem.className = 'product-card';
            wishlistItem.dataset.productId = product.id;
            
            wishlistItem.innerHTML = `
                ${product.badge ? `<div class="product-badge ${product.badge === 'Best Seller' ? 'deal-badge' : ''}">${product.badge}</div>` : ''}
                <div class="wishlist-icon active" data-product-id="${product.id}">
                    <i class="fas fa-heart"></i>
                </div>
                <div class="product-circle product-3d-container" data-tilt data-product-id="${product.id}">
                    <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="price">₹${product.price}</div>
                    <div class="product-actions">
                        <button class="add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
                        <button class="buy-now-btn" data-product-id="${product.id}">Buy Now</button>
                    </div>
                </div>
            `;
            
            wishlistGrid.appendChild(wishlistItem);
        });
        
        // Add event listeners to wishlist items
        const wishlistAddToCartBtns = wishlistGrid.querySelectorAll('.add-to-cart-btn');
        wishlistAddToCartBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = btn.dataset.productId;
                this.addToCart(productId);
                this.showNotification('Product added to cart!');
            });
        });
        
        const wishlistBuyNowBtns = wishlistGrid.querySelectorAll('.buy-now-btn');
        wishlistBuyNowBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = btn.dataset.productId;
                this.addToCart(productId);
                this.showPage('checkout');
            });
        });
        
        const wishlistIcons = wishlistGrid.querySelectorAll('.wishlist-icon');
        wishlistIcons.forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = icon.dataset.productId;
                this.toggleWishlist(productId, icon);
            });
        });
        
        // Initialize 3D effect
        setTimeout(() => {
            this.setup3DProductView();
        }, 100);
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
                
                // Calculate total
                const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                let discount = 0;
                if (subtotal >= 1000) {
                    discount = subtotal * 0.05;
                }
                const deliveryCost = subtotal > 500 ? 0 : 50;
                const total = subtotal - discount + deliveryCost;
                
                // Clear cart
                this.cart = [];
                localStorage.setItem('cart', JSON.stringify(this.cart));
                this.updateCartCount();
                
                // Show success message with order details
                const checkoutContent = document.querySelector('#checkout-section .checkout-content');
                if (checkoutContent) {
                    checkoutContent.innerHTML = `
                        <div class="checkout-success">
                            <i class="fas fa-check-circle"></i>
                            <h2>Order Placed Successfully!</h2>
                            <p>Your order number is: <strong>${orderNumber}</strong></p>
                            <p>You will receive an email confirmation shortly.</p>
                            <div class="order-confirmation-details">
                                <h3>Order Summary</h3>
                                <div class="order-confirmation-summary">
                                    <div class="confirmation-row">
                                        <span>Subtotal:</span>
                                        <span>₹${subtotal}</span>
                                    </div>
                                    ${discount > 0 ? `
                                    <div class="confirmation-row">
                                        <span>Discount:</span>
                                        <span>-₹${Math.round(discount)}</span>
                                    </div>` : ''}
                                    <div class="confirmation-row">
                                        <span>Delivery:</span>
                                        <span>${deliveryCost > 0 ? '₹' + deliveryCost : 'FREE'}</span>
                                    </div>
                                    <div class="confirmation-row total">
                                        <span>Total:</span>
                                        <span>₹${Math.round(total)}</span>
                                    </div>
                                </div>
                                <p>Expected delivery: <strong>${this.getEstimatedDelivery()}</strong></p>
                            </div>
                            <div class="action-buttons">
                                <a href="#products" class="btn">Continue Shopping</a>
                                <a href="#profile" class="btn btn-primary">Track Order</a>
                            </div>
                        </div>
                    `;
                }
                
                // Add order to user's orders if logged in
                const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                if (currentUser) {
                    const users = JSON.parse(localStorage.getItem('users')) || [];
                    const userIndex = users.findIndex(user => user.email === currentUser.email);
                    
                    if (userIndex !== -1) {
                        // Get form data
                        const firstName = document.getElementById('first-name').value;
                        const lastName = document.getElementById('last-name').value;
                        const email = document.getElementById('checkout-email').value;
                        const phone = document.getElementById('checkout-phone').value;
                        const address = document.getElementById('address').value;
                        const city = document.getElementById('city').value;
                        const postalCode = document.getElementById('postal-code').value;
                        const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
                        
                        // Create shipping info object
                        const shippingInfo = {
                            firstName,
                            lastName,
                            email,
                            phone,
                            address,
                            city,
                            postalCode
                        };
                        
                        users[userIndex].orders = users[userIndex].orders || [];
                        users[userIndex].orders.push({
                            id: orderNumber,
                            date: new Date().toISOString(),
                            subtotal: subtotal,
                            discount: discount,
                            delivery: deliveryCost,
                            total: Math.round(total),
                            status: 'Processing',
                            paymentMethod,
                            shippingInfo,
                            estimatedDelivery: this.getEstimatedDelivery(),
                            items: this.cart.map(item => ({...item}))
                        });
                        
                        localStorage.setItem('users', JSON.stringify(users));
                        localStorage.setItem('currentUser', JSON.stringify(users[userIndex]));
                    }
                }
            }, 2000);
        }
    },
    
    getEstimatedDelivery: function() {
        // Calculate an estimated delivery date (3-5 business days from now)
        const today = new Date();
        const deliveryDays = Math.floor(Math.random() * 3) + 3; // Random between 3-5 days
        
        // Skip weekends for business days calculation
        let businessDays = 0;
        let currentDate = new Date(today);
        
        while (businessDays < deliveryDays) {
            currentDate.setDate(currentDate.getDate() + 1);
            // Skip Saturday (6) and Sunday (0)
            if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
                businessDays++;
            }
        }
        
        // Format the date
        return currentDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    
    // User orders functionality
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
                
                <div class="order-details">
                    <div class="delivery-info">
                        <p class="delivery-heading"><i class="fas fa-truck"></i> Estimated Delivery</p>
                        <p class="delivery-date">${order.estimatedDelivery || 'Processing'}</p>
                    </div>
                    
                    <div class="payment-method">
                        <p><strong>Payment Method:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
                    </div>
                </div>
                
                <div class="order-items">
                    ${order.items && order.items.length ? order.items.map(item => `
                        <div class="order-item-detail">
                            <img src="${item.image}" alt="${item.name}" class="order-item-image">
                            <div class="order-item-info">
                                <p>${item.name} × ${item.quantity}</p>
                                <p class="order-item-price">₹${item.price * item.quantity}</p>
                            </div>
                        </div>
                    `).join('') : '<p>No items information available</p>'}
                </div>
                
                <div class="order-summary">
                    <div class="order-summary-row">
                        <span>Subtotal:</span>
                        <span>₹${order.subtotal || order.total}</span>
                    </div>
                    ${order.discount ? `
                    <div class="order-summary-row">
                        <span>Discount:</span>
                        <span>-₹${Math.round(order.discount)}</span>
                    </div>
                    ` : ''}
                    <div class="order-summary-row">
                        <span>Delivery:</span>
                        <span>${order.delivery === 0 ? 'FREE' : `₹${order.delivery}`}</span>
                    </div>
                    <div class="order-summary-row total">
                        <span>Total:</span>
                        <span>₹${order.total}</span>
                    </div>
                </div>
                
                <div class="order-actions">
                    ${order.status.toLowerCase() !== 'delivered' ? `
                    <div class="order-status-info">
                        ${this.getOrderStatusInfoHTML(order.status.toLowerCase())}
                    </div>
                    ` : ''}
                    <button class="btn-outline reorder-btn" data-order-id="${order.id}">Reorder</button>
                </div>
            `;
            
            ordersContainer.appendChild(orderElement);
            
            // Add reorder functionality
            const reorderBtn = orderElement.querySelector('.reorder-btn');
            if (reorderBtn) {
                reorderBtn.addEventListener('click', () => {
                    this.reorderItems(order.items);
                });
            }
        });
    },
    
    getOrderStatusInfoHTML: function(status) {
        switch(status) {
            case 'processing':
                return `
                    <div class="status-progress">
                        <div class="status-step active">
                            <div class="status-dot"></div>
                            <div class="status-label">Ordered</div>
                        </div>
                        <div class="status-line"></div>
                        <div class="status-step">
                            <div class="status-dot"></div>
                            <div class="status-label">Processing</div>
                        </div>
                        <div class="status-line"></div>
                        <div class="status-step">
                            <div class="status-dot"></div>
                            <div class="status-label">Shipped</div>
                        </div>
                        <div class="status-line"></div>
                        <div class="status-step">
                            <div class="status-dot"></div>
                            <div class="status-label">Delivered</div>
                        </div>
                    </div>
                `;
            case 'shipped':
                return `
                    <div class="status-progress">
                        <div class="status-step active">
                            <div class="status-dot"></div>
                            <div class="status-label">Ordered</div>
                        </div>
                        <div class="status-line active"></div>
                        <div class="status-step active">
                            <div class="status-dot"></div>
                            <div class="status-label">Processing</div>
                        </div>
                        <div class="status-line active"></div>
                        <div class="status-step active">
                            <div class="status-dot"></div>
                            <div class="status-label">Shipped</div>
                        </div>
                        <div class="status-line"></div>
                        <div class="status-step">
                            <div class="status-dot"></div>
                            <div class="status-label">Delivered</div>
                        </div>
                    </div>
                `;
            default:
                return '';
        }
    },
    
    reorderItems: function(items) {
        if (!items || !items.length) {
            this.showNotification('Cannot reorder: No items found', 'error');
            return;
        }
        
        // Clear current cart
        this.cart = [];
        
        // Add items to cart
        items.forEach(item => {
            this.addToCart(item.id, item.quantity);
        });
        
        // Show success message
        this.showNotification('Items have been added to cart');
        
        // Navigate to cart
        this.showPage('cart');
    },
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
