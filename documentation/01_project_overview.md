# Harnam Masale - Project Overview

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

## Next Steps
See the next documentation files for details on each module and feature.
