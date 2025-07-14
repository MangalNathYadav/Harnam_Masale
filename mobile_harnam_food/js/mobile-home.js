// Mobile Home JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the featured products section
    initializeFeaturedProducts();
    
    // Setup event listeners
    setupEventListeners();

    // Check authentication state
    checkAuthState();
});

// Function to initialize featured products
function initializeFeaturedProducts() {
    const featuredProductsContainer = document.getElementById('featured-products');
    if (!featuredProductsContainer) return;
    
    // Show loading state
    featuredProductsContainer.innerHTML = `
        <div class="loading-container">
            <div class="loader"></div>
            <p>Loading products...</p>
        </div>
    `;
    
    // Try to fetch featured products from Firebase
    if (window.firebase && firebase.database) {
        const productsRef = firebase.database().ref('products');
        
        productsRef.orderByChild('featured').equalTo(true).limitToFirst(6).once('value')
            .then(snapshot => {
                const featuredProducts = [];
                snapshot.forEach(childSnapshot => {
                    featuredProducts.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                
                if (featuredProducts.length > 0) {
                    renderFeaturedProducts(featuredProducts);
                } else {
                    // If no featured products, get any products
                    productsRef.limitToFirst(6).once('value')
                        .then(snapshot => {
                            const products = [];
                            snapshot.forEach(childSnapshot => {
                                products.push({
                                    id: childSnapshot.key,
                                    ...childSnapshot.val()
                                });
                            });
                            renderFeaturedProducts(products);
                        });
                }
            })
            .catch(error => {
                console.error('Error fetching featured products:', error);
                renderDummyFeaturedProducts();
            });
    } else {
        // If Firebase is not available, render dummy products after a delay
        setTimeout(() => {
            renderDummyFeaturedProducts();
        }, 1000);
    }
}

// Function to render featured products
function renderFeaturedProducts(products) {
    const featuredProductsContainer = document.getElementById('featured-products');
    if (!featuredProductsContainer) return;
    
    // Clear the container
    featuredProductsContainer.innerHTML = '';
    
    // If no products, show a message
    if (products.length === 0) {
        featuredProductsContainer.innerHTML = `
            <div class="no-products">
                <p>No featured products available at the moment.</p>
            </div>
        `;
        return;
    }
    
    // Create a horizontal scroll container
    const productScroller = document.createElement('div');
    productScroller.className = 'product-scroller';
    
    // Render each product
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.setAttribute('data-product-id', product.id);
        
        // Calculate discount percentage if original price exists
        let discountBadge = '';
        if (product.originalPrice && product.originalPrice > product.price) {
            const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
            discountBadge = `<span class="discount-badge">-${discountPercent}%</span>`;
        }
        
        productCard.innerHTML = `
            <div class="product-image-container">
                ${discountBadge}
                <img src="${product.image || '../assets/images/placeholder.png'}" 
                     alt="${product.name}" 
                     class="product-image"
                     onerror="this.src='../assets/images/placeholder.png'">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price-container">
                    <span class="product-price">₹${product.price.toFixed(2)}</span>
                    ${product.originalPrice ? `<span class="product-original-price">₹${product.originalPrice.toFixed(2)}</span>` : ''}
                </div>
                <div class="product-rating">
                    <div class="stars">
                        ${getStarRating(product.rating || 4.5)}
                    </div>
                    <span class="rating-value">${product.rating || 4.5}</span>
                </div>
                <button class="add-to-cart-btn" data-product-id="${product.id}">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        `;
        
        productScroller.appendChild(productCard);
    });
    
    featuredProductsContainer.appendChild(productScroller);
    
    // Add event listeners to product cards
    setupProductCardEvents();
}

// Setup event listeners for product cards
function setupProductCardEvents() {
    const productCards = document.querySelectorAll('.product-card');
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
    
    productCards.forEach(card => {
        card.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            // Redirect to product details page
            window.location.href = `products.html?product=${productId}`;
        });
    });
    
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent card click event
            const productId = this.getAttribute('data-product-id');
            addToCart(productId);
        });
    });
}

// Function to render dummy featured products
function renderDummyFeaturedProducts() {
    const dummyProducts = [
        {
            id: 'product1',
            name: 'Garam Masala',
            price: 120,
            originalPrice: 150,
            image: '../assets/images/garam.jpeg',
            rating: 4.8
        },
        {
            id: 'product2',
            name: 'Chicken Masala',
            price: 99,
            image: '../assets/images/chiken.jpeg',
            rating: 4.5
        },
        {
            id: 'product3',
            name: 'Meat Masala',
            price: 140,
            originalPrice: 175,
            image: '../assets/images/meat.jpeg',
            rating: 4.7
        },
        {
            id: 'product4',
            name: 'Sabji Masala',
            price: 85,
            image: '../assets/images/sabji.jpeg',
            rating: 4.3
        },
        {
            id: 'product5',
            name: 'Chana Masala',
            price: 95,
            image: '../assets/images/chola.jpeg',
            rating: 4.6
        },
        {
            id: 'product6',
            name: 'Paneer Masala',
            price: 110,
            image: '../assets/images/paneer.jpeg',
            rating: 4.9
        }
    ];
    
    renderFeaturedProducts(dummyProducts);
}

// Generate star rating HTML
function getStarRating(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let starsHtml = '';
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star"></i>';
    }
    
    // Add half star if needed
    if (halfStar) {
        starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Add empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star"></i>';
    }
    
    return starsHtml;
}

// Add to cart function
function addToCart(productId) {
    if (!productId) return;
    
    // Get product data
    let productData;
    
    if (window.firebase && firebase.database) {
        firebase.database().ref(`products/${productId}`).once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    productData = {
                        id: snapshot.key,
                        ...snapshot.val()
                    };
                    processAddToCart(productData);
                } else {
                    // If product not found in Firebase, use dummy data
                    const dummyProducts = getDummyProducts();
                    const dummyProduct = dummyProducts.find(p => p.id === productId);
                    if (dummyProduct) {
                        processAddToCart(dummyProduct);
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching product for cart:', error);
                // Use dummy data as fallback
                const dummyProducts = getDummyProducts();
                const dummyProduct = dummyProducts.find(p => p.id === productId);
                if (dummyProduct) {
                    processAddToCart(dummyProduct);
                }
            });
    } else {
        // Use dummy data if Firebase is not available
        const dummyProducts = getDummyProducts();
        const dummyProduct = dummyProducts.find(p => p.id === productId);
        if (dummyProduct) {
            processAddToCart(dummyProduct);
        }
    }
}

// Process adding product to cart
function processAddToCart(product) {
    if (!product) return;
    
    // Get current cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Check if product is already in cart
    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingItemIndex !== -1) {
        // Increase quantity if already in cart
        cart[existingItemIndex].quantity++;
    } else {
        // Add new item to cart
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image || '../assets/images/placeholder.png',
            quantity: 1
        });
    }
    
    // Save cart back to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart UI
    updateCartUI();
    
    // Show success message
    showNotification('Added to cart!');
}

// Update cart UI elements
function updateCartUI() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    
    // Update cart count badges
    const cartCountElements = document.querySelectorAll('.cart-count, .cart-count-nav');
    cartCountElements.forEach(element => {
        element.textContent = cartCount;
        
        if (cartCount > 0) {
            element.classList.add('active');
        } else {
            element.classList.remove('active');
        }
    });
}

// Show notification
function showNotification(message) {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Set message and show notification
    notification.textContent = message;
    notification.classList.add('show');
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Setup general event listeners
function setupEventListeners() {
    // Cart icon click
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
        cartIcon.addEventListener('click', function() {
            openCartModal();
        });
    }
    
    // Cart button in bottom nav
    const cartBtn = document.querySelector('.cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openCartModal();
        });
    }
    
    // Close modal button
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            closeCartModal();
        });
    }
    
    // Checkout button
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            window.location.href = 'checkout.html';
        });
    }
}

// Open cart modal
function openCartModal() {
    const cartModal = document.getElementById('cart-modal');
    if (!cartModal) return;
    
    cartModal.classList.add('active');
    loadCartItems();
}

// Close cart modal
function closeCartModal() {
    const cartModal = document.getElementById('cart-modal');
    if (!cartModal) return;
    
    cartModal.classList.remove('active');
}

// Load cart items
function loadCartItems() {
    const cartItemsContainer = document.querySelector('.cart-items');
    const emptyCart = document.querySelector('.empty-cart');
    const cartTotal = document.querySelector('.total-amount');
    
    if (!cartItemsContainer || !emptyCart || !cartTotal) return;
    
    // Get cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    if (cart.length === 0) {
        // Show empty cart message
        cartItemsContainer.innerHTML = '';
        emptyCart.style.display = 'flex';
        cartTotal.textContent = '₹0.00';
        return;
    }
    
    // Hide empty cart message and show items
    emptyCart.style.display = 'none';
    cartItemsContainer.innerHTML = '';
    
    let totalAmount = 0;
    
    // Create cart item elements
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <h3 class="cart-item-name">${item.name}</h3>
                <div class="cart-item-price">₹${item.price.toFixed(2)}</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn minus" data-id="${item.id}">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn plus" data-id="${item.id}">+</button>
                </div>
            </div>
            <button class="remove-item" data-id="${item.id}">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        cartItemsContainer.appendChild(cartItem);
    });
    
    // Update total amount
    cartTotal.textContent = `₹${totalAmount.toFixed(2)}`;
    
    // Add event listeners to cart item buttons
    addCartItemEventListeners();
}

// Add event listeners to cart item buttons
function addCartItemEventListeners() {
    // Quantity decrease buttons
    const minusButtons = document.querySelectorAll('.quantity-btn.minus');
    minusButtons.forEach(button => {
        button.addEventListener('click', function() {
            const itemId = this.getAttribute('data-id');
            updateCartItemQuantity(itemId, -1);
        });
    });
    
    // Quantity increase buttons
    const plusButtons = document.querySelectorAll('.quantity-btn.plus');
    plusButtons.forEach(button => {
        button.addEventListener('click', function() {
            const itemId = this.getAttribute('data-id');
            updateCartItemQuantity(itemId, 1);
        });
    });
    
    // Remove item buttons
    const removeButtons = document.querySelectorAll('.remove-item');
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const itemId = this.getAttribute('data-id');
            removeCartItem(itemId);
        });
    });
}

// Update cart item quantity
function updateCartItemQuantity(itemId, change) {
    // Get cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Find the item
    const itemIndex = cart.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;
    
    // Update quantity
    cart[itemIndex].quantity += change;
    
    // Remove item if quantity is 0 or less
    if (cart[itemIndex].quantity <= 0) {
        cart.splice(itemIndex, 1);
    }
    
    // Save updated cart
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update UI
    updateCartUI();
    loadCartItems();
}

// Remove cart item
function removeCartItem(itemId) {
    // Get cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Filter out the item to remove
    cart = cart.filter(item => item.id !== itemId);
    
    // Save updated cart
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update UI
    updateCartUI();
    loadCartItems();
}

// Function to check auth state
function checkAuthState() {
    if (window.firebase && firebase.auth) {
        firebase.auth().onAuthStateChanged(function(user) {
            // Update UI based on auth state
            updateAuthUI(user);
        });
    }
}

// Update UI elements based on auth state
function updateAuthUI(user) {
    const profileNavItem = document.querySelector('.nav-item[href="profile.html"]');
    
    if (profileNavItem) {
        if (user) {
            // User is signed in
            profileNavItem.classList.add('logged-in');
        } else {
            // No user is signed in
            profileNavItem.classList.remove('logged-in');
        }
    }
}

// Get dummy products data
function getDummyProducts() {
    return [
        {
            id: 'product1',
            name: 'Garam Masala',
            price: 120,
            originalPrice: 150,
            image: '../assets/images/garam.jpeg',
            rating: 4.8,
            description: 'A blend of ground spices common in Indian cuisine. The mix typically includes coriander, cumin, cardamom, cloves, black pepper, cinnamon, and nutmeg.',
            category: 'blend'
        },
        {
            id: 'product2',
            name: 'Chicken Masala',
            price: 99,
            image: '../assets/images/chiken.jpeg',
            rating: 4.5,
            description: 'A perfect blend of spices specially created to enhance the flavor of chicken dishes. Great for curries, grills, and roasts.',
            category: 'blend'
        },
        {
            id: 'product3',
            name: 'Meat Masala',
            price: 140,
            originalPrice: 175,
            image: '../assets/images/meat.jpeg',
            rating: 4.7,
            description: 'A robust spice blend designed for meat dishes. Adds rich flavor and aroma to lamb, mutton, and beef preparations.',
            category: 'blend'
        },
        {
            id: 'product4',
            name: 'Sabji Masala',
            price: 85,
            image: '../assets/images/sabji.jpeg',
            rating: 4.3,
            description: 'A versatile spice mix perfect for all vegetable dishes. Brings out the natural flavors of vegetables while adding aromatic spice notes.',
            category: 'blend'
        },
        {
            id: 'product5',
            name: 'Chana Masala',
            price: 95,
            image: '../assets/images/chola.jpeg',
            rating: 4.6,
            description: 'A specialty blend for chickpea curry and other legume dishes. Creates the authentic taste of restaurant-style chana masala at home.',
            category: 'blend'
        },
        {
            id: 'product6',
            name: 'Paneer Masala',
            price: 110,
            image: '../assets/images/paneer.jpeg',
            rating: 4.9,
            description: 'A delicate spice blend crafted specifically for paneer (Indian cottage cheese) dishes. Creates rich, flavorful gravies.',
            category: 'blend'
        }
    ];
}

// Initialize cart UI on page load
updateCartUI();
