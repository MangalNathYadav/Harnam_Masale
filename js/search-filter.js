// Search and Filter Functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('product-search');
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    const ratingFilter = document.getElementById('rating-filter');
    const sortBy = document.getElementById('sort-by');
    const resetFilters = document.getElementById('reset-filters');

    // Initialize filters state
    const filters = {
        searchQuery: '',
        category: 'all',
        price: 'all',
        rating: 'all',
        sort: 'name-asc'
    };

    function updateFilters() {
        // Update filters state
        filters.searchQuery = searchInput?.value?.toLowerCase() || '';
        filters.category = categoryFilter?.value || 'all';
        filters.price = priceFilter?.value || 'all';
        filters.rating = ratingFilter?.value || 'all';
        filters.sort = sortBy?.value || 'name-asc';

        // Trigger product update
        if (typeof app !== 'undefined') {
            const filteredProducts = filterProducts(app.products);
            app.renderProducts(filteredProducts);
        }
    }

    function filterProducts(products) {
        return products.filter(product => {
            // Search filter
            if (filters.searchQuery) {
                const searchMatch = product.name.toLowerCase().includes(filters.searchQuery) ||
                                  product.description.toLowerCase().includes(filters.searchQuery) ||
                                  product.category.toLowerCase().includes(filters.searchQuery);
                if (!searchMatch) return false;
            }

            // Category filter
            if (filters.category !== 'all' && product.category !== filters.category) {
                return false;
            }

            // Price filter
            if (filters.price !== 'all') {
                switch(filters.price) {
                    case 'under-200':
                        if (product.price >= 200) return false;
                        break;
                    case '200-to-220':
                        if (product.price < 200 || product.price > 220) return false;
                        break;
                    case 'above-220':
                        if (product.price <= 220) return false;
                        break;
                }
            }

            // Rating filter
            if (filters.rating !== 'all') {
                switch(filters.rating) {
                    case '4.5-plus':
                        if (product.rating < 4.5) return false;
                        break;
                    case '4-plus':
                        if (product.rating < 4.0) return false;
                        break;
                }
            }

            return true;
        }).sort((a, b) => {
            // Sort products
            switch(filters.sort) {
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'price-asc':
                    return a.price - b.price;
                case 'price-desc':
                    return b.price - a.price;
                case 'rating-desc':
                    return b.rating - a.rating;
                default:
                    return 0;
            }
        });
    }

    // Add event listeners
    searchInput?.addEventListener('input', debounce(updateFilters, 300));
    categoryFilter?.addEventListener('change', updateFilters);
    priceFilter?.addEventListener('change', updateFilters);
    ratingFilter?.addEventListener('change', updateFilters);
    sortBy?.addEventListener('change', updateFilters);

    resetFilters?.addEventListener('click', () => {
        // Reset all filters to default
        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = 'all';
        if (priceFilter) priceFilter.value = 'all';
        if (ratingFilter) ratingFilter.value = 'all';
        if (sortBy) sortBy.value = 'name-asc';

        updateFilters();
    });
});

function setupSearchAndFilter() {
    // Check if app object exists
    if (typeof app === 'undefined') {
        console.error("App object not found");
        return;
    }

    // Set up search functionality
    const searchInput = document.getElementById('product-search');
    const searchBtn = document.getElementById('search-btn');
    
    if (searchInput && searchBtn) {
        // Add input event for real-time search
        searchInput.addEventListener('input', () => {
            applyFiltersAndSearch();
        });
        
        // Add click event for search button
        searchBtn.addEventListener('click', () => {
            applyFiltersAndSearch();
        });
    }
    
    // Set up filter functionality
    const priceFilter = document.getElementById('price-filter');
    const ratingFilter = document.getElementById('rating-filter');
    const categoryFilter = document.getElementById('category-filter');
    const sortBy = document.getElementById('sort-by');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const clearSearchBtn = document.getElementById('clear-search');
    
    // Add change events for all filters
    if (priceFilter) priceFilter.addEventListener('change', applyFiltersAndSearch);
    if (ratingFilter) ratingFilter.addEventListener('change', applyFiltersAndSearch);
    if (categoryFilter) categoryFilter.addEventListener('change', applyFiltersAndSearch);
    if (sortBy) sortBy.addEventListener('change', applyFiltersAndSearch);
    
    // Reset filters button
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (priceFilter) priceFilter.value = 'all';
            if (ratingFilter) ratingFilter.value = 'all';
            if (categoryFilter) categoryFilter.value = 'all';
            if (sortBy) sortBy.value = 'name-asc';
            
            applyFiltersAndSearch();
        });
    }
    
    // Clear search button
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            applyFiltersAndSearch();
        });
    }
    
    /**
     * Apply all filters and search to products
     */
    function applyFiltersAndSearch() {
        // Get all filter values
        const searchValue = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const priceValue = priceFilter ? priceFilter.value : 'all';
        const ratingValue = ratingFilter ? ratingFilter.value : 'all';
        const categoryValue = categoryFilter ? categoryFilter.value : 'all';
        const sortValue = sortBy ? sortBy.value : 'name-asc';
        
        // Filter products
        let filteredProducts = app.products.filter(product => {
            // Search filter
            const matchesSearch = searchValue === '' || 
                product.name.toLowerCase().includes(searchValue) || 
                product.description.toLowerCase().includes(searchValue) ||
                product.category.toLowerCase().includes(searchValue);
            
            // Price filter
            let matchesPrice = true;
            if (priceValue !== 'all') {
                if (priceValue === 'under-200') {
                    matchesPrice = product.price < 200;
                } else if (priceValue === '200-to-220') {
                    matchesPrice = product.price >= 200 && product.price <= 220;
                } else if (priceValue === 'above-220') {
                    matchesPrice = product.price > 220;
                }
            }
            
            // Rating filter
            let matchesRating = true;
            if (ratingValue !== 'all') {
                if (ratingValue === '4.5-plus') {
                    matchesRating = product.rating >= 4.5;
                } else if (ratingValue === '4-plus') {
                    matchesRating = product.rating >= 4.0;
                }
            }
            
            // Category filter
            const matchesCategory = categoryValue === 'all' || product.category === categoryValue;
            
            // Return true if product matches all filters
            return matchesSearch && matchesPrice && matchesRating && matchesCategory;
        });
        
        // Sort products
        filteredProducts = sortProducts(filteredProducts, sortValue);
        
        // Update UI
        app.renderProducts(filteredProducts);
        
        // Initialize 3D view for newly rendered products
        app.setup3DProductView();
    }
    
    /**
     * Sort products based on selected criteria
     */
    function sortProducts(products, sortValue) {
        switch (sortValue) {
            case 'name-asc':
                return products.sort((a, b) => a.name.localeCompare(b.name));
            case 'name-desc':
                return products.sort((a, b) => b.name.localeCompare(a.name));
            case 'price-asc':
                return products.sort((a, b) => a.price - b.price);
            case 'price-desc':
                return products.sort((a, b) => b.price - a.price);
            case 'rating-desc':
                return products.sort((a, b) => b.rating - a.rating);
            default:
                return products;
        }
    }
    
    // Initial application of filters
    applyFiltersAndSearch();
}
