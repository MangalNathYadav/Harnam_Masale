// Admin Authentication Module
document.addEventListener('DOMContentLoaded', function() {
    // Check if the current page is admin login
    const isLoginPage = window.location.pathname.includes('index.html') || 
                        window.location.pathname.endsWith('/admin/');
    
    if (isLoginPage) {
        initLoginPage();
    } else {
        // For other admin pages, check authentication
        checkAdminAuth();
    }
    
    // Initialize the user dropdown if it exists (on dashboard pages)
    initUserDropdown();
});

// Initialize login page functionality
function initLoginPage() {
    const loginForm = document.getElementById('admin-login-form');
    const loginMessage = document.getElementById('login-message');
    const togglePasswordBtn = document.getElementById('toggle-password');
    
    if (!loginForm || !loginMessage) return;
    
    // Toggle password visibility
    if (togglePasswordBtn) {
        const passwordInput = document.getElementById('password');
        
        togglePasswordBtn.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle icon
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }
    
    // Handle login form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = loginForm.email.value.trim();
        const password = loginForm.password.value;
        
        // Basic validation
        if (!email || !password) {
            showLoginMessage('Please enter both email and password', 'error');
            return;
        }
        
        // Disable form and show loading
        toggleFormState(loginForm, true);
        showLoginMessage('Logging in...', 'info');
        
        try {
            // Attempt to sign in with Firebase
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
              // Check if user email is in the list of admin emails
            const adminEmails = ['harnammasale@gmail.com', 'admin@harnammasale.com'];
            const isAdmin = adminEmails.includes(user.email.toLowerCase());
            
            if (isAdmin) {
                // Store admin status in session storage
                sessionStorage.setItem('harnamAdmin', JSON.stringify({
                    isAdmin: true,
                    email: user.email,
                    uid: user.uid,
                    name: user.displayName || 'Admin'
                }));
                
                showLoginMessage('Login successful! Redirecting...', 'success');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                await firebase.auth().signOut();
                showLoginMessage('Access denied. This account does not have admin privileges.', 'error');
                toggleFormState(loginForm, false);
            }
        } catch (error) {
            console.error('Login Error:', error);
            showLoginMessage(getErrorMessage(error), 'error');
            toggleFormState(loginForm, false);
        }
    });
}

// Check if the user is authenticated and has admin privileges
function checkAdminAuth() {
    // First check session storage
    const adminData = JSON.parse(sessionStorage.getItem('harnamAdmin'));
    
    if (!adminData || !adminData.isAdmin) {
        // Check if Firebase auth has a user
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                try {                    // Check if user email is in the list of admin emails
                    const adminEmails = ['harnammasale@gmail.com', 'admin@harnammasale.com'];
                    const isAdmin = adminEmails.includes(user.email.toLowerCase());
                    
                    if (isAdmin) {
                        // Store admin status in session storage
                        sessionStorage.setItem('harnamAdmin', JSON.stringify({
                            isAdmin: true,
                            email: user.email,
                            uid: user.uid,
                            name: user.displayName || 'Admin'
                        }));
                        
                        // Update UI for admin
                        updateAdminUI(user);
                    } else {
                        // Not an admin, redirect to login
                        redirectToLogin();
                    }
                } catch (error) {
                    console.error('Admin verification error:', error);
                    redirectToLogin();
                }
            } else {
                // No user, redirect to login
                redirectToLogin();
            }
        });
    } else {
        // Admin data found in session storage, update UI
        updateAdminUI(adminData);
    }
}

// Update UI for admin user
function updateAdminUI(adminData) {
    const adminName = document.querySelector('.admin-name');
    const adminEmail = document.querySelector('.admin-email');
    
    if (adminName) {
        adminName.textContent = adminData.name || 'Admin';
    }
    
    if (adminEmail) {
        adminEmail.textContent = adminData.email || '';
    }
}

// Initialize user dropdown in the header
function initUserDropdown() {
    const userDropdown = document.querySelector('.user-dropdown');
    
    if (userDropdown) {
        userDropdown.addEventListener('click', function() {
            this.classList.toggle('open');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!userDropdown.contains(e.target)) {
                userDropdown.classList.remove('open');
            }
        });
        
        // Handle logout click
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                
                try {
                    await firebase.auth().signOut();
                    sessionStorage.removeItem('harnamAdmin');
                    redirectToLogin();
                } catch (error) {
                    console.error('Logout error:', error);
                    showToast('Error logging out. Please try again.', 'error');
                }
            });
        }
    }
}

// Utility function to show login messages
function showLoginMessage(message, type = 'info') {
    const loginMessage = document.getElementById('login-message');
    if (!loginMessage) return;
    
    loginMessage.textContent = message;
    loginMessage.className = 'message-container';
    
    if (type) {
        loginMessage.classList.add(type);
    }
    
    loginMessage.style.display = 'block';
}

// Utility function to toggle form enabled/disabled state
function toggleFormState(form, isLoading) {
    if (!form) return;
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const inputs = form.querySelectorAll('input');
    
    if (submitBtn) {
        submitBtn.disabled = isLoading;
        submitBtn.innerHTML = isLoading ? '<i class="fas fa-spinner fa-spin"></i> Processing...' : 'Login';
    }
    
    inputs.forEach(input => {
        input.disabled = isLoading;
    });
}

// Redirect to login page
function redirectToLogin() {
    window.location.href = 'index.html';
}

// Get user-friendly error messages
function getErrorMessage(error) {
    switch (error.code) {
        case 'auth/invalid-email':
            return 'Invalid email address format.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Invalid email or password.';
        case 'auth/too-many-requests':
            return 'Too many failed login attempts. Please try again later.';
        default:
            return 'Error: ' + (error.message || 'An unexpected error occurred.');
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    // Check if toast container exists, if not create it
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Set icon based on type
    let icon = 'info-circle';
    switch (type) {
        case 'success':
            icon = 'check-circle';
            break;
        case 'error':
            icon = 'exclamation-circle';
            break;
        case 'warning':
            icon = 'exclamation-triangle';
            break;
    }
    
    // Create toast content
    toast.innerHTML = `
        <i class="fas fa-${icon} toast-icon"></i>
        <div class="toast-message">${message}</div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Show toast with animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Add close button functionality
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        });
    }
    
    // Auto close after 5 seconds
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    toast.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Export admin utilities
window.AdminAuth = {
    checkAuth: checkAdminAuth,
    logout: async function() {
        try {
            await firebase.auth().signOut();
            sessionStorage.removeItem('harnamAdmin');
            redirectToLogin();
        } catch (error) {
            console.error('Logout error:', error);
            showToast('Error logging out. Please try again.', 'error');
        }
    },
    getAdminData: function() {
        return JSON.parse(sessionStorage.getItem('harnamAdmin')) || null;
    },
    showToast: showToast
};
