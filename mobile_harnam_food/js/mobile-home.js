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
    
    // Try to fetch 4 random products from Firebase
    if (window.firebase && firebase.database) {
        const productsRef = firebase.database().ref('products');
        productsRef.once('value')
            .then(snapshot => {
                const allProducts = [];
                snapshot.forEach(childSnapshot => {
                    allProducts.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                // Shuffle and pick 4 random products
                for (let i = allProducts.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [allProducts[i], allProducts[j]] = [allProducts[j], allProducts[i]];
                }
                renderFeaturedProducts(allProducts.slice(0, 4));
            })
            .catch(error => {
                console.error('Error fetching products:', error);
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
    
    // Create a 2x2 grid container
    const grid = document.createElement('div');
    grid.className = 'featured-products-grid';
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.setAttribute('data-product-id', product.id);
        let discountBadge = '';
        // Ensure price and originalPrice are numbers
        let price = Number(product.price);
        if (isNaN(price)) price = 0;
        let originalPrice = Number(product.originalPrice);
        if (isNaN(originalPrice)) originalPrice = null;
        if (originalPrice && originalPrice > price) {
            const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
            discountBadge = `<span class="discount-badge">-${discountPercent}%</span>`;
        }
        let imgSrc = product.imageBase64 || product.image || '../assets/images/placeholder.png';
        productCard.innerHTML = `
            <div class="product-image-container">
                ${discountBadge}
                <img src="${imgSrc}"
                     alt="${product.name}"
                     class="product-image"
                     onerror="this.src='../assets/images/placeholder.png'">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price-container">
                    <span class="product-price">₹${price.toFixed(2)}</span>
                    ${originalPrice ? `<span class="product-original-price">₹${originalPrice.toFixed(2)}</span>` : ''}
                </div>
                <div class="product-rating">
                    <div class="stars">
                        ${getStarRating(product.rating || 4.5)}
                    </div>
                    <span class="rating-value">${product.rating || 4.5}</span>
                </div>
                <div class="product-actions">
                    <button class="add-to-cart-btn" data-product-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                    <button class="view-details-btn" data-product-id="${product.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(productCard);
    });
    featuredProductsContainer.appendChild(grid);
    
    // Add event listeners to product cards
    setupProductCardEvents();
}

// Setup event listeners for product cards
function setupProductCardEvents() {
    const productCards = document.querySelectorAll('.product-card');
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
    const viewDetailsBtns = document.querySelectorAll('.view-details-btn');

    productCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Prevent click if add-to-cart or view-details button is clicked
            if (e.target.closest('.add-to-cart-btn') || e.target.closest('.view-details-btn')) return;
            const productId = this.getAttribute('data-product-id');
            openProductModal(productId);
        });
    });

    // Add event for view details button
    viewDetailsBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const productId = this.getAttribute('data-product-id');
            openProductModal(productId);
        });
    });
// Open product details modal
function openProductModal(productId) {
    // Try to get product data from rendered cards or dummy data
    let productData;
    // Try to get from Firebase if available
    if (window.firebase && firebase.database) {
        firebase.database().ref(`products/${productId}`).once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    productData = { id: snapshot.key, ...snapshot.val() };
                    showProductModal(productData);
                } else {
                    // Fallback to dummy
                    const dummy = getDummyProducts().find(p => p.id === productId);
                    if (dummy) showProductModal(dummy);
                }
            });
    } else {
        const dummy = getDummyProducts().find(p => p.id === productId);
        if (dummy) showProductModal(dummy);
    }
}

function showProductModal(product) {
    if (!product) return;
    const modal = document.getElementById('product-modal');
    if (!modal) return;
    // Ensure modal is always flex and centered
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    // Use same image logic as product card
    let imgSrc = product.imageBase64 || product.image || '../assets/images/placeholder.png';
    const imgEl = modal.querySelector('#modal-product-image');
    imgEl.src = imgSrc;
    imgEl.onerror = function() {
        this.onerror = null;
        this.src = '../assets/images/placeholder.png';
    };
    modal.querySelector('.modal-product-title').textContent = product.name || '';
    modal.querySelector('.modal-product-rating .stars').innerHTML = getStarRating(product.rating || 4.5);
    modal.querySelector('.modal-product-rating .rating-count').textContent = product.rating ? product.rating.toFixed(1) : '4.5';
    let priceNum = Number(product.price);
    modal.querySelector('.modal-product-price').textContent = !isNaN(priceNum) ? `₹${priceNum.toFixed(2)}` : '';
    modal.querySelector('.modal-product-description').textContent = product.description || 'No description available.';
    // Add to cart button
    const addBtn = modal.querySelector('.add-to-cart-btn');
    addBtn.onclick = function(e) {
        e.stopPropagation();
        addToCart(product.id);
        closeProductModal();
    };
    // Show modal
    setTimeout(() => { modal.classList.add('active'); }, 10);
    // Close modal button
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = closeProductModal;
    // Close on outside click
    modal.onclick = function(e) {
        if (e.target === modal) closeProductModal();
    };
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; }, 200);
}
    
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





// Show notification
function showNotification(message) {
    const notification = document.getElementById('notification');
    if (!notification) return;
    notification.innerHTML = `<span>${message}</span><button class="close-btn" aria-label="Close">&times;</button>`;
    notification.style.display = 'flex';
    notification.classList.add('show');
    // Close on button click
    const closeBtn = notification.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.onclick = function() {
            notification.classList.remove('show');
            setTimeout(() => { notification.style.display = 'none'; }, 300);
        };
    }
    // Auto-hide after 2.5s
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => { notification.style.display = 'none'; }, 300);
    }, 2500);
}

// Setup general event listeners
function setupEventListeners() {
    // Set up mobile swipe events for slider
    setupSliderSwipe();
    
    // Set up close buttons for modals
    const closeModalBtns = document.querySelectorAll('.close-modal');
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal.id === 'product-modal') {
                closeProductModal();
            }
        });
    });
    
    // Close modal when clicking outside
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                if (this.id === 'product-modal') {
                    closeProductModal();
                }
            }
        });
    });
    
    // Redirect cart button to cart page
    const cartBtn = document.querySelector('.cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'cart.html';
        });
    }
}

// Setup slider swipe functionality for mobile
function setupSliderSwipe() {
    // This function would contain the logic for setting up mobile swipe events for the slider
    console.log('Slider swipe events setup');
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
