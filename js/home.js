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

// Show toast message function
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(toast);
    
    // Add show class to trigger animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Setup integrated cart buttons that work with the HarnamCart system
function setupIntegratedCartButtons() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn, .product-action-btn');
    let buttonsFound = 0;
    
    addToCartButtons.forEach(button => {
        // Check if this is a cart button
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
                showToast('Coming Soon! 🚀');
            });
        }
    });
    
    console.log(`Integrated ${buttonsFound} disabled cart buttons`);
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
                this.querySelector('.product-overlay').style.opacity = '1';
            });
            
            imgContainer.addEventListener('mouseleave', function() {
                this.querySelector('.product-overlay').style.opacity = '0';
            });
        }
        
        // Handle action buttons
        const addToCartBtn = card.querySelector('.add-to-cart-btn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                // Animation for button click
                this.classList.add('clicked');
                setTimeout(() => {
                    this.classList.remove('clicked');
                }, 300);
            });
        }
        
        const viewDetailsBtn = card.querySelector('.view-details-btn');
        if (viewDetailsBtn) {
            // Remove existing event listeners by cloning
            const newBtn = viewDetailsBtn.cloneNode(true);
            viewDetailsBtn.parentNode.replaceChild(newBtn, viewDetailsBtn);
            
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                // Open the product modal for this card
                openProductModal(card);
            });
        }
    });
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
}

// Setup modal functionality
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

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModal(modal);
        }
    });
    
    // Add "Add to Cart" functionality to product modal
    const modalAddToCartBtn = modal?.querySelector('.modal-product-actions .product-action-btn');
    if (modalAddToCartBtn) {
        // Remove existing event listeners by cloning
        const newBtn = modalAddToCartBtn.cloneNode(true);
        modalAddToCartBtn.parentNode.replaceChild(newBtn, modalAddToCartBtn);
        
        newBtn.addEventListener('click', function() {
            const productId = modal.dataset.productId;
            const productName = modal.querySelector('.modal-product-title').textContent;
            const productPrice = modal.querySelector('.modal-product-price').textContent;
            const productImage = modal.querySelector('#modal-product-image').src;
            
            if (typeof window.HarnamCart !== 'undefined' && productId) {
                console.log('Adding product from modal:', {
                    id: productId,
                    name: productName,
                    price: productPrice,
                    image: productImage
                });
                
                window.HarnamCart.addToCart({
                    id: productId,
                    name: productName,
                    price: productPrice,
                    image: productImage,
                    quantity: 1
                });
                
                // Animation feedback
                this.classList.add('added');
                setTimeout(() => {
                    this.classList.remove('added');
                }, 1000);
            }
        });
    }
}

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
        
        // Show the modal
        modal.style.display = 'block';
        setTimeout(() => modal.classList.add('show'), 10);
    } catch (error) {
        console.error('Error opening product modal:', error);
    }
}

// Function to close modal
function closeModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
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

