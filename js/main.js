// Single Page Application Main JS

// Constants and Configuration
const TEST_USER = {
    email: 'test@test.com',
    password: 'test',
    name: 'Test User'
};

// Global State
let currentUser = null;
let cart = {
    items: [],
    total: 0
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Make the showSection function globally accessible
    window.showSectionGlobal = showSection;
    
    initializeSPA();
    loadUserState();
    loadCartState();
    initializeDragAndDrop();
    initializeAuthForms();
    setupEventListeners();
    loadProducts();
    loadThemePreference();
      // Make sure at least one section is active on page load
    const activeSection = document.querySelector('section[id].active');
    if (!activeSection) {
        console.log('No active section found, activating hero section');
        
        // Get the current hash from the URL
        const hash = window.location.hash.substring(1);
        
        // If hash exists, show that section, otherwise default to hero
        if (hash && document.getElementById(hash)) {
            showSection(hash);
        } else {
            showSection('hero');
        }
    } else {
        console.log('Active section already exists:', activeSection.id);
    }
});

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

function setupEventListeners() {
    // Auth button
    document.getElementById('authBtn')?.addEventListener('click', () => {
        if (currentUser) {
            toggleProfileDropdown();
        } else {
            showAuthModal();
        }
    });
    
    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });
    
    // Cart button
    document.getElementById('cartBtn')?.addEventListener('click', toggleCartSidebar);
    
    // Close cart button
    document.querySelector('.close-cart')?.addEventListener('click', toggleCartSidebar);
    
    // Theme toggle
    document.querySelector('.theme-toggle')?.addEventListener('click', toggleTheme);
    
    // Add click handlers for nav links
    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            if (sectionId) {
                showSection(sectionId);
            }
        });
    });
    
    // Checkout button
    document.querySelector('.btn-checkout')?.addEventListener('click', () => {
        if (cart.items.length === 0) {
            showToast('Your cart is empty', 'info');
            return;
        }
        
        showToast('Checkout functionality coming soon!', 'info');
    });
    
    // Contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Message sent! We will get back to you soon.', 'success');
            contactForm.reset();
        });
    }
    
    // Newsletter subscription
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Thank you for subscribing to our newsletter!', 'success');
            newsletterForm.reset();
        });
    }
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    
    const themeIcon = document.querySelector('.theme-toggle i');
    if (themeIcon) {
        if (document.body.classList.contains('light-theme')) {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        } else {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    }
    
    // Save theme preference
    localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
}

function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        const themeIcon = document.querySelector('.theme-toggle i');
        if (themeIcon) {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Set icon based on toast type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Remove toast after 5 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 5000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// Firebase Integration Placeholders
function firebaseLogin(email, password) {
    /* TODO: integrate Firebase Auth */
    console.log('Firebase login placeholder for:', email);
    // For now, we're using the test user authentication
}

function firebaseLogout() {
    /* TODO: integrate Firebase Auth logout */
    console.log('Firebase logout placeholder');
    // For now, we're using localStorage for auth state
}

function firebaseCreateUser(email, password, name) {
    /* TODO: integrate Firebase Auth user creation */
    console.log('Firebase create user placeholder');
    // For now, we're using the test user only
}

function firebaseGetUserProfile() {
    /* TODO: integrate Firebase User Profile retrieval */
    console.log('Firebase get user profile placeholder');
    // For now, we're using localStorage for user data
}

function firebaseSaveCart(userId, cartData) {
    /* TODO: integrate Firebase Cart saving */
    console.log('Firebase save cart placeholder');
    // For now, we're using localStorage for cart data
}

function firebaseLoadCart(userId) {
    /* TODO: integrate Firebase Cart loading */
    console.log('Firebase load cart placeholder');
    // For now, we're using localStorage for cart data
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

// Authentication and User Management
function initializeAuthForms() {
    // Login form submission
    const loginForm = document.getElementById('loginForm')?.querySelector('form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;
            handleLogin(email, password);
        });
    }

    // Signup form submission
    const signupForm = document.getElementById('signupForm')?.querySelector('form');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Signup functionality coming soon!', 'info');
            // This would normally create a new user
        });
    }

    // Form toggle links
    document.getElementById('showSignup')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'block';
    });

    document.getElementById('showLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('signupForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
    });

    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
        });
    });

    // Close modal when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

function handleLogin(email, password) {
    // Check against test user
    if (email === TEST_USER.email && password === TEST_USER.password) {
        currentUser = { 
            email: TEST_USER.email, 
            name: TEST_USER.name 
        };
        saveUserState();
        updateAuthUI();
        closeAuthModal();
        showToast(`Welcome back, ${currentUser.name}!`, 'success');
        
        // Load user's cart if it exists
        loadCartState();
    } else {
        showToast('Invalid email or password!', 'error');
    }
}

function handleLogout() {
    currentUser = null;
    saveUserState();
    updateAuthUI();
    showToast('You have been logged out', 'info');
}

function updateAuthUI() {
    const authBtn = document.getElementById('authBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    
    if (currentUser) {
        // Update auth button to show user name
        if (authBtn) {
            authBtn.innerHTML = `
                <i class="fas fa-user-check"></i>
                <span>${currentUser.name}</span>
            `;
            authBtn.onclick = toggleProfileDropdown;
        }
        
        // Show profile dropdown
        if (profileDropdown) {
            profileDropdown.style.display = 'block';
        }
        
        // Update profile section if it exists
        updateProfileSection();
    } else {
        // Reset auth button
        if (authBtn) {
            authBtn.innerHTML = `
                <i class="fas fa-user"></i>
                <span>Login</span>
            `;
            authBtn.onclick = showAuthModal;
        }
        
        // Hide profile dropdown
        if (profileDropdown) {
            profileDropdown.style.display = 'none';
        }
    }
}

function saveUserState() {
    if (currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
        localStorage.removeItem('currentUser');
    }
}

function loadUserState() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            updateAuthUI();
        } catch (error) {
            console.error('Error parsing user data from localStorage:', error);
            localStorage.removeItem('currentUser');
        }
    }
}

function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        if (dropdown.style.display === 'block') {
            dropdown.style.display = 'none';
        } else {
            dropdown.style.display = 'block';
        }
    }
}

function updateProfileSection() {
    const profileSection = document.getElementById('profile');
    if (profileSection && currentUser) {
        const nameFields = profileSection.querySelectorAll('.user-name');
        const emailFields = profileSection.querySelectorAll('.user-email');
        
        nameFields.forEach(field => field.textContent = currentUser.name);
        emailFields.forEach(field => field.textContent = currentUser.email);
    }
}

function showAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('signupForm').style.display = 'none';
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('active');
    }
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

// SPA Navigation and Routing
function initializeSPA() {
    // Set up navigation links
    const navLinks = document.querySelectorAll('.nav-item');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showSection(section);
        });
    });

    // Set up mobile menu
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinksList = document.querySelector('.nav-links');
    
    if (mobileMenu && navLinksList) {
        mobileMenu.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            navLinksList.classList.toggle('active');
        });
    }

    // Handle hash-based navigation
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.substring(1);
        if (hash) {
            showSection(hash);
        }
    });

    // Check initial hash
    const initialHash = window.location.hash.substring(1);
    if (initialHash) {
        showSection(initialHash);
    }

    // Quick fix to ensure sections are visible - remove this in production
    // This is just for debugging to make sure content is visible
    const tempShowAllSections = () => {
        console.log('Temporary fix: showing all sections for debugging');
        const allSections = document.querySelectorAll('section[id]');
        
        // Make the first section (hero) active by default
        if (allSections.length > 0) {
            allSections[0].classList.add('active');
        }
        
        // Show navigation for the active section
        const navLinks = document.querySelectorAll('.nav-item');
        navLinks.forEach(link => {
            if (link.getAttribute('data-section') === 'home' || link.getAttribute('data-section') === 'hero') {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    };
    
    // Call the temporary fix
    tempShowAllSections();
}

function showSection(sectionId) {
    console.log(`Showing section: ${sectionId}`);
    
    // Handle special case for "home" -> "hero" conversion
    if (sectionId === 'home') {
        console.log('Converting "home" to "hero" section ID');
        sectionId = 'hero';
    }
    
    // Hide all sections
    const allSections = document.querySelectorAll('section[id]');
    allSections.forEach(section => {
        section.classList.remove('active');
    });

    // Show the requested section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        console.log(`Found target section: ${sectionId}`);
        targetSection.classList.add('active');
        
        // Force display block to ensure visibility
        targetSection.style.display = 'block';
        
        // Update navigation links
        const navLinks = document.querySelectorAll('.nav-item');
        navLinks.forEach(link => {
            link.classList.remove('active');
            // Handle both home->hero case and regular case
            const linkSection = link.getAttribute('data-section');
            if (linkSection === sectionId || (linkSection === 'home' && sectionId === 'hero')) {
                link.classList.add('active');
            }
        });

        // Update URL hash without scrolling
        const scrollPosition = window.scrollY;
        window.location.hash = sectionId;
        window.scrollTo(0, scrollPosition);
        
        // Close mobile menu if open
        const mobileMenu = document.querySelector('.mobile-menu');
        const navLinksList = document.querySelector('.nav-links');
        if (mobileMenu && mobileMenu.classList.contains('active')) {
            mobileMenu.classList.remove('active');
            navLinksList.classList.remove('active');
        }

        // Scroll to top for new sections (except when opening modals)
        if (!['cart', 'profile'].includes(sectionId)) {
            window.scrollTo(0, 0);
        }
    }
}

// Cart Management
function initializeDragAndDrop() {
    // Will be set up after products are loaded
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    // Setup cart as drop target
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
        cartBtn.addEventListener('dragover', (e) => {
            e.preventDefault();
            cartBtn.classList.add('drag-over');
        });

        cartBtn.addEventListener('dragleave', () => {
            cartBtn.classList.remove('drag-over');
        });

        cartBtn.addEventListener('drop', (e) => {
            e.preventDefault();
            cartBtn.classList.remove('drag-over');
            
            const productId = e.dataTransfer.getData('text/plain');
            handleAddToCart(parseInt(productId));
        });
    }
}

// Add setupProductDraggable function
function setupProductDraggable() {
    // Add drag-and-drop functionality to product cards for cart interaction
    const productCards = document.querySelectorAll('.product-card');
    const cartBtn = document.getElementById('cartBtn');
    
    if (!productCards.length || !cartBtn) return;
    
    productCards.forEach(card => {
        card.setAttribute('draggable', 'true');
        
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', card.getAttribute('data-product-id'));
            card.classList.add('dragging');
        });
        
        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });
    });
    
    // Setup the cart button as a drop target
    cartBtn.addEventListener('dragover', (e) => {
        e.preventDefault();
        cartBtn.classList.add('drag-over');
    });
    
    cartBtn.addEventListener('dragleave', () => {
        cartBtn.classList.remove('drag-over');
    });
    
    cartBtn.addEventListener('drop', (e) => {
        e.preventDefault();
        cartBtn.classList.remove('drag-over');
        
        const productId = e.dataTransfer.getData('text/plain');
        if (productId) {
            // Find the product and add to cart
            const productData = window.PRODUCTS_DATA?.products?.find(p => p.id.toString() === productId);
            if (productData) {
                addToCart(productData);
                showToast(`Added ${productData.name} to cart`, 'success');
            }
        }
    });
}

function handleAddToCart(productId) {
    if (!currentUser) {
        showToast('Please log in to add items to your cart.', 'error');
        return;
    }

    // Find the product in our products data
    fetch('js/products.json')
        .then(response => response.json())
        .then(data => {
            const product = data.products.find(p => p.id === productId);
            if (product) {
                addToCart(product);
                
                // Highlight cart icon
                const cartBtn = document.getElementById('cartBtn');
                cartBtn.classList.add('cart-highlight');
                setTimeout(() => {
                    cartBtn.classList.remove('cart-highlight');
                }, 500);
            }
        })
        .catch(error => {
            console.error('Error loading product data:', error);
            showToast('Error adding product to cart.', 'error');
        });
}

// Add a backup addToCart function if it's not already defined in cart.js
if (typeof window.addToCart !== 'function') {
    function addToCart(product) {
        console.log('Adding product to cart:', product);
        
        if (!product) {
            console.error('Cannot add undefined product to cart');
            return;
        }
        
        // Initialize cart if needed
        if (!cart.items) {
            cart.items = [];
        }
        
        // Check if product already exists in cart
        const existingProductIndex = cart.items.findIndex(item => item.id === product.id);
        
        if (existingProductIndex >= 0) {
            // Increase quantity if product already exists
            cart.items[existingProductIndex].quantity += 1;
        } else {
            // Add new product with quantity 1
            cart.items.push({
                ...product,
                quantity: 1
            });
        }
        
        // Update cart total
        updateCartTotal();
        
        // Update cart count in UI
        updateCartCount();
        
        // Save cart to localStorage
        saveCartState();
        
        // Show notification
        showToast(`Added ${product.name} to cart`, 'success');
    }
    
    function updateCartTotal() {
        cart.total = cart.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }
    
    function updateCartCount() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const itemCount = cart.items.reduce((count, item) => count + item.quantity, 0);
            cartCount.textContent = itemCount;
        }
    }
    
    function saveCartState() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }
}

//# sourceMappingURL=main.js.map