// Mobile Authentication Module
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase Auth state listener
    initAuthStateListener();
    
    // Initialize forms if they exist
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (loginForm) {
        initLoginForm(loginForm);
    }
    
    if (signupForm) {
        initSignupForm(signupForm);
    }
    
    // Initialize social login buttons
    initSocialLogin();
});

// Initialize Firebase Auth state listener
function initAuthStateListener() {
    firebase.auth().onAuthStateChanged(async (user) => {
        console.log('Auth state changed:', user ? 'logged in' : 'logged out'); // Debug log
        
        if (user) {
            // User is signed in
            saveUserToLocalStorage(user);
            
            try {
                // Get additional user data from database
                const userData = await getUserData(user.uid);
                if (userData) {
                    updateLocalUserData(userData);
                } else {
                    // If no user data exists and we're not in the social login flow
                    const currentTime = firebase.database.ServerValue.TIMESTAMP;
                    const newUserData = {
                        name: user.displayName || '',
                        email: user.email || '',
                        phone: user.phoneNumber || '',
                        cart: JSON.parse(localStorage.getItem('cart') || '[]'),
                        createdAt: currentTime,
                        lastLogin: currentTime
                    };
                    await firebase.database().ref('users/' + user.uid).set(newUserData);
                    updateLocalUserData(newUserData);
                }
                
                // Update last login time
                await firebase.database().ref('users/' + user.uid + '/lastLogin').set(firebase.database.ServerValue.TIMESTAMP);
                
                // Only handle redirect if not in social login flow
                if (!sessionStorage.getItem('socialLoginInProgress')) {
                    handleAuthRedirect(true);
                }
            } catch (error) {
                console.error('Error in auth state listener:', error);
                showError('Error updating user data');
            }
        } else {
            // User is signed out
            clearLocalUserData();
            sessionStorage.removeItem('socialLoginInProgress');
            handleAuthRedirect(false);
        }
    });
}

// Initialize login form
function initLoginForm(form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Set redirect page if not already set
        if (!sessionStorage.getItem('authRedirect')) {
            const referrer = document.referrer;
            // Only set if coming from another page in the app
            if (referrer && !referrer.includes('login.html') && !referrer.includes('signup.html')) {
                try {
                    const url = new URL(referrer);
                    const path = url.pathname.split('/').pop();
                    if (path && path.endsWith('.html')) {
                        sessionStorage.setItem('authRedirect', path);
                    }
                } catch (e) {}
            }
        }

        const email = form.email.value.trim();
        const password = form.password.value;
        const remember = form.remember?.checked;

        // Basic validation
        if (!email || !password) {
            showError('Please fill in all fields');
            return;
        }

        showLoading('Logging in...');

        try {
            // Sign in with Firebase
            const credential = await firebase.auth().signInWithEmailAndPassword(email, password);
            // Update persistence if remember me is checked
            if (remember) {
                await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            }
            // Cart sync after login (desktop parity)
            const userId = credential.user.uid;
            const generalCart = JSON.parse(localStorage.getItem('cart') || '[]');
            await firebase.database().ref('users/' + userId + '/cart').set(generalCart);
            // Success overlay
            hideLoading();
            let overlay = document.createElement('div');
            overlay.id = 'auth-success-overlay';
            overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,180,0,0.7);display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:9999;color:white;font-family:Arial,sans-serif;opacity:1;transition:opacity 0.3s;`;
            overlay.innerHTML = `<div style='font-size:32px;margin-bottom:20px;'>✓</div><div style='font-size:18px;font-weight:bold;'>Login successful!</div>`;
            document.body.appendChild(overlay);
            setTimeout(() => {
                overlay.style.opacity = '0';
                setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 300);
            }, 1200);
            // Success handling is done in onAuthStateChanged
        } catch (error) {
            hideLoading();
            showError(getErrorMessage(error));
        }
    });
}

// Initialize signup form
function initSignupForm(form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Set redirect page if not already set
        if (!sessionStorage.getItem('authRedirect')) {
            const referrer = document.referrer;
            if (referrer && !referrer.includes('login.html') && !referrer.includes('signup.html')) {
                try {
                    const url = new URL(referrer);
                    const path = url.pathname.split('/').pop();
                    if (path && path.endsWith('.html')) {
                        sessionStorage.setItem('authRedirect', path);
                    }
                } catch (e) {}
            }
        }

        const name = form.name.value.trim();
        const email = form.email.value.trim();
        const phone = form.phone.value.trim();
        const password = form.password.value;

        // Basic validation
        if (!name || !email || !phone || !password) {
            showError('Please fill in all fields');
            return;
        }

        if (password.length < 8) {
            showError('Password must be at least 8 characters long');
            return;
        }

        if (!form.terms.checked) {
            showError('Please accept the Terms & Conditions');
            return;
        }

        showLoading('Creating your account...');

        try {
            // Create user with Firebase
            const credential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            await credential.user.updateProfile({ displayName: name });
            // Save user node in RTDB (desktop parity)
            const userData = {
                name,
                email,
                phone,
                createdAt: new Date().toISOString(),
                cart: [],
                orders: [],
                orderRefs: []
            };
            await firebase.database().ref('users/' + credential.user.uid).set(userData);
            await firebase.database().ref('usersByEmail/' + email.replace(/\./g, ',')).set(credential.user.uid);
            // Auto-login after signup (desktop parity)
            // Cart sync after signup
            await firebase.database().ref('users/' + credential.user.uid + '/cart').set([]);
            hideLoading();
            let overlay = document.createElement('div');
            overlay.id = 'auth-success-overlay';
            overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,180,0,0.7);display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:9999;color:white;font-family:Arial,sans-serif;opacity:1;transition:opacity 0.3s;`;
            overlay.innerHTML = `<div style='font-size:32px;margin-bottom:20px;'>✓</div><div style='font-size:18px;font-weight:bold;'>Account created!</div>`;
            document.body.appendChild(overlay);
            setTimeout(() => {
                overlay.style.opacity = '0';
                setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 300);
            }, 1200);
            // Success handling is done in onAuthStateChanged
        } catch (error) {
            hideLoading();
            showError(getErrorMessage(error));
        }
    });
}

// Initialize social login buttons
function initSocialLogin() {
    const googleBtn = document.querySelector('.social-btn.google');
    
    if (googleBtn) {
        googleBtn.addEventListener('click', () => handleSocialLogin('google'));
    }
}

// Handle social login
async function handleSocialLogin(provider) {
    let authProvider;
    
    switch (provider) {
        case 'google':
            authProvider = new firebase.auth.GoogleAuthProvider();
            authProvider.addScope('profile');
            authProvider.addScope('email');
            break;
        default:
            return;
    }
    
    showLoading('Connecting to ' + provider + '...');
    
    try {
        const result = await firebase.auth().signInWithPopup(authProvider);
        
        // Save user data to local storage immediately
        saveUserToLocalStorage(result.user);
        
        // Get additional user data from database
        const userData = await getUserData(result.user.uid);
        if (userData) {
            updateLocalUserData(userData);
        } else {
            // If user data doesn't exist in database, create it
            const newUserData = {
                name: result.user.displayName,
                email: result.user.email,
                phone: result.user.phoneNumber || '',
                cart: JSON.parse(localStorage.getItem('cart') || '[]'),
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                lastLogin: firebase.database.ServerValue.TIMESTAMP
            };
            await firebase.database().ref('users/' + result.user.uid).set(newUserData);
            updateLocalUserData(newUserData);
        }
        
        // Sync cart data
        const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
        if (localCart.length > 0) {
            await firebase.database().ref('users/' + result.user.uid + '/cart').set(localCart);
        }
        
        // Show success message and redirect
        hideLoading();
        const overlay = document.createElement('div');
        overlay.id = 'auth-success-overlay';
        overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,180,0,0.7);display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:9999;color:white;font-family:Arial,sans-serif;opacity:1;transition:opacity 0.3s;`;
        overlay.innerHTML = `<div style='font-size:32px;margin-bottom:20px;'>✓</div><div style='font-size:18px;font-weight:bold;'>Login successful!</div>`;
        document.body.appendChild(overlay);
        
        // Force redirect after a short delay
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                // Get redirect URL from session storage or default to index.html
                const redirectTo = sessionStorage.getItem('authRedirect') || 'index.html';
                sessionStorage.removeItem('authRedirect');
                window.location.replace(redirectTo);
            }, 300);
        }, 1200);
        
    } catch (error) {
        hideLoading();
        showError(getErrorMessage(error));
    }
}

// Save user data to database
async function saveUserData(uid, userData) {
    // Deprecated: handled inline in signup for desktop parity
    return;
}

// Get user data from database
async function getUserData(uid) {
    try {
        const snapshot = await firebase.database().ref('users/' + uid).once('value');
        if (!snapshot.exists()) return null;
        const data = snapshot.val();
        // Only return minimal info for localStorage
        return {
            id: uid,
            name: data.name,
            email: data.email,
            phone: data.phone
        };
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
}

// Handle redirects based on auth state
function handleAuthRedirect(isAuthenticated) {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (isAuthenticated) {
        // If on login/signup page, redirect to appropriate page
        if (currentPage.includes('login.html') || currentPage.includes('signup.html')) {
            let redirectTo = sessionStorage.getItem('authRedirect');
            
            // If no specific redirect is set, go to index.html
            if (!redirectTo || redirectTo.includes('login.html') || redirectTo.includes('signup.html')) {
                redirectTo = 'index.html';
            }
            
            sessionStorage.removeItem('authRedirect');
            console.log('Redirecting to:', redirectTo); // Debug log
            window.location.replace(redirectTo);
        }
    } else {
        // If on protected page, redirect to login
        if (currentPage.includes('profile.html') || currentPage.includes('orders.html') || currentPage.includes('checkout.html')) {
            sessionStorage.setItem('authRedirect', currentPage);
            window.location.replace('login.html');
        }
    }
}

// Local storage management
function saveUserToLocalStorage(user) {
    // Store only minimal info for desktop parity
    localStorage.setItem('user', JSON.stringify({
        id: user.uid,
        name: user.displayName || '',
        email: user.email || '',
        phone: user.phoneNumber || ''
    }));
}

function updateLocalUserData(userData) {
    // Only store minimal fields to avoid quota errors
    if (!userData) return;
    const minimal = {
        name: userData.name,
        email: userData.email,
        phone: userData.phone
    };
    localStorage.setItem('userData', JSON.stringify(minimal));
}

function clearLocalUserData() {
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
}

// UI Helpers
function showLoading(message) {
    hideLoading(); // Remove any existing loading overlay first
    const overlay = document.createElement('div');
    overlay.id = 'auth-loading-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.7); display: flex; flex-direction: column;
        justify-content: center; align-items: center; z-index: 9999; color: white;
        font-family: Arial, sans-serif; transition: opacity 0.3s ease; opacity: 1;
    `;
    const spinner = document.createElement('div');
    spinner.className = 'auth-spinner';
    spinner.style.cssText = `width:50px;height:50px;border:5px solid rgba(255,255,255,0.3);border-radius:50%;border-top-color:#fff;animation:spin 1s linear infinite;margin-bottom:20px;`;
    const messageDiv = document.createElement('div');
    messageDiv.className = 'auth-loading-text';
    messageDiv.style.cssText = 'font-size:18px;font-weight:bold;';
    messageDiv.textContent = message;
    
    const style = document.createElement('style');
    style.textContent = `@keyframes spin{to{transform:rotate(360deg);}}`;
    document.head.appendChild(style);
    
    overlay.appendChild(spinner);
    overlay.appendChild(messageDiv);
    document.body.appendChild(overlay);
}

function hideLoading() {
    const loading = document.querySelector('.auth-loading');
    const overlay = document.getElementById('auth-loading-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 300);
    }
}

function showError(message) {
    hideLoading();
    // Desktop-style error overlay
    let overlay = document.getElementById('auth-error-overlay');
    if (overlay) overlay.parentNode.removeChild(overlay);
    overlay = document.createElement('div');
    overlay.id = 'auth-error-overlay';
    overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(220,0,0,0.7);display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:9999;color:white;font-family:Arial,sans-serif;opacity:1;transition:opacity 0.3s;`;
    overlay.innerHTML = `<div style='font-size:32px;margin-bottom:20px;'>✗</div><div style='font-size:18px;font-weight:bold;'>${message}</div>`;
    document.body.appendChild(overlay);
    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 300);
    }, 1800);
}

function getErrorMessage(error) {
    switch (error.code) {
        case 'auth/invalid-email':
            return 'Invalid email address';
        case 'auth/user-disabled':
            return 'This account has been disabled';
        case 'auth/user-not-found':
            return 'No account found with this email';
        case 'auth/wrong-password':
            return 'Incorrect password';
        case 'auth/email-already-in-use':
            return 'This email is already registered';
        case 'auth/weak-password':
            return 'Password should be at least 8 characters';
        case 'auth/popup-closed-by-user':
            return 'Sign in was cancelled';
        case 'auth/operation-not-allowed':
            return 'This sign in method is not enabled';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection';
        default:
            return error.message || 'An unexpected error occurred';
    }
}

// Expose auth utilities
window.MobileAuth = {
    logout: async function() {
        try {
            await firebase.auth().signOut();
        } catch (error) {
            console.error('Logout error:', error);
        }
    },
    getCurrentUser: function() {
        return JSON.parse(localStorage.getItem('user'));
    },
    getUserData: function() {
        return JSON.parse(localStorage.getItem('userData'));
    }
};
