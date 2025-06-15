// Checkout functionality for Harnam Masale
document.addEventListener('DOMContentLoaded', function() {
    console.log('Checkout page initialized');
    
    // Get current user
    const currentUser = getCheckoutUser();
    if (!currentUser) {
        // Redirect to login page with return URL
        console.log('No user found, redirecting to login');
        window.location.href = 'login.html?redirect=checkout.html';
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
    if (typeof window.HarnamAuth !== 'undefined') {
        return window.HarnamAuth.getCurrentUser();
    }
    return JSON.parse(localStorage.getItem('harnamCurrentUser'));
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
    const subtotal = calculateSubtotal(cart);
    const shipping = calculateShipping(subtotal);
    const tax = calculateTax(subtotal);
    const total = subtotal + shipping + tax;

    // Add "items count" info
    const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
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

    // Update summary amounts
    updateOrderTotals(subtotal, shipping, tax, 0, total);
    
    console.log('Order summary displayed successfully');
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
    
    const itemTotal = priceNum * item.quantity;
    
    // Ensure image path is valid
    const imagePath = item.image || 'assets/images/placeholder-product.jpg';
    
    itemDiv.innerHTML = `
        <div class="order-item-image">
            <img src="${imagePath}" alt="${item.name}" onerror="this.src='assets/images/placeholder-product.jpg'">
        </div>
        <div class="order-item-details">
            <h4 class="order-item-name">${item.name}</h4>
            <div class="order-item-price">₹${priceNum.toFixed(2)} × ${item.quantity}</div>
            <div class="order-item-quantity">Qty: ${item.quantity}</div>
        </div>
        <div class="order-item-total">₹${itemTotal.toFixed(2)}</div>
    `;
    
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
    document.getElementById('order-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('order-shipping').textContent = shipping > 0 ? `₹${shipping.toFixed(2)}` : 'Free';
    document.getElementById('order-tax').textContent = `₹${tax.toFixed(2)}`;
    document.getElementById('order-discount').textContent = discount > 0 ? `-₹${discount.toFixed(2)}` : '₹0.00';
    document.getElementById('order-total').textContent = `₹${total.toFixed(2)}`;
    
    // Update the discount row visibility
    const discountRow = document.querySelector('.order-total-row.discount');
    if (discountRow) {
        discountRow.style.display = discount > 0 ? 'flex' : 'none';
    }
    
    // Store values for order processing
    window.checkoutData = {
        subtotal,
        shipping,
        tax,
        discount,
        total
    };
}

// Set up promo code functionality
function setupPromoCode() {
    const applyButton = document.getElementById('apply-promo');
    const promoInput = document.getElementById('promo-code');
    const promoMessage = document.getElementById('promo-message');
    
    if (!applyButton || !promoInput || !promoMessage) return;
    
    // Available promo codes
    const promoCodes = {
        'WELCOME10': { discount: 0.1, message: '10% discount applied!' },
        'SPICY20': { discount: 0.2, message: '20% discount applied!' },
        'FREESHIP': { discount: 0, message: 'Free shipping applied!', freeShipping: true },
        'FIRSTORDER': { discount: 0.15, message: '15% first order discount applied!' }
    };
    
    applyButton.addEventListener('click', function() {
        const code = promoInput.value.trim().toUpperCase();
        
        if (!code) {
            promoMessage.textContent = 'Please enter a promo code';
            promoMessage.className = 'promo-message error';
            return;
        }
        
        // Add loading state
        applyButton.disabled = true;
        applyButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        // Simulate API check with a small delay
        setTimeout(() => {
            const promoDetails = promoCodes[code];
            
            if (!promoDetails) {
                promoMessage.textContent = 'Invalid promo code';
                promoMessage.className = 'promo-message error';
                applyButton.disabled = false;
                applyButton.innerHTML = 'Apply';
                return;
            }
            
            // Apply discount
            const { subtotal, shipping, tax } = window.checkoutData;
            let newDiscount = 0;
            let newShipping = shipping;
            
            if (promoDetails.discount > 0) {
                newDiscount = subtotal * promoDetails.discount;
            }
            
            if (promoDetails.freeShipping) {
                newShipping = 0;
            }
            
            const newTotal = subtotal + newShipping + tax - newDiscount;
            
            // Update order summary
            updateOrderTotals(subtotal, newShipping, tax, newDiscount, newTotal);
            
            // Show success message
            promoMessage.textContent = promoDetails.message;
            promoMessage.className = 'promo-message success';
            
            // Store applied promo code
            window.checkoutData.appliedPromoCode = code;
            
            // Update button state and style input to show it's applied
            applyButton.disabled = true;
            applyButton.innerHTML = 'Applied';
            applyButton.classList.add('applied');
            promoInput.classList.add('code-applied');
            promoInput.readOnly = true;
            
            // Add a reset button
            const resetButton = document.createElement('button');
            resetButton.className = 'btn-small reset-promo';
            resetButton.innerHTML = '<i class="fas fa-times"></i>';
            resetButton.addEventListener('click', function() {
                // Reset to original values
                updateOrderTotals(subtotal, shipping, tax, 0, subtotal + shipping + tax);
                
                // Reset UI
                promoMessage.textContent = '';
                promoMessage.className = 'promo-message';
                applyButton.disabled = false;
                applyButton.innerHTML = 'Apply';
                applyButton.classList.remove('applied');
                promoInput.value = '';
                promoInput.classList.remove('code-applied');
                promoInput.readOnly = false;
                
                // Remove the reset button
                this.remove();
                
                // Remove stored promo code
                delete window.checkoutData.appliedPromoCode;
            });
            
            const promoForm = document.querySelector('.promo-form');
            if (promoForm && !document.querySelector('.reset-promo')) {
                promoForm.appendChild(resetButton);
            }
        }, 800);
    });
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
                items: await getCurrentCart(),
                ...window.checkoutData
            };
            
            // Process order
            const orderResult = await processOrder(orderData);
            
            if (orderResult.success) {
                // Show success modal
                showOrderSuccessModal(orderResult.order);
                
                // Clear cart
                localStorage.setItem('harnamCart', JSON.stringify([]));
                
                // If Firebase available, clear cart there too
                if (typeof window.FirebaseUtil !== 'undefined') {
                    const currentUser = getCurrentUser();
                    if (currentUser && currentUser.id) {
                        window.FirebaseUtil.cart.updateUserCart(currentUser.id, []);
                    }
                }
            } else {
                // Show error alert
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
                
                // Auto-hide after 5 seconds
                setTimeout(() => {
                    errorAlert.style.opacity = '0';
                    setTimeout(() => errorAlert.remove(), 300);
                }, 5000);
                
                // Add close button functionality
                errorAlert.querySelector('.close-alert').addEventListener('click', () => {
                    errorAlert.style.opacity = '0';
                    setTimeout(() => errorAlert.remove(), 300);
                });
                
                console.error('Order error:', orderResult.message);
            }
        } catch (error) {
            console.error('Order submission error:', error);
            alert('An unexpected error occurred. Please try again.');
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
    // Check if user is logged in
    const currentUser = getCurrentUser();
    if (!currentUser) {
        return { success: false, message: 'User not authenticated' };
    }
    
    try {
        // Use Firebase if available
        if (typeof window.FirebaseUtil !== 'undefined') {
            const result = await window.FirebaseUtil.orders.createOrder(currentUser.id, {
                items: orderData.items,
                total: orderData.total,
                address: orderData.address,
                customer: orderData.customer,
                payment: orderData.payment,
                subtotal: orderData.subtotal,
                shipping: orderData.shipping,
                tax: orderData.tax,
                discount: orderData.discount,
                appliedPromoCode: orderData.appliedPromoCode,
                dateCreated: orderData.dateCreated
            });
            
            // If successful, add order number
            if (result.success && result.orderId) {
                result.order = {
                    id: result.orderId,
                    orderDate: new Date().toISOString(),
                    status: 'Processing',
                    ...orderData
                };
            }
            
            return result;
        }
        
        // Fallback to localStorage implementation
        const newOrder = {
            id: 'order_' + Date.now(),
            orderDate: new Date().toISOString(),
            status: 'Processing',
            items: orderData.items,
            total: orderData.total,
            address: orderData.address,
            customer: orderData.customer,
            payment: orderData.payment,
            subtotal: orderData.subtotal,
            shipping: orderData.shipping,
            tax: orderData.tax,
            discount: orderData.discount,
            appliedPromoCode: orderData.appliedPromoCode
        };
        
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
    document.getElementById('success-order-total').textContent = `₹${order.total.toFixed(2)}`;
    
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
