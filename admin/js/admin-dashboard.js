// Admin Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Show loader
    showLoader();
    
    // Initialize sidebar functionality
    initSidebar();
    
    // Load all dashboard data
    Promise.all([
        loadDashboardStats(),
        loadRecentOrders(),
        loadRecentMessages()
    ])
    .then(() => {
        // Hide loader when all data is loaded
        hideLoader(500); // Delay to ensure smoother transition
    })
    .catch(error => {
        console.error('Error loading dashboard data:', error);
        hideLoader();
    });
});

// Loader functions
function showLoader() {
    const loader = document.getElementById('dashboard-loader');
    if (loader) {
        loader.classList.remove('hidden');
    }
}

function hideLoader(delay = 0) {
    const loader = document.getElementById('dashboard-loader');
    if (loader) {
        if (delay > 0) {
            setTimeout(() => {
                loader.classList.add('hidden');
            }, delay);
        } else {
            loader.classList.add('hidden');
        }
    }
}

// Initialize sidebar functionality
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('sidebar-visible');
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 992 && 
                !e.target.closest('#sidebar') && 
                !e.target.closest('#sidebar-toggle') &&
                sidebar.classList.contains('sidebar-visible')) {
                sidebar.classList.remove('sidebar-visible');
            }
        });
    }
}

// Load dashboard statistics from Firebase
function loadDashboardStats() {
    const database = firebase.database();
    
    // Return a promise for Promise.all in the DOMContentLoaded handler
    return new Promise((resolve, reject) => {
        Promise.all([
            // Get products count
            database.ref('products').once('value')
                .then(snapshot => {
                    const productsCount = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
                    document.getElementById('total-products').textContent = productsCount;
                })
                .catch(error => {
                    console.error('Error fetching products:', error);
                    document.getElementById('total-products').textContent = 'Error';
                }),
            
            // Get users count
            database.ref('users').once('value')
                .then(snapshot => {
                    const usersCount = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
                    document.getElementById('total-users').textContent = usersCount;
                })
                .catch(error => {
                    console.error('Error fetching users:', error);
                    document.getElementById('total-users').textContent = 'Error';
                }),
            
            // Get all orders count
            database.ref('orders').once('value')
                .then(snapshot => {
                    if (!snapshot.exists()) {
                        document.getElementById('total-orders').textContent = 0;
                        return;
                    }
                    
                    let totalOrders = 0;
                    snapshot.forEach(userSnapshot => {
                        if (userSnapshot.exists()) {
                            totalOrders += Object.keys(userSnapshot.val()).length;
                        }
                    });
                    
                    document.getElementById('total-orders').textContent = totalOrders;
                })
                .catch(error => {
                    console.error('Error fetching orders:', error);
                    document.getElementById('total-orders').textContent = 'Error';
                }),
                
            // Get unread messages count
            database.ref('contacts').orderByChild('status').equalTo('new').once('value')
                .then(snapshot => {
                    const unreadMessagesCount = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
                    document.getElementById('unread-messages').textContent = unreadMessagesCount;
                })
                .catch(error => {
                    console.error('Error fetching unread messages:', error);
                    document.getElementById('unread-messages').textContent = 'Error';
                })
        ])
        .then(() => resolve())
        .catch(error => reject(error));
    });
}

// Load recent orders
function loadRecentOrders() {
    const database = firebase.database();
    const ordersTable = document.getElementById('recent-orders-table');
    
    if (!ordersTable) return Promise.resolve(); // Return resolved promise if no table
    
    const tbody = ordersTable.querySelector('tbody');
    
    // Return a promise for Promise.all in the DOMContentLoaded handler
    // Fetch orders and users in parallel
    return Promise.all([
        database.ref('orders').once('value'),
        database.ref('users').once('value')
    ])
    .then(([ordersSnapshot, usersSnapshot]) => {
        if (!ordersSnapshot.exists()) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No orders found</td></tr>';
            return;
        }

        // Prepare users map
        const usersObj = usersSnapshot.val() || {};
        const usersMap = {};
        Object.keys(usersObj).forEach(uid => {
            usersMap[uid] = usersObj[uid];
        });

        // Collect all orders with user IDs
        const allOrders = [];
        ordersSnapshot.forEach(userSnapshot => {
            const userId = userSnapshot.key;
            if (userSnapshot.exists()) {
                Object.entries(userSnapshot.val()).forEach(([orderId, orderData]) => {
                    allOrders.push({
                        userId,
                        orderId,
                        ...orderData
                    });
                });
            }
        });

        // Sort by date (newest first)
        allOrders.sort((a, b) => {
            return b.orderDate - a.orderDate;
        });

        // Take only the 5 most recent orders
        const recentOrders = allOrders.slice(0, 5);

        if (recentOrders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No orders found</td></tr>';
            return;
        }

        // Clear loading message
        tbody.innerHTML = '';

        // Add orders to the table
        recentOrders.forEach(order => {
            // Calculate order total
            const orderItems = order.products || order.items || [];
            const orderTotal = orderItems.reduce((sum, item) => {
                const priceStr = typeof item.price === 'string' ? item.price : item.price.toString();
                const numericPrice = parseFloat(priceStr.replace(/[₹,]/g, ''));
                return sum + (numericPrice * item.quantity);
            }, 0);

            // Get customer name from usersMap, fallback to shippingAddress.name, then 'Customer'
            let customerName = 'Customer';
            if (usersMap[order.userId] && usersMap[order.userId].name) {
                customerName = usersMap[order.userId].name;
            } else if (order.shippingAddress && order.shippingAddress.name) {
                customerName = order.shippingAddress.name;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${order.orderId.substring(0, 8)}...</td>
                <td>${customerName}</td>
                <td>${formatDate(order.orderDate)}</td>
                <td>₹${orderTotal.toFixed(2)}</td>
                <td><span class="status-chip status-${order.status.toLowerCase()}">${order.status}</span></td>
                <td>
                    <div class="action-icons">
                        <i class="fas fa-eye" title="View Details" onclick="viewOrderDetails('${order.userId}', '${order.orderId}')"></i>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    })
    .catch(error => {
        console.error('Error fetching recent orders:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading orders</td></tr>';
    });
}

// Load recent messages
function loadRecentMessages() {
    const database = firebase.database();
    const messagesTable = document.getElementById('recent-messages-table');
    
    if (!messagesTable) return;
    
    const tbody = messagesTable.querySelector('tbody');
    
    // Return a promise for Promise.all in the DOMContentLoaded handler
    return database.ref('contacts').orderByChild('timestamp').limitToLast(5).once('value')
        .then(snapshot => {
            if (!snapshot.exists()) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">No messages found</td></tr>';
                return;
            }
            
            // Collect all messages
            const messages = [];
            
            snapshot.forEach(messageSnapshot => {
                messages.push({
                    id: messageSnapshot.key,
                    ...messageSnapshot.val()
                });
            });
            
            // Sort by date (newest first)
            messages.sort((a, b) => {
                return b.timestamp - a.timestamp;
            });
            
            if (messages.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">No messages found</td></tr>';
                return;
            }
            
            // Clear loading message
            tbody.innerHTML = '';
            
            // Add messages to the table
            messages.forEach(message => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${message.name}</td>
                    <td>${message.email}</td>
                    <td>${message.subject || 'No Subject'}</td>
                    <td>${formatDate(message.timestamp)}</td>
                    <td><span class="status-chip status-${message.status.toLowerCase()}">${message.status}</span></td>
                    <td>
                        <div class="action-icons">
                            <i class="fas fa-eye" title="View Details" onclick="viewMessageDetails('${message.id}')"></i>
                        </div>
                    </td>
                `;
                
                tbody.appendChild(tr);
            });
        })
        .catch(error => {
            console.error('Error fetching recent messages:', error);
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading messages</td></tr>';
        });
}

// Format date for display
function formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// View order details (will be implemented in orders.js)
function viewOrderDetails(userId, orderId) {
    window.location.href = `orders.html?view=${userId}:${orderId}`;
}

// View message details (will be implemented in messages.js)
function viewMessageDetails(messageId) {
    window.location.href = `messages.html?view=${messageId}`;
}
