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
const mobileMenu = document.querySelector('.mobile-menu');
const navLinks = document.querySelector('.nav-links');

mobileMenu.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    navLinks.classList.toggle('active');

    // Toggle animation for menu bars
    const bars = document.querySelectorAll('.bar');
    bars[0].classList.toggle('animate-bar1');
    bars[1].classList.toggle('animate-bar2');
    bars[2].classList.toggle('animate-bar3');
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