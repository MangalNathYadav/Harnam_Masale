// Show Checkout Modal
function showCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    const user = auth.currentUser;

    if (user) {
        // Fetch user's default address if exists
        db.collection('users').doc(user.uid).collection('addresses')
            .where('isDefault', '==', true)
            .limit(1)
            .get()
            .then(snapshot => {
                if (!snapshot.empty) {
                    const address = snapshot.docs[0].data();
                    fillAddressForm(address);
                }
            });
    }

    modal.classList.add('active');
}

// Fill Address Form
function fillAddressForm(address) {
    const form = document.getElementById('checkoutForm');
    form.querySelector('input[placeholder="Full Name"]').value = address.fullName;
    form.querySelector('input[placeholder="Address Line 1"]').value = address.addressLine1;
    form.querySelector('input[placeholder="Address Line 2"]').value = address.addressLine2 || '';
    form.querySelector('input[placeholder="City"]').value = address.city;
    form.querySelector('input[placeholder="State"]').value = address.state;
    form.querySelector('input[placeholder="PIN Code"]').value = address.pinCode;
    form.querySelector('input[placeholder="Phone Number"]').value = address.phone;
}

// Handle Checkout Form Submit
document.getElementById('checkoutForm').addEventListener('submit', async(e) => {
    e.preventDefault();
    const form = e.target;
    const user = auth.currentUser;

    if (!user) {
        showToast('Please login to continue!', 'error');
        return;
    }

    try {
        showLoading();

        // Get form data
        const formData = {
            fullName: form.querySelector('input[placeholder="Full Name"]').value,
            addressLine1: form.querySelector('input[placeholder="Address Line 1"]').value,
            addressLine2: form.querySelector('input[placeholder="Address Line 2"]').value,
            city: form.querySelector('input[placeholder="City"]').value,
            state: form.querySelector('input[placeholder="State"]').value,
            pinCode: form.querySelector('input[placeholder="PIN Code"]').value,
            phone: form.querySelector('input[placeholder="Phone Number"]').value
        };

        // Get payment method
        const paymentMethod = form.querySelector('input[name="payment"]:checked').value;

        // Create order in Firestore
        const orderRef = await db.collection('orders').add({
            userId: user.uid,
            items: cart.items,
            total: cart.total,
            shippingAddress: formData,
            paymentMethod: paymentMethod,
            status: paymentMethod === 'cod' ? 'Pending' : 'Payment Required',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Generate order ID
        const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
        await orderRef.update({ orderId });

        // Save address to user's addresses if not exists
        const addressQuery = await db.collection('users').doc(user.uid).collection('addresses')
            .where('addressLine1', '==', formData.addressLine1)
            .where('pinCode', '==', formData.pinCode)
            .get();

        if (addressQuery.empty) {
            await db.collection('users').doc(user.uid).collection('addresses').add({
                ...formData,
                isDefault: false
            });
        }

        // Handle payment based on method
        if (paymentMethod === 'online') {
            // Implement payment gateway integration here
            // For now, we'll just simulate a successful payment
            await processOnlinePayment(orderRef.id);
        } else {
            // For COD, clear cart and show success message
            clearCart();
            showToast('Order placed successfully!', 'success');
            document.getElementById('checkoutModal').classList.remove('active');
        }

    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
});

// Process Online Payment (Simulation)
async function processOnlinePayment(orderId) {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update order status
    await db.collection('orders').doc(orderId).update({
        status: 'Processing',
        paymentStatus: 'Paid'
    });

    // Clear cart and show success message
    clearCart();
    showToast('Payment successful! Order placed.', 'success');
    document.getElementById('checkoutModal').classList.remove('active');
}

// Clear Cart
function clearCart() {
    cart = {
        items: [],
        total: 0
    };
    saveCart();
}

// Close Checkout Modal
document.querySelector('#checkoutModal .close-modal').addEventListener('click', () => {
    document.getElementById('checkoutModal').classList.remove('active');
});