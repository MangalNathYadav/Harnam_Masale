// Products page specific functionality

document.addEventListener('DOMContentLoaded', function() {
    // Disable all cart functionality
    document.querySelectorAll('.add-to-cart-btn, .product-action-btn').forEach(button => {
        const isCartButton = button.querySelector('.fa-shopping-cart') !== null || 
                           button.classList.contains('add-to-cart-btn');
        
        if (isCartButton) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                showToast('Coming Soon! �');
            });
        }
    });
});

// Show toast message function
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(toast);
    
    // Add show class to trigger animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
