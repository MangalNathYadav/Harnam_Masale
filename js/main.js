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

// Add animation to elements when they come into viewport
const animateOnScroll = () => {
    const elements = document.querySelectorAll('.animate-on-scroll');

    elements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;

        if (elementPosition < windowHeight - 100) {
            element.classList.add('animated');
        }
    });
};

// Listen for scroll events
window.addEventListener('scroll', animateOnScroll);

// Run once on page load
window.addEventListener('load', animateOnScroll);

// Add hover effect to product cards
const productCards = document.querySelectorAll('.product-card');
productCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-10px)';
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
    });
});