// Emergency fix for Harnam Masale website
// This script directly manipulates the DOM to ensure content is visible

(function() {
    console.log('Emergency fix script loaded');
    
    // Wait for DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function() {
        // Wait a bit for other scripts to run
        setTimeout(fixSections, 1000);
    });
    
    function fixSections() {
        console.log('Running emergency section fix');
        
        // First try to use the proper way - add active class to sections
        const sections = document.querySelectorAll('section[id]');
        if (sections.length === 0) {
            console.error('No sections found! Cannot fix.');
            return;
        }
        
        console.log(`Found ${sections.length} sections`);
        
        // Check if any section is already visible
        let anyVisible = false;
        sections.forEach(section => {
            const style = window.getComputedStyle(section);
            if (style.display !== 'none') {
                anyVisible = true;
                console.log(`Section ${section.id} is already visible`);
            }
        });
        
        if (!anyVisible) {
            console.log('No visible sections found, making hero section visible');
            
            // Make hero section visible
            const heroSection = document.getElementById('hero');
            if (heroSection) {
                heroSection.classList.add('active');
                console.log('Added active class to hero section');
                
                // For extra safety, also set inline style
                heroSection.style.display = 'block';
                
                // Also check products section
                const productsSection = document.getElementById('products');
                if (productsSection) {
                    productsSection.classList.add('active');
                    productsSection.style.display = 'block';
                    console.log('Also made products section visible');
                }
                
                // Set active state in nav
                const heroNav = document.querySelector('.nav-item[data-section="hero"]');
                if (heroNav) {
                    heroNav.classList.add('active');
                    console.log('Set active state on hero nav item');
                }
            } else {
                console.error('Hero section not found!');
                
                // If hero section is not found, make all sections visible
                sections.forEach(section => {
                    section.classList.add('active');
                    section.style.display = 'block';
                });
                console.log('Made all sections visible as fallback');
            }
        }
    }
})();
