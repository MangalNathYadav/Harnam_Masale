// =============== Authentication functionality for Harnam Masale ===============

(function() {
    // Initialize users storage - for backward compatibility
    const getUsers = () => {
        return JSON.parse(localStorage.getItem('harnamUsers')) || [];
    };

    // Get current user - prioritize Firebase, fall back to localStorage
    const getCurrentUser = () => {
        // First try to use Firebase if available
        if (typeof window.FirebaseUtil !== 'undefined') {
            // Try to get Firebase Auth user
            const firebaseUser = window.FirebaseUtil.auth.getCurrentUser();
            if (firebaseUser && firebaseUser.uid) {
                // Compose a user object with id, name, email from Firebase DB if possible
                // Try to get user data from localStorage first for performance
                let localUser = JSON.parse(localStorage.getItem('harnamCurrentUser'));
                if (localUser && localUser.id === firebaseUser.uid) {
                    return localUser;
                }
                // If not in localStorage, try to get from Firebase DB synchronously (not possible), so fallback to minimal info
                return {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || 'User',
                    email: firebaseUser.email
                };
            }
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

    // Create and show auth animation overlay
    const showAuthLoadingOverlay = (message = 'Please wait...') => {
        // Remove any existing overlay
        hideAuthLoadingOverlay();
        
        // Create overlay element
        const overlay = document.createElement('div');
        overlay.id = 'auth-loading-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
            font-family: Arial, sans-serif;
            transition: opacity 0.3s ease;
        `;
        
        // Create spinner
        const spinner = document.createElement('div');
        spinner.className = 'auth-spinner';
        spinner.style.cssText = `
            width: 50px;
            height: 50px;
            border: 5px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
            margin-bottom: 20px;
        `;
        
        // Create message
        const messageElement = document.createElement('div');
        messageElement.className = 'auth-message';
        messageElement.textContent = message;
        messageElement.style.cssText = `
            font-size: 18px;
            font-weight: bold;
        `;
        
        // Add animation style
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            #auth-loading-overlay {
                animation: fadeIn 0.3s ease forwards;
            }
        `;
        
        // Append elements
        overlay.appendChild(spinner);
        overlay.appendChild(messageElement);
        document.head.appendChild(style);
        document.body.appendChild(overlay);
        
        // Force reflow for animation
        overlay.offsetHeight;
    };

    // Hide auth animation overlay
    const hideAuthLoadingOverlay = () => {
        const existingOverlay = document.getElementById('auth-loading-overlay');
        
        if (existingOverlay) {
            // Add fade out animation
            existingOverlay.style.opacity = '0';
            
            // Remove after animation completes
            setTimeout(() => {
                if (existingOverlay.parentNode) {
                    existingOverlay.parentNode.removeChild(existingOverlay);
                }
            }, 300);
        }
    };

    // Show success message overlay
    const showAuthSuccessOverlay = (message, callback = null) => {
        // Create overlay element
        const overlay = document.createElement('div');
        overlay.id = 'auth-success-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
            font-family: Arial, sans-serif;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        // Create success icon
        const icon = document.createElement('div');
        icon.innerHTML = '✓';
        icon.style.cssText = `
            font-size: 50px;
            color: #4CAF50;
            margin-bottom: 20px;
        `;
        
        // Create message
        const messageElement = document.createElement('div');
        messageElement.className = 'auth-message';
        messageElement.textContent = message;
        messageElement.style.cssText = `
            font-size: 18px;
            font-weight: bold;
        `;
        
        // Append elements
        overlay.appendChild(icon);
        overlay.appendChild(messageElement);
        document.body.appendChild(overlay);
        
        // Force reflow and show with animation
        overlay.offsetHeight;
        overlay.style.opacity = '1';
        
        // Remove after delay
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                    if (callback && typeof callback === 'function') {
                        callback();
                    }
                }
            }, 300);
        }, 1500);
    };

    // Register a new user
    const registerUser = async (userData) => {
        // Show loading overlay
        showAuthLoadingOverlay('Creating your account...');
        
        try {
            // If Firebase is available, use it
            if (typeof window.FirebaseUtil !== 'undefined') {
                const result = await window.FirebaseUtil.auth.registerUser(userData);
                
                // If registration successful, also create an email index
                if (result.success && result.user) {
                    try {
                        // Create email index for easier lookup
                        await firebase.database().ref('usersByEmail/' + userData.email.replace(/\./g, ',')).set(result.user.id);
                        
                        // Show success overlay
                        hideAuthLoadingOverlay();
                        showAuthSuccessOverlay('Account created successfully!');
                    } catch (error) {
                        console.warn('Could not create email index:', error);
                        hideAuthLoadingOverlay();
                    }
                } else {
                    hideAuthLoadingOverlay();
                }
                
                return result;
            }
            
            // Else fall back to localStorage implementation
            const users = getUsers();
            
            // Check if user with this email already exists
            const existingUser = users.find(user => user.email.toLowerCase() === userData.email.toLowerCase());
            if (existingUser) {
                hideAuthLoadingOverlay();
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
            
            hideAuthLoadingOverlay();
            showAuthSuccessOverlay('Account created successfully!');
            
            return { success: true, user: safeUser };
        } catch (error) {
            hideAuthLoadingOverlay();
            console.error("Error in registration:", error);
            return { success: false, message: error.message || 'Registration failed' };
        }
    };

    // Login user
    const loginUser = async (email, password) => {
        // Show loading overlay
        showAuthLoadingOverlay('Logging in...');
        
        try {
            // If Firebase is available, use it
            if (typeof window.FirebaseUtil !== 'undefined') {
                const result = await window.FirebaseUtil.auth.loginUser(email, password);
                
                if (result.success) {
                    hideAuthLoadingOverlay();
                    
                    // Sync cart with Firebase when login is successful
                    if (result.user && result.user.id && window.HarnamCart && typeof window.HarnamCart.syncCartAfterLogin === 'function') {
                        console.log('Syncing cart after successful login for user:', result.user.id);
                        try {
                            await window.HarnamCart.syncCartAfterLogin(result.user.id);
                        } catch (cartSyncError) {
                            console.error('Error syncing cart after login:', cartSyncError);
                        }
                    } else if (result.user && result.user.id && window.HarnamCart && typeof window.HarnamCart.initializeCart === 'function') {
                        // Alternative approach if syncCartAfterLogin is not available
                        console.log('Reinitializing cart after login');
                        try {
                            await window.HarnamCart.initializeCart();
                        } catch (cartInitError) {
                            console.error('Error initializing cart after login:', cartInitError);
                        }
                    }
                    
                    showAuthSuccessOverlay('Welcome back!', () => {
                        // This callback runs after animation completes
                        // Check if there's a redirect parameter
                        const urlParams = new URLSearchParams(window.location.search);
                        const redirectUrl = urlParams.get('redirect');
                        
                        if (redirectUrl) {
                            window.location.href = redirectUrl;
                        }
                    });
                } else {
                    hideAuthLoadingOverlay();
                }
                
                return result;
            }
            
            // Else fall back to localStorage implementation
            const users = getUsers();
            const user = users.find(user => 
                user.email.toLowerCase() === email.toLowerCase() && 
                user.password === password
            );
            
            if (!user) {
                hideAuthLoadingOverlay();
                return { success: false, message: 'Invalid email or password.' };
            }
            
            // Create a safe version without password
            const safeUser = { ...user };
            delete safeUser.password;
            
            // Save current user
            saveCurrentUser(safeUser);
            
            return { success: true, user: safeUser };
        } catch (error) {
            hideAuthLoadingOverlay();
            console.error('Error during login:', error);
            return { success: false, message: 'Login failed. Please try again.' };
        }
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
            const result = await window.FirebaseUtil.userData.updateUserProfile(userId, updatedData);
            
            // If profile update included email change, update the current user object
            if (result.success && updatedData.email) {
                const currentUser = getCurrentUser();
                if (currentUser && currentUser.id === userId) {
                    currentUser.email = updatedData.email;
                    saveCurrentUser(currentUser);
                }
            }
            
            return result;
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
            
            // Insert before the theme toggle button (which should be the last item)
            const themeToggle = navLinks.querySelector('.theme-toggle');
            if (themeToggle && themeToggle.parentElement) {
                navLinks.insertBefore(authLinkItem, themeToggle.parentElement);
            } else {
                // If theme toggle not found, insert before the last element or append
                if (navLinks.lastElementChild) {
                    navLinks.insertBefore(authLinkItem, navLinks.lastElementChild);
                } else {
                    navLinks.appendChild(authLinkItem);
                }
            }
        }
        
        // Determine base path for links based on current page
        const isInRootDir = !window.location.pathname.includes('/pages/');
        const basePath = isInRootDir ? '' : '../';
        
        // Update content based on user status
        if (user) {
            // User is logged in
            console.log("Updating UI for logged in user:", user);
            
            // Check for user profile photo - try to get the most current version
            let userPhoto = user.photo;
            
            // Try to load the latest user data from Firebase (if available) to ensure profile picture is current
            if (typeof window.FirebaseUtil !== 'undefined' && user.id) {
                // We'll load the current user data asynchronously, then update the UI
                window.FirebaseUtil.userData.getUserData(user.id)
                    .then(userData => {
                        if (userData && userData.photo) {
                            // Update local user data with the new photo
                            const currentUser = JSON.parse(localStorage.getItem('harnamCurrentUser')) || {};
                            currentUser.photo = userData.photo;
                            localStorage.setItem('harnamCurrentUser', JSON.stringify(currentUser));
                            
                            // Update the profile photo in navbar if the user menu exists
                            const profilePicElement = document.querySelector('.user-menu-btn .profile-pic-small, .user-menu-btn .fas.fa-user-circle');
                            if (profilePicElement) {
                                if (userData.photo && userData.photo !== 'assets/images/default-avatar.jpg') {
                                    // Replace icon with image
                                    const img = document.createElement('img');
                                    img.src = userData.photo;
                                    img.alt = user.name || 'User';
                                    img.className = 'profile-pic-small';
                                    profilePicElement.replaceWith(img);
                                }
                            }
                        }
                    })
                    .catch(err => console.error('Error fetching user data:', err));
            }
            
            // Determine if user has a profile photo (based on current data)
            const hasProfilePhoto = userPhoto && userPhoto !== 'assets/images/default-avatar.jpg';
            
            authLinkItem.innerHTML = `
                <div class="user-menu">
                    <button class="user-menu-btn">
                        ${hasProfilePhoto ? 
                          `<img src="${userPhoto}" alt="${user.name}" class="profile-pic-small">` : 
                          `<i class="fas fa-user-circle"></i>`}
                        <span>${user.name ? user.name.split(' ')[0] : 'User'}</span>
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
                    logoutBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        
                        // Clear cart on logout if HarnamCart is available
                        if (window.HarnamCart && window.HarnamCart.handleLogout) {
                            await window.HarnamCart.handleLogout();
                        }
                        
                        // Perform logout
                        await logoutUser();
                        
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
                
                const result = await enhancedLoginUser(email, password);
                
                if (result.success) {
                    // Show success message
                    showAuthMessage('success', 'Login successful! Redirecting...');
                    
                    // Update UI immediately with user data
                    updateAuthUI(result.user);
                    
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
                const phone = document.getElementById('phone').value;
                const address = document.getElementById('address').value;
                const currentPassword = document.getElementById('current-password').value;
                const newPassword = document.getElementById('new-password').value;
                const confirmPassword = document.getElementById('confirm-password').value;
                
                // Verify current password if changing email or password
                if ((email !== currentUser.email || newPassword) && !currentPassword) {
                    showAuthMessage('error', 'Current password is required to update email or password.');
                    return;
                }
                
                // Get profile image if available
                const profileImage = document.getElementById('profile-image');
                const photo = profileImage.src;
                
                // Prepare update data
                const updateData = { 
                    name, 
                    email,
                    phone,
                    address,
                    photo   // Include the photo in base64 format
                };
                
                // Handle password update if requested
                if (newPassword) {
                    // Verify new passwords match
                    if (newPassword !== confirmPassword) {
                        showAuthMessage('error', 'New passwords do not match.');
                        return;
                    }
                    
                    updateData.password = newPassword;
                    updateData.currentPassword = currentPassword;
                }
                
                showAuthMessage('info', 'Updating profile...');
                
                // Update profile
                const result = await updateUserProfile(currentUser.id, updateData);
                
                if (result.success) {
                    // Update displayed info immediately
                    currentUser.name = name;
                    currentUser.email = email;
                    currentUser.phone = phone;
                    currentUser.address = address;
                    currentUser.photo = photo;
                    saveCurrentUser(currentUser);
                    
                    // Update auth UI
                    updateAuthUI(currentUser);
                    
                    showAuthMessage('success', 'Profile updated successfully!');
                } else {
                    showAuthMessage('error', result.message || 'Failed to update profile. Please try again.');
                }
            });
        }
        
        // Google login button for desktop
        const googleLoginBtn = document.getElementById('google-login-btn');
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                showAuthLoadingOverlay('Signing in with Google...');
                try {
                    // Use Firebase Google Auth
                    if (typeof window.FirebaseUtil !== 'undefined' && firebase && firebase.auth) {
                        const provider = new firebase.auth.GoogleAuthProvider();
                        const result = await firebase.auth().signInWithPopup(provider);
                        const user = result.user;
                        if (user) {
                            // Ensure user profile exists in RTDB
                            const userRef = firebase.database().ref('users/' + user.uid);
                            const snapshot = await userRef.once('value');
                            if (!snapshot.exists()) {
                                await userRef.set({
                                    name: user.displayName || '',
                                    email: user.email,
                                    phone: user.phoneNumber || '',
                                    address: {},
                                    createdAt: Date.now()
                                });
                            }
                            // Save user info to localStorage
                            const safeUser = {
                                id: user.uid,
                                name: user.displayName,
                                email: user.email,
                                photo: user.photoURL
                            };
                            saveCurrentUser(safeUser);
                            updateAuthUI(safeUser);
                            hideAuthLoadingOverlay();
                            showAuthSuccessOverlay('Welcome! Logging you in...', () => {
                                // Redirect after login
                                const urlParams = new URLSearchParams(window.location.search);
                                const redirectUrl = urlParams.get('redirect');
                                if (redirectUrl) {
                                    window.location.href = redirectUrl;
                                } else {
                                    window.location.href = 'index.html';
                                }
                            });
                        } else {
                            hideAuthLoadingOverlay();
                            showAuthMessage('error', 'Google login failed.');
                        }
                    } else {
                        hideAuthLoadingOverlay();
                        // Removed alert for Google login not available
                    }
                } catch (error) {
                    hideAuthLoadingOverlay();
                    showAuthMessage('error', error.message || 'Google login failed.');
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

    // Improved enhancedLoginUser function to ensure proper cart sync
    async function enhancedLoginUser(email, password) {
        // Call the original loginUser function
        const result = await loginUser(email, password);
        
        // If login was successful, update UI and sync cart
        if (result.success && result.user) {
            try {
                // Update auth UI immediately
                updateAuthUI(result.user);
                
                // Cart sync will be handled automatically by Firebase auth state change
                // in cart.js, so we don't need to manually call it here to avoid double syncing
                console.log('Login successful, cart sync will be handled by auth state change');
                
            } catch (error) {
                console.error('Error during post-login operations:', error);
                // We don't want to fail the login if UI updates fail
            }
        }
        
        return result;
    }

    // Google login/signup using Firebase
    const googleLogin = async () => {
        if (typeof window.FirebaseUtil !== 'undefined' && window.FirebaseUtil.auth && firebase && firebase.auth) {
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                const result = await firebase.auth().signInWithPopup(provider);
                const user = result.user;
                if (user) {
                    // Save user info to localStorage
                    const safeUser = {
                        id: user.uid,
                        name: user.displayName,
                        email: user.email,
                        photo: user.photoURL
                    };
                    saveCurrentUser(safeUser);
                    updateAuthUI(safeUser);
                    return { success: true, user: safeUser };
                }
                return { success: false, message: "No user returned from Google" };
            } catch (error) {
                return { success: false, message: error.message || "Google login failed" };
            }
        }
        return { success: false, message: "Google login not available" };
    };

    // Expose HarnamAuth API
    window.HarnamAuth = {
        registerUser,
        loginUser: enhancedLoginUser,
        logoutUser,
        getCurrentUser,
        updateUserProfile,
        syncUserCart: async function(userId) {
            // Cart sync is now handled automatically by Firebase auth state changes
            // in cart.js, so this is no longer needed
            console.log('syncUserCart called but sync is handled automatically');
            return true;
        },
        placeOrder,
        googleLogin,
        refreshAuthUI: function() {
            const currentUser = getCurrentUser();
            updateAuthUI(currentUser);
            return !!currentUser;
        }
    };

    // Function to manually trigger UI update - useful for debugging or fixing state issues
    window.HarnamAuth.refreshAuthUI = function() {
        const currentUser = getCurrentUser();
        updateAuthUI(currentUser);
    };

    // Call updateAuthUI on page load for all pages
    document.addEventListener('DOMContentLoaded', () => {
        const currentUser = getCurrentUser();
        console.log("Auth state on page load:", currentUser ? "Logged in as " + currentUser.name : "Not logged in");
        updateAuthUI(currentUser);
    });
})();
