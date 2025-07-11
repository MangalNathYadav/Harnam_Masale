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

    // Recalculate totals without discount
    const cart = JSON.parse(localStorage.getItem('harnamCart')) || [];
    const subtotal = calculateSubtotal(cart);
    const shipping = getShippingCost();
    const tax = getTax(subtotal);
    const total = subtotal + shipping + tax;
    updateOrderTotals(subtotal, shipping, tax, 0, total);
    updateReviewOrderSummary();
}
