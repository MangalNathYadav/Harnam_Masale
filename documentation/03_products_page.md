# 02. Products Page (`products.html`)

## Overview
The products page displays all available spice products, allowing users to browse, filter, and add items to their cart. It is designed for both desktop and mobile users, with responsive layouts.

## Features
- Product grid/list view
- Product cards with image, name, price, and description
- Add to cart button for each product
- Product filtering and search (by category, name, etc.)
- Dynamic loading from Firebase database
- Discount and promo code display (if available)

## Components
- **Product Card:** Shows product image (`assets/images/`), name, price, and description.
- **Add to Cart Button:** Triggers cart logic in `js/cart.js`.
- **Filter/Search Bar:** Allows users to filter products (see `js/products.js`).
- **Discount Banner:** Displays active discounts (see `js/remove-discount.js`).

## Styling
- Main styles in `css/products.css` and `css/common.css`.
- Responsive grid for desktop and mobile.

## Scripts
- Product logic in `js/products.js`.
- Cart integration in `js/cart.js`.
- Discount logic in `js/remove-discount.js`.

## Mobile Version
See `mobile_harnam_food/products.html` for mobile-specific product listing and features.

---
Next: [Cart and Checkout Documentation](03_cart_checkout.md)
