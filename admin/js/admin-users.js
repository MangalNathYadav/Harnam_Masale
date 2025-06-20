// Admin Users Management JavaScript
let usersData = [];
let currentPage = 1;
let itemsPerPage = 10;
let activeUserId = null;
let currentSortField = 'name';
let currentSortDirection = 'asc';
let currentFilters = {
    search: '',
    registration: 'all'
};

document.addEventListener('DOMContentLoaded', function() {
    // Initialize sidebar functionality
    initAdminUI();
    
    // Setup user details modal
    setupUserDetailsModal();
    
    // Setup reset user modal
    setupResetUserModal();
    
    // Load initial users data
    loadUsersData();
    
    // Setup search and filters
    setupSearchAndFilters();
    
    // Setup table sorting
    setupTableSorting();
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

// Setup user details modal functionality
function setupUserDetailsModal() {
    const modal = document.getElementById('user-details-modal');
    const closeModalBtn = document.querySelector('#user-details-modal .modal-close');
    const closeDetailsBtn = document.getElementById('close-user-details');
    const saveUserBtn = document.getElementById('save-user-btn');
    const resetUserBtn = document.getElementById('reset-user-btn');
    const viewUserOrdersBtn = document.getElementById('view-user-orders');
    
    // Close modal on X button click
    closeModalBtn.addEventListener('click', function() {
        closeUserModal();
    });
    
    // Close modal on Close button click
    closeDetailsBtn.addEventListener('click', function() {
        closeUserModal();
    });
    
    // Save user changes
    saveUserBtn.addEventListener('click', function() {
        saveUserChanges();
    });
    
    // Show reset confirmation modal
    resetUserBtn.addEventListener('click', function() {
        document.getElementById('reset-user-modal').style.display = 'block';
    });
    
    // View user orders
    viewUserOrdersBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (activeUserId) {
            // Navigate to orders page with user filter
            window.location.href = `orders.html?user=${activeUserId}`;
        }
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeUserModal();
        }
    });
}

// Setup reset user modal functionality
function setupResetUserModal() {
    const modal = document.getElementById('reset-user-modal');
    const closeModalBtn = document.querySelector('#reset-user-modal .modal-close');
    const cancelBtn = document.getElementById('cancel-reset-user-btn');
    const confirmBtn = document.getElementById('confirm-reset-user-btn');
    
    // Close modal on X button click
    closeModalBtn.addEventListener('click', function() {
        closeResetModal();
    });
    
    // Close modal on Cancel button click
    cancelBtn.addEventListener('click', function() {
        closeResetModal();
    });
    
    // Confirm user reset
    confirmBtn.addEventListener('click', function() {
        resetUser();
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeResetModal();
        }
    });
}

// Close user details modal
function closeUserModal() {
    const modal = document.getElementById('user-details-modal');
    modal.style.display = 'none';
    // Reset active user
    activeUserId = null;
}

// Close reset user confirmation modal
function closeResetModal() {
    const modal = document.getElementById('reset-user-modal');
    modal.style.display = 'none';
}

// Setup search and filter functionality
function setupSearchAndFilters() {
    const searchInput = document.getElementById('user-search');
    const registrationFilter = document.getElementById('registration-filter');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    
    // Apply filters on button click
    applyFiltersBtn.addEventListener('click', function() {
        currentFilters = {
            search: searchInput.value.trim(),
            registration: registrationFilter.value
        };
        
        // Reset to first page and load filtered data
        currentPage = 1;
        filterAndDisplayUsers();
    });
    
    // Clear all filters
    clearFiltersBtn.addEventListener('click', function() {
        searchInput.value = '';
        registrationFilter.value = 'all';
        
        // Reset filters and reload data
        currentFilters = {
            search: '',
            registration: 'all'
        };
        
        currentPage = 1;
        filterAndDisplayUsers();
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
    const tableHeaders = document.querySelectorAll('#users-table th[data-sort]');
    
    tableHeaders.forEach(header => {
        if (header.classList.contains('actions-column')) return; // Skip action column
        
        header.addEventListener('click', function() {
            const sortField = this.dataset.sort;
            
            // Toggle sort direction if same field is clicked again
            if (sortField === currentSortField) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortField = sortField;
                // Default to ascending for name, descending for registered date
                currentSortDirection = sortField === 'registered' ? 'desc' : 'asc';
            }
            
            // Update visual indicators
            tableHeaders.forEach(h => h.classList.remove('asc', 'desc'));
            this.classList.add(currentSortDirection);
            
            // Resort and display data
            sortAndDisplayUsers();
        });
    });
}

// Load users data from Firebase
function loadUsersData() {
    const database = firebase.database();
    const usersLoader = document.getElementById('users-loader');
    const noUsersDiv = document.getElementById('no-users');
    
    // Show loader
    usersLoader.style.display = 'flex';
    noUsersDiv.style.display = 'none';
    
    // Get all users
    database.ref('users').once('value').then(snapshot => {
        const usersObj = snapshot.val();
        usersData = [];
        
        // Process the users
        if (usersObj) {
            Object.keys(usersObj).forEach(userId => {
                const user = usersObj[userId];
                
                // Add user ID to each user
                usersData.push({
                    ...user,
                    id: userId,
                    registered: user.createdAt || Date.now()
                });
            });
        }
        
        // Hide loader
        usersLoader.style.display = 'none';
        
        // Display users or empty state
        if (usersData.length === 0) {
            noUsersDiv.style.display = 'flex';
            document.getElementById('users-count').textContent = '0';
            document.getElementById('users-table').style.display = 'none';
            document.getElementById('users-pagination').innerHTML = '';
        } else {
            // Sort and display users
            sortAndDisplayUsers();
        }
    }).catch(error => {
        console.error('Error fetching users:', error);
        usersLoader.style.display = 'none';
        AdminAuth.showToast('Error loading users: ' + error.message, 'error');
    });
}

// Filter and sort users, then display
function filterAndDisplayUsers() {
    // First, filter the users
    const filteredUsers = usersData.filter(user => {
        // Check if user is active
        if (user.status === 'inactive') return false;
        
        // Apply search filter
        if (currentFilters.search) {
            const searchTerm = currentFilters.search.toLowerCase();
            const nameMatch = user.name && user.name.toLowerCase().includes(searchTerm);
            const emailMatch = user.email && user.email.toLowerCase().includes(searchTerm);
            const phoneMatch = user.phone && user.phone.toLowerCase().includes(searchTerm);
            
            if (!nameMatch && !emailMatch && !phoneMatch) return false;
        }
        
        // Apply registration filter
        if (currentFilters.registration !== 'all') {
            const registrationDate = new Date(user.registered);
            const today = new Date();
            
            switch (currentFilters.registration) {
                case 'today':
                    if (!isSameDay(registrationDate, today)) return false;
                    break;
                case 'week':
                    if (!isThisWeek(registrationDate)) return false;
                    break;
                case 'month':
                    if (!isThisMonth(registrationDate)) return false;
                    break;
            }
        }
        
        return true;
    });
    
    // Update users count
    document.getElementById('users-count').textContent = filteredUsers.length.toString();
    
    // Sort the filtered users
    sortUsers(filteredUsers);
    
    // Display the filtered and sorted users
    displayUsers(filteredUsers);
}

// Sort users based on current sort field and direction
function sortUsers(users) {
    users.sort((a, b) => {
        let valueA, valueB;
        
        // Extract the correct values based on sort field
        switch (currentSortField) {
            case 'name':
                valueA = a.name || '';
                valueB = b.name || '';
                break;
            case 'email':
                valueA = a.email || '';
                valueB = b.email || '';
                break;
            case 'phone':
                valueA = a.phone || '';
                valueB = b.phone || '';
                break;
            case 'registered':
                valueA = new Date(a.registered).getTime();
                valueB = new Date(b.registered).getTime();
                break;
            case 'orders':
                valueA = (a.orders ? Object.keys(a.orders).length : 0) || (a.orderRefs ? a.orderRefs.length : 0);
                valueB = (b.orders ? Object.keys(b.orders).length : 0) || (b.orderRefs ? b.orderRefs.length : 0);
                break;
            default:
                valueA = a.name || '';
                valueB = b.name || '';
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

// Sort users and update display
function sortAndDisplayUsers() {
    // Sort all filtered users
    const filteredUsers = usersData.filter(user => {
        // Apply search filter
        if (currentFilters.search) {
            const searchTerm = currentFilters.search.toLowerCase();
            const nameMatch = user.name && user.name.toLowerCase().includes(searchTerm);
            const emailMatch = user.email && user.email.toLowerCase().includes(searchTerm);
            const phoneMatch = user.phone && user.phone.toLowerCase().includes(searchTerm);
            
            if (!nameMatch && !emailMatch && !phoneMatch) return false;
        }
        
        // Apply registration filter
        // (Implementation left as an exercise)
        
        return true;
    });
    
    // Sort the filtered users
    sortUsers(filteredUsers);
    
    // Display the sorted users
    displayUsers(filteredUsers);
}

// Display users with pagination
function displayUsers(users) {
    const tableBody = document.getElementById('users-table-body');
    const paginationElement = document.getElementById('users-pagination');
    const noUsersDiv = document.getElementById('no-users');
    
    // Check if we have users to display
    if (users.length === 0) {
        tableBody.innerHTML = '';
        paginationElement.innerHTML = '';
        document.getElementById('users-table').style.display = 'none';
        noUsersDiv.style.display = 'flex';
        return;
    }
    
    // Show table, hide empty state
    document.getElementById('users-table').style.display = 'table';
    noUsersDiv.style.display = 'none';
    
    // Calculate pagination
    const totalPages = Math.ceil(users.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages;
    
    // Get current page of users
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, users.length);
    const currentPageUsers = users.slice(startIndex, endIndex);
    
    // Clear table
    tableBody.innerHTML = '';
    
    // Populate table with current page of users
    currentPageUsers.forEach(user => {
        const row = document.createElement('tr');
        
        // Format registration date
        const registeredDate = new Date(user.registered);
        const formattedDate = registeredDate.toLocaleDateString();
        
        // Get order count
        const orderCount = (user.orders ? Object.keys(user.orders).length : 0) || 
                           (user.orderRefs ? user.orderRefs.length : 0);
        
        // Create row content
        row.innerHTML = `
            <td>
                <div class="user-info">
                    <div class="user-avatar">
                        ${user.photo ? `<img src="${user.photo}" alt="${user.name}">` : 
                          `<div class="user-initials">${getInitials(user.name || 'User')}</div>`}
                    </div>
                    <div class="user-name">${user.name || 'N/A'}</div>
                </div>
            </td>
            <td>${user.email || 'N/A'}</td>
            <td>${user.phone || 'N/A'}</td>
            <td>${formattedDate}</td>
            <td>${orderCount}</td>
            <td class="actions">
                <button class="btn btn-sm btn-outline view-user-btn" data-user-id="${user.id}">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-sm btn-outline edit-user-btn" data-user-id="${user.id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to user action buttons
    const viewButtons = document.querySelectorAll('.view-user-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.dataset.userId;
            viewUserDetails(userId);
        });
    });
    
    const editButtons = document.querySelectorAll('.edit-user-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.dataset.userId;
            viewUserDetails(userId, true);
        });
    });
    
    // Generate pagination controls
    generatePagination(paginationElement, users.length, totalPages);
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
    paginationInfo.textContent = `${startItem}-${endItem} of ${totalItems}`;
    
    // Add pagination controls
    const paginationControls = document.createElement('div');
    paginationControls.className = 'pagination-controls';
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.className = 'pagination-button';
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            sortAndDisplayUsers();
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
    
    // Create page buttons
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = 'pagination-button' + (i === currentPage ? ' active' : '');
        pageButton.textContent = i.toString();
        
        pageButton.addEventListener('click', () => {
            currentPage = i;
            sortAndDisplayUsers();
        });
        
        pageButtonsContainer.appendChild(pageButton);
    }
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.className = 'pagination-button';
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            sortAndDisplayUsers();
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

// View user details
function viewUserDetails(userId, editMode = false) {
    const modal = document.getElementById('user-details-modal');
    const loader = document.getElementById('user-details-loader');
    const content = document.getElementById('user-details-content');
    
    // Store active user info
    activeUserId = userId;
    
    // Show modal and loader
    modal.style.display = 'block';
    loader.style.display = 'flex';
    content.style.display = 'none';
    
    // Fetch user details from Firebase
    const database = firebase.database();
    database.ref(`users/${userId}`).once('value').then(snapshot => {
        const user = snapshot.val();
        
        if (!user) {
            content.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>User not found.</p>
                </div>
            `;
            loader.style.display = 'none';
            content.style.display = 'block';
            return;
        }
        
        // Format registration date
        const registeredDate = new Date(user.createdAt || Date.now());
        const formattedDate = registeredDate.toLocaleDateString();
        
        // Fetch orders data
        let ordersPromise;
        if (user.orderRefs) {
            ordersPromise = Promise.resolve({
                count: user.orderRefs.length,
                total: user.orderRefs.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0)
            });
        } else {
            // If no order references, try fetching from orders path
            ordersPromise = database.ref(`orders/${userId}`).once('value').then(ordersSnapshot => {
                const orders = ordersSnapshot.val() || {};
                const ordersArray = Object.values(orders);
                return {
                    count: ordersArray.length,
                    total: ordersArray.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0)
                };
            }).catch(() => {
                return { count: 0, total: 0 };
            });
        }
        
        // Once orders are fetched, populate the form
        ordersPromise.then(orderStats => {
            // Fill form fields with user data
            document.getElementById('user-name').value = user.name || '';
            document.getElementById('user-email').value = user.email || '';
            document.getElementById('user-phone').value = user.phone || '';
            document.getElementById('user-address').value = user.address || '';
            document.getElementById('user-registered').value = formattedDate;
            
            // Set order stats
            document.getElementById('user-total-orders').textContent = orderStats.count.toString();
            document.getElementById('user-total-spent').textContent = formatCurrency(orderStats.total);
            
            // If edit mode, make fields editable
            const formInputs = document.querySelectorAll('#user-details-form input:not([readonly]), #user-details-form textarea');
            formInputs.forEach(input => {
                input.readOnly = !editMode;
            });
            
            // Hide loader and show content
            loader.style.display = 'none';
            content.style.display = 'block';
        });
    }).catch(error => {
        console.error('Error fetching user details:', error);
        content.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load user details: ${error.message}</p>
            </div>
        `;
        loader.style.display = 'none';
        content.style.display = 'block';
    });
}

// Save user changes
function saveUserChanges() {
    if (!activeUserId) {
        AdminAuth.showToast('No active user selected', 'error');
        return;
    }
    
    // Get form data
    const name = document.getElementById('user-name').value;
    const phone = document.getElementById('user-phone').value;
    const address = document.getElementById('user-address').value;
    
    // Validate form
    if (!name.trim()) {
        AdminAuth.showToast('Name is required', 'error');
        return;
    }
    
    // Show loading state
    const saveBtn = document.getElementById('save-user-btn');
    const originalBtnText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveBtn.disabled = true;
    
    // Update user in Firebase
    const database = firebase.database();
    const userRef = database.ref(`users/${activeUserId}`);
    
    userRef.update({
        name: name,
        phone: phone,
        address: address,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        AdminAuth.showToast('User details updated successfully', 'success');
        
        // Update user in local data array
        const userIndex = usersData.findIndex(u => u.id === activeUserId);
        if (userIndex !== -1) {
            usersData[userIndex].name = name;
            usersData[userIndex].phone = phone;
            usersData[userIndex].address = address;
            
            // Refresh the display
            sortAndDisplayUsers();
        }
        
        // Close the modal
        closeUserModal();
    }).catch(error => {
        console.error('Error updating user:', error);
        AdminAuth.showToast('Error updating user: ' + error.message, 'error');
    }).finally(() => {
        // Restore button state
        saveBtn.innerHTML = originalBtnText;
        saveBtn.disabled = false;
    });
}

// Reset (soft delete) user
function resetUser() {
    if (!activeUserId) {
        AdminAuth.showToast('No active user selected', 'error');
        return;
    }
    
    // Show loading state
    const resetBtn = document.getElementById('confirm-reset-user-btn');
    const originalBtnText = resetBtn.innerHTML;
    resetBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';
    resetBtn.disabled = true;
    
    // Update user in Firebase to mark as inactive
    const database = firebase.database();
    const userRef = database.ref(`users/${activeUserId}`);
    
    userRef.update({
        status: 'inactive',
        resetAt: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        AdminAuth.showToast('User has been reset successfully', 'success');
        
        // Remove user from local data or mark as inactive
        const userIndex = usersData.findIndex(u => u.id === activeUserId);
        if (userIndex !== -1) {
            usersData[userIndex].status = 'inactive';
            
            // Refresh the display
            filterAndDisplayUsers();
        }
        
        // Close both modals
        closeResetModal();
        closeUserModal();
    }).catch(error => {
        console.error('Error resetting user:', error);
        AdminAuth.showToast('Error resetting user: ' + error.message, 'error');
    }).finally(() => {
        // Restore button state
        resetBtn.innerHTML = originalBtnText;
        resetBtn.disabled = false;
    });
}

// Helper function to get initials from name
function getInitials(name) {
    if (!name) return 'U';
    return name.split(' ')
        .map(part => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
}

// Helper function to check if two dates are the same day
function isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
}

// Helper function to check if date is in current week
function isThisWeek(date) {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // First day of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7); // Next Sunday
    
    return date >= weekStart && date < weekEnd;
}

// Helper function to check if date is in current month
function isThisMonth(date) {
    const now = new Date();
    return date.getMonth() === now.getMonth() && 
           date.getFullYear() === now.getFullYear();
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
