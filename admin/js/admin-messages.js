// Admin dashboard: contact form messages — kinda all over the place
document.addEventListener('DOMContentLoaded', function() {
    // Initialize sidebar functionality
    initSidebar();
    
    // Load messages data
    loadMessagesData();
    
    // Set up search and filters
    setupSearchAndFilters();
    
    // Set up message details modal
    setupMessageDetailsModal();
});

// Sidebar stuff (just basic toggling)
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

// Global vars for message state (could be cleaner)
let messagesData = [];
let currentPage = 1;
let itemsPerPage = 10;
let activeMessageId = null;
let totalPages = 1;
let currentFilters = {
    search: '',
    status: 'all',
    dateFrom: null,
    dateTo: null,
};

// Set up search and filter (just basic stuff)
function setupSearchAndFilters() {
    // Search input
    const searchInput = document.getElementById('message-search');
    if (searchInput) {
        searchInput.addEventListener('keyup', debounce(function() {
            currentFilters.search = this.value.trim().toLowerCase();
            currentPage = 1;
            filterAndDisplayMessages();
        }, 300));
    }
    
    // Status filter
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            currentFilters.status = this.value;
            currentPage = 1;
            filterAndDisplayMessages();
        });
    }
    
    // Date filters
    const dateFrom = document.getElementById('date-from');
    const dateTo = document.getElementById('date-to');
    
    if (dateFrom) {
        dateFrom.addEventListener('change', function() {
            currentFilters.dateFrom = this.value ? new Date(this.value) : null;
            currentPage = 1;
            filterAndDisplayMessages();
        });
    }
    
    if (dateTo) {
        dateTo.addEventListener('change', function() {
            currentFilters.dateTo = this.value ? new Date(this.value) : null;
            currentPage = 1;
            filterAndDisplayMessages();
        });
    }
    
    // Reset filters button
    const resetFilters = document.getElementById('reset-filters');
    if (resetFilters) {
        resetFilters.addEventListener('click', function() {
            if (searchInput) searchInput.value = '';
            if (statusFilter) statusFilter.value = 'all';
            if (dateFrom) dateFrom.value = '';
            if (dateTo) dateTo.value = '';
            
            currentFilters = {
                search: '',
                status: 'all',
                dateFrom: null,
                dateTo: null,
            };
            
            currentPage = 1;
            filterAndDisplayMessages();
        });
    }
    
    // Table sorting
    const tableHeaders = document.querySelectorAll('#messages-table th[data-sort]');
    tableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const sortField = this.getAttribute('data-sort');
            const sortDirection = this.classList.contains('sort-asc') ? 'desc' : 'asc';
            
            // Reset all headers
            tableHeaders.forEach(h => {
                h.classList.remove('sort-asc', 'sort-desc');
            });
            
            // Set current header sort
            this.classList.add(`sort-${sortDirection}`);
            
            // Sort messages
            sortMessages(sortField, sortDirection);
        });
    });
}

// Load messages from Firebase (async, so might lag)
function loadMessagesData() {
    const database = firebase.database();
    const messagesLoader = document.getElementById('messages-loader');
    const noMessagesDiv = document.getElementById('no-messages');
    
    // Show loader
    if (messagesLoader) messagesLoader.style.display = 'flex';
    if (noMessagesDiv) noMessagesDiv.style.display = 'none';
    
    // Get all messages
    database.ref('contacts').once('value').then(snapshot => {
        messagesData = [];
        
        if (snapshot.exists()) {
            snapshot.forEach(messageSnapshot => {
                const message = messageSnapshot.val();
                messagesData.push({
                    id: messageSnapshot.key,
                    name: message.name || 'Unknown',
                    email: message.email || '',
                    subject: message.subject || 'No Subject',
                    message: message.message || '',
                    timestamp: message.timestamp || Date.now(),
                    status: message.status || 'new',
                    notes: message.notes || '',
                    phoneNumber: message.phone || '',
                    handledBy: message.handledBy || null,
                    handledAt: message.handledAt || null
                });
            });
        }
        
        // Hide loader
        if (messagesLoader) messagesLoader.style.display = 'none';
        
        // Update message count
        const totalMessages = messagesData.length;
        const newMessages = messagesData.filter(m => m.status === 'new').length;
        
        document.getElementById('messages-count').textContent = totalMessages;
        document.getElementById('new-messages-count').textContent = newMessages;
        
        // Display messages or empty state
        if (messagesData.length === 0) {
            if (noMessagesDiv) noMessagesDiv.style.display = 'flex';
            
            document.getElementById('messages-table').style.display = 'none';
            document.getElementById('messages-pagination').innerHTML = '';
        } else {
            filterAndDisplayMessages();
        }
    }).catch(error => {
        console.error('Error fetching messages:', error);
        if (messagesLoader) messagesLoader.style.display = 'none';
        AdminAuth.showToast('Error loading messages: ' + error.message, 'error');
    });
    
    // Check for URL parameters to auto-open a specific message
    const urlParams = new URLSearchParams(window.location.search);
    const viewMessageId = urlParams.get('view');
    if (viewMessageId) {
        // Give time for the messages to load
        setTimeout(() => {
            viewMessageDetails(viewMessageId);
        }, 500);
    }
}

// Filter and show messages (quick filter, not perfect)
function filterAndDisplayMessages() {
    // Apply filters
    const filteredMessages = messagesData.filter(message => {
        // Search filter
        const matchesSearch = currentFilters.search === '' || 
            message.name.toLowerCase().includes(currentFilters.search) ||
            message.email.toLowerCase().includes(currentFilters.search) ||
            message.subject.toLowerCase().includes(currentFilters.search) ||
            message.message.toLowerCase().includes(currentFilters.search);
        
        // Status filter
        const matchesStatus = currentFilters.status === 'all' || message.status === currentFilters.status;
        
        // Date range filter
        let matchesDateRange = true;
        const messageDate = new Date(message.timestamp);
        
        if (currentFilters.dateFrom) {
            currentFilters.dateFrom.setHours(0, 0, 0, 0);
            matchesDateRange = matchesDateRange && messageDate >= currentFilters.dateFrom;
        }
        
        if (currentFilters.dateTo) {
            const endDate = new Date(currentFilters.dateTo);
            endDate.setHours(23, 59, 59, 999);
            matchesDateRange = matchesDateRange && messageDate <= endDate;
        }
        
        return matchesSearch && matchesStatus && matchesDateRange;
    });
    
    // Sort messages
    // Default sort by timestamp (newest first)
    filteredMessages.sort((a, b) => b.timestamp - a.timestamp);
    
    // Display messages with pagination
    displayMessages(filteredMessages);
}

// Sort messages by field/direction (could be smarter)
function sortMessages(field, direction) {
    messagesData.sort((a, b) => {
        let comparison = 0;
        
        switch (field) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'email':
                comparison = a.email.localeCompare(b.email);
                break;
            case 'subject':
                comparison = a.subject.localeCompare(b.subject);
                break;
            case 'date':
                comparison = a.timestamp - b.timestamp;
                break;
            case 'status':
                comparison = a.status.localeCompare(b.status);
                break;
        }
        
        return direction === 'asc' ? comparison : -comparison;
    });
    
    filterAndDisplayMessages();
}

// Show messages with pagination (just basic rendering)
function displayMessages(messages) {
    const messagesTable = document.getElementById('messages-table');
    const tbody = messagesTable.querySelector('tbody');
    const paginationElement = document.getElementById('messages-pagination');
    
    // Calculate pagination
    totalPages = Math.ceil(messages.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = 1;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentMessages = messages.slice(startIndex, endIndex);
    
    // Empty state check
    if (messages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No messages found</td></tr>';
        paginationElement.innerHTML = '';
        messagesTable.style.display = 'table';
        document.getElementById('no-messages').style.display = 'none';
        return;
    }
    
    // Generate table rows
    tbody.innerHTML = '';
    currentMessages.forEach(message => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(message.name || '')}</td>
            <td>${escapeHtml(message.email || '')}</td>
            <td>${escapeHtml(message.subject || '')}</td>
            <td>${formatDate(message.timestamp)}</td>
            <td>
                <span class="status-chip status-${message.status}">${capitalizeFirstLetter(message.status)}</span>
            </td>
            <td>
                <div class="action-icons">
                    <i class="fas fa-eye" title="View Details" onclick="viewMessageDetails('${message.id}')"></i>
                    <i class="fas fa-check-circle ${message.status === 'handled' ? 'text-success' : 'text-muted'}" 
                       title="${message.status === 'handled' ? 'Handled' : 'Mark as Handled'}"
                       onclick="updateMessageStatus('${message.id}', 'handled')"></i>
                    <i class="fas fa-archive ${message.status === 'archived' ? 'text-secondary' : 'text-muted'}" 
                       title="${message.status === 'archived' ? 'Archived' : 'Archive Message'}"
                       onclick="updateMessageStatus('${message.id}', 'archived')"></i>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Show table
    messagesTable.style.display = 'table';
    document.getElementById('no-messages').style.display = 'none';
    
    // Generate pagination
    generatePagination(paginationElement, messages.length, totalPages);
}

// Make pagination controls (not fancy)
function generatePagination(paginationElement, totalItems, totalPages) {
    if (totalPages <= 1) {
        paginationElement.innerHTML = '';
        return;
    }
    
    let paginationHTML = `
        <div class="pagination-info">Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems}</div>
        <ul class="pagination">
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
    `;
    
    // Calculate page numbers to show
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Add first page and ellipsis if needed
    if (startPage > 1) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(1); return false;">1</a>
            </li>
        `;
        if (startPage > 2) {
            paginationHTML += `
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            `;
        }
    }
    
    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    // Add last page and ellipsis if needed
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            `;
        }
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(${totalPages}); return false;">${totalPages}</a>
            </li>
        `;
    }
    
    paginationHTML += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        </ul>
    `;
    
    paginationElement.innerHTML = paginationHTML;
}

// Pop open message details (modal)
function viewMessageDetails(messageId) {
    const modal = document.getElementById('message-details-modal');
    const loader = document.getElementById('message-details-loader');
    const content = document.getElementById('message-details-content');
    
    // Store active message info
    activeMessageId = messageId;
    
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
    content.style.display = 'none';
    
    // Fetch message details from Firebase
    const database = firebase.database();
    database.ref(`contacts/${messageId}`).once('value').then(snapshot => {
        const message = snapshot.val();
        
        if (!message) {
            content.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Message not found</p>
                </div>
            `;
            loader.style.display = 'none';
            content.style.display = 'block';
            return;
        }
        
        // Format date
        const messageDate = new Date(message.timestamp || Date.now());
        const formattedDate = messageDate.toLocaleDateString() + ' ' + messageDate.toLocaleTimeString();
        
        // Fill in message details
        document.getElementById('sender-name').textContent = message.name || 'Unknown';
        document.getElementById('sender-email').textContent = message.email || 'No email provided';
        document.getElementById('message-date').textContent = formattedDate;
        document.getElementById('message-subject').textContent = message.subject || 'No Subject';
        
        // Fill in message content
        const messageContent = document.getElementById('message-content');
        if (messageContent) {
            messageContent.innerHTML = message.message ? message.message.replace(/\n/g, '<br>') : 'No message content';
        }
        
        const statusElement = document.getElementById('message-status');
        statusElement.textContent = capitalizeFirstLetter(message.status || 'new');
        
        // Add metadata to message body
        const messageBody = document.getElementById('message-body');
        messageBody.innerHTML = `
            <div class="message-content-wrapper">
                <h4><i class="fas fa-envelope"></i> Message Content</h4>
                <div class="message-content-text">
                    ${message.message ? message.message.replace(/\n/g, '<br>') : 'No message content'}
                </div>
                <div class="message-metadata">
                    ${message.phone ? `
                        <div class="metadata-item">
                            <strong><i class="fas fa-phone"></i> Phone:</strong> 
                            <a href="tel:${message.phone}">${message.phone}</a>
                        </div>
                    ` : ''}
                    ${message.subject ? `
                        <div class="metadata-item">
                            <strong><i class="fas fa-tag"></i> Subject:</strong> 
                            ${message.subject}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Add additional styling for message content
        const style = document.createElement('style');
        style.textContent = `
            .message-content-wrapper {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 20px;
            }
            .message-main-content {
                white-space: pre-wrap;
                line-height: 1.5;
                margin-bottom: 15px;
            }
            .message-content-text {
                margin-top: 8px;
                padding: 10px;
                background: #fff;
                border-radius: 4px;
                border: 1px solid #e9ecef;
            }
            .message-metadata {
                border-top: 1px solid #dee2e6;
                padding-top: 15px;
                margin-top: 15px;
            }
            .metadata-item {
                margin-bottom: 12px;
                color: #666;
            }
            .metadata-item i {
                margin-right: 5px;
                color: #555;
            }
            .metadata-item a {
                color: #007bff;
                text-decoration: none;
            }
            .metadata-item a:hover {
                text-decoration: underline;
            }
            .mt-2 {
                margin-top: 8px;
            }
        `;
        document.head.appendChild(style);
        
        // Update button visibility based on status
        updateStatusButtonsVisibility(message.status || 'new');
        
        // Show content
        loader.style.display = 'none';
        content.style.display = 'block';
        
    }).catch(error => {
        console.error('Error fetching message details:', error);
        content.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading message details: ${error.message}</p>
            </div>
        `;
        loader.style.display = 'none';
        content.style.display = 'block';
    });
}

// Close message modal (with a little animation)
function closeMessageModal() {
    const modal = document.getElementById('message-details-modal');
    
    // Add closing animation
    modal.classList.remove('modal-visible');
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open'); // Re-enable body scrolling
        activeMessageId = null;
    }, 300);
}

// Set up message details modal (just UI stuff)
function setupMessageDetailsModal() {
    const modal = document.getElementById('message-details-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    
    if (modal && closeBtn) {
        closeBtn.addEventListener('click', function() {
            closeMessageModal();
        });
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeMessageModal();
            }
        });
        
        // Close on ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                closeMessageModal();
            }
        });
    }
    
    // Set up status buttons
    const markHandledBtn = document.getElementById('mark-handled-btn');
    const archiveMessageBtn = document.getElementById('archive-message-btn');
    const resetStatusBtn = document.getElementById('reset-status-btn');
    
    if (markHandledBtn) {
        markHandledBtn.addEventListener('click', function() {
            updateMessageStatus(activeMessageId, 'handled');
        });
    }
    
    if (archiveMessageBtn) {
        archiveMessageBtn.addEventListener('click', function() {
            updateMessageStatus(activeMessageId, 'archived');
        });
    }
    
    if (resetStatusBtn) {
        resetStatusBtn.addEventListener('click', function() {
            updateMessageStatus(activeMessageId, 'new');
        });
    }
    
    // Set up save notes button
    const saveNotesBtn = document.getElementById('save-notes-btn');
    if (saveNotesBtn) {
        saveNotesBtn.addEventListener('click', saveMessageNotes);
    }
}

// Pop open message details (again, for some reason)
function viewMessageDetails(messageId) {
    const modal = document.getElementById('message-details-modal');
    const loader = document.getElementById('message-details-loader');
    const content = document.getElementById('message-details-content');
    
    // Store active message info
    activeMessageId = messageId;
    
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
    content.style.display = 'none';
    
    // Fetch message details from Firebase
    const database = firebase.database();
    database.ref(`contacts/${messageId}`).once('value').then(snapshot => {
        const message = snapshot.val();
        
        if (!message) {
            content.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Message not found</p>
                </div>
            `;
            loader.style.display = 'none';
            content.style.display = 'block';
            return;
        }
        
        // Format date
        const messageDate = new Date(message.timestamp || Date.now());
        const formattedDate = messageDate.toLocaleDateString() + ' ' + messageDate.toLocaleTimeString();
        
        // Fill in message details
        document.getElementById('sender-name').textContent = message.name || 'Unknown';
        document.getElementById('sender-email').textContent = message.email || 'No email provided';
        document.getElementById('message-date').textContent = formattedDate;
        document.getElementById('message-subject').textContent = message.subject || 'No Subject';
        
        // Fill in message content
        const messageContent = document.getElementById('message-content');
        if (messageContent) {
            messageContent.innerHTML = message.message ? message.message.replace(/\n/g, '<br>') : 'No message content';
        }
        
        const statusElement = document.getElementById('message-status');
        statusElement.textContent = capitalizeFirstLetter(message.status || 'new');
        
        // Add metadata to message body
        const messageBody = document.getElementById('message-body');
        messageBody.innerHTML = `
            <div class="message-content-wrapper">
                <h4><i class="fas fa-envelope"></i> Message Content</h4>
                <div class="message-content-text">
                    ${message.message ? message.message.replace(/\n/g, '<br>') : 'No message content'}
                </div>
                <div class="message-metadata">
                    ${message.phone ? `
                        <div class="metadata-item">
                            <strong><i class="fas fa-phone"></i> Phone:</strong> 
                            <a href="tel:${message.phone}">${message.phone}</a>
                        </div>
                    ` : ''}
                    ${message.subject ? `
                        <div class="metadata-item">
                            <strong><i class="fas fa-tag"></i> Subject:</strong> 
                            ${message.subject}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Add additional styling for message content
        const style = document.createElement('style');
        style.textContent = `
            .message-content-wrapper {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 20px;
            }
            .message-main-content {
                white-space: pre-wrap;
                line-height: 1.5;
                margin-bottom: 15px;
            }
            .message-content-text {
                margin-top: 8px;
                padding: 10px;
                background: #fff;
                border-radius: 4px;
                border: 1px solid #e9ecef;
            }
            .message-metadata {
                border-top: 1px solid #dee2e6;
                padding-top: 15px;
                margin-top: 15px;
            }
            .metadata-item {
                margin-bottom: 12px;
                color: #666;
            }
            .metadata-item i {
                margin-right: 5px;
                color: #555;
            }
            .metadata-item a {
                color: #007bff;
                text-decoration: none;
            }
            .metadata-item a:hover {
                text-decoration: underline;
            }
            .mt-2 {
                margin-top: 8px;
            }
        `;
        document.head.appendChild(style);
        
        // Update button visibility based on status
        updateStatusButtonsVisibility(message.status || 'new');
        
        // Show content
        loader.style.display = 'none';
        content.style.display = 'block';
        
    }).catch(error => {
        console.error('Error fetching message details:', error);
        content.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading message details: ${error.message}</p>
            </div>
        `;
        loader.style.display = 'none';
        content.style.display = 'block';
    });
}

// Update message status (quick patch)
function updateMessageStatus(messageId, status) {
    if (!messageId) {
        AdminAuth.showToast('No message selected', 'error');
        return;
    }
    
    // Get admin info
    const adminData = AdminAuth.getAdminData();
    if (!adminData) {
        AdminAuth.showToast('You must be logged in as admin', 'error');
        return;
    }
    
    // Update status in Firebase
    const database = firebase.database();
    const messageRef = database.ref(`contacts/${messageId}`);
    
    messageRef.update({
        status: status,
        handledBy: adminData.email,
        handledAt: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        AdminAuth.showToast(`Message marked as ${status}`, 'success');
        
        // Update local data
        const messageIndex = messagesData.findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
            messagesData[messageIndex].status = status;
            messagesData[messageIndex].handledBy = adminData.email;
            messagesData[messageIndex].handledAt = Date.now();
            
            // Update UI
            filterAndDisplayMessages();
            
            // Update status buttons visibility in modal
            updateStatusButtonsVisibility(status);
            
            // Update status pill in modal
            const statusElement = document.getElementById('message-status');
            if (statusElement) {
                statusElement.textContent = capitalizeFirstLetter(status);
                statusElement.className = 'status-badge status-' + status;
            }
        }
    }).catch(error => {
        console.error('Error updating message status:', error);
        AdminAuth.showToast('Error updating status: ' + error.message, 'error');
    });
}

// Save notes for a message (just dumps to Firebase)
function saveMessageNotes() {
    if (!activeMessageId) {
        AdminAuth.showToast('No message selected', 'error');
        return;
    }
    
    const notesText = document.getElementById('message-notes').value;
    
    // Show loading state
    const saveBtn = document.getElementById('save-notes-btn');
    const originalBtnText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveBtn.disabled = true;
    
    // Update notes in Firebase
    const database = firebase.database();
    database.ref(`contacts/${activeMessageId}/notes`).set(notesText)
        .then(() => {
            AdminAuth.showToast('Notes saved successfully', 'success');
            
            // Update local data
            const messageIndex = messagesData.findIndex(m => m.id === activeMessageId);
            if (messageIndex !== -1) {
                messagesData[messageIndex].notes = notesText;
            }
        })
        .catch(error => {
            console.error('Error saving notes:', error);
            AdminAuth.showToast('Error saving notes: ' + error.message, 'error');
        })
        .finally(() => {
            // Reset button
            saveBtn.innerHTML = originalBtnText;
            saveBtn.disabled = false;
        });
}

// Update status buttons visibility based on current status
function updateStatusButtonsVisibility(status) {
    const markHandledBtn = document.getElementById('mark-handled-btn');
    const archiveMessageBtn = document.getElementById('archive-message-btn');
    const resetStatusBtn = document.getElementById('reset-status-btn');
    
    if (markHandledBtn) {
        markHandledBtn.style.display = status === 'handled' ? 'none' : 'inline-block';
    }
    
    if (archiveMessageBtn) {
        archiveMessageBtn.style.display = status === 'archived' ? 'none' : 'inline-block';
    }
    
    if (resetStatusBtn) {
        resetStatusBtn.style.display = status === 'new' ? 'none' : 'inline-block';
    }
}

// Change page function for pagination
function changePage(page) {
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    filterAndDisplayMessages();
    
    // Scroll to top of table
    const table = document.getElementById('messages-table');
    if (table) {
        table.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Helper function to format date
function formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.toString().replace(/[&<>"']/g, function(m) { return map[m]; });
}
