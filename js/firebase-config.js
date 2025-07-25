// Firebase configuration for Harnam Masale

// Initialize Firebase with your config
const firebaseConfig = {
  apiKey: "AIzaSyCpj8g6Co_voHq2WeUAVAi7cjlzmAwOrJI",
  authDomain: "harnamfoods-b725c.firebaseapp.com",
  projectId: "harnamfoods-b725c",
  storageBucket: "harnamfoods-b725c.firebasestorage.app",
  messagingSenderId: "614833536175",
  appId: "1:614833536175:web:99284cae6c5f5543d8e85a",
  measurementId: "G-G2THN82DSY",
  databaseURL:"https://harnamfoods-b725c-default-rtdb.firebaseio.com"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services
const auth = firebase.auth();
const database = firebase.database();

// Function to generate a unique guest ID
function generateGuestId() {
    // Create a timestamp-based ID with random suffix
    const timestamp = new Date().getTime();
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    return `guest_${timestamp}_${randomSuffix}`;
}

// Function to get or create a guest ID
function getOrCreateGuestId() {
    let guestId = localStorage.getItem('harnamGuestId');
    if (!guestId) {
        guestId = generateGuestId();
        localStorage.setItem('harnamGuestId', guestId);
        // Set expiration time (7 days from now)
        const expirationTime = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
        localStorage.setItem('harnamGuestIdExpires', expirationTime.toString());
    }
    return guestId;
}

// Function to check if guest ID has expired
function checkGuestIdExpiration() {
    const expirationTime = localStorage.getItem('harnamGuestIdExpires');
    if (expirationTime && parseInt(expirationTime) < new Date().getTime()) {
        // ID expired, clear it
        localStorage.removeItem('harnamGuestId');
        localStorage.removeItem('harnamGuestIdExpires');
        return true; // expired
    }
    return false; // not expired
}

// Function to log activity
function logActivity(activityType, description) {
    const user = auth.currentUser;
    if (!user) return;

    const now = new Date();
    const timestamp = now.getTime();
    const dateStr = now.toISOString().split('T')[0];

    const logRef = database.ref(`admin_logs/${dateStr}`).push();
    
    return logRef.set({
        timestamp: timestamp,
        adminUser: user.email,
        activityType: activityType,
        description: description,
        ipAddress: '-' // IP address tracking optional
    });
}

// Make services available globally
window.auth = auth;
window.database = database;

// Firebase utility functions
const FirebaseUtil = {
    // User authentication functions
    auth: {
        // Register a new user
        async registerUser(userData) {
            try {
                // Create the user account
                const userCredential = await auth.createUserWithEmailAndPassword(
                    userData.email,
                    userData.password
                );
                
                // Get the user ID
                const userId = userCredential.user.uid;
                
                // Create user profile in database with all required nodes, always
                await database.ref('users/' + userId).set({
                    name: userData.name || '',
                    email: userData.email || '',
                    createdAt: firebase.database.ServerValue.TIMESTAMP,
                    cart: [],
                    orders: [],
                    settings: {
                        notifications: true,
                        newsletter: false
                    },
                    address: {},
                    phone: '',
                    orderRefs: []
                });
                
                // Return success with user data
                return { 
                    success: true, 
                    user: {
                        id: userId,
                        name: userData.name,
                        email: userData.email
                    }
                };
            } catch (error) {
                console.error("Error registering user:", error);
                return {
                    success: false,
                    message: error.message || 'Failed to register user'
                };
            }
        },

        // Login user
        async loginUser(email, password) {
            try {
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                const userId = userCredential.user.uid;
                
                // Get user data from database
                const userSnapshot = await database.ref('users/' + userId).once('value');
                const userData = userSnapshot.val();
                
                if (!userData) {
                    return {
                        success: false,
                        message: 'User data not found'
                    };
                }
                
                // Create a safe user object (without sensitive data)
                const safeUser = {
                    id: userId,
                    name: userData.name,
                    email: userData.email,
                    cart: userData.cart || [],
                    orders: userData.orders || []
                };
                
                // Save current user to localStorage for persistence
                localStorage.setItem('harnamCurrentUser', JSON.stringify(safeUser));
                
                return {
                    success: true,
                    user: safeUser
                };
            } catch (error) {
                console.error("Error logging in:", error);
                return {
                    success: false,
                    message: error.message || 'Failed to login'
                };
            }
        },

        // Logout user
        async logoutUser() {
            try {
                // Show loading animation if available
                if (typeof showAuthLoadingOverlay === 'function') {
                    showAuthLoadingOverlay('Logging out...');
                }
                
                await auth.signOut();
                localStorage.removeItem('harnamCurrentUser');
                
                // Show success message if available
                if (typeof hideAuthLoadingOverlay === 'function' && 
                    typeof showAuthSuccessOverlay === 'function') {
                    hideAuthLoadingOverlay();
                    showAuthSuccessOverlay('Goodbye! You have been logged out.');
                }
                
                return { success: true };
            } catch (error) {
                // Hide loading if showing
                if (typeof hideAuthLoadingOverlay === 'function') {
                    hideAuthLoadingOverlay();
                }
                
                console.error("Error logging out:", error);
                return {
                    success: false,
                    message: error.message || 'Failed to logout'
                };
            }
        },

        // Check current user
        getCurrentUser() {
            // First check Firebase auth
            const firebaseUser = auth.currentUser;
            if (firebaseUser && firebaseUser.uid) {
                // Try to get user data from localStorage for richer info
                let localUser = JSON.parse(localStorage.getItem('harnamCurrentUser'));
                if (localUser && localUser.id === firebaseUser.uid) {
                    return localUser;
                }
                // Fallback to minimal info if not in localStorage
                return {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || 'User',
                    email: firebaseUser.email
                };
            }
            // Otherwise, check localStorage as fallback
            return JSON.parse(localStorage.getItem('harnamCurrentUser'));
        },

        // Listen for auth state changes
        onAuthStateChanged(callback) {
            return auth.onAuthStateChanged(callback);
        }
    },

    // User data functions
    userData: {
        // Get user data
        async getUserData(userId) {
            try {
                if (!userId) {
                    console.error('No user ID provided for getUserData');
                    return null;
                }
                
                // Get user from database
                const userRef = database.ref('users/' + userId);
                const snapshot = await userRef.once('value');
                
                if (!snapshot.exists()) {
                    console.log('User does not exist in database');
                    return null;
                }
                
                return snapshot.val();
            } catch (error) {
                console.error('Error getting user data:', error);
                return null;
            }
        },

        // Update user profile
        async updateUserProfile(userId, userData) {
            try {
                if (!userId) {
                    console.error('No user ID provided for profile update');
                    return {
                        success: false,
                        message: 'User ID is required'
                    };
                }
                
                // Get authenticated user UID safely
                const authUser = auth.currentUser;
                if (!authUser) {
                    console.error('User not authenticated');
                    return {
                        success: false,
                        message: 'User not authenticated'
                    };
                }
                
                // First, check if the user exists in the database
                const userRef = database.ref('users/' + userId);
                const userSnapshot = await userRef.once('value');
                
                if (!userSnapshot.exists()) {
                    // Create user node if it doesn't exist, with all required child nodes
                    console.log('User node does not exist, creating it');
                    await userRef.set({
                        createdAt: firebase.database.ServerValue.TIMESTAMP,
                        name: userData.name || authUser.displayName || 'User',
                        email: userData.email || authUser.email || '',
                        cart: [],
                        orders: [],
                        settings: {
                            notifications: true,
                            newsletter: false
                        },
                        address: {},
                        phone: '',
                        orderRefs: []
                    });
                }
                
                // Get existing data to preserve current values
                const existingData = userSnapshot.val() || {};
                
                const updates = {
                    // Preserve existing data structure
                    cart: existingData.cart || [],
                    orders: existingData.orders || [],
                    settings: existingData.settings || {
                        notifications: true,
                        newsletter: false
                    },
                    address: existingData.address || {},
                    phone: existingData.phone || '',
                    // Add provided updates
                    ...existingData, // Keep all existing data
                };
                
                // Update with new data if provided
                if (userData.name) updates.name = userData.name;
                if (userData.email && auth.currentUser) {
                    try {
                        await auth.currentUser.updateEmail(userData.email);
                        updates.email = userData.email;
                    } catch (emailError) {
                        console.error('Error updating email:', emailError);
                        // Continue with other updates even if email update fails
                    }
                }
                if (userData.phone) updates.phone = userData.phone;
                if (userData.address) updates.address = userData.address;
                if (userData.settings) updates.settings = { ...updates.settings, ...userData.settings };
                if (userData.address) updates['address'] = userData.address;
                if (userData.newsletter !== undefined) updates['newsletter'] = userData.newsletter;
                
                // Handle photo data - ensure it's saved as base64 or URL
                if (userData.photo) {
                    if (typeof userData.photo === 'string' && 
                        (userData.photo.startsWith('data:image') || 
                         userData.photo.startsWith('http'))) {
                        updates.photo = userData.photo;
                    } else {
                        console.error('Photo must be a base64 string or URL');
                    }
                }
                
                // Ensure all required nodes exist with default values if not set
                updates.cart = updates.cart || [];
                updates.orders = updates.orders || [];
                updates.settings = updates.settings || {
                    notifications: true,
                    newsletter: false
                };
                updates.address = updates.address || {};
                updates.phone = updates.phone || '';
                updates.createdAt = existingData.createdAt || firebase.database.ServerValue.TIMESTAMP;
                
                try {
                    // First ensure the user node exists with required structure
                    await database.ref('users/' + userId).set(updates);
                    console.log('Profile updated successfully');
                } catch (dbError) {
                    console.error('Error updating profile in database:', dbError);
                    throw dbError;
                }
                
                // Update password if provided
                if (userData.password && auth.currentUser) {
                    try {
                        // For security, we should verify current password before changing
                        if (userData.currentPassword) {
                            // Reauthenticate user with current password
                            const credential = firebase.auth.EmailAuthProvider.credential(
                                auth.currentUser.email, 
                                userData.currentPassword
                            );
                            
                            await auth.currentUser.reauthenticateWithCredential(credential);
                            await auth.currentUser.updatePassword(userData.password);
                        } else {
                            // For less secure applications, we might skip reauthentication
                            await auth.currentUser.updatePassword(userData.password);
                        }
                    } catch (passwordError) {
                        console.error('Error updating password:', passwordError);
                        return {
                            success: false,
                            message: passwordError.message || 'Failed to update password. Please check your current password.'
                        };
                    }
                }
                
                // Update local storage
                const currentUser = JSON.parse(localStorage.getItem('harnamCurrentUser'));
                if (currentUser && currentUser.id === userId) {
                    Object.assign(currentUser, updates);
                    localStorage.setItem('harnamCurrentUser', JSON.stringify(currentUser));
                }
                
                return { 
                    success: true,
                    message: 'Profile updated successfully'
                };
            } catch (error) {
                console.error("Error updating user profile:", error);
                return {
                    success: false,
                    message: error.message || 'Failed to update profile'
                };
            }
        },

        // Update user profile using modern Firebase SDK approach
        async updateUserProfileModern(userId, updateData) {
            try {
                if (!userId) {
                    return {
                        success: false,
                        message: 'User ID is required'
                    };
                }
                
                // Prepare updates for database
                const updates = {};
                
                // Add all provided fields to the update
                if (updateData.name) updates.name = updateData.name;
                if (updateData.email) updates.email = updateData.email;
                if (updateData.phone) updates.phone = updateData.phone;
                if (updateData.address) updates.address = updateData.address;
                if (updateData.photo) updates.photo = updateData.photo;
                
                // Update in database using path style from requirement
                await database.ref(`users/${userId}`).update(updates);
                
                return {
                    success: true,
                    message: 'Profile updated successfully'
                };
            } catch (error) {
                console.error("Error updating user profile:", error);
                return {
                    success: false,
                    message: error.message || 'Failed to update profile'
                };
            }
        }
    },

    // Cart functions 
    cart: {
        // Get user cart with better error handling
        async getUserCart(userId) {
            try {
                console.log('Fetching cart for user:', userId);
                if (!userId) {
                    console.error('Invalid user ID provided to getUserCart');
                    return {
                        success: false,
                        message: 'Invalid user ID',
                        cart: []
                    };
                }
                
                // Check if it's a guest user ID
                const isGuest = userId.startsWith('guest_');
                const path = isGuest ? 'guest_carts/' + userId : 'users/' + userId + '/cart';
                
                const snapshot = await database.ref(path).once('value');
                const cart = snapshot.val() || [];
                
                console.log('Firebase cart fetch result:', cart);
                
                return {
                    success: true,
                    cart: Array.isArray(cart) ? cart : []
                };
            } catch (error) {
                console.error("Error getting user cart:", error);
                return {
                    success: false,
                    message: error.message || 'Failed to get cart',
                    cart: []
                };
            }
        },

        // Update user cart with better error handling
        async updateUserCart(userId, cart) {
            try {
                console.log('Updating cart for user:', userId, 'with items:', cart.length);
                
                if (!userId) {
                    console.error('Invalid user ID provided to updateUserCart');
                    return {
                        success: false,
                        message: 'Invalid user ID'
                    };
                }
                
                // Ensure cart is an array
                const safeCart = Array.isArray(cart) ? cart : [];
                
                // Check if it's a guest user ID
                const isGuest = userId.startsWith('guest_');
                
                if (isGuest) {
                    // For guest users, store in guest_carts
                    await database.ref('guest_carts/' + userId).set({
                        cart: safeCart,
                        createdAt: firebase.database.ServerValue.TIMESTAMP,
                        lastUpdated: firebase.database.ServerValue.TIMESTAMP
                    });
                } else {
                    // For logged-in users
                    // Make sure the path exists before writing
                    // Check if the user node exists first
                    const userRef = database.ref('users/' + userId);
                    const userSnapshot = await userRef.once('value');
                    
                    if (!userSnapshot.exists()) {
                        // Create the user node if it doesn't exist
                        await userRef.set({
                            cart: safeCart,
                            createdAt: firebase.database.ServerValue.TIMESTAMP
                        });
                    } else {
                        // Just update the cart
                        await database.ref('users/' + userId + '/cart').set(safeCart);
                    }
                }
                
                return {
                    success: true,
                    cart: safeCart
                };
            } catch (error) {
                console.error("Error updating user cart:", error);
                return {
                    success: false,
                    message: error.message || 'Failed to update cart'
                };
            }
        },
        
        // Get guest cart
        async getGuestCart(guestId) {
            try {
                if (!guestId) {
                    return {
                        success: false,
                        message: 'Invalid guest ID',
                        cart: []
                    };
                }
                
                const snapshot = await database.ref('guest_carts/' + guestId + '/cart').once('value');
                const cart = snapshot.val() || [];
                
                return {
                    success: true,
                    cart: Array.isArray(cart) ? cart : []
                };
            } catch (error) {
                console.error("Error getting guest cart:", error);
                return {
                    success: false,
                    message: error.message || 'Failed to get guest cart',
                    cart: []
                };
            }
        },
        
        // Clean up old guest carts - should be called periodically
        async cleanupOldGuestCarts() {
            try {
                // Get all guest carts
                const snapshot = await database.ref('guest_carts').once('value');
                const guestCarts = snapshot.val();
                
                if (!guestCarts) return;
                
                const now = new Date().getTime();
                const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds
                
                // Check each guest cart
                Object.entries(guestCarts).forEach(([guestId, data]) => {
                    const lastUpdated = data.lastUpdated || data.createdAt;
                    if (lastUpdated < oneWeekAgo) {
                        // Delete this guest cart
                        database.ref('guest_carts/' + guestId).remove();
                        console.log('Removed expired guest cart:', guestId);
                    }
                });
                
                return {
                    success: true,
                    message: 'Old guest carts cleanup completed'
                };
            } catch (error) {
                console.error("Error cleaning up guest carts:", error);
                return {
                    success: false,
                    message: error.message || 'Failed to clean up guest carts'
                };
            }
        },

        // Sync local cart with user's Firebase cart
        async syncCart(userId, localCart) {
            try {
                console.log('Syncing cart for user:', userId);
                
                // Get Firebase cart
                const result = await this.getUserCart(userId);
                const firebaseCart = result.success ? result.cart : [];
                
                // Ensure both are arrays
                const safeLocalCart = Array.isArray(localCart) ? localCart : [];
                const safeFirebaseCart = Array.isArray(firebaseCart) ? firebaseCart : [];
                
                // Merge carts without duplicates
                const mergedCart = this.mergeCart(safeFirebaseCart, safeLocalCart);
                
                // Update Firebase with merged cart
                await this.updateUserCart(userId, mergedCart);
                
                return {
                    success: true,
                    cart: mergedCart
                };
            } catch (error) {
                console.error("Error syncing cart:", error);
                return {
                    success: false,
                    message: error.message || 'Failed to sync cart',
                    cart: localCart // Return local cart as fallback
                };
            }
        },

        // Merge local cart with Firebase cart
        mergeCart(firebaseCart, localCart) {
            // Ensure we're working with arrays
            const safeFirebaseCart = Array.isArray(firebaseCart) ? firebaseCart : [];
            const safeLocalCart = Array.isArray(localCart) ? localCart : [];
            
            console.log('Merging carts: Firebase', safeFirebaseCart.length, 'items, Local', safeLocalCart.length, 'items');
            
            // Start with Firebase cart items (make copies to avoid mutation)
            const mergedCart = safeFirebaseCart.map(item => ({...item}));
            
            // Add or update with local cart items
            safeLocalCart.forEach(localItem => {
                if (!localItem || !localItem.id) return; // Skip invalid items
                
                // Check if item already exists in Firebase cart
                const existingItemIndex = mergedCart.findIndex(
                    item => item && item.id === localItem.id
                );
                
                if (existingItemIndex >= 0) {
                    // Update quantity if item exists
                    mergedCart[existingItemIndex].quantity += localItem.quantity;
                    console.log('Merged item quantity:', localItem.id, mergedCart[existingItemIndex].quantity);
                } else {
                    // Add new item if it doesn't exist
                    mergedCart.push({...localItem});
                    console.log('Added new item to merged cart:', localItem.id);
                }
            });
            
            console.log('Final merged cart has', mergedCart.length, 'items');
            return mergedCart;
        }
    },

    // Order functions
    orders: {
        // Get user orders
        async getUserOrders(userId) {
            try {
                console.log('Fetching orders for user:', userId);
                if (!userId) {
                    console.error('Invalid user ID provided to getUserOrders');
                    return {
                        success: false,
                        message: 'Invalid user ID',
                        orders: []
                    };
                }
                
                // Get orders from dedicated orders path
                const snapshot = await database.ref('orders/' + userId).once('value');
                const orders = snapshot.val() || {};
                
                // Convert from object to array format
                const orderArray = Object.keys(orders).map(key => ({
                    ...orders[key],
                    orderId: key
                }));
                
                console.log('Fetched', orderArray.length, 'orders for user', userId);
                
                return {
                    success: true,
                    orders: orderArray
                };
            } catch (error) {
                console.error("Error getting user orders:", error);
                return {
                    success: false,
                    message: error.message || 'Failed to get orders',
                    orders: []
                };
            }
        },

        // Create a new order
        async createOrder(userId, orderData) {
            try {
                console.log('Creating new order for user:', userId);

                // Prepare order object with metadata
                const newOrder = {
                    orderId: null, // will be set after push
                    orderDate: Date.now(),
                    total: orderData.total || 0,
                    products: (orderData.items || []).map(item => ({
                        name: item.name,
                        price: typeof item.price === 'string' ? parseFloat(item.price.replace(/[^\d.]/g, '')) : item.price,
                        quantity: item.quantity,
                        image: item.imageBase64 ? item.imageBase64 : item.image // Use Base64 if available, otherwise fallback to original image
                    })),
                    // ...include any other fields you want to store in full order...
                    status: 'Processing',
                    address: orderData.address || {},
                    customer: orderData.customer || {},
                    payment: orderData.payment || 'cod',
                    subtotal: orderData.subtotal || 0,
                    shipping: orderData.shipping || 0,
                    tax: orderData.tax || 0,
                    discount: orderData.discount || 0,
                    appliedPromoCode: orderData.appliedPromoCode || null,
                    statusUpdates: [
                        {
                            status: 'Order Received',
                            timestamp: Date.now(),
                            description: 'Your order has been received and is being processed.'
                        }
                    ]
                };

                // Save to Firebase under orders/{userId}/{orderId}
                const newOrderRef = await database.ref('orders/' + userId).push(newOrder);
                const orderId = newOrderRef.key;

                // Update orderId in the order object in DB
                await database.ref('orders/' + userId + '/' + orderId + '/orderId').set(orderId);

                // Clear the cart after successful order
                await database.ref('users/' + userId + '/cart').remove();
                localStorage.setItem('harnamCart', JSON.stringify([]));

                // Add a reference to the order in user profile (short ref only)
                try {
                    const userSnapshot = await database.ref('users/' + userId).once('value');
                    const userData = userSnapshot.val() || {};
                    const orderRefs = userData.orderRefs || [];
                    orderRefs.push({
                        orderId: orderId,
                        orderDate: newOrder.orderDate,
                        total: newOrder.total
                    });
                    await database.ref('users/' + userId + '/orderRefs').set(orderRefs);
                } catch (userErr) {
                    console.warn('Could not update user profile with order reference:', userErr);
                }

                // Return order with generated ID and readable date
                return {
                    success: true,
                    order: {
                        ...newOrder,
                        orderId: orderId,
                        id: orderId,
                        orderDate: new Date(newOrder.orderDate).toISOString()
                    }
                };
            } catch (error) {
                console.error("Error creating order:", error);
                return {
                    success: false,
                    message: error.message || 'Failed to create order'
                };
            }
        },
        
        // Get a specific order by ID
        async getOrderById(userId, orderId) {
            try {
                console.log('Fetching order:', orderId, 'for user:', userId);
                
                const snapshot = await database.ref('orders/' + userId + '/' + orderId).once('value');
                const order = snapshot.val();
                
                if (!order) {
                    return {
                        success: false,
                        message: 'Order not found'
                    };
                }
                
                return {
                    success: true,
                    order: {
                        ...order,
                        id: orderId
                    }
                };
            } catch (error) {
                console.error("Error getting order:", error);
                return {
                    success: false,
                    message: error.message || 'Failed to get order'
                };
            }
        }
    }
};

// Make FirebaseUtil available globally
window.FirebaseUtil = FirebaseUtil;

// Run the guest cart cleanup function once a day
// Try to cleanup when page loads
setTimeout(() => {
    FirebaseUtil.cart.cleanupOldGuestCarts().then(() => {
        console.log('Initial guest cart cleanup completed');
    });
}, 30000); // Wait 30 seconds after page load

// Set up scheduled cleanup (every hour check if we need to run cleanup)
setInterval(() => {
    // Store the last cleanup time in localStorage
    const lastCleanup = localStorage.getItem('harnamLastGuestCartCleanup');
    const now = new Date().getTime();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    // If we haven't cleaned up in the last 24 hours
    if (!lastCleanup || parseInt(lastCleanup) < oneDayAgo) {
        FirebaseUtil.cart.cleanupOldGuestCarts().then(() => {
            console.log('Scheduled guest cart cleanup completed');
            localStorage.setItem('harnamLastGuestCartCleanup', now.toString());
        });
    }
}, 3600000); // Check every hour

// Check and assign guest ID on initial load
(function() {
    // Check if guest ID has expired
    if (checkGuestIdExpiration()) {
        console.log('Guest ID expired, generating new one');
        // Optionally, you could also clear the cart or take other actions here
    } else {
        console.log('Guest ID is valid:', getOrCreateGuestId());
    }
})();
