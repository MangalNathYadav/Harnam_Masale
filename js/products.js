// Products page specific animations and interactions
document.addEventListener('DOMContentLoaded', function() {
    // Initialize animation for elements with .animate-on-scroll class
    initScrollAnimations();
    
    // Enhanced parallax effect for hero section
    initParallaxEffect();
    
    // Initialize floating particles
    createFloatingParticles();
    
    // Handle scroll indicator click
    setupScrollIndicator();
    
    // Sidebar Toggle Functionality
    const filterToggleBtn = document.querySelector('.filter-toggle-btn');
    const sidebar = document.querySelector('.products-sidebar');
    const sidebarClose = document.querySelector('.sidebar-close');
    const overlay = document.querySelector('.sidebar-overlay');

    // Toggle sidebar
    filterToggleBtn.addEventListener('click', toggleSidebar);
    sidebarClose.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);

    function toggleSidebar() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
    }

    // Close sidebar on window resize if screen becomes larger
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    // Initialize modal functionality
    setupProductModal();
});

// Initialize scroll animations
function initScrollAnimations() {
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
        threshold: 0.15
    });

    document.querySelectorAll('.animate-on-scroll').forEach(item => {
        observer.observe(item);
    });
}

// Enhanced parallax scrolling effect
function initParallaxEffect() {
    let lastScrollY = window.scrollY;
    const heroContent = document.querySelector('.contact-hero-content');
    const heroBg = document.querySelector('.contact-hero-bg');
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
            
            lastScrollY = scroll;
        }
        
        requestAnimationFrame(updateParallax);
    };
    
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

// Setup smooth scroll for the scroll indicator
function setupScrollIndicator() {
    const scrollIndicator = document.querySelector('.scroll-indicator');
    const productGrid = document.querySelector('#product-grid');
    
    if (scrollIndicator && productGrid) {
        scrollIndicator.addEventListener('click', () => {
            productGrid.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    }
}

// Setup modal functionality
function setupProductModal() {
    const modal = document.getElementById('product-modal');
    const closeBtn = modal.querySelector('.close-modal');
    
    // Add click event to all view details buttons
    document.querySelectorAll('.product-action-btn').forEach(btn => {
        if (btn.querySelector('.fa-eye')) {
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
}

function openProductModal(productCard) {
    const modal = document.getElementById('product-modal');
    if (!modal || !productCard) return;

    // Get product details
    const title = productCard.querySelector('.product-title').textContent;
    const image = productCard.querySelector('.product-img').src;
    const description = productCard.querySelector('.product-desc').textContent;
    const price = productCard.querySelector('.price').textContent;
    const ratingHTML = productCard.querySelector('.product-rating').innerHTML;

    // Set modal content
    modal.querySelector('.modal-product-title').textContent = title;
    modal.querySelector('#modal-product-image').src = image;
    modal.querySelector('#modal-product-image').alt = title;
    modal.querySelector('.modal-product-description').textContent = description;
    modal.querySelector('.modal-product-price').textContent = `₹${price}`;
    modal.querySelector('.modal-product-rating .stars').innerHTML = ratingHTML;

    // Show modal with animation
    modal.style.display = 'block';
    setTimeout(() => {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }, 10);
}

function closeModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 300);
}
