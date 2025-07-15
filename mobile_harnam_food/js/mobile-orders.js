// Mobile Orders Page Logic
document.addEventListener('DOMContentLoaded', function() {
    const ordersContainer = document.getElementById('ordersContainer');
    const orderDetailsModal = document.getElementById('order-details-modal');
    const orderDetailsContent = orderDetailsModal.querySelector('.order-details-content');
    const closeModalBtn = orderDetailsModal.querySelector('.close-modal');
    const toast = document.getElementById('toast-message');

    // Show toast message
    function showToast(message, type = "info") {
        toast.textContent = message;
        toast.className = `toast-message ${type}`;
        toast.classList.add('show');
        setTimeout(() => { toast.classList.remove('show'); }, 3000);
    }

    // Format date
    function formatDate(date) {
        if (!date) return "-";
        const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    // Get status class
    function getStatusClass(status) {
        if (!status) return "";
        const s = status.toLowerCase();
        if (s === "delivered") return "delivered";
        if (s === "processing") return "processing";
        if (s === "shipped") return "shipped";
        if (s === "cancelled") return "cancelled";
        return "";
    }

    // Check if order is within 24 hours
    function isWithin24Hours(orderDate) {
        if (!orderDate) return false;
        const now = Date.now();
        const orderTime = typeof orderDate === "number" ? orderDate : new Date(orderDate).getTime();
        return (now - orderTime) <= 86400000;
    }

    // Get image HTML
    function getOrderItemImageHtml(item) {
        if (item.image && item.image.startsWith('data:')) {
            return `<img src="${item.image}" alt="${item.name || 'Product'}">`;
        }
        if (item.imageBase64) {
            return `<img src="${item.imageBase64}" alt="${item.name || 'Product'}">`;
        }
        let imageSrc = '';
        if (item.image) {
            if (!item.image.startsWith('http') && !item.image.startsWith('data:') && !item.image.startsWith('/')) {
                imageSrc = '../assets/images/' + item.image;
            } else {
                imageSrc = item.image;
            }
            return `<img src="${imageSrc}" alt="${item.name || 'Product'}" onerror="this.src='../assets/images/placeholder-product.jpg'">`;
        }
        return `<img src="../assets/images/placeholder-product.jpg" alt="No Image">`;
    }

    // Helper to format currency to two decimals
    function formatCurrency(val) {
        return Number(val ?? 0).toFixed(2);
    }

    // Show order details modal
    function showOrderDetails(order, orderId) {
        const orderItems = order.products && Array.isArray(order.products) && order.products.length > 0 ? order.products : (order.items || []);
        let html = `
            <div class="order-details-header">
                <div>
                    <h3>Order Id: #${orderId}</h3>
                    <div class="order-id">Order Id: #${orderId}</div>
                    <div class="order-date">Date: ${formatDate(order.orderDate)}</div>
                    <div class="order-status ${getStatusClass(order.status)}">${order.status || "Processing"}</div>
                </div>
                <div class="order-total">Total: ₹${formatCurrency(order.total)}</div>
            </div>
            <div class="order-detail-items">
                ${orderItems.map(item => `
                    <div class="order-detail-item">
                        <div class="order-detail-item-image">${getOrderItemImageHtml(item)}</div>
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
                <div class="summary-row"><span>Subtotal</span><span>₹${formatCurrency(order.subtotal ?? order.total)}</span></div>
                ${order.shipping ? `<div class="summary-row"><span>Shipping</span><span>₹${formatCurrency(order.shipping)}</span></div>` : ""}
                ${order.tax ? `<div class="summary-row"><span>Tax</span><span>₹${formatCurrency(order.tax)}</span></div>` : ""}
                ${order.discount ? `<div class="summary-row"><span>Discount</span><span>-₹${formatCurrency(order.discount)}</span></div>` : ""}
                <div class="summary-row total"><span>Total</span><span>₹${formatCurrency(order.total)}</span></div>
                ${order.discount ? (() => {
                    // Calculate discounted price: (subtotal + shipping + tax) - discount
                    let base = Number(order.subtotal ?? order.total ?? 0);
                    if (order.shipping) base += Number(order.shipping);
                    if (order.tax) base += Number(order.tax);
                    let discounted = base - Number(order.discount);
                    return `<div class=\"summary-row discounted-highlight\"><span>Price after Discount</span><span>₹${formatCurrency(discounted)}</span></div>`;
                })() : ""}
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
            <div class="order-detail-actions">
                <button id="download-invoice-btn" class="view-order-btn invoice-btn">
                    <i class="fas fa-file-invoice"></i> Download Invoice
                </button>
                ${order.status !== "cancelled" && isWithin24Hours(order.orderDate) ? `
                <button id="modal-cancel-order-btn" class="view-order-btn" data-order-id="${orderId}">
                    <i class="fas fa-times-circle"></i> Cancel Order
                </button>
                ` : ""}
            </div>
        `;
        orderDetailsContent.innerHTML = html;
        orderDetailsModal.style.display = "flex";
        setTimeout(() => orderDetailsModal.classList.add("show"), 10);
        document.body.style.overflow = "hidden";

        // Cancel order in modal
        var cancelOrderBtnModal = document.getElementById("modal-cancel-order-btn");
        if (cancelOrderBtnModal) {
            cancelOrderBtnModal.addEventListener("click", function() {
                const oid = this.getAttribute("data-order-id");
                cancelOrder(oid);
            });
        }
        // Download invoice in modal
        var downloadInvoiceBtn = document.getElementById("download-invoice-btn");
        if (downloadInvoiceBtn) {
            downloadInvoiceBtn.onclick = function() {
                // Extract order details for PDF
                const modalContent = orderDetailsModal.querySelector('.order-details-modal-content');
                if (!modalContent) return;
                // Clone and clean up for PDF
                const pdfContent = modalContent.cloneNode(true);
                // Remove modal close and actions
                const closeBtn = pdfContent.querySelector('.close-modal');
                if (closeBtn) closeBtn.remove();
                const actions = pdfContent.querySelector('.order-detail-actions');
                if (actions) actions.remove();
                // Style for PDF
                pdfContent.style.background = '#fff';
                pdfContent.style.boxShadow = 'none';
                pdfContent.style.padding = '1.2rem';
                pdfContent.style.maxHeight = 'none';
                pdfContent.style.overflow = 'visible';
                // Generate PDF
                const now = new Date();
                const dateStr = now.toISOString().slice(0,10);
                const filename = 'Invoice_' + dateStr + '_' + Math.floor(Math.random()*10000) + '.pdf';
                html2pdf().set({
                    margin: 0.5,
                    filename: filename,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, backgroundColor: '#fff', useCORS: true },
                    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
                }).from(pdfContent).save();
            };
        }
        orderDetailsContent.innerHTML = html;
        orderDetailsModal.style.display = "flex";
        setTimeout(() => orderDetailsModal.classList.add("show"), 10);
        document.body.style.overflow = "hidden";

        // Cancel order in modal
        const cancelOrderBtn = document.getElementById("modal-cancel-order-btn");
        if (cancelOrderBtn) {
            cancelOrderBtn.addEventListener("click", function() {
                const oid = this.getAttribute("data-order-id");
                cancelOrder(oid);
            });
        }
        // Download invoice in modal
    }

    // Hide modal
    function hideOrderDetails() {
        orderDetailsModal.classList.remove("show");
        setTimeout(() => {
            orderDetailsModal.style.display = "none";
            document.body.style.overflow = "";
        }, 300);
    }

    // Modal close button
    closeModalBtn.addEventListener('click', hideOrderDetails);
    orderDetailsModal.addEventListener('click', function(e) {
        if (e.target === orderDetailsModal) hideOrderDetails();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === "Escape" && orderDetailsModal.classList.contains("show")) hideOrderDetails();
    });

    // Cancel order
    function cancelOrder(orderId) {
        const user = firebase.auth().currentUser;
        if (!user) {
            showToast("You must be logged in to cancel an order", "error");
            return;
        }
        if (confirm("Are you sure you want to cancel this order?")) {
            const orderRef = firebase.database().ref(`orders/${user.uid}/${orderId}`);
            orderRef.update({ status: "cancelled" })
                .then(() => {
                    showToast("Order cancelled successfully", "success");
                    hideOrderDetails();
                })
                .catch(() => {
                    showToast("Failed to cancel order. Please try again.", "error");
                });
        }
    }

    // Main: fetch and render orders
    function renderOrders(orders) {
        if (!orders || Object.keys(orders).length === 0) {
            ordersContainer.innerHTML = `
                <div class="empty-orders">
                    <i class="fas fa-shopping-bag"></i>
                    <h3>No Orders Yet</h3>
                    <p>You haven't placed any orders yet. Explore our products and place your first order!</p>
                    <a href="products.html" class="view-order-btn"><i class="fas fa-store"></i> Browse Products</a>
                </div>
            `;
            return;
        }
        let html = "";
        Object.keys(orders).reverse().forEach(orderId => {
            const order = orders[orderId];
            const orderItems = order.products && Array.isArray(order.products) && order.products.length > 0 ? order.products : (order.items || []);
            const canCancel = order.status !== "cancelled" && isWithin24Hours(order.orderDate);
            html += `
                <div class="order-history-item improved-order-card">
                    <div class="order-card-top">
                        <div class="order-card-thumbs">
                            ${orderItems.slice(0, 3).map(item => `<span class="order-thumb">${getOrderItemImageHtml(item)}</span>`).join("")}
                            ${(orderItems.length > 3) ? `<span class="order-item-count">+${orderItems.length - 3}</span>` : ""}
                        </div>
                        <div class="order-card-info">
                            <div class="order-id-row">
                                <span class="order-id">Order Id: #${orderId}</span>
                                <span class="order-status-badge ${getStatusClass(order.status)}">${order.status || "Processing"}</span>
                            </div>
                            <div class="order-date">${formatDate(order.orderDate)}</div>
                            <div class="order-total">Total: ₹${formatCurrency(order.total)}</div>
                        </div>
                    </div>
                    <div class="order-card-actions">
                        <button class="view-order-btn" data-order-id="${orderId}"><i class="fas fa-eye"></i> Details</button>
                        ${canCancel ? `<button class="view-order-btn" data-cancel-order-id="${orderId}"><i class="fas fa-times-circle"></i> Cancel</button>` : ""}
                    </div>
                </div>
            `;
        });
        ordersContainer.innerHTML = html;
        // Attach event listeners
        ordersContainer.querySelectorAll('.view-order-btn[data-order-id]').forEach(btn => {
            btn.addEventListener('click', function() {
                const oid = this.getAttribute('data-order-id');
                showOrderDetails(orders[oid], oid);
            });
        });
        ordersContainer.querySelectorAll('.view-order-btn[data-cancel-order-id]').forEach(btn => {
            btn.addEventListener('click', function() {
                const oid = this.getAttribute('data-cancel-order-id');
                cancelOrder(oid);
            });
        });
    }

    // Firebase Auth and Orders
    if (window.firebase && firebase.auth) {
        firebase.auth().onAuthStateChanged(function(user) {
            if (!user) {
                ordersContainer.innerHTML = `<div class="empty-orders"><p>You must be logged in to view your orders. <a href='login.html?redirect=orders.html'>Login</a></p></div>`;
                return;
            }
            const ordersRef = firebase.database().ref('orders/' + user.uid);
            ordersRef.on('value', function(snapshot) {
                const orders = snapshot.val();
                renderOrders(orders);
            }, function() {
                ordersContainer.innerHTML = `<div class="empty-orders"><i class='fas fa-exclamation-triangle'></i><h3>Couldn't Load Orders</h3><p>Try again later.</p></div>`;
            });
        });
    } else {
        ordersContainer.innerHTML = `<div class="empty-orders"><i class='fas fa-exclamation-triangle'></i><h3>Couldn't Load Orders</h3><p>Firebase not loaded.</p></div>`;
    }
});
