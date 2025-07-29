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
Next: [Settings & Content Management Documentation](09_settings_content.md)
