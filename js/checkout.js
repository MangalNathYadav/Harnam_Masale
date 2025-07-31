// =============== Checkout functionality for Harnam Masale ===============
document.addEventListener('DOMContentLoaded', function() {
    console.log('Checkout page initialized');
    
    // Get current user
    const currentUser = getCheckoutUser();
    if (!currentUser) {
        // Redirect to login page with return URL
        console.log('No user found, redirecting to login');
        window.location.href = '/login.html?redirect=/checkout.html';
        return;
    }

    console.log('User authenticated:', currentUser.id);
    
    // Setup multi-step checkout
    initMultiStepCheckout();
    
    // Show loading state
    showLoadingState();

    // First try to load cart from Firebase
    loadCartData(currentUser)
        .then(cart => {
            console.log('Cart loaded successfully:', cart);
            // Hide loading state
            hideLoadingState();
            
            if (!cart || cart.length === 0) {
                console.error('No items in cart');
                showEmptyCartMessage();
                return;
            }
            
            // Store cart globally for consistent access
            window.currentCart = cart;
            // Display order summary
            displayOrderSummary(cart);
            
            // Fill checkout form with user data
            fillCheckoutForm(currentUser);
            
            // Set up promo code functionality
            setupPromoCode();
            
            // Set up form submission
            setupCheckoutForm();
            
            // Setup address autocomplete
            setupAddressAutocomplete();
        })
        .catch(error => {
            console.error('Error loading cart data:', error);
            hideLoadingState();
            showErrorMessage('Failed to load your cart. Please try again.');
        });
});

// Initialize multi-step checkout
function initMultiStepCheckout() {
    // Initial step is customer info
    const steps = ['customer-info', 'shipping-address', 'payment-method', 'review-confirm'];
    let currentStepIndex = 0;
    
    // Update step indicators and progress bar
    function updateStepIndicators(stepName) {
        // Update step indicators
        document.querySelectorAll('.checkout-step-indicator').forEach((indicator) => {
            const step = indicator.getAttribute('data-step');
            indicator.classList.remove('active', 'completed');
            
            const stepIndex = steps.indexOf(step);
            const currentIndex = steps.indexOf(stepName);
            
            if (stepIndex < currentIndex) {
                indicator.classList.add('completed');
            } else if (stepIndex === currentIndex) {
                indicator.classList.add('active');
            }
        });
        
        // Update progress bar
        const progressItems = document.querySelectorAll('.checkout-progress li');
        // Reset all steps
        progressItems.forEach((item, index) => {
            if (index > 0) { // Skip first item (Cart)
                item.classList.remove('active');
            }
        });
        
        // Set active steps
        if (stepName === 'payment-method') {
            // Activate Payment step in progress bar
            if (progressItems[2]) progressItems[2].classList.add('active');
        } else if (stepName === 'review-confirm') {
            // Activate both Payment and Confirmation steps
            if (progressItems[2]) progressItems[2].classList.add('active');
            if (progressItems[3]) progressItems[3].classList.add('active');
        }
    }
    
    // Show a specific step
    function showStep(stepName) {
        // Hide all steps
        document.querySelectorAll('.checkout-step').forEach(step => {
            step.classList.remove('active-step');
        });
        
        // Show the target step
        const targetStep = document.getElementById(`${stepName}-section`);
        if (targetStep) {
            targetStep.classList.add('active-step');
            targetStep.classList.add('animate-step');
            setTimeout(() => targetStep.classList.remove('animate-step'), 400);
        }
        
        // Update indicators
        updateStepIndicators(stepName);
        
        // Update current step index
        currentStepIndex = steps.indexOf(stepName);
        
        // Scroll to top of form
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            checkoutForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    // Setup next step button handlers
    document.querySelectorAll('.next-step').forEach(button => {
        button.addEventListener('click', function() {
            const currentStep = steps[currentStepIndex];
            const nextStep = this.getAttribute('data-next');
            
            // Validate current section before proceeding
            if (validateSection(currentStep)) {
                if (nextStep === 'review-confirm') {
                    // Populate the review section with form data
                    populateReviewSection();
                }
                showStep(nextStep);
            }
        });
    });
    
    // Setup prev step button handlers
    document.querySelectorAll('.prev-step').forEach(button => {
        button.addEventListener('click', function() {
            const prevStep = this.getAttribute('data-prev');
            showStep(prevStep);
        });
    });
    
    // Validate a specific section of the form
    function validateSection(sectionName) {
        const section = document.getElementById(`${sectionName}-section`);
        if (!section) return true;
        
        const inputs = section.querySelectorAll('input[required], select[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!validateInput(input)) {
                isValid = false;
            }
        });
        
        // Special validation for terms checkbox in payment section
        if (sectionName === 'payment-method') {
            const termsCheckbox = document.getElementById('terms');
            if (termsCheckbox && !termsCheckbox.checked) {
                const error = document.createElement('div');
                error.className = 'input-error';
                error.textContent = 'You must agree to the terms and conditions';
                
                // Remove any existing error message
                const existingError = termsCheckbox.parentElement.querySelector('.input-error');
                if (existingError) existingError.remove();
                
                termsCheckbox.parentElement.appendChild(error);
                isValid = false;
            }
        }
        
        // If not valid, focus the first invalid input
        if (!isValid) {
            const firstInvalidInput = section.querySelector('.invalid');
            if (firstInvalidInput) {
                firstInvalidInput.focus();
                firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        
        return isValid;
    }
    
    // Populate the review section with form data
    function populateReviewSection() {
        // Name
        const firstName = document.getElementById('first-name').value;
        const lastName = document.getElementById('last-name').value;
        document.getElementById('summary-name').textContent = `${firstName} ${lastName}`;
        
        // Email
        document.getElementById('summary-email').textContent = document.getElementById('email').value;
        
        // Phone
        document.getElementById('summary-phone').textContent = document.getElementById('phone').value;
        
        // Address
        const address1 = document.getElementById('address1').value;
        const address2 = document.getElementById('address2').value;
        const city = document.getElementById('city').value;
        const state = document.getElementById('state').value;
        const pincode = document.getElementById('pincode').value;
        const country = document.getElementById('country').value;
        
        document.getElementById('summary-address').innerHTML = `
            ${address1}<br>
            ${address2 ? address2 + '<br>' : ''}
            ${city}, ${state} ${pincode}<br>
            ${country}
        `;
        
        // Payment method
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        let paymentText = '';
        
        switch (paymentMethod) {
            case 'cod':
                paymentText = 'Cash on Delivery';
                break;
            case 'card':
                paymentText = 'Credit/Debit Card';
                break;
            case 'upi':
                paymentText = 'UPI Payment';
                break;
            default:
                paymentText = 'Cash on Delivery';
        }
        
        document.getElementById('summary-payment').textContent = paymentText;
        
        // Review order items - clone from order summary
        const orderItems = document.getElementById('order-items');
        const reviewItems = document.getElementById('review-order-items');
        
        if (orderItems && reviewItems) {
            reviewItems.innerHTML = '';
            // Clone order items but exclude certain elements
            Array.from(orderItems.children).forEach(child => {
                // Skip loading elements, messages, etc.
                if (!child.classList.contains('loader-spinner') && 
                    !child.classList.contains('empty-cart-message') &&
                    !child.classList.contains('error-message')) {
                    reviewItems.appendChild(child.cloneNode(true));
                }
            });
        }
    }
    
    // Initial step display
    showStep(steps[currentStepIndex]);
}

// Get current user specifically for checkout - renamed to avoid conflicts
function getCheckoutUser() {
    // Try FirebaseUtil first for up-to-date user
    if (typeof window.FirebaseUtil !== 'undefined' && window.FirebaseUtil.auth) {
        const user = window.FirebaseUtil.auth.getCurrentUser();
        // If user is a Firebase Auth user object, convert to app user object
        if (user && user.uid) {
            // Try to get richer info from localStorage
            let localUser = JSON.parse(localStorage.getItem('harnamCurrentUser'));
            if (localUser && localUser.id === user.uid) {
                return localUser;
            }
            // Fallback to minimal info
            return {
                id: user.uid,
                name: user.displayName || 'User',
                email: user.email
            };
        }
        // If already in app format (id), return as is
        if (user && user.id) return user;
    }
    // Fallback to localStorage
    return JSON.parse(localStorage.getItem('harnamCurrentUser'));
}

// Add this function to fix ReferenceError in getCurrentCart
function getCurrentUser() {
    return getCheckoutUser();
}

// Function to load cart data from Firebase or localStorage
async function loadCartData(user) {
    console.log('Loading cart data for user:', user.id);
    // Try Firebase first if available
    if (typeof window.FirebaseUtil !== 'undefined') {
        try {
            console.log('Attempting to fetch cart from Firebase');
            const result = await window.FirebaseUtil.cart.getUserCart(user.id);
            
            console.log('Firebase cart fetch result:', result);
            
            if (result.success && Array.isArray(result.cart)) {
                console.log('Firebase cart loaded:', result.cart);
                if (result.cart.length > 0) {
                    return result.cart;
                }
            }
        } catch (error) {
            console.error('Firebase cart fetch error:', error);
            // Continue to localStorage fallback
        }
    }
    
    // Fall back to localStorage
    console.log('Falling back to localStorage cart');
    const localCart = JSON.parse(localStorage.getItem('harnamCart')) || [];
    console.log('Local cart loaded:', localCart);
    return localCart;
}

// Show loading state
function showLoadingState() {
    const orderItemsContainer = document.getElementById('order-items');
    if (!orderItemsContainer) {
        console.error('Order items container not found');
        return;
    }
    
    orderItemsContainer.innerHTML = `
        <div class="loader-spinner">
            <div class="spinner"></div>
        </div>
        <p class="loading-text">Loading your cart...</p>
    `;
}

// Hide loading state
function hideLoadingState() {
    const orderItemsContainer = document.getElementById('order-items');
    if (!orderItemsContainer) return;
    
    const loadingSpinner = orderItemsContainer.querySelector('.loader-spinner');
    const loadingText = orderItemsContainer.querySelector('.loading-text');
    
    if (loadingSpinner) loadingSpinner.remove();
    if (loadingText) loadingText.remove();
}

// Show empty cart message
function showEmptyCartMessage() {
    const orderItemsContainer = document.getElementById('order-items');
    if (!orderItemsContainer) return;
    
    orderItemsContainer.innerHTML = `
        <div class="empty-cart-message">
            <i class="fas fa-shopping-cart"></i>
            <p>Your cart is empty</p>
            <a href="pages/products.html" class="btn btn-primary">Browse Products</a>
        </div>
    `;
    
    // Reset totals
    document.getElementById('order-subtotal').textContent = '₹0.00';
    document.getElementById('order-shipping').textContent = '₹0.00';
    document.getElementById('order-tax').textContent = '₹0.00';
    document.getElementById('order-total').textContent = '₹0.00';
    
    // Disable checkout button
    const checkoutBtn = document.getElementById('place-order-btn');
    if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.classList.add('disabled');
    }
}

// Show error message
function showErrorMessage(message) {
    const orderItemsContainer = document.getElementById('order-items');
    if (!orderItemsContainer) return;
    
    orderItemsContainer.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
            <button class="btn btn-outline" onclick="location.reload()">Try Again</button>
        </div>
    `;
}

// Fill checkout form with user data
function fillCheckoutForm(user) {
    if (!user) return;

    console.log('Filling checkout form with user data');
    
    // Split name into first and last name (best guess)
    const nameParts = (user.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Set form values
    const firstNameInput = document.getElementById('first-name');
    const lastNameInput = document.getElementById('last-name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');

    if (firstNameInput) firstNameInput.value = firstName;
    if (lastNameInput) lastNameInput.value = lastName;
    if (emailInput && user.email) emailInput.value = user.email;
    if (phoneInput && user.phone) phoneInput.value = user.phone;

    // Fill address fields if available
    if (user.address) {
        const addressFields = [
            'address1', 'address2', 'city', 'state', 'pincode', 'country'
        ];
        
        addressFields.forEach(field => {
            const input = document.getElementById(field);
            if (input && user.address[field]) {
                input.value = user.address[field];
            }
        });
    }
    
    // Highlight filled fields
    document.querySelectorAll('.form-control').forEach(input => {
        if (input.value) {
            input.classList.add('has-value');
        }
        
        // Add listener to track value changes
        input.addEventListener('input', function() {
            if (this.value) {
                this.classList.add('has-value');
            } else {
                this.classList.remove('has-value');
            }
        });
    });
}

// Display order summary
function displayOrderSummary(cart) {
    // Always keep the current cart in memory for other functions
    window.currentCart = cart;
    const orderItemsContainer = document.getElementById('order-items');
    if (!orderItemsContainer) {
        console.error('Order items container not found');
        return;
    }

    // Clear current content
    orderItemsContainer.innerHTML = '';

    console.log('Displaying order summary for cart:', cart);

    // No items in cart
    if (!cart || cart.length === 0) {
        showEmptyCartMessage();
        return;
    }

    // Calculate totals
    let subtotal = 0;
    // Loop through each item and calculate price * quantity correctly
    for (const item of cart) {
        let itemPrice = 0;
        // Handle both string and number price formats
        if (typeof item.price === 'string') {
            // Remove currency symbols and non-numeric characters
            itemPrice = parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
        } else if (typeof item.price === 'number') {
            itemPrice = item.price;
        }
        
        // Use parseInt to ensure quantity is a number
        const itemQuantity = parseInt(item.quantity) || 1;
        subtotal += (itemPrice * itemQuantity);
    }
    
    const shipping = calculateShipping(subtotal);
    const tax = calculateTax(subtotal);
    const total = subtotal + shipping + tax;

    // Add "items count" info
    const itemCount = cart.reduce((acc, item) => acc + (parseInt(item.quantity) || 1), 0);
    const itemCountText = document.createElement('div');
    itemCountText.className = 'items-count';
    itemCountText.innerHTML = `<span>${itemCount}</span> item${itemCount !== 1 ? 's' : ''} in your cart`;
    orderItemsContainer.appendChild(itemCountText);

    // Display each item
    cart.forEach(item => {
        console.log('Creating order item element for:', item);
        const orderItem = createOrderItemElement(item);
        orderItemsContainer.appendChild(orderItem);
    });

    // Get discount from sessionStorage if present
    let discount = 0;
    const savedDiscount = sessionStorage.getItem('harnamDiscount');
    if (savedDiscount) {
        discount = parseFloat(savedDiscount) || 0;
    }
    const totalWithDiscount = subtotal + shipping + tax - discount;
    updateOrderTotals(subtotal, shipping, tax, discount, totalWithDiscount);
    
    console.log('Order summary displayed successfully');
    console.log('Calculated totals:', { subtotal, shipping, tax, discount, total: totalWithDiscount });
}

// Create order item element
function createOrderItemElement(item) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'order-item';
    
    // Format price - handle both string and number formats
    let priceNum = 0;
    if (typeof item.price === 'string') {
        priceNum = parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
    } else if (typeof item.price === 'number') {
        priceNum = item.price;
    }
    
    // Ensure quantity is a number
    const itemQuantity = parseInt(item.quantity) || 1;
    const itemTotal = priceNum * itemQuantity;
    
    // Ensure image path is valid
    const imagePath = item.image || 'assets/images/placeholder-product.jpg';
    
    itemDiv.innerHTML = `
        <div class="order-item-image">
            <img src="${imagePath}" alt="${item.name}" onerror="this.src='assets/images/placeholder-product.jpg'">
        </div>
        <div class="order-item-details">
            <h4 class="order-item-name">${item.name}</h4>
            <div class="order-item-price">₹${priceNum.toFixed(2)} × ${itemQuantity}</div>
            <div class="order-item-quantity">Qty: ${itemQuantity}</div>
        </div>
        <div class="order-item-total">₹${itemTotal.toFixed(2)}</div>
    `;
    
    console.log(`Item: ${item.name}, Price: ${priceNum}, Quantity: ${itemQuantity}, Total: ${itemTotal}`);
    return itemDiv;
}

// Calculate subtotal from cart items
function calculateSubtotal(cart) {
    return cart.reduce((total, item) => {
        let price = 0;
        // Handle both string and number price formats
        if (typeof item.price === 'string') {
            price = parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
        } else if (typeof item.price === 'number') {
            price = item.price;
        }
        return total + (price * item.quantity);
    }, 0);
}

// Calculate shipping fee based on order value
function calculateShipping(subtotal) {
    // Free shipping for orders over ₹500
    return subtotal >= 500 ? 0 : 50;
}

// Calculate tax (GST)
function calculateTax(subtotal) {
    // 18% GST
    return subtotal * 0.18;
}

// Update order summary totals
function updateOrderTotals(subtotal, shipping, tax, discount, total) {
    // Always get discount from sessionStorage if present
    let sessionDiscount = discount;
    const savedDiscount = sessionStorage.getItem('harnamDiscount');
    if (savedDiscount) {
        sessionDiscount = parseFloat(savedDiscount) || 0;
    }
    document.getElementById('order-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('order-shipping').textContent = shipping > 0 ? `₹${shipping.toFixed(2)}` : 'Free';
    document.getElementById('order-tax').textContent = `₹${tax.toFixed(2)}`;
    document.getElementById('order-discount').textContent = sessionDiscount > 0 ? `-₹${sessionDiscount.toFixed(2)}` : '₹0.00';
    document.getElementById('order-total').textContent = `₹${(subtotal + shipping + tax - sessionDiscount).toFixed(2)}`;
    
    // Update the discount row visibility
    const discountRow = document.querySelector('.order-total-row.discount');
    if (discountRow) {
        discountRow.style.display = sessionDiscount > 0 ? 'flex' : 'none';
    }
    
    // Store values for order processing
    window.checkoutData = {
        subtotal,
        shipping,
        tax,
        discount: sessionDiscount,
        total: subtotal + shipping + tax - sessionDiscount
    };
}

// Function to set up promo code functionality
function setupPromoCode() {
    const promoForm = document.querySelector('.promo-form');
    const promoInput = document.getElementById('promo-code');
    const promoApplyBtn = document.getElementById('apply-promo');
    const promoMessage = document.getElementById('promo-message');
    
    if (!promoForm || !promoInput || !promoApplyBtn) {
        console.error('Promo code elements not found in the DOM');
        return;
    }
    
    // Initialize promo state
    let currentPromo = null;
    
    // Apply promo code
    promoForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // If the button is in "remove" mode, handle removal
        if (promoApplyBtn.classList.contains('remove-promo')) {
            handleRemovePromo();
            return;
        }
        
        const code = promoInput.value.trim().toUpperCase();
        if (!code) {
            showPromoMessage('Please enter a promo code', 'error');
            return;
        }
        
        // Disable button while validating
        promoApplyBtn.disabled = true;
        promoApplyBtn.textContent = 'Validating...';
        
        // Validate promo code
        validatePromoCode(code)
            .then(result => {
                if (result.valid) {
                    // Store promo data for order processing
                    currentPromo = result.data;
                    sessionStorage.setItem('harnamPromo', JSON.stringify(currentPromo));
                    sessionStorage.setItem('harnamPromoDetails', JSON.stringify(currentPromo));
                    
                    // Format the discount text based on discount type
                    const discountText = currentPromo.type === 'percentage' ? 
                        `${currentPromo.value}% off` : 
                        `₹${currentPromo.value} off`;
                    
                    // Show success message with discount details
                    showPromoMessage(`Promo code ${code} applied successfully! (${discountText})`, 'success');
                    
                    // Apply discount to order
                    applyDiscount(currentPromo);
                    
                    // Disable input
                    promoInput.disabled = true;
                    promoApplyBtn.textContent = 'Remove';
                    promoApplyBtn.classList.add('remove-promo');
                } else {
                    // Show specific error message
                    showPromoMessage(result.message || 'Invalid promo code', 'error');
                    promoApplyBtn.textContent = 'Apply';
                    promoInput.focus();
                }
            })
            .catch(error => {
                console.error('Error validating promo code:', error);
                showPromoMessage('Error validating promo code. Please try again.', 'error');
            })
            .finally(() => {
                promoApplyBtn.disabled = false;
            });
    });
    
    // Handle direct click on apply button
    promoApplyBtn.addEventListener('click', function(e) {
        e.preventDefault(); // Always prevent default action
        if (this.classList.contains('remove-promo')) {
            handleRemovePromo();
        } else {
            // Get the promo code value
            const code = promoInput.value.trim().toUpperCase();
            if (!code) {
                showPromoMessage('Please enter a promo code', 'error');
                return;
            }
            
            // Disable button while validating
            promoApplyBtn.disabled = true;
            promoApplyBtn.textContent = 'Validating...';
            
            // Validate promo code
            validatePromoCode(code)
                .then(result => {
                    if (result.valid) {
                        // Store promo data for order processing
                        currentPromo = result.data;
                        sessionStorage.setItem('harnamPromo', JSON.stringify(currentPromo));
                        sessionStorage.setItem('harnamPromoDetails', JSON.stringify(currentPromo));
                        
                        // Format the discount text based on discount type
                        const discountText = currentPromo.type === 'percentage' ? 
                            `${currentPromo.value}% off` : 
                            `₹${currentPromo.value} off`;
                        
                        // Show success message with discount details
                        showPromoMessage(`Promo code ${code} applied successfully! (${discountText})`, 'success');
                        
                        // Apply discount to order
                        applyDiscount(currentPromo);
                        
                        // Disable input
                        promoInput.disabled = true;
                        promoApplyBtn.textContent = 'Remove';
                        promoApplyBtn.classList.add('remove-promo');
                    } else {
                        // Show specific error message
                        showPromoMessage(result.message || 'Invalid promo code', 'error');
                        promoApplyBtn.textContent = 'Apply';
                        promoInput.focus();
                    }
                })
                .catch(error => {
                    console.error('Error validating promo code:', error);
                    showPromoMessage('Error validating promo code. Please try again.', 'error');
                })
                .finally(() => {
                    promoApplyBtn.disabled = false;
                });
        }
    });
    
    // Track if promo was just removed to avoid re-applying
    let promoJustRemoved = false;
    // Function to handle promo code removal
    function handleRemovePromo() {
        // Reset promo state
        currentPromo = null;
        promoJustRemoved = true;
        // Clear session storage
        sessionStorage.removeItem('harnamPromo');
        sessionStorage.removeItem('harnamPromoDetails');
        sessionStorage.removeItem('harnamDiscount');
        // Reset UI
        promoInput.disabled = false;
        promoInput.value = '';
        promoApplyBtn.textContent = 'Apply';
        promoApplyBtn.classList.remove('remove-promo');
        // Clear message
        showPromoMessage('Promo code removed', '');
        // Recalculate order without discount
        removeDiscount();
    }
    
    // Do NOT auto-apply saved promo code on page load. User must enter and apply manually.
    
    // Helper to show promo messages
    function showPromoMessage(message, type) {
        if (!promoMessage) return;
        
        promoMessage.textContent = message;
        promoMessage.className = 'promo-message';
        
        if (type) {
            promoMessage.classList.add(type);
        }
    }
}

// Function to validate promo code with Firebase
async function validatePromoCode(code) {
    try {
        console.log('Validating promo code:', code);
        // Get the promo code from Firebase
        const snapshot = await firebase.database().ref('promos').orderByChild('code').equalTo(code).once('value');
        
        if (!snapshot.exists()) {
            console.log('Promo code not found');
            return {
                valid: false,
                message: 'Invalid promo code. Please check and try again.'
            };
        }
        
        // There should only be one promo with this code, but we'll handle multiple just in case
        let promoData = null;
        let promoId = null;
        
        snapshot.forEach(child => {
            promoData = child.val();
            promoId = child.key;
        });
        
        if (!promoData) {
            console.log('No valid promo data found');
            return {
                valid: false,
                message: 'Invalid promo code. Please check and try again.'
            };
        }
        
        // Validate promo code
        const now = Date.now();
        
        // Check if promo has started
        if (promoData.startDate && now < promoData.startDate) {
            console.log('Promo not started yet');
            return {
                valid: false,
                message: 'This promo code is not active yet.'
            };
        }
        
        // Check if promo has expired
        if (promoData.expiryDate && now > promoData.expiryDate) {
            console.log('Promo expired');
            return {
                valid: false,
                message: 'This promo code has expired.'
            };
        }
        
        // Check if usage limit is reached
        if (promoData.usageLimit && promoData.usageCount >= promoData.usageLimit) {
            console.log('Promo usage limit reached');
            return {
                valid: false,
                message: 'This promo code has reached its usage limit.'
            };
        }
        
        // Check minimum order amount
        // Get the actual displayed total from the order-total element in the DOM
        let actualCartTotal = 0;
        
        // Get the order total from the DOM
        const orderTotalElement = document.getElementById('order-total');
        if (orderTotalElement) {
            // Extract the number from the displayed total (removing currency symbol and any non-numeric chars)
            const totalText = orderTotalElement.textContent || '₹0.00';
            actualCartTotal = parseFloat(totalText.replace(/[^\d.]/g, '')) || 0;
            console.log(`Got actual cart total from DOM: ${totalText} -> ₹${actualCartTotal}`);
        } else {
            // Fallback to calculating from cart items if element not found
            const cartItems = JSON.parse(localStorage.getItem('harnamCart')) || [];
            
            // Calculate total manually as fallback
            cartItems.forEach(item => {
                if (!item) return;
                
                let itemPrice = 0;
                if (typeof item.price === 'string') {
                    itemPrice = parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
                } else if (typeof item.price === 'number') {
                    itemPrice = item.price;
                }
                
                const itemQuantity = parseInt(item.quantity) || 1;
                const itemTotal = itemPrice * itemQuantity;
                
                console.log(`Item: ${item.name}, Price: ₹${itemPrice}, Qty: ${itemQuantity}, Total: ₹${itemTotal}`);
                actualCartTotal += itemTotal;
            });
            
            console.log(`Calculated cart total from items: ₹${actualCartTotal}`);
        }
        
        // Ensure we have a valid number for minimum order amount
        const minOrderAmount = typeof promoData.minOrderAmount === 'number' 
            ? promoData.minOrderAmount 
            : (parseFloat(promoData.minOrderAmount) || 0);
        
        console.log('Cart validation details:', {
            actualCartTotal: actualCartTotal,
            minimumRequired: minOrderAmount,
            comparison: `${actualCartTotal} >= ${minOrderAmount} = ${actualCartTotal >= minOrderAmount}`
        });
        
        // Explicitly log the comparison for debugging
        console.log(`Comparison: ${actualCartTotal} < ${minOrderAmount} = ${actualCartTotal < minOrderAmount}`);
        
        // Only show error if minimum order amount is set (greater than 0) and cart total is less than requirement
        if (minOrderAmount > 0 && actualCartTotal < minOrderAmount) {
            console.log(`Minimum order amount not met. Required: ₹${minOrderAmount}, Current: ₹${actualCartTotal}`);
            return {
                valid: false,
                message: `Minimum order amount of ₹${minOrderAmount} required for this promo code.`
            };
        }
        
        // All validation passed, return success with promo data
        // Make sure we use proper number values for the promo details
        return {
            valid: true,
            data: {
                id: promoId,
                code: promoData.code,
                type: promoData.discountType,
                value: typeof promoData.discountValue === 'number' 
                    ? promoData.discountValue 
                    : parseFloat(promoData.discountValue) || 0,
                minOrderAmount: minOrderAmount
            }
        };
    } catch (error) {
        console.error('Error validating promo code:', error);
        return {
            valid: false,
            message: 'Error validating promo code. Please try again later.'
        };
    }
}

// Function to apply discount to order total
function applyDiscount(promoData) {
    // Use checkoutData for all calculations
    let discountAmount = 0;
    if (promoData.type === 'percentage') {
        discountAmount = window.checkoutData && window.checkoutData.subtotal ? window.checkoutData.subtotal * (promoData.value / 100) : 0;
    } else if (promoData.type === 'fixed') {
        discountAmount = window.checkoutData && window.checkoutData.subtotal ? Math.min(promoData.value, window.checkoutData.subtotal) : 0;
    }
    discountAmount = Math.round(discountAmount * 100) / 100;
    sessionStorage.setItem('harnamDiscount', discountAmount.toString());
    const orderTotals = document.querySelector('.order-totals');
    if (!orderTotals) return;
    const discountRow = orderTotals.querySelector('.order-total-row.discount');
    const discountLabel = orderTotals.querySelector('#order-discount-label');
    const discountValue = orderTotals.querySelector('#order-discount');
    if (discountRow && discountLabel && discountValue) {
        discountLabel.textContent = 'Discount';
        discountValue.textContent = `-₹${discountAmount.toFixed(2)}`;
        discountRow.style.display = discountAmount > 0 ? 'flex' : 'none';
    }
    // Add a visible label below the summary if promo applied
    let promoSummary = document.getElementById('promo-summary-label');
    if (!promoSummary) {
        promoSummary = document.createElement('div');
        promoSummary.id = 'promo-summary-label';
        promoSummary.style.color = '#27ae60';
        promoSummary.style.fontWeight = 'bold';
        promoSummary.style.marginTop = '8px';
        orderTotals.parentNode.insertBefore(promoSummary, orderTotals.nextSibling);
    }
    const discountText = promoData.type === 'percentage' ? `${promoData.value}% off` : `₹${promoData.value} off`;
    promoSummary.textContent = `Promo applied: ${promoData.code} (${discountText}) – You save ₹${discountAmount.toFixed(2)}`;
    // Update total label
    const totalLabel = orderTotals.querySelector('#order-total');
    if (totalLabel && window.checkoutData) {
        const total = window.checkoutData.subtotal + window.checkoutData.shipping + window.checkoutData.tax - discountAmount;
        totalLabel.textContent = `₹${total.toFixed(2)}`;
    }
    updateReviewOrderSummary();
}

// Remove discount and promo summary from order summary UI
function removeDiscount() {
    const orderTotals = document.querySelector('.order-totals');
    if (!orderTotals) return;
    const discountRow = orderTotals.querySelector('.order-total-row.discount');
    const discountLabel = orderTotals.querySelector('#order-discount-label');
    const discountValue = orderTotals.querySelector('#order-discount');
    if (discountRow && discountLabel && discountValue) {
        discountLabel.textContent = 'Discount';
        discountValue.textContent = '-₹0.00';
        discountRow.style.display = 'none';
    }
    // Remove promo summary label if present
    const promoSummary = document.getElementById('promo-summary-label');
    if (promoSummary) promoSummary.remove();

    // Clear promo/discount from session storage
    sessionStorage.removeItem('harnamPromo');
    sessionStorage.removeItem('harnamPromoDetails');
    sessionStorage.removeItem('harnamDiscount');

    // Reset discount in checkoutData if present
    if (window.checkoutData) {
        window.checkoutData.discount = 0;
    }

    // Fully refresh order summary UI after removing discount
    let cart = window.currentCart;
    if (!cart) {
        cart = JSON.parse(localStorage.getItem('harnamCart')) || [];
    }
    displayOrderSummary(cart);
    updateReviewOrderSummary();
}

// Helper function to update the review section order summary
function updateReviewOrderSummary() {
    const reviewOrderSummary = document.getElementById('review-order-summary');
    if (!reviewOrderSummary) return;
    
    // Use localStorage for immediate cart access instead of async getCurrentCart
    const cart = JSON.parse(localStorage.getItem('harnamCart')) || [];
    const subtotal = calculateSubtotal(cart);
    const shipping = getShippingCost();
    const tax = getTax(subtotal);
    
    // Check for discount
    let discount = 0;
    const savedDiscount = sessionStorage.getItem('harnamDiscount');
    if (savedDiscount) {
        discount = parseFloat(savedDiscount);
    }
    
    const total = subtotal + shipping + tax - discount;
    
    // Update review summary
    let summaryHTML = `
        <div class="summary-row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
        <div class="summary-row"><span>Shipping</span><span>₹${shipping.toFixed(2)}</span></div>
        <div class="summary-row"><span>Tax</span><span>₹${tax.toFixed(2)}</span></div>
    `;
    
    if (discount > 0) {
        const savedPromo = JSON.parse(sessionStorage.getItem('harnamPromo'));
        const promoCode = savedPromo ? savedPromo.code : 'DISCOUNT';
        summaryHTML += `
            <div class="summary-row discount"><span>Discount (${promoCode})</span><span>-₹${discount.toFixed(2)}</span></div>
        `;
    }
    
    summaryHTML += `
        <div class="summary-row total"><span>Total</span><span>₹${total.toFixed(2)}</span></div>
    `;
    
    reviewOrderSummary.innerHTML = summaryHTML;
}

// Function to calculate order subtotal
function calculateSubtotal(cart) {
    // Handle edge cases
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
        console.log('Empty or invalid cart in calculateSubtotal');
        return 0;
    }
    
    console.log('Cart items being processed:', cart);
    
    const subtotal = cart.reduce((sum, item) => {
        // Skip invalid items
        if (!item) return sum;
        
        let itemPrice = 0;
        // Handle both string and number price formats
        if (typeof item.price === 'string') {
            // Remove currency symbols and non-numeric characters
            const cleaned = item.price.replace(/[^\d.]/g, '');
            itemPrice = parseFloat(cleaned) || 0;
            console.log(`String price "${item.price}" parsed as: ${cleaned} → ${itemPrice}`);
        } else if (typeof item.price === 'number') {
            itemPrice = item.price;
            console.log(`Number price used directly: ${itemPrice}`);
        } else {
            console.log(`Unexpected price type: ${typeof item.price}, value: ${item.price}`);
        }
        
        // Ensure quantity is a number
        const rawQuantity = item.quantity;
        const itemQuantity = parseInt(rawQuantity) || 1;
        if (itemQuantity !== rawQuantity) {
            console.log(`Quantity converted from ${rawQuantity} (${typeof rawQuantity}) to ${itemQuantity}`);
        }
        
        const itemTotal = itemPrice * itemQuantity;
        
        // Log item details for debugging
        console.log(`Item: ${item.name}, Price: ₹${itemPrice}, Quantity: ${itemQuantity}, Total: ₹${itemTotal}`);
        
        return sum + itemTotal;
    }, 0);
    
    console.log(`Final calculated subtotal: ₹${subtotal} (${typeof subtotal})`);
    return subtotal;
}

// Function to get current shipping cost
function getShippingCost() {
    // Get cart and calculate subtotal
    const cart = JSON.parse(localStorage.getItem('harnamCart')) || [];
    const subtotal = calculateSubtotal(cart);
    
    // Free shipping for orders over ₹500, else ₹50
    return subtotal >= 500 ? 0 : 50;
}

// Function to calculate tax
function getTax(subtotal) {
    // Using GST rate of 18%
    const taxRate = 0.18; // 18% GST
    return subtotal * taxRate;
}

// Set up checkout form submission
function setupCheckoutForm() {
    const checkoutForm = document.getElementById('checkout-form');
    
    if (!checkoutForm) return;
    
    // Add form validation
    addFormValidation(checkoutForm);
    
    checkoutForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        // Validate the review section before submission
        if (!validateSection('review-confirm')) {
            return;
        }

        // Show loading state
        const submitBtn = document.getElementById('place-order-btn');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitBtn.disabled = true;

        try {
            // Collect form data
            const formData = new FormData(checkoutForm);
            
            // Get cart data
            const cart = await getCurrentCart();
            const subtotal = calculateSubtotal(cart);
            const shipping = getShippingCost();
            const tax = getTax(subtotal);
            
            // Check if there's an applied promo code
            let discount = 0;
            let promoDetails = null;
            
            const savedDiscount = sessionStorage.getItem('harnamDiscount');
            if (savedDiscount) {
                discount = parseFloat(savedDiscount);
                
                // Get promo details if available
                const savedPromo = sessionStorage.getItem('harnamPromo');
                if (savedPromo) {
                    promoDetails = JSON.parse(savedPromo);
                }
            }
            
            // Calculate total
            const total = subtotal + shipping + tax - discount;
            
            const orderData = {
                customer: {
                    firstName: formData.get('first-name'),
                    lastName: formData.get('last-name'),
                    email: formData.get('email'),
                    phone: formData.get('phone')
                },
                address: {
                    address1: formData.get('address1'),
                    address2: formData.get('address2') || '',
                    city: formData.get('city'),
                    state: formData.get('state'),
                    pincode: formData.get('pincode'),
                    country: formData.get('country')
                },
                payment: formData.get('payment'),
                terms: formData.get('terms') === 'on',
                dateCreated: new Date().toISOString(),
                items: cart,
                subtotal: subtotal,
                shipping: shipping,
                tax: tax,
                total: total,
                ...window.checkoutData
            };                // Add promo code details if a code was applied
            if (discount > 0 && promoDetails) {
                orderData.discount = discount;
                orderData.promo = {
                    code: promoDetails.code,
                    type: promoDetails.type,
                    value: promoDetails.value,
                    id: promoDetails.id
                };
                // Always await promo usage update before order creation
                if (promoDetails.id) {
                    try {
                        const promoRef = firebase.database().ref(`promos/${promoDetails.id}`);
                        await promoRef.update({
                            usageCount: firebase.database.ServerValue.increment(1),
                            lastUsed: new Date().toISOString()
                        });
                    } catch (error) {
                        console.error('Error updating promo code usage count:', error);
                    }
                }
            }

            // Process order
            let orderResult;
            if (typeof window.FirebaseUtil !== 'undefined' && window.FirebaseUtil.orders) {
                // Use Firebase for order placement
                const currentUser = getCheckoutUser();
                if (!currentUser || !currentUser.id) {
                    throw new Error('User not authenticated');
                }
                
                // Always get latest cart before placing order
                let items = await getCurrentCart();
                
                // Show conversion progress in UI
                const processingNotice = document.createElement('div');
                processingNotice.className = 'checkout-alert info';
                processingNotice.innerHTML = `
                    <div class="alert-icon"><i class="fas fa-spinner fa-spin"></i></div>
                    <div class="alert-content">
                        <p>Processing product images...</p>
                    </div>
                `;
                document.querySelector('.checkout-container').prepend(processingNotice);
                
                // Convert all product images to base64
                console.log('Converting all product images to base64');
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    processingNotice.querySelector('.alert-content p').textContent = 
                        `Processing product images (${i+1}/${items.length}): ${item.name}`;
                    
                    // Convert image to base64 and store in imageBase64 property
                    try {
                        const base64Data = await imageUrlToBase64(item.image);
                        if (base64Data) {
                            item.imageBase64 = base64Data;
                            console.log(`Converted image for ${item.name}`);
                            
                            // Replace the original image with base64 data to ensure it's stored in Firebase
                            item.image = base64Data;
                        }
                    } catch (err) {
                        console.error(`Failed to convert image for ${item.name}:`, err);
                    }
                }
                
                // Remove the processing notice
                processingNotice.remove();
                
                orderData.items = items;

                orderResult = await window.FirebaseUtil.orders.createOrder(currentUser.id, orderData);

                // Clear frontend cart state after order
                if (orderResult.success) {
                    localStorage.setItem('harnamCart', JSON.stringify([]));
                    if (window.HarnamCart && typeof window.HarnamCart.clearCart === 'function') {
                        window.HarnamCart.clearCart();
                    }
                }
            } else {
                // Fallback to localStorage implementation
                orderResult = await processOrder(orderData);
            }

            if (orderResult.success) {
                // Show success modal/screen
                showOrderSuccessModal(orderResult.order);

                // Cart is already cleared above
            } else {
                // Show error alert in UI
                const errorAlert = document.createElement('div');
                errorAlert.className = 'checkout-alert error';
                errorAlert.innerHTML = `
                    <div class="alert-icon"><i class="fas fa-exclamation-circle"></i></div>
                    <div class="alert-content">
                        <p>${orderResult.message || 'There was an error processing your order. Please try again.'}</p>
                    </div>
                    <button class="close-alert">&times;</button>
                `;
                document.querySelector('.checkout-container').prepend(errorAlert);
                setTimeout(() => {
                    errorAlert.style.opacity = '0';
                    setTimeout(() => errorAlert.remove(), 300);
                }, 5000);
                errorAlert.querySelector('.close-alert').addEventListener('click', () => {
                    errorAlert.style.opacity = '0';
                    setTimeout(() => errorAlert.remove(), 300);
                });
                console.error('Order error:', orderResult.message);
            }
        } catch (error) {
            console.error('Order submission error:', error);
            // Show error in UI instead of alert
            const errorAlert = document.createElement('div');
            errorAlert.className = 'checkout-alert error';
            errorAlert.innerHTML = `
                <div class="alert-icon"><i class="fas fa-exclamation-circle"></i></div>
                <div class="alert-content">
                    <p>${error.message || 'An unexpected error occurred. Please try again.'}</p>
                </div>
                <button class="close-alert">&times;</button>
            `;
            document.querySelector('.checkout-container').prepend(errorAlert);
            setTimeout(() => {
                errorAlert.style.opacity = '0';
                setTimeout(() => errorAlert.remove(), 300);
            }, 5000);
            errorAlert.querySelector('.close-alert').addEventListener('click', () => {
                errorAlert.style.opacity = '0';
                setTimeout(() => errorAlert.remove(), 300);
            });
        } finally {
            // Restore button state
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    });
    
    // Validate a specific section
    function validateSection(sectionName) {
        const section = document.getElementById(`${sectionName}-section`);
        if (!section) return true;
        
        const inputs = section.querySelectorAll('input[required], select[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!validateInput(input)) {
                isValid = false;
            }
        });
        
        if (!isValid) {
            const firstInvalidInput = section.querySelector('.invalid');
            if (firstInvalidInput) {
                firstInvalidInput.focus();
                firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        
        return isValid;
    }
}

// Add form validation
function addFormValidation(form) {
    const inputs = form.querySelectorAll('input[required], select[required]');
    
    inputs.forEach(input => {
        // Add input event for instant validation
        input.addEventListener('input', function() {
            validateInput(this);
        });
        
        // Add blur event for validation when leaving field
        input.addEventListener('blur', function() {
            validateInput(this);
        });
    });
}

// Validate single input field
function validateInput(input) {
    const errorMessage = input.parentElement.querySelector('.input-error');
    
    // Remove any existing error message
    if (errorMessage) {
        errorMessage.remove();
    }
    
    // Check if input is valid
    if (!input.checkValidity()) {
        const error = document.createElement('div');
        error.className = 'input-error';
        
        // Custom error messages based on validation type
        if (input.validity.valueMissing) {
            error.textContent = `${input.getAttribute('placeholder') || 'This field'} is required`;
        } else if (input.validity.typeMismatch) {
            error.textContent = `Please enter a valid ${input.getAttribute('type')}`;
        } else if (input.validity.patternMismatch) {
            if (input.id === 'phone') {
                error.textContent = 'Phone number should be 10 digits';
            } else if (input.id === 'pincode') {
                error.textContent = 'PIN code should be 6 digits';
            } else {
                error.textContent = input.getAttribute('title') || 'Please match the requested format';
            }
        } else {
            error.textContent = input.validationMessage;
        }
        
        // Show error message
        input.parentElement.appendChild(error);
        input.classList.add('invalid');
        return false;
    } else {
        input.classList.remove('invalid');
        input.classList.add('valid');
        return true;
    }
}

// Validate entire checkout form
function validateCheckoutForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateInput(input)) {
            isValid = false;
        }
    });
    
    // Animate to first invalid input if form is invalid
    if (!isValid) {
        const firstInvalidInput = form.querySelector('.invalid');
        if (firstInvalidInput) {
            firstInvalidInput.focus();
            firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    return isValid;
}

// Get current cart data (from Firebase if possible, otherwise localStorage)
async function getCurrentCart() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        return JSON.parse(localStorage.getItem('harnamCart')) || [];
    }
    
    try {
        // Try to get cart from Firebase
        if (typeof window.FirebaseUtil !== 'undefined') {
            const result = await window.FirebaseUtil.cart.getUserCart(currentUser.id);
            if (result.success && result.cart && result.cart.length > 0) {
                return result.cart;
            }
        }
        
        // Fallback to localStorage
        return JSON.parse(localStorage.getItem('harnamCart')) || [];
    } catch (error) {
        console.error('Error getting cart data:', error);
        return JSON.parse(localStorage.getItem('harnamCart')) || [];
    }
}

// Process the order
async function processOrder(orderData) {
    const currentUser = getCheckoutUser();
    if (!currentUser) {
        return { success: false, message: 'You must be logged in to place an order' };
    }
    
    try {
        console.log('Processing order with data:', orderData);
        
        // If Firebase is available, use it
        if (typeof window.FirebaseUtil !== 'undefined' && window.FirebaseUtil.orders) {
            console.log('Using Firebase to process order');
            
            // Get current cart data
            const cart = await getCurrentCart();
            if (!cart || cart.length === 0) {
                return { success: false, message: 'Your cart is empty' };
            }
            
            // Check for any applied promo code discount
            let discount = 0;
            let promoDetails = null;
            
            // Get discount amount from session storage if available
            const discountStr = sessionStorage.getItem('harnamDiscount');
            if (discountStr) {
                discount = parseFloat(discountStr);
                
                // Get promo details from local storage
                const promoDetailsStr = sessionStorage.getItem('harnamPromoDetails');
                if (promoDetailsStr) {
                    promoDetails = JSON.parse(promoDetailsStr);
                }
            }
            
            // Add cart items and promo details to order data
            const completeOrderData = {
                ...orderData,
                items: cart,
                userId: currentUser.id,
                orderDate: new Date().toISOString()
            };
            
            // Add promo code and discount details if applied
            if (discount > 0 && promoDetails) {
                completeOrderData.discount = discount;
                completeOrderData.promo = {
                    code: promoDetails.code,
                    type: promoDetails.type,
                    value: promoDetails.value,
                    id: promoDetails.id
                };
                // Always await promo usage update before order creation
                if (promoDetails.id) {
                    try {
                        const promoRef = firebase.database().ref(`promos/${promoDetails.id}`);
                        await promoRef.update({
                            usageCount: firebase.database.ServerValue.increment(1),
                            lastUsed: new Date().toISOString()
                        });
                    } catch (error) {
                        console.error('Error updating promo code usage count:', error);
                    }
                }
            }
            
            // Create order in Firebase
            const result = await window.FirebaseUtil.orders.createOrder(
                currentUser.id, 
                completeOrderData
            );
            
            if (result.success) {
                // Clear cart and promo code data after successful order
                localStorage.setItem('harnamCart', JSON.stringify([]));
                sessionStorage.removeItem('harnamDiscount');
                sessionStorage.removeItem('harnamPromoDetails');
                console.log('Order placed successfully:', result.order.id);
            }
            
            return result;
        }
        
        // Fallback to localStorage implementation
        console.log('Firebase not available, using localStorage for order processing');
        
        // Get current cart
        let cart = JSON.parse(localStorage.getItem('harnamCart')) || [];
        
        // Also convert images to base64 for local storage implementation
        for (let item of cart) {
            try {
                if (!item.imageBase64 && item.image) {
                    const base64Data = await imageUrlToBase64(item.image);
                    if (base64Data) {
                        item.imageBase64 = base64Data;
                        item.image = base64Data; // Replace image URL with base64 data
                    }
                }
            } catch (err) {
                console.error(`Failed to convert image for ${item.name}:`, err);
            }
        }
        
        // Create new order object
        const newOrder = {
            id: 'order_' + Date.now() + Math.random().toString(36).substring(2, 10),
            orderDate: new Date().toISOString(),
            status: 'Processing',
            items: cart,
            customer: {
                firstName: orderData.customer.firstName,
                lastName: orderData.customer.lastName,
                email: orderData.customer.email,
                phone: orderData.customer.phone
            },
            address: orderData.address,
            payment: orderData.payment,
            subtotal: orderData.subtotal || 0,
            shipping: orderData.shipping || 0,
            tax: orderData.tax || 0,
            discount: orderData.discount || 0,
            total: orderData.total || 0,
            appliedPromoCode: orderData.appliedPromoCode || null
        };
        
        // Add tracking information
        newOrder.trackingInfo = {
            status: 'Order Received',
            updates: [
                {
                    status: 'Order Received',
                    date: new Date().toISOString(),
                    message: 'Your order has been received and is being processed.'
                }
            ]
        };
        
        // Clear cart
        localStorage.setItem('harnamCart', JSON.stringify([]));
        
        // Add to user's orders
        if (!currentUser.orders) {
            currentUser.orders = [];
        }
        
        currentUser.orders.push(newOrder);
        localStorage.setItem('harnamCurrentUser', JSON.stringify(currentUser));
        
        // Update user in users array
        const users = JSON.parse(localStorage.getItem('harnamUsers')) || [];
        const userIndex = users.findIndex(user => user.id === currentUser.id);
        
        if (userIndex !== -1) {
            if (!users[userIndex].orders) {
                users[userIndex].orders = [];
            }
            users[userIndex].orders.push(newOrder);
            localStorage.setItem('harnamUsers', JSON.stringify(users));
        }
        
        return { success: true, order: newOrder };
    } catch (error) {
        console.error('Error processing order:', error);
        return { success: false, message: error.message };
    }
}

// Show order success modal
function showOrderSuccessModal(order) {
    const modal = document.getElementById('order-success-modal');
    if (!modal) return;
    
    // Set order details
    document.getElementById('success-order-number').textContent = `#${order.id.substring(6, 14)}`;
    document.getElementById('success-order-date').textContent = formatDate(order.orderDate);
    document.getElementById('success-payment-method').textContent = 
        order.payment === 'cod' ? 'Cash on Delivery' : 
        order.payment === 'card' ? 'Credit/Debit Card' : 'UPI Payment';
    // Always show the final total (already discounted if applicable)
    document.getElementById('success-order-total').textContent = `₹${order.total ? order.total.toFixed(2) : '0.00'}`;
    
    // Add discount information if applicable
    const successDetailsEl = document.querySelector('.success-details');
    if (successDetailsEl && order.discount) {
        // Check if discount row already exists
        let discountRow = document.querySelector('.success-discount-row');
        if (!discountRow) {
            // Create discount row
            discountRow = document.createElement('div');
            discountRow.className = 'success-detail-row success-discount-row';
            
            // Insert before the total row
            const totalRow = document.querySelector('.success-detail-row:last-child');
            if (totalRow) {
                successDetailsEl.insertBefore(discountRow, totalRow);
            } else {
                successDetailsEl.appendChild(discountRow);
            }
        }
        
        // Update discount row content
        discountRow.innerHTML = `
            <span class="detail-label">Discount:</span>
            <span class="detail-value">-₹${order.discount.toFixed(2)}${order.promo ? ` (${order.promo.code})` : ''}</span>
        `;
    }
    
    // Add estimated delivery date (5 business days from now)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5); // Add 5 days
    
    const deliveryDateEl = document.getElementById('success-delivery-date');
    if (deliveryDateEl) {
        deliveryDateEl.textContent = formatDate(deliveryDate);
    }
    
    // Show modal with animation
    modal.style.display = 'flex';
    // Use setTimeout to ensure the transition works properly
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Add confetti effect for celebration
    launchConfetti();
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeSuccessModal();
        }
    });
    
    // Add event listener to "Continue Shopping" button
    const continueShoppingBtn = modal.querySelector('.btn-primary');
    if (continueShoppingBtn) {
        continueShoppingBtn.addEventListener('click', function(event) {
            event.preventDefault();
            window.location.href = 'pages/products.html';
        });
    }
    
    // Add event listener to "View Order" button
    const viewOrderBtn = modal.querySelector('.btn-outline');
    if (viewOrderBtn) {
        viewOrderBtn.addEventListener('click', function(event) {
            event.preventDefault();
            window.location.href = `orders.html?order=${order.id}`;
        });
    }
    
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
}

// Close success modal with animation
function closeSuccessModal() {
    const modal = document.getElementById('order-success-modal');
    if (!modal) return;
    
    modal.classList.remove('show');
    
    setTimeout(() => {
        modal.style.display = 'none';
        // Re-enable body scrolling
        document.body.style.overflow = 'auto';
    }, 300);
}

// Format date for display
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Setup address autocomplete functionality
function setupAddressAutocomplete() {
    // Get elements
    const pincodeInput = document.getElementById('pincode');
    const cityInput = document.getElementById('city');
    const stateInput = document.getElementById('state');
    
    // Skip if elements don't exist
    if (!pincodeInput || !cityInput || !stateInput) return;
    
    // Add event listener to pincode input
    pincodeInput.addEventListener('input', function() {
        // Only proceed if pincode has 6 digits
        if (this.value.length === 6 && /^\d{6}$/.test(this.value)) {
            // Real API would be better, but we'll simulate with some common locations
            const pincodeMap = {
                '110001': { city: 'New Delhi', state: 'DL' },
                '400001': { city: 'Mumbai', state: 'MH' },
                '700001': { city: 'Kolkata', state: 'WB' },
                '600001': { city: 'Chennai', state: 'TN' },
                '500001': { city: 'Hyderabad', state: 'TG' },
                '380001': { city: 'Ahmedabad', state: 'GJ' },
                '226001': { city: 'Lucknow', state: 'UP' },
                '560001': { city: 'Bengaluru', state: 'KA' },
                '452001': { city: 'Indore', state: 'MP' },
                '302001': { city: 'Jaipur', state: 'RJ' },
                '411001': { city: 'Pune', state: 'MH' }
            };
            
            // Add loading state
            pincodeInput.classList.add('loading');
            
            // Simulate API delay
            setTimeout(() => {
                // Find matching location
                const location = pincodeMap[this.value];
                
                if (location) {
                    // Fill city and state
                    cityInput.value = location.city;
                    stateInput.value = location.state;
                    
                    // Add has-value class
                    cityInput.classList.add('has-value');
                    stateInput.classList.add('has-value');
                    
                    // Show success indicator
                    pincodeInput.classList.add('valid');
                    pincodeInput.classList.remove('invalid');
                } else {
                    // Reset city and state if no match
                    cityInput.value = '';
                    stateInput.value = '';
                    
                    // Remove has-value class
                    cityInput.classList.remove('has-value');
                    stateInput.classList.remove('has-value');
                    
                    // Show error indicator
                    pincodeInput.classList.add('invalid');
                    pincodeInput.classList.remove('valid');
                    
                    // Add error message
                    const errorMessage = pincodeInput.parentElement.querySelector('.input-error');
                    if (!errorMessage) {
                        const error = document.createElement('div');
                        error.className = 'input-error';
                        error.textContent = 'Could not find location for this PIN code';
                        pincodeInput.parentElement.appendChild(error);
                    }
                }
                
                // Remove loading state
                pincodeInput.classList.remove('loading');
            }, 800);
        }
    });
}

// Launch confetti effect for order success
function launchConfetti() {
    // Create canvas for confetti
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);
    
    // Initialize confetti
    const ctx = canvas.getContext('2d');
    const confetti = [];
    const colors = ['#e63946', '#b590b9', '#ffc4c6', '#4CAF50', '#e36b71'];
    const confettiCount = 200;
    
    // Create confetti particles
    for (let i = 0; i < confettiCount; i++) {
        confetti.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            size: Math.random() * 10 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            speed: Math.random() * 3 + 2,
            angle: Math.random() * 6.28,
            spin: Math.random() > 0.5 ? 0.05 : -0.05
        });
    }
    
    // Animation loop
    const animateConfetti = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let stillActive = false;
        for (const particle of confetti) {
            if (particle.y < canvas.height) {
                stillActive = true;
                
                ctx.save();
                ctx.translate(particle.x, particle.y);
                ctx.rotate(particle.angle);
                ctx.fillStyle = particle.color;
                ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
                ctx.restore();
                
                particle.y += particle.speed;
                particle.angle += particle.spin;
            }
        }
        
        if (stillActive) {
            requestAnimationFrame(animateConfetti);
        } else {
            canvas.remove();
        }
    };
    
    // Start animation
    animateConfetti();
}

// Utility: Convert image URL to base64 string
async function imageUrlToBase64(url) {
    return new Promise((resolve, reject) => {
        if (!url) return resolve('');
        
        // Process local paths correctly
        let processedUrl = url;
        // If it's a local path (not a full URL or data URI), prepend assets/images/
        if (!url.startsWith('http') && !url.startsWith('data:') && !url.startsWith('/')) {
            processedUrl = 'assets/images/' + url;
        } else if (url.startsWith('http://127.0.0.1:5500/')) {
            // Fix localhost URLs - extract the path after the domain
            try {
                const urlPath = new URL(url).pathname;
                processedUrl = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;
            } catch (e) {
                console.error('Error parsing localhost URL:', e);
            }
        }
        
        console.log('Converting image to base64:', url, '→', processedUrl);
        
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function() {
            try {
                const canvas = document.createElement('canvas');
                
                // Limit max dimensions for performance
                const maxDimension = 800;
                let width = img.width;
                let height = img.height;
                
                if (width > height && width > maxDimension) {
                    height = Math.round(height * (maxDimension / width));
                    width = maxDimension;
                } else if (height > maxDimension) {
                    width = Math.round(width * (maxDimension / height));
                    height = maxDimension;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Compress with reduced quality for JPEG
                const base64 = canvas.toDataURL('image/jpeg', 0.8);
                console.log('Image converted to base64 successfully');
                resolve(base64);
            } catch (e) {
                console.error('Error converting image to base64:', e);
                resolve('');
            }
        };
        img.onerror = function(e) {
            console.error('Error loading image for base64 conversion:', e);
            resolve('');
        };
        img.src = processedUrl;
    });
}
