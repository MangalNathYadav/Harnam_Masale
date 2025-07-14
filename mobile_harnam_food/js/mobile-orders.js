// Mobile Orders JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const ordersList = document.getElementById('orders-list');
    const authMessage = document.getElementById('auth-message');
    const noOrdersMessage = document.getElementById('no-orders-message');
    const filterOrdersBtn = document.getElementById('filter-orders-btn');
    const filterPanel = document.getElementById('filter-panel');
    const closeFilterBtn = document.getElementById('close-filter-btn');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    const orderDetailsModal = document.getElementById('order-details-modal');
    const orderDetailsContent = document.getElementById('order-details-content');
    const closeModalBtns = document.querySelectorAll('.close-modal-btn');
    const backdrop = document.getElementById('backdrop');
    const cartNavBtn = document.getElementById('cart-nav-btn');
    const cartModal = document.getElementById('cart-modal');
    
    // Initialize Firebase Auth state
    let currentUser = null;
    
    // Check authentication status
    initAuth();
    
    // Setup event listeners
    setupEventListeners();
    
    // Function to initialize authentication
    function initAuth() {
        firebase.auth().onAuthStateChanged(function(user) {
            currentUser = user;
            
            if (user) {
                // User is signed in
                if (authMessage) authMessage.classList.add('hidden');
                fetchOrders();
            } else {
                // No user is signed in
                if (ordersList) ordersList.classList.add('hidden');
                if (authMessage) authMessage.classList.remove('hidden');
                if (noOrdersMessage) noOrdersMessage.classList.add('hidden');
            }
        });
    }
    
    // Setup event listeners for UI elements
    function setupEventListeners() {
        // Filter panel toggle
        if (filterOrdersBtn) {
            filterOrdersBtn.addEventListener('click', function() {
                toggleFilterPanel(true);
            });
        }
        
        // Close filter panel
        if (closeFilterBtn) {
            closeFilterBtn.addEventListener('click', function() {
                toggleFilterPanel(false);
            });
        }
        
        // Apply filters
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', function() {
                applyFilters();
                toggleFilterPanel(false);
            });
        }
        
        // Reset filters
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', function() {
                resetFilters();
            });
        }
        
        // Close modals
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                closeModals();
            });
        });
        
        // Backdrop click to close modals
        if (backdrop) {
            backdrop.addEventListener('click', function() {
                closeModals();
            });
        }
        
        // Cart modal toggle
        if (cartNavBtn) {
            cartNavBtn.addEventListener('click', function(event) {
                event.preventDefault();
                toggleCartModal(true);
            });
        }
        
        // Login button
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', function() {
                window.location.href = 'index.html?redirect=orders';
            });
        }
    }
    
    // Function to fetch orders from Firebase
    function fetchOrders() {
        if (!currentUser) return;
        
        showLoading(ordersList);
        
        // Get orders from Firebase
        firebase.database().ref('orders')
            .orderByChild('userId')
            .equalTo(currentUser.uid)
            .once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    const orders = [];
                    snapshot.forEach(childSnapshot => {
                        orders.push({
                            id: childSnapshot.key,
                            ...childSnapshot.val()
                        });
                    });
                    
                    // Sort orders by date (newest first)
                    orders.sort((a, b) => b.orderDate - a.orderDate);
                    
                    // Apply any existing filters
                    const filteredOrders = applyFilterCriteria(orders);
                    
                    // Render orders
                    renderOrders(filteredOrders);
                    
                    if (filteredOrders.length === 0) {
                        showNoOrdersMessage();
                    } else {
                        hideNoOrdersMessage();
                    }
                } else {
                    showNoOrdersMessage();
                }
            })
            .catch(error => {
                console.error('Error fetching orders:', error);
                showErrorMessage(ordersList, 'Could not load orders. Please try again later.');
            });
    }
    
    // Function to render orders to the UI
    function renderOrders(orders) {
        if (!ordersList) return;
        
        ordersList.innerHTML = '';
        
        if (orders.length === 0) {
            showNoOrdersMessage();
            return;
        }
        
        orders.forEach(order => {
            const orderCard = createOrderCard(order);
            ordersList.appendChild(orderCard);
        });
        
        // Add event listeners to order cards
        const orderDetailsBtns = document.querySelectorAll('.view-order-details');
        orderDetailsBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const orderId = this.getAttribute('data-order-id');
                viewOrderDetails(orderId);
            });
        });
    }
    
    // Create an order card element
    function createOrderCard(order) {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        orderCard.setAttribute('data-order-id', order.id);
        
        const orderDate = new Date(order.orderDate);
        const formattedDate = orderDate.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const statusClass = `status-${order.status.toLowerCase()}`;
        
        orderCard.innerHTML = `
            <div class="order-header">
                <div class="order-id">#${order.orderNumber || order.id.substring(0, 8)}</div>
                <div class="order-date">${formattedDate}</div>
            </div>
            <div class="order-summary">
                <div class="order-items-summary">
                    ${order.items ? `${order.items.length} item(s)` : 'Items not available'}
                </div>
                <div class="order-total">₹${parseFloat(order.totalAmount).toFixed(2)}</div>
            </div>
            <div class="order-status">
                <span class="status-badge ${statusClass}">${capitalizeFirstLetter(order.status)}</span>
            </div>
            <div class="order-actions">
                <button class="view-order-details" data-order-id="${order.id}">
                    <i class="fas fa-eye"></i> View Details
                </button>
            </div>
        `;
        
        return orderCard;
    }
    
    // Show order details in modal
    function viewOrderDetails(orderId) {
        if (!orderDetailsModal || !orderDetailsContent) return;
        
        showLoading(orderDetailsContent);
        toggleOrderDetailsModal(true);
        
        // Fetch order details
        firebase.database().ref(`orders/${orderId}`)
            .once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    const order = {
                        id: snapshot.key,
                        ...snapshot.val()
                    };
                    
                    renderOrderDetails(order);
                } else {
                    showErrorMessage(orderDetailsContent, 'Order details not found.');
                }
            })
            .catch(error => {
                console.error('Error fetching order details:', error);
                showErrorMessage(orderDetailsContent, 'Could not load order details. Please try again later.');
            });
    }
    
    // Render order details in modal
    function renderOrderDetails(order) {
        if (!orderDetailsContent) return;
        
        const orderDate = new Date(order.orderDate);
        const formattedDate = orderDate.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        let itemsHTML = '';
        if (order.items && order.items.length > 0) {
            itemsHTML = order.items.map(item => `
                <div class="order-item">
                    <div class="item-image">
                        <img src="${item.image || '../assets/images/placeholder.png'}" alt="${item.name}">
                    </div>
                    <div class="item-details">
                        <h4>${item.name}</h4>
                        <div class="item-price">₹${parseFloat(item.price).toFixed(2)} × ${item.quantity}</div>
                    </div>
                    <div class="item-total">
                        ₹${(parseFloat(item.price) * parseFloat(item.quantity)).toFixed(2)}
                    </div>
                </div>
            `).join('');
        } else {
            itemsHTML = '<p class="no-items">No items available for this order.</p>';
        }
        
        // Create shipping address HTML
        let shippingHTML = '';
        if (order.shippingAddress) {
            const address = order.shippingAddress;
            shippingHTML = `
                <div class="shipping-address">
                    <h4>Shipping Address</h4>
                    <p>${address.name || ''}</p>
                    <p>${address.street || ''}, ${address.city || ''}</p>
                    <p>${address.state || ''}, ${address.postalCode || ''}</p>
                    <p>${address.phone || ''}</p>
                </div>
            `;
        }
        
        // Create payment info HTML
        let paymentHTML = '';
        if (order.paymentMethod) {
            paymentHTML = `
                <div class="payment-info">
                    <h4>Payment Information</h4>
                    <p><strong>Method:</strong> ${order.paymentMethod}</p>
                    ${order.paymentId ? `<p><strong>Payment ID:</strong> ${order.paymentId}</p>` : ''}
                    ${order.paymentStatus ? `<p><strong>Status:</strong> ${capitalizeFirstLetter(order.paymentStatus)}</p>` : ''}
                </div>
            `;
        }
        
        // Create order summary HTML
        const summaryHTML = `
            <div class="order-summary-detail">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>₹${parseFloat(order.subtotal || 0).toFixed(2)}</span>
                </div>
                ${order.shippingCost ? `
                <div class="summary-row">
                    <span>Shipping:</span>
                    <span>₹${parseFloat(order.shippingCost).toFixed(2)}</span>
                </div>` : ''}
                ${order.tax ? `
                <div class="summary-row">
                    <span>Tax:</span>
                    <span>₹${parseFloat(order.tax).toFixed(2)}</span>
                </div>` : ''}
                ${order.discount ? `
                <div class="summary-row discount">
                    <span>Discount:</span>
                    <span>-₹${parseFloat(order.discount).toFixed(2)}</span>
                </div>` : ''}
                <div class="summary-row total">
                    <span>Total:</span>
                    <span>₹${parseFloat(order.totalAmount).toFixed(2)}</span>
                </div>
            </div>
        `;
        
        // Render all details to modal
        orderDetailsContent.innerHTML = `
            <div class="order-details">
                <div class="order-details-header">
                    <div>
                        <h3>Order #${order.orderNumber || order.id.substring(0, 8)}</h3>
                        <p class="order-date-detail">${formattedDate}</p>
                    </div>
                    <div class="status-badge status-${order.status.toLowerCase()}">
                        ${capitalizeFirstLetter(order.status)}
                    </div>
                </div>
                
                <div class="order-details-content">
                    <h4>Items</h4>
                    <div class="order-items">
                        ${itemsHTML}
                    </div>
                    
                    <div class="order-info-grid">
                        ${shippingHTML}
                        ${paymentHTML}
                    </div>
                    
                    <h4>Order Summary</h4>
                    ${summaryHTML}
                </div>
                
                ${order.notes ? `
                <div class="order-notes">
                    <h4>Notes</h4>
                    <p>${order.notes}</p>
                </div>` : ''}
            </div>
        `;
    }
    
    // Apply filters to orders
    function applyFilters() {
        fetchOrders(); // Re-fetch and apply filters
    }
    
    // Apply filter criteria to orders array
    function applyFilterCriteria(orders) {
        // Get filter values
        const statusCheckboxes = document.querySelectorAll('input[type="checkbox"][value]');
        const selectedStatuses = Array.from(statusCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);
            
        const fromDateInput = document.getElementById('from-date');
        const toDateInput = document.getElementById('to-date');
        
        const fromDate = fromDateInput && fromDateInput.value ? new Date(fromDateInput.value).getTime() : null;
        const toDate = toDateInput && toDateInput.value ? new Date(toDateInput.value).getTime() + 86400000 : null; // Add 1 day to include the end date
        
        // Apply filters
        return orders.filter(order => {
            // Filter by status
            if (selectedStatuses.length > 0 && !selectedStatuses.includes(order.status.toLowerCase())) {
                return false;
            }
            
            // Filter by date range
            if (fromDate && order.orderDate < fromDate) {
                return false;
            }
            
            if (toDate && order.orderDate > toDate) {
                return false;
            }
            
            return true;
        });
    }
    
    // Reset filters to default
    function resetFilters() {
        // Reset status checkboxes
        const statusCheckboxes = document.querySelectorAll('input[type="checkbox"][value]');
        statusCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        
        // Reset date inputs
        const fromDateInput = document.getElementById('from-date');
        const toDateInput = document.getElementById('to-date');
        
        if (fromDateInput) fromDateInput.value = '';
        if (toDateInput) toDateInput.value = '';
        
        // Re-fetch and apply reset filters
        fetchOrders();
    }
    
    // Toggle filter panel visibility
    function toggleFilterPanel(show) {
        if (!filterPanel || !backdrop) return;
        
        if (show) {
            filterPanel.classList.add('active');
            backdrop.classList.add('active');
        } else {
            filterPanel.classList.remove('active');
            backdrop.classList.remove('active');
        }
    }
    
    // Toggle order details modal
    function toggleOrderDetailsModal(show) {
        if (!orderDetailsModal || !backdrop) return;
        
        if (show) {
            orderDetailsModal.classList.add('active');
            backdrop.classList.add('active');
        } else {
            orderDetailsModal.classList.remove('active');
            backdrop.classList.remove('active');
        }
    }
    
    // Toggle cart modal
    function toggleCartModal(show) {
        if (!cartModal || !backdrop) return;
        
        if (show) {
            cartModal.classList.add('active');
            backdrop.classList.add('active');
            loadCartItems();
        } else {
            cartModal.classList.remove('active');
            backdrop.classList.remove('active');
        }
    }
    
    // Close all modals
    function closeModals() {
        toggleFilterPanel(false);
        toggleOrderDetailsModal(false);
        toggleCartModal(false);
    }
    
    // Show loading state
    function showLoading(element) {
        if (!element) return;
        
        element.innerHTML = `
            <div class="loading-container">
                <div class="loader"></div>
                <p>Loading...</p>
            </div>
        `;
    }
    
    // Show error message
    function showErrorMessage(element, message) {
        if (!element) return;
        
        element.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
            </div>
        `;
    }
    
    // Show no orders message
    function showNoOrdersMessage() {
        if (!noOrdersMessage || !ordersList) return;
        
        ordersList.classList.add('hidden');
        noOrdersMessage.classList.remove('hidden');
    }
    
    // Hide no orders message
    function hideNoOrdersMessage() {
        if (!noOrdersMessage || !ordersList) return;
        
        ordersList.classList.remove('hidden');
        noOrdersMessage.classList.add('hidden');
    }
    
    // Load cart items for cart modal
    function loadCartItems() {
        // This function would interact with your cart system
        // Implementation depends on how you store cart data
        const cartItems = document.getElementById('cart-items');
        const cartEmptyMessage = document.getElementById('cart-empty-message');
        const cartTotalPrice = document.getElementById('cart-total-price');
        
        if (!cartItems || !cartEmptyMessage || !cartTotalPrice) return;
        
        // Get cart from localStorage or wherever you store it
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        if (cart.length === 0) {
            cartItems.classList.add('hidden');
            cartEmptyMessage.classList.remove('hidden');
            cartTotalPrice.textContent = '₹0.00';
            return;
        }
        
        cartItems.classList.remove('hidden');
        cartEmptyMessage.classList.add('hidden');
        
        // Render cart items
        cartItems.innerHTML = '';
        let total = 0;
        
        cart.forEach(item => {
            const itemTotal = parseFloat(item.price) * parseInt(item.quantity);
            total += itemTotal;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-image">
                    <img src="${item.image || '../assets/images/placeholder.png'}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <div class="cart-item-price">₹${parseFloat(item.price).toFixed(2)} × ${item.quantity}</div>
                </div>
                <div class="cart-item-actions">
                    <button class="remove-item-btn" data-item-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            cartItems.appendChild(cartItem);
        });
        
        cartTotalPrice.textContent = `₹${total.toFixed(2)}`;
        
        // Add event listeners to remove buttons
        const removeButtons = document.querySelectorAll('.remove-item-btn');
        removeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const itemId = this.getAttribute('data-item-id');
                removeCartItem(itemId);
            });
        });
    }
    
    // Remove item from cart
    function removeCartItem(itemId) {
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        // Remove item from cart
        cart = cart.filter(item => item.id !== itemId);
        
        // Save updated cart
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Update cart badge
        updateCartBadge();
        
        // Reload cart items
        loadCartItems();
    }
    
    // Update cart badge count
    function updateCartBadge() {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const cartBadge = document.querySelector('.cart-badge');
        
        if (cartBadge) {
            cartBadge.textContent = cart.length;
            
            if (cart.length > 0) {
                cartBadge.classList.add('active');
            } else {
                cartBadge.classList.remove('active');
            }
        }
    }
    
    // Helper function to capitalize first letter
    function capitalizeFirstLetter(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }
    
    // Initialize cart badge on load
    updateCartBadge();
});
