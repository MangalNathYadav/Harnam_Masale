// Debug helper for Harnam Masale website
document.addEventListener('DOMContentLoaded', function() {
    console.log('Debug.js loaded');
    
    // Check section visibility and report
    setTimeout(function() {
        const sections = document.querySelectorAll('section[id]');
        console.log(`Found ${sections.length} sections with IDs:`);
        
        sections.forEach(section => {
            const isActive = section.classList.contains('active');
            const isDisplayed = window.getComputedStyle(section).display !== 'none';
            console.log(`- Section #${section.id}: active=${isActive}, displayed=${isDisplayed}`);
        });
        
        const activeSection = document.querySelector('section[id].active');
        if (!activeSection) {
            console.warn('No section has the active class!');
            
            // Emergency fix - make hero section visible
            const heroSection = document.getElementById('hero');
            if (heroSection) {
                heroSection.classList.add('active');
                console.log('Applied emergency fix: Added active class to hero section');
            }
        } else {
            console.log(`Active section is: #${activeSection.id}`);
        }
        
        // Check for router.js errors
        if (!window.router) {
            console.error('Router is not initialized!');
        }
    }, 1000);
    
    // Monitor hash changes
    window.addEventListener('hashchange', function() {
        console.log('Hash changed to:', window.location.hash);
    });
});
