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
 **Pages:** `login.html`, `signup.html`, `profile.html`
 **Styles:** `css/auth.css`, `css/common.css`
 **Scripts:** `js/auth.js`
  - Handles registration, login, logout, profile update, cart sync, overlays, and Google login
  - Exposes `window.HarnamAuth` API for other modules
 **UI Components:**
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
Next: [Orders and Order History Documentation](06_orders_order_history.md)
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
Next: [Orders and Order History Documentation](06_orders_order_history.md)
