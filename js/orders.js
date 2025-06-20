// Orders functionality for Harnam Masale

// Check if user is logged in, if not redirect to login
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.HarnamAuth === 'undefined') {
        console.error('HarnamAuth not available - redirecting to login');
        window.location.href = 'login.html?redirect=orders.html';
        return;
    }
    
    const currentUser = window.HarnamAuth.getCurrentUser();
    if (!currentUser) {
        console.error('User not logged in - redirecting to login');
        window.location.href = 'login.html?redirect=orders.html';
        return;
    }
    
    console.log('User authenticated:', currentUser.id);
    
    // Load and display user orders
    loadUserOrders(currentUser);
    
    // Setup modal functionality
    setupOrderModal();
});

// Load user orders from Firebase or localStorage
async function loadUserOrders(user) {
    const ordersListContainer = document.querySelector('.orders-list');
    const noOrdersMessage = document.querySelector('.no-orders-message');
    
    if (!ordersListContainer || !noOrdersMessage) {
        console.error('Required DOM elements not found for orders page');
        return;
    }
    
    // Show loading state
    ordersListContainer.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading your orders...</p>
        </div>
    `;
    
    try {
        // Get orders from Firebase if available, fallback to localStorage
        let orders = [];
        
        if (typeof window.FirebaseUtil !== 'undefined') {
            console.log('Fetching orders from Firebase for user:', user.id);
            const result = await window.FirebaseUtil.orders.getUserOrders(user.id);
            
            if (result.success) {
                orders = result.orders;
                console.log('Fetched', orders.length, 'orders from Firebase');
            } else {
                throw new Error(result.message || 'Failed to fetch orders from Firebase');
            }
        } else {
            // Fallback to localStorage
            console.log('Firebase not available, falling back to localStorage');
            orders = user.orders || [];
        }
        
        // If no orders, show the empty state message
        if (!orders || orders.length === 0) {
            ordersListContainer.style.display = 'none';
            noOrdersMessage.style.display = 'block';
            return;
        }
        
        // Hide empty state and show orders
        noOrdersMessage.style.display = 'none';
        ordersListContainer.style.display = 'block';
        
        // Clear existing orders
        ordersListContainer.innerHTML = '';
        
        // Sort orders by date (newest first)
        const sortedOrders = [...orders].sort((a, b) => {
            const dateA = a.orderDate ? new Date(a.orderDate).getTime() : 0;
            const dateB = b.orderDate ? new Date(b.orderDate).getTime() : 0;
            return dateB - dateA;
        });
        
        console.log('Displaying', sortedOrders.length, 'sorted orders');
        
        // Generate HTML for each order
        sortedOrders.forEach(order => {
            const orderCard = createOrderCard(order);
            ordersListContainer.appendChild(orderCard);
        });
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersListContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load your orders. Please try again later.</p>
                <button class="retry-btn">Retry</button>
            </div>
        `;
        
        // Add retry functionality
        const retryBtn = ordersListContainer.querySelector('.retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => loadUserOrders(user));
        }
    }
}

// Create an order card element
function createOrderCard(order) {
    const orderCard = document.createElement('div');
    orderCard.className = 'order-card';
    
    // Use orderId if available (Firebase format) or id (localStorage format)
    const orderId = order.orderId || order.id;
    orderCard.dataset.orderId = orderId;
    
    // Format the date
    let orderDate;
    try {
        // Try to parse the date (could be string or timestamp)
        if (typeof order.orderDate === 'string') {
            orderDate = new Date(order.orderDate);
        } else if (typeof order.orderDate === 'number') {
            orderDate = new Date(order.orderDate);
        } else {
            // Default to current date if no valid date found
            orderDate = new Date();
        }
    } catch (e) {
        console.error('Error parsing order date:', e);
        orderDate = new Date(); // Fallback to current date
    }
    
    const formattedDate = orderDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Generate HTML for order items preview (show up to 4 items)
    // Use order.products if available, else order.items
    const itemsPreviewHTML = generateItemsPreview(order.products || order.items);
    
    // Use a shortened version of the order ID for display
    const displayId = orderId.substring(0, 8);
    
    orderCard.innerHTML = `
        <div class="order-header">
            <div class="order-header-left">
                <div class="order-id">Order #${displayId}</div>
                <div class="order-date">${formattedDate}</div>
            </div>
            <div class="order-header-right">
                <div class="order-status ${order.status?.toLowerCase() || 'processing'}">${order.status || 'Processing'}</div>
                <div class="order-total">₹${(order.total || 0).toFixed(2)}</div>
            </div>
        </div>
        <div class="order-body">
            <div class="order-items">
                ${itemsPreviewHTML}
            </div>
            <div class="order-actions">
                <button class="order-action-btn view-details" data-order-id="${orderId}">
                    <i class="fas fa-eye"></i> View Details
                </button>
                <button class="order-action-btn reorder" data-order-id="${orderId}">
                    <i class="fas fa-sync-alt"></i> Reorder
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners
    orderCard.querySelector('.view-details').addEventListener('click', () => {
        openOrderDetailsModal(order);
    });
    
    orderCard.querySelector('.reorder').addEventListener('click', () => {
        reorderItems(order.products || order.items);
    });
    
    return orderCard;
}

// Generate HTML for order items preview
function generateItemsPreview(items) {
    if (!items || items.length === 0) return 'No items';
    
    // Display up to 4 items
    const displayItems = items.slice(0, 4);
    
    // Generate HTML for each item
    const itemsHTML = displayItems.map(item => {
        // Use item.image if available, else placeholder
        return `
            <div class="order-item-preview">
                <img src="${item.image || 'assets/images/placeholder-product.jpg'}" alt="${item.name}" onerror="this.src='assets/images/placeholder-product.jpg'">
            </div>
        `;
    }).join('');
    
    // Add a count indicator if there are more items
    const additionalItems = items.length - 4;
    const countHTML = additionalItems > 0 ? 
        `<div class="order-item-count">+${additionalItems}</div>` : '';
    
    return itemsHTML + countHTML;
}

// Open order details modal
function openOrderDetailsModal(order) {
    const modal = document.getElementById('order-details-modal');
    if (!modal) return;
    
    // Format the date
    const orderDate = new Date(order.orderDate);
    const formattedDate = orderDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Generate items HTML
    // Use order.products if available, else order.items
    const itemsHTML = (order.products || order.items || []).map(item => {
        return `
            <div class="order-detail-item">
                <div class="order-detail-item-image">
                    <img src="${item.image || 'assets/images/placeholder-product.jpg'}" alt="${item.name}" onerror="this.src='assets/images/placeholder-product.jpg'">
                </div>
                <div class="order-detail-item-info">
                    <div class="order-detail-item-title">${item.name}</div>
                    <div class="order-detail-item-price">₹${(typeof item.price === 'number' ? item.price.toFixed(2) : item.price)}</div>
                </div>
                <div class="order-detail-item-quantity">
                    x${item.quantity}
                </div>
            </div>
        `;
    }).join('');
    
    // Generate tracking steps based on status
    const trackingSteps = generateTrackingSteps(order.status);
    
    // Set modal content
    const modalContent = modal.querySelector('.order-details-content');
    modalContent.innerHTML = `
        <div class="order-details-header">
            <div class="order-details-header-left">
                <h3>Order Details</h3>
                <div class="order-detail-id">Order ID: #${order.orderId || order.id}</div>
                <div class="order-detail-date">Placed on: ${formattedDate}</div>
                <div class="order-detail-status ${order.status ? order.status.toLowerCase() : 'processing'}">${order.status || 'Processing'}</div>
            </div>
            <div class="order-details-header-right">
                <button class="btn reorder-all-btn" data-order-id="${order.orderId || order.id}">
                    <i class="fas fa-sync-alt"></i> Reorder All Items
                </button>
            </div>
        </div>
        
        <div class="order-detail-items">
            <h4>Ordered Items</h4>
            ${itemsHTML}
        </div>
        
        <div class="order-detail-summary">
            <h4>Order Summary</h4>
            <div class="summary-row">
                <span>Subtotal</span>
                <span>₹${((order.subtotal !== undefined ? order.subtotal : (order.total * 0.9)) || 0).toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Shipping</span>
                <span>${order.total >= 500 ? 'Free' : '₹50.00'}</span>
            </div>
            <div class="summary-row">
                <span>Tax (GST)</span>
                <span>₹${((order.tax !== undefined ? order.tax : (order.total * 0.1)) || 0).toFixed(2)}</span>
            </div>
            <div class="summary-row total">
                <span>Total</span>
                <span>₹${(order.total || 0).toFixed(2)}</span>
            </div>
        </div>
        
        <div class="order-detail-address">
            <h4>Delivery Address</h4>
            <div class="address-details">
                ${order.address || 'No address provided'}
            </div>
        </div>
        
        <div class="order-tracking">
            <h4>Order Tracking</h4>
            <div class="tracking-timeline">
                ${trackingSteps}
            </div>
        </div>
    `;
    
    // Add event listener to reorder button
    const reorderBtn = modalContent.querySelector('.reorder-all-btn');
    if (reorderBtn) {
        reorderBtn.addEventListener('click', () => {
            reorderItems(order.products || order.items);
            closeModal(modal);
        });
    }
    
    // Show modal
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
}

// Generate tracking steps HTML based on order status
function generateTrackingSteps(status) {
    const steps = [
        {
            title: 'Order Placed',
            description: 'Your order has been received',
            completed: true
        },
        {
            title: 'Processing',
            description: 'We are preparing your items',
            completed: ['Processing', 'Shipped', 'Delivered'].includes(status)
        },
        {
            title: 'Shipped',
            description: 'Your order is on the way',
            completed: ['Shipped', 'Delivered'].includes(status)
        },
        {
            title: 'Delivered',
            description: 'Enjoy your spices!',
            completed: ['Delivered'].includes(status)
        }
    ];
    
    // If cancelled, show only cancelled step
    if (status === 'Cancelled') {
        return `
            <div class="tracking-step completed">
                <div class="tracking-step-content">
                    <div class="tracking-step-date">${new Date().toLocaleDateString()}</div>
                    <div class="tracking-step-title">Order Cancelled</div>
                    <div class="tracking-step-desc">This order has been cancelled</div>
                </div>
            </div>
        `;
    }
    
    return steps.map(step => {
        const stepClass = step.completed ? 'tracking-step completed' : 'tracking-step';
        return `
            <div class="${stepClass}">
                <div class="tracking-step-content">
                    <div class="tracking-step-date">${new Date().toLocaleDateString()}</div>
                    <div class="tracking-step-title">${step.title}</div>
                    <div class="tracking-step-desc">${step.description}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Reorder items - add them all to cart
async function reorderItems(items) {
    if (!items || items.length === 0) {
        showMessage('This order has no items to reorder', 'error');
        return;
    }
    
    try {
        // Clear current cart first
        if (typeof window.HarnamCart !== 'undefined') {
            window.HarnamCart.clearCart();
        } else {
            localStorage.setItem('harnamCart', JSON.stringify([]));
        }
        
        // Add each item to cart
        let addedCount = 0;
        for (const item of items) {
            // Skip items without required properties
            if (!item.id || !item.name) continue;
            
            if (typeof window.HarnamCart !== 'undefined') {
                // Use HarnamCart to add items
                await window.HarnamCart.addToCart({
                    id: item.id,
                    name: item.name,
                    price: item.price || 0,
                    quantity: item.quantity || 1,
                    image: item.image || '',
                });
                addedCount++;
            } else {
                // Fallback to manual cart management
                const cart = JSON.parse(localStorage.getItem('harnamCart')) || [];
                cart.push(item);
                localStorage.setItem('harnamCart', JSON.stringify(cart));
                addedCount++;
            }
        }
        
        // Show success message
        showMessage(`${addedCount} items added to your cart`, 'success');
        
        // Open cart modal if available
        setTimeout(() => {
            if (typeof window.HarnamCart !== 'undefined') {
                window.HarnamCart.openCartModal();
            }
        }, 500);
        
    } catch (error) {
        console.error('Error reordering items:', error);
        showMessage('Failed to add items to cart', 'error');
    }
}

// Set up order modal functionality
function setupOrderModal() {
    const modal = document.getElementById('order-details-modal');
    if (!modal) return;
    
    // Close button functionality
    const closeBtn = modal.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeModal(modal));
    }
    
    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
    
    // Close on ESC key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal(modal);
        }
    });
}

// Close modal function
function closeModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Show message notification
function showMessage(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.orders-notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'orders-notification';
        document.body.appendChild(notification);
    }
    
    // Set notification content
    notification.textContent = message;
    notification.className = `orders-notification ${type}`;
    notification.classList.add('show');
    
    // Hide notification after timeout
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Show error message
function showErrorMessage(message) {
    const container = document.querySelector('.orders-container');
    if (!container) return;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <p>${message}</p>
    `;
    
    container.prepend(errorDiv);
}

// No changes needed; orders will now appear after successful checkout.
