# Harnam Masale - Combined Documentation

---

# 01. Project Overview

## Introduction
Harnam Masale is a responsive, dark-themed e-commerce platform for selling premium Indian spices. The project is built using HTML, CSS, and JavaScript, with Firebase as the backend for authentication, cart, and order management. The codebase supports both desktop and mobile experiences, with dedicated folders for each.

## Goals
- Provide a seamless shopping experience for spice products.
- Support guest and authenticated user flows.
- Centralized cart and order management using Firebase.
- Modern UI/UX with animations and mobile optimization.
- Admin panel for managing products, users, and orders.

## Tech Stack
- HTML, CSS, JavaScript (Vanilla)
- Firebase (Realtime Database, Auth)
- Responsive design for desktop and mobile

## Directory Structure
```
├── index.html                # Home page (desktop)
├── css/                      # Desktop CSS files
├── js/                       # Desktop JS files
├── assets/                   # Images and icons
├── admin/                    # Admin panel (HTML, CSS, JS)
├── mobile_harnam_food/       # Mobile version (HTML, CSS, JS, assets)
├── pages/                    # Desktop subpages (about, products, contact, checkout)
├── docs/                     # Implementation notes
├── documentation/            # Project documentation (this folder)
├── README.md                 # Project summary
```

## Architecture
- **Desktop and Mobile Separation:**
  - Desktop files are in the root and `pages/`, with shared assets and logic.
  - Mobile files are in `mobile_harnam_food/`, optimized for touch and small screens.
- **Centralized State Management:**
  - Cart and order logic is centralized in JS modules, with Firebase as the main data store.
- **Admin System:**
  - The `admin/` folder contains the dashboard and management tools for site administrators.

---

# 02. Home Page (`index.html`)

## Overview
The home page is the main entry point for desktop users. It features a dark-themed, modern UI with a hero banner, featured products, and navigation to other sections.

## Features
- Hero banner with brand logo and tagline
- Navigation bar (links to products, about, contact, login/signup)
- Featured products section
- Promotional banners and offers
- Footer with contact info and social links

## Components
- **Hero Banner:** Uses images from `assets/images/hero banner.png` and logo files.
- **Navigation Bar:** Links to `products.html`, `about.html`, `contact.html`, `login.html`, and `signup.html`.
- **Featured Products:** Dynamically loaded from Firebase (see `js/products.js`).
- **Promotional Banners:** Static images and/or dynamic offers.
- **Footer:** Contact details, social media icons, and copyright.

## Styling
- Main styles in `css/home.css` and `css/common.css`.
- Responsive design for desktop and tablets.

## Scripts
- Main logic in `js/home.js`.
- Product loading and banner animations.

## Mobile Version
See `mobile_harnam_food/index.html` for mobile-specific layout and features.

---

# 03. Products Page (`products.html`)

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

# 04. Cart and Checkout

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

# 05. Authentication

## Overview
Authentication is managed via Firebase Auth, supporting both desktop and mobile flows. Users can register, log in, log out, and update their profiles. Guest carts are merged on login, and Google OAuth is supported for quick sign-in.

## Features
- Email/password registration and login
- Google OAuth login/signup
- Password show/hide toggle
- Form validation and error feedback
- Auth overlays and loading spinners
- Guest cart merge on login
- Profile update (name, email, avatar)
- Auth state persistence and UI updates

## Desktop Implementation
- **Pages:** `login.html`, `signup.html`, `profile.html`
- **Styles:** `css/auth.css`, `css/common.css`
- **Scripts:** `js/auth.js`
  - Handles registration, login, logout, profile update, cart sync, overlays, and Google login
  - Exposes `window.HarnamAuth` API for other modules
- **UI Components:**
  - Auth forms with validation and error messages
  - Social login buttons
  - User dropdown menu and profile sidebar

## Mobile Implementation
- **Pages:** `mobile_harnam_food/login.html`, `mobile_harnam_food/signup.html`, `mobile_harnam_food/profile.html`
- **Styles:** `mobile_harnam_food/css/mobile-auth.css`, `mobile_harnam_food/css/mobile-profile.css`
- **Scripts:** `mobile_harnam_food/js/mobile-auth.js`, `mobile_harnam_food/js/mobile-profile.js`
  - Handles mobile-specific auth flows, overlays, and profile management

## Firebase Integration
- Uses Firebase Auth for user management
- Syncs user data and cart/orders with Firebase Realtime Database

## Security
- Passwords are securely handled by Firebase
- Auth state is checked on every page load
- UI updates dynamically based on auth state

---

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

# 07. Profile Page

## Overview
The profile page allows users to view and manage their personal information, including contact details, address, profile photo, and order history. It is available for both desktop and mobile users.

## Features
- View and edit personal information (name, email, phone, address)
- Upload/change profile photo
- View order count and recent orders
- Change password (with current password verification)
- Order history integration
- Real-time updates from Firebase

## Desktop Implementation
- **Pages:** `profile.html`
- **Styles:** `css/profile.css`, `css/common.css`
- **Scripts:** `js/auth.js`, `js/orders.js`
  - Handles profile data fetching and updating
  - Integrates order history and password change
  - Supports profile photo upload

## Mobile Implementation
- **Pages:** `mobile_harnam_food/profile.html`
- **Styles:** `mobile_harnam_food/css/mobile-profile.css`, `mobile_harnam_food/css/mobile-profile-order-history.css`
- **Scripts:** `mobile_harnam_food/js/mobile-profile.js`
  - Manages mobile profile UI and data
  - Integrates order history and profile editing

## Firebase Integration
- Profile data stored under `users/{uid}` in Firebase
- Profile photo stored in Firebase Storage (if uploaded)
- Real-time sync for profile and order data

## Security
- Only authenticated users can edit their profile
- Password changes require current password verification

---

# 08. Admin Dashboard

## Overview
The admin dashboard provides site administrators with tools to manage products, users, orders, promo codes, and site settings. It is accessible only to authorized admin users.

## Features
- View and manage users, orders, products, promo codes, and logs
- Fullscreen modals for user/order details
- Edit user info, update order status, download invoices (with `html2canvas`)
- Analytics: sales performance, user activity, product stats
- Settings management for site content (featured products, banners, payment/shipping)
- Promotion code creation and management
- System logs and notification system
- Secure admin-only access (email whitelist, custom claims)

## Implementation
- **Pages:** `admin/dashboard.html`, `admin/orders.html`, `admin/users.html`, `admin/products.html`, `admin/promo-codes.html`, `admin/logs.html`, `admin/settings.html`
- **Styles:** `admin/css/admin.css`
- **Scripts:**
  - `admin/js/admin-auth.js`: Admin authentication and session management
  - `admin/js/admin-dashboard.js`: Analytics and reports
  - `admin/js/admin-users.js`: User management
  - `admin/js/admin-orders.js`: Order management
  - `admin/js/admin-products.js`: Product management
  - `admin/js/admin-promo-codes.js`: Promo code management
  - `admin/js/admin-logs.js`: System logs
  - `admin/js/admin-settings.js`: Site settings
  - `admin/js/admin-common.js`: Shared admin functionality

## Firebase Integration
- Admin data and actions are stored in Firebase (Realtime Database)
- Custom claims and email whitelist for admin access
- Logs and analytics data stored under `admin_logs/`

## Security
- Only authorized admin users can access dashboard
- Session management and secure route protection

---

# 09. Settings & Content Management

## Overview
Settings and content management allow administrators to dynamically update site content, including banners, product details, about page, and other configuration options. All changes are stored in Firebase and reflected in real time across the app.

## Features
- Edit site-wide settings (theme, banners, featured products)
- Manage dynamic content for about, products, and promotional sections
- Update payment and shipping configuration
- Control notification settings
- Real-time updates to site content
- Admin-only access for content management

## Implementation
- **Pages:** `admin/settings.html`, `admin/dashboard.html`
- **Styles:** `admin/css/admin.css`
- **Scripts:**
  - `admin/js/admin-settings.js`: Handles site settings and content updates
  - `admin/js/admin-dashboard.js`: Integrates analytics and featured product selection
  - `admin/js/admin-common.js`: Shared helpers and UI components

## Firebase Integration
- Settings stored under `settings` node in Firebase
- Dynamic content (about, banners, featured products) updated via admin panel
- Real-time sync for all users

## Security
- Only authorized admins can update site settings
- Changes are logged in `admin_logs/` for audit

---

# 10. Error Handling & Offline Support

## Overview
Robust error handling and offline support ensure the app remains usable and secure even when network or backend issues occur. The system provides clear feedback, fallback mechanisms, and data persistence strategies for both desktop and mobile users.

## Features
- Graceful error handling for all Firebase operations
- Fallback to localStorage for cart and user data when offline
- Placeholder data for products if Firebase is unavailable
- Client-side form validation and clear error messages
- Image loading errors handled with placeholders and base64 support
- Backup mechanisms for cart data
- Secure guest ID management with expiration and cleanup
- Real-time UI updates reflecting error states

## Implementation
- **Scripts:**
  - `js/cart.js`, `js/auth.js`, `js/products.js`, `js/checkout.js`, `js/orders.js`
  - `mobile_harnam_food/js/mobile-cart.js`, `mobile_harnam_food/js/mobile-auth.js`, `mobile_harnam_food/js/mobile-products.js`
  - Admin scripts: `admin/js/admin-common.js`, `admin/js/admin-logs.js`
- **Fallbacks:**
  - Cart and user data fallback to localStorage for offline/guest use
  - Product data fallback to dummy/placeholder data
  - UI feedback for errors and offline status

## Data Persistence Strategy
- Primary: Firebase Realtime Database
- Backup: localStorage for guests and offline mode
- Guest cart: `/guest_carts/{guestId}` with expiration
- User cart: `/users/{uid}/cart`

## Security
- Data validation before storage
- Error logging in `admin_logs/`
- Secure cleanup of guest data after login

---
Documentation complete. All major modules and features are now covered in detail.
