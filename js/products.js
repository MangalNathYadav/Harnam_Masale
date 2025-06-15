// Products page specific functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize product page features
    initializeProductPage();
    
    // Initialize cart functionality
    if (typeof window.HarnamCart !== 'undefined') {
        // Add cart button to navigation
        window.HarnamCart.addCartButton();
        
        // Setup cart functionality
        setupCartButtonsOnProductPage();
        
        // Update cart count based on stored data
        window.HarnamCart.updateCartCount();
        
        console.log('Cart system initialized on Products page');
    } else {
        console.error('HarnamCart not available - make sure cart.js is loaded');
    }
});

// Setup add to cart buttons on product page
function setupCartButtonsOnProductPage() {
    // Set data-id attributes for product cards if they don't have one
    document.querySelectorAll('.product-card').forEach((card, index) => {
        if (!card.dataset.id) {
            card.dataset.id = `product-${index + 1}`;
        }
    });
    
    // Find all add to cart buttons on the page
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn, .product-action-btn');
    let buttonsFound = 0;
    
    addToCartButtons.forEach(button => {
        // Check if this is a cart button by finding cart icon
        const isCartButton = button.querySelector('.fa-shopping-cart') !== null || 
                           button.classList.contains('add-to-cart-btn');
        
        if (isCartButton) {
            buttonsFound++;
            
            // Remove any existing click handlers
            const newBtn = button.cloneNode(true);
            if (button.parentNode) {
                button.parentNode.replaceChild(newBtn, button);
            }
            
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Get product details from the card
                const productCard = this.closest('.product-card');
                if (!productCard) {
                    console.error('Product card not found');
                    return;
                }
                
                const productId = productCard.dataset.id || `product-${Math.random().toString(36).substr(2, 9)}`;
                const productName = productCard.querySelector('.product-title')?.textContent || 'Product';
                const productPrice = productCard.querySelector('.price')?.textContent || '₹0';
                const productImage = productCard.querySelector('.product-img')?.src || '';
                
                console.log('Adding product to cart from products page:', {
                    id: productId,
                    name: productName,
                    price: productPrice,
                    image: productImage
                });
                
                // Create product object
                const product = {
                    id: productId,
                    name: productName,
                    price: productPrice,
                    image: productImage,
                    quantity: 1
                };
                
                // Add to cart
                window.HarnamCart.addToCart(product);
                
                // Animation feedback
                this.classList.add('added');
                setTimeout(() => {
                    this.classList.remove('added');
                }, 1000);
            });
        }
    });
    
    console.log(`Setup ${buttonsFound} add to cart buttons on Products page`);
}

// Initialize product page features
function initializeProductPage() {
    // Initialize filter functionality
    setupProductFilters();
    
    // Initialize product modal
    setupProductModal();
    
    // Initialize animations
    initAnimations();
}

// Setup product filtering functionality
function setupProductFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (filterButtons.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active class from all buttons
                filterButtons.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Get filter value
                const filter = this.dataset.filter;
                
                // Filter products
                const productCards = document.querySelectorAll('.product-card');
                
                productCards.forEach(card => {
                    if (filter === 'all') {
                        card.style.display = 'block';
                    } else {
                        const category = card.dataset.category;
                        if (category === filter) {
                            card.style.display = 'block';
                        } else {
                            card.style.display = 'none';
                        }
                    }
                });
            });
        });
    }
}

// Setup product modal for details view
function setupProductModal() {
    const modal = document.getElementById('product-modal');
    if (!modal) return;
    
    const closeBtn = modal.querySelector('.close-modal');
    
    // Add click event to all view details buttons
    document.querySelectorAll('.view-details-btn, .product-action-btn').forEach(btn => {
        if (btn.querySelector('.fa-eye') || btn.classList.contains('view-details-btn')) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const productCard = this.closest('.product-card');
                if (productCard) {
                    openProductModal(productCard);
                }
            });
        }
    });
    
    // Close button functionality
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeModal(modal));
    }
    
    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
}

// Function to open product modal
function openProductModal(productCard) {
    const modal = document.getElementById('product-modal');
    if (!modal || !productCard) return;

    try {
        // Get product details
        const productId = productCard.dataset.id;
        const title = productCard.querySelector('.product-title')?.textContent || '';
        const image = productCard.querySelector('.product-img')?.src || '';
        const description = productCard.querySelector('.product-desc')?.textContent || '';
        const price = productCard.querySelector('.price')?.textContent || '';
        const ratingHTML = productCard.querySelector('.product-rating')?.innerHTML || '';

        // Store product ID in modal for cart functionality
        modal.dataset.productId = productId;

        // Set modal content
        modal.querySelector('.modal-product-title').textContent = title;
        modal.querySelector('#modal-product-image').src = image;
        modal.querySelector('#modal-product-image').alt = title;
        modal.querySelector('.modal-product-description').textContent = description;
        modal.querySelector('.modal-product-price').textContent = `${price}`;
        
        const starsElement = modal.querySelector('.modal-product-rating .stars');
        if (starsElement) {
            starsElement.innerHTML = ratingHTML;
        }

        // Show modal with animation
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    } catch (error) {
        console.error('Error opening product modal:', error);
    }
}

// Function to close modal
function closeModal(modal) {
    if (!modal) return;
    
    modal.classList.remove('show');
    
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
