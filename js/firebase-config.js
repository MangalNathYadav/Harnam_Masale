// Firebase configuration for Harnam Masale

// Initialize Firebase with your config
const firebaseConfig = {
    apiKey: "AIzaSyCSLhBoEVhIlNC4Nx029rg3aWZZzNNE2C4",
  authDomain: "connect-c6b59.firebaseapp.com",
  databaseURL: "https://connect-c6b59.firebaseio.com",
  projectId: "connect-c6b59",
  storageBucket: "connect-c6b59.firebasestorage.app",
  messagingSenderId: "26762071119",
  appId: "1:26762071119:web:b105eff50bedd663306e3a",
  measurementId: "G-XKQDCTC9PD"  // Replace with your Firebase App ID
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

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
                
                // Create user profile in database
                await database.ref('users/' + userId).set({
                    name: userData.name,
                    email: userData.email,
                    createdAt: firebase.database.ServerValue.TIMESTAMP,
                    cart: [],
                    orders: []
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
                    // Create user node if it doesn't exist
                    console.log('User node does not exist, creating it');
                    await userRef.set({
                        createdAt: firebase.database.ServerValue.TIMESTAMP,
                        name: userData.name || authUser.displayName || 'User',
                        email: userData.email || authUser.email || '',
                        cart: [],
                        orders: []
                    });
                }
                
                const updates = {};
                
                // Only update fields that are provided
                if (userData.name) updates['name'] = userData.name;
                if (userData.email && auth.currentUser) {
                    // Update email in Firebase Auth
                    try {
                        await auth.currentUser.updateEmail(userData.email);
                        updates['email'] = userData.email;
                    } catch (emailError) {
                        console.error('Error updating email:', emailError);
                        // Continue with other updates even if email update fails
                    }
                }
                if (userData.phone) updates['phone'] = userData.phone;
                if (userData.address) updates['address'] = userData.address;
                if (userData.newsletter !== undefined) updates['newsletter'] = userData.newsletter;
                
                // Handle photo data - ensure it's saved as base64
                if (userData.photo) {
                    // Check if it's already a base64 string
                    if (typeof userData.photo === 'string' && 
                        (userData.photo.startsWith('data:image') || 
                         userData.photo.startsWith('http'))) {
                        updates['photo'] = userData.photo;
                    } else {
                        console.error('Photo must be a base64 string or URL');
                    }
                }
                
                // Update in database
                await database.ref('users/' + userId).update(updates);
                
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
                
                const snapshot = await database.ref('users/' + userId + '/cart').once('value');
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
                
                // Also update local storage for consistency
                localStorage.setItem('harnamCart', JSON.stringify(safeCart));
                
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
            // Start with Firebase cart items
            const mergedCart = [...firebaseCart];
            
            // Add or update with local cart items
            localCart.forEach(localItem => {
                // Check if item already exists in Firebase cart
                const existingItemIndex = mergedCart.findIndex(
                    item => item.id === localItem.id
                );
                
                if (existingItemIndex >= 0) {
                    // Update quantity if item exists
                    mergedCart[existingItemIndex].quantity += localItem.quantity;
                } else {
                    // Add new item if it doesn't exist
                    mergedCart.push(localItem);
                }
            });
            
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
        },
        
        // Update order status
        async updateOrderStatus(userId, orderId, status, description) {
            try {
                console.log('Updating order status:', orderId, 'for user:', userId, 'to:', status);
                
                // Create status update entry
                const statusUpdate = {
                    status: status,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    description: description || `Order status updated to ${status}`
                };
                
                // Get current order
                const orderResult = await this.getOrderById(userId, orderId);
                if (!orderResult.success) {
                    return orderResult;
                }
                
                const order = orderResult.order;
                
                // Add to status updates array
                const statusUpdates = order.statusUpdates || [];
                statusUpdates.push(statusUpdate);
                
                // Update order
                await database.ref('orders/' + userId + '/' + orderId).update({
                    status: status,
                    statusUpdates: statusUpdates
                });
                
                return {
                    success: true
                };
            } catch (error) {
                console.error("Error updating order status:", error);
                return {
                    success: false,
                    message: error.message || 'Failed to update order status'
                };
            }
        }
    }
};

// Make FirebaseUtil available globally
window.FirebaseUtil = FirebaseUtil;
