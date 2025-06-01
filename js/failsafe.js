// Failsafe.js - Last-resort fix for section visibility
(function() {
    // Function to forcibly show all sections if none are visible
    function ensureContentIsVisible() {
        const mainContent = document.querySelector('main');
        
        if (!mainContent) {
            console.error('Main content container not found!');
            return;
        }
        
        // Check if any sections are visible
        const sections = document.querySelectorAll('section[id]');
        let anyVisible = false;
        
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const style = window.getComputedStyle(section);
            
            if (style.display !== 'none') {
                anyVisible = true;
                break;
            }
        }
        
        // If no sections are visible, make them all visible
        if (!anyVisible) {
            console.warn('FAILSAFE: No sections are visible! Making them all visible.');
            
            for (let i = 0; i < sections.length; i++) {
                const section = sections[i];
                // Use inline style to override CSS
                section.style.display = 'block';
                // Also add active class
                section.classList.add('visible-by-failsafe');
            }
            
            // Add a banner to indicate failsafe mode
            const banner = document.createElement('div');
            banner.style.position = 'fixed';
            banner.style.top = '80px';
            banner.style.left = '0';
            banner.style.right = '0';
            banner.style.backgroundColor = 'rgba(255,0,0,0.7)';
            banner.style.color = 'white';
            banner.style.padding = '10px';
            banner.style.textAlign = 'center';
            banner.style.zIndex = '9999';
            banner.innerText = 'FAILSAFE MODE ACTIVE: All sections have been made visible.';
            document.body.appendChild(banner);
        }
    }
    
    // Wait until everything is loaded, then check if content is visible
    window.addEventListener('load', function() {
        // Wait 2 seconds to ensure all scripts have run
        setTimeout(ensureContentIsVisible, 2000);
    });
})();
