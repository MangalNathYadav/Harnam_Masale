// Shared admin helpers — kinda a grab bag for stuff we reuse

(function() {
    // Try to shove the admin’s name/email/photo into the UI (if we have it)
    function updateAdminProfile() {
        // See if we can get the current user from somewhere (could be messy)
        let currentUser = null;
        
        if (typeof window.HarnamAuth !== 'undefined') {
            currentUser = window.HarnamAuth.getCurrentUser();
        } else if (typeof window.FirebaseUtil !== 'undefined') {
            currentUser = window.FirebaseUtil.auth.getCurrentUser();
        } else {
            // Last resort: localStorage. Not great, but hey, it works for now
            currentUser = JSON.parse(localStorage.getItem('harnamCurrentUser'));
        }
        
        if (currentUser) {
            // Drop the name/email into the DOM (fallbacks if missing)
            const adminName = document.getElementById('admin-name');
            const adminEmail = document.getElementById('admin-email');
            
            if (adminName) adminName.textContent = currentUser.name || 'Admin User';
            if (adminEmail) adminEmail.textContent = currentUser.email || 'admin@domain.com';
            
            // Got a photo? Toss it in, otherwise just leave the icon
            if (currentUser.photo) {
                const profileIcons = document.querySelectorAll('.fa-user-circle');
                
                profileIcons.forEach(icon => {
                    // Quick swap: icon for real photo (could be cleaner)
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
                    
                    // Not the prettiest way, but it works
                    if (icon.parentNode) {
                        icon.parentNode.replaceChild(img, icon);
                    }
                });
            }
        }
    }
    
    // Wait for DOM, then do the profile update thing
    document.addEventListener('DOMContentLoaded', () => {
        updateAdminProfile();
    });
    
    // Expose to window so other scripts can poke it
    window.AdminUtils = {
        updateAdminProfile
    };
})();
