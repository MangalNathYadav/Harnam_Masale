// Orders page logic using Firebase v8 namespaced SDK

if (typeof window.firebase === "undefined") {
    // Show error in UI and stop script
    const ordersContainer = document.getElementById("ordersContainer");
    if (ordersContainer) {
        ordersContainer.innerHTML = `<p style="color:red;">Error: Firebase SDK not loaded. Please check your internet connection or contact support.</p>`;
    }
    throw new Error("Firebase SDK not loaded. Please ensure Firebase scripts are included before orders.js.");
}

// ...existing code...

const ordersContainer = document.getElementById("ordersContainer");
const orderDetailsModal = document.getElementById("order-details-modal");
const orderDetailsContent = document.querySelector(".order-details-content");
const closeModalBtn = document.querySelector("#order-details-modal .close-modal");

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

// Show order details modal
function showOrderDetails(order) {
    if (!order) return;
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
            ${(order.products || order.items || []).map(item => `
                <div class="order-detail-item">
                    <div class="order-detail-item-image">
                        <img src="${item.image || 'images/placeholder.jpg'}" alt="${item.name}">
                    </div>
                    <div class="order-detail-item-info">
                        <div class="order-detail-item-title">${item.name}</div>
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
                    ${order.address.name || ""}<br>
                    ${order.address.line1 || ""} ${order.address.line2 || ""}<br>
                    ${order.address.city || ""}, ${order.address.state || ""} ${order.address.zip || ""}<br>
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
    `;
    orderDetailsContent.innerHTML = html;
    orderDetailsModal.classList.add("show");
    orderDetailsModal.style.display = "block";
    document.body.style.overflow = "hidden";
}

// Hide modal
function hideOrderDetails() {
    orderDetailsModal.classList.remove("show");
    setTimeout(() => {
        orderDetailsModal.style.display = "none";
        document.body.style.overflow = "";
    }, 200);
}

// Modal close button
if (closeModalBtn) {
    closeModalBtn.addEventListener("click", hideOrderDetails);
}
orderDetailsModal.addEventListener("click", (e) => {
    if (e.target === orderDetailsModal) hideOrderDetails();
});

// Main logic: Wait for Firebase Auth
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
                    <i class="fas fa-box-open"></i>
                    <h3>No Orders Yet</h3>
                    <p>You haven't placed any orders yet. Start shopping and your orders will appear here!</p>
                    <a href="pages/products.html" class="btn">Shop Now</a>
                </div>
            `;
            return;
        }

        // Render orders as cards
        let html = `<div class="orders-list">`;
        Object.keys(orders).reverse().forEach(orderId => {
            const order = orders[orderId];
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
                            ${(order.products || []).slice(0, 3).map(item => `
                                <div class="order-item-preview">
                                    <img src="${item.image || 'images/placeholder.jpg'}" alt="${item.name}">
                                </div>
                            `).join("")}
                            ${(order.products && order.products.length > 3) ? `<div class="order-item-count">+${order.products.length - 3} more</div>` : ""}
                        </div>
                        <div class="order-actions">
                            <button class="order-action-btn view-details" data-order-id="${orderId}">
                                <i class="fas fa-eye"></i> View Details
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        ordersContainer.innerHTML = html;

        // Attach event listeners for "View Details"
        document.querySelectorAll(".order-action-btn.view-details").forEach(btn => {
            btn.addEventListener("click", function() {
                const oid = this.getAttribute("data-order-id");
                const order = orders[oid];
                if (order) {
                    order.orderId = oid;
                    showOrderDetails(order);
                }
            });
        });
    }, function(error) {
        ordersContainer.innerHTML = `<p style="color:red;">Failed to load orders. Please try again later.</p>`;
        console.error("Error loading orders:", error);
    });
});
