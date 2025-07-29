# 06. Orders and Order History

## Overview
Order management allows users to view, track, and manage their orders. Orders are stored in Firebase and are accessible from both desktop and mobile interfaces.

## Features
- Order placement during checkout
- Order summary and confirmation modal
- Order history listing for logged-in users
- Order details modal with item breakdown, shipping info, and status
- Order status tracking (pending, shipped, delivered, cancelled)
- Cancel order option (within 24 hours)
- Download invoice as image (desktop)
- Real-time updates from Firebase

## Desktop Implementation
- **Pages:** `orders.html`
- **Styles:** `css/orders.css`, `css/common.css`
- **Scripts:** `js/orders.js`, `js/checkout.js`
  - Fetches orders from Firebase for the logged-in user
  - Displays order cards with status, date, and summary
  - Shows order details in a modal
  - Allows order cancellation and invoice download

## Mobile Implementation
- **Pages:** `mobile_harnam_food/orders.html`
- **Styles:** `mobile_harnam_food/css/mobile-profile-order-history.css`
- **Scripts:** `mobile_harnam_food/js/mobile-profile.js`, `mobile_harnam_food/js/mobile-checkout.js`
  - Displays order history and details for mobile users
  - Supports order cancellation and status updates

## Firebase Integration
- Orders are stored under `orders/{uid}/{orderId}` in Firebase
- Order status and details are updated in real-time
- Cancelled orders update status in Firebase

## Security & Data Integrity
- Only authenticated users can view and manage their orders
- Order cancellation is restricted to eligible orders (time/status)

---
Next: [Profile Page Documentation](07_profile_page.md)
