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
Next: [Error Handling & Offline Support Documentation](10_error_handling_offline.md)
