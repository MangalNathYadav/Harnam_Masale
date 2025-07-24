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

    // Get image HTML (prefer base64 from RTDB)
    function getOrderItemImageHtml(item) {
        if (item.imageBase64) {
            return `<img src="${item.imageBase64}" alt="${item.name || 'Product'}">`;
        }
        if (item.image && item.image.startsWith('data:')) {
            return `<img src="${item.image}" alt="${item.name || 'Product'}">`;
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

    // Helper to get order field with fallback to order.totals
    function getOrderField(order, key) {
        if (order[key] !== undefined && order[key] !== null) return order[key];
        if (order.totals && order.totals[key] !== undefined && order.totals[key] !== null) return order.totals[key];
        return 0;
    }

    // Show order details modal
    function showOrderDetails(order, orderId) {
        const orderItems = order.products && Array.isArray(order.products) && order.products.length > 0 ? order.products : (order.items || []);
        // Use order.orderDate, order.dateCreated, or order.date for date display
        const displayDate = order.orderDate || order.dateCreated || order.date || '';
        let html = `
            <div class="order-details-header">
                <div>
                    <h3>Order Id: #${orderId}</h3>
                    <div class="order-id">Order Id: #${orderId}</div>
                    <div class="order-date">Date: ${formatDate(displayDate)}</div>
                    <div class="order-status ${getStatusClass(order.status)}">${order.status || "Processing"}</div>
                </div>
                <div class="order-total">Total: ₹${formatCurrency(getOrderField(order, 'total'))}</div>
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
                <div class="summary-row"><span>Subtotal</span><span>₹${formatCurrency(getOrderField(order, 'subtotal') || getOrderField(order, 'total'))}</span></div>
                ${getOrderField(order, 'shipping') ? `<div class="summary-row"><span>Shipping</span><span>₹${formatCurrency(getOrderField(order, 'shipping'))}</span></div>` : ""}
                ${getOrderField(order, 'tax') ? `<div class="summary-row"><span>Tax</span><span>₹${formatCurrency(getOrderField(order, 'tax'))}</span></div>` : ""}
                ${getOrderField(order, 'discount') ? `<div class="summary-row"><span>Discount</span><span>-₹${formatCurrency(getOrderField(order, 'discount'))}</span></div>` : ""}
                <div class="summary-row total"><span>Total</span><span>₹${formatCurrency(getOrderField(order, 'total'))}</span></div>
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
        window._lastOrderForInvoice = order;
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
            downloadInvoiceBtn.addEventListener('click', function() {
                const order = window._lastOrderForInvoice;
                if (!order) return;
                const orderId = order.orderId || order.id || '';
                const items = Array.isArray(order.products) && order.products.length > 0 ? order.products : (Array.isArray(order.items) ? order.items : []);
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const width = 700, height = 900 + items.length * 40;
                canvas.width = width;
                canvas.height = height;

                function drawInvoiceWithUser(userData) {
                    const logo = new window.Image();
                    logo.onload = function() {
                        // Solid white background for the entire invoice
                        ctx.save();
                        ctx.globalAlpha = 1;
                        ctx.fillStyle = '#fff';
                        ctx.fillRect(0, 0, width, height);
                        ctx.restore();
                        // Header bar
                        ctx.fillStyle = '#b590b9';
                        ctx.fillRect(0, 0, width, 110);
                        ctx.drawImage(logo, 30, 15, 80, 80);
                        ctx.font = 'bold 2.2rem Poppins, Arial';
                        ctx.fillStyle = '#fff';
                        ctx.fillText('Harnam Masale', 130, 55);
                        ctx.font = '1.1rem Poppins, Arial';
                        ctx.fillStyle = '#f8e1f8';
                        ctx.fillText('Premium Indian Spices', 130, 85);
                        // Invoice title
                        ctx.font = 'bold 1.7rem Poppins, Arial';
                        ctx.fillStyle = '#e63946';
                        ctx.fillText('Order Invoice', 30, 150);
                        // User details (below header)
                        let userY = 170;
                        ctx.font = 'bold 1.1rem Poppins, Arial';
                        ctx.fillStyle = '#b590b9';
                        ctx.fillText('Customer Details', 30, userY);
                        userY += 24;
                        ctx.font = '1rem Poppins, Arial';
                        ctx.fillStyle = '#222';
                        let userName = '', userPhone = '', userEmail = '';
                        if (userData) {
                            userName = userData.name || userData.fullName || '';
                            userPhone = userData.phone || userData.mobile || '';
                            userEmail = userData.email || '';
                        } else {
                            if (order.address && typeof order.address === 'object') {
                                userName = order.address.name || order.address.fullName || '';
                                userPhone = order.address.phone || order.address.mobile || '';
                            }
                            if (order.user) {
                                userEmail = order.user.email || '';
                                if (!userName) userName = order.user.name || '';
                                if (!userPhone) userPhone = order.user.phone || '';
                            }
                        }
                        if (userName) { ctx.fillText('Name: ' + userName, 40, userY); userY += 22; }
                        if (userPhone) { ctx.fillText('Phone: ' + userPhone, 40, userY); userY += 22; }
                        if (userEmail) { ctx.fillText('Email: ' + userEmail, 40, userY); userY += 22; }
                        // Order meta
                        userY += 8;
                        ctx.font = '1rem Poppins, Arial';
                        ctx.fillStyle = '#222';
                        ctx.fillText('Order Id: #' + orderId, 30, userY);
                        ctx.fillText('Date: ' + (order.orderDate ? new Date(order.orderDate).toLocaleString() : ''), 30, userY + 25);
                        // Divider
                        ctx.strokeStyle = '#b590b9';
                        ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.moveTo(30, userY + 40); ctx.lineTo(width-30, userY + 40); ctx.stroke();
                        // Adjust y for next section
                        let itemsHeaderY = userY + 65;
                        // Items table header
                        ctx.font = 'bold 1.1rem Poppins, Arial';
                        ctx.fillStyle = '#b590b9';
                        ctx.fillText('Product', 40, itemsHeaderY);
                        ctx.fillText('Price', 320, itemsHeaderY);
                        ctx.fillText('Qty', 420, itemsHeaderY);
                        ctx.fillText('Total', 520, itemsHeaderY);
                        ctx.strokeStyle = '#eee';
                        ctx.lineWidth = 1;
                        ctx.beginPath(); ctx.moveTo(30, itemsHeaderY + 10); ctx.lineTo(width-30, itemsHeaderY + 10); ctx.stroke();
                        // Items rows
                        let y = itemsHeaderY + 40;
                        ctx.font = '1rem Poppins, Arial';
                        ctx.fillStyle = '#222';
                        items.forEach(item => {
                            ctx.fillText((item.name || 'Product'), 40, y);
                            ctx.fillText('₹' + (item.price || 0), 320, y);
                            ctx.fillText('x' + (item.quantity || 1), 420, y);
                            ctx.fillText('₹' + ((item.price || 0) * (item.quantity || 1)), 520, y);
                            y += 32;
                        });
                        // Divider
                        ctx.strokeStyle = '#b590b9';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath(); ctx.moveTo(30, y-12); ctx.lineTo(width-30, y-12); ctx.stroke();
                        // Summary
                        y += 10;
                        ctx.font = 'bold 1.1rem Poppins, Arial';
                        ctx.fillStyle = '#b590b9';
                        ctx.fillText('Order Summary', 30, y);
                        y += 30;
                        ctx.font = '1rem Poppins, Arial';
                        ctx.fillStyle = '#222';
                        ctx.fillText('Subtotal:', 40, y);
                        ctx.fillText('₹' + Number(getOrderField(order, 'subtotal') || getOrderField(order, 'total') || 0).toFixed(2), 200, y);
                        y += 28;
                        if (getOrderField(order, 'shipping')) { ctx.fillText('Shipping:', 40, y); ctx.fillText('₹' + Number(getOrderField(order, 'shipping')).toFixed(2), 200, y); y += 28; }
                        if (getOrderField(order, 'tax')) { ctx.fillText('Tax:', 40, y); ctx.fillText('₹' + Number(getOrderField(order, 'tax')).toFixed(2), 200, y); y += 28; }
                        if (getOrderField(order, 'discount')) { ctx.fillText('Discount:', 40, y); ctx.fillStyle = '#e63946'; ctx.fillText('-₹' + Number(getOrderField(order, 'discount')).toFixed(2), 200, y); ctx.fillStyle = '#222'; y += 28; }
                        ctx.font = 'bold 1.1rem Poppins, Arial';
                        ctx.fillStyle = '#e63946';
                        ctx.fillText('Total:', 40, y);
                        ctx.fillText('₹' + Number(getOrderField(order, 'total') || 0).toFixed(2), 200, y);
                        y += 28;
                        if (getOrderField(order, 'discount')) {
                            let base = Number(getOrderField(order, 'subtotal') || getOrderField(order, 'total') || 0);
                            if (getOrderField(order, 'shipping')) base += Number(getOrderField(order, 'shipping'));
                            if (getOrderField(order, 'tax')) base += Number(getOrderField(order, 'tax'));
                            let discounted = base - Number(getOrderField(order, 'discount'));
                            ctx.font = 'bold 1.1rem Poppins, Arial';
                            ctx.fillStyle = '#e63946';
                            ctx.fillText('Price after Discount:', 40, y);
                            ctx.fillText('₹' + discounted.toFixed(2), 260, y);
                            y += 28;
                        }
                        // Divider
                        y += 10;
                        ctx.strokeStyle = '#b590b9';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath(); ctx.moveTo(30, y-5); ctx.lineTo(width-30, y-5); ctx.stroke();
                        // Address
                        y += 20;
                        ctx.font = 'bold 1.1rem Poppins, Arial';
                        ctx.fillStyle = '#b590b9';
                        ctx.fillText('Shipping Address', 30, y);
                        y += 28;
                        ctx.font = '1rem Poppins, Arial';
                        ctx.fillStyle = '#222';
                        let address = '';
                        if (order.address) {
                            if (typeof order.address === 'string') address = order.address;
                            else {
                                address = (order.address.name || order.address.fullName || '') + '\n';
                                address += (order.address.line1 || order.address.address1 || '') + ' ' + (order.address.line2 || order.address.address2 || '') + '\n';
                                address += (order.address.city || '') + ', ' + (order.address.state || '') + ' ' + (order.address.zip || order.address.pincode || order.address.pin || '') + '\n';
                                address += (order.address.country || '');
                            }
                        }
                        address.split('\n').forEach(line => { ctx.fillText(line, 40, y); y += 24; });
                        // Footer
                        y += 30;
                        ctx.strokeStyle = '#eee';
                        ctx.lineWidth = 1;
                        ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(width-30, y); ctx.stroke();
                        ctx.font = '1rem Poppins, Arial';
                        ctx.fillStyle = '#888';
                        ctx.fillText('Thank you for shopping with Harnam Masale!', 40, y+30);
                        // Company address and phone
                        ctx.font = '1rem Poppins, Arial';
                        ctx.fillStyle = '#b590b9';
                        ctx.fillText('Harnam Foods, 123 Spice Street, New Delhi, India', 40, y+55);
                        ctx.fillText('Phone: +91-9876543210', 40, y+80);
                        ctx.fillText('www.harnamfoods.com', 40, y+105);
                        // Download
                        const now = new Date();
                        const dateStr = now.toISOString().slice(0,10);
                        const filename = 'Invoice_' + dateStr + '_' + Math.floor(Math.random()*10000) + '.png';
                        const link = document.createElement('a');
                        link.download = filename;
                        link.href = canvas.toDataURL();
                        link.click();
                    };
                    logo.src = '../assets/images/vector logo harnam.png';
                }
                // Get userId from order (assume order has userId or get from firebase.auth)
                let userId = order.userId;
                if (!userId && window.firebase && firebase.auth && firebase.auth().currentUser) {
                    userId = firebase.auth().currentUser.uid;
                }
                if (window.firebase && firebase.database && userId) {
                    firebase.database().ref('users/' + userId).once('value').then(function(snapshot) {
                        const userData = snapshot.val();
                        drawInvoiceWithUser(userData);
                    }).catch(function() {
                        drawInvoiceWithUser(null);
                    });
                } else {
                    drawInvoiceWithUser(null);
                }
            });
        }
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
                            <div class="order-date">${formatDate(order.orderDate || order.dateCreated || order.date)}</div>
                            <div class="order-total">Total: ₹${formatCurrency(getOrderField(order, 'total'))}</div>
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
            // Always fetch orders from RTDB, do not use localStorage
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
