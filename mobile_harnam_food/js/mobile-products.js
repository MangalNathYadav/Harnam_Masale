// =============== This is the Mobile Products JavaScript, where all the product magic happens! ===============
document.addEventListener('DOMContentLoaded', function() {
    // =============== Let's initialize the products and get things rolling ===============
    initializeProducts();

    // =============== If the search and filter bar isn't there, let's slap it in above the products list ===============
    let searchBar = document.getElementById('search-bar-wrap');
    if (!searchBar) {
        // =============== Place the search/filter bar above the products list, because that's where people look first ===============
        const productsContainer = document.getElementById('products-list');
        const bar = document.createElement('div');
        bar.id = 'search-bar-wrap';
        bar.style.display = 'flex';
        bar.style.alignItems = 'center';
        bar.style.gap = '8px';
        bar.style.margin = '16px';
        bar.innerHTML = `
            <div style="display:flex; flex:1; align-items:center; background:#fff; border-radius:20px; box-shadow:0 1px 4px #0001;">
                <input id="search-input" type="text" placeholder="Search products..." style="flex:1; padding:8px 40px 8px 16px; border:none; outline:none; background:transparent; border-radius:20px; font-size:16px;">
                <button id="search-btn" style="background:none; border:none; position:relative; right:36px; z-index:2; cursor:pointer; color:#888; font-size:18px;">
                    <i class="fas fa-search"></i>
                </button>
            </div>
            <button id="filter-btn" style="background:#f44336; border:none; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; margin-left:8px; cursor:pointer; color:#fff; font-size:20px;">
                <i class="fas fa-sliders-h"></i>
            </button>
        `;
        if (productsContainer && productsContainer.parentNode) {
            productsContainer.parentNode.insertBefore(bar, productsContainer);
        } else {
            document.body.prepend(bar);
        }
    }

    // =============== Setting up search and filter functionality, so users can find their masala fast ===============
    setupSearchAndFilter();

    // =============== Handle product details and cart actions, because shopping should be easy ===============
    setupProductActions();
});

// =============== Initialize products, let's get those masale on the screen! ===============
function initializeProducts() {
    // =============== Get products container, where all the magic happens ===============
    const productsContainer = document.getElementById('products-list');
    if (!productsContainer) return;
    
    // =============== Show loading state, so users know we're working on it ===============
    productsContainer.innerHTML = `
        <div class="loading-container">
            <div class="loader"></div>
            <p>Loading products...</p>
        </div>
    `;
    
    // =============== Try to fetch products from Firebase, fingers crossed for a good connection ===============
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
        // =============== If Firebase is not available, render dummy products after a delay, gotta show something! ===============
        setTimeout(() => {
            renderDummyProducts();
        }, 1000);
    }
}

// Render products to the grid
function renderProducts(products) {
    const productsContainer = document.getElementById('products-list');
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
    
    // Render each product in the new mobile card layout
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.setAttribute('data-product-id', product.id);
        productCard.setAttribute('data-category', product.category || 'all');
        // Use same image logic as home page
        let imgSrc = product.imageBase64 || product.image || '../assets/images/placeholder.png';
        productCard.innerHTML = `
            <div class="product-img-wrap">
                <img src="${imgSrc}" alt="${product.name}" class="product-img" onerror="this.onerror=null;this.src='../assets/images/placeholder.png'">
            </div>
            <div class="product-info">
                <div class="product-title">${product.name}</div>
                <div class="product-desc">${product.description || 'No description available'}</div>
                <div class="product-meta">
                    <span class="product-badge">${product.stock && product.stock < 5 ? `Only ${product.stock} left` : 'In Stock'}</span>
                    ${product.offer ? `<span class="product-offer">${product.offer}</span>` : ''}
                </div>
                <div class="product-action">
                    <div class="product-price">₹${product.price ? product.price.toLocaleString('en-IN') : 'N/A'}</div>
                    <div class="action-buttons">
                        <button class="add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
                        <button class="view-details-btn" data-product-id="${product.id}">View Details</button>
                    </div>
                </div>
            </div>
        `;
        productsContainer.appendChild(productCard);
    });
    
    // Add event listeners to the product cards
    setupProductCardEvents();
}

// Update the setupProductCardEvents function
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
        const addCartBtn = card.querySelector('.add-to-cart-btn');
        if (addCartBtn) {
            addCartBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                e.preventDefault();
                const productId = addCartBtn.getAttribute('data-product-id');
                
                try {
                    if (window.firebase && firebase.auth().currentUser) {
                        const snapshot = await firebase.database().ref(`products/${productId}`).once('value');
                        if (snapshot.exists()) {
                            const product = {
                                id: snapshot.key,
                                ...snapshot.val()
                            };
                            
                            const user = firebase.auth().currentUser;
                            const cartRef = firebase.database().ref(`users/${user.uid}/cart`);
                            const cartSnapshot = await cartRef.once('value');
                            let cart = cartSnapshot.val() || [];
                            
                            if (!Array.isArray(cart)) {
                                cart = Object.values(cart);
                            }
                            
                            // Check if product already exists in cart
                            const existingItem = cart.find(item => item.id === productId);
                            
                            if (existingItem) {
                                existingItem.quantity = (existingItem.quantity || 1) + 1;
                            } else {
                                cart.push({
                                    id: product.id,
                                    name: product.name,
                                    price: product.price,
                                    image: product.image || product.imageBase64 || '../assets/images/placeholder.png',
                                    quantity: 1
                                });
                            }
                            
                            await cartRef.set(cart);
                            showNotification('Added to cart!', 'success');
                        }
                    } else {
                        // Show login prompt for guest users
                        showLoginPrompt('cart');
                    }
                } catch (error) {
                    console.error('Error adding to cart:', error);
                    showNotification('Failed to add item to cart', 'error');
                }
            });
        }
        
        // Card click
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
                <div class="product-detail">
                    <img src="" alt="Product" class="modal-product-image" id="modal-product-image">
                    <div class="modal-product-info">
                        <h2 class="modal-product-title"></h2>
                        <div class="modal-product-rating">
                            <div class="stars"></div>
                            <span class="rating-count"></span>
                        </div>
                        <div class="modal-product-price"></div>
                        <p class="modal-product-description"></p>
                        <div class="modal-product-quantity">
                            <span>Quantity:</span>
                            <div class="quantity-control">
                                <button class="quantity-btn decrease">-</button>
                                <input type="number" class="quantity-input" value="1" min="1" max="10">
                                <button class="quantity-btn increase">+</button>
                            </div>
                        </div>
                        <button class="add-to-cart-btn" data-product-id="">Add to Cart</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(productModal);
    }

    // Flex centering for modal
    productModal.style.display = 'flex';
    productModal.style.alignItems = 'center';
    productModal.style.justifyContent = 'center';

    // Fill modal content
    let imgSrc = product.imageBase64 || product.image || '../assets/images/placeholder.png';
    const imgEl = productModal.querySelector('#modal-product-image');
    imgEl.src = imgSrc;
    imgEl.onerror = function() {
        this.onerror = null;
        this.src = '../assets/images/placeholder.png';
    };
    productModal.querySelector('.modal-product-title').textContent = product.name || '';
    productModal.querySelector('.modal-product-rating .stars').innerHTML = getStarRating(product.rating || 4.5);
    productModal.querySelector('.modal-product-rating .rating-count').textContent = product.rating ? product.rating.toFixed(1) : '4.5';
    let priceNum = Number(product.price);
    productModal.querySelector('.modal-product-price').textContent = !isNaN(priceNum) ? `₹${priceNum.toFixed(2)}` : '';
    productModal.querySelector('.modal-product-description').textContent = product.description || 'No description available.';
    // Add to cart button
    const addBtn = productModal.querySelector('.add-to-cart-btn');
    addBtn.setAttribute('data-product-id', product.id);
    addBtn.onclick = function(e) {
        e.stopPropagation();
        addToCart(product.id);
        closeProductModal();
    };

    // Setup quantity plus/minus controls
    setupModalControls(productModal, product);

    // Show modal
    setTimeout(() => { productModal.classList.add('active'); }, 10);
    // Close modal button
    const closeBtn = productModal.querySelector('.close-modal');
    closeBtn.onclick = closeProductModal;
    // Close on outside click
    productModal.onclick = function(e) {
        if (e.target === productModal) closeProductModal();
    };
}

// Setup controls for product modal
function setupModalControls(modal, product) {
    const decreaseBtn = modal.querySelector('.minus');
    const increaseBtn = modal.querySelector('.plus');
    const quantityInput = modal.querySelector('.quantity-input');
    const addToCartBtn = modal.querySelector('.add-to-cart-btn');

    // Remove previous listeners by cloning
    const newDecreaseBtn = decreaseBtn.cloneNode(true);
    decreaseBtn.parentNode.replaceChild(newDecreaseBtn, decreaseBtn);
    const newIncreaseBtn = increaseBtn.cloneNode(true);
    increaseBtn.parentNode.replaceChild(newIncreaseBtn, increaseBtn);
    const newQuantityInput = quantityInput.cloneNode(true);
    quantityInput.parentNode.replaceChild(newQuantityInput, quantityInput);
    const newAddToCartBtn = addToCartBtn.cloneNode(true);
    addToCartBtn.parentNode.replaceChild(newAddToCartBtn, addToCartBtn);

    // Quantity controls
    newDecreaseBtn.addEventListener('click', () => {
        let qty = parseInt(newQuantityInput.value);
        if (qty > 1) {
            newQuantityInput.value = qty - 1;
        }
    });

    newIncreaseBtn.addEventListener('click', () => {
        let qty = parseInt(newQuantityInput.value);
        if (qty < 10) {
            newQuantityInput.value = qty + 1;
        }
    });

    // Validate input
    newQuantityInput.addEventListener('change', () => {
        let qty = parseInt(newQuantityInput.value);
        if (isNaN(qty) || qty < 1) {
            newQuantityInput.value = 1;
        } else if (qty > 10) {
            newQuantityInput.value = 10;
        }
    });

    // View product details in products page
    newAddToCartBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        const quantity = parseInt(newQuantityInput.value) || 1;
        if (window.firebase && firebase.auth().currentUser) {
            try {
                const snapshot = await firebase.database().ref(`products/${product.id}`).once('value');
                if (snapshot.exists()) {
                    const user = firebase.auth().currentUser;
                    const cartRef = firebase.database().ref(`users/${user.uid}/cart`);
                    const cartSnapshot = await cartRef.once('value');
                    let cart = cartSnapshot.val() || [];
                    if (!Array.isArray(cart)) {
                        cart = Object.values(cart);
                    }
                    // Check if product already exists in cart
                    const existingItem = cart.find(item => item.id === product.id);
                    if (existingItem) {
                        existingItem.quantity = (existingItem.quantity || 1) + quantity;
                    } else {
                        cart.push({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            image: product.image || product.imageBase64 || '../assets/images/placeholder.png',
                            quantity: quantity
                        });
                    }
                    await cartRef.set(cart);
                    showNotification('Added to cart!', 'success');
                }
            } catch (error) {
                console.error('Error adding to cart:', error);
                showNotification('Failed to add item to cart', 'error');
            }
        } else {
            showLoginPrompt('cart');
        }
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

// View product details - removed cart functionality
function viewProductDetails(productId) {
    // This function can be used if we need to handle product details viewing separately
    openProductModal(productId);
}

// Show detailed product information
function showProductDetails(product) {
    // For future implementation to show more detailed product information
    console.log("Showing detailed product view for:", product.name);
}

// Setup search and filter functionality
function setupSearchAndFilter() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const filterBtn = document.getElementById('filter-btn');

    // Search functionality: filter as you type
    if (searchInput) {
        searchInput.addEventListener('input', () => {
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
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            const searchTerm = searchInput.value.toLowerCase().trim();
            filterProducts(searchTerm);
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
        // Use .product-title and .product-desc for name/desc
        const productName = card.querySelector('.product-title')?.textContent.toLowerCase() || '';
        const productDesc = card.querySelector('.product-desc')?.textContent.toLowerCase() || '';
        if (productName.includes(searchTerm) || productDesc.includes(searchTerm) || searchTerm === '') {
            card.style.display = 'flex';
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
                <div class="filter-section">
                    <h3>Rating</h3>
                    <div class="filter-ratings">
                        <div class="filter-rating">
                            <input type="radio" name="rating" id="rating-all" value="all" checked>
                            <label for="rating-all">All Ratings</label>
                        </div>
                        <div class="filter-rating">
                            <input type="radio" name="rating" id="rating-4" value="4">
                            <label for="rating-4">4★ & above</label>
                        </div>
                        <div class="filter-rating">
                            <input type="radio" name="rating" id="rating-3" value="3">
                            <label for="rating-3">3★ & above</label>
                        </div>
                        <div class="filter-rating">
                            <input type="radio" name="rating" id="rating-2" value="2">
                            <label for="rating-2">2★ & above</label>
                        </div>
                    </div>
                </div>
                <div class="filter-section">
                    <h3>Other Filters</h3>
                    <div class="filter-checkboxes">
                        <label><input type="checkbox" id="in-stock-only"> In Stock Only</label><br>
                        <label><input type="checkbox" id="offers-only"> Offers/Discounts Only</label>
                    </div>
                </div>
                <div class="filter-section">
                    <h3>Sort By</h3>
                    <select id="sort-by" style="width:100%;padding:8px;border-radius:6px;">
                        <option value="default">Default</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="rating-desc">Rating: High to Low</option>
                    </select>
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


function setupFilterControls(modal) {
    const resetBtn = modal.querySelector('#reset-filters');
    const applyBtn = modal.querySelector('#apply-filters');

    resetBtn.addEventListener('click', () => {
        // Reset category selection
        const allCategoryRadio = document.getElementById('category-all');
        if (allCategoryRadio) allCategoryRadio.checked = true;
        // Reset price range
        const minPriceInput = document.getElementById('min-price');
        const maxPriceInput = document.getElementById('max-price');
        if (minPriceInput) minPriceInput.value = 0;
        if (maxPriceInput) maxPriceInput.value = 1000;
        // Reset rating
        const ratingAll = document.getElementById('rating-all');
        if (ratingAll) ratingAll.checked = true;
        // Reset checkboxes
        const inStockOnly = document.getElementById('in-stock-only');
        const offersOnly = document.getElementById('offers-only');
        if (inStockOnly) inStockOnly.checked = false;
        if (offersOnly) offersOnly.checked = false;
        // Reset sort
        const sortBy = document.getElementById('sort-by');
        if (sortBy) sortBy.value = 'default';
        // Show all products again
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            card.style.display = 'flex';
        });
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
        // Add more filter logic here if needed (rating, stock, offers, etc.)
        const categoryMatch = category === 'all' || productCategory === category;
        const priceMatch = productPrice >= minPrice && productPrice <= maxPrice;
        if (categoryMatch && priceMatch) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// Update category filters based on available products
function updateCategoryFilters(products) {
    // Fixed categories to always show
    const fixedCategories = [
        { value: 'all', label: 'All Categories' },
        { value: 'blends', label: 'Blends' },
        { value: 'veg', label: 'Veg' },
        { value: 'non-veg', label: 'Non-Veg' }
    ];

    // Extract unique categories from products (excluding fixed ones)
    const categories = new Set();
    products.forEach(product => {
        if (product.category && !fixedCategories.some(cat => cat.value === product.category)) {
            categories.add(product.category);
        }
    });

    // Add categories to filter modal
    const categoriesContainer = document.getElementById('filter-categories');
    if (categoriesContainer) {
        // Clear previous categories except 'all'
        categoriesContainer.innerHTML = '';
        // Add fixed categories
        fixedCategories.forEach(cat => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'filter-category';
            categoryElement.innerHTML = `
                <input type="radio" name="category" id="category-${cat.value}" value="${cat.value}"${cat.value === 'all' ? ' checked' : ''}>
                <label for="category-${cat.value}">${cat.label}</label>
            `;
            categoriesContainer.appendChild(categoryElement);
        });
        // Add dynamic categories
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

// Add notification function if not exists
function showNotification(message, type = 'success') {
    let notification = document.querySelector('.notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Add login prompt function if not exists
function showLoginPrompt(redirectTo) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'login-prompt';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Please Login</h2>
            <p>You need to be logged in to add items to cart.</p>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="window.location.href='login.html?redirect=${redirectTo}'">Login</button>
                <button class="btn btn-outline" onclick="this.closest('.modal').remove()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}
