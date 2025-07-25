// Mobile Profile JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const ordersCount = document.getElementById('ordersCount');
    const cartItems = document.getElementById('cartItems');
    const avatarUpload = document.getElementById('avatarUpload');
    const personalInfoForm = document.getElementById('personalInfoForm');
    const addressForm = document.getElementById('addressForm');
    const logoutBtn = document.querySelector('.profile-action-btn.logout');
    const changePasswordBtn = document.querySelector('.profile-action-btn:nth-child(1)');
    
    // Current user data
    let currentUser = null;
    
    // Initialize the profile
    initializeProfile();
    
    // Set up event listeners
    setupEventListeners();
    
    // Function to initialize the profile
    function initializeProfile() {
        // Helper to hide loading overlay and show profile section
        function hideProfileLoadingOverlay() {
            const overlay = document.getElementById('profile-loading-overlay');
            if (overlay) overlay.style.display = 'none';
            const profileSection = document.querySelector('.profile-section');
            if (profileSection) profileSection.style.visibility = 'visible';
        }
        // --- Cart Count Update ---
        const cartItemsElement = document.getElementById('cartItems');
        
        // Update cart count in profile
        function updateProfileCartCount(cart) {
            if (cartItemsElement) {
                const count = cart.reduce((total, item) => total + item.quantity, 0);
                cartItemsElement.textContent = count;
            }
        }

        // Listen for cart changes
        if (window.MobileCart) {
            window.MobileCart.addChangeListener(updateProfileCartCount);
            // Initial update
            updateProfileCartCount(window.MobileCart.cart);
            // Hide loader after cart initialization
            hideProfileLoadingOverlay();
        } else {
            console.error('MobileCart module not found');
            hideProfileLoadingOverlay();
        }
        // Wait for Firebase Auth to initialize and check if user is logged in
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                // User is logged in
                currentUser = user;
                loadUserProfile(user);
                loadUserAddress(user);
                loadOrdersCount(user);
                loadOrderHistory(user);
                updateCartItemsCount();

                // --- Live update for cart items ---

                // Live update for orders (Firebase)
                const ordersRef = firebase.database().ref('orders/' + user.uid);
                ordersRef.on('value', function(snapshot) {
                    let count = 0;
                    let orders = [];
                    snapshot.forEach(child => {
                        count++;
                        const order = child.val();
                        order.id = child.key;
                        orders.push(order);
                    });
                    if (ordersCount) ordersCount.textContent = count;
                    if (typeof orderHistoryList !== 'undefined' && orderHistoryList) {
                        if (orders.length === 0) {
                            orderHistoryList.innerHTML = '<div class="empty-orders"><i class="fas fa-box-open"></i><p>No orders found.</p></div>';
                        } else {
                            // Sort by date (descending)
                            orders.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                            orderHistoryList.innerHTML = orders.map(order => `
                                <div class="order-history-item">
                                    <div class="order-id">Order #${order.id}</div>
                                    <div class="order-date">${order.date || (order.timestamp ? new Date(order.timestamp).toLocaleDateString() : '')}</div>
                                    <div class="order-status">Status: <span>${order.status || 'Placed'}</span></div>
                                    <div class="order-total">Total: ₹${order.totalAmount || '0.00'}</div>
                                    <button class="view-order-btn" data-order-id="${order.id}">View Details</button>
                                </div>
                            `).join('');
                        }
                    }
                });

            } else {
                // Remove old showProfileLoginPrompt logic
                // Old modal creation and logic removed
                // The new modal in HTML will be shown via its own JS
            }
        });
    // (removed extra closing brace)

    // Show login prompt/modal specifically for profile page
    function showProfileLoginPrompt() {
        // Check if modal already exists
        let loginModal = document.getElementById('profile-login-modal');
        if (!loginModal) {
            loginModal = document.createElement('div');
            loginModal.id = 'profile-login-modal';
            loginModal.className = 'modal active';
            loginModal.innerHTML = `
                <div class="modal-content">
                    <div class="login-prompt">
                        <i class="fas fa-user-lock" style="font-size:2.2rem;color:#e63946;"></i>
                        <h2>Login Required</h2>
                        <p>You must be logged in to view your profile.</p>
                        <div class="login-prompt-buttons">
                            <button id="profile-login-now-btn" class="btn btn-primary">Login Now</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(loginModal);
            // Add event listener
            const loginNowBtn = document.getElementById('profile-login-now-btn');
            if (loginNowBtn) {
                loginNowBtn.addEventListener('click', function() {
                    window.location.href = 'login.html?redirect=profile';
                });
            }
        } else {
            loginModal.classList.add('active');
        }
    }
    }
    
    // Function to load user profile data
    function loadUserProfile(user) {
        if (!user) return;

        // Set email
        if (profileEmail) {
            profileEmail.textContent = user.email || 'No email provided';
        }

        // Get user data from database (desktop parity: users/{uid} root)
        firebase.database().ref(`users/${user.uid}`).once('value')
            .then(snapshot => {
                const userData = snapshot.val() || {};

                // Set name
                if (profileName) {
                    profileName.textContent = userData.name || user.displayName || 'User';
                }

                // Set avatar: users/{uid}/photo, users/{uid}/avatarUrl, then user.photoURL, then fallback
                if (profileAvatar) {
                    // Use correct fallback path relative to profile.html
                    let fallback = '../assets/images/founder.png';
                    let avatarUrl = userData.photo || userData.avatarUrl || user.photoURL;
                    profileAvatar.src = avatarUrl || fallback;
                    profileAvatar.onerror = () => {
                        profileAvatar.src = fallback;
                    };
                }

                // Fill form fields
                const fullNameInput = document.getElementById('fullName');
                const phoneNumberInput = document.getElementById('phoneNumber');

                if (fullNameInput) {
                    fullNameInput.value = userData.name || user.displayName || '';
                }

                if (phoneNumberInput) {
                    phoneNumberInput.value = userData.phone || user.phoneNumber || '';
                }
            })
            .catch(error => {
                console.error('Error fetching user profile:', error);
                showNotification('Could not load profile data', 'error');
            });
    }
    
    // Function to load user address
    function loadUserAddress(user) {
        if (!user) return;
        firebase.database().ref(`users/${user.uid}/address`).once('value')
            .then(snapshot => {
                const address = snapshot.val();
                // Fill address form fields
                const addressLine1Input = document.getElementById('addressLine1');
                const addressLine2Input = document.getElementById('addressLine2');
                const cityInput = document.getElementById('city');
                const stateInput = document.getElementById('state');
                const pincodeInput = document.getElementById('pincode');

                if (typeof address === 'string') {
                    // Parse address string by comma
                    const parts = address.split(',').map(s => s.trim());
                    // Example: "Araji no 1284, New Basti Barasirohi, Kalyanpur, kanpur, up, 208016"
                    // 0: addressLine1, 1-2: addressLine2, 3: city, 4: state, 5: pincode
                    if (addressLine1Input) addressLine1Input.value = parts[0] || '';
                    if (addressLine2Input) addressLine2Input.value = (parts[1] ? parts[1] : '') + (parts[2] ? ', ' + parts[2] : '');
                    if (cityInput) cityInput.value = parts.length > 3 ? parts[3] : '';
                    if (stateInput) stateInput.value = parts.length > 4 ? parts[4] : '';
                    if (pincodeInput) {
                        // Find 6 digit number in last part, or fallback to last part
                        let pin = '';
                        if (parts.length > 5) {
                            const pinMatch = parts[5].match(/\d{6}/);
                            pin = pinMatch ? pinMatch[0] : parts[5];
                        } else if (parts.length > 0) {
                            // Try to find pincode in any part
                            for (let i = parts.length - 1; i >= 0; i--) {
                                const pinMatch = parts[i].match(/\d{6}/);
                                if (pinMatch) {
                                    pin = pinMatch[0];
                                    break;
                                }
                            }
                        }
                        pincodeInput.value = pin;
                    }
                } else if (address && typeof address === 'object') {
                    if (addressLine1Input) addressLine1Input.value = address.addressLine1 || '';
                    if (addressLine2Input) addressLine2Input.value = address.addressLine2 || '';
                    if (cityInput) cityInput.value = address.city || '';
                    if (stateInput) stateInput.value = address.state || '';
                    if (pincodeInput) pincodeInput.value = address.pincode || '';
                } else {
                    // No address found
                    if (addressLine1Input) addressLine1Input.value = '';
                    if (addressLine2Input) addressLine2Input.value = '';
                    if (cityInput) cityInput.value = '';
                    if (stateInput) stateInput.value = '';
                    if (pincodeInput) pincodeInput.value = '';
                }
            })
            .catch(error => {
                console.error('Error fetching user address:', error);
            });
    }
    
    // Function to load orders count
    function loadOrdersCount(user) {
        if (!user || !ordersCount) return;
        
        // Use /orders/{user.uid} for user-specific order count
        firebase.database().ref('orders/' + user.uid)
            .once('value')
            .then(snapshot => {
                let count = 0;
                snapshot.forEach(() => {
                    count++;
                });
                ordersCount.textContent = count;
            })
            .catch(error => {
                console.error('Error fetching orders count:', error);
                ordersCount.textContent = '0';
            });
    }

    // Function to load and display order history
    function loadOrderHistory(user) {
        if (!user || !orderHistoryList) return;
        orderHistoryList.innerHTML = '<div class="loading-orders">Loading...</div>';
        // Use /orders/{user.uid} for user-specific order history
        firebase.database().ref('orders/' + user.uid)
            .once('value')
            .then(snapshot => {
                let orders = [];
                snapshot.forEach(child => {
                    const order = child.val();
                    order.id = child.key;
                    orders.push(order);
                });
                if (orders.length === 0) {
                    orderHistoryList.innerHTML = '<div class="empty-orders"><i class="fas fa-box-open"></i><p>No orders found.</p></div>';
                    return;
                }
                // Sort by date (descending)
                orders.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                orderHistoryList.innerHTML = orders.map(order => `
                    <div class="order-history-item">
                        <div class="order-id">Order #${order.id}</div>
                        <div class="order-date">${order.date || (order.timestamp ? new Date(order.timestamp).toLocaleDateString() : '')}</div>
                        <div class="order-status">Status: <span>${order.status || 'Placed'}</span></div>
                        <div class="order-total">Total: ₹${order.totalAmount || '0.00'}</div>
                        <button class="view-order-btn" data-order-id="${order.id}">View Details</button>
                    </div>
                `).join('');
            })
            .catch(error => {
                orderHistoryList.innerHTML = '<div class="empty-orders"><i class="fas fa-box-open"></i><p>Could not load orders.</p></div>';
                console.error('Error loading order history:', error);
            });
    }
    
    // Function to update cart items count
    function updateCartItemsCount() {
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Avatar upload
        if (avatarUpload) {
            avatarUpload.addEventListener('change', handleAvatarUpload);
        }
        
        // Personal info form
        if (personalInfoForm) {
            personalInfoForm.addEventListener('submit', handlePersonalInfoSubmit);
        }
        
        // Address form
        if (addressForm) {
            addressForm.addEventListener('submit', handleAddressSubmit);
        }
        
        // Cancel buttons
        const cancelButtons = document.querySelectorAll('.btn-cancel');
        cancelButtons.forEach(button => {
            button.addEventListener('click', function() {
                const form = this.closest('form');
                if (form) {
                    form.reset();
                    
                    // Re-load the original data
                    if (form.id === 'personalInfoForm') {
                        loadUserProfile(currentUser);
                    } else if (form.id === 'addressForm') {
                        loadUserAddress(currentUser);
                    }
                }
            });
        });
        
        // Logout button
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
        
        // Change password button
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', showChangePasswordModal);
        }
    }
    
    // Handle avatar upload
    function handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showNotification('Image is too large. Max size is 2MB.', 'error');
            return;
        }
        
        // Check file type
        if (!file.type.match('image.*')) {
            showNotification('Selected file is not an image.', 'error');
            return;
        }
        
        // Show loading state
        if (profileAvatar) {
            profileAvatar.classList.add('loading');
        }
        
        // Upload to Firebase Storage
        if (window.firebase && firebase.storage && currentUser) {
            const storageRef = firebase.storage().ref();
            const avatarRef = storageRef.child(`user-avatars/${currentUser.uid}`);
            
            avatarRef.put(file).then(() => {
                // Get download URL
                return avatarRef.getDownloadURL();
            }).then(downloadURL => {
                // Update profile photo URL
                return updateProfilePhoto(downloadURL);
            }).catch(error => {
                console.error('Error uploading avatar:', error);
                showNotification('Failed to upload avatar. Please try again.', 'error');
                
                if (profileAvatar) {
                    profileAvatar.classList.remove('loading');
                }
            });
        } else {
            // Local preview only (Firebase not available)
            const reader = new FileReader();
            
            reader.onload = function(e) {
                if (profileAvatar) {
                    profileAvatar.src = e.target.result;
                    profileAvatar.classList.remove('loading');
                }
            };
            
            reader.readAsDataURL(file);
        }
    }
    
    // Update profile photo URL
    function updateProfilePhoto(photoURL) {
        if (!currentUser || !photoURL) return Promise.reject('No user or photo URL');
        
        // Update in Firebase Auth
        return currentUser.updateProfile({
            photoURL: photoURL
        }).then(() => {
            // Update in Firebase Database
            return firebase.database().ref(`users/${currentUser.uid}/profile`).update({
                avatarUrl: photoURL
            });
        }).then(() => {
            // Update UI
            if (profileAvatar) {
                profileAvatar.src = photoURL;
                profileAvatar.classList.remove('loading');
            }
            
            showNotification('Profile picture updated successfully');
        });
    }
    
    // Handle personal info form submit
    function handlePersonalInfoSubmit(event) {
        event.preventDefault();
        
        if (!currentUser) {
            showNotification('You must be logged in to update your profile', 'error');
            return;
        }
        
        // Get form values
        const fullNameInput = document.getElementById('fullName');
        const phoneNumberInput = document.getElementById('phoneNumber');
        
        const fullName = fullNameInput ? fullNameInput.value.trim() : '';
        const phoneNumber = phoneNumberInput ? phoneNumberInput.value.trim() : '';
        
        // Validate
        if (!fullName) {
            showNotification('Please enter your full name', 'error');
            return;
        }
        
        // Save to Firebase - desktop parity: update at root level
        const userRef = firebase.database().ref(`users/${currentUser.uid}`);
        
        // Show loading state
        const saveBtn = personalInfoForm.querySelector('.btn-save');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        }
        
        // Update display name in Auth
        currentUser.updateProfile({
            displayName: fullName
        }).then(() => {
            // Update in database at root level (desktop parity)
            return userRef.update({
                name: fullName,
                phone: phoneNumber  // <-- update phone in RTDB
            });
        }).then(() => {
            // Show success notification
            showNotification('Profile updated successfully');
            
            // Update UI
            if (profileName) {
                profileName.textContent = fullName;
            }
        }).catch(error => {
            console.error('Error updating profile:', error);
            showNotification('Failed to update profile', 'error');
        }).finally(() => {
            // Reset button state
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = 'Save Changes';
            }
        });
    }
    
    // Handle address form submit
    function handleAddressSubmit(event) {
        event.preventDefault();
        
        if (!currentUser) {
            showNotification('You must be logged in to update your address', 'error');
            return;
        }
        
        // Get form values
        const addressLine1 = document.getElementById('addressLine1').value.trim();
        const addressLine2 = document.getElementById('addressLine2').value.trim();
        const city = document.getElementById('city').value.trim();
        const state = document.getElementById('state').value.trim();
        const pincode = document.getElementById('pincode').value.trim();
        
        // Validate
        if (!addressLine1 || !city || !state || !pincode) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        // Save to Firebase
        const addressRef = firebase.database().ref(`users/${currentUser.uid}/address`);
        
        // Show loading state
        const saveBtn = addressForm.querySelector('.btn-save');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        }
        
        // Update in database
        addressRef.update({
            addressLine1: addressLine1,
            addressLine2: addressLine2,
            city: city,
            state: state,
            pincode: pincode
        }).then(() => {
            // Show success notification
            showNotification('Address updated successfully');
        }).catch(error => {
            console.error('Error updating address:', error);
            showNotification('Failed to update address', 'error');
        }).finally(() => {
            // Reset button state
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = 'Save Address';
            }
        });
    }
    
    // Handle logout
    function handleLogout() {
        firebase.auth().signOut()
            .then(() => {
                // Redirect to home page
                window.location.href = 'index.html';
            })
            .catch(error => {
                console.error('Error signing out:', error);
                showNotification('Failed to log out. Please try again.', 'error');
            });
    }
    
    // Show change password modal
    function showChangePasswordModal() {
        // Create modal if it doesn't exist
        let passwordModal = document.getElementById('password-modal');
        
        if (!passwordModal) {
            passwordModal = document.createElement('div');
            passwordModal.id = 'password-modal';
            passwordModal.className = 'modal';
            
            passwordModal.innerHTML = `
                <div class="modal-content">
                    <button class="close-modal">&times;</button>
                    <h2>Change Password</h2>
                    <form id="change-password-form">
                        <div class="form-group">
                            <label for="currentPassword">Current Password</label>
                            <input type="password" id="currentPassword" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="newPassword">New Password</label>
                            <input type="password" id="newPassword" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="confirmPassword">Confirm New Password</label>
                            <input type="password" id="confirmPassword" class="form-control" required>
                        </div>
                        <div class="form-buttons">
                            <button type="button" class="btn btn-cancel">Cancel</button>
                            <button type="submit" class="btn btn-save">Change Password</button>
                        </div>
                    </form>
                </div>
            `;
            
            document.body.appendChild(passwordModal);
            
            // Add event listeners
            const closeBtn = passwordModal.querySelector('.close-modal');
            const cancelBtn = passwordModal.querySelector('.btn-cancel');
            const passwordForm = passwordModal.querySelector('#change-password-form');
            
            closeBtn.addEventListener('click', () => {
                passwordModal.classList.remove('active');
            });
            
            cancelBtn.addEventListener('click', () => {
                passwordModal.classList.remove('active');
            });
            
            passwordForm.addEventListener('submit', handlePasswordChange);
        }
        
        // Show modal
        passwordModal.classList.add('active');
    }
    
    // Handle password change
    function handlePasswordChange(event) {
        event.preventDefault();
        
        if (!currentUser) {
            showNotification('You must be logged in to change your password', 'error');
            return;
        }
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validate
        if (!currentPassword || !newPassword || !confirmPassword) {
            showNotification('All fields are required', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showNotification('New passwords do not match', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            showNotification('Password must be at least 6 characters', 'error');
            return;
        }
        
        // Show loading state
        const saveBtn = event.target.querySelector('.btn-save');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Changing...';
        }
        
        // Reauthenticate
        const credential = firebase.auth.EmailAuthProvider.credential(
            currentUser.email,
            currentPassword
        );
        
        currentUser.reauthenticateWithCredential(credential)
            .then(() => {
                // Change password
                return currentUser.updatePassword(newPassword);
            })
            .then(() => {
                // Success
                showNotification('Password changed successfully');
                
                // Close modal
                const passwordModal = document.getElementById('password-modal');
                if (passwordModal) {
                    passwordModal.classList.remove('active');
                }
                
                // Reset form
                event.target.reset();
            })
            .catch(error => {
                console.error('Error changing password:', error);
                
                let errorMessage = 'Failed to change password';
                
                if (error.code === 'auth/wrong-password') {
                    errorMessage = 'Current password is incorrect';
                } else if (error.code === 'auth/weak-password') {
                    errorMessage = 'New password is too weak';
                }
                
                showNotification(errorMessage, 'error');
            })
            .finally(() => {
                // Reset button state
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = 'Change Password';
                }
            });
    }
    
    // Show notification
    function showNotification(message, type = 'success') {
        // Use global notification if available
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
            return;
        }
        
        // Create notification element if it doesn't exist
        let notification = document.querySelector('.notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'notification';
            document.body.appendChild(notification);
        }
        
        // Set type and message
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Show notification
        notification.classList.add('show');
        
        // Hide after delay
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
});
