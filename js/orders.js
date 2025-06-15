// Orders functionality for Harnam Masale

// Check if user is logged in, if not redirect to login
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.HarnamAuth === 'undefined') {
        console.error('Authentication module not found!');
        showErrorMessage('Authentication system not available. Please try again later.');
        return;
    }
    
    const currentUser = window.HarnamAuth.getCurrentUser();
    if (!currentUser) {
        // Determine proper redirect path based on current location
        const isInRootDir = !window.location.pathname.includes('/pages/');
        const loginPath = isInRootDir ? 'login.html' : '../login.html';
        const redirectParam = isInRootDir ? 'orders.html' : '../orders.html';
        
        window.location.href = `${loginPath}?redirect=${encodeURIComponent(redirectParam)}`;
        return;
    }
    
    // Load and display user orders
    loadUserOrders(currentUser);
    
    // Setup modal functionality
    setupOrderModal();
});

// Load user orders from localStorage
function loadUserOrders(user) {
    // Get orders from user object or empty array if none exist
    const orders = user.orders || [];
    
    const ordersListContainer = document.querySelector('.orders-list');
    const noOrdersMessage = document.querySelector('.no-orders-message');
    
    // If no orders, show the empty state message
    if (orders.length === 0) {
        noOrdersMessage.style.display = 'block';
        ordersListContainer.style.display = 'none';
        return;
    }
    
    // Hide empty state and show orders
    noOrdersMessage.style.display = 'none';
    ordersListContainer.style.display = 'block';
    
    // Clear existing orders
    ordersListContainer.innerHTML = '';
    
    // Sort orders by date (newest first)
    const sortedOrders = [...orders].sort((a, b) => {
        return new Date(b.orderDate) - new Date(a.orderDate);
    });
    
    // Generate HTML for each order
    sortedOrders.forEach(order => {
        const orderCard = createOrderCard(order);
        ordersListContainer.appendChild(orderCard);
    });
}

// Create an order card element
function createOrderCard(order) {
    const orderCard = document.createElement('div');
    orderCard.className = 'order-card';
    orderCard.dataset.orderId = order.id;
    
    // Format the date
    const orderDate = new Date(order.orderDate);
    const formattedDate = orderDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Generate HTML for order items preview (show up to 4 items)
    const itemsPreviewHTML = generateItemsPreview(order.items);
    
    orderCard.innerHTML = `
        <div class="order-header">
            <div class="order-header-left">
                <div class="order-id">Order #${order.id.substring(0, 8)}</div>
                <div class="order-date">${formattedDate}</div>
            </div>
            <div class="order-header-right">
                <div class="order-status ${order.status.toLowerCase()}">${order.status}</div>
                <div class="order-total">₹${order.total.toFixed(2)}</div>
            </div>
        </div>
        <div class="order-body">
            <div class="order-items">
                ${itemsPreviewHTML}
            </div>
            <div class="order-actions">
                <button class="order-action-btn view-details" data-order-id="${order.id}">
                    <i class="fas fa-eye"></i> View Details
                </button>
                <button class="order-action-btn reorder" data-order-id="${order.id}">
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
        reorderItems(order.items);
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
        return `
            <div class="order-item-preview">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='assets/images/placeholder-product.jpg'">
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
    const itemsHTML = order.items.map(item => {
        return `
            <div class="order-detail-item">
                <div class="order-detail-item-image">
                    <img src="${item.image}" alt="${item.name}" onerror="this.src='assets/images/placeholder-product.jpg'">
                </div>
                <div class="order-detail-item-info">
                    <div class="order-detail-item-title">${item.name}</div>
                    <div class="order-detail-item-price">${item.price}</div>
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
                <div class="order-detail-id">Order ID: #${order.id}</div>
                <div class="order-detail-date">Placed on: ${formattedDate}</div>
                <div class="order-detail-status ${order.status.toLowerCase()}">${order.status}</div>
            </div>
            <div class="order-details-header-right">
                <button class="btn reorder-all-btn" data-order-id="${order.id}">
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
                <span>₹${(order.total * 0.9).toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Shipping</span>
                <span>${order.total >= 500 ? 'Free' : '₹50.00'}</span>
            </div>
            <div class="summary-row">
                <span>Tax (GST)</span>
                <span>₹${(order.total * 0.1).toFixed(2)}</span>
            </div>
            <div class="summary-row total">
                <span>Total</span>
                <span>₹${order.total.toFixed(2)}</span>
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
            reorderItems(order.items);
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
function reorderItems(items) {
    if (!items || !items.length) {
        showMessage('No items to reorder', 'error');
        return;
    }
    
    if (typeof window.HarnamCart === 'undefined') {
        showMessage('Cart system not available', 'error');
        return;
    }
    
    // Clear cart first (optional - uncomment to enable)
    // window.HarnamCart.clearCart();
    
    // Add each item to cart
    items.forEach(item => {
        window.HarnamCart.addToCart({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity
        });
    });
    
    // Show success message
    showMessage('Items added to cart', 'success');
    
    // Open cart modal
    setTimeout(() => {
        window.HarnamCart.openCartModal();
    }, 500);
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
