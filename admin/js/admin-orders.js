// Admin Orders Management JavaScript
let ordersData = [];
let currentPage = 1;
let itemsPerPage = 10;
let activeOrderId = null;
let activeUserId = null;
let currentSortField = 'date';
let currentSortDirection = 'desc';
let currentFilters = {
    search: '',
    status: 'all',
    dateFrom: null,
    dateTo: null
};

document.addEventListener('DOMContentLoaded', function() {
    // Initialize sidebar functionality
    initAdminUI();
    
    // Setup order details modal
    setupOrderDetailsModal();
    
    // Load initial orders data
    loadOrdersData();
    
    // Setup search and filters
    setupSearchAndFilters();
    
    // Setup table sorting
    setupTableSorting();
    
    // Add fullscreen modal styles
    addFullscreenModalStyles();

    // Download Invoice button logic
    const downloadBtn = document.getElementById("download-invoice-btn");
    const modal = document.getElementById('order-details-modal');
    if (downloadBtn && modal) {
        downloadBtn.addEventListener("click", function() {
            // Use fullscreen-modal-content for admin modal, fallback to modal-content
            let modalContent = modal.querySelector(".fullscreen-modal-content") || modal.querySelector(".modal-content");
            const modalBody = modal.querySelector(".modal-body, .fullscreen-modal-body");
            const orderDetailsContent = modal.querySelector("#order-details-content, .order-details-content");
            const closeBtn = modal.querySelector(".modal-close, .fullscreen-modal-close");
            const footer = modal.querySelector(".modal-footer, .modal-actions");
            if (!modalContent) {
                alert('Invoice content not found.');
                return;
            }
            // Save original styles and expand all relevant containers
            const originalStyles = [];
            [modalContent, modalBody, orderDetailsContent].forEach(el => {
                if (el) {
                    originalStyles.push({
                        el,
                        overflow: el.style.overflow,
                        maxHeight: el.style.maxHeight,
                        height: el.style.height,
                        width: el.style.width,
                        background: el.style.background,
                        color: el.style.color
                    });
                    el.style.overflow = 'visible';
                    el.style.maxHeight = 'none';
                    el.style.height = 'auto';
                    el.style.width = 'auto';
                    el.style.background = '#fff';
                    el.style.color = '#111';
                }
            });
            // Also force all text inside modal to dark for capture
            const allTextEls = modalContent.querySelectorAll('*');
            const textColorStyles = [];
            allTextEls.forEach(node => {
                textColorStyles.push({node, color: node.style.color, background: node.style.background});
                node.style.color = '#111';
                node.style.background = 'transparent';
            });
            if (closeBtn) closeBtn.style.visibility = "hidden";
            if (footer) footer.style.visibility = "hidden";
            html2canvas(modalContent, {backgroundColor: '#fff'}).then(canvas => {
                // Get order info for filename
                let orderId = window.activeOrderId || '';
                let userName = '';
                let orderDate = '';
                try {
                    // Try to extract orderId from modal title (Order #orderId)
                    const titleEl = modal.querySelector('#order-title');
                    if (titleEl) {
                        // Match both 'Order #123' and 'Order #-OUuPHecG9jfspNlQOFq'
                        const idMatch = titleEl.textContent.match(/Order\s*#-?([\w-]+)/i);
                        if (idMatch) orderId = idMatch[1];
                    }
                    const content = modal.querySelector('#order-details-content');
                    if (content) {
                        // Try to extract username from the modal content
                        const nameEl = content.querySelector('.customer-info .info-value');
                        userName = nameEl ? nameEl.textContent.trim().replace(/\s+/g, '_') : '';
                        // Try to extract date from the meta bar
                        const dateEl = content.querySelector('.order-date');
                        if (dateEl) {
                            const dateMatch = dateEl.textContent.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
                            if (dateMatch) orderDate = dateMatch[1].replace(/\//g, '-');
                        }
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
                originalStyles.forEach(({el, overflow, maxHeight, background, color}) => {
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

// Initialize common admin UI elements
function initAdminUI() {
    // Only initialize if not already handled by admin-auth.js
    if (typeof initSidebar === 'function') {
        initSidebar();
    } else {
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
}

// Add fullscreen modal styles to the document
function addFullscreenModalStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .fullscreen-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            overflow-y: auto;
        }
        
        .fullscreen-modal-content {
            background-color: #fff;
            width: 100%;
            height: 100%;
            max-width: 100%;
            max-height: 100%;
            position: relative;
            padding: 0;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
            transform: translateY(50px);
            opacity: 0;
            transition: transform 0.3s ease, opacity 0.3s ease;
        }
        
        /* Table layout improvements */
        #orders-table {
            width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
        }
        
        #orders-table th, #orders-table td {
            padding: 12px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        /* Column width adjustments */
        #orders-table th.order-id-cell,
        #orders-table td.order-id-cell {
            width: 14%;
        }
        
        #orders-table th.customer-cell,
        #orders-table td.customer-cell {
            width: 22%;
        }
        
        #orders-table th.date-cell,
        #orders-table td.date-cell {
            width: 15%;
        }
        
        #orders-table th.items-cell,
        #orders-table td.items-cell {
            width: 10%;
            text-align: center;
        }
        
        #orders-table th.total-cell,
        #orders-table td.total-cell {
            width: 12%;
            text-align: right;
        }
        
        #orders-table th.status-cell,
        #orders-table td.status-cell {
            width: 14%;
        }
        
        #orders-table th.actions-cell,
        #orders-table td.actions-cell {
            width: 13%;
            text-align: center;
        }
        
        /* Make sure table container takes full width */
        .content-wrapper, .content-container, .orders-container {
            width: 100%;
        }
        
        /* Make table responsive */
        @media (max-width: 992px) {
            #orders-table {
                table-layout: auto;
            }
            
            #orders-table thead {
                display: none;
            }
            
            #orders-table tr {
                display: block;
                border: 1px solid #e1e1e1;
                margin-bottom: 15px;
                border-radius: 5px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            #orders-table td {
                display: block;
                text-align: right;
                padding: 10px 15px;
                border-bottom: 1px solid #eee;
                position: relative;
                padding-left: 40%;
            }
            
            #orders-table td:before {
                content: attr(data-label);
                position: absolute;
                left: 15px;
                width: 35%;
                padding-right: 10px;
                white-space: nowrap;
                text-align: left;
                font-weight: 600;
            }
            
            #orders-table td.actions-cell {
                text-align: center;
                padding-left: 15px;
            }
            
            #orders-table td:last-child {
                border-bottom: none;
            }
        }
        
        .modal-visible .fullscreen-modal-content {
            transform: translateY(0);
            opacity: 1;
        }
        
        .fullscreen-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 15px 20px;
            background-color: #f8f9fa;
            border-bottom: 1px solid #e1e1e1;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        
        .fullscreen-modal-title {
            font-size: 20px;
            font-weight: 600;
            color: #333;
            margin: 0;
            display: flex;
            align-items: center;
        }
        
        .fullscreen-modal-title i {
            margin-right: 10px;
            color: #d32f2f;
        }
        
        .fullscreen-modal-close {
            background-color: transparent;
            border: none;
            font-size: 24px;
            cursor: pointer;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s;
        }
        
        .fullscreen-modal-close:hover {
            background-color: rgba(0, 0, 0, 0.05);
        }
        
        .fullscreen-modal-body {
            padding: 20px;
            overflow-y: auto;
            flex-grow: 1;
        }
        
        .fullscreen-order-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 15px;
        }
        
        .order-meta-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
        }
        
        .order-status-update-container {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .status-select-group {
            display: flex;
            align-items: center;
        }
        
        .status-select-group label {
            margin-right: 10px;
            font-weight: 500;
        }
        
        #order-status-update {
            min-width: 150px;
        }
        
        #update-status-btn {
            margin-left: 10px;
        }
        
        @media (max-width: 768px) {
            .status-select-group {
                flex-direction: column;
                align-items: flex-start;
            }
            
            #update-status-btn {
                margin-left: 0;
                margin-top: 10px;
            }
        }
    `;
    
    document.head.appendChild(style);
    
    // Modify the existing order details modal to be fullscreen
    const existingModal = document.getElementById('order-details-modal');
    if (existingModal) {
        existingModal.classList.add('fullscreen-modal');
        
        // Convert the modal content to fullscreen format
        const modalContent = existingModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.add('fullscreen-modal-content');
        }
    }
}

// Setup order details modal functionality
function setupOrderDetailsModal() {
    const modal = document.getElementById('order-details-modal');
    
    // Convert to fullscreen modal if it exists
    if (modal) {
        // Remove any old content
        modal.innerHTML = `
            <div class="fullscreen-modal-content">
                <div class="fullscreen-modal-header">
                    <h3 class="fullscreen-modal-title">
                        <i class="fas fa-shopping-bag"></i> 
                        <span id="order-title">Order Details</span>
                    </h3>
                    <button class="fullscreen-modal-close" id="close-modal-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="fullscreen-modal-body">
                    <div class="fullscreen-order-container">
                        <!-- Status Update Section -->
                        <div class="order-status-update-container">
                            <div class="status-select-group">
                                <label for="order-status-update">Update Status:</label>
                                <select id="order-status-update" class="form-control">
                                    <option value="Processing">Processing</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                            <button id="update-status-btn" class="btn btn-primary">
                                Update Status
                            </button>
                        </div>
                        
                        <!-- Loader -->
                        <div id="order-details-loader" class="content-loader">
                            <div class="spinner"></div>
                            <p>Loading order details...</p>
                        </div>
                        
                        <!-- Content -->
                        <div id="order-details-content"></div>
                        <div class="modal-actions" style="text-align:right; margin-top:16px;">
                            <button id="download-invoice-btn" class="btn btn-primary"><i class="fas fa-download"></i> Download Invoice</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Setup event listeners
        const closeBtn = document.getElementById('close-modal-btn');
        const updateStatusBtn = document.getElementById('update-status-btn');
        
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeOrderModal();
        });
        
        updateStatusBtn.addEventListener('click', function(e) {
            e.preventDefault();
            updateOrderStatus();
        });
        
        // Close modal when clicking outside the content (on the modal background)
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeOrderModal();
            }
        });
        
        // Handle escape key to close modal
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                closeOrderModal();
            }
        });
    }
}

// Close order details modal
function closeOrderModal() {
    const modal = document.getElementById('order-details-modal');
    
    // Add closing animation
    modal.classList.remove('modal-visible');
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open'); // Re-enable body scrolling
        
        // Reset active order
        activeOrderId = null;
        activeUserId = null;
    }, 300);
}

// Setup search and filter functionality
function setupSearchAndFilters() {
    const searchInput = document.getElementById('order-search');
    const statusFilter = document.getElementById('status-filter');
    const dateFrom = document.getElementById('date-from');
    const dateTo = document.getElementById('date-to');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    
    // Apply filters on button click
    applyFiltersBtn.addEventListener('click', function() {
        currentFilters = {
            search: searchInput.value.trim(),
            status: statusFilter.value,
            dateFrom: dateFrom.value ? new Date(dateFrom.value) : null,
            dateTo: dateTo.value ? new Date(dateTo.value) : null
        };
        
        // Reset to first page and load filtered data
        currentPage = 1;
        filterAndDisplayOrders();
    });
    
    // Clear all filters
    clearFiltersBtn.addEventListener('click', function() {
        searchInput.value = '';
        statusFilter.value = 'all';
        dateFrom.value = '';
        dateTo.value = '';
        
        // Reset filters and reload data
        currentFilters = {
            search: '',
            status: 'all',
            dateFrom: null,
            dateTo: null
        };
        
        currentPage = 1;
        filterAndDisplayOrders();
    });
    
    // Apply filters on Enter key in search box
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            applyFiltersBtn.click();
        }
    });
}

// Setup table sorting functionality
function setupTableSorting() {
    const tableHeaders = document.querySelectorAll('#orders-table th[data-sort]');
    
    tableHeaders.forEach(header => {
        if (header.classList.contains('actions-column')) return; // Skip action column
        
        header.addEventListener('click', function() {
            const sortField = this.dataset.sort;
            
            // Toggle sort direction if same field is clicked again
            if (sortField === currentSortField) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortField = sortField;
                // Default to descending for date, ascending for others
                currentSortDirection = sortField === 'date' ? 'desc' : 'asc';
            }
            
            // Update visual indicators
            tableHeaders.forEach(h => h.classList.remove('asc', 'desc'));
            this.classList.add(currentSortDirection);
            
            // Resort and display data
            sortAndDisplayOrders();
        });
    });
}

// Load orders data from Firebase
function loadOrdersData() {
    const database = firebase.database();
    const ordersLoader = document.getElementById('orders-loader');
    const noOrdersDiv = document.getElementById('no-orders');
    
    // Show loader
    ordersLoader.style.display = 'flex';
    noOrdersDiv.style.display = 'none';
    
    // Get all orders from all users
    // Fetch orders and users in parallel
    Promise.all([
        database.ref('orders').once('value'),
        database.ref('users').once('value')
    ]).then(([ordersSnapshot, usersSnapshot]) => {
        const ordersObj = ordersSnapshot.val();
        const usersObj = usersSnapshot.val() || {};
        ordersData = [];

        // Prepare users map
        const usersMap = {};
        Object.keys(usersObj).forEach(uid => {
            usersMap[uid] = usersObj[uid];
        });

        // Process the orders
        if (ordersObj) {
            // Iterate through users
            Object.keys(ordersObj).forEach(userId => {
                const userOrders = ordersObj[userId];
                // Iterate through user's orders
                if (userOrders) {
                    Object.keys(userOrders).forEach(orderId => {
                        const order = userOrders[orderId];
                        // Attach user details if available
                        let customer = {};
                        if (usersMap[userId]) {
                            customer = {
                                name: usersMap[userId].name || 'User',
                                email: usersMap[userId].email || '',
                                photo: usersMap[userId].photoURL || usersMap[userId].photo || ''
                            };
                        } else if (order.shippingAddress && order.shippingAddress.name) {
                            customer = {
                                name: order.shippingAddress.name,
                                email: order.shippingAddress.email || '',
                                photo: ''
                            };
                        } else {
                            customer = {
                                name: 'Guest',
                                email: order.shippingAddress?.email || '',
                                photo: ''
                            };
                        }
                        ordersData.push({
                            ...order,
                            userId: userId,
                            orderId: orderId,
                            id: orderId,
                            date: order.orderDate || order.createdAt || Date.now(),
                            products: order.products || order.items || [],
                            customer: customer
                        });
                    });
                }
            });
        }

        // Hide loader
        ordersLoader.style.display = 'none';

        // Display orders or empty state
        if (ordersData.length === 0) {
            noOrdersDiv.style.display = 'flex';
            document.getElementById('orders-count').textContent = '0';
            document.getElementById('orders-table').style.display = 'none';
            document.getElementById('orders-pagination').innerHTML = '';
        } else {
            // Update the total orders count label
            const totalOrdersLabel = document.getElementById('total-orders-count');
            if (totalOrdersLabel) {
                totalOrdersLabel.textContent = ordersData.length.toString();
            }
            // Sort and display orders
            sortAndDisplayOrders();
        }
    }).catch(error => {
        console.error('Error fetching orders:', error);
        ordersLoader.style.display = 'none';
        AdminAuth.showToast('Error loading orders: ' + error.message, 'error');
    });
}

// Filter and sort orders, then display
function filterAndDisplayOrders() {
    // First, filter the orders
    const filteredOrders = ordersData.filter(order => {
        // Apply search filter
        if (currentFilters.search) {
            const searchTerm = currentFilters.search.toLowerCase();
            
            // Search in order ID
            const orderIdMatch = order.orderId && order.orderId.toLowerCase().includes(searchTerm);
            
            // Search in customer information
            let customerMatch = false;
            if (order.customer) {
                const customerName = order.customer.name || '';
                const customerEmail = order.customer.email || '';
                customerMatch = customerName.toLowerCase().includes(searchTerm) || 
                               customerEmail.toLowerCase().includes(searchTerm);
            }
            
            if (!orderIdMatch && !customerMatch) return false;
        }
        
        // Apply status filter
        if (currentFilters.status !== 'all') {
            if (order.status !== currentFilters.status) return false;
        }
        
        // Apply date filters
        if (currentFilters.dateFrom || currentFilters.dateTo) {
            const orderDate = new Date(order.date);
            
            if (currentFilters.dateFrom && orderDate < currentFilters.dateFrom) return false;
            if (currentFilters.dateTo) {
                // Add one day to include the end date fully
                const endDate = new Date(currentFilters.dateTo);
                endDate.setDate(endDate.getDate() + 1);
                if (orderDate > endDate) return false;
            }
        }
        
        return true;
    });
    
    // Update orders count
    document.getElementById('orders-count').textContent = filteredOrders.length.toString();
    
    // Update total orders count if not already done
    const totalOrdersLabel = document.getElementById('total-orders-count');
    if (totalOrdersLabel && (!totalOrdersLabel.textContent || totalOrdersLabel.textContent === '0')) {
        totalOrdersLabel.textContent = ordersData.length.toString();
    }
    
    // Sort the filtered orders
    sortOrders(filteredOrders);
    
    // Display the filtered and sorted orders
    displayOrders(filteredOrders);
}

// Sort orders based on current sort field and direction
function sortOrders(orders) {
    orders.sort((a, b) => {
        let valueA, valueB;
        
        // Extract the correct values based on sort field
        switch (currentSortField) {
            case 'orderId':
                valueA = a.orderId || '';
                valueB = b.orderId || '';
                break;
            case 'customer':
                valueA = (a.customer && a.customer.name) || '';
                valueB = (b.customer && b.customer.name) || '';
                break;
            case 'date':
                valueA = new Date(a.date).getTime();
                valueB = new Date(b.date).getTime();
                break;
            case 'products':
                valueA = a.products ? a.products.length : 0;
                valueB = b.products ? b.products.length : 0;
                break;
            case 'total':
                valueA = parseFloat(a.total) || 0;
                valueB = parseFloat(b.total) || 0;
                break;
            case 'status':
                valueA = a.status || '';
                valueB = b.status || '';
                break;
            default:
                valueA = a.date;
                valueB = b.date;
        }
        
        // Perform comparison
        if (valueA < valueB) {
            return currentSortDirection === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
            return currentSortDirection === 'asc' ? 1 : -1;
        }
        return 0;
    });
}

// Sort orders and update display
function sortAndDisplayOrders() {
    // Sort all filtered orders
    const filteredOrders = ordersData.filter(order => {
        // Apply filters
        if (currentFilters.search) {
            const searchTerm = currentFilters.search.toLowerCase();
            
            // Search in order ID
            const orderIdMatch = order.orderId && order.orderId.toLowerCase().includes(searchTerm);
            
            // Search in customer information
            let customerMatch = false;
            if (order.customer) {
                const customerName = order.customer.name || '';
                const customerEmail = order.customer.email || '';
                customerMatch = customerName.toLowerCase().includes(searchTerm) || 
                               customerEmail.toLowerCase().includes(searchTerm);
            }
            
            if (!orderIdMatch && !customerMatch) return false;
        }
        
        if (currentFilters.status !== 'all') {
            if (order.status !== currentFilters.status) return false;
        }
        
        // Apply date filters
        if (currentFilters.dateFrom || currentFilters.dateTo) {
            const orderDate = new Date(order.date);
            
            if (currentFilters.dateFrom && orderDate < currentFilters.dateFrom) return false;
            if (currentFilters.dateTo) {
                // Add one day to include the end date fully
                const endDate = new Date(currentFilters.dateTo);
                endDate.setDate(endDate.getDate() + 1);
                if (orderDate > endDate) return false;
            }
        }
        
        return true;
    });
    
    // Update both filtered and total counts
    document.getElementById('orders-count').textContent = filteredOrders.length.toString();
    
    const totalOrdersLabel = document.getElementById('total-orders-count');
    if (totalOrdersLabel) {
        totalOrdersLabel.textContent = ordersData.length.toString();
    }
    
    // Sort the filtered orders
    sortOrders(filteredOrders);
    
    // Display the sorted orders
    displayOrders(filteredOrders);
}

// Display orders with pagination
function displayOrders(orders) {
    const tableBody = document.getElementById('orders-table-body');
    const paginationElement = document.getElementById('orders-pagination');
    const noOrdersDiv = document.getElementById('no-orders');
    
    // Check if we have orders to display
    if (orders.length === 0) {
        tableBody.innerHTML = '';
        paginationElement.innerHTML = '';
        document.getElementById('orders-table').style.display = 'none';
        noOrdersDiv.style.display = 'flex';
        return;
    }
    
    // Show table, hide empty state
    document.getElementById('orders-table').style.display = 'table';
    noOrdersDiv.style.display = 'none';
    
    // Calculate pagination
    const totalPages = Math.ceil(orders.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages;
    
    // Get current page of orders
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, orders.length);
    const currentPageOrders = orders.slice(startIndex, endIndex);
    
    // Clear table
    tableBody.innerHTML = '';
    
    // Populate table with current page of orders
    currentPageOrders.forEach(order => {
        const row = document.createElement('tr');
        // Format date
        const orderDate = new Date(order.date);
        const formattedDate = orderDate.toLocaleDateString() + ' ' + orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        // Get customer info
        const customer = order.customer || {};
        const customerName = customer.name || 'Guest';
        const customerEmail = customer.email || 'N/A';
        const customerPhoto = customer.photo || '';
        // Get products count
        const productsCount = order.products ? order.products.length : 0;
        // Format total
        const formattedTotal = formatCurrency(order.total || 0);
        // Create status badge class based on status
        let statusClass = '';
        let statusIcon = '';
        switch (order.status) {
            case 'Processing':
                statusClass = 'status-processing';
                statusIcon = '<i class="fas fa-spinner fa-pulse"></i>';
                break;
            case 'Shipped':
                statusClass = 'status-shipped';
                statusIcon = '<i class="fas fa-shipping-fast"></i>';
                break;
            case 'Delivered':
                statusClass = 'status-delivered';
                statusIcon = '<i class="fas fa-check-circle"></i>';
                break;
            case 'Cancelled':
                statusClass = 'status-cancelled';
                statusIcon = '<i class="fas fa-ban"></i>';
                break;
            default:
                statusClass = 'status-processing';
                statusIcon = '<i class="fas fa-spinner fa-pulse"></i>';
        }
        // Create row content
        row.innerHTML = `
            <td class="order-id-cell">${order.orderId}</td>
            <td class="customer-cell">
                <div class="user-info">
                    <div class="user-avatar">
                        ${customerPhoto ? `<img src="${customerPhoto}" alt="${customerName}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">` : customerName.charAt(0).toUpperCase()}
                    </div>
                    <div class="user-details">
                        <div class="user-name">${customerName}</div>
                        <div class="user-email">${customerEmail}</div>
                    </div>
                </div>
            </td>
            <td class="date-cell">${formattedDate}</td>
            <td class="items-cell">${productsCount} item${productsCount !== 1 ? 's' : ''}</td>
            <td class="total-cell">${formattedTotal}</td>
            <td class="status-cell">
                <span class="status-badge ${statusClass}">
                    ${statusIcon} ${order.status || 'Processing'}
                </span>
            </td>
            <td class="actions-cell">
                <button class="btn btn-sm btn-outline view-order-btn" data-user-id="${order.userId}" data-order-id="${order.orderId}">
                    <i class="fas fa-eye"></i> <span class="button-text">View</span>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Add event listeners to view buttons
    const viewButtons = document.querySelectorAll('.view-order-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const orderId = this.dataset.orderId;
            const userId = this.dataset.userId;
            viewOrderDetails(userId, orderId);
        });
    });
    
    // Generate pagination controls
    generatePagination(paginationElement, orders.length, totalPages);
    
    // Update data labels for responsive table
    const headerCells = document.querySelectorAll('#orders-table thead th');
    const headerTexts = Array.from(headerCells).map(th => th.textContent.trim());
    
    const cells = document.querySelectorAll('#orders-table tbody td');
    cells.forEach((cell, index) => {
        const headerIndex = index % headerTexts.length;
        cell.setAttribute('data-label', headerTexts[headerIndex]);
    });
}

// Generate pagination controls
function generatePagination(paginationElement, totalItems, totalPages) {
    // Clear pagination
    paginationElement.innerHTML = '';
    
    // Don't show pagination if only one page
    if (totalPages <= 1) return;
    
    // Create pagination container
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination-container';
    
    // Add pagination info
    const paginationInfo = document.createElement('div');
    paginationInfo.className = 'pagination-info';
    const startItem = ((currentPage - 1) * itemsPerPage) + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    paginationInfo.innerHTML = `<span class="item-count">${startItem}-${endItem}</span> of <span class="total-items">${totalItems}</span>`;
    
    // Add pagination controls
    const paginationControls = document.createElement('div');
    paginationControls.className = 'pagination-controls';
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.className = 'pagination-button prev-button';
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.disabled = currentPage === 1;
    prevButton.setAttribute('aria-label', 'Previous page');
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            sortAndDisplayOrders();
        }
    });
    
    // Page buttons
    const pageButtonsContainer = document.createElement('div');
    pageButtonsContainer.className = 'page-buttons';
    
    // Calculate which page buttons to show
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Adjust start page if we're near the end
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // First page button (if not already showing)
    if (startPage > 1) {
        const firstPageButton = document.createElement('button');
        firstPageButton.className = 'pagination-button';
        firstPageButton.textContent = '1';
        firstPageButton.addEventListener('click', () => {
            currentPage = 1;
            sortAndDisplayOrders();
        });
        pageButtonsContainer.appendChild(firstPageButton);
        
        // Add ellipsis if needed
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            pageButtonsContainer.appendChild(ellipsis);
        }
    }
    
    // Create page buttons
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = 'pagination-button' + (i === currentPage ? ' active' : '');
        pageButton.textContent = i.toString();
        pageButton.setAttribute('aria-label', `Page ${i}`);
        if (i === currentPage) {
            pageButton.setAttribute('aria-current', 'page');
        }
        
        pageButton.addEventListener('click', () => {
            currentPage = i;
            sortAndDisplayOrders();
        });
        
        pageButtonsContainer.appendChild(pageButton);
    }
    
    // Last page button (if not already showing)
    if (endPage < totalPages) {
        // Add ellipsis if needed
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            pageButtonsContainer.appendChild(ellipsis);
        }
        
        const lastPageButton = document.createElement('button');
        lastPageButton.className = 'pagination-button';
        lastPageButton.textContent = totalPages.toString();
        lastPageButton.addEventListener('click', () => {
            currentPage = totalPages;
            sortAndDisplayOrders();
        });
        pageButtonsContainer.appendChild(lastPageButton);
    }
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.className = 'pagination-button next-button';
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.disabled = currentPage === totalPages;
    nextButton.setAttribute('aria-label', 'Next page');
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            sortAndDisplayOrders();
        }
    });
    
    // Assemble pagination elements
    paginationControls.appendChild(prevButton);
    paginationControls.appendChild(pageButtonsContainer);
    paginationControls.appendChild(nextButton);
    
    paginationContainer.appendChild(paginationInfo);
    paginationContainer.appendChild(paginationControls);
    
    paginationElement.appendChild(paginationContainer);
}

// View order details
function viewOrderDetails(userId, orderId) {
    const modal = document.getElementById('order-details-modal');
    const loader = document.getElementById('order-details-loader');
    const content = document.getElementById('order-details-content');
    const statusSelect = document.getElementById('order-status-update');
    const orderTitle = document.getElementById('order-title');
    
    // Store active order info
    activeOrderId = orderId;
    activeUserId = userId;
    
    // Update the order title with the order ID
    orderTitle.textContent = `Order #${orderId}`;
    
    // Prevent body scrolling when modal is open
    document.body.classList.add('modal-open');
    
    // Reset modal scroll position
    const modalBody = modal.querySelector('.fullscreen-modal-body');
    if (modalBody) {
        modalBody.scrollTop = 0;
    }
    
    // Show modal with animation
    modal.style.display = 'block';
    setTimeout(() => {
        modal.classList.add('modal-visible');
    }, 10);
    
    // Show loader, hide content
    loader.style.display = 'flex';
    content.innerHTML = '';
    
    // Fetch order details from Firebase
    const database = firebase.database();
    database.ref(`orders/${userId}/${orderId}`).once('value').then(snapshot => {
        const order = snapshot.val();
        
        if (!order) {
            content.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Order not found.</p>
                </div>
            `;
            loader.style.display = 'none';
            return;
        }
        
        // Format order date
        const orderDate = new Date(order.orderDate || order.createdAt || Date.now());
        const formattedDate = orderDate.toLocaleDateString() + ' ' + orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Set current status in select dropdown
        statusSelect.value = order.status || 'Processing';
        
        // Prepare HTML for products
        let productsHtml = '';
        
        if (order.products && order.products.length > 0) {
            order.products.forEach(product => {
                const productTotal = (product.price || 0) * (product.quantity || 1);
                
                productsHtml += `
                    <tr>
                        <td>
                            <div class="product-info">
                                <div class="product-image">
                                    <img src="${product.image || '../assets/images/placeholder.jpg'}" alt="${product.name || 'Product'}" loading="lazy">
                                </div>
                                <div class="product-details">
                                    <div class="product-name">${product.name || 'Unnamed Product'}</div>
                                    <div class="product-variant">${product.variant || ''}</div>
                                    <div class="product-price">${formatCurrency(product.price || 0)} each</div>
                                </div>
                            </div>
                        </td>
                        <td class="text-center">${product.quantity || 1}</td>
                        <td class="text-right">${formatCurrency(productTotal)}</td>
                    </tr>
                `;
            });
        } else {
            productsHtml = `
                <tr>
                    <td colspan="3" class="no-products">
                        <div class="empty-state">
                            <i class="fas fa-box-open"></i>
                            <p>No products found for this order</p>
                        </div>
                    </td>
                </tr>
            `;
        }
        
        // Prepare HTML for status history
        let statusHistoryHtml = '';
        
        if (order.statusUpdates && order.statusUpdates.length > 0) {
            // Sort by timestamp in descending order (newest first)
            const sortedUpdates = [...order.statusUpdates].sort((a, b) => 
                (b.timestamp || 0) - (a.timestamp || 0)
            );
            
            statusHistoryHtml += '<div class="status-timeline">';
            
            sortedUpdates.forEach((update, index) => {
                const updateDate = new Date(update.timestamp);
                const formattedUpdateDate = updateDate.toLocaleDateString() + ' ' + updateDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                // Get status icon
                let statusIcon = '';
                switch (update.status) {
                    case 'Processing':
                        statusIcon = '<i class="fas fa-spinner"></i>';
                        break;
                    case 'Shipped':
                        statusIcon = '<i class="fas fa-shipping-fast"></i>';
                        break;
                    case 'Delivered':
                        statusIcon = '<i class="fas fa-check-circle"></i>';
                        break;
                    case 'Cancelled':
                        statusIcon = '<i class="fas fa-ban"></i>';
                        break;
                }
                
                // Add timeline item
                statusHistoryHtml += `
                    <div class="status-update-item ${index === 0 ? 'current-status' : ''}">
                        <div class="timeline-connector">
                            <div class="timeline-dot"></div>
                            ${index !== sortedUpdates.length - 1 ? '<div class="timeline-line"></div>' : ''}
                        </div>
                        <div class="status-update-content">
                            <div class="status-update-info">
                                <span class="status-badge status-${update.status.toLowerCase()}">${statusIcon} ${update.status}</span>
                                <span class="status-date">${formattedUpdateDate}</span>
                            </div>
                            <div class="status-description">${update.description || 'Status updated'}</div>
                        </div>
                    </div>
                `;
            });
            
            statusHistoryHtml += '</div>';
        } else {
            statusHistoryHtml = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>No status history available</p>
                </div>
            `;
        }
        
        // Get current status icon
        let statusIcon = '';
        switch (order.status) {
            case 'Processing':
                statusIcon = '<i class="fas fa-spinner"></i>';
                break;
            case 'Shipped':
                statusIcon = '<i class="fas fa-shipping-fast"></i>';
                break;
            case 'Delivered':
                statusIcon = '<i class="fas fa-check-circle"></i>';
                break;
            case 'Cancelled':
                statusIcon = '<i class="fas fa-ban"></i>';
                break;
            default:
                statusIcon = '<i class="fas fa-spinner"></i>';
        }
        
        // Render the order details
        content.innerHTML = `
            <div class="order-meta-bar">
                <div class="order-meta">
                    <div class="order-date">
                        <i class="far fa-calendar-alt"></i> Placed on: ${formattedDate}
                    </div>
                    <div class="order-status">
                        Current Status: <span class="status-badge status-${(order.status || 'processing').toLowerCase()}">
                            ${statusIcon} ${order.status || 'Processing'}
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="order-grid">
                <div class="order-sections">
                    <div class="order-section customer-info">
                        <div class="section-header">
                            <i class="fas fa-user"></i>
                            <h4>Customer Information</h4>
                        </div>
                        <div class="info-card">
                            <div class="info-rows">
                                <div class="info-row">
                                    <span class="info-label">Name:</span>
                                    <span class="info-value">${
                                        (order.customer?.firstName && order.customer?.lastName)
                                            ? order.customer.firstName + ' ' + order.customer.lastName
                                            : order.customer?.name || order.customer?.fullName || order.name || order.customer?.email?.split('@')[0] || 'N/A'
                                    }</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">Email:</span>
                                    <span class="info-value">${order.customer?.email || 'N/A'}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">Phone:</span>
                                    <span class="info-value">${order.customer?.phone || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="order-section shipping-info">
                        <div class="section-header">
                            <i class="fas fa-shipping-fast"></i>
                            <h4>Shipping Information</h4>
                        </div>
                        <div class="info-card">
                            <div class="info-rows">
                                <div class="info-row">
                                    <span class="info-label">Address:</span>
                                    <span class="info-value">${(() => {
                                        if (typeof order.address === 'object' && order.address) {
                                            const addr = order.address;
                                            // Compose address from address1, address2, city, state, pincode, country
                                            return [
                                                addr.address1,
                                                addr.address2,
                                                addr.city,
                                                addr.state,
                                                addr.pincode,
                                                addr.country
                                            ].filter(Boolean).join(', ') || 'N/A';
                                        }
                                        return order.address || 'N/A';
                                    })()}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">City:</span>
                                    <span class="info-value">${order.address?.city || 'N/A'}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">State:</span>
                                    <span class="info-value">${order.address?.state || 'N/A'}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">ZIP/Postal:</span>
                                    <span class="info-value">${
                                        order.address?.pincode ||
                                        order.address?.zip ||
                                        order.address?.postal ||
                                        order.address?.pin ||
                                        'N/A'
                                    }</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="order-section products-info">
                    <div class="section-header">
                        <i class="fas fa-shopping-cart"></i>
                        <h4>Order Items</h4>
                    </div>
                    <div class="responsive-table-container">
                        <table class="order-products-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th class="text-center">Quantity</th>
                                    <th class="text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${productsHtml}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="2" class="text-right">Subtotal:</td>
                                    <td class="text-right">${formatCurrency(order.subtotal || order.total || 0)}</td>
                                </tr>
                                <tr>
                                    <td colspan="2" class="text-right">Shipping:</td>
                                    <td class="text-right">${formatCurrency(order.shipping || 0)}</td>
                                </tr>
                                <tr>
                                    <td colspan="2" class="text-right">Tax:</td>
                                    <td class="text-right">${formatCurrency(order.tax || 0)}</td>
                                </tr>
                                <tr>
                                    <td colspan="2" class="text-right">Discount:</td>
                                    <td class="text-right">${order.discount ? '-'+formatCurrency(order.discount) : formatCurrency(0)}</td>
                                </tr>
                                <tr class="order-total-row">
                                    <td colspan="2" class="text-right">Total:</td>
                                    <td class="text-right">${formatCurrency(order.total || 0)}</td>
                                </tr>
                                <tr class="order-final-row">
                                    <td colspan="2" class="text-right"><b>Final Total (after discount):</b></td>
                                    <td class="text-right"><b>${formatCurrency((order.total || 0) - (order.discount || 0))}</b></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
                
                <div class="order-section status-info">
                    <div class="section-header">
                        <i class="fas fa-history"></i>
                        <h4>Status History</h4>
                    </div>
                    <div class="status-history">
                        ${statusHistoryHtml}
                    </div>
                </div>
            </div>
        `;
        
        // Hide loader
        loader.style.display = 'none';
        
        // Add additional styles for the fullscreen layout
        const additionalStyles = document.createElement('style');
        additionalStyles.textContent = `
            .order-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .order-sections {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }
            
            @media (max-width: 768px) {
                .order-sections {
                    grid-template-columns: 1fr;
                }
            }
            
            .order-meta-bar {
                background-color: #f8f9fa;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .order-date {
                font-size: 15px;
                margin-bottom: 8px;
            }
            
            .order-date i {
                color: #666;
                margin-right: 5px;
            }
            
            .order-section {
                background-color: #fff;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                padding: 20px;
                margin-bottom: 0;
            }
        `;
        document.head.appendChild(additionalStyles);
        
    }).catch(error => {
        console.error('Error fetching order details:', error);
        content.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load order details: ${error.message}</p>
            </div>
        `;
        loader.style.display = 'none';
    });
}

// Update order status
function updateOrderStatus() {
    if (!activeOrderId || !activeUserId) {
        AdminAuth.showToast('No active order selected', 'error');
        return;
    }
    
    const statusSelect = document.getElementById('order-status-update');
    const newStatus = statusSelect.value;
    
    // Create status update description based on the status
    let description = '';
    switch (newStatus) {
        case 'Processing':
            description = 'Order is being processed';
            break;
        case 'Shipped':
            description = 'Order has been shipped';
            break;
        case 'Delivered':
            description = 'Order has been delivered successfully';
            break;
        case 'Cancelled':
            description = 'Order has been cancelled';
            break;
    }
    
    // Show loading state
    const updateBtn = document.getElementById('update-status-btn');
    const originalBtnText = updateBtn.innerHTML;
    updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    updateBtn.disabled = true;
    
    // Update order status in Firebase
    const database = firebase.database();
    const orderRef = database.ref(`orders/${activeUserId}/${activeOrderId}`);
    
    // Get current order first to append to status history
    orderRef.once('value').then(snapshot => {
        const order = snapshot.val();
        if (!order) {
            throw new Error('Order not found');
        }
        
        // Prepare status update object
        const statusUpdate = {
            status: newStatus,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            description: description
        };
        
        // Create or update status updates array
        const statusUpdates = order.statusUpdates || [];
        statusUpdates.push(statusUpdate);
        
        // Update the order
        return orderRef.update({
            status: newStatus,
            statusUpdates: statusUpdates
        });
    }).then(() => {
        AdminAuth.showToast(`Order status updated to "${newStatus}"`, 'success');
        
        // Refresh order details view
        viewOrderDetails(activeUserId, activeOrderId);
        
        // Update order in the data array
        const orderIndex = ordersData.findIndex(o => o.orderId === activeOrderId && o.userId === activeUserId);
        if (orderIndex !== -1) {
            ordersData[orderIndex].status = newStatus;
            sortAndDisplayOrders();
        }
    }).catch(error => {
        console.error('Error updating order status:', error);
        AdminAuth.showToast('Error updating status: ' + error.message, 'error');
    }).finally(() => {
        // Restore button state
        updateBtn.innerHTML = originalBtnText;
        updateBtn.disabled = false;
    });
}

// Format currency helper function
function formatCurrency(amount) {
    return '₹' + parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Check if admin-auth.js has already exported an AdminAuth object, if not create one
if (typeof window.AdminAuth === 'undefined') {
    window.AdminAuth = {
        showToast: function(message, type = 'info') {
            // Create toast container if it doesn't exist
            let toastContainer = document.querySelector('.toast-container');
            if (!toastContainer) {
                toastContainer = document.createElement('div');
                toastContainer.className = 'toast-container';
                document.body.appendChild(toastContainer);
            }
            
            // Create toast element
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            
            // Add appropriate icon based on type
            let icon = 'info-circle';
            switch (type) {
                case 'success': icon = 'check-circle'; break;
                case 'error': icon = 'exclamation-circle'; break;
                case 'warning': icon = 'exclamation-triangle'; break;
            }
            
            toast.innerHTML = `
                <div class="toast-icon"><i class="fas fa-${icon}"></i></div>
                <div class="toast-content">${message}</div>
                <button class="toast-close"><i class="fas fa-times"></i></button>
            `;
            
            // Add toast to container
            toastContainer.appendChild(toast);
            
            // Setup close button
            const closeBtn = toast.querySelector('.toast-close');
            closeBtn.addEventListener('click', () => {
                toast.classList.add('toast-hiding');
                setTimeout(() => {
                    toast.remove();
                }, 300);
            });
            
            // Auto-remove toast after 5 seconds
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.classList.add('toast-hiding');
                    setTimeout(() => {
                        if (toast.parentNode) toast.remove();
                    }, 300);
                }
            }, 5000);
        }
    };
}

// Add CSS for modal improvements
document.addEventListener('DOMContentLoaded', function() {
    // Add CSS dynamically for modal improvements
    const style = document.createElement('style');
    style.textContent = `
        body.modal-open {
            overflow: hidden;
            padding-right: 15px; /* Prevent layout shift */
        }
        
        /* Additional table container styles */
        .orders-main {
            width: 100%;
            padding: 15px;
        }
        
        .table-responsive {
            width: 100%;
            overflow-x: auto;
        }
        
        /* Make sure content takes full width */
        .content-wrapper {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            width: 100%;
        }
        
        .content-container {
            flex: 1;
            width: 100%;
            padding: 15px;
            box-sizing: border-box;
        }
        
        .animated-modal {
            opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease;
            transform: scale(0.95);
        }
        
        .modal-visible {
            opacity: 1;
            transform: scale(1);
        }
        
        .modal-closing {
            opacity: 0;
            transform: scale(0.95);
        }
        
        .modal-content {
            border-radius: 8px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        }
        
        .modal-header {
            padding: 15px 20px;
            border-bottom: 1px solid #e1e1e1;
        }
        
        .modal-close {
            position: absolute;
            right: 15px;
            top: 15px;
            background: transparent;
            border: none;
            font-size: 22px;
            cursor: pointer;
            opacity: 0.6;
            transition: opacity 0.2s;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .modal-close:hover {
            opacity: 1;
            background-color: rgba(0,0,0,0.05);
        }
        
        .order-sections {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        @media (max-width: 768px) {
            .order-sections {
                grid-template-columns: 1fr;
            }
        }
        
        .order-section {
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            padding: 15px;
            margin-bottom: 20px;
        }
        
        .section-header {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #eee;
        }
        
        .section-header i {
            margin-right: 8px;
            color: #4a6cf7;
        }
        
        .section-header h4 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }
        
        .info-card {
            padding: 10px;
            background-color: #f9f9f9;
            border-radius: 4px;
        }
        
        .info-row {
            display: flex;
            margin-bottom: 8px;
        }
        
        .info-label {
            width: 100px;
            font-weight: 600;
            color: #555;
        }
        
        .info-value {
            flex: 1;
        }
        
        .responsive-table-container {
            overflow-x: auto;
            width: 100%;
        }
        
        .product-info {
            display: flex;
            align-items: center;
        }
        
        .product-image {
            width: 60px;
            height: 60px;
            border-radius: 4px;
            overflow: hidden;
            margin-right: 12px;
            border: 1px solid #eee;
        }
        
        .product-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .product-details {
            flex: 1;
        }
        
        .product-name {
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        .product-variant {
            font-size: 12px;
            color: #666;
            margin-bottom: 4px;
        }
        
        .product-price {
            font-size: 13px;
            color: #666;
        }
        
        .order-products-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .order-products-table th,
        .order-products-table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
        }
        
        .order-products-table th {
            text-align: left;
            background-color: #f5f5f5;
            font-weight: 600;
        }
        
        .order-products-table tfoot tr:last-child {
            font-weight: bold;
        }
        
        .order-total-row {
            font-size: 16px;
            font-weight: bold;
        }
        
        .order-total-row td {
            padding-top: 15px;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        .status-timeline {
            position: relative;
            padding: 10px 0;
        }
        
        .status-update-item {
            display: flex;
            margin-bottom: 15px;
        }
        
        .timeline-connector {
            position: relative;
            width: 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-right: 15px;
        }
        
        .timeline-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: #ccc;
            z-index: 1;
        }
        
        .current-status .timeline-dot {
            background-color: #4a6cf7;
            width: 16px;
            height: 16px;
        }
        
        .timeline-line {
            position: absolute;
            top: 15px;
            width: 2px;
            height: calc(100% + 15px);
            background-color: #eee;
            z-index: 0;
        }
        
        .status-update-content {
            flex: 1;
        }
        
        .status-update-info {
            display: flex;
            align-items: center;
            margin-bottom: 5px;
        }
        
        .status-date {
            margin-left: 10px;
            font-size: 12px;
            color: #777;
        }
        
        .status-description {
            font-size: 14px;
            color: #555;
        }
        
        .action-buttons-container {
            display: flex;
            justify-content: flex-end;
            padding: 15px 0;
            margin-top: 20px;
            border-top: 1px solid #eee;
        }
        
        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 30px 15px;
            color: #999;
            text-align: center;
        }
        
        .empty-state i {
            font-size: 24px;
            margin-bottom: 10px;
        }
        
        /* Status Badge Styles */
        .status-badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 8px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 500;
        }
        
        .status-badge i {
            margin-right: 5px;
        }
        
        .status-processing {
            background-color: #fff8e6;
            color: #d68102;
        }
        
        .status-shipped {
            background-color: #e7f5ff;
            color: #0676d9;
        }
        
        .status-delivered {
            background-color: #e7f8ef;
            color: #00a650;
        }
        
        .status-cancelled {
            background-color: #ffe7e7;
            color: #e63946;
        }
        
        @media (max-width: 576px) {
            .order-details-header {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .order-meta {
                margin-top: 10px;
            }
            
            .status-update-info {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .status-date {
                margin-left: 0;
                margin-top: 5px;
            }
        }
    `;
    
    document.head.appendChild(style);
});
