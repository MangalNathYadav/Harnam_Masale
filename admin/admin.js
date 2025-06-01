// Mock data for products
let products = [{
        id: 1,
        name: "Garam Masala",
        price: 250,
        image: "../assets/images/garam.jpeg",
        description: "A blend of ground spices used in Indian cuisine. Adds warmth and depth to dishes."
    },
    {
        id: 2,
        name: "Chola Masala",
        price: 180,
        image: "../assets/images/chola.jpeg",
        description: "Perfect spice blend for delicious chickpea curry. Brings authentic flavor to your chola dish."
    },
    {
        id: 3,
        name: "Sabji Masala",
        price: 200,
        image: "../assets/images/sabji.jpeg",
        description: "Essential mix for vegetable dishes. Enhances the flavor of any vegetable preparation."
    }
];

// Mock data for homepage content
let homepageContent = {
    heroBanner: "assets/images/hero banner.png",
    heroTitle: "Authentic Indian Spices",
    heroDescription: "Experience the rich flavors of traditional Indian spices, handcrafted to perfection. Elevate your cooking with our premium spice collection.",
    featuredTitle: "Our Premium Spices",
    featuredDescription: "Discover our handpicked selection of premium spices, sourced from the finest regions of India.",
    footerText: "Experience the authentic taste of India with our premium spice collection."
};

// Mock data for about page content
let aboutContent = {
    aboutTitle: "About Harnam Masale",
    aboutDescription: "Founded with a passion for authentic Indian flavors, Harnam Masale brings you the finest quality spices sourced directly from the traditional spice-growing regions of India.\n\nEach product in our collection is carefully processed to preserve its natural aroma, color, and health benefits. We take pride in maintaining the highest standards of quality and freshness in every package we deliver.",
    missionStatement: "Our mission is to bring the authentic taste of Indian cuisine to kitchens worldwide, allowing everyone to experience the rich culinary heritage of India.",
    aboutImage: "assets/images/aout_planatation.png"
};

// Mock data for contact page content
let contactContent = {
    contactTitle: "Get In Touch",
    contactSubtitle: "Have questions or feedback? We'd love to hear from you!",
    address: "123 Spice Market, Delhi, India - 110001",
    phone: "+91 98765 43210",
    email: "info@harnammasale.com",
    businessHours: "Mon - Sat: 9:00 AM - 6:00 PM"
};

// DOM Elements
// Login elements
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

// Navigation elements
const navLinks = document.querySelectorAll('.nav-link');
const contentSections = document.querySelectorAll('.content-section');

// Homepage elements
const homepageForm = document.getElementById('homepageForm');
const saveHomepageBtn = document.getElementById('saveHomepageBtn');
const heroBannerInput = document.getElementById('heroBanner');
const heroBannerPreview = document.getElementById('heroBannerPreview');

// Product elements
const productsTableBody = document.getElementById('productsTableBody');
const productForm = document.getElementById('productForm');
const productFormContainer = document.getElementById('productFormContainer');
const addProductBtn = document.getElementById('addProductBtn');
const cancelBtn = document.getElementById('cancelBtn');
const formTitle = document.getElementById('formTitle');
const productImageInput = document.getElementById('productImage');
const productImagePreview = document.getElementById('productImagePreview');

// About elements
const aboutForm = document.getElementById('aboutForm');
const saveAboutBtn = document.getElementById('saveAboutBtn');
const aboutImageInput = document.getElementById('aboutImage');
const aboutImagePreview = document.getElementById('aboutImagePreview');

// Contact elements
const contactForm = document.getElementById('contactForm');
const saveContactBtn = document.getElementById('saveContactBtn');

// Modal elements
const confirmationModal = document.getElementById('confirmationModal');
const closeModal = document.querySelector('.close-modal');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    // Load data from localStorage if available
    loadDataFromLocalStorage();

    // Set up event listeners
    setupEventListeners();

    // Show login by default
    showLoginScreen();
});

// Load all data from localStorage
function loadDataFromLocalStorage() {
    // Load products
    const savedProducts = localStorage.getItem('harnamProducts');
    if (savedProducts) {
        products = JSON.parse(savedProducts);
    }

    // Load homepage content
    const savedHomepageContent = localStorage.getItem('harnamHomepage');
    if (savedHomepageContent) {
        homepageContent = JSON.parse(savedHomepageContent);
    }

    // Load about content
    const savedAboutContent = localStorage.getItem('harnamAbout');
    if (savedAboutContent) {
        aboutContent = JSON.parse(savedAboutContent);
    }

    // Load contact content
    const savedContactContent = localStorage.getItem('harnamContact');
    if (savedContactContent) {
        contactContent = JSON.parse(savedContactContent);
    }
}

// Set up event listeners
function setupEventListeners() {
    // Login form submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        loginUser(email, password);
    });

    // Logout button
    logoutBtn.addEventListener('click', logoutUser);

    // Navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.getAttribute('data-section');
            switchSection(targetSection);
        });
    });

    // Homepage form events
    saveHomepageBtn.addEventListener('click', saveHomepageContent);
    heroBannerInput.addEventListener('input', () => {
        heroBannerPreview.src = heroBannerInput.value;
    });

    // Product management events
    addProductBtn.addEventListener('click', () => {
        showProductForm();
    });
    cancelBtn.addEventListener('click', hideProductForm);
    productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveProduct();
    });
    productImageInput.addEventListener('input', () => {
        productImagePreview.src = productImageInput.value;
    });

    // About form events
    saveAboutBtn.addEventListener('click', saveAboutContent);
    aboutImageInput.addEventListener('input', () => {
        aboutImagePreview.src = aboutImageInput.value;
    });

    // Contact form events
    saveContactBtn.addEventListener('click', saveContactContent);

    // Modal close events
    closeModal.addEventListener('click', hideModal);
    cancelDeleteBtn.addEventListener('click', hideModal);
    window.addEventListener('click', (e) => {
        if (e.target === confirmationModal) {
            hideModal();
        }
    });

    // SPA Management Button Listeners
    document.addEventListener('DOMContentLoaded', function() {
        // SPA Configuration save button
        const saveSpaConfigBtn = document.getElementById('saveSpaConfigBtn');
        if (saveSpaConfigBtn) {
            saveSpaConfigBtn.addEventListener('click', function() {
                saveSpaConfiguration();
                showNotification('SPA configuration saved successfully!', 'success');
            });
        }
        
        // Push changes to SPA site button
        const pushSpaChangesBtn = document.getElementById('pushSpaChangesBtn');
        if (pushSpaChangesBtn) {
            pushSpaChangesBtn.addEventListener('click', function() {
                pushChangesToSPA();
            });
        }
        
        // SPA Management tab
        const spaLink = document.querySelector('a.nav-link[data-section="spa"]');
        if (spaLink) {
            spaLink.addEventListener('click', function(e) {
                e.preventDefault();
                showSection('spa');
            });
        }
    });
}

// Authentication Functions

// Placeholder for Firebase authentication
function loginUser(email, password) {
    // This would be replaced with actual Firebase Auth
    if (email === 'admin@harnammasale.com' && password === 'admin123') {
        showDashboard();
        loadAllContent();
    } else {
        loginError.textContent = 'Invalid email or password';
        setTimeout(() => {
            loginError.textContent = '';
        }, 3000);
    }
}

function logoutUser() {
    // This would be replaced with actual Firebase Auth logout
    showLoginScreen();
}

// Navigation Functions
function switchSection(sectionId) {
    // Remove active class from all links and sections
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    contentSections.forEach(section => {
        section.classList.remove('active');
    });

    // Add active class to selected link and section
    document.querySelector(`.nav-link[data-section="${sectionId}"]`).classList.add('active');
    document.getElementById(`${sectionId}-section`).classList.add('active');
}

// UI Functions
function showLoginScreen() {
    loginSection.style.display = 'flex';
    dashboardSection.style.display = 'none';
    // Reset login form
    loginForm.reset();
}

function showDashboard() {
    loginSection.style.display = 'none';
    dashboardSection.style.display = 'block';
}

function showProductForm(product = null) {
    productFormContainer.style.display = 'block';

    if (product) {
        // Edit mode
        formTitle.textContent = 'Edit Product';
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productImage').value = product.image;
        productImagePreview.src = product.image;
        document.getElementById('productDescription').value = product.description;
    } else {
        // Add mode
        formTitle.textContent = 'Add New Product';
        productForm.reset();
        document.getElementById('productId').value = '';
        productImagePreview.src = '';
    }
}

function hideProductForm() {
    productFormContainer.style.display = 'none';
    productForm.reset();
    productImagePreview.src = '';
}

function showDeleteConfirmation(productId) {
    confirmationModal.style.display = 'block';
    confirmDeleteBtn.onclick = () => {
        deleteProduct(productId);
        hideModal();
    };
}

function hideModal() {
    confirmationModal.style.display = 'none';
}

// Content Loading Functions
function loadAllContent() {
    loadHomepageContent();
    loadProducts();
    loadAboutContent();
    loadContactContent();
}

function loadHomepageContent() {
    // Fill homepage form with current content
    document.getElementById('heroBanner').value = homepageContent.heroBanner;
    document.getElementById('heroTitle').value = homepageContent.heroTitle;
    document.getElementById('heroDescription').value = homepageContent.heroDescription;
    document.getElementById('featuredTitle').value = homepageContent.featuredTitle;
    document.getElementById('featuredDescription').value = homepageContent.featuredDescription;
    document.getElementById('footerText').value = homepageContent.footerText;

    // Update preview
    heroBannerPreview.src = homepageContent.heroBanner;
}

function loadAboutContent() {
    // Fill about form with current content
    document.getElementById('aboutTitle').value = aboutContent.aboutTitle;
    document.getElementById('aboutDescription').value = aboutContent.aboutDescription;
    document.getElementById('missionStatement').value = aboutContent.missionStatement;
    document.getElementById('aboutImage').value = aboutContent.aboutImage;

    // Update preview
    aboutImagePreview.src = aboutContent.aboutImage;
}

function loadContactContent() {
    // Fill contact form with current content
    document.getElementById('contactTitle').value = contactContent.contactTitle;
    document.getElementById('contactSubtitle').value = contactContent.contactSubtitle;
    document.getElementById('address').value = contactContent.address;
    document.getElementById('phone').value = contactContent.phone;
    document.getElementById('email').value = contactContent.email;
    document.getElementById('businessHours').value = contactContent.businessHours;
}

// Product Management Functions
function loadProducts() {
    productsTableBody.innerHTML = '';

    products.forEach(product => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>
                <img src="${product.image}" alt="${product.name}" class="product-thumbnail">
            </td>
            <td>${product.name}</td>
            <td>₹${product.price}</td>
            <td>${truncateText(product.description, 100)}</td>
            <td class="action-buttons">
                <button class="btn-edit" data-id="${product.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" data-id="${product.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        productsTableBody.appendChild(row);
    });

    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            const product = findProductById(parseInt(btn.dataset.id));
            if (product) {
                showProductForm(product);
            }
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            showDeleteConfirmation(parseInt(btn.dataset.id));
        });
    });
}

function saveProduct() {
    const productId = document.getElementById('productId').value;
    const productData = {
        name: document.getElementById('productName').value,
        price: parseInt(document.getElementById('productPrice').value),
        image: document.getElementById('productImage').value,
        description: document.getElementById('productDescription').value
    };

    if (productId) {
        // Update existing product
        updateProduct(parseInt(productId), productData);
    } else {
        // Add new product
        addProduct(productData);
    }

    // Save to localStorage
    saveToLocalStorage('products');

    // Hide form and refresh product list
    hideProductForm();
    loadProducts();
}

function addProduct(productData) {
    // Generate new ID (would be handled by Firebase in production)
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;

    // Add new product to array
    products.push({
        id: newId,
        ...productData
    });
}

function updateProduct(productId, productData) {
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
        products[index] = {
            ...products[index],
            ...productData
        };
    }
}

function deleteProduct(productId) {
    products = products.filter(p => p.id !== productId);
    saveToLocalStorage('products');
    loadProducts();
}

function findProductById(id) {
    return products.find(p => p.id === id);
}

// Content Management Functions
function saveHomepageContent() {
    homepageContent = {
        heroBanner: document.getElementById('heroBanner').value,
        heroTitle: document.getElementById('heroTitle').value,
        heroDescription: document.getElementById('heroDescription').value,
        featuredTitle: document.getElementById('featuredTitle').value,
        featuredDescription: document.getElementById('featuredDescription').value,
        footerText: document.getElementById('footerText').value
    };

    saveToLocalStorage('homepage');
    showNotification('Homepage content saved successfully!');
}

function saveAboutContent() {
    aboutContent = {
        aboutTitle: document.getElementById('aboutTitle').value,
        aboutDescription: document.getElementById('aboutDescription').value,
        missionStatement: document.getElementById('missionStatement').value,
        aboutImage: document.getElementById('aboutImage').value
    };

    saveToLocalStorage('about');
    showNotification('About page content saved successfully!');
}

function saveContactContent() {
    contactContent = {
        contactTitle: document.getElementById('contactTitle').value,
        contactSubtitle: document.getElementById('contactSubtitle').value,
        address: document.getElementById('address').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        businessHours: document.getElementById('businessHours').value
    };

    saveToLocalStorage('contact');
    showNotification('Contact page content saved successfully!');
}

// Update to handle SPA compatibility
function updateMainSiteContent() {
    // This would typically send updates to a server or database
    // For now, let's create a simple update function that updates our local product data
    // and creates an alert to simulate a successful update
    
    saveProducts();
    saveHomepageContent();
    saveAboutContent();
    saveContactContent();
    
    showNotification('Changes have been saved and will be reflected in the SPA site.');
}

function saveProducts() {
    // In a real implementation, this would send the updated products to the server
    const productsJson = JSON.stringify({products: products}, null, 2);
    localStorage.setItem('products_data', productsJson);
    
    // Display confirmation of what would happen in a real implementation
    console.log('Products would be updated in the database and the products.json file.');
    console.log('Updated products data:', productsJson);
}

// Function to handle updating the SPA site
function pushChangesToSPA() {
    // This function would normally update the database or files
    // For this implementation, we'll use localStorage to simulate the update
    
    // Update products.json
    try {
        localStorage.setItem('spa_products', JSON.stringify(products));
        
        // Update content settings
        localStorage.setItem('spa_homepage', JSON.stringify(homepageContent));
        localStorage.setItem('spa_about', JSON.stringify(aboutContent));
        localStorage.setItem('spa_contact', JSON.stringify(contactContent));
        
        showNotification('Changes have been pushed to the SPA site successfully!', 'success');
    } catch (error) {
        showNotification('Error pushing changes: ' + error.message, 'error');
    }
}

// Save SPA Configuration
function saveSpaConfiguration() {
    // Get navigation elements status
    const navigationElements = [];
    document.querySelectorAll('.data-table tbody tr').forEach(row => {
        const nameCell = row.querySelector('td:first-child');
        const idCell = row.querySelector('td:nth-child(2)');
        const enabledInput = row.querySelector('input[type="checkbox"]');
        
        if (nameCell && idCell && enabledInput) {
            navigationElements.push({
                name: nameCell.textContent,
                id: idCell.textContent,
                enabled: enabledInput.checked
            });
        }
    });
    
    // Get features status
    const features = [];
    document.querySelectorAll('.checkbox-list .checkbox-container').forEach(item => {
        const label = item.querySelector('.checkbox-label');
        const input = item.querySelector('input[type="checkbox"]');
        
        if (label && input) {
            features.push({
                name: label.textContent,
                enabled: input.checked
            });
        }
    });
    
    // Create SPA config object
    const spaConfig = {
        navigationElements: navigationElements,
        features: features
    };
    
    // Save to localStorage (would be saved to database in real implementation)
    localStorage.setItem('spa_config', JSON.stringify(spaConfig));
    console.log('SPA configuration saved:', spaConfig);
}

// Helper Functions
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

function saveToLocalStorage(contentType) {
    switch (contentType) {
        case 'products':
            localStorage.setItem('harnamProducts', JSON.stringify(products));
            break;
        case 'homepage':
            localStorage.setItem('harnamHomepage', JSON.stringify(homepageContent));
            break;
        case 'about':
            localStorage.setItem('harnamAbout', JSON.stringify(aboutContent));
            break;
        case 'contact':
            localStorage.setItem('harnamContact', JSON.stringify(contactContent));
            break;
        default:
            // Save all content
            localStorage.setItem('harnamProducts', JSON.stringify(products));
            localStorage.setItem('harnamHomepage', JSON.stringify(homepageContent));
            localStorage.setItem('harnamAbout', JSON.stringify(aboutContent));
            localStorage.setItem('harnamContact', JSON.stringify(contactContent));
    }
}

function showNotification(message) {
    // This is a placeholder for a notification system
    // In a real application, use a toast notification or alert
    alert(message);

    // Firebase integration would go here to update the actual website content
}