// Products page specific functionality

// Global products array to store fetched products
let productsData = [];

document.addEventListener('DOMContentLoaded', function() {
    // Initialize product page features
    initializeProductPage();
    
    // Fetch products from Firebase
    fetchProducts();
    
    // Initialize cart functionality - Use setTimeout to ensure cart.js is fully loaded first
    setTimeout(async () => {
        if (typeof window.HarnamCart !== 'undefined') {
            console.log('Initializing cart on Products page');
            
            try {
                // Simply use the global cart initialization - this will ensure consistency
                await window.HarnamCart.initializeCart();
                console.log('Cart initialized with', window.HarnamCart.getCart().length, 'items');
                
                // Setup cart buttons for products after ensuring cart is loaded
                setupCartButtonsOnProductPage();
                
                // Add cart button to navigation
                window.HarnamCart.addCartButton();
                
                // Update cart count based on stored data
                window.HarnamCart.updateCartCount();
                
                console.log('Cart system initialized on Products page');
            } catch (error) {
                console.error('Error initializing cart:', error);
                
                // Fallback - try basic initialization
                if (window.HarnamCart.addCartButton && window.HarnamCart.updateCartCount) {
                    window.HarnamCart.addCartButton();
                    window.HarnamCart.updateCartCount();
                }
            }
        } else {
            console.error('HarnamCart not available - make sure cart.js is loaded before products.js');
        }
    }, 300); // Reduced delay as we're using a more reliable approach
    
    // Ensure auth UI is correctly displayed
    if (typeof window.HarnamAuth !== 'undefined' && typeof window.HarnamAuth.refreshAuthUI === 'function') {
        const isLoggedIn = window.HarnamAuth.refreshAuthUI();
        console.log('Auth UI refreshed on Products page, logged in:', isLoggedIn);
    }
});

// Function to fetch products from Firebase
function fetchProducts() {
    try {
        // Check if Firebase is initialized and database is available
        if (isFirebaseAvailable()) {
            console.log('Fetching products from Firebase...');
            const productGrid = document.getElementById('product-grid');
            
            // Show loading state
            productGrid.innerHTML = `
                <div class="loading-container">
                    <div class="loader"></div>
                    <p>Loading products...</p>
                </div>
            `;
            
            // Get database reference
            const database = firebase.database();
            
            // Set a timeout for the fetch operation
            const fetchTimeout = setTimeout(() => {
                console.warn('Firebase fetch timeout - using fallback products');
                productsData = createPlaceholderProducts();
                renderProducts();
            }, 10000); // 10 second timeout
            
            // Fetch products from the products node
            database.ref('products').orderByChild('displayOrder').once('value')
                .then(snapshot => {
                    // Clear the timeout as we got a response
                    clearTimeout(fetchTimeout);
                    
                    console.log('Products data received:', snapshot.exists() ? 'Data exists' : 'No data');
                    
                    // Clear products array
                    productsData = [];
                    
                    // Check if data exists
                    if (snapshot.exists()) {
                        // Process products data
                        snapshot.forEach(productSnapshot => {
                            const product = productSnapshot.val();
                            product.id = productSnapshot.key;
                            
                            // Process image - if image is a base64 string, use it directly
                            // Otherwise, if it's a URL, keep it as is
                            // imageBase64 field takes precedence over image field
                            if (product.imageBase64) {
                                // Already have base64 data
                                product.image = product.imageBase64;
                            } else if (product.image && product.image.startsWith('data:image')) {
                                // Image is already in base64 format
                                product.imageBase64 = product.image;
                            } else if (!product.image) {
                                // No image available, use placeholder
                                product.image = '../assets/images/placeholder.png';
                            }
                            
                            // Ensure required fields exist
                            if (!product.price) product.price = "0.00";
                            if (!product.name) product.name = "Untitled Product";
                            if (!product.description) product.description = "No description available.";
                            
                            productsData.push(product);
                        });
                        
                        console.log(`Loaded ${productsData.length} products from Firebase`);
                        
                        // If no products were found, use placeholders
                        if (productsData.length === 0) {
                            console.log('No products found in database, using placeholders');
                            productsData = createPlaceholderProducts();
                        }
                        
                        // Render products
                        renderProducts();
                    } else {
                        console.log('No products found in database, using placeholders');
                        // Use placeholder products instead of showing an empty state
                        productsData = createPlaceholderProducts();
                        renderProducts();
                    }
                })
                .catch(error => {
                    // Clear the timeout as we got a response (error)
                    clearTimeout(fetchTimeout);
                    
                    console.error('Error fetching products:', error);
                    // Use placeholder products
                    console.log('Using placeholder products due to fetch error');
                    productsData = createPlaceholderProducts();
                    renderProducts();
                });
        } else {
            console.error('Firebase not initialized or database not available');
            // Use placeholder products
            console.log('Firebase not available, using placeholder products');
            productsData = createPlaceholderProducts();
            renderProducts();
        }
    } catch (error) {
        console.error('Error in fetchProducts:', error);
        // Handle error gracefully - use placeholder products
        productsData = createPlaceholderProducts();
        renderProducts();
    }
}

// Function to render products in the grid
function renderProducts() {
    const productGrid = document.getElementById('product-grid');
    
    // Clear the grid first
    productGrid.innerHTML = '';
    
    if (productsData.length === 0) {
        productGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <p>No products available</p>
            </div>
        `;
        return;
    }
    
    // Sort products by displayOrder if available, otherwise by name
    productsData.sort((a, b) => {
        // If both have displayOrder, sort by that
        if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
            return a.displayOrder - b.displayOrder;
        }
        // If only one has displayOrder, put the one with displayOrder first
        else if (a.displayOrder !== undefined) {
            return -1;
        }
        else if (b.displayOrder !== undefined) {
            return 1;
        }
        // Otherwise sort by name
        else {
            return a.name.localeCompare(b.name);
        }
    });
    
    // Create product cards for each product
    productsData.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card animate-on-scroll';
        productCard.dataset.id = product.id;
        if (product.category) {
            productCard.dataset.category = product.category;
        }
        
        // Get image URL (prioritize imageBase64, then image, then fallback to placeholder)
        const imageUrl = product.imageBase64 || product.image || '../assets/images/placeholder.png';
        
        // Format price - ensure it's a number first
        let priceValue = 0;
        try {
            if (typeof product.price === 'string' && product.price.startsWith('₹')) {
                priceValue = parseFloat(product.price.substring(1));
            } else {
                priceValue = parseFloat(product.price);
            }
            
            if (isNaN(priceValue)) {
                priceValue = 0;
            }
        } catch (e) {
            console.error('Error parsing price', e);
            priceValue = 0;
        }
        
        const priceDisplay = `₹${priceValue.toFixed(2)}`;
        
        // Generate star rating HTML (using 4.5 as default if not provided)
        const rating = product.rating || 4.5;
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 !== 0;
        
        let starsHtml = '';
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<i class="fas fa-star"></i>';
        }
        if (halfStar) {
            starsHtml += '<i class="fas fa-star-half-alt"></i>';
        }
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<i class="far fa-star"></i>';
        }
        
        // Create product card HTML
        productCard.innerHTML = `
            <div class="product-img-container">
                <img src="${imageUrl}" alt="${product.name}" class="product-img" loading="lazy">
            </div>
            <div class="product-content">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-desc">${product.description}</p>
                <div class="product-actions">
                    <button class="product-action-btn add-to-cart-btn">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                    <button class="product-action-btn view-details-btn">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                </div>
                <div class="product-footer">
                    <div class="price">${priceDisplay}</div>
                    <div class="product-rating">
                        ${starsHtml}
                        <span>(${rating})</span>
                    </div>
                </div>
            </div>
        `;
        
        // Add product card to grid
        productGrid.appendChild(productCard);
    });
    
    // Setup cart functionality after rendering products
    setupCartButtonsOnProductPage();
    
    // Initialize modal functionality after rendering
    setTimeout(() => {
        console.log('Setting up product modal after rendering products');
        setupProductModal();
    }, 100);
}

// Setup add to cart buttons on product page
function setupCartButtonsOnProductPage() {
    // Find all add to cart buttons on the page
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn, .product-action-btn');
    let buttonsFound = 0;
    
    addToCartButtons.forEach(button => {
        // Check if this is a cart button by finding cart icon
        const isCartButton = button.querySelector('.fa-shopping-cart') !== null || 
                           button.classList.contains('add-to-cart-btn');
        
        if (isCartButton) {
            buttonsFound++;
            
            // Pre-fetch product information once instead of on every click
            const productCard = button.closest('.product-card');
            let productInfo = null;
            
            if (productCard) {
                const productId = productCard.dataset.id || `product-${Math.random().toString(36).substr(2, 9)}`;
                const productName = productCard.querySelector('.product-title')?.textContent || 'Product';
                const productPrice = productCard.querySelector('.price')?.textContent || '₹0';
                const productImage = productCard.querySelector('.product-img')?.src || '';
                
                productInfo = {
                    id: productId,
                    name: productName,
                    price: productPrice,
                    image: productImage,
                    quantity: 1
                };
                
                // Store the product info directly on the button for quick access
                button.dataset.productInfo = JSON.stringify(productInfo);
            }
            
            // Remove any existing click handlers
            const newBtn = button.cloneNode(true);
            if (button.parentNode) {
                button.parentNode.replaceChild(newBtn, button);
            }
            
            // Optimized click handler for better performance
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Visual feedback immediately
                this.classList.add('added');
                
                // Get stored product info or fetch if needed
                let product = null;
                try {
                    if (this.dataset.productInfo) {
                        product = JSON.parse(this.dataset.productInfo);
                    }
                } catch (err) {
                    console.error('Error parsing stored product info');
                }
                
                // If no stored info, get it from the product card
                if (!product) {
                    const productCard = this.closest('.product-card');
                    if (!productCard) {
                        console.error('Product card not found');
                        this.classList.remove('added');
                        return;
                    }
                    
                    const productId = productCard.dataset.id || `product-${Math.random().toString(36).substr(2, 9)}`;
                    const productName = productCard.querySelector('.product-title')?.textContent || 'Product';
                    const productPrice = productCard.querySelector('.price')?.textContent || '₹0';
                    const productImage = productCard.querySelector('.product-img')?.src || '';
                    
                    product = {
                        id: productId,
                        name: productName,
                        price: productPrice,
                        image: productImage,
                        quantity: 1
                    };
                }
                
                // Add to cart immediately
                if (window.HarnamCart && product) {
                    window.HarnamCart.addToCart(product);
                    
                    // Remove animation class after delay
                    setTimeout(() => {
                        this.classList.remove('added');
                    }, 1000);
                } else {
                    console.error('HarnamCart not available or product info missing');
                    this.classList.remove('added');
                }
            });
        }
    });
    
    console.log(`Setup ${buttonsFound} add to cart buttons on Products page`);
}

// Initialize product page features
function initializeProductPage() {
    // Initialize filter functionality
    setupProductFilters();
    
    // Initialize animations
    initAnimations();
    
    // Initialize product modal with a slight delay to ensure DOM is ready
    setTimeout(() => {
        console.log('Initializing product modal on page load');
        setupProductModal();
        
        // Set up image error handling
        setupImageErrorHandling();
    }, 200);
}

// Setup product filtering functionality
function setupProductFilters() {
    // Setup category filters
    const categoryFilters = document.querySelectorAll('.category-filters input[type="checkbox"]');
    
    if (categoryFilters.length > 0) {
        categoryFilters.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                // If "All Products" is checked, uncheck others
                if (this.value === 'all' && this.checked) {
                    categoryFilters.forEach(cb => {
                        if (cb.value !== 'all') {
                            cb.checked = false;
                        }
                    });
                } 
                // If another category is checked, uncheck "All Products"
                else if (this.value !== 'all' && this.checked) {
                    const allProductsCheckbox = document.querySelector('.category-filters input[value="all"]');
                    if (allProductsCheckbox) {
                        allProductsCheckbox.checked = false;
                    }
                }
                
                // Apply filters
                applyFilters();
            });
        });
    }
    
    // Setup price range filter
    const priceSlider = document.querySelector('.price-slider');
    const minPriceInput = document.querySelector('.price-inputs input:first-of-type');
    const maxPriceInput = document.querySelector('.price-inputs input:last-of-type');
    
    if (priceSlider && minPriceInput && maxPriceInput) {
        // Initialize with the max value from products
        let maxPrice = 500; // Default
        
        if (productsData.length > 0) {
            const prices = productsData.map(p => parseFloat(p.price) || 0);
            maxPrice = Math.max(...prices);
            maxPrice = Math.ceil(maxPrice / 100) * 100; // Round up to nearest 100
            
            priceSlider.max = maxPrice;
            maxPriceInput.value = maxPrice;
            maxPriceInput.max = maxPrice;
        }
        
        // Update range when slider changes
        priceSlider.addEventListener('input', function() {
            const value = parseFloat(this.value);
            minPriceInput.value = 0;
            maxPriceInput.value = value;
            
            // Delay filter application for better performance
            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => {
                applyFilters();
            }, 300);
        });
        
        // Update range when inputs change
        minPriceInput.addEventListener('change', function() {
            applyFilters();
        });
        
        maxPriceInput.addEventListener('change', function() {
            priceSlider.value = this.value;
            applyFilters();
        });
    }
    
    // Setup rating filters
    const ratingFilters = document.querySelectorAll('.rating-filters input[type="radio"]');
    
    if (ratingFilters.length > 0) {
        ratingFilters.forEach(radio => {
            radio.addEventListener('change', function() {
                applyFilters();
            });
        });
    }
    
    // Setup search functionality
    const searchBox = document.querySelector('.search-box input');
    const searchButton = document.querySelector('.search-box button');
    
    if (searchBox) {
        searchBox.addEventListener('input', function() {
            // Delay search for better performance
            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => {
                applyFilters();
            }, 300);
        });
    }
    
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            applyFilters();
        });
    }
    
    // Setup apply filters button
    const applyFiltersBtn = document.querySelector('.apply-filters-btn');
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
            applyFilters();
            
            // Close sidebar on mobile
            const sidebar = document.querySelector('.products-sidebar');
            const sidebarOverlay = document.querySelector('.sidebar-overlay');
            
            if (window.innerWidth <= 992 && sidebar) {
                sidebar.classList.remove('active');
                if (sidebarOverlay) {
                    sidebarOverlay.style.display = 'none';
                }
            }
        });
    }
    
    // Setup filter toggle button for mobile
    const filterToggleBtn = document.querySelector('.filter-toggle-btn');
    const sidebar = document.querySelector('.products-sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    const sidebarClose = document.querySelector('.sidebar-close');
    
    if (filterToggleBtn && sidebar) {
        filterToggleBtn.addEventListener('click', function() {
            sidebar.classList.add('active');
            
            if (sidebarOverlay) {
                sidebarOverlay.style.display = 'block';
            }
        });
    }
    
    if (sidebarClose && sidebar) {
        sidebarClose.addEventListener('click', function() {
            sidebar.classList.remove('active');
            
            if (sidebarOverlay) {
                sidebarOverlay.style.display = 'none';
            }
        });
    }
    
    if (sidebarOverlay && sidebar) {
        sidebarOverlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            this.style.display = 'none';
        });
    }
}

// Apply all selected filters to products
function applyFilters() {
    const productGrid = document.getElementById('product-grid');
    
    // Get selected category filters
    const selectedCategories = Array.from(
        document.querySelectorAll('.category-filters input[type="checkbox"]:checked')
    ).map(cb => cb.value);
    
    // Get price range
    const minPrice = parseFloat(document.querySelector('.price-inputs input:first-of-type').value) || 0;
    const maxPrice = parseFloat(document.querySelector('.price-inputs input:last-of-type').value) || 500;
    
    // Get minimum rating filter
    const ratingFilter = document.querySelector('.rating-filters input[type="radio"]:checked');
    const minRating = ratingFilter ? parseInt(ratingFilter.value) : 0;
    
    // Get search query
    const searchQuery = document.querySelector('.search-box input').value.trim().toLowerCase();
    
    // Filter products based on all criteria
    let filteredProducts = [...productsData];
    
    // Apply category filter if specific categories are selected
    if (selectedCategories.length > 0 && !selectedCategories.includes('all')) {
        filteredProducts = filteredProducts.filter(product => 
            selectedCategories.includes(product.category)
        );
    }
    
    // Apply price filter
    filteredProducts = filteredProducts.filter(product => {
        const productPrice = parseFloat(product.price) || 0;
        return productPrice >= minPrice && productPrice <= maxPrice;
    });
    
    // Apply rating filter
    filteredProducts = filteredProducts.filter(product => {
        const productRating = parseFloat(product.rating) || 0;
        return productRating >= minRating;
    });
    
    // Apply search filter
    if (searchQuery) {
        filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(searchQuery) || 
            (product.description && product.description.toLowerCase().includes(searchQuery))
        );
    }
    
    // Update filter count display
    const filterCountElement = document.querySelector('.filter-count');
    if (filterCountElement) {
        let activeFilterCount = 0;
        
        // Count active filters
        if (selectedCategories.length > 0 && !selectedCategories.includes('all')) {
            activeFilterCount += 1;
        }
        
        if (minPrice > 0 || maxPrice < 500) {
            activeFilterCount += 1;
        }
        
        if (minRating > 0) {
            activeFilterCount += 1;
        }
        
        if (searchQuery) {
            activeFilterCount += 1;
        }
        
        filterCountElement.textContent = activeFilterCount;
    }
    
    // Clear grid and render filtered products
    productGrid.innerHTML = '';
    
    if (filteredProducts.length === 0) {
        productGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-filter"></i>
                <p>No products match your filters. Try adjusting your criteria.</p>
            </div>
        `;
        return;
    }
    
    // Render filtered products
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card animate-on-scroll';
        productCard.dataset.id = product.id;
        if (product.category) {
            productCard.dataset.category = product.category;
        }
        
        // Get image URL (prioritize imageBase64, then image, then fallback to placeholder)
        const imageUrl = product.imageBase64 || product.image || '../assets/images/placeholder.png';
        
        // Format price - ensure it's a number first
        let priceValue = 0;
        try {
            if (typeof product.price === 'string' && product.price.startsWith('₹')) {
                priceValue = parseFloat(product.price.substring(1));
            } else {
                priceValue = parseFloat(product.price);
            }
            
            if (isNaN(priceValue)) {
                priceValue = 0;
            }
        } catch (e) {
            console.error('Error parsing price', e);
            priceValue = 0;
        }
        
        const priceDisplay = `₹${priceValue.toFixed(2)}`;
        
        // Generate star rating HTML (using 4.5 as default if not provided)
        const rating = product.rating || 4.5;
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 !== 0;
        
        let starsHtml = '';
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<i class="fas fa-star"></i>';
        }
        if (halfStar) {
            starsHtml += '<i class="fas fa-star-half-alt"></i>';
        }
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<i class="far fa-star"></i>';
        }
        
        // Create product card HTML
        productCard.innerHTML = `
            <div class="product-img-container">
                <img src="${imageUrl}" alt="${product.name}" class="product-img" loading="lazy">
            </div>
            <div class="product-content">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-desc">${product.description}</p>
                <div class="product-actions">
                    <button class="product-action-btn add-to-cart-btn">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                    <button class="product-action-btn view-details-btn">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                </div>
                <div class="product-footer">
                    <div class="price">${priceDisplay}</div>
                    <div class="product-rating">
                        ${starsHtml}
                        <span>(${rating})</span>
                    </div>
                </div>
            </div>
        `;
        
        // Add product card to grid
        productGrid.appendChild(productCard);
    });
    
    // Setup cart functionality after rendering filtered products
    setupCartButtonsOnProductPage();
    
    // Re-initialize product modal functionality after a short delay to ensure DOM is ready
    setTimeout(() => {
        console.log('Re-initializing product modal after filtering');
        setupProductModal();
    }, 100);
}

// Setup product modal for details view
function setupProductModal() {
    const modal = document.getElementById('product-modal');
    if (!modal) return;
    
    const closeBtn = modal.querySelector('.close-modal');
    
    // First remove any existing event listeners by cloning all buttons
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        if (btn.parentNode) {
            btn.parentNode.replaceChild(newBtn, btn);
        }
    });
    
    // Now add fresh event listeners to all view details buttons
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        console.log('Setting up view details button:', btn);
        
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('View details button clicked');
            
            // First try to find the product by ID if available
            const productId = this.dataset.productId;
            if (productId) {
                console.log('Looking for product with ID:', productId);
                const product = productsData.find(p => p.id === productId);
                if (product) {
                    console.log('Found product by ID:', product);
                    // Get product card
                    const productCard = this.closest('.product-card');
                    if (productCard) {
                        openProductModal(productCard);
                    } else {
                        console.error('Product card not found for view details button');
                    }
                    return;
                }
            }
            
            // Fallback to finding by closest product card
            const productCard = this.closest('.product-card');
            if (productCard) {
                console.log('Found product card:', productCard);
                openProductModal(productCard);
            } else {
                console.error('Product card not found for view details button');
            }
        });
    });
    
    // Close button functionality
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Modal close button clicked');
            closeModal(modal);
        });
    }
    
    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            console.log('Modal outside click detected');
            closeModal(modal);
        }
    });
    
    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            console.log('ESC key pressed, closing modal');
            closeModal(modal);
        }
    });
}

// Function to open product modal
function openProductModal(productCard) {
    const modal = document.getElementById('product-modal');
    if (!modal || !productCard) return;

    try {
        console.log('Opening product modal for card:', productCard);
        
        // Get product details from the DOM element
        const productId = productCard.dataset.id;
        const title = productCard.querySelector('.product-title')?.textContent || '';
        const image = productCard.querySelector('.product-img')?.src || '';
        const description = productCard.querySelector('.product-desc')?.textContent || '';
        const price = productCard.querySelector('.price')?.textContent || '';
        const ratingHTML = productCard.querySelector('.product-rating')?.innerHTML || '';
        
        console.log('Product details from DOM:', { productId, title, image, description, price });
        
        // For Firebase data, try to find the original product data 
        // to get any additional fields that might be needed
        const originalProductData = productsData.find(p => p.id === productId);
        
        if (originalProductData) {
            console.log('Found original product data:', originalProductData);
        }
        
        // Store product ID in modal for cart functionality
        modal.dataset.productId = productId;

        // Set modal content
        modal.querySelector('.modal-product-title').textContent = title;
        
        // Set image source and handle potential errors
        const modalImage = modal.querySelector('#modal-product-image');
        modalImage.src = image;
        modalImage.alt = title;
        modalImage.onerror = function() {
            console.error('Error loading image in modal, using placeholder');
            this.src = '../assets/images/placeholder.png';
        };
        
        modal.querySelector('.modal-product-description').textContent = description;
        modal.querySelector('.modal-product-price').textContent = `${price}`;
        
        const starsElement = modal.querySelector('.modal-product-rating .stars');
        if (starsElement) {
            starsElement.innerHTML = ratingHTML;
        }

        // Setup modal add to cart button
        setupModalAddToCartButton(modal, {
            id: productId,
            name: title,
            price: price,
            image: image,
            quantity: 1
        });

        // First set display to block (visibility)
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Force browser reflow to ensure transition works
        modal.offsetWidth;
        
        // Add show class with a slight delay to ensure transition effect works properly
        requestAnimationFrame(() => {
            modal.classList.add('show');
            console.log('Modal shown with animation');
        });
    } catch (error) {
        console.error('Error opening product modal:', error);
    }
}

// Function to setup the add to cart button in the modal
function setupModalAddToCartButton(modal, product) {
    const addToCartBtn = modal.querySelector('.modal-product-actions .product-action-btn');
    
    console.log('Setting up modal add to cart button for product:', product);
    
    if (addToCartBtn) {
        // Remove old event listeners by cloning and replacing the button
        const newBtn = addToCartBtn.cloneNode(true);
        if (addToCartBtn.parentNode) {
            addToCartBtn.parentNode.replaceChild(newBtn, addToCartBtn);
        }
        
        // Add click event to the modal's add to cart button
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (window.HarnamCart && typeof window.HarnamCart.addToCart === 'function') {
                console.log('Adding product to cart from modal:', product);
                
                // Add to cart
                window.HarnamCart.addToCart(product);
                
                // Animation feedback
                this.classList.add('added');
                setTimeout(() => {
                    this.classList.remove('added');
                }, 1000);
                
                // Optionally close the modal after adding to cart
                // closeModal(modal);
            } else {
                console.error('HarnamCart.addToCart function not available');
            }
        });
    }
}

// Function to close modal
function closeModal(modal) {
    if (!modal) return;
    
    console.log('Closing modal:', modal);
    
    // First add a class for animation if needed
    modal.classList.remove('show');
    
    // Then hide the modal completely after animation completes
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 300);
}

// Initialize animations
function initAnimations() {
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    
    if (animateElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = entry.target.dataset.delay || 0;
                    setTimeout(() => {
                        entry.target.classList.add('animate');
                    }, delay * 1000);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px'
        });

        animateElements.forEach(element => {
            observer.observe(element);
        });
    }
}

// Handle image loading errors
function setupImageErrorHandling() {
    // Add event listener to handle image load errors
    document.querySelectorAll('.product-img').forEach(img => {
        img.onerror = function() {
            // Replace with placeholder image
            this.src = '../assets/images/placeholder.png';
            console.log('Image load error, using placeholder for:', this.alt);
        };
    });
}

// Check if Firebase is properly initialized
function isFirebaseAvailable() {
    try {
        return typeof firebase !== 'undefined' && 
               firebase.database && 
               typeof firebase.database().ref === 'function' &&
               firebase.app().options.databaseURL; // Check if database URL is configured
    } catch (error) {
        console.error('Firebase availability check error:', error);
        return false;
    }
}

// Create a placeholder product in case of no products or errors
function createPlaceholderProducts() {
    const placeholders = [
        {
            id: 'placeholder-1',
            name: 'Garam Masala',
            description: 'A blend of ground spices used in Indian cuisine. Adds warmth and depth to dishes.',
            price: '250.00',
            image: '../assets/images/garam.jpeg',
            rating: 4.5,
            category: 'blend',
            displayOrder: 1
        },
        {
            id: 'placeholder-2',
            name: 'Chola Masala',
            description: 'Perfect spice blend for delicious chickpea curry. Brings authentic flavor to your chola dish.',
            price: '180.00',
            image: '../assets/images/chola.jpeg',
            rating: 4.0,
            category: 'blend',
            displayOrder: 2
        },
        {
            id: 'placeholder-3',
            name: 'Sabji Masala',
            description: 'Essential mix for vegetable dishes. Enhances the flavor of any vegetable preparation.',
            price: '200.00',
            image: '../assets/images/sabji.jpeg',
            rating: 4.5,
            category: 'blend',
            displayOrder: 3
        }
    ];
    
    console.warn('Using placeholder products instead of Firebase data');
    return placeholders;
}
