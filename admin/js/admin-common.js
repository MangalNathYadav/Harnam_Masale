// Common admin utilities for Harnam Masale

(function() {
    // Update admin UI with user profile info
    function updateAdminProfile() {
        // Get current user from auth system
        let currentUser = null;
        
        if (typeof window.HarnamAuth !== 'undefined') {
            currentUser = window.HarnamAuth.getCurrentUser();
        } else if (typeof window.FirebaseUtil !== 'undefined') {
            currentUser = window.FirebaseUtil.auth.getCurrentUser();
        } else {
            // Fallback to localStorage
            currentUser = JSON.parse(localStorage.getItem('harnamCurrentUser'));
        }
        
        if (currentUser) {
            // Update admin name and email
            const adminName = document.getElementById('admin-name');
            const adminEmail = document.getElementById('admin-email');
            
            if (adminName) adminName.textContent = currentUser.name || 'Admin User';
            if (adminEmail) adminEmail.textContent = currentUser.email || 'admin@domain.com';
            
            // Update profile photo if available
            if (currentUser.photo) {
                const profileIcons = document.querySelectorAll('.fa-user-circle');
                
                profileIcons.forEach(icon => {
                    // Create an image element
                    const img = document.createElement('img');
                    img.src = currentUser.photo;
                    img.alt = currentUser.name || 'Admin User';
                    img.className = 'admin-profile-pic';
                    img.style.cssText = `
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        object-fit: cover;
                        vertical-align: middle;
                    `;
                    
                    // Replace the icon with the image
                    if (icon.parentNode) {
                        icon.parentNode.replaceChild(img, icon);
                    }
                });
            }
        }
    }
    
    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        updateAdminProfile();
    });
    
    // Expose admin utils globally
    window.AdminUtils = {
        updateAdminProfile
    };
})();
