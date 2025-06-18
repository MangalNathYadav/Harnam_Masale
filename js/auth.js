// Authentication functionality for Harnam Masale

// Initialize users storage - for backward compatibility
const getUsers = () => {
    return JSON.parse(localStorage.getItem('harnamUsers')) || [];
};

// Get current user - prioritize Firebase, fall back to localStorage
const getCurrentUser = () => {
    // First try to use Firebase if available
    if (typeof window.FirebaseUtil !== 'undefined') {
        const firebaseUser = window.FirebaseUtil.auth.getCurrentUser();
        if (firebaseUser) return firebaseUser;
    }
    
    // Fall back to localStorage
    return JSON.parse(localStorage.getItem('harnamCurrentUser')) || null;
};

// Save current user
const saveCurrentUser = (user) => {
    localStorage.setItem('harnamCurrentUser', JSON.stringify(user));
};

// Clear current user
const clearCurrentUser = () => {
    localStorage.removeItem('harnamCurrentUser');
};

// Register a new user
const registerUser = async (userData) => {
    // If Firebase is available, use it
    if (typeof window.FirebaseUtil !== 'undefined') {
        return await window.FirebaseUtil.auth.registerUser(userData);
    }
    
    // Else fall back to localStorage implementation
    const users = getUsers();
    
    // Check if user with this email already exists
    const existingUser = users.find(user => user.email.toLowerCase() === userData.email.toLowerCase());
    if (existingUser) {
        return { success: false, message: 'A user with this email already exists.' };
    }
    
    // Create new user object
    const newUser = {
        id: 'user_' + Date.now() + Math.random().toString(36).substring(2, 10),
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: userData.password, // In a real app, this should be hashed
        createdAt: new Date().toISOString(),
        cart: [], // User-specific cart
        wishlist: [],
        orders: []
    };
    
    // Add user to storage
    users.push(newUser);
    localStorage.setItem('harnamUsers', JSON.stringify(users));
    
    // Create a safe version to return (without password)
    const safeUser = { ...newUser };
    delete safeUser.password;
    
    return { success: true, user: safeUser };
};

// Login user
const loginUser = async (email, password) => {
    // If Firebase is available, use it
    if (typeof window.FirebaseUtil !== 'undefined') {
        return await window.FirebaseUtil.auth.loginUser(email, password);
    }
    
    // Else fall back to localStorage implementation
    const users = getUsers();
    const user = users.find(user => 
        user.email.toLowerCase() === email.toLowerCase() && 
        user.password === password
    );
    
    if (!user) {
        return { success: false, message: 'Invalid email or password.' };
    }
    
    // Create a safe version without password
    const safeUser = { ...user };
    delete safeUser.password;
    
    // Save current user
    saveCurrentUser(safeUser);
    
    return { success: true, user: safeUser };
};

// Logout user
const logoutUser = async () => {
    // If Firebase is available, use it
    if (typeof window.FirebaseUtil !== 'undefined') {
        return await window.FirebaseUtil.auth.logoutUser();
    }
    
    // Else fall back to localStorage implementation
    clearCurrentUser();
    return { success: true };
};

// Update user profile
const updateUserProfile = async (userId, updatedData) => {
    // If Firebase is available, use it
    if (typeof window.FirebaseUtil !== 'undefined') {
        return await window.FirebaseUtil.userData.updateUserProfile(userId, updatedData);
    }
    
    // Else fall back to localStorage implementation
    const users = getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
        return { success: false, message: 'User not found.' };
    }
    
    // Update allowed fields
    if (updatedData.name) {
        users[userIndex].name = updatedData.name;
    }
    
    if (updatedData.email) {
        // Check if email is already taken by another user
        const emailExists = users.some(user => 
            user.id !== userId && 
            user.email.toLowerCase() === updatedData.email.toLowerCase()
        );
        
        if (emailExists) {
            return { success: false, message: 'Email is already in use.' };
        }
        
        users[userIndex].email = updatedData.email.toLowerCase();
    }
    
    if (updatedData.password) {
        users[userIndex].password = updatedData.password;
    }
    
    // Save updated users
    localStorage.setItem('harnamUsers', JSON.stringify(users));
    
    // Update current user if it's the same
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
        const updatedUser = { ...users[userIndex] };
        delete updatedUser.password;
        saveCurrentUser(updatedUser);
    }
    
    return { success: true };
};

// Sync user cart with general cart
const syncUserCart = async (userId) => {
    // Get the current general cart
    const generalCart = JSON.parse(localStorage.getItem('harnamCart')) || [];
    
    // If Firebase is available, use it
    if (typeof window.FirebaseUtil !== 'undefined') {
        const result = await window.FirebaseUtil.cart.syncCart(userId, generalCart);
        
        // Update local cart with merged cart
        if (result.success) {
            localStorage.setItem('harnamCart', JSON.stringify(result.cart));
        }
        
        return result;
    }
    
    // Else fall back to localStorage implementation
    const users = getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
        return { success: false, message: 'User not found' };
    }
    
    // Update user's cart
    users[userIndex].cart = generalCart;
    localStorage.setItem('harnamUsers', JSON.stringify(users));
    
    // Update current user if it's the same
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
        currentUser.cart = generalCart;
        saveCurrentUser(currentUser);
    }
    
    return { success: true };
};

// Place order for a user
const placeOrder = async (orderData) => {
    const currentUser = getCurrentUser();
    if (!currentUser) return { success: false, message: 'You must be logged in to place an order' };
    
    try {
        // If Firebase is available, use it
        if (typeof window.FirebaseUtil !== 'undefined') {
            const result = await window.FirebaseUtil.orders.createOrder(currentUser.id, orderData);
            
            // Clear local cart if order was successful
            if (result.success) {
                localStorage.setItem('harnamCart', JSON.stringify([]));
            }
            
            return result;
        }
        
        // Else fall back to localStorage implementation
        const users = getUsers();
        const userIndex = users.findIndex(user => user.id === currentUser.id);
        
        if (userIndex === -1) return { success: false, message: 'User not found' };
        
        // Create order object
        const order = {
            id: 'order_' + Date.now() + Math.random().toString(36).substring(2, 10),
            orderDate: new Date().toISOString(),
            status: 'Processing',
            items: orderData.items || JSON.parse(localStorage.getItem('harnamCart')) || [],
            total: orderData.total || 0,
            address: orderData.address || 'Default Address'
        };
        
        // Initialize orders array if not exists
        if (!users[userIndex].orders) {
            users[userIndex].orders = [];
        }
        
        // Add order
        users[userIndex].orders.push(order);
        localStorage.setItem('harnamUsers', JSON.stringify(users));
        
        // Update current user
        if (!currentUser.orders) currentUser.orders = [];
        currentUser.orders.push(order);
        saveCurrentUser(currentUser);
        
        // Clear cart if order placed successfully
        localStorage.setItem('harnamCart', JSON.stringify([]));
        
        return { success: true, order };
    } catch (error) {
        console.error('Error placing order:', error);
        return { success: false, message: 'An error occurred while placing your order' };
    }
};

// Initialize authentication on every page load
document.addEventListener('DOMContentLoaded', () => {
    // Check for authenticated user and update UI
    const currentUser = getCurrentUser();
    updateAuthUI(currentUser);
    
    // Setup auth-related event listeners
    setupAuthListeners();
    
    // Setup Firebase auth state changes if available
    if (typeof window.FirebaseUtil !== 'undefined') {
        window.FirebaseUtil.auth.onAuthStateChanged(user => {
            if (user) {
                // If Firebase auth reports a signed in user, but we don't have them in localStorage
                const currentStoredUser = JSON.parse(localStorage.getItem('harnamCurrentUser'));
                if (!currentStoredUser || currentStoredUser.id !== user.uid) {
                    // This handles the case where a user is signed in with Firebase but not in our local state
                    window.FirebaseUtil.userData.getUserData(user.uid).then(result => {
                        if (result.success && result.data) {
                            const safeUser = {
                                id: user.uid,
                                name: result.data.name,
                                email: result.data.email
                            };
                            saveCurrentUser(safeUser);
                            updateAuthUI(safeUser);
                        }
                    });
                }
            } else {
                // If Firebase reports no user, but we have one in localStorage
                const currentStoredUser = JSON.parse(localStorage.getItem('harnamCurrentUser'));
                if (currentStoredUser) {
                    // Clear localStorage user
                    clearCurrentUser();
                    updateAuthUI(null);
                }
            }
        });
    }
});

// Update UI based on authentication state
function updateAuthUI(user) {
    // Get navigation elements
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    // Look for existing auth links
    let authLinkItem = navLinks.querySelector('.auth-links');
    
    if (!authLinkItem) {
        // Create auth links container if it doesn't exist
        authLinkItem = document.createElement('li');
        authLinkItem.className = 'auth-links';
        navLinks.insertBefore(authLinkItem, navLinks.lastElementChild); // Insert before theme toggle
    }
    
    // Determine base path for links based on current page
    const isInRootDir = !window.location.pathname.includes('/pages/');
    const basePath = isInRootDir ? '' : '../';
    
    // Update content based on user status
    if (user) {
        // User is logged in
        authLinkItem.innerHTML = `
            <div class="user-menu">
                <button class="user-menu-btn">
                    <i class="fas fa-user-circle"></i>
                    <span>${user.name.split(' ')[0]}</span>
                </button>
                <div class="user-dropdown">
                    <a href="${basePath}profile.html"><i class="fas fa-user"></i> My Profile</a>
                    <a href="${basePath}orders.html"><i class="fas fa-box"></i> My Orders</a>
                    <a href="#" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</a>
                </div>
            </div>
        `;
        
        // Setup user menu dropdown
        const userMenuBtn = authLinkItem.querySelector('.user-menu-btn');
        const userDropdown = authLinkItem.querySelector('.user-dropdown');
        
        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('show');
            });
            
            // Close dropdown when clicking elsewhere
            document.addEventListener('click', () => {
                if (userDropdown.classList.contains('show')) {
                    userDropdown.classList.remove('show');
                }
            });
            
            // Prevent dropdown from closing when clicking within it
            userDropdown.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            
            // Handle logout
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    logoutUser();
                    // Redirect to home page based on current location
                    window.location.href = isInRootDir ? 'index.html' : '../index.html';
                });
            }
        }
    } else {
        // User is not logged in
        authLinkItem.innerHTML = `
            <a href="${basePath}login.html"><i class="fas fa-sign-in-alt"></i> Login</a>
            <a href="${basePath}signup.html"><i class="fas fa-user-plus"></i> Sign Up</a>
        `;
    }
}

// Setup auth-related event listeners
function setupAuthListeners() {
    // Login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            showAuthMessage('info', 'Logging in...');
            
            const result = await loginUser(email, password);
            
            if (result.success) {
                // Show success message
                showAuthMessage('success', 'Login successful! Redirecting...');
                
                // Get saved redirect URL
                const savedRedirect = sessionStorage.getItem('loginRedirect');
                sessionStorage.removeItem('loginRedirect'); // Clear it
                
                // Redirect after short delay
                setTimeout(() => {
                    if (savedRedirect) {
                        window.location.href = savedRedirect;
                    } else {
                        // Redirect to homepage based on current location
                        const isInRootDir = !window.location.pathname.includes('/pages/');
                        window.location.href = isInRootDir ? 'index.html' : '../index.html';
                    }
                }, 1500);
            } else {
                // Show error message
                showAuthMessage('error', result.message);
            }
        });
    }
    
    // Sign up form submission
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            // Validate passwords match
            if (password !== confirmPassword) {
                showAuthMessage('error', 'Passwords do not match.');
                return;
            }
            
            showAuthMessage('info', 'Creating your account...');
            
            // Register user
            const result = await registerUser({ name, email, password });
            
            if (result.success) {
                // Auto-login the user
                await loginUser(email, password);
                
                // Show success message
                showAuthMessage('success', 'Account created successfully! Redirecting...');
                
                // Redirect after short delay
                setTimeout(() => {
                    const isInRootDir = !window.location.pathname.includes('/pages/');
                    window.location.href = isInRootDir ? 'index.html' : '../index.html';
                }, 1500);
            } else {
                // Show error message
                showAuthMessage('error', result.message);
            }
        });
    }
    
    // Profile update form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentUser = getCurrentUser();
            if (!currentUser) {
                window.location.href = 'login.html';
                return;
            }
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            // Prepare update data
            const updateData = { name, email };
            
            // Handle password update if requested
            if (newPassword) {
                // Verify new passwords match
                if (newPassword !== confirmPassword) {
                    showAuthMessage('error', 'New passwords do not match.');
                    return;
                }
                
                updateData.password = newPassword;
            }
            
            showAuthMessage('info', 'Updating profile...');
            
            // Update profile
            const result = await updateUserProfile(currentUser.id, updateData);
            
            if (result.success) {
                showAuthMessage('success', 'Profile updated successfully!');
            } else {
                showAuthMessage('error', result.message);
            }
        });
    }
}

// Show authentication-related messages
function showAuthMessage(type, message) {
    // Find or create message container
    let messageContainer = document.querySelector('.auth-message');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.className = 'auth-message';
        
        // Add to form container or body
        const formContainer = document.querySelector('.auth-container') || document.body;
        formContainer.appendChild(messageContainer);
    }
    
    // Set message content
    messageContainer.innerHTML = message;
    messageContainer.className = `auth-message ${type}`;
    messageContainer.style.display = 'block';
    
    // Add animation
    messageContainer.style.animation = 'none';
    void messageContainer.offsetWidth; // Force reflow
    messageContainer.style.animation = 'fadeInDown 0.3s forwards';
    
    // Auto-hide after delay
    setTimeout(() => {
        messageContainer.style.animation = 'fadeOutUp 0.3s forwards';
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 300);
    }, 4000);
}

// Add function to create a sample order for testing
function createSampleOrder(userId) {
    // Skip if Firebase is available, as it will handle real orders
    if (typeof window.FirebaseUtil !== 'undefined') return;
    
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return;
    
    // Create sample order if user has no orders
    if (!users[userIndex].orders || users[userIndex].orders.length === 0) {
        const cart = JSON.parse(localStorage.getItem('harnamCart')) || [];
        
        // Only create sample order if cart has items
        if (cart.length > 0) {
            const sampleOrder = {
                id: 'order_' + Date.now() + Math.random().toString(36).substring(2, 10),
                orderDate: new Date().toISOString(),
                status: 'Processing',
                items: [...cart], // Copy current cart items
                total: cart.reduce((sum, item) => {
                    const price = parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
                    return sum + (price * item.quantity);
                }, 0),
                address: '123 Sample Street, City, State, 10001'
            };
            
            // Initialize orders array if not exists
            if (!users[userIndex].orders) {
                users[userIndex].orders = [];
            }
            
            // Add sample order
            users[userIndex].orders.push(sampleOrder);
            localStorage.setItem('harnamUsers', JSON.stringify(users));
            
            // Update current user if it's the same
            const currentUser = getCurrentUser();
            if (currentUser && currentUser.id === userId) {
                if (!currentUser.orders) currentUser.orders = [];
                currentUser.orders.push(sampleOrder);
                saveCurrentUser(currentUser);
                
                console.log('Created sample order', sampleOrder);
            }
        }
    }
}

// Instead of reassigning loginUser, create an enhanced version
async function enhancedLoginUser(email, password) {
    const result = await loginUser(email, password);
    
    if (result.success && result.user) {
        // Create sample order for testing (only if user has no orders)
        createSampleOrder(result.user.id);
    }
    
    return result;
}

// Export auth functions
window.HarnamAuth = {
    registerUser,
    loginUser: enhancedLoginUser, // Use enhanced version
    logoutUser,
    getCurrentUser,
    updateUserProfile,
    syncUserCart,
    placeOrder
};

async function handleLoginSuccess(userId) {
    // ...existing login success code...
    
    // Sync cart after successful login
    if (window.HarnamCart && window.HarnamCart.syncCartAfterLogin) {
        await window.HarnamCart.syncCartAfterLogin(userId);
    }
    
    // ...rest of login success code...
}

async function logout() {
    try {
        // Clear cart before logout
        if (window.HarnamCart && window.HarnamCart.handleLogout) {
            await window.HarnamCart.handleLogout();
        }
        
        // Existing logout code...
        await firebase.auth().signOut();
        // ...
    } catch (error) {
        console.error('Error during logout:', error);
    }
}
