// Highlight active page in navigation
function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        // Check if the current path contains the link path or if we're on home and link is to index
        if ((currentPath.includes(linkPath) && linkPath !== 'index.html') ||
            (currentPath.endsWith('/') && linkPath === 'index.html') ||
            (currentPath.endsWith('index.html') && linkPath === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Initialize cart for all pages
async function initializeCartOnAllPages() {
    try {
        if (window.HarnamCart && typeof window.HarnamCart.initializeCart === 'function') {
            console.log('Initializing cart from main.js');
            await window.HarnamCart.initializeCart();
        } else {
            console.log('Cart module not available yet, will retry');
            // Try again after a short delay (cart might not be loaded yet)
            setTimeout(initializeCartOnAllPages, 500);
        }
    } catch (error) {
        console.error('Error initializing cart from main.js:', error);
    }
}

// Set active nav link based on current page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize navigation
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        // Get the href and compare with current path
        const href = link.getAttribute('href');
        const isHome = currentPath.endsWith('index.html') || currentPath.endsWith('/');
        const isCurrentPage = isHome ? href.includes('index.html') : currentPath.includes(href);
        
        if (isCurrentPage) {
            link.classList.add('active');
        }
    });
    
    // Initialize cart on all pages
    initializeCartOnAllPages();

    // Load social links from RTDB and update icons
    loadSocialLinksFromRTDB();
});
// Load social links from Firebase RTDB and update homepage icons
function loadSocialLinksFromRTDB() {
    if (typeof firebase === 'undefined' || !firebase.database) return;
    firebase.database().ref('settings/socialLinks').once('value').then(function(snapshot) {
        if (!snapshot.exists()) return;
        const links = snapshot.val();
        if (links.facebook) {
            const fb = document.getElementById('social-facebook-link');
            if (fb) fb.href = links.facebook;
        }
        if (links.instagram) {
            const ig = document.getElementById('social-instagram-link');
            if (ig) ig.href = links.instagram;
        }
        if (links.twitter) {
            const tw = document.getElementById('social-twitter-link');
            if (tw) tw.href = links.twitter;
        }
        if (links.youtube) {
            const yt = document.getElementById('social-youtube-link');
            if (yt) yt.href = links.youtube;
        }
    });
}

// Dynamically adjust product card heights for consistency
function equalizeProductCardHeights() {
    const productCards = document.querySelectorAll('.product-card');
    if (productCards.length === 0) return;

    // Reset heights first
    productCards.forEach(card => {
        const infoSection = card.querySelector('.product-info');
        if (infoSection) {
            infoSection.style.minHeight = 'auto';
        }
    });

    // Only equalize on larger screens
    if (window.innerWidth > 768) {
        // Find max height
        let maxInfoHeight = 0;
        productCards.forEach(card => {
            const infoSection = card.querySelector('.product-info');
            if (infoSection && infoSection.offsetHeight > maxInfoHeight) {
                maxInfoHeight = infoSection.offsetHeight;
            }
        });

        // Apply max height to all
        if (maxInfoHeight > 0) {
            productCards.forEach(card => {
                const infoSection = card.querySelector('.product-info');
                if (infoSection) {
                    infoSection.style.minHeight = `${maxInfoHeight}px`;
                }
            });
        }
    }
}

// Handle responsive image loading - larger images for desktop, smaller for mobile
function responsiveImageLoading() {
    const deviceWidth = window.innerWidth;
    const heroSection = document.querySelector('.hero');

    if (heroSection) {
        const backgroundImage = heroSection.style.backgroundImage;

        // Only modify real images, not placeholders
        if (backgroundImage && !backgroundImage.includes('placehold.co')) {
            // Extract the current image path
            const imgPath = backgroundImage.replace(/^url\(['"](.+)['"]\)$/, '$1');

            if (deviceWidth <= 768 && !imgPath.includes('-mobile')) {
                // Check if a mobile version exists
                const mobileImgPath = imgPath.replace(/\.jpg|\.png|\.jpeg/i, '-mobile$&');

                // Create a test image to see if mobile version exists
                const testImg = new Image();
                testImg.onload = function() {
                    // Mobile version exists, use it
                    heroSection.style.backgroundImage = `url('${mobileImgPath}')`;
                };
                testImg.onerror = function() {
                    // Keep using the desktop version
                };
                testImg.src = mobileImgPath;
            }
        }
    }
}

// Initialize all enhancements
document.addEventListener('DOMContentLoaded', () => {
    // Set active navigation link
    setActiveNavLink();

    // Fix product card heights
    equalizeProductCardHeights();

    // Handle responsive images
    responsiveImageLoading();

    // Listen for window resize to adjust card heights
    window.addEventListener('resize', () => {
        equalizeProductCardHeights();
    });

    // Add image loading animation
    document.querySelectorAll('img').forEach(img => {
        if (!img.complete) {
            img.classList.add('image-loading');
            img.addEventListener('load', () => {
                img.classList.remove('image-loading');
                img.classList.add('image-loaded');
            });
        } else {
            img.classList.add('image-loaded');
        }
    });
    
    // Initialize cart functionality
    if (typeof window.HarnamCart !== 'undefined') {
        // Add cart button to navigation
        window.HarnamCart.addCartButton();
        
        // Update cart count based on stored data
        window.HarnamCart.updateCartCount();
        
        // Set data-id attributes for product cards if they don't have one
        document.querySelectorAll('.product-card').forEach((card, index) => {
            if (!card.dataset.id) {
                card.dataset.id = `product-${index + 1}`;
            }
        });
        
        // Setup "Add to Cart" buttons
        // DEPRECATED: Cart buttons are now handled centrally by cart.js
        // The following code is commented out to prevent conflicts
        /*
        const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
        addToCartButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Find the product card
                const productCard = this.closest('.product-card');
                if (!productCard) return;
                
                const productId = productCard.dataset.id || `product-${Math.random().toString(36).substr(2, 9)}`;
                const productName = productCard.querySelector('.product-title')?.textContent || 'Product';
                const productPrice = productCard.querySelector('.price')?.textContent || '₹0';
                const productImage = productCard.querySelector('.product-img')?.src || '';
                
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
        });
        */
    }
});

// Page loader/preloader functionality
document.addEventListener('DOMContentLoaded', () => {
    // Create loader container
    const loader = document.createElement('div');
    loader.classList.add('page-loader');

    // Create loader content
    const loaderContent = document.createElement('div');
    loaderContent.classList.add('loader-content');

    // Logo or spinner for loader
    const loaderIcon = document.createElement('div');
    loaderIcon.classList.add('loader-icon');
    loaderIcon.innerHTML = '<i class="fas fa-pepper-hot fa-spin"></i>'; // Spice-related icon

    // Loader text
    const loaderText = document.createElement('div');
    loaderText.classList.add('loader-text');
    loaderText.textContent = 'Harnam Masale';

    // Assemble loader
    loaderContent.appendChild(loaderIcon);
    loaderContent.appendChild(loaderText);
    loader.appendChild(loaderContent);

    // Add to body
    document.body.appendChild(loader);

    // Hide loader after page loads
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';

                // Add page transition class to body after loader disappears
                document.body.classList.add('page-transition');

                // Trigger scroll animations
                animateOnScroll();

                // Staggered animation for product cards
                animateProductCards();
            }, 500);
        }, 800);
    });
});

// Function to animate product cards with staggered timing
function animateProductCards() {
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 * index);
    });
}

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-links li');

    if (mobileMenu) {
        mobileMenu.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            
            // Animate nav items
            navItems.forEach((item, index) => {
                if (item.style.animation) {
                    item.style.animation = '';
                } else {
                    item.style.animation = `slideIn 0.3s ease forwards ${index * 0.1}s`;
                }
            });
        });
    }

    // Set active nav link based on current page
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.nav-links a');
    
    links.forEach(link => {
        const href = link.getAttribute('href');
        const isHome = currentPath.endsWith('index.html') || currentPath.endsWith('/');
        const isCurrentPage = isHome ? href.includes('index.html') : currentPath.includes(href);
        
        if (isCurrentPage) {
            link.classList.add('active');
        }
    });
});

// Close mobile menu when clicking a link
const navItems = document.querySelectorAll('.nav-links li a');
navItems.forEach(item => {
    item.addEventListener('click', () => {
        if (navLinks.classList.contains('active')) {
            mobileMenu.classList.remove('active');
            navLinks.classList.remove('active');

            const bars = document.querySelectorAll('.bar');
            bars[0].classList.remove('animate-bar1');
            bars[1].classList.remove('animate-bar2');
            bars[2].classList.remove('animate-bar3');
        }
    });
});

// Add smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 70, // Offset for fixed header
                behavior: 'smooth'
            });
        }
    });
});

// Add scroll indicator on hero section if it exists
function addScrollIndicator() {
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        const scrollIndicator = document.createElement('div');
        scrollIndicator.classList.add('scroll-indicator');
        scrollIndicator.innerHTML = '<i class="fas fa-chevron-down"></i>';

        scrollIndicator.addEventListener('click', () => {
            // Scroll to the next section after hero
            const nextSection = heroSection.nextElementSibling;
            if (nextSection) {
                nextSection.scrollIntoView({ behavior: 'smooth' });
            }
        });

        heroSection.appendChild(scrollIndicator);
    }
}

// Use IntersectionObserver for scroll animations
const createObserver = () => {
    const options = {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.1 // 10% of the item visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.classList.contains('animate-on-scroll')) {
                    entry.target.classList.add('animated');
                } else if (entry.target.classList.contains('fade-in')) {
                    entry.target.classList.add('visible');
                }
                observer.unobserve(entry.target); // Stop observing once animated
            }
        });
    }, options);

    return observer;
};

// Add animation to elements when they come into viewport - updated version with IntersectionObserver
const setupScrollAnimations = () => {
    const observer = createObserver();

    // Observe animate-on-scroll elements
    document.querySelectorAll('.animate-on-scroll').forEach(element => {
        observer.observe(element);
    });

    // Observe fade-in elements
    document.querySelectorAll('.fade-in').forEach(element => {
        observer.observe(element);
    });
};

// Fallback for browsers that don't support IntersectionObserver
const animateOnScroll = () => {
    if ('IntersectionObserver' in window) {
        setupScrollAnimations();
        return;
    }

    // Fallback to traditional scroll detection
    const elements = document.querySelectorAll('.animate-on-scroll');
    const fadeElements = document.querySelectorAll('.fade-in');

    elements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;

        if (elementPosition < windowHeight - 100) {
            element.classList.add('animated');
        }
    });

    fadeElements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;

        if (elementPosition < windowHeight - 70) {
            element.classList.add('visible');
        }
    });
};

// Listen for scroll events (fallback method)
window.addEventListener('scroll', animateOnScroll);

// Run once on page load
window.addEventListener('load', () => {
    // Add scroll indicator
    addScrollIndicator();

    // Setup animations
    animateOnScroll();
});

// Add enhanced hover effects to product cards
const productCards = document.querySelectorAll('.product-card');
productCards.forEach(card => {
    // Enhanced hover effect with subtle rotation
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-10px) scale(1.02) rotate(0.5deg)';
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1) rotate(0deg)';
    });
});

// Add micro-interactions to buttons
const buttons = document.querySelectorAll('.btn');
buttons.forEach(button => {
    button.addEventListener('mouseenter', () => {
        button.classList.add('animate-shimmer');
    });

    button.addEventListener('mouseleave', () => {
        setTimeout(() => {
            button.classList.remove('animate-shimmer');
        }, 200);
    });
});

// Theme Toggle Functionality
const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = document.querySelector('.theme-toggle i');
const body = document.body;

// Check if user has previously set a theme preference
const currentTheme = localStorage.getItem('theme');
if (currentTheme) {
    body.classList.add(currentTheme);
    updateThemeIcon(currentTheme === 'light-theme');
}

// Toggle theme when the button is clicked
themeToggle.addEventListener('click', () => {
    const isLightTheme = body.classList.toggle('light-theme');

    // Save the theme preference
    localStorage.setItem('theme', isLightTheme ? 'light-theme' : '');

    // Update the icon
    updateThemeIcon(isLightTheme);
});

// Function to update the icon based on the current theme
function updateThemeIcon(isLightTheme) {
    if (isLightTheme) {
        themeIcon.className = 'fas fa-moon';
    } else {
        themeIcon.className = 'fas fa-sun';
    }
}

// Image placeholder functionality
function handleImageError(img) {
    const width = img.clientWidth || 400;
    const height = img.clientHeight || 300;
    const placeholderUrl = `https://placehold.co/${width}x${height}/1a1a1a/ffffff?text=Harnam+Masale`;

    // Store original src for potential retry
    if (!img.dataset.originalSrc) {
        img.dataset.originalSrc = img.src;
    }

    img.src = placeholderUrl;
}

// Add error handling to all images
document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('error', () => handleImageError(img));
    });
});

// Page transition for links
document.addEventListener('DOMContentLoaded', () => {
    // External links should behave normally
    const internalLinks = document.querySelectorAll('a[href^="/"]:not([target]), a[href^="./"]:not([target]), a[href^="../"]:not([target]), a[href^="#"]:not([target])');

    internalLinks.forEach(link => {
        // Skip anchor links and JS links
        if (link.getAttribute('href').startsWith('#') || link.getAttribute('href').startsWith('javascript:')) {
            return;
        }

        link.addEventListener('click', function(e) {
            if (!e.ctrlKey && !e.metaKey) { // Let users open in new tabs if they want
                e.preventDefault();

                const targetUrl = this.getAttribute('href');
                
                // IMPORTANT: Always save cart to localStorage BEFORE any navigation
                if (window.HarnamCart && window.HarnamCart.getCart) {
                    // Force save cart synchronously to localStorage
                    const currentCart = window.HarnamCart.getCart();
                    if (currentCart && currentCart.length > 0) {
                        try {
                            // Save both as regular localStorage and backup
                            localStorage.setItem('harnamCart', JSON.stringify(currentCart));
                            localStorage.setItem('harnamCart_backup', JSON.stringify(currentCart));
                            console.log('Pre-navigation: Saved cart with', currentCart.length, 'items');
                        } catch (err) {
                            console.error('Error saving cart before navigation:', err);
                        }
                    }
                }

                // Fade out current page
                document.body.style.opacity = '0';
                document.body.style.transition = 'opacity 0.3s ease-out';

                // Navigate after fade-out - this delay gives time for localStorage to be written
                setTimeout(() => {
                    // Double-check cart is saved right before navigation
                    if (window.HarnamCart && window.HarnamCart.getCart) {
                        const finalCart = window.HarnamCart.getCart();
                        if (finalCart && finalCart.length > 0) {
                            localStorage.setItem('harnamCart', JSON.stringify(finalCart));
                            localStorage.setItem('harnamCartTimestamp', Date.now());
                        }
                    }
                    window.location.href = targetUrl;
                }, 300);
            }
        });
    });
});

// Setup cart modal functionality - removed duplicate from here since it's now in cart.js