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
Next: [Admin Dashboard Documentation](08_admin_dashboard.md)
