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
                await auth.signOut();
                localStorage.removeItem('harnamCurrentUser');
                return { success: true };
            } catch (error) {
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
            
            // If Firebase has a user, return it
            if (firebaseUser) {
                return firebaseUser;
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
        // Update user profile
        async updateUserProfile(userId, userData) {
            try {
                const updates = {};
                
                // Only update fields that are provided
                if (userData.name) updates['name'] = userData.name;
                if (userData.email && auth.currentUser) {
                    // Update email in Firebase Auth
                    await auth.currentUser.updateEmail(userData.email);
                    updates['email'] = userData.email;
                }
                if (userData.photoURL) updates['photoURL'] = userData.photoURL;
                
                // Update in database
                await database.ref('users/' + userId).update(updates);
                
                // Update password if provided
                if (userData.password && auth.currentUser) {
                    await auth.currentUser.updatePassword(userData.password);
                }
                
                // Update local storage
                const currentUser = JSON.parse(localStorage.getItem('harnamCurrentUser'));
                if (currentUser && currentUser.id === userId) {
                    Object.assign(currentUser, updates);
                    localStorage.setItem('harnamCurrentUser', JSON.stringify(currentUser));
                }
                
                return { success: true };
            } catch (error) {
                console.error("Error updating user profile:", error);
                return {
                    success: false,
                    message: error.message || 'Failed to update profile'
                };
            }
        },
        
        // Get user data
        async getUserData(userId) {
            try {
                const snapshot = await database.ref('users/' + userId).once('value');
                return {
                    success: true,
                    data: snapshot.val()
                };
            } catch (error) {
                console.error("Error getting user data:", error);
                return {
                    success: false,
                    message: error.message || 'Failed to get user data'
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
                const cart = snapshot.val();
                
                console.log('Firebase cart fetch result:', cart);
                
                // Handle null, undefined, or non-array values
                if (!cart) {
                    return {
                        success: true,
                        cart: []
                    };
                }
                
                // Convert to array if it's an object (Firebase sometimes returns objects)
                let cartArray = cart;
                if (!Array.isArray(cart)) {
                    // If it's an object with numeric keys, convert to array
                    if (typeof cart === 'object') {
                        cartArray = Object.values(cart);
                    } else {
                        console.warn('Unexpected cart data format:', cart);
                        cartArray = [];
                    }
                }
                
                // Filter out any null or undefined items
                cartArray = cartArray.filter(item => item !== null && item !== undefined);
                
                console.log('Processed cart array:', cartArray);
                
                return {
                    success: true,
                    cart: cartArray
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
                console.log('Updating cart for user:', userId);
                if (!userId) {
                    console.error('Invalid user ID provided to updateUserCart');
                    return {
                        success: false,
                        message: 'Invalid user ID'
                    };
                }
                
                // Ensure cart is an array
                const cartArray = Array.isArray(cart) ? cart : [];
                
                // Filter out any null or undefined items
                const cleanCart = cartArray.filter(item => item !== null && item !== undefined);
                
                await database.ref('users/' + userId + '/cart').set(cleanCart);
                console.log('Cart updated successfully for user:', userId);
                
                return { success: true };
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
                // Get current cart from Firebase
                const { success, cart: firebaseCart } = await this.getUserCart(userId);
                
                if (!success) {
                    throw new Error('Failed to get Firebase cart');
                }
                
                // Merge local cart with Firebase cart
                const mergedCart = this.mergeCart(firebaseCart || [], localCart || []);
                
                // Update Firebase with merged cart
                await this.updateUserCart(userId, mergedCart);
                
                // Return merged cart
                return {
                    success: true,
                    cart: mergedCart
                };
            } catch (error) {
                console.error("Error syncing cart:", error);
                return {
                    success: false,
                    message: error.message || 'Failed to sync cart',
                    cart: localCart || []
                };
            }
        },

        // Merge local cart with Firebase cart
        mergeCart(firebaseCart, localCart) {
            // Start with Firebase cart items
            const mergedCart = [...firebaseCart];
            
            // Add or update with local cart items
            localCart.forEach(localItem => {
                const existingItemIndex = mergedCart.findIndex(item => item.id === localItem.id);
                
                if (existingItemIndex > -1) {
                    // Update quantity if item exists in both carts
                    mergedCart[existingItemIndex].quantity += localItem.quantity;
                } else {
                    // Add new item if not in Firebase cart
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
                const snapshot = await database.ref('users/' + userId + '/orders').once('value');
                return {
                    success: true,
                    orders: snapshot.val() || []
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
                // Get current orders
                const { orders = [] } = await this.getUserOrders(userId);
                
                // Create new order with Firebase timestamp
                const newOrder = {
                    id: 'order_' + Date.now() + Math.random().toString(36).substring(2, 10),
                    items: orderData.items || [],
                    total: orderData.total || 0,
                    subtotal: orderData.subtotal || 0,
                    shipping: orderData.shipping || 0,
                    tax: orderData.tax || 0,
                    discount: orderData.discount || 0,
                    appliedPromoCode: orderData.appliedPromoCode || null,
                    status: 'Processing',
                    address: orderData.address || {},
                    customer: orderData.customer || {},
                    payment: orderData.payment || 'cod',
                    orderDate: firebase.database.ServerValue.TIMESTAMP,
                    statusUpdates: [
                        {
                            status: 'Order Received',
                            timestamp: firebase.database.ServerValue.TIMESTAMP,
                            description: 'Your order has been received and is being processed.'
                        }
                    ]
                };
                
                // Add new order to the array
                const updatedOrders = [...orders, newOrder];
                
                // Save to Firebase
                await database.ref('users/' + userId + '/orders').set(updatedOrders);
                
                // Clear the cart after successful order
                await database.ref('users/' + userId + '/cart').set([]);
                
                // Update user's local storage data
                const currentUser = JSON.parse(localStorage.getItem('harnamCurrentUser'));
                if (currentUser && currentUser.id === userId) {
                    if (!currentUser.orders) currentUser.orders = [];
                    currentUser.orders.push({...newOrder, orderDate: new Date().toISOString()});
                    localStorage.setItem('harnamCurrentUser', JSON.stringify(currentUser));
                }
                
                return {
                    success: true,
                    order: {...newOrder, orderDate: new Date().toISOString()}
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
                const { orders = [] } = await this.getUserOrders(userId);
                const order = orders.find(order => order.id === orderId);
                
                if (!order) {
                    return {
                        success: false,
                        message: 'Order not found'
                    };
                }
                
                return {
                    success: true,
                    order
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
                const { orders = [] } = await this.getUserOrders(userId);
                const orderIndex = orders.findIndex(order => order.id === orderId);
                
                if (orderIndex === -1) {
                    return {
                        success: false,
                        message: 'Order not found'
                    };
                }
                
                // Update status
                orders[orderIndex].status = status;
                
                // Add status update to history
                if (!orders[orderIndex].statusUpdates) {
                    orders[orderIndex].statusUpdates = [];
                }
                
                orders[orderIndex].statusUpdates.push({
                    status,
                    description: description || `Order status changed to ${status}`,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
                
                // Save to Firebase
                await database.ref('users/' + userId + '/orders').set(orders);
                
                return {
                    success: true,
                    order: orders[orderIndex]
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
