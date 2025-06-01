// Cart State
let cart = {
    items: [],
    total: 0
};

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartUI();
    }
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

// Add item to cart
function addToCart(product) {
    const existingItem = cart.items.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.items.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }

    updateCartTotal();
    saveCart();
    showToast('Item added to cart!', 'success');
}

// Remove item from cart
function removeFromCart(productId) {
    cart.items = cart.items.filter(item => item.id !== productId);
    updateCartTotal();
    saveCart();
    showToast('Item removed from cart!', 'info');
}

// Update item quantity
function updateQuantity(productId, change) {
    const item = cart.items.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCartTotal();
            saveCart();
        }
    }
}

// Calculate cart total
function updateCartTotal() {
    cart.total = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Update cart UI
function updateCartUI() {
    const cartCount = document.querySelector('.cart-count');
    const cartItems = document.querySelector('.cart-items');
    const totalAmount = document.querySelector('.total-amount');

    // Update cart count
    cartCount.textContent = cart.items.reduce((count, item) => count + item.quantity, 0);

    // Update cart items
    if (cartItems) {
        if (cart.items.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                </div>
            `;
        } else {
            cartItems.innerHTML = cart.items.map(item => `
                <div class="cart-item" data-id="${item.id}">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                    <div class="cart-item-details">
                        <h4 class="cart-item-title">${item.name}</h4>
                        <div class="cart-item-price">₹${item.price}</div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                        </div>
                    </div>
                    <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
        }
    }

    // Update total amount
    if (totalAmount) {
        totalAmount.textContent = `₹${cart.total.toFixed(2)}`;
    }
}

// Toggle cart sidebar
function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    cartSidebar.classList.toggle('active');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load cart from localStorage
    loadCart();

    // Cart button click
    const cartBtn = document.getElementById('cartBtn');
    cartBtn.addEventListener('click', toggleCart);

    // Close cart button click
    const closeCart = document.querySelector('.close-cart');
    closeCart.addEventListener('click', toggleCart);

    // Checkout button click
    const checkoutBtn = document.querySelector('.btn-checkout');
    checkoutBtn.addEventListener('click', () => {
        if (!auth.currentUser) {
            showToast('Please login to checkout!', 'error');
            toggleCart();
            showAuthModal();
            return;
        }

        if (cart.items.length === 0) {
            showToast('Your cart is empty!', 'error');
            return;
        }

        toggleCart();
        showCheckoutModal();
    });
});

// Add to cart button click handler for product cards
function setupAddToCartButtons() {
    document.querySelectorAll('.shop-now-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const productCard = button.closest('.product-card');
            const product = {
                id: productCard.dataset.id,
                name: productCard.querySelector('h3').textContent,
                price: parseFloat(productCard.querySelector('.price').textContent.replace('₹', '')),
                image: productCard.querySelector('.product-img').src
            };
            addToCart(product);
        });
    });
}

// Initialize cart functionality when products are loaded
document.addEventListener('productsLoaded', setupAddToCartButtons);