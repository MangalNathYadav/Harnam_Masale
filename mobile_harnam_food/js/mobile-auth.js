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
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            saveUserToLocalStorage(user);
            
            // Get additional user data from database
            getUserData(user.uid).then(userData => {
                if (userData) {
                    updateLocalUserData(userData);
                }
                
                // Redirect based on current page
                handleAuthRedirect(true);
            });
        } else {
            // User is signed out
            clearLocalUserData();
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

            // Update profile
            await credential.user.updateProfile({
                displayName: name
            });

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
            // Create email index for fast lookup
            await firebase.database().ref('usersByEmail/' + email.replace(/\./g, ',')).set(credential.user.uid);

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
    const facebookBtn = document.querySelector('.social-btn.facebook');
    const appleBtn = document.querySelector('.social-btn.apple');
    
    if (googleBtn) {
        googleBtn.addEventListener('click', () => handleSocialLogin('google'));
    }
    
    if (facebookBtn) {
        facebookBtn.addEventListener('click', () => handleSocialLogin('facebook'));
    }
    
    if (appleBtn) {
        appleBtn.addEventListener('click', () => handleSocialLogin('apple'));
    }
}

// Handle social login
async function handleSocialLogin(provider) {
    let authProvider;
    
    switch (provider) {
        case 'google':
            authProvider = new firebase.auth.GoogleAuthProvider();
            break;
        case 'facebook':
            authProvider = new firebase.auth.FacebookAuthProvider();
            break;
        case 'apple':
            authProvider = new firebase.auth.OAuthProvider('apple.com');
            break;
        default:
            return;
    }
    
    showLoading('Connecting to ' + provider + '...');
    
    try {
        const result = await firebase.auth().signInWithPopup(authProvider);
        // Success handling is done in onAuthStateChanged
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
    const currentPage = window.location.pathname;
    
    if (isAuthenticated) {
        // If on login/signup page, redirect to profile
        if (currentPage.includes('login.html') || currentPage.includes('signup.html')) {
            const redirectTo = sessionStorage.getItem('authRedirect') || 'profile.html';
            sessionStorage.removeItem('authRedirect');
            window.location.href = redirectTo;
        }
    } else {
        // If on protected page, redirect to login
        if (currentPage.includes('profile.html') || currentPage.includes('orders.html')) {
            sessionStorage.setItem('authRedirect', currentPage);
            window.location.href = 'login.html';
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
    const loading = document.querySelector('.auth-loading');
    const loadingText = document.querySelector('.auth-loading-text');
    
    if (loading && loadingText) {
        loadingText.textContent = message;
        loading.classList.add('show');
    }
}

function hideLoading() {
    const loading = document.querySelector('.auth-loading');
    if (loading) {
        loading.classList.remove('show');
    }
}

function showError(message) {
    // Remove any existing error
    const existingError = document.querySelector('.form-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Create new error element
    const error = document.createElement('div');
    error.className = 'form-error';
    error.textContent = message;
    
    // Add to form
    const form = document.querySelector('.auth-form');
    if (form) {
        form.insertBefore(error, form.querySelector('button'));
    }
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
