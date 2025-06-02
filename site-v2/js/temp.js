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

let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    renderProducts(products);
    setupFilters();
    setupCart();
});

function filterProducts() {
    const category = document.getElementById('category-filter').value;
    const priceRange = document.getElementById('price-filter').value;
    const searchQuery = document.getElementById('search-input')?.value.toLowerCase().trim() || '';

    let filtered = [...products];

    // Apply category filter
    if (category !== 'all') {
        filtered = filtered.filter(product => product.category === category);
    }

    // Apply price filter
    if (priceRange !== 'all') {
        filtered = filtered.filter(product => {
            switch(priceRange) {
                case 'under-200':
                    return product.price < 200;
                case '200-500':
                    return product.price >= 200 && product.price <= 500;
                case 'above-500':
                    return product.price > 500;
                default:
                    return true;
            }
        });
    }

    // Apply search filter
    if (searchQuery) {
        filtered = filtered.filter(product => 
            product.name.toLowerCase().includes(searchQuery) ||
            product.description.toLowerCase().includes(searchQuery) ||
            product.category.toLowerCase().includes(searchQuery)
        );
    }

    renderProducts(filtered);
}

function setupFilters() {
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    const searchInput = document.getElementById('search-input');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }

    if (priceFilter) {
        priceFilter.addEventListener('change', filterProducts);
    }

    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(filterProducts, 300);
        });
    }
}

function renderProducts(productsToRender) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    if (productsToRender.length === 0) {
        grid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search"></i>
                <p>No products found matching your criteria</p>
            </div>`;
        return;
    }

    grid.innerHTML = productsToRender.map(product => `
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

function setupCart() {
    const cartButton = document.querySelector('.cart-button');
    const cartModal = document.getElementById('cart-modal');
    const closeModal = document.querySelector('.close-modal');

    if (cartButton && cartModal) {
        cartButton.addEventListener('click', () => {
            cartModal.style.display = 'block';
            updateCartDisplay();
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
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateCartDisplay();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = Math.max(0, item.quantity + change);
        if (item.quantity === 0) {
            removeFromCart(productId);
        } else {
            updateCartDisplay();
        }
    }
}

function updateCartDisplay() {
    const cartCount = document.querySelector('.cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.textContent = totalItems;

    // Update cart items
    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        } else {
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="item-details">
                        <h4>${item.name}</h4>
                        <p class="item-price">₹${item.price} × ${item.quantity}</p>
                    </div>
                    <div class="quantity-controls">
                        <button onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                    <button class="remove-item" onclick="removeFromCart(${item.id})">×</button>
                </div>
            `).join('');
        }
    }

    // Update total
    if (cartTotal) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = `₹${total}`;
    }
}

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
}
