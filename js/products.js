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
