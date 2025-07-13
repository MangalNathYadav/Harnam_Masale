// About page specific functionality

document.addEventListener('DOMContentLoaded', function() {
    // Load dynamic about page data (founder photo, certifications)
    loadAboutPageDynamicData();
// Load founder photo and certifications from Firebase RTDB
function loadAboutPageDynamicData() {
    if (typeof firebase === 'undefined' || !firebase.database) return;
    firebase.database().ref('settings/about').once('value').then(function(snapshot) {
        if (!snapshot.exists()) return;
        const about = snapshot.val();
        // Founder photo
        if (about.founderSection && about.founderSection.image) {
            const founderImg = document.getElementById('founder-img-dynamic');
            if (founderImg) founderImg.src = about.founderSection.image;
        }
        // Certifications
        if (Array.isArray(about.certifications)) {
            const certsDiv = document.getElementById('certifications-dynamic');
            if (certsDiv) {
                certsDiv.innerHTML = '';
                about.certifications.forEach(function(cert, idx) {
                    const card = document.createElement('div');
                    card.className = 'contact-card cert-card animate-on-scroll';
                    card.setAttribute('data-delay', (0.1 + idx * 0.2).toFixed(1));
                    card.innerHTML = `
                        <div class="contact-card-icon">
                            <i class="${cert.icon || 'fas fa-certificate'}"></i>
                        </div>
                        <h3>${cert.title || ''}</h3>
                        <p>${cert.description || ''}</p>
                        <div class="cert-badge">
                            <span>${cert.badge || ''}</span>
                        </div>
                    `;
                    certsDiv.appendChild(card);
                });
                // Re-run animation observer if needed
                if (typeof initializeAnimations === 'function') initializeAnimations();
            }
        }
    });
}
    // Initialize animations
    initializeAnimations();
    
    // Initialize cart functionality - Simplified to use centralized cart system
    setTimeout(() => {
        if (typeof window.HarnamCart !== 'undefined') {
            console.log('Cart system available on About page');
            
            try {
                // Cart is automatically initialized by cart.js
                // Just ensure UI is updated
                if (typeof window.HarnamCart.updateCartCount === 'function') {
                    window.HarnamCart.updateCartCount();
                }
                console.log('Cart system ready on About page');
            } catch (error) {
                console.error('Error accessing cart system:', error);
            }
        } else {
            console.error('HarnamCart not available - make sure cart.js is loaded');
        }
    }, 300);
});

// Animation and other about page specific functions
function initializeAnimations() {
    // Animation for timeline and other about page elements
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    if (animateElements.length > 0) {
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
        animateElements.forEach(element => {
            observer.observe(element);
        });
    }
}
