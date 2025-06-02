// Product data
const products = [
    {
        id: 1,
        name: "Garam Masala",
        price: 250,
        image: "assets/images/garam.jpeg",
        category: "Basic Masala",
        badge: "Best Seller",
        description: "A premium blend of ground spices used in Indian cuisine. This aromatic mixture includes cardamom, cinnamon, cloves, cumin, and black pepper."
    },
    {
        id: 2,
        name: "Chola Masala",
        price: 180,
        image: "assets/images/chola.jpeg",
        category: "Vegetarian Masala",
        badge: "Popular",
        description: "Perfect blend for authentic chickpea curry. Made with carefully selected spices for the perfect balance of flavors."
    },
    {
        id: 3,
        name: "Sabji Masala",
        price: 200,
        image: "assets/images/sabji.jpeg",
        category: "Vegetarian Masala",
        description: "Essential mix for vegetable dishes. Our special blend enhances the natural flavors of any vegetable preparation."
    },
    {
        id: 4,
        name: "Chicken Masala",
        price: 220,
        image: "assets/images/chiken.jpeg",
        category: "Non-Vegetarian Masala",
        badge: "Best Seller",
        description: "Perfect blend for chicken dishes. Creates rich, aromatic flavors that make every chicken dish special."
    },
    {
        id: 5,
        name: "Meat Masala",
        price: 230,
        image: "assets/images/meat.jpeg",
        category: "Non-Vegetarian Masala",
        description: "Special blend for meat dishes. Enhances the taste of all meat preparations with its rich, robust flavors."
    },
    {
        id: 6,
        name: "Paneer Masala",
        price: 210,
        image: "assets/images/paneer.jpeg",
        category: "Vegetarian Masala",
        badge: "New",
        description: "Specially crafted for paneer dishes. Brings restaurant-quality taste to your homemade paneer preparations."
    }
];

// Filter products by category, price range and search query
function filterProducts(category = 'all', priceRange = 'all', searchQuery = '') {
    return products.filter(product => {
        // Category filter
        const categoryMatch = category === 'all' || product.category === category;
        
        // Price filter
        let priceMatch = true;
        if (priceRange === 'under-200') {
            priceMatch = product.price < 200;
        } else if (priceRange === '200-500') {
            priceMatch = product.price >= 200 && product.price <= 500;
        } else if (priceRange === 'above-500') {
            priceMatch = product.price > 500;
        }
        
        // Search filter
        const search = searchQuery.toLowerCase();
        const searchMatch = !search || 
            product.name.toLowerCase().includes(search) || 
            product.description.toLowerCase().includes(search) ||
            product.category.toLowerCase().includes(search);
        
        return categoryMatch && priceMatch && searchMatch;
    });
}

// Initialize filters and search
document.addEventListener('DOMContentLoaded', () => {
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    const searchInput = document.getElementById('search-input');
    
    // Initial products load
    renderProductGrid(products);
    
    // Category filter change
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => updateProducts());
    }
    
    // Price filter change
    if (priceFilter) {
        priceFilter.addEventListener('change', () => updateProducts());
    }
    
    // Search input
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => updateProducts(), 300);
        });
    }

    // Initialize cart functionality
    setupCart();
});

// Update products based on all filters
function updateProducts() {
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    const searchInput = document.getElementById('search-input');

    const category = categoryFilter?.value || 'all';
    const priceRange = priceFilter?.value || 'all';
    const searchQuery = searchInput?.value || '';
    
    let filtered = [...products];
    
    // Apply category filter
    if (category !== 'all') {
        filtered = filtered.filter(p => p.category === category);
    }
    
    // Apply price filter
    if (priceRange !== 'all') {
        switch(priceRange) {
            case 'under-200':
                filtered = filtered.filter(p => p.price <= 200);  // Changed to include products at 200
                break;
            case '200-500':
                filtered = filtered.filter(p => p.price > 200 && p.price <= 500);
                break;
            case 'above-500':
                filtered = filtered.filter(p => p.price > 500);
                break;
        }
    }
    
    // Apply search filter
    if (searchQuery) {
        const search = searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(search) ||
            p.description.toLowerCase().includes(search) ||
            p.category.toLowerCase().includes(search)
        );
    }
    
    renderProductGrid(filtered);
}

// Render the product grid
function renderProductGrid(products) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    
    if (products.length === 0) {
        grid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search"></i>
                <p>No products found matching your criteria</p>
            </div>`;
        return;
    }
    
    grid.innerHTML = products.map(product => `
        <div class="product-card animate-on-scroll">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                <span class="product-category">${product.category}</span>
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">₹${product.price}</p>
                <p class="product-description">${product.description}</p>
                <button class="btn add-to-cart-btn" onclick="addToCart(${product.id})">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        </div>
    `).join('');

    setupScrollAnimation();
}

// Cart functionality
let cart = [];

// DOM Elements
const productGrid = document.getElementById('product-grid');
const cartModal = document.getElementById('cart-modal');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const cartCount = document.querySelector('.cart-count');
const cartButton = document.querySelector('.cart-button');
const closeModal = document.querySelector('.close-modal');
const mobileMenu = document.querySelector('.mobile-menu');
const navLinks = document.querySelector('.nav-links');
const themeToggle = document.querySelector('.theme-toggle');
const body = document.body;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupEventListeners();
    setupTheme();
    setupScrollAnimation();
});

// Load Products
function loadProducts(category = 'all') {
    const filteredProducts = category === 'all' 
        ? products 
        : products.filter(product => product.category === category);

    productGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card animate-on-scroll">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
                <span class="product-category">${product.category}</span>
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">₹${product.price}</p>
                <p class="product-description">${product.description}</p>
                <button class="btn" onclick="addToCart(${product.id})">Add to Cart</button>
            </div>
        </div>
    `).join('');
}

// Cart Functions
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity < 1) {
            removeFromCart(productId);
        } else {
            updateCart();
        }
    }
}

function updateCart() {
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    // Update cart items
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>₹${item.price} x ${item.quantity}</p>
            </div>
            <div class="cart-item-controls">
                <button onclick="updateQuantity(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
            <button class="remove-item" onclick="removeFromCart(${item.id})">×</button>
        </div>
    `).join('');

    // Update total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `₹${total}`;
}

// Event Listeners
function setupEventListeners() {
    // Mobile Menu
    mobileMenu.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Cart Modal
    cartButton.addEventListener('click', () => {
        cartModal.style.display = 'block';
        updateCart();
    });

    closeModal.addEventListener('click', () => {
        cartModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            cartModal.style.display = 'none';
        }
    });

    // Smooth Scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu if open
                mobileMenu.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    });

    // Active Navigation
    window.addEventListener('scroll', () => {
        let current = '';
        document.querySelectorAll('.section').forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (window.pageYOffset >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // Contact Form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Add your form submission logic here
            alert('Message sent successfully!');
            contactForm.reset();
        });
    }
}

// Theme Toggle
function setupTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        body.classList.add('light-theme');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('light-theme');
        const isLight = body.classList.contains('light-theme');
        themeToggle.innerHTML = isLight ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
}

// Scroll Animations
function setupScrollAnimation() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(element => {
        observer.observe(element);
    });

    document.querySelectorAll('.fade-in').forEach(element => {
        element.classList.add('visible');
    });
}

// Initialize Leaflet Map
function initMap() {
    // Coordinates for Delhi (approximately Chandni Chowk area)
    const delhi = [28.6539, 77.2290];
    
    // Create map centered on Delhi
    const map = L.map('map').setView(delhi, 13);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add marker for store location
    const marker = L.marker(delhi).addTo(map);
    
    // Add popup with store info
    marker.bindPopup(`
        <strong>Harnam Masale</strong><br>
        123 Spice Market,<br>
        Chandni Chowk, Delhi<br>
        India - 110001
    `).openPopup();
}

// Add map initialization to DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    // ...existing code...
    
    // Initialize map
    initMap();
    
    // Form submission handling
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Add animation class
            const submitBtn = contactForm.querySelector('.submit-btn');
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            
            // Simulate form submission (replace with actual form handling)
            setTimeout(() => {
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
                contactForm.reset();
                
                // Reset button after 3 seconds
                setTimeout(() => {
                    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
                }, 3000);
            }, 1500);
        });
    }
});