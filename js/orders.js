// Orders page logic using Firebase v8 namespaced SDK

if (typeof window.firebase === "undefined") {
    // Show error in UI and stop script
    const ordersContainer = document.getElementById("ordersContainer");
    if (ordersContainer) {
        ordersContainer.innerHTML = `<p style="color:red;">Error: Firebase SDK not loaded. Please check your internet connection or contact support.</p>`;
    }
    throw new Error("Firebase SDK not loaded. Please ensure Firebase scripts are included before orders.js.");
}

// Initialize DOM elements
let ordersContainer, orderDetailsModal, orderDetailsContent, closeModalBtn;

// Wait for DOM ready to ensure all elements are loaded
document.addEventListener("DOMContentLoaded", function() {
    // Initialize DOM elements
    ordersContainer = document.getElementById("ordersContainer");
    orderDetailsModal = document.getElementById("order-details-modal");
    orderDetailsContent = document.querySelector(".order-details-content");
    closeModalBtn = document.querySelector("#order-details-modal .close-modal");
    
    // Error handling for missing elements
    if (!orderDetailsModal) {
        console.error("Order details modal element not found in the DOM");
    }
    if (!orderDetailsContent) {
        console.error("Order details content element not found in the DOM");
    }

    // Download Invoice button logic
    const downloadBtn = document.getElementById("download-invoice-btn");
    if (downloadBtn && orderDetailsModal) {
        downloadBtn.addEventListener("click", function() {
            const modalContent = orderDetailsModal.querySelector(".modal-content");
            const closeBtn = orderDetailsModal.querySelector(".close-modal");
            const footer = orderDetailsModal.querySelector(".modal-footer");

            // Helper to recursively expand all scrollable elements
            function expandAllScrollable(element, savedStyles) {
                if (!element) return;
                const computed = window.getComputedStyle(element);
                if (["auto", "scroll", "hidden"].includes(computed.overflow) || ["auto", "scroll", "hidden"].includes(computed.overflowY)) {
                    savedStyles.push({el: element, overflow: element.style.overflow, maxHeight: element.style.maxHeight, background: element.style.background, color: element.style.color});
                    element.style.overflow = "visible";
                    element.style.maxHeight = "none";
                    element.style.background = '#fff';
                    element.style.color = '#111';
                }
                Array.from(element.children).forEach(child => expandAllScrollable(child, savedStyles));
            }

            // Save and expand all scrollable ancestors and children
            let savedStyles = [];
            let el = modalContent;
            while (el && el !== document.body) {
                expandAllScrollable(el, savedStyles);
                el = el.parentElement;
            }
            expandAllScrollable(modalContent, savedStyles);

            // Also force all text inside modal to dark for capture
            const allTextEls = modalContent.querySelectorAll('*');
            const textColorStyles = [];
            allTextEls.forEach(node => {
                textColorStyles.push({node, color: node.style.color, background: node.style.background});
                node.style.color = '#111';
                node.style.background = 'transparent';
            });

            // Hide buttons
            if (closeBtn) closeBtn.style.visibility = "hidden";
            if (footer) footer.style.visibility = "hidden";

            // Scroll modal to top
            modalContent.scrollTop = 0;

            html2canvas(modalContent, {backgroundColor: '#fff'}).then(canvas => {
                // Get order info for filename
                let orderId = '';
                let userName = '';
                let orderDate = '';
                try {
                    // Try to extract orderId from modal (from a data attribute or visible text)
                    const orderIdEl = modalContent.querySelector('[data-order-id]');
                    if (orderIdEl) orderId = orderIdEl.getAttribute('data-order-id');
                    // Try to extract username from the modal content
                    const nameEl = modalContent.querySelector('.order-detail-address, .address-details');
                    if (nameEl) {
                        const nameMatch = nameEl.textContent.match(/([A-Za-z][A-Za-z0-9_\- ]{2,})/);
                        if (nameMatch) userName = nameMatch[1].replace(/\s+/g, '_');
                    }
                    // Try to extract date from the modal (look for a date string)
                    const dateEl = modalContent.querySelector('.order-meta-bar, .order-date');
                    if (dateEl) {
                        const dateMatch = dateEl.textContent.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
                        if (dateMatch) orderDate = dateMatch[1].replace(/\//g, '-');
                    }
                } catch(e) {}
                // Fallbacks
                if (!orderDate) orderDate = (new Date()).toLocaleDateString().replace(/\//g, '-');
                if (!userName) userName = 'user';
                if (!orderId) orderId = 'order';
                const now = new Date();
                const time = now.toTimeString().slice(0,8).replace(/:/g, '-');
                const filename = `${orderDate}_${time}_${orderId}_${userName}.png`;
                const link = document.createElement('a');
                link.download = filename;
                link.href = canvas.toDataURL();
                link.click();
                // Restore styles
                savedStyles.forEach(({el, overflow, maxHeight, background, color}) => {
                    el.style.overflow = overflow;
                    el.style.maxHeight = maxHeight;
                    el.style.background = background;
                    el.style.color = color;
                });
                textColorStyles.forEach(({node, color, background}) => {
                    node.style.color = color;
                    node.style.background = background;
                });
                if (closeBtn) closeBtn.style.visibility = "visible";
                if (footer) footer.style.visibility = "visible";
            });
        });
    }
});

// Helper: Format date
function formatDate(date) {
    if (!date) return "-";
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    return d.toLocaleString();
}

// Helper: Get status class
function getStatusClass(status) {
    if (!status) return "";
    const s = status.toLowerCase();
    if (s === "delivered") return "delivered";
    if (s === "processing") return "processing";
    if (s === "shipped") return "shipped";
    if (s === "cancelled") return "cancelled";
    return "";
}

// Helper: Check if order is within 24 hours
function isWithin24Hours(orderDate) {
    if (!orderDate) return false;
    const now = Date.now();
    const orderTime = typeof orderDate === "number" ? orderDate : new Date(orderDate).getTime();
    return (now - orderTime) <= 86400000; // 24 hours in milliseconds
}

// Helper: Get image HTML with base64 fallback
function getOrderItemImageHtml(item) {
    // Use Base64 data directly if available
    if (item.image && item.image.startsWith('data:')) {
        return `<img src="${item.image}" alt="${item.name || 'Product'}">`;
    }
    
    // Use imageBase64 if available
    if (item.imageBase64) {
        return `<img src="${item.imageBase64}" alt="${item.name || 'Product'}">`;
    }
    
    // Process regular image paths
    let imageSrc = '';
    if (item.image) {
        // If image is a filename (not a full URL or data URI), prepend assets/images/
        if (!item.image.startsWith('http') && !item.image.startsWith('data:') && !item.image.startsWith('/')) {
            imageSrc = 'assets/images/' + item.image;
        } else {
            imageSrc = item.image;
        }
        
        // Check if image URL is a localhost URL (which would break)
        if (imageSrc.includes('127.0.0.1') || imageSrc.includes('localhost')) {
            // Try to convert to a relative path
            try {
                const url = new URL(imageSrc);
                const pathname = url.pathname;
                if (pathname.startsWith('/')) {
                    imageSrc = pathname.substring(1);
                } else {
                    imageSrc = pathname;
                }
            } catch (e) {
                console.error('Error parsing URL:', e);
                // Fallback to placeholder
                imageSrc = 'assets/images/placeholder-product.jpg';
            }
        }
        
        // Try to use image, fallback to placeholder if missing
        return `<img src="${imageSrc}" alt="${item.name || 'Product'}" onerror="this.src='assets/images/placeholder-product.jpg'">`;
    }
    
    // No image available, use placeholder
    return `<img src="assets/images/placeholder-product.jpg" alt="No Image">`;
}

// Function to cancel an order
function cancelOrder(orderId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        showMessage("You must be logged in to cancel an order", "error");
        return;
    }
    
    if (confirm("Are you sure you want to cancel this order?")) {
        const orderRef = firebase.database().ref(`orders/${user.uid}/${orderId}`);
        orderRef.update({ status: "cancelled" })
            .then(() => {
                showMessage("Order cancelled successfully", "success");
                // Close modal if it's open
                if (orderDetailsModal && orderDetailsModal.classList.contains("show")) {
                    hideOrderDetails();
                }
            })
            .catch(error => {
                console.error("Error cancelling order:", error);
                showMessage("Failed to cancel order. Please try again.", "error");
            });
    }
}

// Helper: Show message/toast
function showMessage(message, type = "info") {
    // Create toast element if it doesn't exist
    let toast = document.getElementById("toast-message");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast-message";
        document.body.appendChild(toast);
    }
    
    // Set message and type
    toast.textContent = message;
    toast.className = `toast-message ${type}`;
    
    // Show toast
    toast.classList.add("show");
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// Show order details modal
function showOrderDetails(order) {
    if (!order) return;
    // Use products or items array for order details
    const orderItems = order.products && Array.isArray(order.products) && order.products.length > 0
        ? order.products
        : (order.items || []);
    let html = `
        <div class="order-details-header">
            <div class="order-details-header-left">
                <h3>Order #${order.orderId || order.id}</h3>
                <div class="order-detail-id">Order ID: ${order.orderId || order.id}</div>
                <div class="order-detail-date">Date: ${formatDate(order.orderDate)}</div>
                <div class="order-detail-status order-status ${getStatusClass(order.status)}">${order.status || "Processing"}</div>
            </div>
            <div class="order-details-header-right">
                <div class="order-total">Total: ₹${order.total ?? 0}</div>
            </div>
        </div>
        <div class="order-detail-items">
            ${orderItems.map(item => `
                <div class="order-detail-item">
                    <div class="order-detail-item-image">
                        ${getOrderItemImageHtml(item)}
                    </div>
                    <div class="order-detail-item-info">
                        <div class="order-detail-item-title">${item.name || 'Product'}</div>
                        <div class="order-detail-item-price">₹${item.price}</div>
                    </div>
                    <div class="order-detail-item-quantity">×${item.quantity}</div>
                </div>
            `).join("")}
        </div>
        <div class="order-detail-summary">
            <h4>Order Summary</h4>
            <div class="summary-row"><span>Subtotal</span><span>₹${order.subtotal ?? order.total ?? 0}</span></div>
            ${order.shipping ? `<div class="summary-row"><span>Shipping</span><span>₹${order.shipping}</span></div>` : ""}
            ${order.tax ? `<div class="summary-row"><span>Tax</span><span>₹${order.tax}</span></div>` : ""}
            ${order.discount ? `<div class="summary-row"><span>Discount</span><span>-₹${order.discount}</span></div>` : ""}
            <div class="summary-row total"><span>Total</span><span>₹${order.total ?? 0}</span></div>
        </div>
        ${order.address ? `
        <div class="order-detail-address">
            <h4>Shipping Address</h4>
            <div class="address-details">
                ${typeof order.address === "string" ? order.address : `
                    ${order.address.name || order.address.fullName || ""}<br>
                    ${order.address.line1 || order.address.address1 || ""} ${order.address.line2 || order.address.address2 || ""}<br>
                    ${order.address.city || ""}, ${order.address.state || ""} ${(order.address.zip || order.address.pincode || order.address.pin || "")}<br>
                    ${order.address.country || ""}
                `}
            </div>
        </div>
        ` : ""}
        ${order.statusUpdates && Array.isArray(order.statusUpdates) ? `
        <div class="order-tracking">
            <h4>Order Tracking</h4>
            <div class="tracking-timeline">
                ${order.statusUpdates.map((step, idx) => `
                    <div class="tracking-step${step.status && step.status.toLowerCase() === (order.status || "").toLowerCase() ? " completed" : ""}">
                        <div class="tracking-step-content">
                            <div class="tracking-step-date">${formatDate(step.timestamp)}</div>
                            <div class="tracking-step-title">${step.status}</div>
                            <div class="tracking-step-desc">${step.description || ""}</div>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
        ` : ""}
        ${order.status !== "cancelled" && isWithin24Hours(order.orderDate) ? `
        <div class="order-detail-actions">
            <button id="modal-cancel-order-btn" class="cancel-order-btn" data-order-id="${order.orderId || order.id}">
                <i class="fas fa-times-circle"></i> Cancel Order
            </button>
        </div>
        ` : ""}
    `;
    orderDetailsContent.innerHTML = html;
    // First set display to block, then add the show class to trigger the transition
    orderDetailsModal.style.display = "block";
    // Force a reflow to ensure the display takes effect before adding the show class
    orderDetailsModal.offsetWidth;
    orderDetailsModal.classList.add("show");
    document.body.style.overflow = "hidden";
    
    // Add event listener for cancel button in modal
    const cancelOrderBtn = document.getElementById("modal-cancel-order-btn");
    if (cancelOrderBtn) {
        cancelOrderBtn.addEventListener("click", function() {
            const orderId = this.getAttribute("data-order-id");
            cancelOrder(orderId);
        });
    }
}

// Hide modal
function hideOrderDetails() {
    // First remove the show class to trigger the opacity transition
    orderDetailsModal.classList.remove("show");
    // Then hide the modal after the transition completes
    setTimeout(() => {
        orderDetailsModal.style.display = "none";
        document.body.style.overflow = "";
    }, 300); // Match this to the CSS transition duration
}

// Modal close button event listeners
document.addEventListener("DOMContentLoaded", function() {
    // Re-assign modal elements to make sure they're found after DOM is fully loaded
    const orderDetailsModal = document.getElementById("order-details-modal");
    const closeModalBtn = document.querySelector("#order-details-modal .close-modal");
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", hideOrderDetails);
    }
    
    if (orderDetailsModal) {
        // Close when clicking outside the modal content
        orderDetailsModal.addEventListener("click", function(e) {
            if (e.target === orderDetailsModal) {
                hideOrderDetails();
            }
        });
        
        // Add keyboard support - close with Escape key
        document.addEventListener("keydown", function(e) {
            if (e.key === "Escape" && orderDetailsModal.classList.contains("show")) {
                hideOrderDetails();
            }
        });
    }
});

// Main logic: Wait for Firebase Auth and DOM to be ready
document.addEventListener("DOMContentLoaded", function() {
    // Ensure ordersContainer is initialized
    if (!ordersContainer) {
        ordersContainer = document.getElementById("ordersContainer");
    }
    
    if (!ordersContainer) {
        console.error("Orders container not found");
        return;
    }
    
    // Show loading animation
    ordersContainer.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p class="loading-text">Loading your order history...</p>
        </div>
    `;
    
    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            ordersContainer.innerHTML = `<p>You must be logged in to view your orders. <a href='login.html?redirect=orders.html'>Login</a></p>`;
            return;
        }
        
        const ordersRef = firebase.database().ref("orders/" + user.uid);
        ordersRef.on("value", function(snapshot) {
        const orders = snapshot.val();
        if (!orders) {
            ordersContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-bag"></i>
                    <h3>No Orders Yet</h3>
                    <p>You haven't placed any orders yet. Explore our premium spices collection and place your first order!</p>
                    <a href="pages/products.html" class="btn">
                        <i class="fas fa-store"></i> Browse Products
                    </a>
                </div>
            `;
            return;
        }

        // Render orders as cards
        let html = `<div class="orders-list">`;
        Object.keys(orders).reverse().forEach(orderId => {
            const order = orders[orderId];
            // Use products or items array for preview
            const orderItems = order.products && Array.isArray(order.products) && order.products.length > 0
                ? order.products
                : (order.items || []);
            
            // Check if order is within 24 hours for cancel button
            const canCancel = order.status !== "cancelled" && isWithin24Hours(order.orderDate);
            
            html += `
                <div class="order-card">
                    <div class="order-header">
                        <div class="order-header-left">
                            <div class="order-id">Order #${orderId}</div>
                            <div class="order-date">${formatDate(order.orderDate)}</div>
                        </div>
                        <div class="order-header-right">
                            <div class="order-status ${getStatusClass(order.status)}">${order.status || "Processing"}</div>
                            <div class="order-total">₹${order.total ?? 0}</div>
                        </div>
                    </div>
                    <div class="order-body">
                        <div class="order-items">
                            ${orderItems.slice(0, 3).map(item => `
                                <div class="order-item-preview">
                                    ${getOrderItemImageHtml(item)}
                                </div>
                            `).join("")}
                            ${(orderItems.length > 3) ? `<div class="order-item-count">+${orderItems.length - 3} more</div>` : ""}
                        </div>
                        <div class="order-actions">
                            <button class="order-action-btn view-details" data-order-id="${orderId}">
                                <i class="fas fa-eye"></i> View Details
                            </button>
                            ${canCancel ? `
                            <button class="order-action-btn cancel-order" data-order-id="${orderId}">
                                <i class="fas fa-times-circle"></i> Cancel Order
                            </button>
                            ` : ""}
                        </div>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        ordersContainer.innerHTML = html;

        // Attach event listeners for "View Details" and "Cancel Order"
        document.querySelectorAll(".order-action-btn.view-details").forEach(btn => {
            btn.addEventListener("click", function(e) {
                e.preventDefault(); // Prevent any default button behavior
                const oid = this.getAttribute("data-order-id");
                console.log("View details clicked for order:", oid);
                const order = orders[oid];
                if (order) {
                    order.orderId = oid;
                    showOrderDetails(order);
                } else {
                    console.error("Order not found:", oid);
                }
            });
        });
        
        // Add event listeners for cancel order buttons
        document.querySelectorAll(".order-action-btn.cancel-order").forEach(btn => {
            btn.addEventListener("click", function(e) {
                e.preventDefault();
                const orderId = this.getAttribute("data-order-id");
                cancelOrder(orderId);
            });
        });
    }, function(error) {
        ordersContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle" style="color: #d32f2f;"></i>
                <h3>Couldn't Load Orders</h3>
                <p>We encountered a problem while loading your orders. Please try again.</p>
                <button onclick="window.location.reload();" class="btn">
                    <i class="fas fa-sync-alt"></i> Try Again
                </button>
            </div>
        `;
        console.error("Error loading orders:", error);
    });
    });
});
