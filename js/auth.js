// Temporary user for testing
const TEMP_USER = {
    email: 'admin',
    password: 'admin',
    fullName: 'Admin User',
    isAdmin: true
};

// Auth State Observer
let currentUser = null;

function updateAuthUI() {
    const authBtn = document.getElementById('authBtn');
    if (currentUser) {
        authBtn.innerHTML = `
            <i class="fas fa-user-check"></i>
            <span>${currentUser.fullName}</span>
        `;
        authBtn.onclick = showProfile;
    } else {
        authBtn.innerHTML = `
            <i class="fas fa-user"></i>
            <span>Login</span>
        `;
        authBtn.onclick = showAuthModal;
    }
}

// Show Auth Modal
function showAuthModal() {
    const modal = document.getElementById('authModal');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    modal.classList.add('active');
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
}

// Close Auth Modal
function closeAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.remove('active');
}

// Toggle between Login and Signup forms
document.getElementById('showSignup').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
});

document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
});

// Close modal when clicking outside
document.getElementById('authModal').addEventListener('click', (e) => {
    if (e.target.id === 'authModal') {
        closeAuthModal();
    }
});

// Close button functionality
document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', closeAuthModal);
});

// Login Form Submit
document.querySelector('#loginForm form').addEventListener('submit', async(e) => {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;

    // Temporary login check
    if (email === TEMP_USER.email && password === TEMP_USER.password) {
        currentUser = TEMP_USER;
        updateAuthUI();
        closeAuthModal();
        showToast('Successfully logged in!', 'success');

        // Load admin features if user is admin
        if (currentUser.isAdmin) {
            loadAdminFeatures();
        }
    } else {
        showToast('Invalid credentials', 'error');
    }
});

// Signup Form Submit
document.querySelector('#signupForm form').addEventListener('submit', async(e) => {
    e.preventDefault();
    const fullName = e.target.querySelector('input[type="text"]').value;
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;
    const confirmPassword = e.target.querySelectorAll('input[type="password"]')[1].value;

    if (password !== confirmPassword) {
        showToast('Passwords do not match!', 'error');
        return;
    }

    try {
        showLoading();
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);

        // Add user profile to Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
            fullName: fullName,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        closeAuthModal();
        showToast('Account created successfully!', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
});

// Show Profile Modal
function showProfile() {
    const profileModal = document.getElementById('profileModal');
    const user = auth.currentUser;

    if (user) {
        // Fetch user data from Firestore
        db.collection('users').doc(user.uid).get()
            .then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    document.querySelector('#profileForm input[type="text"]').value = userData.fullName;
                    document.querySelector('#profileForm input[type="email"]').value = userData.email;
                    document.querySelector('#profileForm input[type="tel"]').value = userData.phone || '';
                }
            });

        // Fetch order history
        db.collection('orders')
            .where('userId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .get()
            .then(snapshot => {
                const orderHistory = document.querySelector('.order-history');
                orderHistory.innerHTML = '';

                if (snapshot.empty) {
                    orderHistory.innerHTML = '<p>No orders yet</p>';
                    return;
                }

                snapshot.forEach(doc => {
                    const order = doc.data();
                    const orderElement = createOrderElement(order);
                    orderHistory.appendChild(orderElement);
                });
            });

        // Fetch saved addresses
        db.collection('users').doc(user.uid).collection('addresses')
            .get()
            .then(snapshot => {
                const addressesContainer = document.querySelector('.saved-addresses');
                addressesContainer.innerHTML = '';

                if (snapshot.empty) {
                    addressesContainer.innerHTML = '<p>No saved addresses</p>';
                    return;
                }

                snapshot.forEach(doc => {
                    const address = doc.data();
                    const addressElement = createAddressElement(address, doc.id);
                    addressesContainer.appendChild(addressElement);
                });
            });

        profileModal.classList.add('active');
    }
}

// Create Order Element
function createOrderElement(order) {
    const div = document.createElement('div');
    div.className = 'order-item';
    div.innerHTML = `
        <div class="order-header">
            <span class="order-id">Order #${order.orderId}</span>
            <span class="order-date">${new Date(order.createdAt.toDate()).toLocaleDateString()}</span>
        </div>
        <div class="order-items">
            ${order.items.map(item => `
                <div class="order-product">
                    <span>${item.name}</span>
                    <span>x${item.quantity}</span>
                    <span>₹${item.price}</span>
                </div>
            `).join('')}
        </div>
        <div class="order-footer">
            <span class="order-total">Total: ₹${order.total}</span>
            <span class="order-status ${order.status.toLowerCase()}">${order.status}</span>
        </div>
    `;
    return div;
}

// Create Address Element
function createAddressElement(address, addressId) {
    const div = document.createElement('div');
    div.className = 'address-item';
    div.innerHTML = `
        <div class="address-content">
            <h4>${address.fullName}</h4>
            <p>${address.addressLine1}</p>
            <p>${address.addressLine2 || ''}</p>
            <p>${address.city}, ${address.state} - ${address.pinCode}</p>
            <p>Phone: ${address.phone}</p>
        </div>
        <div class="address-actions">
            <button class="btn-edit" onclick="editAddress('${addressId}')">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-delete" onclick="deleteAddress('${addressId}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    return div;
}

// Update Profile
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const fullName = e.target.querySelector('input[type="text"]').value;
    const phone = e.target.querySelector('input[type="tel"]').value;

    try {
        showLoading();
        await db.collection('users').doc(user.uid).update({
            fullName,
            phone
        });
        showToast('Profile updated successfully!', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
});

// Sign Out
function signOut() {
    currentUser = null;
    updateAuthUI();
    showToast('Signed out successfully!', 'success');
}

// Load Admin Features
function loadAdminFeatures() {
    const adminSection = document.createElement('div');
    adminSection.className = 'admin-panel';
    adminSection.innerHTML = `
        <div class="admin-header">
            <h2>Admin Panel</h2>
            <button class="btn-primary" onclick="openAddProductModal()">Add Product</button>
        </div>
        <div class="admin-grid">
            <div class="admin-card">
                <i class="fas fa-box"></i>
                <h3>Products</h3>
                <p>Manage your products</p>
                <button class="btn-secondary" onclick="showProductManager()">Manage</button>
            </div>
            <div class="admin-card">
                <i class="fas fa-users"></i>
                <h3>Orders</h3>
                <p>View and manage orders</p>
                <button class="btn-secondary" onclick="showOrderManager()">Manage</button>
            </div>
            <div class="admin-card">
                <i class="fas fa-cog"></i>
                <h3>Settings</h3>
                <p>Configure store settings</p>
                <button class="btn-secondary" onclick="showStoreSettings()">Manage</button>
            </div>
        </div>
    `;

    // Add admin panel after products section
    const productsSection = document.getElementById('products');
    productsSection.parentNode.insertBefore(adminSection, productsSection.nextSibling);
}

// Initialize auth state
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
});