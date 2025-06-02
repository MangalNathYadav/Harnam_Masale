// Product data
const products = [
    {
        id: 1,
        name: "Garam Masala",
        price: 250,
        image: "assets/images/garam.jpeg",
        category: "Masale",
        description: "A blend of ground spices used in Indian cuisine. Adds warmth and depth to dishes."
    },
    {
        id: 2,
        name: "Chola Masala",
        price: 180,
        image: "assets/images/chola.jpeg",
        category: "Masale",
        description: "Perfect spice blend for delicious chickpea curry. Brings authentic flavor to your chola dish."
    },
    {
        id: 3,
        name: "Sabji Masala",
        price: 200,
        image: "assets/images/sabji.jpeg",
        category: "Masale",
        description: "Essential mix for vegetable dishes. Enhances the flavor of any vegetable preparation."
    },
    {
        id: 4,
        name: "Chicken Masala",
        price: 220,
        image: "assets/images/chiken.jpeg",
        category: "Non-Vegetarian",
        description: "Special blend for perfect chicken dishes. Creates rich and aromatic flavors."
    },
    {
        id: 5,
        name: "Meat Masala",
        price: 240,
        image: "assets/images/meat.jpeg",
        category: "Non-Vegetarian",
        description: "Premium spice mix for meat dishes. Enhances the taste of any meat preparation."
    },
    {
        id: 6,
        name: "Paneer Masala",
        price: 190,
        image: "assets/images/paneer.jpeg",
        category: "Vegetarian",
        description: "Perfect blend for paneer dishes. Creates rich and creamy flavors."
    },
    {
        id: 7,
        name: "Masala Tea",
        price: 150,
        image: "assets/images/garam.jpeg",
        category: "Beverages",
        description: "Traditional Indian spiced tea blend. Perfect for a refreshing cup of chai."
    },
    {
        id: 8,
        name: "Mango Pickle",
        price: 280,
        image: "assets/images/paneer.jpeg",
        category: "Pickles",
        description: "Tangy and spicy mango pickle made with authentic spices."
    },
    {
        id: 9,
        name: "Mathri",
        price: 120,
        image: "assets/images/chola.jpeg",
        category: "Snacks",
        description: "Crispy and flaky savory crackers, perfect with tea or as a snack."
    },
    {
        id: 10,
        name: "Mixed Dry Fruits",
        price: 550,
        image: "assets/images/meat.jpeg",
        category: "Dry Fruits",
        description: "Premium quality mixed dry fruits - almonds, cashews, raisins and more."
    },
    {
        id: 11,
        name: "Lemon Tea",
        price: 130,
        image: "assets/images/sabji.jpeg",
        category: "Beverages",
        description: "Refreshing lemon-infused tea blend. Perfect for any time of day."
    },
    {
        id: 12,
        name: "Blended Spices Mix",
        price: 320,
        image: "assets/images/garam.jpeg",
        category: "Blended Spices",
        description: "Special mix of premium blended spices for all your cooking needs."
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
    renderProducts();
    
    // Category filter change
    if (categoryFilter) {
        categoryFilter.addEventListener('change', updateProducts);
    }
    
    // Price filter change
    if (priceFilter) {
        priceFilter.addEventListener('change', updateProducts);
    }
    
    // Search input
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(updateProducts, 300);
        });
    }
});

// Update products based on all filters
function updateProducts() {
    const category = document.getElementById('category-filter')?.value || 'all';
    const priceRange = document.getElementById('price-filter')?.value || 'all';
    const searchQuery = document.getElementById('search-input')?.value || '';
    
    const filteredProducts = filterProducts(category, priceRange, searchQuery);
    renderProductGrid(filteredProducts);
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

    // Reinitialize scroll animations for new products
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