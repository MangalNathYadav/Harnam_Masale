// Mobile Checkout Logic for Harnam Masale
// Adapts desktop checkout.js for mobile layout and conventions

document.addEventListener('DOMContentLoaded', function() {
            // Stepper navigation
            const steps = ['customer-info', 'shipping-address', 'payment-method', 'review-confirm'];
            let currentStepIndex = 0;

            // Elements
            const form = document.getElementById('mobile-checkout-form');
            const stepSections = document.querySelectorAll('.checkout-step');
            const stepIndicators = document.querySelectorAll('.step-indicator');
            const orderItemsContainer = document.getElementById('order-items');
            const reviewOrderItems = document.getElementById('review-order-items');
            const promoInput = document.getElementById('promo-code');
            const applyPromoBtn = document.getElementById('apply-promo');
            const promoMsg = document.getElementById('promo-message');
            const orderSubtotal = document.getElementById('order-subtotal');
            const orderShipping = document.getElementById('order-shipping');
            const orderTax = document.getElementById('order-tax');
            const orderDiscount = document.getElementById('order-discount');
            const orderTotal = document.getElementById('order-total');
            const discountRow = document.querySelector('.order-total-row.discount');
            const placeOrderBtn = document.getElementById('place-order-btn');
            const orderSuccessModal = document.getElementById('order-success-modal');

            let cart = [];
            let discount = 0;
            let promoDetails = null;
            let totals = { subtotal: 0, shipping: 0, tax: 0, total: 0 };
            let cartListener = null;
            let userListener = null;

            // Stepper navigation logic
            function showStep(index) {
                const oldStep = document.querySelector('.checkout-step.active-step');
                const newStep = stepSections[index];
                
                oldStep.style.opacity = '0';
                oldStep.style.transform = 'translateX(-10px)';
                
                setTimeout(() => {
                    stepSections.forEach((section, i) => {
                        section.classList.toggle('active-step', i === index);
                    });
                    stepIndicators.forEach((indicator, i) => {
                        indicator.classList.toggle('active', i === index);
                    });
                    
                    newStep.style.opacity = '1';
                    newStep.style.transform = 'translateX(0)';
                    currentStepIndex = index;
                }, 200);
            }
            document.querySelectorAll('.next-step').forEach(btn => {
                btn.addEventListener('click', function() {
                    if (!validateStep(currentStepIndex)) return;
                    showStep(currentStepIndex + 1);
                });
            });
            document.querySelectorAll('.prev-step').forEach(btn => {
                btn.addEventListener('click', function() {
                    showStep(currentStepIndex - 1);
                });
            });

            // --- Real-time cart and user info from Firebase ---
            async function setupRealtimeFirebase() {
                if (!(window.firebase && firebase.auth && firebase.auth().currentUser)) {
                    loadCartFromLocal();
                    return;
                }
                
                try {
                    const user = firebase.auth().currentUser;
                    const cartRef = firebase.database().ref(`users/${user.uid}/cart`);
                    const userRef = firebase.database().ref(`users/${user.uid}`);
                    
                    // Clear previous listeners
                    if (cartListener) cartListener();
                    if (userListener) userListener();
                    
                    // Setup new listeners
                    cartListener = cartRef.on('value', snapshot => {
                        cart = snapshot.val() || [];
                        if (!Array.isArray(cart)) cart = Object.values(cart);
                        // --- REMOVE THIS REDIRECT ---
                        // if (!cart || cart.length === 0) {
                        //     window.location.href = 'cart.html';
                        //     return;
                        // }
                        // --- Instead, just update UI ---
                        if (!cart || cart.length === 0) {
                            // Optionally, you can show an empty state or do nothing
                            // Do not redirect!
                        }
                        displayOrderSummary();
                        displayReviewOrderItems();
                    });
                    
                    userListener = userRef.on('value', snapshot => {
                        const userData = snapshot.val() || {};
                        prefillUserForm(user, userData);
                    });
                } catch (error) {
                    console.error('Firebase setup error:', error);
                    loadCartFromLocal();
                }
            }

            function prefillUserForm(authUser, userData) {
                // Name
                let firstName = '',
                    lastName = '';
                if (userData.name) {
                    const nameParts = userData.name.split(' ');
                    firstName = nameParts[0] || '';
                    lastName = nameParts.slice(1).join(' ') || '';
                } else if (authUser.displayName) {
                    const nameParts = authUser.displayName.split(' ');
                    firstName = nameParts[0] || '';
                    lastName = nameParts.slice(1).join(' ') || '';
                }
                form['first-name'].value = firstName;
                form['last-name'].value = lastName;
                // Email
                form['email'].value = userData.email || authUser.email || '';
                // Phone
                form['phone'].value = userData.phone || '';
                // Address
                if (userData.address) {
                    form['address1'].value = userData.address.address1 || '';
                    form['address2'].value = userData.address.address2 || '';
                    form['city'].value = userData.address.city || '';
                    form['state'].value = userData.address.state || '';
                    form['pincode'].value = userData.address.pincode || '';
                    form['country'].value = userData.address.country || 'India';
                }
            }

            function loadCartFromLocal() {
                cart = JSON.parse(localStorage.getItem('cart') || '[]');
                if (!cart || cart.length === 0) {
                    showEmptyCartMessage();
                    return;
                }
                displayOrderSummary();
                displayReviewOrderItems();
            }

            // --- End real-time logic ---

            // Display order summary
            function displayOrderSummary() {
                // Check if elements exist first
                const orderItemsContainer = document.getElementById('order-items');
                const summaryTotal = document.querySelector('.order-summary-total .amount');
                const expandedTotal = document.getElementById('order-total-expanded');
                const orderSubtotal = document.getElementById('order-subtotal');
                const orderShipping = document.getElementById('order-shipping');
                const orderTax = document.getElementById('order-tax');
                const orderDiscount = document.getElementById('order-discount');
                const orderTotal = document.getElementById('order-total');
                const discountRow = document.querySelector('.order-total-row.discount');

                if (!orderItemsContainer) {
                    console.error('Order items container not found');
                    return;
                }

                orderItemsContainer.innerHTML = '';
                let subtotal = 0;
                let itemCount = 0;

                // Product list
                cart.forEach(item => {
                    const price = parseFloat((item.price || '0').toString().replace(/[^\d.]/g, '')) || 0;
                    const qty = parseInt(item.quantity) || 1;
                    subtotal += price * qty;
                    itemCount += qty;
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'order-item';
                    itemDiv.innerHTML = `
                        <div class="order-item-image">
                            <img src="${item.image || '../assets/images/placeholder-product.jpg'}" alt="${item.name}" onerror="this.src='../assets/images/placeholder-product.jpg'">
                        </div>
                        <div class="order-item-details">
                            <h4 class="order-item-name">${item.name}</h4>
                            <div class="order-item-price">₹${price.toFixed(2)} × ${qty}</div>
                            <div class="order-item-quantity">Qty: ${qty}</div>
                        </div>
                        <div class="order-item-total">₹${(price*qty).toFixed(2)}</div>
                    `;
                    orderItemsContainer.appendChild(itemDiv);
                });

                // Calculate totals
                const shipping = calculateShipping(subtotal);
                const tax = calculateTax(subtotal);
                let appliedDiscount = parseFloat(sessionStorage.getItem('harnamDiscount')) || 0;
                let promoCode = '';
                
                try {
                    const savedPromo = sessionStorage.getItem('harnamPromo');
                    if (savedPromo) {
                        const promoObj = JSON.parse(savedPromo);
                        promoCode = promoObj.code || '';
                    }
                } catch (e) {
                    console.error('Error parsing promo:', e);
                }

                const total = subtotal + shipping + tax - appliedDiscount;

                // Update totals display
                if (summaryTotal) summaryTotal.textContent = `₹${total.toFixed(2)}`;
                if (expandedTotal) expandedTotal.textContent = `₹${total.toFixed(2)}`;

                // Create totals HTML
                const totalsHTML = `
                    <div class="order-totals">
                        <div class="order-total-row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
                        <div class="order-total-row"><span>Shipping</span><span>${shipping > 0 ? `₹${shipping.toFixed(2)}` : 'Free'}</span></div>
                        <div class="order-total-row"><span>Tax</span><span>₹${tax.toFixed(2)}</span></div>
                        ${appliedDiscount > 0 ? `<div class="order-total-row discount"><span>Discount${promoCode ? ` (${promoCode})` : ''}</span><span>-₹${appliedDiscount.toFixed(2)}</span></div>` : ''}
                        <div class="order-total-row grand-total"><span>Total</span><span>₹${total.toFixed(2)}</span></div>
                    </div>
                `;

                // Add totals to container
                const totalsContainer = document.createElement('div');
                totalsContainer.innerHTML = totalsHTML;
                orderItemsContainer.appendChild(totalsContainer);

                // Update other UI elements if they exist
                if (orderSubtotal) orderSubtotal.textContent = `₹${subtotal.toFixed(2)}`;
                if (orderShipping) orderShipping.textContent = shipping > 0 ? `₹${shipping.toFixed(2)}` : 'Free';
                if (orderTax) orderTax.textContent = `₹${tax.toFixed(2)}`;
                if (orderDiscount) orderDiscount.textContent = appliedDiscount > 0 ? `-₹${appliedDiscount.toFixed(2)}` : '₹0.00';
                if (orderTotal) orderTotal.textContent = `₹${total.toFixed(2)}`;
                if (discountRow) discountRow.style.display = appliedDiscount > 0 ? 'flex' : 'none';

                // Store totals for order placement
                totals = { subtotal, shipping, tax, total };
            }

    // Display review order items
    function displayReviewOrderItems() {
        reviewOrderItems.innerHTML = '';
        cart.forEach(item => {
            const price = parseFloat((item.price || '0').toString().replace(/[^\d.]/g, '')) || 0;
            const qty = parseInt(item.quantity) || 1;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'order-item';
            itemDiv.innerHTML = `<div class="order-item-image"><img src="${item.image||'../assets/images/placeholder-product.jpg'}" alt="${item.name}"></div><div class="order-item-details"><h4>${item.name}</h4><div>₹${price.toFixed(2)} × ${qty}</div></div><div class="order-item-total">₹${(price*qty).toFixed(2)}</div>`;
            reviewOrderItems.appendChild(itemDiv);
        });
    }

    // Promo code logic
    applyPromoBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        const code = promoInput.value.trim();
        if (!code) return;
        promoMsg.textContent = 'Checking...';
        promoMsg.className = 'promo-message info';
        try {
            const valid = await validatePromoCode(code);
            if (valid) {
                discount = valid.value;
                promoDetails = valid;
                sessionStorage.setItem('harnamDiscount', discount);
                sessionStorage.setItem('harnamPromo', JSON.stringify(valid));
                promoMsg.textContent = `Promo applied: -₹${discount}`;
                promoMsg.className = 'promo-message success';
            } else {
                discount = 0;
                promoDetails = null;
                sessionStorage.removeItem('harnamDiscount');
                sessionStorage.removeItem('harnamPromo');
                promoMsg.textContent = 'Invalid or expired promo code.';
                promoMsg.className = 'promo-message error';
            }
        } catch (err) {
            promoMsg.textContent = 'Could not validate promo. Try again.';
            promoMsg.className = 'promo-message error';
        }
        displayOrderSummary();
    });
    // Validate promo code from Firebase RTDB
    async function validatePromoCode(code) {
        if (window.firebase && firebase.database) {
            const snap = await firebase.database().ref('promos/' + code.toUpperCase()).once('value');
            const promo = snap.val();
            if (promo && promo.active !== false) {
                // Optionally check for expiry, usage limits, etc.
                return { code: code.toUpperCase(), value: Number(promo.value), type: promo.type || 'flat', id: snap.key };
            }
        }
        return null;
    }

    // Calculate shipping/tax
    function calculateShipping(subtotal) { return subtotal >= 499 ? 0 : 40; }

    function calculateTax(subtotal) { return +(subtotal * 0.05).toFixed(2); }

    // Step validation
    function validateStep(index) {
        const section = stepSections[index];
        const inputs = section.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]), select');
        let valid = true;

        inputs.forEach(input => {
            input.classList.remove('input-error');
            if (input.hasAttribute('required') && !input.value.trim()) {
                input.classList.add('input-error');
                valid = false;
            }
            if (input.pattern && input.value) {
                const regex = new RegExp(input.pattern);
                if (!regex.test(input.value)) {
                    input.classList.add('input-error');
                    valid = false;
                }
            }
            if (input.type === 'email' && input.value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(input.value)) {
                    input.classList.add('input-error');
                    valid = false;
                }
            }
        });

        // Special validation for payment step
        if (index === 2) {
            const termsChecked = form['terms'].checked;
            if (!termsChecked) {
                document.querySelector('.terms-check').classList.add('input-error');
                valid = false;
            } else {
                document.querySelector('.terms-check').classList.remove('input-error');
            }
        }

        return valid;
    }

    // Review step: populate summary fields
    form.addEventListener('transitionend', function() {
        if (currentStepIndex === 3) {
            document.getElementById('summary-name').textContent = `${form['first-name'].value} ${form['last-name'].value}`;
            document.getElementById('summary-email').textContent = form['email'].value;
            document.getElementById('summary-phone').textContent = form['phone'].value;
            document.getElementById('summary-address').innerHTML = `${form['address1'].value}<br>${form['address2'].value ? form['address2'].value+'<br>':''}${form['city'].value}, ${form['state'].value} ${form['pincode'].value}<br>${form['country'].value}`;
            const payment = form['payment'].value;
            document.getElementById('summary-payment').textContent = payment === 'cod' ? 'Cash on Delivery' : payment.toUpperCase();
        }
    });

    // Utility: Convert image URL to base64 (async)
function imageUrlToBase64(url) {
    return new Promise(resolve => {
        if (!url || url.startsWith('data:')) return resolve(url || '');
        const img = new window.Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width; canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = function() { resolve(''); };
        img.src = url;
    });
}

// Place order
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!validateStep(currentStepIndex)) return;

    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    try {
        // Convert all product images to base64 before placing order
        const itemsWithBase64 = await Promise.all(cart.map(async item => {
            const imageBase64 = await imageUrlToBase64(item.image);
            return {
                id: item.id,
                name: item.name,
                price: parseFloat(item.price) || 0,
                quantity: parseInt(item.quantity) || 1,
                imageBase64: imageBase64 || '', // always base64
            };
        }));

        const orderData = {
            customer: {
                firstName: form['first-name'].value,
                lastName: form['last-name'].value,
                email: form['email'].value,
                phone: form['phone'].value
            },
            address: {
                address1: form['address1'].value,
                address2: form['address2'].value,
                city: form['city'].value,
                state: form['state'].value,
                pincode: form['pincode'].value,
                country: form['country'].value
            },
            payment: form['payment'].value,
            terms: form['terms'].checked,
            dateCreated: new Date().toISOString(),
            status: 'pending',
            items: itemsWithBase64,
            totals: {
                subtotal: totals.subtotal,
                shipping: totals.shipping,
                tax: totals.tax,
                discount: discount || 0,
                total: totals.total
            },
            promo: promoDetails,
            estimatedDelivery: getEstimatedDeliveryDate()
        };

        let orderId;
        if (window.firebase && firebase.auth().currentUser) {
            const user = firebase.auth().currentUser;
            // Save order to RTDB
            const orderRef = firebase.database().ref(`orders/${user.uid}`).push();
            await orderRef.set({
                ...orderData,
                userId: user.uid,
                orderId: orderRef.key
            });

            // Clear cart in Firebase and localStorage
            await firebase.database().ref(`users/${user.uid}/cart`).remove();
            localStorage.removeItem('cart');

            // Update promo usage if applied
            if (promoDetails && promoDetails.code) {
                const promoRef = firebase.database().ref('promos/' + promoDetails.code);
                promoRef.child('usageCount').transaction(count => (count || 0) + 1);
            }

            orderId = orderRef.key;
        } else {
            // Guest checkout
            orderId = 'GUEST_' + Date.now();
            const orders = JSON.parse(localStorage.getItem('orders') || '[]');
            orders.push({ ...orderData, orderId });
            localStorage.setItem('orders', JSON.stringify(orders));
            localStorage.removeItem('cart');
        }

        // Clear promo codes
        sessionStorage.removeItem('harnamDiscount');
        sessionStorage.removeItem('harnamPromo');

        // Show success modal/card (not redirect)
        showOrderSuccess(orderId, orderData);

    } catch (error) {
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = 'Place Order';
        alert('Order failed. Please try again.');
    }
});

    function showOrderSuccess(orderId, orderData) {
        const modal = document.getElementById('order-success-modal');
        const form = document.getElementById('mobile-checkout-form');
        const summarySection = document.querySelector('.mobile-order-summary');

        if (!modal) {
            console.error('Success modal not found');
            return;
        }

        // Update success modal content
        document.getElementById('success-order-number').textContent = orderId;
        document.getElementById('success-order-date').textContent = new Date().toLocaleDateString();
        document.getElementById('success-payment-method').textContent =
            orderData.payment === 'cod' ? 'Cash on Delivery' : (orderData.payment || '').toUpperCase();
        document.getElementById('success-order-total').textContent =
            '₹' + (orderData.totals && orderData.totals.total ? orderData.totals.total.toFixed(2) : '0.00');
        document.getElementById('success-delivery-date').textContent =
            orderData.estimatedDelivery || '';

        // Hide checkout form and summary
        if (form) form.style.display = 'none';
        if (summarySection) summarySection.style.display = 'none';

        // Show modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Add confetti effect
        createConfetti();
    }

    function createConfetti() {
        const colors = ['#e63946', '#457b9d', '#1d3557', '#f1faee'];
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            confetti.style.opacity = Math.random();
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 5000);
        }
    }

    function getEstimatedDeliveryDate() {
        const d = new Date();
        d.setDate(d.getDate() + 4);
        return d.toLocaleDateString();
    }

    // Initial load: setup real-time listeners
    if (window.firebase && firebase.auth) {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                setupRealtimeFirebase();
            } else {
                loadCartFromLocal();
            }
        });
    } else {
        loadCartFromLocal();
    }
});


// Add to mobile-checkout.js
document.getElementById('expand-summary').addEventListener('click', function() {
    document.getElementById('order-summary-details').classList.add('expanded');
    document.getElementById('summary-overlay').classList.add('active');
});

document.getElementById('close-summary').addEventListener('click', function() {
    document.getElementById('order-summary-details').classList.remove('expanded');
    document.getElementById('summary-overlay').classList.remove('active');
});

document.getElementById('summary-overlay').addEventListener('click', function() {
    document.getElementById('order-summary-details').classList.remove('expanded');
    this.classList.remove('active');
});