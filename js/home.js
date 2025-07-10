// Home page specific animations and interactions
document.addEventListener('DOMContentLoaded', function() {
    // Handle modern loader
    const loader = document.querySelector('.modern-loader');
    if (loader) {
        // Ensure resources are loaded before hiding
        window.addEventListener('load', () => {
            setTimeout(() => {
                loader.classList.add('hidden');
                // Remove from DOM after transition
                setTimeout(() => loader.remove(), 500);
            }, 1000);
        });
    }
    
    // Initialize animation for elements with .animate-on-scroll class
    initScrollAnimations();
    
    // Enhanced parallax effect for hero section
    initParallaxEffect();
    
    // Initialize about section enhancements
    initAboutSectionEffects();
    
    // Initialize floating particles
    createFloatingParticles();
    
    // Set up product hover interactions
    setupProductInteractions();
    
    // Handle scroll indicator click
    setupScrollIndicator();
    
    // Setup cart modal functionality - updated to use centralized cart.js
    if (typeof window.HarnamCart !== 'undefined') {
        // Initialize cart properly first
        setTimeout(async () => {
            try {
                // Use the global cart initialization for consistency
                await window.HarnamCart.initializeCart();
                console.log('Cart initialized on Home page with', window.HarnamCart.getCart().length, 'items');
                
                // Add cart button to navigation
                window.HarnamCart.addCartButton();
                
                // Update cart count based on stored data
                window.HarnamCart.updateCartCount();
                
                // Setup "Add to Cart" buttons with HarnamCart system
                setupIntegratedCartButtons();
            } catch (error) {
                console.error('Error initializing cart on Home page:', error);
                
                // Fallback
                window.HarnamCart.addCartButton();
                window.HarnamCart.updateCartCount();
            }
        }, 300);
        
        // Setup "Add to Cart" buttons with HarnamCart system
        setupIntegratedCartButtons();
        // Verify cart modal exists
        window.HarnamCart.verifyCartModal();
    } else {
        console.error('HarnamCart not found. Make sure cart.js is loaded before home.js');
    }
    
    // Initialize form animations
    setupFormAnimations();
    
    // Initialize contact form functionality
    initializeContactForm();
    
    // Setup product modal functionality
    setupProductModal();
    
    // Form interaction enhancements
    const formInputs = document.querySelectorAll('.contact-form input, .contact-form textarea');
    
    formInputs.forEach(input => {
        // Add focus effects
        input.addEventListener('focus', () => {
            input.closest('.form-group').classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            if (!input.value) {
                input.closest('.form-group').classList.remove('focused');
            }
        });
        
        // Validate on input
        input.addEventListener('input', () => {
            if (input.checkValidity()) {
                input.classList.remove('invalid');
                input.classList.add('valid');
            } else {
                input.classList.remove('valid');
                input.classList.add('invalid');
            }
        });
    });
    
    // Smooth scroll to contact section when clicking contact links
    document.querySelectorAll('a[href="#contact"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('#contact').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    });
    
    // Setup modal functionality
    setupProductModal();
    
    // Initialize product auto-scroll
    initProductScroll();
});

// Setup integrated cart buttons that work with the HarnamCart system
function setupIntegratedCartButtons() {
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
            
            // Remove existing event listeners by cloning
            const newBtn = button.cloneNode(true);
            button.parentNode.replaceChild(newBtn, button);
            
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
                
                // Add to cart
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
    
    console.log(`Integrated ${buttonsFound} cart buttons setup complete`);
}

// Shopping cart modal functionality - Removed duplicate as it's now centralized in cart.js
function setupCartModal() {
    // Defer to centralized cart.js functionality
    if (typeof window.HarnamCart !== 'undefined') {
        window.HarnamCart.renderCart();
    }
}

// Initialize animations for elements that should animate when they come into view
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Get any delay attribute
                const delay = entry.target.dataset.delay || 0;
                
                // Apply animation with delay
                setTimeout(() => {
                    entry.target.classList.add('animate');
                }, delay * 1000);
                
                // Stop observing after animation
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px'
    });

    // Observe all elements that should animate on scroll
    document.querySelectorAll('.animate-on-scroll').forEach(element => {
        observer.observe(element);
    });
    
    // For elements inside grids, apply staggered animation
    const gridObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Get parent container
                const parent = entry.target.parentElement;
                if (parent) {
                    const siblings = Array.from(parent.children);
                    const elementIndex = siblings.indexOf(entry.target);
                    
                    // Apply staggered delay based on element index
                    setTimeout(() => {
                        entry.target.classList.add('animate');
                    }, (elementIndex % siblings.length) * 150);
                } else {
                    entry.target.classList.add('animate');
                }
                gridObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px'
    });
    
    // Apply grid observer to card elements
    document.querySelectorAll('.certifications-grid > .contact-card, .products-section .product-card').forEach(card => {
        gridObserver.observe(card);
    });
    
    // Apply special animations to map items and form sections
    document.querySelectorAll('.map-info-item, .contact-form-container').forEach((item, index) => {
        item.style.transitionDelay = (index * 0.1) + 's';
        observer.observe(item);
    });
}

// Enhanced parallax scrolling effect
function initParallaxEffect() {
    let lastScrollY = window.scrollY;
    const heroContent = document.querySelector('.contact-hero-content');
    const heroBg = document.querySelector('.contact-hero-bg');
    const heroOverlay = document.querySelector('.contact-hero-overlay');
    const heroPattern = document.querySelector('.contact-hero-pattern');
    
    const updateParallax = () => {
        const scroll = window.scrollY;
        
        if (Math.abs(scroll - lastScrollY) > 3) {
            // Apply parallax effects proportional to scroll amount
            if (heroContent) {
                heroContent.style.transform = `translate3d(0, ${scroll * 0.1}px, 0)`;
                heroContent.style.opacity = Math.max(0, 1 - (scroll * 0.002));
            }
            
            if (heroBg) {
                heroBg.style.transform = `scale(1.05) translate3d(0, ${scroll * 0.05}px, 0)`;
            }
            
            if (heroPattern) {
                heroPattern.style.transform = `translate3d(${scroll * 0.02}px, ${scroll * 0.01}px, 0)`;
            }
            
            // Add subtle parallax to section titles
            document.querySelectorAll('.section-title').forEach(title => {
                const rect = title.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    const distance = (window.innerHeight - rect.top) * 0.05;
                    title.style.transform = `translateY(${-distance}px)`;
                }
            });
            
            lastScrollY = scroll;
        }
        
        requestAnimationFrame(updateParallax);
    };
    
    // Start the animation loop
    requestAnimationFrame(updateParallax);
}

// Create and animate floating particles in the hero section
function createFloatingParticles() {
    const particles = document.querySelector('.floating-particles');
    if (!particles) return;
    
    // Create additional particles for a richer effect
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('span');
        particle.classList.add('particle');
        
        // Randomize particle properties
        const size = Math.random() * 12 + 4; // 4px to 16px
        const posX = Math.random() * 100; // 0% to 100%
        const posY = Math.random() * 100; // 0% to 100%
        const delay = Math.random() * 10; // 0s to 10s
        const duration = Math.random() * 10 + 15; // 15s to 25s
        const opacity = Math.random() * 0.5 + 0.2; // 0.2 to 0.7
        
        // Apply random styles
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = posX + '%';
        particle.style.top = posY + '%';
        
        // Use different animation types for variety
        if (i % 3 === 0) {
            particle.style.animation = `float ${duration}s infinite linear`;
        } else if (i % 3 === 1) {
            particle.style.animation = `floatAlt ${duration}s infinite linear`;
        } else {
            particle.style.animation = `floatSlow ${duration}s infinite linear`;
        }
        
        particle.style.animationDelay = delay + 's';
        particle.style.opacity = opacity;
        
        // Add color variations
        if (i % 5 === 0) {
            particle.style.background = 'rgba(255, 196, 198, 0.6)'; // Light pink
        } else if (i % 5 === 1) {
            particle.style.background = 'rgba(230, 57, 70, 0.4)'; // Red
        } else if (i % 5 === 2) {
            particle.style.background = 'rgba(181, 144, 185, 0.5)'; // Purple
        } else if (i % 5 === 3) {
            particle.style.background = 'rgba(245, 245, 245, 0.5)'; // White
        } else {
            particle.style.background = 'rgba(255, 255, 255, 0.3)'; // Transparent white
        }
        
        // Add subtle box-shadow for glow effect
        if (i % 4 === 0) {
            particle.style.boxShadow = '0 0 10px rgba(230, 57, 70, 0.5)';
        }
        
        particles.appendChild(particle);
    }
}

// Handle product hover interactions
function setupProductInteractions() {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const imgContainer = card.querySelector('.product-img-container');
        
        if (imgContainer) {
            // Show overlay on hover
            imgContainer.addEventListener('mouseenter', function() {
                const overlay = this.querySelector('.product-overlay');
                if (overlay) {
                    overlay.style.opacity = '1';
                }
            });
            
            imgContainer.addEventListener('mouseleave', function() {
                const overlay = this.querySelector('.product-overlay');
                if (overlay) {
                    overlay.style.opacity = '0';
                }
            });
        }
        
        // Handle view details buttons
        const viewDetailsButtons = card.querySelectorAll('.view-details-btn, .product-action-btn');
        viewDetailsButtons.forEach(button => {
            if (button.querySelector('.fa-eye') || button.classList.contains('view-details-btn')) {
                // Remove existing event listeners by cloning
                const newBtn = button.cloneNode(true);
                button.parentNode.replaceChild(newBtn, button);
                
                newBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Find the product card
                    const productCard = this.closest('.product-card');
                    if (!productCard) {
                        console.error('Product card not found');
                        return;
                    }
                    
                    // Get product details
                    const title = productCard.querySelector('.product-title').textContent;
                    const description = productCard.querySelector('.product-desc').textContent;
                    const price = productCard.querySelector('.price').textContent;
                    const image = productCard.querySelector('.product-img').src;
                    const rating = productCard.querySelector('.product-rating').innerHTML;
                    
                    // Show modal with product details
                    showProductModal(title, description, price, image, rating);
                });
            }
        });
    });
}

// Function to show the product modal
function showProductModal(title, description, price, image, rating) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('product-detail-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'product-detail-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <div class="product-detail-container">
                    <div class="product-detail-image">
                        <img src="${image}" alt="${title}" id="modal-product-image">
                    </div>
                    <div class="product-detail-info">
                        <h2 id="modal-product-title">${title}</h2>
                        <p id="modal-product-description">${description}</p>
                        <div class="product-detail-price">
                            <span id="modal-product-price">${price}</span>
                        </div>
                        <div class="product-detail-rating" id="modal-product-rating">
                            ${rating}
                        </div>
                        <button class="btn btn-primary add-to-cart-btn">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Add event listeners for the new modal
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            });
        }

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }
        });

        // Setup Add to Cart functionality in modal
        const modalAddToCartBtn = modal.querySelector('.add-to-cart-btn');
        if (modalAddToCartBtn) {
            modalAddToCartBtn.addEventListener('click', () => {
                const productId = `product-${Math.random().toString(36).substr(2, 9)}`;
                const product = {
                    id: productId,
                    name: title,
                    price: price,
                    image: image,
                    quantity: 1
                };
                
                // Add to cart using the global HarnamCart object
                if (typeof window.HarnamCart !== 'undefined') {
                    window.HarnamCart.addToCart(product);
                }
                
                // Close modal
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            });
        }
    } else {
        // Update existing modal content
        modal.querySelector('#modal-product-image').src = image;
        modal.querySelector('#modal-product-image').alt = title;
        modal.querySelector('#modal-product-title').textContent = title;
        modal.querySelector('#modal-product-description').textContent = description;
        modal.querySelector('#modal-product-price').textContent = price;
        modal.querySelector('#modal-product-rating').innerHTML = rating;
    }

    // Show modal with animation
    modal.style.display = 'block';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

// Setup smooth scroll for the scroll indicator
function setupScrollIndicator() {
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (!scrollIndicator) return;
    
    scrollIndicator.addEventListener('click', function() {
        const featuredSection = document.getElementById('featured-products');
        if (featuredSection) {
            featuredSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        } else {
            // Fallback to window scrolling
            window.scrollTo({
                top: window.innerHeight,
                behavior: 'smooth'
            });
        }
    });
}

// Setup form animations to match contact page
function setupFormAnimations() {
    // Form animations
    const formControls = document.querySelectorAll('.form-control');
    formControls.forEach(control => {
        // Check if focus-border already exists as a sibling
        if (!control.parentNode.querySelector('.focus-border')) {
            const border = document.createElement('span');
            border.className = 'focus-border';
            control.parentNode.appendChild(border);
        }
        
        // Add focused class on focus
        control.addEventListener('focus', () => {
            control.parentNode.classList.add('focused');
        });
        
        // Remove focused class on blur if empty
        control.addEventListener('blur', () => {
            if (!control.value) {
                control.parentNode.classList.remove('focused');
            }
        });
    });

    // Add basic button animations (visual only, actual submission is handled by ContactFormHandler)
    const contactForm = document.querySelector('#contactForm');
    if (contactForm) {
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.addEventListener('mousedown', function() {
                this.style.transform = 'scale(0.95)';
            });
            
            submitBtn.addEventListener('mouseup', function() {
                this.style.transform = '';
            });
            
            submitBtn.addEventListener('mouseleave', function() {
                this.style.transform = '';
            });
        }
    }
}

// Initialize premium products auto-scroll
function initProductScroll() {
    const container = document.querySelector('.certifications-grid');
    const scrollContent = document.querySelector('.product-scroll');
    
    if (!container || !scrollContent) return;

    // Clone items for infinite scroll effect
    const items = scrollContent.children;
    const itemCount = items.length;
    
    // Only clone if we have items
    if (itemCount > 0) {
        // Clone first set of items
        for (let i = 0; i < Math.min(itemCount, 3); i++) {
            const clone = items[i].cloneNode(true);
            scrollContent.appendChild(clone);
        }
    }

    // Add touch handling
    let isDown = false;
    let startX;
    let scrollLeft;

    container.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
        container.style.cursor = 'grabbing';
        // Pause animation on interaction
        scrollContent.style.animationPlayState = 'paused';
    });

    container.addEventListener('mouseleave', () => {
        isDown = false;
        container.style.cursor = 'grab';
        // Resume animation
        scrollContent.style.animationPlayState = 'running';
    });

    container.addEventListener('mouseup', () => {
        isDown = false;
        container.style.cursor = 'grab';
        // Resume animation
        scrollContent.style.animationPlayState = 'running';
    });

    container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 2;
        container.scrollLeft = scrollLeft - walk;
    });

    // Handle touch devices
    if ('ontouchstart' in window) {
        scrollContent.style.animation = 'none';
        container.style.overflowX = 'auto';
    }
}    // Setup product modal functionality
function setupProductModal() {
    // Use the existing modal from HTML
    let modal = document.getElementById('product-modal');
    if (!modal) {
        console.error('Product modal with ID "product-modal" not found in the HTML');
        return;
    }

    // Get all view details buttons
    const viewDetailsButtons = document.querySelectorAll('.view-details-btn');
    
    // Add click event to all view details buttons
    viewDetailsButtons.forEach(button => {
        // Remove any existing event listeners by cloning the button
        const newBtn = button.cloneNode(true);
        if (button.parentNode) {
            button.parentNode.replaceChild(newBtn, button);
        }
        
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const productCard = newBtn.closest('.product-card');
            if (!productCard) return;
            
            // Get product details
            const title = productCard.querySelector('.product-title').textContent;
            const description = productCard.querySelector('.product-desc').textContent;
            const price = productCard.querySelector('.price').textContent;
            const image = productCard.querySelector('.product-img').src;
            const ratingHTML = productCard.querySelector('.product-rating').innerHTML;
            const productId = productCard.dataset.id || `product-${Math.random().toString(36).substr(2, 9)}`;
            
            // Update modal content
            modal.querySelector('.modal-product-title').textContent = title;
            modal.querySelector('.modal-product-description').textContent = description;
            modal.querySelector('.modal-product-price').textContent = price;
            modal.querySelector('#modal-product-image').src = image;
            modal.querySelector('#modal-product-image').alt = title;
            modal.querySelector('.modal-product-rating .stars').innerHTML = ratingHTML;
            
            // Store product ID in modal's dataset
            modal.dataset.productId = productId;
            
            // Setup modal add to cart button
            setupModalAddToCartButton(modal, {
                id: productId,
                name: title,
                price: price,
                image: image,
                quantity: 1
            });
            
            // Show modal with animation
            modal.style.display = 'block';
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
        });
    });
    
    // Close modal functionality
    const closeModal = modal.querySelector('.close-modal');
    if (closeModal) {
        // Remove existing event listeners by cloning the button
        const newCloseBtn = closeModal.cloneNode(true);
        if (closeModal.parentNode) {
            closeModal.parentNode.replaceChild(newCloseBtn, closeModal);
        }
        
        newCloseBtn.addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    });
}

// Function to setup the add to cart button in the modal
function setupModalAddToCartButton(modal, product) {
    const addToCartBtn = modal.querySelector('.modal-product-actions .add-to-cart-btn');
    
    console.log('Setting up modal add to cart button for product:', product);
    
    if (addToCartBtn) {
        // Store product info directly on the button for instant access
        if (product) {
            addToCartBtn.dataset.productInfo = JSON.stringify(product);
        }
        
        // Remove old event listeners by cloning and replacing the button
        const newBtn = addToCartBtn.cloneNode(true);
        if (addToCartBtn.parentNode) {
            addToCartBtn.parentNode.replaceChild(newBtn, addToCartBtn);
        }
        
        // Add optimized click event to the modal's add to cart button
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Visual feedback immediately
            this.classList.add('added');
            
            // Get product data from dataset or use provided product
            let productData = product;
            if (this.dataset.productInfo) {
                try {
                    productData = JSON.parse(this.dataset.productInfo);
                } catch (err) {
                    console.error('Error parsing product info from button data');
                }
            }
            
            if (window.HarnamCart && typeof window.HarnamCart.addToCart === 'function' && productData) {
                // Add to cart immediately
                window.HarnamCart.addToCart(productData);
                
                // Close the modal first for better responsiveness
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                    
                    // Remove animation class after modal is closed
                    this.classList.remove('added');
                }, 300);
            } else {
                console.error('HarnamCart.addToCart function not available or product data missing');
                this.classList.remove('added');
            }
        });
    }
}

// Initialize all Home page functionality - Removed duplicate

// Initialize contact form functionality
function initializeContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    
    // Add UI interaction enhancements for form inputs
    setupContactFormUI(contactForm);
    
    // Use the universal contact form handler (defined in contact-form.js)
    // This ensures there's only one source of submission logic
    window.ContactFormHandler.setupFormSubmission(contactForm, showNotification);
}

// Setup form UI interactions (visual effects only, no submission logic)
function setupContactFormUI(form) {
    // Add form input animations
    const formInputs = form.querySelectorAll('input, textarea');
    formInputs.forEach(input => {
        // Create and add focus border if it doesn't exist
        if (!input.parentElement.querySelector('.focus-border')) {
            const focusBorder = document.createElement('span');
            focusBorder.className = 'focus-border';
            input.parentElement.appendChild(focusBorder);
        }
        
        // Add focused class on focus
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        
        // Remove focused class on blur if empty
        input.addEventListener('blur', () => {
            if (!input.value) {
                input.parentElement.classList.remove('focused');
            }
        });
        
        // If input has value on load, add focused class
        if (input.value) {
            input.parentElement.classList.add('focused');
        }
    });
}

/**
 * Show notification message
 * @param {string} message - Message to display
 * @param {string} type - Type of notification ('success' or 'error')
 */
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Add icon based on type
    const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
    
    // Set notification content
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
        <button class="close-btn"><i class="fas fa-times"></i></button>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Add close functionality
    const closeBtn = notification.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Initialize contact form functionality
initializeContactForm();

// Initialize about section effects
function initAboutSectionEffects() {
    // Add subtle parallax effect to the about image
    const aboutSection = document.getElementById('about-section');
    const aboutImage = aboutSection?.querySelector('.about-image');
    
    if (aboutSection && aboutImage) {
        // Create a subtle movement effect on mouse move
        aboutSection.addEventListener('mousemove', (e) => {
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            
            // Get section boundaries
            const rect = aboutSection.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            // Calculate movement based on mouse position
            const moveX = (mouseX - centerX) * 0.01;
            const moveY = (mouseY - centerY) * 0.01;
            
            // Apply transformation with limitations
            aboutImage.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.05)`;
        });
        
        // Reset on mouse leave
        aboutSection.addEventListener('mouseleave', () => {
            aboutImage.style.transform = 'scale(1)';
        });
        
        // Add intersection observer for enhanced scroll reveal
        const aboutFeatures = aboutSection.querySelectorAll('.feature-item');
        
        if (aboutFeatures.length && 'IntersectionObserver' in window) {
            const featuresObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting) {
                        // Add staggered animation
                        setTimeout(() => {
                            entry.target.classList.add('fade-in-up');
                        }, index * 150);
                        featuresObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.3 });
            
            aboutFeatures.forEach(feature => {
                featuresObserver.observe(feature);
            });
        }
    }
}

