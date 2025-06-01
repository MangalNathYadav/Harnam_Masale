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

// Utility Functions
function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    const container = document.getElementById('toastContainer');
    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    const bars = document.querySelectorAll('.bar');

    mobileMenu.classList.toggle('active');
    navLinks.classList.toggle('active');
    bars[0].classList.toggle('animate-bar1');
    bars[1].classList.toggle('animate-bar2');
    bars[2].classList.toggle('animate-bar3');
}

// Theme Toggle
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.querySelector('.theme-toggle i');
    const isLightTheme = body.classList.toggle('light-theme');

    // Update icon
    themeIcon.className = isLightTheme ? 'fas fa-moon' : 'fas fa-sun';

    // Save theme preference
    localStorage.setItem('theme', isLightTheme ? 'light-theme' : '');
}

// Scroll Animation
function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.classList.contains('animate-on-scroll')) {
                    entry.target.classList.add('animated');
                } else if (entry.target.classList.contains('fade-in')) {
                    entry.target.classList.add('visible');
                }
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.animate-on-scroll, .fade-in').forEach(element => {
        observer.observe(element);
    });
}

// Temporary product data
const TEMP_PRODUCTS = [{
        id: '1',
        name: 'Premium Garam Masala',
        description: 'A perfect blend of aromatic spices for authentic Indian cuisine.',
        price: 199,
        category: 'masale',
        image: 'assets/images/products/garam-masala.jpg',
        isNew: true
    },
    {
        id: '2',
        name: 'Turmeric Powder',
        description: 'Pure and organic turmeric powder with rich color and aroma.',
        price: 149,
        category: 'masale',
        image: 'assets/images/products/turmeric.jpg'
    },
    {
        id: '3',
        name: 'Masala Tea',
        description: 'Traditional Indian spiced tea blend for a perfect cup of chai.',
        price: 299,
        category: 'beverages',
        image: 'assets/images/products/masala-tea.jpg'
    },
    {
        id: '4',
        name: 'Spicy Mixture',
        description: 'Crunchy and spicy snack mix perfect for tea time.',
        price: 99,
        category: 'snacks',
        image: 'assets/images/products/mixture.jpg'
    },
    {
        id: '5',
        name: 'Biryani Masala',
        description: 'Special blend of spices for perfect biryani.',
        price: 249,
        category: 'masale',
        image: 'assets/images/products/biryani-masala.jpg',
        isNew: true
    },
    {
        id: '6',
        name: 'Instant Sambar Mix',
        description: 'Quick and easy sambar mix for authentic South Indian taste.',
        price: 179,
        category: 'instant',
        image: 'assets/images/products/sambar-mix.jpg'
    }
];

// Load Products
function loadProducts() {
    const productGrid = document.querySelector('.product-grid');
    if (!productGrid) return;

    productGrid.innerHTML = '';
    TEMP_PRODUCTS.forEach(product => {
        const productCard = createProductCard(product);
        productGrid.appendChild(productCard);
    });

    // Setup category filter after products are loaded
    setupCategoryFilter();
    // Initialize cart functionality
    setupAddToCartButtons();
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Check for saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.classList.add(savedTheme);
        const themeIcon = document.querySelector('.theme-toggle i');
        themeIcon.className = savedTheme === 'light-theme' ? 'fas fa-moon' : 'fas fa-sun';
    }

    // Setup event listeners
    document.querySelector('.mobile-menu').addEventListener('click', toggleMobileMenu);
    document.querySelector('.theme-toggle').addEventListener('click', toggleTheme);

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        const navLinks = document.querySelector('.nav-links');
        const mobileMenu = document.querySelector('.mobile-menu');

        if (navLinks.classList.contains('active') &&
            !e.target.closest('.nav-links') &&
            !e.target.closest('.mobile-menu')) {
            toggleMobileMenu();
        }
    });

    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Initialize scroll animations
    setupScrollAnimations();

    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = anchor.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // Close mobile menu if open
                const navLinks = document.querySelector('.nav-links');
                if (navLinks.classList.contains('active')) {
                    toggleMobileMenu();
                }
            }
        });
    });

    // Add scroll indicator on hero section
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        const scrollIndicator = document.createElement('div');
        scrollIndicator.className = 'scroll-indicator';
        scrollIndicator.innerHTML = '<i class="fas fa-chevron-down"></i>';

        scrollIndicator.addEventListener('click', () => {
            const nextSection = heroSection.nextElementSibling;
            if (nextSection) {
                nextSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });

        heroSection.appendChild(scrollIndicator);
    }

    // Hide loading spinner
    hideLoading();
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

        link.addEventListener('click', (e) => {
            if (!e.ctrlKey && !e.metaKey) { // Let users open in new tabs if they want
                e.preventDefault();

                const targetUrl = link.getAttribute('href');

                // Fade out current page
                document.body.style.opacity = '0';
                document.body.style.transition = 'opacity 0.3s ease-out';

                // Navigate after fade-out
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 300);
            }
        });
    });
});

// 3D Product Card Effects
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.product-card');

    cards.forEach(card => {
        const circle = card.querySelector('.product-circle');
        const img = card.querySelector('.product-img');
        const badge = card.querySelector('.product-badge');
        const info = card.querySelector('.product-info');
        let bounds;

        const mouseMove = (e) => {
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            const leftX = mouseX - bounds.x;
            const topY = mouseY - bounds.y;
            const center = {
                x: leftX - bounds.width / 2,
                y: topY - bounds.height / 2
            }

            const distance = Math.sqrt(center.x ** 2 + center.y ** 2);

            // Tilt values
            const maxRotate = 10;
            const rotateX = (center.y / bounds.height) * maxRotate * 2;
            const rotateY = (center.x / bounds.width) * maxRotate * -2;

            // Scale and translate values for parallax effect
            const scale = 1 + (Math.min(distance, 100) / 1000);

            // Apply transformations
            card.style.transform = `perspective(1500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            circle.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
            img.style.transform = `translate(-50%, -50%) translateZ(80px) rotateX(${rotateX/2}deg) rotateY(${rotateY/2}deg) scale(${scale})`;
            badge.style.transform = `translateZ(100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            info.style.transform = `translateZ(60px) rotateX(${rotateX/3}deg) rotateY(${rotateY/3}deg)`;
        };

        const mouseEnter = (e) => {
            bounds = card.getBoundingClientRect();
            document.addEventListener('mousemove', mouseMove);
        };

        const mouseLeave = () => {
            document.removeEventListener('mousemove', mouseMove);
            // Reset all transformations smoothly
            card.style.transform = 'perspective(1500px) rotateX(0) rotateY(0)';
            circle.style.transform = 'rotateX(0) rotateY(0) scale(1)';
            img.style.transform = 'translate(-50%, -50%) translateZ(80px) scale(0.9)';
            badge.style.transform = 'translateZ(100px)';
            info.style.transform = 'translateZ(20px)';
        };

        // Add event listeners
        card.addEventListener('mouseenter', mouseEnter);
        card.addEventListener('mouseleave', mouseLeave);
    });
});

// Category Navigation
document.addEventListener('DOMContentLoaded', () => {
    const categoryItems = document.querySelectorAll('.category-item');
    const productGrid = document.querySelector('.product-grid');
    const productsContainer = document.querySelector('.products-container');

    if (categoryItems.length && productGrid) {
        categoryItems.forEach(item => {
            item.addEventListener('click', () => {
                // Remove active class from all items
                categoryItems.forEach(cat => cat.classList.remove('active'));

                // Add active class to clicked item
                item.classList.add('active');

                const category = item.getAttribute('data-category');

                // Add fade-out effect
                productGrid.style.opacity = '0';

                setTimeout(() => {
                    if (category === 'all') {
                        // Show all products
                        document.querySelectorAll('.product-card').forEach(card => {
                            card.style.display = 'block';
                        });
                    } else {
                        // Filter products
                        document.querySelectorAll('.product-card').forEach(card => {
                            const productCategory = card.getAttribute('data-category');
                            card.style.display = productCategory === category ? 'block' : 'none';
                        });
                    }

                    // Add fade-in effect
                    productGrid.style.opacity = '1';
                }, 300);
            });
        });
    }
});

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

// Smooth Scrolling
document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll for "Explore Products" button
    const exploreBtn = document.querySelector('.scroll-to-products');
    if (exploreBtn) {
        exploreBtn.addEventListener('click', () => {
            document.getElementById('products').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    }

    // Smooth scroll for scroll indicator
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            document.getElementById('products').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    }

    // Initialize other functionality
    setupThemeToggle();
    setupAuthUI();
    setupCartUI();
    loadProducts();
    setupScrollAnimations();
});

// Theme Toggle
function setupThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
        document.body.classList.add(savedTheme);
        themeToggle.innerHTML = savedTheme === 'light-theme' ?
            '<i class="fas fa-moon"></i>' :
            '<i class="fas fa-sun"></i>';
    }

    themeToggle.addEventListener('click', () => {
        const isLight = document.body.classList.toggle('light-theme');
        themeToggle.innerHTML = isLight ?
            '<i class="fas fa-moon"></i>' :
            '<i class="fas fa-sun"></i>';
        localStorage.setItem('theme', isLight ? 'light-theme' : '');
    });
}

// Auth UI Setup
function setupAuthUI() {
    const authBtn = document.getElementById('authBtn');
    const authModal = document.getElementById('authModal');
    const closeModal = authModal.querySelector('.close-modal');

    // Show/hide auth modal
    authBtn.addEventListener('click', () => {
        authModal.classList.add('active');
    });

    closeModal.addEventListener('click', () => {
        authModal.classList.remove('active');
    });

    // Close modal when clicking outside
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.classList.remove('active');
        }
    });

    // Toggle between login and signup
    document.getElementById('showSignup').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'block';
    });

    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('signupForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
    });
}

// Cart UI Setup
function setupCartUI() {
    const cartBtn = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const closeCart = cartSidebar.querySelector('.close-cart');

    cartBtn.addEventListener('click', () => {
        cartSidebar.classList.add('active');
    });

    closeCart.addEventListener('click', () => {
        cartSidebar.classList.remove('active');
    });

    // Close cart when clicking outside
    document.addEventListener('click', (e) => {
        if (!cartSidebar.contains(e.target) && !cartBtn.contains(e.target)) {
            cartSidebar.classList.remove('active');
        }
    });
}

// Create Product Card
function createProductCard(product) {
    const div = document.createElement('div');
    div.className = 'product-card';
    div.dataset.id = product.id;
    div.dataset.category = product.category;

    div.innerHTML = `
        ${product.isNew ? '<div class="product-badge">New</div>' : ''}
        <div class="product-circle">
            <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
        </div>
        <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="price">₹${product.price}</div>
            <button class="shop-now-btn">Add to Cart</button>
        </div>
    `;

    return div;
}

// Category Filter
function setupCategoryFilter() {
    const categoryItems = document.querySelectorAll('.category-item');
    const productCards = document.querySelectorAll('.product-card');

    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update active state
            categoryItems.forEach(cat => cat.classList.remove('active'));
            item.classList.add('active');

            const category = item.dataset.category;

            // Add fade-out effect
            document.querySelector('.product-grid').style.opacity = '0';

            setTimeout(() => {
                productCards.forEach(card => {
                    if (category === 'all' || card.dataset.category === category) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });

                // Add fade-in effect
                document.querySelector('.product-grid').style.opacity = '1';
            }, 300);
        });
    });
}

// Scroll Animations
function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.fade-in').forEach(element => {
        observer.observe(element);
    });
}

// Fixed header behavior
window.addEventListener('scroll', () => {
    const header = document.querySelector('.fixed-header');
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});