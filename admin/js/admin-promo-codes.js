// Admin Promo Codes JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check admin authentication
    checkAdminAuth();
    
    // Show loader while initializing
    showLoader();
    
    // References
    const promoForm = document.getElementById('promo-form');
    const promoCodeInput = document.getElementById('promo-code');
    const promoDescriptionInput = document.getElementById('promo-description');
    const discountTypeSelect = document.getElementById('discount-type');
    const discountValueInput = document.getElementById('discount-value');
    const minOrderAmountInput = document.getElementById('min-order-amount');
    const usageLimitInput = document.getElementById('usage-limit');
    const startDateInput = document.getElementById('start-date');
    const expiryDateInput = document.getElementById('expiry-date');
    const savePromoBtn = document.getElementById('save-promo-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const formTitle = document.getElementById('form-title');
    const promoTableBody = document.getElementById('promo-table-body');
    const promoSearch = document.getElementById('promo-search');
    const confirmModal = document.getElementById('confirm-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const modalCloseButtons = document.querySelectorAll('.modal-close');
    
    // Set today as the default start date
    const today = new Date().toISOString().split('T')[0];
    startDateInput.value = today;
    
    // Database reference
    const promosRef = firebase.database().ref('promos');
    
    // Current editing promo ID (if any)
    let editingPromoId = null;
    let promoToDeleteId = null;
    
    // Load promo codes on page load
    loadPromoCodes();
    
    // Handle form submission
    promoForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate form
        if (!validatePromoForm()) {
            return;
        }
        
        // Get form data
        const promoData = {
            code: promoCodeInput.value.trim().toUpperCase(),
            description: promoDescriptionInput.value.trim(),
            discountType: discountTypeSelect.value,
            discountValue: Number(discountValueInput.value),
            minOrderAmount: minOrderAmountInput.value ? Number(minOrderAmountInput.value) : 0,
            usageLimit: usageLimitInput.value ? Number(usageLimitInput.value) : null,
            usageCount: 0,
            startDate: startDateInput.value ? new Date(startDateInput.value).getTime() : null,
            expiryDate: expiryDateInput.value ? new Date(expiryDateInput.value).getTime() : null,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        // Save to Firebase
        if (editingPromoId) {
            // Update existing promo
            savePromo(editingPromoId, promoData);
        } else {
            // Check if code already exists before creating
            checkPromoCodeExists(promoData.code)
                .then(exists => {
                    if (exists) {
                        showToast('Promo code already exists. Please use a different code.', 'error');
                    } else {
                        // Create new promo
                        savePromo(null, promoData);
                    }
                });
        }
    });
    
    // Save or update promo code
    function savePromo(promoId, promoData) {
        let savePromise;
        
        if (promoId) {
            // Update existing promo
            savePromise = promosRef.child(promoId).update(promoData);
        } else {
            // Create new promo
            savePromise = promosRef.push(promoData);
        }
        
        savePromise
            .then(() => {
                showToast(promoId ? 'Promo code updated successfully!' : 'Promo code created successfully!', 'success');
                resetForm();
                loadPromoCodes();
            })
            .catch(error => {
                console.error('Error saving promo code:', error);
                showToast('Failed to save promo code. Please try again.', 'error');
            });
    }
    
    // Check if promo code already exists
    function checkPromoCodeExists(code) {
        return promosRef.orderByChild('code').equalTo(code).once('value')
            .then(snapshot => {
                return snapshot.exists();
            })
            .catch(error => {
                console.error('Error checking promo code:', error);
                return false;
            });
    }
    
    // Validate form data
    function validatePromoForm() {
        // Reset previous error states
        const errorElements = document.querySelectorAll('.input-error');
        errorElements.forEach(el => el.remove());
        
        let isValid = true;
        
        // Validate required fields
        if (!promoCodeInput.value.trim()) {
            showInputError(promoCodeInput, 'Promo code is required');
            isValid = false;
        }
        
        if (!discountValueInput.value || Number(discountValueInput.value) <= 0) {
            showInputError(discountValueInput, 'Discount value must be greater than 0');
            isValid = false;
        }
        
        // Validate percentage discount (max 100%)
        if (discountTypeSelect.value === 'percentage' && Number(discountValueInput.value) > 100) {
            showInputError(discountValueInput, 'Percentage discount cannot exceed 100%');
            isValid = false;
        }
        
        // Validate dates
        if (startDateInput.value && expiryDateInput.value) {
            const startDate = new Date(startDateInput.value);
            const expiryDate = new Date(expiryDateInput.value);
            
            if (expiryDate < startDate) {
                showInputError(expiryDateInput, 'Expiry date cannot be earlier than start date');
                isValid = false;
            }
        }
        
        return isValid;
    }
    
    // Show input error
    function showInputError(inputElement, message) {
        const errorElement = document.createElement('span');
        errorElement.className = 'input-error';
        errorElement.textContent = message;
        inputElement.parentNode.appendChild(errorElement);
        inputElement.classList.add('error');
    }
    
    // Reset form
    function resetForm() {
        promoForm.reset();
        startDateInput.value = today;
        editingPromoId = null;
        savePromoBtn.textContent = 'Create Promo Code';
        formTitle.textContent = 'Create New Promo Code';
        cancelEditBtn.style.display = 'none';
        
        // Remove any error states
        const errorElements = document.querySelectorAll('.input-error');
        errorElements.forEach(el => el.remove());
        
        const errorInputs = document.querySelectorAll('.error');
        errorInputs.forEach(input => input.classList.remove('error'));
    }
    
    // Load promo codes from Firebase
    function loadPromoCodes() {
        promosRef.once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    const promos = [];
                    snapshot.forEach(childSnapshot => {
                        const promo = childSnapshot.val();
                        promo.id = childSnapshot.key;
                        promos.push(promo);
                    });
                    
                    // Sort promos by created date (newest first)
                    promos.sort((a, b) => b.createdAt - a.createdAt);
                    
                    displayPromoCodes(promos);
                } else {
                    displayEmptyState();
                }
            })
            .catch(error => {
                console.error('Error loading promo codes:', error);
                showToast('Failed to load promo codes. Please refresh the page.', 'error');
            });
    }
    
    // Display promo codes in the table
    function displayPromoCodes(promos) {
        // Hide loader now that we have data
        hideLoader();
        
        if (promos.length === 0) {
            displayEmptyState();
            return;
        }
        
        let tableContent = '';
        
        promos.forEach(promo => {
            const now = Date.now();
            const isExpired = promo.expiryDate && now > promo.expiryDate;
            const isNotStarted = promo.startDate && now < promo.startDate;
            const isLimitReached = promo.usageLimit && promo.usageCount >= promo.usageLimit;
            
            const status = isExpired ? '<span class="badge badge-danger">Expired</span>' : 
                          isNotStarted ? '<span class="badge badge-warning">Not Started</span>' :
                          isLimitReached ? '<span class="badge badge-warning">Limit Reached</span>' :
                          '<span class="badge badge-success">Active</span>';
            
            const formattedValue = promo.discountType === 'percentage' ? 
                                   `${promo.discountValue}%` : 
                                   `₹${promo.discountValue}`;
            
            const expiryDate = promo.expiryDate ? 
                              new Date(promo.expiryDate).toLocaleDateString() : 
                              'No Expiry';
            
            const usage = promo.usageLimit ? 
                         `${promo.usageCount || 0}/${promo.usageLimit}` : 
                         `${promo.usageCount || 0}/∞`;
            
            tableContent += `
                <tr>
                    <td><strong>${promo.code}</strong></td>
                    <td>${promo.description || '-'}</td>
                    <td>${promo.discountType === 'percentage' ? 'Percentage' : 'Fixed'}</td>
                    <td>${formattedValue}</td>
                    <td>${promo.minOrderAmount ? `₹${promo.minOrderAmount}` : '-'}</td>
                    <td>${usage}</td>
                    <td>${expiryDate}</td>
                    <td>${status}</td>
                    <td>
                        <div class="action-icons">
                            <button class="edit-btn" data-id="${promo.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-btn" data-id="${promo.id}">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        promoTableBody.innerHTML = tableContent;
        
        // Add event listeners to edit and delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                editPromo(this.getAttribute('data-id'));
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                showDeleteConfirmation(this.getAttribute('data-id'));
            });
        });
    }
    
    // Display empty state
    function displayEmptyState() {
        promoTableBody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <i class="fas fa-ticket-alt"></i>
                    <p>No promo codes found. Create your first promo code above.</p>
                </td>
            </tr>
        `;
    }
    
    // Edit promo
    function editPromo(promoId) {
        promosRef.child(promoId).once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    const promo = snapshot.val();
                    
                    // Fill form with promo data
                    promoCodeInput.value = promo.code;
                    promoDescriptionInput.value = promo.description || '';
                    discountTypeSelect.value = promo.discountType;
                    discountValueInput.value = promo.discountValue;
                    minOrderAmountInput.value = promo.minOrderAmount || '';
                    usageLimitInput.value = promo.usageLimit || '';
                    
                    // Format dates for input
                    if (promo.startDate) {
                        const startDate = new Date(promo.startDate);
                        startDateInput.value = startDate.toISOString().split('T')[0];
                    } else {
                        startDateInput.value = '';
                    }
                    
                    if (promo.expiryDate) {
                        const expiryDate = new Date(promo.expiryDate);
                        expiryDateInput.value = expiryDate.toISOString().split('T')[0];
                    } else {
                        expiryDateInput.value = '';
                    }
                    
                    // Update form state
                    editingPromoId = promoId;
                    savePromoBtn.textContent = 'Update Promo Code';
                    formTitle.textContent = 'Edit Promo Code';
                    cancelEditBtn.style.display = 'inline-block';
                    
                    // Scroll to form
                    promoForm.scrollIntoView({ behavior: 'smooth' });
                }
            })
            .catch(error => {
                console.error('Error loading promo code for edit:', error);
                showToast('Failed to load promo code details.', 'error');
            });
    }
    
    // Show delete confirmation modal
    function showDeleteConfirmation(promoId) {
        promoToDeleteId = promoId;
        confirmModal.classList.add('show');
    }
    
    // Delete promo
    function deletePromo(promoId) {
        promosRef.child(promoId).remove()
            .then(() => {
                showToast('Promo code deleted successfully!', 'success');
                loadPromoCodes();
            })
            .catch(error => {
                console.error('Error deleting promo code:', error);
                showToast('Failed to delete promo code.', 'error');
            });
    }
    
    // Event listener for cancel edit button
    cancelEditBtn.addEventListener('click', function() {
        resetForm();
    });
    
    // Event listener for confirm delete button
    confirmDeleteBtn.addEventListener('click', function() {
        if (promoToDeleteId) {
            deletePromo(promoToDeleteId);
            confirmModal.classList.remove('show');
            promoToDeleteId = null;
        }
    });
    
    // Event listeners for modal close buttons
    modalCloseButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            confirmModal.classList.remove('show');
        });
    });
    
    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === confirmModal) {
            confirmModal.classList.remove('show');
        }
    });
    
    // Search functionality
    promoSearch.addEventListener('input', function() {
        const searchTerm = this.value.trim().toLowerCase();
        
        if (searchTerm === '') {
            loadPromoCodes();
            return;
        }
        
        promosRef.once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    const promos = [];
                    snapshot.forEach(childSnapshot => {
                        const promo = childSnapshot.val();
                        promo.id = childSnapshot.key;
                        
                        // Search in code and description
                        if (promo.code.toLowerCase().includes(searchTerm) || 
                            (promo.description && promo.description.toLowerCase().includes(searchTerm))) {
                            promos.push(promo);
                        }
                    });
                    
                    displayPromoCodes(promos);
                }
            });
    });
    
    // Helper: Show toast message
    function showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // Create a new toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Add icon based on type
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'exclamation-triangle';
        
        // Create toast content
        toast.innerHTML = `
            <div class="toast-icon"><i class="fas fa-${icon}"></i></div>
            <div class="toast-message">${message}</div>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        `;
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Show toast after a brief delay
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
});
