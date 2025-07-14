// Mobile Products JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize products
    initializeProducts();
    
    // Set up search and filter functionality
    setupSearchAndFilter();
    
    // Handle product details and cart actions
    setupProductActions();
});

// Initialize products
function initializeProducts() {
    // Get products container
    const productsContainer = document.getElementById('products-grid');
    if (!productsContainer) return;
    
    // Show loading state
    productsContainer.innerHTML = `
        <div class="loading-container">
            <div class="loader"></div>
            <p>Loading products...</p>
        </div>
    `;
    
    // Try to fetch products from Firebase
    if (window.firebase && firebase.database) {
        const productsRef = firebase.database().ref('products');
        
        productsRef.once('value')
            .then(snapshot => {
                const products = [];
                snapshot.forEach(childSnapshot => {
                    products.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                
                renderProducts(products);
                updateCategoryFilters(products);
            })
            .catch(error => {
                console.error('Error fetching products:', error);
                renderDummyProducts();
            });
    } else {
        // If Firebase is not available, render dummy products after a delay
        setTimeout(() => {
            renderDummyProducts();
        }, 1000);
    }
}

// Render products to the grid
function renderProducts(products) {
    const productsContainer = document.getElementById('products-grid');
    if (!productsContainer) return;
    
    // Clear the container
    productsContainer.innerHTML = '';
    
    if (products.length === 0) {
        productsContainer.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <p>No products found. Try adjusting your filters.</p>
            </div>
        `;
        return;
    }
    
    // Render each product
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.setAttribute('data-product-id', product.id);
        productCard.setAttribute('data-category', product.category || 'all');
        
        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${product.image || '../assets/images/placeholder.png'}" 
                     alt="${product.name}" 
                     class="product-image"
                     onerror="this.src='../assets/images/placeholder.png'">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description || 'No description available'}</p>
                <div class="product-price">₹${product.price.toFixed(2)}</div>
                <div class="product-rating">
                    <div class="stars">
                        ${getStarRating(product.rating || 4.5)}
                    </div>
                    <span class="rating-value">${product.rating || 4.5}</span>
                </div>
                <div class="product-actions">
                    <button class="add-cart-btn" data-product-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i>
                        Add to Cart
                    </button>
                    <button class="view-details-btn" data-product-id="${product.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `;
        
        productsContainer.appendChild(productCard);
    });
    
    // Add event listeners to the product cards
    setupProductCardEvents();
}

// Setup events for product cards
function setupProductCardEvents() {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        // View details
        const viewDetailsBtn = card.querySelector('.view-details-btn');
        if (viewDetailsBtn) {
            viewDetailsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = viewDetailsBtn.getAttribute('data-product-id');
                openProductModal(productId);
            });
        }
        
        // Add to cart
        const addCartBtn = card.querySelector('.add-cart-btn');
        if (addCartBtn) {
            addCartBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = addCartBtn.getAttribute('data-product-id');
                addToCart(productId);
            });
        }
        
        // Entire card click
        card.addEventListener('click', () => {
            const productId = card.getAttribute('data-product-id');
            openProductModal(productId);
        });
    });
}

// Open product details modal
function openProductModal(productId) {
    // Get product data
    let product;
    
    if (window.firebase && firebase.database) {
        // Fetch from Firebase
        firebase.database().ref(`products/${productId}`).once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    product = {
                        id: snapshot.key,
                        ...snapshot.val()
                    };
                    createAndShowProductModal(product);
                } else {
                    // Product not found
                    const dummyProduct = getDummyProductById(productId);
                    createAndShowProductModal(dummyProduct);
                }
            })
            .catch(error => {
                console.error('Error fetching product:', error);
                const dummyProduct = getDummyProductById(productId);
                createAndShowProductModal(dummyProduct);
            });
    } else {
        // Use dummy products
        const dummyProduct = getDummyProductById(productId);
        createAndShowProductModal(dummyProduct);
    }
}

// Create and show product modal
function createAndShowProductModal(product) {
    if (!product) return;
    
    // Create modal if it doesn't exist
    let productModal = document.getElementById('product-modal');
    
    if (!productModal) {
        productModal = document.createElement('div');
        productModal.className = 'modal';
        productModal.id = 'product-modal';
        
        productModal.innerHTML = `
            <div class="modal-content">
                <button class="close-modal">&times;</button>
                <div class="product-detail"></div>
            </div>
        `;
        
        document.body.appendChild(productModal);
        
        // Add close functionality
        const closeBtn = productModal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            closeProductModal();
        });
        
        // Close when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target == productModal) {
                closeProductModal();
            }
        });
    }
    
    // Update modal content
    const productDetailContainer = productModal.querySelector('.product-detail');
    
    productDetailContainer.innerHTML = `
        <img src="${product.image || '../assets/images/placeholder.png'}" 
             alt="${product.name}" 
             class="modal-product-image"
             onerror="this.src='../assets/images/placeholder.png'">
        <h2 class="modal-product-title">${product.name}</h2>
        <div class="modal-product-rating">
            <div class="stars">
                ${getStarRating(product.rating || 4.5)}
            </div>
            <span class="rating-value">${product.rating || 4.5}</span>
        </div>
        <div class="modal-product-price">₹${product.price.toFixed(2)}</div>
        <p class="modal-product-description">${product.description || 'No description available.'}</p>
        
        <div class="modal-product-quantity">
            <span>Quantity:</span>
            <div class="quantity-control">
                <button class="quantity-btn decrease">-</button>
                <input type="number" class="quantity-input" value="1" min="1" max="10">
                <button class="quantity-btn increase">+</button>
            </div>
        </div>
        
        <button class="add-to-cart-btn" data-product-id="${product.id}">
            <i class="fas fa-shopping-cart"></i> Add to Cart
        </button>
    `;
    
    // Show the modal
    productModal.style.display = 'block';
    setTimeout(() => {
        productModal.classList.add('show');
    }, 10);
    
    // Add event listeners to the modal controls
    setupModalControls(productModal, product);
}

// Setup controls for product modal
function setupModalControls(modal, product) {
    const decreaseBtn = modal.querySelector('.decrease');
    const increaseBtn = modal.querySelector('.increase');
    const quantityInput = modal.querySelector('.quantity-input');
    const addToCartBtn = modal.querySelector('.add-to-cart-btn');
    
    // Quantity controls
    decreaseBtn.addEventListener('click', () => {
        let qty = parseInt(quantityInput.value);
        if (qty > 1) {
            quantityInput.value = qty - 1;
        }
    });
    
    increaseBtn.addEventListener('click', () => {
        let qty = parseInt(quantityInput.value);
        if (qty < 10) {
            quantityInput.value = qty + 1;
        }
    });
    
    // Validate input
    quantityInput.addEventListener('change', () => {
        let qty = parseInt(quantityInput.value);
        if (isNaN(qty) || qty < 1) {
            quantityInput.value = 1;
        } else if (qty > 10) {
            quantityInput.value = 10;
        }
    });
    
    // Add to cart
    addToCartBtn.addEventListener('click', () => {
        const quantity = parseInt(quantityInput.value);
        
        // Add product to cart with quantity
        if (window.HarnamCart && typeof window.HarnamCart.addToCart === 'function') {
            window.HarnamCart.addToCart(product, quantity);
        } else {
            // Fallback for demo
            console.log(`Added ${quantity} of ${product.name} to cart`);
            
            // Show notification
            if (window.showNotification) {
                window.showNotification(`${quantity} ${product.name} added to cart!`);
            }
        }
        
        // Close the modal
        closeProductModal();
    });
}

// Close product modal
function closeProductModal() {
    const productModal = document.getElementById('product-modal');
    if (productModal) {
        productModal.classList.remove('show');
        setTimeout(() => {
            productModal.style.display = 'none';
        }, 300);
    }
}

// Add product to cart
function addToCart(productId) {
    let product;
    
    // Find product data
    if (window.firebase && firebase.database) {
        firebase.database().ref(`products/${productId}`).once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    product = {
                        id: snapshot.key,
                        ...snapshot.val()
                    };
                    addProductToCart(product);
                } else {
                    const dummyProduct = getDummyProductById(productId);
                    addProductToCart(dummyProduct);
                }
            })
            .catch(error => {
                console.error('Error fetching product:', error);
                const dummyProduct = getDummyProductById(productId);
                addProductToCart(dummyProduct);
            });
    } else {
        // Use dummy products
        const dummyProduct = getDummyProductById(productId);
        addProductToCart(dummyProduct);
    }
}

// Add product to cart with quantity
function addProductToCart(product, quantity = 1) {
    if (!product) return;
    
    // Add product to cart
    if (window.HarnamCart && typeof window.HarnamCart.addToCart === 'function') {
        window.HarnamCart.addToCart(product, quantity);
    } else {
        // Fallback for demo
        console.log(`Added ${quantity} of ${product.name} to cart`);
    }
    
    // Show notification
    if (window.showNotification) {
        window.showNotification(`${product.name} added to cart!`);
    }
}

// Setup search and filter functionality
function setupSearchAndFilter() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const filterBtn = document.getElementById('filter-btn');
    
    // Search functionality
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            const searchTerm = searchInput.value.toLowerCase().trim();
            filterProducts(searchTerm);
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = searchInput.value.toLowerCase().trim();
                filterProducts(searchTerm);
            }
        });
    }
    
    // Filter modal
    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            openFilterModal();
        });
    }
}

// Filter products by search term
function filterProducts(searchTerm) {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const productName = card.querySelector('.product-name').textContent.toLowerCase();
        const productDesc = card.querySelector('.product-description').textContent.toLowerCase();
        
        if (productName.includes(searchTerm) || productDesc.includes(searchTerm) || searchTerm === '') {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Open filter modal
function openFilterModal() {
    // Create filter modal if it doesn't exist
    let filterModal = document.getElementById('filter-modal');
    
    if (!filterModal) {
        filterModal = document.createElement('div');
        filterModal.className = 'modal';
        filterModal.id = 'filter-modal';
        
        filterModal.innerHTML = `
            <div class="modal-content">
                <button class="close-modal">&times;</button>
                <h2>Filter Products</h2>
                
                <div class="filter-section">
                    <h3>Categories</h3>
                    <div class="filter-categories" id="filter-categories">
                        <div class="filter-category">
                            <input type="radio" name="category" id="category-all" value="all" checked>
                            <label for="category-all">All Categories</label>
                        </div>
                    </div>
                </div>
                
                <div class="filter-section">
                    <h3>Price Range</h3>
                    <div class="price-range">
                        <div class="price-inputs">
                            <div class="price-input">
                                <label for="min-price">Min</label>
                                <input type="number" id="min-price" min="0" value="0">
                            </div>
                            <div class="price-input">
                                <label for="max-price">Max</label>
                                <input type="number" id="max-price" min="0" value="1000">
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="filter-buttons">
                    <button class="btn btn-cancel" id="reset-filters">Reset</button>
                    <button class="btn" id="apply-filters">Apply Filters</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(filterModal);
        
        // Add close functionality
        const closeBtn = filterModal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            closeFilterModal();
        });
        
        // Close when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target == filterModal) {
                closeFilterModal();
            }
        });
        
        // Add event listeners to filter controls
        setupFilterControls(filterModal);
    }
    
    // Show the modal
    filterModal.style.display = 'block';
    setTimeout(() => {
        filterModal.classList.add('show');
    }, 10);
}

// Setup controls for filter modal
function setupFilterControls(modal) {
    const resetBtn = modal.querySelector('#reset-filters');
    const applyBtn = modal.querySelector('#apply-filters');
    
    resetBtn.addEventListener('click', () => {
        // Reset category selection
        const allCategoryRadio = document.getElementById('category-all');
        if (allCategoryRadio) {
            allCategoryRadio.checked = true;
        }
        
        // Reset price range
        const minPriceInput = document.getElementById('min-price');
        const maxPriceInput = document.getElementById('max-price');
        
        if (minPriceInput) minPriceInput.value = 0;
        if (maxPriceInput) maxPriceInput.value = 1000;
    });
    
    applyBtn.addEventListener('click', () => {
        // Get selected category
        const selectedCategory = document.querySelector('input[name="category"]:checked').value;
        
        // Get price range
        const minPrice = parseFloat(document.getElementById('min-price').value) || 0;
        const maxPrice = parseFloat(document.getElementById('max-price').value) || 1000;
        
        // Apply filters
        applyFilters(selectedCategory, minPrice, maxPrice);
        
        // Close modal
        closeFilterModal();
    });
}

// Close filter modal
function closeFilterModal() {
    const filterModal = document.getElementById('filter-modal');
    if (filterModal) {
        filterModal.classList.remove('show');
        setTimeout(() => {
            filterModal.style.display = 'none';
        }, 300);
    }
}

// Apply filters to products
function applyFilters(category, minPrice, maxPrice) {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const productCategory = card.getAttribute('data-category');
        const productPrice = parseFloat(card.querySelector('.product-price').textContent.replace('₹', ''));
        
        const categoryMatch = category === 'all' || productCategory === category;
        const priceMatch = productPrice >= minPrice && productPrice <= maxPrice;
        
        if (categoryMatch && priceMatch) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Update category filters based on available products
function updateCategoryFilters(products) {
    const categories = new Set();
    
    // Extract unique categories
    products.forEach(product => {
        if (product.category) {
            categories.add(product.category);
        }
    });
    
    // Add categories to filter modal
    const categoriesContainer = document.getElementById('filter-categories');
    
    if (categoriesContainer) {
        categories.forEach(category => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'filter-category';
            
            categoryElement.innerHTML = `
                <input type="radio" name="category" id="category-${category}" value="${category}">
                <label for="category-${category}">${capitalizeFirstLetter(category)}</label>
            `;
            
            categoriesContainer.appendChild(categoryElement);
        });
    }
}

// Setup product action buttons
function setupProductActions() {
    // This will be called when adding the event listeners in renderProducts
}

// Helper function to generate star rating HTML
function getStarRating(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let stars = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    // Half star
    if (halfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

// Capitalize first letter of each word
function capitalizeFirstLetter(string) {
    return string.replace(/\b\w/g, l => l.toUpperCase());
}

// Render dummy products when Firebase is not available
function renderDummyProducts() {
    const dummyProducts = getDummyProducts();
    renderProducts(dummyProducts);
    updateCategoryFilters(dummyProducts);
}

// Get dummy product by ID
function getDummyProductById(productId) {
    const dummyProducts = getDummyProducts();
    return dummyProducts.find(p => p.id === productId) || dummyProducts[0];
}

// Get dummy products data
function getDummyProducts() {
    return [
        {
            id: 'product1',
            name: 'Garam Masala',
            description: 'A premium blend of aromatic spices for Indian curries.',
            price: 120,
            rating: 4.8,
            image: '../assets/images/garam.jpeg',
            category: 'blends'
        },
        {
            id: 'product2',
            name: 'Chicken Masala',
            description: 'Perfect blend for delicious chicken dishes.',
            price: 150,
            rating: 4.9,
            image: '../assets/images/chiken.jpeg',
            category: 'non-veg'
        },
        {
            id: 'product3',
            name: 'Paneer Masala',
            description: 'Special blend for vegetarian paneer dishes.',
            price: 140,
            rating: 4.7,
            image: '../assets/images/paneer.jpeg',
            category: 'veg'
        },
        {
            id: 'product4',
            name: 'Chole Masala',
            description: 'Traditional spice mix for chickpea curry.',
            price: 110,
            rating: 4.6,
            image: '../assets/images/chola.jpeg',
            category: 'veg'
        },
        {
            id: 'product5',
            name: 'Sabji Masala',
            description: 'Versatile blend for all vegetable dishes.',
            price: 100,
            rating: 4.5,
            image: '../assets/images/sabji.jpeg',
            category: 'veg'
        },
        {
            id: 'product6',
            name: 'Meat Masala',
            description: 'Rich blend for meat dishes with intense flavor.',
            price: 160,
            rating: 4.7,
            image: '../assets/images/meat.jpeg',
            category: 'non-veg'
        }
    ];
}
