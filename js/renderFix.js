// Fixed renderProducts function
function renderProductsFixed(products) {
    console.log('Using fixed renderProducts function with', products?.length, 'products');
    
    // Find all product grid containers in the document
    const productGrids = document.querySelectorAll('.product-grid');
    
    if (!productGrids || productGrids.length === 0) {
        console.error('No product grid containers found in the document!');
        return;
    }
    
    console.log(`Found ${productGrids.length} product grid containers`);
    
    if (!products || !products.length) {
        console.error('No products to render!');
        productGrids.forEach(grid => {
            grid.innerHTML = '<p class="no-products">No products available at the moment.</p>';
        });
        return;
    }
    
    // Process each grid
    productGrids.forEach(grid => {
        console.log('Rendering products in grid:', grid);
        
        // Clear existing content
        grid.innerHTML = '';
        
        // Render products
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.setAttribute('data-product-id', product.id);
            productCard.setAttribute('data-category', product.category || 'uncategorized');
            
            productCard.innerHTML = `
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="price">₹${product.price}</p>
                    <p class="description">${product.description}</p>
                </div>
                <div class="product-actions">
                    <button class="btn-add-to-cart" data-product-id="${product.id}">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            `;
            
            grid.appendChild(productCard);
            
            // Add event listener for the "Add to Cart" button
            const addToCartBtn = productCard.querySelector('.btn-add-to-cart');
            addToCartBtn.addEventListener('click', () => {
                if (typeof addToCart === 'function') {
                    addToCart(product);
                    if (typeof showToast === 'function') {
                        showToast(`Added ${product.name} to cart`, 'success');
                    }
                } else {
                    console.error('addToCart function not defined');
                }
            });
        });
    });
    
    console.log('Product rendering complete');
}

// Override the original renderProducts function
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('Installing fixed renderProducts function');
        window.renderProducts = renderProductsFixed;
        
        // Try to render products immediately if data is available
        if (window.PRODUCTS_DATA && window.PRODUCTS_DATA.products) {
            console.log('Running fixed renderProducts with inline data');
            renderProductsFixed(window.PRODUCTS_DATA.products);
        }
    }, 500); // Wait for other scripts to load
});
