// Router State
const router = {
    currentRoute: '',
    routes: {
        home: {
            path: '#home',
            template: createHomeTemplate
        },
        products: {
            path: '#products',
            template: createProductsTemplate
        },
        about: {
            path: '#about',
            template: createAboutTemplate
        },
        contact: {
            path: '#contact',
            template: createContactTemplate
        }
    }
};

// Route Templates
function createHomeTemplate() {
    return `
        <section class="hero" style="background-image: url('assets/images/hero banner.png');" aria-label="Hero banner">
            <div class="container">
                <div class="hero-content fade-in">
                    <h1>Authentic Indian Spices</h1>
                    <p>Experience the rich flavors of traditional Indian spices, handcrafted to perfection. Elevate your cooking with our premium spice collection.</p>
                    <a href="#products" class="btn">Explore Products</a>
                </div>
            </div>
        </section>

        <section class="products">
            <div class="container">
                <div class="section-title fade-in">
                    <h2>Our Premium Spices</h2>
                    <p>Discover our handpicked selection of premium spices, sourced from the finest regions of India.</p>
                </div>
                <div class="product-grid">
                    <!-- Featured products will be loaded here -->
                </div>
                <div class="text-center">
                    <a href="#products" class="btn">View All Products</a>
                </div>
            </div>
        </section>

        <section class="about">
            <div class="container">
                <div class="about-content">
                    <div class="about-text fade-in">
                        <h2>About Harnam Masale</h2>
                        <p>Founded with a passion for authentic Indian flavors, Harnam Masale brings you the finest quality spices sourced directly from the traditional spice-growing regions of India.</p>
                        <p>Each product in our collection is carefully processed to preserve its natural aroma, color, and health benefits. We take pride in maintaining the highest standards of quality and freshness in every package we deliver.</p>
                        <a href="#about" class="btn">Read Our Story</a>
                    </div>
                    <div class="fade-in">
                        <img src="assets/images/aout_planatation.png" alt="About Harnam Masale" class="about-img" loading="lazy">
                    </div>
                </div>
            </div>
        </section>
    `;
}

function createProductsTemplate() {
    return `
        <section class="hero" style="background-image: url('assets/images/product_banner2.png'); height: 50vh;" aria-label="Products banner">
            <div class="container">
                <div class="hero-content animate-on-scroll">
                    <h1>Our Spice Collection</h1>
                    <p>Discover the finest quality spices, handcrafted to bring authentic Indian flavors to your kitchen.</p>
                </div>
            </div>
        </section>

        <section class="products">
            <div class="container">
                <div class="section-title animate-on-scroll">
                    <h2>Explore Our Products</h2>
                    <p>Browse through our extensive range of premium quality products.</p>
                </div>

                <nav class="category-nav">
                    <ul class="category-list">
                        <li class="category-item active" data-category="all">All Products</li>
                        <li class="category-item" data-category="masale">Masale</li>
                        <li class="category-item" data-category="beverages">Beverages</li>
                        <li class="category-item" data-category="snacks">Snacks</li>
                        <li class="category-item" data-category="instant">Instant Mix</li>
                    </ul>
                </nav>

                <div class="products-container">
                    <div class="product-grid">
                        <!-- Products will be loaded here -->
                    </div>
                </div>
            </div>
        </section>
    `;
}

function createAboutTemplate() {
    return `
        <section class="hero" style="background-image: url('assets/images/about_banner.png'); height: 50vh;" aria-label="About banner">
            <div class="container">
                <div class="hero-content animate-on-scroll">
                    <h1>Our Story</h1>
                    <p>Discover the journey of Harnam Masale and our commitment to authentic Indian flavors.</p>
                </div>
            </div>
        </section>

        <section class="about">
            <div class="container">
                <div class="about-content">
                    <div class="about-text fade-in">
                        <h2>Our Heritage</h2>
                        <p>Founded with a passion for authentic Indian flavors, Harnam Masale brings you the finest quality spices sourced directly from the traditional spice-growing regions of India.</p>
                        <p>Each product in our collection is carefully processed to preserve its natural aroma, color, and health benefits. We take pride in maintaining the highest standards of quality and freshness in every package we deliver.</p>
                        <p>Our mission is to bring the authentic taste of Indian cuisine to kitchens worldwide, allowing everyone to experience the rich culinary heritage of India.</p>
                    </div>
                    <div class="fade-in">
                        <img src="assets/images/aout_planatation.png" alt="About Harnam Masale" class="about-img" loading="lazy">
                    </div>
                </div>
            </div>
        </section>

        <section class="values">
            <div class="container">
                <div class="section-title fade-in">
                    <h2>Our Values</h2>
                    <p>What drives us to deliver excellence in every product</p>
                </div>
                <div class="values-grid">
                    <div class="value-card fade-in">
                        <i class="fas fa-leaf"></i>
                        <h3>Quality</h3>
                        <p>We source only the finest ingredients and maintain strict quality control.</p>
                    </div>
                    <div class="value-card fade-in">
                        <i class="fas fa-heart"></i>
                        <h3>Authenticity</h3>
                        <p>Our recipes and processes preserve traditional Indian flavors.</p>
                    </div>
                    <div class="value-card fade-in">
                        <i class="fas fa-seedling"></i>
                        <h3>Sustainability</h3>
                        <p>We support sustainable farming practices and eco-friendly packaging.</p>
                    </div>
                </div>
            </div>
        </section>
    `;
}

function createContactTemplate() {
    return `
        <section class="contact">
            <div class="container">
                <div class="section-title fade-in">
                    <h2>Get In Touch</h2>
                    <p>Have questions or feedback? We'd love to hear from you!</p>
                </div>

                <div class="contact-content">
                    <div class="contact-info fade-in">
                        <div>
                            <i class="fas fa-map-marker-alt"></i>
                            <span>123 Spice Market, Delhi, India - 110001</span>
                        </div>
                        <div>
                            <i class="fas fa-phone"></i>
                            <span>+91 98765 43210</span>
                        </div>
                        <div>
                            <i class="fas fa-envelope"></i>
                            <span>info@harnammasale.com</span>
                        </div>
                        <div>
                            <i class="fas fa-clock"></i>
                            <span>Mon - Sat: 9:00 AM - 6:00 PM</span>
                        </div>
                    </div>

                    <div class="contact-form fade-in">
                        <form id="contactForm">
                            <div class="form-group">
                                <label for="name">Your Name</label>
                                <input type="text" id="name" class="form-control" placeholder="Enter your name" required>
                            </div>
                            <div class="form-group">
                                <label for="email">Email Address</label>
                                <input type="email" id="email" class="form-control" placeholder="Enter your email" required>
                            </div>
                            <div class="form-group">
                                <label for="message">Message</label>
                                <textarea id="message" class="form-control" placeholder="Enter your message" required></textarea>
                            </div>
                            <button type="submit" class="btn">Send Message</button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    `;
}

// Route Handler
function handleRoute() {
    const hash = window.location.hash || '#home';
    const route = Object.values(router.routes).find(route => route.path === hash);

    if (route) {
        router.currentRoute = hash;
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = route.template();

        // Update active nav link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === hash) {
                link.classList.add('active');
            }
        });

        // Initialize page-specific functionality
        initializePageFunctionality(hash);

        // Scroll to top
        window.scrollTo(0, 0);

        // Trigger animations
        setupScrollAnimations();
    }
}

// Initialize Page-Specific Functionality
function initializePageFunctionality(route) {
    switch (route) {
        case '#home':
            loadFeaturedProducts();
            break;
        case '#products':
            loadAllProducts();
            setupCategoryFilter();
            break;
        case '#contact':
            setupContactForm();
            break;
    }
}

// Load Featured Products
async function loadFeaturedProducts() {
    try {
        const snapshot = await db.collection('products')
            .where('featured', '==', true)
            .limit(3)
            .get();

        const productGrid = document.querySelector('.product-grid');
        productGrid.innerHTML = '';

        snapshot.forEach(doc => {
            const product = { id: doc.id, ...doc.data() };
            const productCard = createProductCard(product);
            productGrid.appendChild(productCard);
        });

        // Dispatch event for cart functionality
        document.dispatchEvent(new Event('productsLoaded'));
    } catch (error) {
        console.error('Error loading featured products:', error);
        showToast('Failed to load products', 'error');
    }
}

// Load All Products
async function loadAllProducts() {
    try {
        const snapshot = await db.collection('products').get();
        const productGrid = document.querySelector('.product-grid');
        productGrid.innerHTML = '';

        snapshot.forEach(doc => {
            const product = { id: doc.id, ...doc.data() };
            const productCard = createProductCard(product);
            productGrid.appendChild(productCard);
        });

        // Dispatch event for cart functionality
        document.dispatchEvent(new Event('productsLoaded'));
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Failed to load products', 'error');
    }
}

// Create Product Card
function createProductCard(product) {
    const div = document.createElement('div');
    div.className = 'product-card';
    div.dataset.id = product.id;
    div.dataset.category = product.category;

    div.innerHTML = `
        ${product.isNew ? '<div class="product-badge">New</div>' : ''}
        <div class="product-circle">
            <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
        </div>
        <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="price">₹${product.price}</div>
            <button class="shop-now-btn">Add to Cart</button>
        </div>
    `;

    return div;
}

// Setup Category Filter
function setupCategoryFilter() {
    const categoryItems = document.querySelectorAll('.category-item');
    const productCards = document.querySelectorAll('.product-card');

    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            const category = item.dataset.category;

            // Update active state
            categoryItems.forEach(cat => cat.classList.remove('active'));
            item.classList.add('active');

            // Filter products
            productCards.forEach(card => {
                if (category === 'all' || card.dataset.category === category) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// Setup Contact Form
function setupContactForm() {
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', async(e) => {
            e.preventDefault();

            try {
                showLoading();

                const formData = {
                    name: form.querySelector('#name').value,
                    email: form.querySelector('#email').value,
                    message: form.querySelector('#message').value,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                await db.collection('messages').add(formData);

                form.reset();
                showToast('Message sent successfully!', 'success');
            } catch (error) {
                console.error('Error sending message:', error);
                showToast('Failed to send message', 'error');
            } finally {
                hideLoading();
            }
        });
    }
}

// Event Listeners
window.addEventListener('hashchange', handleRoute);
document.addEventListener('DOMContentLoaded', () => {
    handleRoute();
});