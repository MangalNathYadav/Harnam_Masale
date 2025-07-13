// Save About Page settings (founder photo and certifications)
function saveAboutPageSettings() {
    // Founder photo is already handled by image upload
    // Certifications
    const certificationsContainer = document.getElementById('certifications-container');
    const certFields = certificationsContainer ? certificationsContainer.querySelectorAll('.certification-field') : [];
    const certifications = [];
    certFields.forEach(field => {
        const title = field.querySelector('.cert-title').value.trim();
        const description = field.querySelector('.cert-desc').value.trim();
        const icon = field.querySelector('.cert-icon').value.trim();
        const badge = field.querySelector('.cert-badge').value.trim();
        if (title) {
            certifications.push({ title, description, icon, badge });
        }
    });
    if (!siteSettings.about) siteSettings.about = {};
    siteSettings.about.certifications = certifications;
    // Save to Firebase
    const database = firebase.database();
    document.getElementById('settings-loader').classList.add('show');
    database.ref('settings/about').update({
        founderSection: siteSettings.about.founderSection,
        certifications
    }).then(() => {
        document.getElementById('settings-loader').classList.remove('show');
        AdminAuth.showToast('About page settings saved successfully', 'success');
    }).catch(error => {
        document.getElementById('settings-loader').classList.remove('show');
        AdminAuth.showToast('Error saving about page settings: ' + error.message, 'error');
    });
}
// Save products filters (categories and price range)
function saveProductsFiltersSettings() {
    // Categories
    const categoriesContainer = document.getElementById('categories-container');
    const categoryFields = categoriesContainer ? categoriesContainer.querySelectorAll('.category-field') : [];
    const categories = [];
    categoryFields.forEach(field => {
        const name = field.querySelector('input[id^="category-name-"]').value.trim();
        const description = field.querySelector('textarea[id^="category-desc-"]').value.trim();
        if (name) {
            categories.push({ name, description });
        }
    });

    // Price range
    const min = parseFloat(document.getElementById('price-range-min').value);
    const max = parseFloat(document.getElementById('price-range-max').value);
    const priceRange = {
        min: isNaN(min) ? 0 : min,
        max: isNaN(max) ? 0 : max
    };

    // Update siteSettings
    siteSettings.products.categories = categories;
    siteSettings.products.priceRange = priceRange;

    // Save to Firebase
    const database = firebase.database();
    document.getElementById('settings-loader').classList.add('show');
    database.ref('settings/products').update({
        categories,
        priceRange
    }).then(() => {
        document.getElementById('settings-loader').classList.remove('show');
        AdminAuth.showToast('Products filters saved successfully', 'success');
    }).catch(error => {
        document.getElementById('settings-loader').classList.remove('show');
        AdminAuth.showToast('Error saving products filters: ' + error.message, 'error');
    });
}
// Site Settings Management for Admin Dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Initialize sidebar functionality
    initSidebar();

    // Set up settings navigation
    setupSettingsNavigation();

    // Load all settings data
    loadAllSettings();

    // Set up form submissions for each tab
    setupFormSubmissions();

    // Set up image uploads
    setupImageUploads();

    // Set up theme controls
    setupThemeControls();

    // Load featured products
    loadFeaturedProducts();
});

// Initialize sidebar functionality
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('sidebar-visible');
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 992 && 
                !e.target.closest('#sidebar') && 
                !e.target.closest('#sidebar-toggle') &&
                sidebar.classList.contains('sidebar-visible')) {
                sidebar.classList.remove('sidebar-visible');
            }
        });
    }
}

// Global variables for settings data
let siteSettings = {
    home: {
        hero: {
            heading: 'Discover the Authentic Taste of India',
            subheading: 'Traditional spices and masalas, crafted with premium ingredients for your culinary masterpieces.',
            ctaText: 'Shop Now',
            ctaLink: '/pages/products.html',
            image: '../assets/images/hero banner.png'
        },
        featuredProducts: [],
        aboutSection: {
            heading: 'About Harnam Masale',
            text: 'Founded on tradition, crafted with care. Our spices bring authentic Indian flavors to your kitchen.',
            image: '../assets/images/about-banner.png',
            ctaText: 'Learn More',
            ctaLink: '/pages/about.html'
        }
    },
    about: {
        banner: {
            heading: 'Our Story',
            subheading: 'From humble beginnings to India\'s favorite spices',
            image: '../assets/images/about-banner.png'
        },
        founderSection: {
            heading: 'Our Founder',
            name: 'Harnam Singh',
            text: 'Started this journey with passion for authentic flavors and a commitment to quality.',
            image: '../assets/images/founder.png'
        },
        missionSection: {
            heading: 'Our Mission',
            text: 'To bring the authentic taste of India to every kitchen, preserving traditional flavors with modern manufacturing.'
        },
        valuesSection: {
            heading: 'Our Values',
            values: [
                {
                    title: 'Quality',
                    text: 'Only the finest ingredients make it into our products.'
                },
                {
                    title: 'Tradition',
                    text: 'Preserving authentic recipes passed down through generations.'
                },
                {
                    title: 'Innovation',
                    text: 'Combining traditional methods with modern techniques.'
                }
            ]
        }
    },
    products: {
        banner: {
            heading: 'Our Products',
            subheading: 'Discover our range of authentic Indian spices',
            image: '../assets/images/product banner.png'
        },
        categories: [
            {
                name: 'Kitchen Essentials',
                description: 'Must-have spices for everyday cooking'
            },
            {
                name: 'Specialty Blends',
                description: 'Unique combinations for special dishes'
            },
            {
                name: 'Regional Favorites',
                description: 'Tastes from across India'
            }
        ]
    },
    contact: {
        banner: {
            heading: 'Contact Us',
            subheading: 'Get in touch with our team',
            image: '../assets/images/contact_banner.png'
        },
        info: {
            address: 'Harnam Foods Pvt. Ltd., Industrial Area, Jalandhar, Punjab, India',
            phone: '+91 98765 43210',
            email: 'info@harnammasale.com',
            hours: 'Monday - Saturday: 9:00 AM - 6:00 PM'
        }
    },
    footer: {
        about: 'Harnam Masale brings you the authentic taste of India with premium quality spices crafted using traditional methods.',
        socialLinks: {
            facebook: 'https://facebook.com/harnammasale',
            instagram: 'https://instagram.com/harnammasale',
            twitter: 'https://twitter.com/harnammasale',
            youtube: 'https://youtube.com/harnammasale'
        },
        quickLinks: [
            { text: 'Home', url: '/' },
            { text: 'Products', url: '/pages/products.html' },
            { text: 'About Us', url: '/pages/about.html' },
            { text: 'Contact', url: '/pages/contact.html' }
        ]
    },
    theme: {
        mode: 'light',
        primaryColor: '#e63946',
        secondaryColor: '#457b9d'
    }
};

// Set up settings navigation
function setupSettingsNavigation() {
    const navItems = document.querySelectorAll('.settings-nav-item');
    const sections = document.querySelectorAll('.settings-section');
    
    if (navItems.length === 0 || sections.length === 0) return;
    
    // Add indicator element to nav container
    const navContainer = document.querySelector('.settings-nav');
    if (navContainer && !document.querySelector('.nav-indicator')) {
        const indicator = document.createElement('div');
        indicator.className = 'nav-indicator';
        navContainer.appendChild(indicator);
        
        // Position indicator at initial active item
        const activeItem = document.querySelector('.settings-nav-item.active');
        if (activeItem) {
            positionIndicator(activeItem, indicator);
        }
    }
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Don't do anything if already active
            if (this.classList.contains('active')) return;
            
            // Remove active class from all items
            navItems.forEach(navItem => {
                navItem.classList.remove('active');
            });
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Move indicator
            const indicator = document.querySelector('.nav-indicator');
            if (indicator) {
                positionIndicator(this, indicator);
            }
            
            // Show corresponding section
            const sectionId = this.getAttribute('data-section');
              // Show loading indicator
            const loader = document.getElementById('settings-loader');
            loader.classList.add('show');
            
            // Add fade out effect
            sections.forEach(section => {
                if (section.classList.contains('active')) {
                    section.classList.add('fade-out');
                    
                    // Wait for animation to complete
                    setTimeout(() => {
                        section.classList.remove('active');
                        section.classList.remove('fade-out');
                        
                        // Show the new section with fade in effect
                        const targetSection = document.getElementById(sectionId);
                        if (targetSection) {
                            targetSection.classList.add('active');
                            targetSection.classList.add('fade-in');
                            
                            // Hide loading indicator after content appears
                            setTimeout(() => {
                                loader.classList.remove('show');
                            }, 100);
                            
                            // Remove fade-in class after animation completes
                            setTimeout(() => {
                                targetSection.classList.remove('fade-in');
                            }, 300);
                            
                            // Scroll to top of section
                            document.querySelector('.settings-content').scrollTop = 0;
                        }
                    }, 300);
                }
            });
              // If no section is currently active, activate the new section immediately
            if (!document.querySelector('.settings-section.active')) {
                const targetSection = document.getElementById(sectionId);
                if (targetSection) {
                    targetSection.classList.add('active');
                    targetSection.classList.add('fade-in');
                    
                    // Hide loading indicator after content appears
                    setTimeout(() => {
                        loader.classList.remove('show');
                    }, 100);
                    
                    // Remove fade-in class after animation completes
                    setTimeout(() => {
                        targetSection.classList.remove('fade-in');
                    }, 300);
                }
            }
            
            // Update URL hash for direct navigation
            window.location.hash = sectionId;
        });
    });
    
    // Check for hash in URL to navigate to correct section on page load
    if (window.location.hash) {
        const sectionId = window.location.hash.substring(1);
        const targetNavItem = document.querySelector(`.settings-nav-item[data-section="${sectionId}"]`);
        if (targetNavItem) {
            targetNavItem.click();
        }
    } else if (navItems.length > 0) {
        // If no hash, activate first section
        navItems[0].click();
    }
}

// Helper function to position the indicator
function positionIndicator(activeItem, indicator) {
    indicator.style.top = `${activeItem.offsetTop}px`;
    indicator.style.height = `${activeItem.offsetHeight}px`;
}

// Load all settings from Firebase
function loadAllSettings() {
    const database = firebase.database();
    
    // Show loading state
    document.querySelectorAll('.settings-loader').forEach(loader => {
        loader.classList.add('show');
    });
    
    // Get settings from Firebase
    database.ref('settings').once('value').then(snapshot => {
        if (snapshot.exists()) {
            const settings = snapshot.val();
            
            // Merge with default settings (preserving defaults for missing values)
            siteSettings = mergeDeep(siteSettings, settings);
        }
        
        // Populate form fields with data
        populateSettingsForms(siteSettings);
        
        // Hide loading state
        setTimeout(() => {
            document.querySelectorAll('.settings-loader').forEach(loader => {
                loader.classList.remove('show');
            });
            AdminAuth.showToast('Settings loaded successfully', 'success');
        }, 300);
        
    }).catch(error => {
        console.error('Error loading settings:', error);
        
        // Hide loading state
        document.querySelectorAll('.settings-loader').forEach(loader => {
            loader.classList.remove('show');
        });
        
        AdminAuth.showToast('Error loading settings: ' + error.message, 'error');
        
        // Still populate forms with default values
        populateSettingsForms(siteSettings);
    });
}

// Populate all settings forms with loaded data
function populateSettingsForms(settings) {
    // Home page settings
    populateHomePageSettings(settings.home);
    
    // About page settings
    populateAboutPageSettings(settings.about);
    
    // Products page settings
    populateProductsPageSettings(settings.products);
    
    // Contact page settings
    populateContactPageSettings(settings.contact);
    
    // Footer settings
    populateFooterSettings(settings.footer);
    // Social links
    populateSocialLinks(settings.socialLinks);
// Populate social links form
function populateSocialLinks(socialLinks) {
    if (!socialLinks) return;
    setElementValue('social-facebook', socialLinks.facebook);
    setElementValue('social-instagram', socialLinks.instagram);
    setElementValue('social-twitter', socialLinks.twitter);
    setElementValue('social-youtube', socialLinks.youtube);
}
    
    // Theme settings
    populateThemeSettings(settings.theme);
}

// Populate home page settings form
function populateHomePageSettings(homeSettings) {
    if (!homeSettings) return;
    
    // Hero section
    if (homeSettings.hero) {
        const hero = homeSettings.hero;
        setElementValue('hero-heading', hero.heading);
        setElementValue('hero-subheading', hero.subheading);
        setElementValue('hero-cta-text', hero.ctaText);
        setElementValue('hero-cta-link', hero.ctaLink);
        
        // Hero image
        const heroImagePreview = document.getElementById('hero-image-preview');
        if (heroImagePreview && hero.image) {
            heroImagePreview.src = hero.image;
        }
    }
    
    // About section
    if (homeSettings.aboutSection) {
        const about = homeSettings.aboutSection;
        setElementValue('home-about-heading', about.heading);
        setElementValue('home-about-text', about.text);
        setElementValue('home-about-cta-text', about.ctaText);
        setElementValue('home-about-cta-link', about.ctaLink);
        
        // About image
        const aboutImagePreview = document.getElementById('home-about-image-preview');
        if (aboutImagePreview && about.image) {
            aboutImagePreview.src = about.image;
        }
    }
}

// Populate about page settings form
function populateAboutPageSettings(aboutSettings) {
    if (!aboutSettings) return;
    
    // Banner section
    if (aboutSettings.banner) {
        const banner = aboutSettings.banner;
        setElementValue('about-banner-heading', banner.heading);
        setElementValue('about-banner-subheading', banner.subheading);
        
        // Banner image
        const bannerImagePreview = document.getElementById('about-banner-image-preview');
        if (bannerImagePreview && banner.image) {
            bannerImagePreview.src = banner.image;
        }
    }
    
    // Founder photo
    if (aboutSettings.founderSection) {
        const founder = aboutSettings.founderSection;
        const founderImagePreview = document.getElementById('founder-image-preview');
        if (founderImagePreview && founder.image) {
            founderImagePreview.src = founder.image;
        }
    }
    // Certifications
    if (aboutSettings.certifications) {
        const certificationsContainer = document.getElementById('certifications-container');
        if (certificationsContainer) {
            certificationsContainer.innerHTML = '';
            aboutSettings.certifications.forEach((cert, idx) => {
                addCertificationField(cert, idx);
            });
        }
    }
// Add certification field (dynamic)
function addCertificationField(cert = {}, index) {
    const certificationsContainer = document.getElementById('certifications-container');
    if (!certificationsContainer) return;
    const idx = typeof index === 'number' ? index : certificationsContainer.children.length;
    const certField = document.createElement('div');
    certField.className = 'certification-field card mb-3';
    certField.dataset.index = idx;
    certField.innerHTML = `
        <div class="card-body">
            <div class="form-group">
                <label>Title</label>
                <input type="text" class="form-control cert-title" value="${cert.title || ''}" placeholder="Certification Title (e.g., ISO 22000)">
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea class="form-control cert-desc" rows="2" placeholder="Description">${cert.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Icon (FontAwesome class, e.g., fas fa-certificate)</label>
                <input type="text" class="form-control cert-icon" value="${cert.icon || ''}" placeholder="Icon class">
            </div>
            <div class="form-group">
                <label>Badge Text</label>
                <input type="text" class="form-control cert-badge" value="${cert.badge || ''}" placeholder="Badge text (e.g., Certified)">
            </div>
            <button type="button" class="btn btn-sm btn-danger remove-certification" onclick="removeCertificationField(${idx})">
                <i class="fas fa-trash"></i> Remove
            </button>
        </div>
    `;
    certificationsContainer.appendChild(certField);
}

// Remove certification field
function removeCertificationField(index) {
    const certificationsContainer = document.getElementById('certifications-container');
    if (!certificationsContainer) return;
    const certField = certificationsContainer.querySelector(`.certification-field[data-index="${index}"]`);
    if (certField) {
        certField.remove();
        // Re-index
        const remaining = certificationsContainer.querySelectorAll('.certification-field');
        remaining.forEach((field, i) => {
            field.dataset.index = i;
            field.querySelector('.remove-certification').setAttribute('onclick', `removeCertificationField(${i})`);
        });
    }
}
    
    // Mission section
    if (aboutSettings.missionSection) {
        const mission = aboutSettings.missionSection;
        setElementValue('mission-heading', mission.heading);
        setElementValue('mission-text', mission.text);
    }
    
    // Values section
    if (aboutSettings.valuesSection && aboutSettings.valuesSection.values) {
        const values = aboutSettings.valuesSection;
        setElementValue('values-heading', values.heading);
        
        // Values list
        const valuesContainer = document.getElementById('values-container');
        if (valuesContainer && values.values) {
            valuesContainer.innerHTML = '';
            values.values.forEach((value, index) => {
                addValueField(value.title, value.text);
            });
        }
    }
}

// Populate products page settings form
function populateProductsPageSettings(productsSettings) {
    if (!productsSettings) return;
    // Only handle categories and price range
    if (productsSettings.categories) {
        const categoriesContainer = document.getElementById('categories-container');
        if (categoriesContainer) {
            categoriesContainer.innerHTML = '';
            productsSettings.categories.forEach((category, index) => {
                addCategoryField(category.name, category.description);
            });
        }
    }
    if (productsSettings.priceRange) {
        setElementValue('price-range-min', productsSettings.priceRange.min);
        setElementValue('price-range-max', productsSettings.priceRange.max);
    }
}

// Populate contact page settings form
function populateContactPageSettings(contactSettings) {
    if (!contactSettings) return;
    
    // Banner section
    if (contactSettings.banner) {
        const banner = contactSettings.banner;
        setElementValue('contact-banner-heading', banner.heading);
        setElementValue('contact-banner-subheading', banner.subheading);
        
        // Banner image
        const bannerImagePreview = document.getElementById('contact-banner-image-preview');
        if (bannerImagePreview && banner.image) {
            bannerImagePreview.src = banner.image;
        }
    }
    
    // Contact info
    if (contactSettings.info) {
        const info = contactSettings.info;
        setElementValue('contact-address', info.address);
        setElementValue('contact-phone', info.phone);
        setElementValue('contact-email', info.email);
        setElementValue('contact-hours', info.hours);
    }
}

// Populate footer settings form
function populateFooterSettings(footerSettings) {
    if (!footerSettings) return;
    
    // About text
    setElementValue('footer-about', footerSettings.about);
    
    // Social links
    if (footerSettings.socialLinks) {
        const social = footerSettings.socialLinks;
        setElementValue('social-facebook', social.facebook);
        setElementValue('social-instagram', social.instagram);
        setElementValue('social-twitter', social.twitter);
        setElementValue('social-youtube', social.youtube);
    }
    
    // Quick links
    if (footerSettings.quickLinks) {
        const quickLinksContainer = document.getElementById('quick-links-container');
        if (quickLinksContainer) {
            quickLinksContainer.innerHTML = '';
            footerSettings.quickLinks.forEach((link, index) => {
                addQuickLinkField(link.text, link.url);
            });
        }
    }
}

// Populate theme settings form
function populateThemeSettings(themeSettings) {
    if (!themeSettings) return;
    
    // Theme mode
    const themeMode = themeSettings.mode || 'light';
    const themeModeRadios = document.querySelectorAll('input[name="theme-mode"]');
    if (themeModeRadios.length > 0) {
        themeModeRadios.forEach(radio => {
            if (radio.value === themeMode) {
                radio.checked = true;
            }
        });
    }
    
    // Colors
    setColorPickerValue('primary-color', themeSettings.primaryColor || '#e63946');
    setColorPickerValue('secondary-color', themeSettings.secondaryColor || '#457b9d');
    
    // Update theme preview
    updateThemePreview();
}

// Setup form submissions
function setupFormSubmissions() {
    // Declare all form variables ONCE at the top
    const socialLinksForm = document.getElementById('social-links-form');
    const heroForm = document.getElementById('hero-section-form');
    const aboutPageForm = document.getElementById('about-page-form');
    const productsFiltersForm = document.getElementById('products-filters-form');
    const footerForm = document.getElementById('footer-form');
    const themeForm = document.getElementById('theme-form');
    const contactInfoForm = document.getElementById('contact-info-form');

    // Social links form
    if (socialLinksForm) {
        socialLinksForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveSocialLinksSettings();
        });
    }

    // Home tab: Hero section
    if (heroForm) {
        heroForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveHomeHeroSettings();
        });
    }

    // About tab
    if (aboutPageForm) {
        aboutPageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveAboutPageSettings();
        });
    }

    // Products tab
    if (productsFiltersForm) {
        productsFiltersForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProductsFiltersSettings();
        });
    }

    // Footer tab
    if (footerForm) {
        footerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveFooterSettings();
        });
    }

    // Theme tab
    if (themeForm) {
        themeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveThemeSettings();
        });
    }

    // Contact tab (if you have a form for contact info, add handler here)
    if (contactInfoForm) {
        contactInfoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveContactInfoSettings();
        });
    }

    // Add dynamic field buttons
    setupDynamicFields();
// Save social links to RTDB
function saveSocialLinksSettings() {
    const facebook = document.getElementById('social-facebook').value.trim();
    const instagram = document.getElementById('social-instagram').value.trim();
    const twitter = document.getElementById('social-twitter').value.trim();
    const youtube = document.getElementById('social-youtube').value.trim();
    const socialLinks = { facebook, instagram, twitter, youtube };
    if (!siteSettings.socialLinks) siteSettings.socialLinks = {};
    Object.assign(siteSettings.socialLinks, socialLinks);
    // Save to Firebase
    const database = firebase.database();
    document.getElementById('settings-loader').classList.add('show');
    database.ref('settings/socialLinks').set(socialLinks).then(() => {
        document.getElementById('settings-loader').classList.remove('show');
        AdminAuth.showToast('Social links saved successfully', 'success');
    }).catch(error => {
        document.getElementById('settings-loader').classList.remove('show');
        AdminAuth.showToast('Error saving social links: ' + error.message, 'error');
    });
}
    // Remove all duplicate form variable declarations and handlers below (already handled above)
}

// Setup dynamic fields (add/remove fields)
function setupDynamicFields() {
    // Certifications add button
    const addCertBtn = document.getElementById('add-certification-btn');
    if (addCertBtn) {
        addCertBtn.addEventListener('click', function() {
            addCertificationField();
        });
    }
    // Values add button
    const addValueBtn = document.getElementById('add-value-btn');
    if (addValueBtn) {
        addValueBtn.addEventListener('click', function() {
            addValueField();
        });
    }
    
    // Categories add button
    const addCategoryBtn = document.getElementById('add-category-btn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', function() {
            addCategoryField();
        });
    }
    
    // Quick links add button
    const addQuickLinkBtn = document.getElementById('add-quick-link-btn');
    if (addQuickLinkBtn) {
        addQuickLinkBtn.addEventListener('click', function() {
            addQuickLinkField();
        });
    }
}

// Add value field to values section
function addValueField(title = '', text = '') {
    const valuesContainer = document.getElementById('values-container');
    if (!valuesContainer) return;
    
    const index = valuesContainer.children.length;
    
    const valueField = document.createElement('div');
    valueField.className = 'value-field card mb-3';
    valueField.dataset.index = index;
    
    valueField.innerHTML = `
        <div class="card-body">
            <div class="form-group">
                <label for="value-title-${index}">Value Title</label>
                <input type="text" id="value-title-${index}" class="form-control" value="${escapeHtml(title)}" placeholder="Enter value title (e.g., Quality)">
            </div>
            <div class="form-group">
                <label for="value-text-${index}">Value Description</label>
                <textarea id="value-text-${index}" class="form-control" rows="2" placeholder="Enter value description">${escapeHtml(text)}</textarea>
            </div>
            <button type="button" class="btn btn-sm btn-danger remove-value" onclick="removeValueField(${index})">
                <i class="fas fa-trash"></i> Remove Value
            </button>
        </div>
    `;
    
    valuesContainer.appendChild(valueField);
}

// Remove value field
function removeValueField(index) {
    const valuesContainer = document.getElementById('values-container');
    if (!valuesContainer) return;
    
    const valueField = valuesContainer.querySelector(`.value-field[data-index="${index}"]`);
    if (valueField) {
        valueField.remove();
        
        // Re-index remaining fields
        const remainingFields = valuesContainer.querySelectorAll('.value-field');
        remainingFields.forEach((field, i) => {
            field.dataset.index = i;
            field.querySelector('.remove-value').setAttribute('onclick', `removeValueField(${i})`);
            field.querySelector('input[id^="value-title-"]').id = `value-title-${i}`;
            field.querySelector('textarea[id^="value-text-"]').id = `value-text-${i}`;
        });
    }
}

// Add category field to categories section
function addCategoryField(name = '', description = '') {
    const categoriesContainer = document.getElementById('categories-container');
    if (!categoriesContainer) return;
    
    const index = categoriesContainer.children.length;
    
    const categoryField = document.createElement('div');
    categoryField.className = 'category-field card mb-3';
    categoryField.dataset.index = index;
    
    categoryField.innerHTML = `
        <div class="card-body">
            <div class="form-group">
                <label for="category-name-${index}">Category Name</label>
                <input type="text" id="category-name-${index}" class="form-control" value="${escapeHtml(name)}" placeholder="Enter category name (e.g., Kitchen Essentials)">
            </div>
            <div class="form-group">
                <label for="category-desc-${index}">Category Description</label>
                <textarea id="category-desc-${index}" class="form-control" rows="2" placeholder="Enter category description">${escapeHtml(description)}</textarea>
            </div>
            <button type="button" class="btn btn-sm btn-danger remove-category" onclick="removeCategoryField(${index})">
                <i class="fas fa-trash"></i> Remove Category
            </button>
        </div>
    `;
    
    categoriesContainer.appendChild(categoryField);
}

// Remove category field
function removeCategoryField(index) {
    const categoriesContainer = document.getElementById('categories-container');
    if (!categoriesContainer) return;
    
    const categoryField = categoriesContainer.querySelector(`.category-field[data-index="${index}"]`);
    if (categoryField) {
        categoryField.remove();
        
        // Re-index remaining fields
        const remainingFields = categoriesContainer.querySelectorAll('.category-field');
        remainingFields.forEach((field, i) => {
            field.dataset.index = i;
            field.querySelector('.remove-category').setAttribute('onclick', `removeCategoryField(${i})`);
            field.querySelector('input[id^="category-name-"]').id = `category-name-${i}`;
            field.querySelector('textarea[id^="category-desc-"]').id = `category-desc-${i}`;
        });
    }
}

// Add quick link field to footer section
function addQuickLinkField(text = '', url = '') {
    const quickLinksContainer = document.getElementById('quick-links-container');
    if (!quickLinksContainer) return;
    
    const index = quickLinksContainer.children.length;
    
    const linkField = document.createElement('div');
    linkField.className = 'link-field card mb-3';
    linkField.dataset.index = index;
    
    linkField.innerHTML = `
        <div class="card-body">
            <div class="form-group">
                <label for="link-text-${index}">Link Text</label>
                <input type="text" id="link-text-${index}" class="form-control" value="${escapeHtml(text)}" placeholder="Enter link text (e.g., About Us)">
            </div>
            <div class="form-group">
                <label for="link-url-${index}">Link URL</label>
                <input type="text" id="link-url-${index}" class="form-control" value="${escapeHtml(url)}" placeholder="Enter URL (e.g., /pages/about.html)">
            </div>
            <button type="button" class="btn btn-sm btn-danger remove-link" onclick="removeQuickLinkField(${index})">
                <i class="fas fa-trash"></i> Remove Link
            </button>
        </div>
    `;
    
    quickLinksContainer.appendChild(linkField);
}

// Remove quick link field
function removeQuickLinkField(index) {
    const quickLinksContainer = document.getElementById('quick-links-container');
    if (!quickLinksContainer) return;
    
    const linkField = quickLinksContainer.querySelector(`.link-field[data-index="${index}"]`);
    if (linkField) {
        linkField.remove();
        
        // Re-index remaining fields
        const remainingFields = quickLinksContainer.querySelectorAll('.link-field');
        remainingFields.forEach((field, i) => {
            field.dataset.index = i;
            field.querySelector('.remove-link').setAttribute('onclick', `removeQuickLinkField(${i})`);
            field.querySelector('input[id^="link-text-"]').id = `link-text-${i}`;
            field.querySelector('input[id^="link-url-"]').id = `link-url-${i}`;
        });
    }
}

// Setup image uploads
function setupImageUploads() {
    setupImageUpload('founder-image-upload', 'founder-image-file', 'founder-image-preview', function(imageUrl) {
        if (!siteSettings.about.founderSection) siteSettings.about.founderSection = {};
        siteSettings.about.founderSection.image = imageUrl;
    });
    setupImageUpload('hero-image-upload', 'hero-image-file', 'hero-image-preview', function(imageUrl) {
        siteSettings.home.hero.image = imageUrl;
    });
    
    setupImageUpload('home-about-image-upload', 'home-about-image-file', 'home-about-image-preview', function(imageUrl) {
        siteSettings.home.aboutSection.image = imageUrl;
    });
    
    setupImageUpload('about-banner-image-upload', 'about-banner-image-file', 'about-banner-image-preview', function(imageUrl) {
        siteSettings.about.banner.image = imageUrl;
    });
    
    setupImageUpload('founder-image-upload', 'founder-image-file', 'founder-image-preview', function(imageUrl) {
        siteSettings.about.founderSection.image = imageUrl;
    });
    
    setupImageUpload('products-banner-image-upload', 'products-banner-image-file', 'products-banner-image-preview', function(imageUrl) {
        siteSettings.products.banner.image = imageUrl;
    });
    
    setupImageUpload('contact-banner-image-upload', 'contact-banner-image-file', 'contact-banner-image-preview', function(imageUrl) {
        siteSettings.contact.banner.image = imageUrl;
    });
}

// Setup a single image upload
function setupImageUpload(buttonId, fileInputId, previewId, onSuccessCallback) {
    const uploadBtn = document.getElementById(buttonId);
    const fileInput = document.getElementById(fileInputId);
    const preview = document.getElementById(previewId);
    
    if (!uploadBtn || !fileInput || !preview) return;
    
    uploadBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            
            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                AdminAuth.showToast('Image is too large. Maximum size is 2MB.', 'error');
                this.value = '';
                return;
            }
            
            // Show loading state
            preview.classList.add('loading');
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
            
            const reader = new FileReader();
            reader.onload = function(e) {
                // Store as base64 data URI
                const imageUrl = e.target.result;
                
                // Update preview
                preview.src = imageUrl;
                preview.classList.remove('loading');
                
                // Update button
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload New Image';
                
                // Call success callback with the image URL
                if (typeof onSuccessCallback === 'function') {
                    onSuccessCallback(imageUrl);
                }
                
                // Show success message
                AdminAuth.showToast('Image uploaded successfully', 'success');
            };
            
            reader.readAsDataURL(file);
        }
    });
}

// Setup theme controls
function setupThemeControls() {
    // Theme mode radio buttons
    const themeModeRadios = document.querySelectorAll('input[name="theme-mode"]');
    if (themeModeRadios.length > 0) {
        themeModeRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                siteSettings.theme.mode = this.value;
                updateThemePreview();
            });
        });
    }
    
    // Color pickers
    setupColorPicker('primary-color', function(color) {
        siteSettings.theme.primaryColor = color;
        updateThemePreview();
    });
    
    setupColorPicker('secondary-color', function(color) {
        siteSettings.theme.secondaryColor = color;
        updateThemePreview();
    });
    
    // Reset theme button
    const resetThemeBtn = document.getElementById('reset-theme');
    if (resetThemeBtn) {
        resetThemeBtn.addEventListener('click', function() {
            // Reset to defaults
            siteSettings.theme = {
                mode: 'light',
                primaryColor: '#e63946',
                secondaryColor: '#457b9d'
            };
            
            // Update UI
            populateThemeSettings(siteSettings.theme);
        });
    }
}

// Setup a single color picker
function setupColorPicker(colorPickerId, onChangeCallback) {
    const colorPicker = document.getElementById(colorPickerId);
    const colorHex = document.getElementById(`${colorPickerId}-hex`);
    
    if (!colorPicker) return;
    
    colorPicker.addEventListener('input', function() {
        const color = this.value;
        
        // Update hex display if it exists
        if (colorHex) {
            colorHex.textContent = color;
        }
        
        // Call change callback
        if (typeof onChangeCallback === 'function') {
            onChangeCallback(color);
        }
    });
    
    colorPicker.addEventListener('change', function() {
        // Final color selected
        const color = this.value;
        
        // Call change callback
        if (typeof onChangeCallback === 'function') {
            onChangeCallback(color);
        }
    });
}

// Set value for color picker
function setColorPickerValue(colorPickerId, color) {
    const colorPicker = document.getElementById(colorPickerId);
    const colorHex = document.getElementById(`${colorPickerId}-hex`);
    
    if (colorPicker) {
        colorPicker.value = color;
    }
    
    if (colorHex) {
        colorHex.textContent = color;
    }
}

// Update theme preview
function updateThemePreview() {
    const previewContainer = document.getElementById('theme-preview');
    if (!previewContainer) return;
    
    // Apply theme mode
    if (siteSettings.theme.mode === 'dark') {
        previewContainer.classList.add('dark-mode');
    } else {
        previewContainer.classList.remove('dark-mode');
    }
    
    // Apply colors
    const primaryColor = siteSettings.theme.primaryColor;
    const secondaryColor = siteSettings.theme.secondaryColor;
    
    previewContainer.style.setProperty('--primary-color', primaryColor);
    previewContainer.style.setProperty('--secondary-color', secondaryColor);
}

// Save home hero settings
function saveHomeHeroSettings() {
    const heading = document.getElementById('hero-heading').value;
    const subheading = document.getElementById('hero-subheading').value;
    const ctaText = document.getElementById('hero-cta-text').value;
    const ctaLink = document.getElementById('hero-cta-link').value;
    
    // Update local settings
    siteSettings.home.hero.heading = heading;
    siteSettings.home.hero.subheading = subheading;
    siteSettings.home.hero.ctaText = ctaText;
    siteSettings.home.hero.ctaLink = ctaLink;
    
    // Save to Firebase
    const database = firebase.database();
    database.ref('settings/home/hero').update({
        heading: heading,
        subheading: subheading,
        ctaText: ctaText,
        ctaLink: ctaLink,
        image: siteSettings.home.hero.image
    }).then(() => {
        AdminAuth.showToast('Hero section updated successfully', 'success');
    }).catch(error => {
        console.error('Error updating hero section:', error);
        AdminAuth.showToast('Error updating hero section: ' + error.message, 'error');
    });
}

// Save home about settings
function saveHomeAboutSettings() {
    const heading = document.getElementById('home-about-heading').value;
    const text = document.getElementById('home-about-text').value;
    const ctaText = document.getElementById('home-about-cta-text').value;
    const ctaLink = document.getElementById('home-about-cta-link').value;
    
    // Update local settings
    siteSettings.home.aboutSection.heading = heading;
    siteSettings.home.aboutSection.text = text;
    siteSettings.home.aboutSection.ctaText = ctaText;
    siteSettings.home.aboutSection.ctaLink = ctaLink;
    
    // Save to Firebase
    const database = firebase.database();
    database.ref('settings/home/aboutSection').update({
        heading: heading,
        text: text,
        ctaText: ctaText,
        ctaLink: ctaLink,
        image: siteSettings.home.aboutSection.image
    }).then(() => {
        AdminAuth.showToast('Home About section updated successfully', 'success');
    }).catch(error => {
        console.error('Error updating Home About section:', error);
        AdminAuth.showToast('Error updating Home About section: ' + error.message, 'error');
    });
}

// Save about banner settings
function saveAboutBannerSettings() {
    const heading = document.getElementById('about-banner-heading').value;
    const subheading = document.getElementById('about-banner-subheading').value;
    
    // Update local settings
    siteSettings.about.banner.heading = heading;
    siteSettings.about.banner.subheading = subheading;
    
    // Save to Firebase
    const database = firebase.database();
    database.ref('settings/about/banner').update({
        heading: heading,
        subheading: subheading,
        image: siteSettings.about.banner.image
    }).then(() => {
        AdminAuth.showToast('About banner updated successfully', 'success');
    }).catch(error => {
        console.error('Error updating About banner:', error);
        AdminAuth.showToast('Error updating About banner: ' + error.message, 'error');
    });
}

// Save founder settings
function saveFounderSettings() {
    const heading = document.getElementById('founder-heading').value;
    const name = document.getElementById('founder-name').value;
    const text = document.getElementById('founder-text').value;
    
    // Update local settings
    siteSettings.about.founderSection.heading = heading;
    siteSettings.about.founderSection.name = name;
    siteSettings.about.founderSection.text = text;
    
    // Save to Firebase
    const database = firebase.database();
    database.ref('settings/about/founderSection').update({
        heading: heading,
        name: name,
        text: text,
        image: siteSettings.about.founderSection.image
    }).then(() => {
        AdminAuth.showToast('Founder section updated successfully', 'success');
    }).catch(error => {
        console.error('Error updating Founder section:', error);
        AdminAuth.showToast('Error updating Founder section: ' + error.message, 'error');
    });
}

// Save mission settings
function saveMissionSettings() {
    const heading = document.getElementById('mission-heading').value;
    const text = document.getElementById('mission-text').value;
    
    // Update local settings
    siteSettings.about.missionSection.heading = heading;
    siteSettings.about.missionSection.text = text;
    
    // Save to Firebase
    const database = firebase.database();
    database.ref('settings/about/missionSection').update({
        heading: heading,
        text: text
    }).then(() => {
        AdminAuth.showToast('Mission section updated successfully', 'success');
    }).catch(error => {
        console.error('Error updating Mission section:', error);
        AdminAuth.showToast('Error updating Mission section: ' + error.message, 'error');
    });
}

// Save values settings
function saveValuesSettings() {
    const heading = document.getElementById('values-heading').value;
    
    // Collect values from form
    const valuesContainer = document.getElementById('values-container');
    const values = [];
    
    if (valuesContainer) {
        const valueFields = valuesContainer.querySelectorAll('.value-field');
        valueFields.forEach((field, index) => {
            const titleInput = field.querySelector(`#value-title-${index}`);
            const textInput = field.querySelector(`#value-text-${index}`);
            
            if (titleInput && textInput) {
                values.push({
                    title: titleInput.value,
                    text: textInput.value
                });
            }
        });
    }
    
    // Update local settings
    siteSettings.about.valuesSection.heading = heading;
    siteSettings.about.valuesSection.values = values;
    
    // Save to Firebase
    const database = firebase.database();
    database.ref('settings/about/valuesSection').update({
        heading: heading,
        values: values
    }).then(() => {
        AdminAuth.showToast('Values section updated successfully', 'success');
    }).catch(error => {
        console.error('Error updating Values section:', error);
        AdminAuth.showToast('Error updating Values section: ' + error.message, 'error');
    });
}

// Save products banner settings
function saveProductsBannerSettings() {
    const heading = document.getElementById('products-banner-heading').value;
    const subheading = document.getElementById('products-banner-subheading').value;
    
    // Update local settings
    siteSettings.products.banner.heading = heading;
    siteSettings.products.banner.subheading = subheading;
    
    // Save to Firebase
    const database = firebase.database();
    database.ref('settings/products/banner').update({
        heading: heading,
        subheading: subheading,
        image: siteSettings.products.banner.image
    }).then(() => {
        AdminAuth.showToast('Products banner updated successfully', 'success');
    }).catch(error => {
        console.error('Error updating Products banner:', error);
        AdminAuth.showToast('Error updating Products banner: ' + error.message, 'error');
    });
}

// Save categories settings
function saveCategoriesSettings() {
    // Collect categories from form
    const categoriesContainer = document.getElementById('categories-container');
    const categories = [];
    
    if (categoriesContainer) {
        const categoryFields = categoriesContainer.querySelectorAll('.category-field');
        categoryFields.forEach((field, index) => {
            const nameInput = field.querySelector(`#category-name-${index}`);
            const descInput = field.querySelector(`#category-desc-${index}`);
            
            if (nameInput && descInput) {
                categories.push({
                    name: nameInput.value,
                    description: descInput.value
                });
            }
        });
    }
    
    // Update local settings
    siteSettings.products.categories = categories;
    
    // Save to Firebase
    const database = firebase.database();
    database.ref('settings/products/categories').set(categories)
        .then(() => {
            AdminAuth.showToast('Categories updated successfully', 'success');
        }).catch(error => {
            console.error('Error updating Categories:', error);
            AdminAuth.showToast('Error updating Categories: ' + error.message, 'error');
        });
}

// Save contact banner settings
function saveContactBannerSettings() {
    const heading = document.getElementById('contact-banner-heading').value;
    const subheading = document.getElementById('contact-banner-subheading').value;
    
    // Update local settings
    siteSettings.contact.banner.heading = heading;
    siteSettings.contact.banner.subheading = subheading;
    
    // Save to Firebase
    const database = firebase.database();
    database.ref('settings/contact/banner').update({
        heading: heading,
        subheading: subheading,
        image: siteSettings.contact.banner.image
    }).then(() => {
        AdminAuth.showToast('Contact banner updated successfully', 'success');
    }).catch(error => {
        console.error('Error updating Contact banner:', error);
        AdminAuth.showToast('Error updating Contact banner: ' + error.message, 'error');
    });
}

// Save contact info settings
function saveContactInfoSettings() {
    const address = document.getElementById('contact-address').value;
    const phone = document.getElementById('contact-phone').value;
    const email = document.getElementById('contact-email').value;
    const hours = document.getElementById('contact-hours').value;
    
    // Update local settings
    siteSettings.contact.info.address = address;
    siteSettings.contact.info.phone = phone;
    siteSettings.contact.info.email = email;
    siteSettings.contact.info.hours = hours;
    
    // Save to Firebase
    const database = firebase.database();
    database.ref('settings/contact/info').update({
        address: address,
        phone: phone,
        email: email,
        hours: hours
    }).then(() => {
        AdminAuth.showToast('Contact info updated successfully', 'success');
    }).catch(error => {
        console.error('Error updating Contact info:', error);
        AdminAuth.showToast('Error updating Contact info: ' + error.message, 'error');
    });
}

// Save footer settings
function saveFooterSettings() {
    const about = document.getElementById('footer-about').value;
    const facebook = document.getElementById('social-facebook').value;
    const instagram = document.getElementById('social-instagram').value;
    const twitter = document.getElementById('social-twitter').value;
    const youtube = document.getElementById('social-youtube').value;
    
    // Collect quick links
    const quickLinksContainer = document.getElementById('quick-links-container');
    const quickLinks = [];
    
    if (quickLinksContainer) {
        const linkFields = quickLinksContainer.querySelectorAll('.link-field');
        linkFields.forEach((field, index) => {
            const textInput = field.querySelector(`#link-text-${index}`);
            const urlInput = field.querySelector(`#link-url-${index}`);
            
            if (textInput && urlInput) {
                quickLinks.push({
                    text: textInput.value,
                    url: urlInput.value
                });
            }
        });
    }
    
    // Update local settings
    siteSettings.footer.about = about;
    siteSettings.footer.socialLinks = {
        facebook: facebook,
        instagram: instagram,
        twitter: twitter,
        youtube: youtube
    };
    siteSettings.footer.quickLinks = quickLinks;
    
    // Save to Firebase
    const database = firebase.database();
    database.ref('settings/footer').update({
        about: about,
        socialLinks: {
            facebook: facebook,
            instagram: instagram,
            twitter: twitter,
            youtube: youtube
        },
        quickLinks: quickLinks
    }).then(() => {
        AdminAuth.showToast('Footer settings updated successfully', 'success');
    }).catch(error => {
        console.error('Error updating Footer settings:', error);
        AdminAuth.showToast('Error updating Footer settings: ' + error.message, 'error');
    });
}

// Save theme settings
function saveThemeSettings() {
    // Get theme mode
    const themeModeRadios = document.querySelectorAll('input[name="theme-mode"]');
    let themeMode = 'light';
    
    themeModeRadios.forEach(radio => {
        if (radio.checked) {
            themeMode = radio.value;
        }
    });
    
    // Get colors
    const primaryColor = document.getElementById('primary-color').value;
    const secondaryColor = document.getElementById('secondary-color').value;
    
    // Update local settings
    siteSettings.theme.mode = themeMode;
    siteSettings.theme.primaryColor = primaryColor;
    siteSettings.theme.secondaryColor = secondaryColor;
    
    // Save to Firebase
    const database = firebase.database();
    database.ref('settings/theme').update({
        mode: themeMode,
        primaryColor: primaryColor,
        secondaryColor: secondaryColor
    }).then(() => {
        AdminAuth.showToast('Theme settings updated successfully', 'success');
        
        // Apply theme settings to the site
        applyThemeToSite(themeMode, primaryColor, secondaryColor);
    }).catch(error => {
        console.error('Error updating Theme settings:', error);
        AdminAuth.showToast('Error updating Theme settings: ' + error.message, 'error');
    });
}

// Apply theme settings to the site
function applyThemeToSite(mode, primaryColor, secondaryColor) {
    // Create or update CSS variables
    const style = document.createElement('style');
    style.textContent = `
        :root {
            --primary-color: ${primaryColor};
            --secondary-color: ${secondaryColor};
        }
    `;
    
    // Add style to head
    document.head.appendChild(style);
    
    // Add or remove dark mode class
    if (mode === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// Helper function to set input value
function setElementValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        if (element.tagName.toLowerCase() === 'input' || element.tagName.toLowerCase() === 'textarea') {
            element.value = value || '';
        } else {
            element.textContent = value || '';
        }
    }
}

// Deep merge objects
function mergeDeep(target, source) {
    // If source is not object, return as is
    if (!isObject(source)) {
        return source;
    }
    
    // If target is not object, make it an empty object
    if (!isObject(target)) {
        target = {};
    }
    
    // Merge objects
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (isObject(source[key])) {
                // Recursive merge for objects
                if (!target[key]) target[key] = {};
                target[key] = mergeDeep(target[key], source[key]);
            } else {
                // Direct assignment for non-objects
                target[key] = source[key];
            }
        }
    }
    
    return target;
}

// Check if value is an object
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Show or hide the featured products loader
function toggleFeaturedProductsLoader(show) {
    const loader = document.getElementById('featured-products-loader');
    if (!loader) return;
    
    if (show) {
        loader.classList.remove('hidden');
    } else {
        loader.classList.add('hidden');
    }
}

// Load featured products
function loadFeaturedProducts() {
    const featuredProductsContainer = document.getElementById('featured-products-selection');
    if (!featuredProductsContainer) return;
    
    // Show loader
    toggleFeaturedProductsLoader(true);
    
    // Simulate loading products from database (replace with actual database fetch)
    setTimeout(() => {
        // This would be replaced with actual products data from Firebase
        const featuredProducts = siteSettings.home.featuredProducts || [];
        
        // Create products UI here
        let productsHTML = '';
        
        if (featuredProducts.length === 0) {
            productsHTML = '<p>No featured products selected. Use the button below to add products.</p>';
        } else {
            // Create UI for selected products
            productsHTML = '<div class="selected-products-grid">';
            // ...products would be rendered here
            productsHTML += '</div>';
        }
        
        // Add button to manage products
        productsHTML += `
        <div class="mt-3">
            <button type="button" class="btn btn-outline" id="manage-featured-products">
                <i class="fas fa-edit"></i> Manage Featured Products
            </button>
        </div>`;
        
        // Update container with products
        const productsContainer = document.createElement('div');
        productsContainer.className = 'featured-products-container';
        productsContainer.innerHTML = productsHTML;
        
        // Clear loader and previous content
        featuredProductsContainer.innerHTML = '';
        
        // Add the loader back (hidden)
        const loader = document.createElement('div');
        loader.id = 'featured-products-loader';
        loader.className = 'loader-container hidden';
        loader.innerHTML = '<div class="loader"></div><p>Loading products...</p>';
        
        // Append both to container
        featuredProductsContainer.appendChild(loader);
        featuredProductsContainer.appendChild(productsContainer);
        
        // Setup event handler for manage button
        const manageBtn = document.getElementById('manage-featured-products');
        if (manageBtn) {
            manageBtn.addEventListener('click', () => {
                // Show product selection modal or page
                alert('Product selection functionality would open here');
            });
        }
    }, 1000); // Simulate network delay
}
