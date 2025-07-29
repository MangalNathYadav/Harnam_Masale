# 03. Cart and Checkout

## Overview
The cart and checkout modules handle the shopping flow from adding products to finalizing orders. Both desktop and mobile versions are supported, with real-time updates and Firebase integration.

## Features
- Add/remove/update products in cart
- Cart summary (items, quantity, total price)
- Apply promo codes and discounts
- Guest and authenticated user support
- Checkout form (address, contact, payment method)
- Order confirmation and summary
- Real-time cart sync with Firebase

## Components
- **Cart Page:**
  - Desktop: `cart/` folder and `cart.js`, styled by `css/cart.css`
  - Mobile: `mobile_harnam_food/cart.html`, `mobile_harnam_food/js/cart.js`
- **Checkout Page:**
  - Desktop: `checkout.html`, logic in `js/checkout.js`, styled by `css/checkout.css`
  - Mobile: `mobile_harnam_food/checkout.html`, `mobile_harnam_food/js/checkout.js`
- **Promo Code:**
  - Logic in `js/remove-discount.js` and `admin/admin-promo-codes.js`
- **Order Confirmation:**
  - Desktop: Shown after successful checkout
  - Mobile: Shown in `mobile_harnam_food/orders.html`

## Styling
- Cart: `css/cart.css` (desktop), `mobile_harnam_food/css/cart/` (mobile)
- Checkout: `css/checkout.css` (desktop), `mobile_harnam_food/css/mobile-checkout.css` (mobile)

## Scripts
- Cart logic: `js/cart.js`, `mobile_harnam_food/js/cart.js`
- Checkout logic: `js/checkout.js`, `mobile_harnam_food/js/checkout.js`
- Promo code: `js/remove-discount.js`, `admin/js/admin-promo-codes.js`

## Firebase Integration
- Cart and order data stored in Firebase Realtime Database
- Auth integration for user-specific carts and orders

---
Next: [Authentication Documentation](04_authentication.md)
