// Products Management JavaScript
let productsData = [];
let currentPage = 1;
let itemsPerPage = 10;
let activeProductId = null;

document.addEventListener('DOMContentLoaded', function() {
    // Show loader
    showLoader();
    
    // Initialize sidebar functionality
    initSidebar();
    
    // Setup product modal
    setupProductModal();
    
    // Setup delete confirmation modal
    setupDeleteModal();
    
    // Setup reorder modal
    setupReorderModal();
    
    // Load products data
    loadProductsData()
        .then(() => {
            hideLoader(500); // Add a small delay for smoother transition
        })
        .catch(error => {
            console.error("Error in initial product load:", error);
            hideLoader();
        });
    
    // Setup search functionality
    setupSearch();
    
    // Setup table sorting
    setupTableSorting();
});

// Initialize sidebar functionality (if not already available in admin-auth.js)
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

// Setup product modal functionality
function setupProductModal() {
    const productModal = document.getElementById('product-modal');
    const modalClose = productModal.querySelector('.modal-close');
    const cancelBtn = document.getElementById('cancel-product-btn');
    const saveBtn = document.getElementById('save-product-btn');
    const addProductBtn = document.getElementById('add-product-btn');
    const imageInput = document.getElementById('product-image-file');
    const imagePreview = document.getElementById('product-image-preview');
    const dropArea = document.getElementById('modern-drop-area');
    const chooseImageLink = dropArea ? dropArea.querySelector('.choose-image-link') : null;

    // Open modal on Add Product button click
    addProductBtn.addEventListener('click', function() {
        openProductModal();
    });

    // Close modal on X button click
    modalClose.addEventListener('click', function() {
        closeProductModal();
    });

    // Close modal on Cancel button click
    cancelBtn.addEventListener('click', function() {
        closeProductModal();
    });

    // Save product on Save button click
    saveBtn.addEventListener('click', function() {
        saveProduct();
    });

    // Clickable 'Browse' link
    if (chooseImageLink) {
        chooseImageLink.addEventListener('click', function(e) {
            e.preventDefault();
            imageInput.click();
        });
    }

    // Drag & drop events
    if (dropArea) {
        dropArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            dropArea.classList.add('dragover');
        });
        dropArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            dropArea.classList.remove('dragover');
        });
        dropArea.addEventListener('drop', function(e) {
            e.preventDefault();
            dropArea.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                imageInput.files = e.dataTransfer.files;
                const event = new Event('change');
                imageInput.dispatchEvent(event);
            }
        });
        // Also allow clicking anywhere in drop area to open file picker
        dropArea.addEventListener('click', function(e) {
            if (e.target === dropArea || e.target.classList.contains('drop-text')) {
                imageInput.click();
            }
        });
    }

    // Preview image when selected
    imageInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            // Check file type
            if (!file.type.match('image.*')) {
                AdminAuth.showToast('Please select an image file', 'error');
                return;
            }
            // Check file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                AdminAuth.showToast('Image size should be less than 2MB', 'error');
                return;
            }
            // Preview the image
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                if (dropArea) dropArea.classList.add('has-image');
            };
            reader.readAsDataURL(file);
        } else {
            imagePreview.src = '';
            imagePreview.style.display = 'none';
            if (dropArea) dropArea.classList.remove('has-image');
        }
    });

    // Close modal on click outside
    window.addEventListener('click', function(e) {
        if (e.target === productModal) {
            closeProductModal();
        }
    });
}

// Setup delete confirmation modal
function setupDeleteModal() {
    const deleteModal = document.getElementById('confirm-delete-modal');
    const modalClose = deleteModal.querySelector('.modal-close');
    const cancelBtn = document.getElementById('cancel-delete-btn');
    const confirmBtn = document.getElementById('confirm-delete-btn');
    
    // Close modal on X button click
    modalClose.addEventListener('click', function() {
        closeDeleteModal();
    });
    
    // Close modal on Cancel button click
    cancelBtn.addEventListener('click', function() {
        closeDeleteModal();
    });
    
    // Delete product on Confirm button click
    confirmBtn.addEventListener('click', function() {
        deleteProduct(activeProductId);
        closeDeleteModal();
    });
    
    // Close modal on click outside
    window.addEventListener('click', function(e) {
        if (e.target === deleteModal) {
            closeDeleteModal();
        }
    });
}

// Setup reorder modal
function setupReorderModal() {
    const reorderModal = document.getElementById('reorder-modal');
    const modalClose = reorderModal.querySelector('.modal-close');
    const cancelBtn = document.getElementById('cancel-reorder-btn');
    const saveBtn = document.getElementById('save-reorder-btn');
    
    // Setup sortable list
    const sortableList = document.getElementById('sortable-products');
    new Sortable(sortableList, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        handle: '.drag-handle'
    });
    
    // Close modal on X button click
    modalClose.addEventListener('click', function() {
        closeReorderModal();
    });
    
    // Close modal on Cancel button click
    cancelBtn.addEventListener('click', function() {
        closeReorderModal();
    });
    
    // Save order on Save button click
    saveBtn.addEventListener('click', function() {
        saveProductOrder();
    });
    
    // Close modal on click outside
    window.addEventListener('click', function(e) {
        if (e.target === reorderModal) {
            closeReorderModal();
        }
    });
}

// Add these functions to handle the loader
function showLoader() {
    const loader = document.getElementById('products-loader');
    if (loader) {
        loader.classList.remove('hidden');
    }
}

function hideLoader(delay = 0) {
    const loader = document.getElementById('products-loader');
    if (loader) {
        if (delay > 0) {
            setTimeout(() => {
                loader.classList.add('hidden');
            }, delay);
        } else {
            loader.classList.add('hidden');
        }
    }
}

// Load products data from Firebase
function loadProductsData() {
    return new Promise((resolve, reject) => {
        const database = firebase.database();
        const productsTable = document.getElementById('products-table').querySelector('tbody');
        
        // Show loading
        productsTable.innerHTML = '<tr><td colspan="6" class="text-center">Loading products...</td></tr>';
        
        console.log('Fetching products from Firebase...');
        
        // Get products data
        database.ref('products').once('value')
            .then(snapshot => {
                console.log('Firebase response received:', snapshot.exists() ? 'Data exists' : 'No data');
                
                if (!snapshot.exists() || snapshot.val() === null) {
                    console.log('No products found in database. Creating a sample product for testing...');
                    
                    // Create a sample product if no products exist
                    const sampleProduct = {
                        name: 'Sample Garam Masala',
                        description: 'A test product for demonstration',
                        price: '199.00',
                        stock: 10,
                        category: 'spices',
                        featured: true,
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    };
                    
                    // Add sample product to database
                    database.ref('products').push(sampleProduct)
                        .then(ref => {
                            console.log('Sample product created with ID:', ref.key);
                            productsData = [{
                                id: ref.key,
                                ...sampleProduct
                            }];
                            renderProducts();
                            resolve();
                        })
                        .catch(error => {
                            console.error('Error creating sample product:', error);
                            productsTable.innerHTML = '<tr><td colspan="6" class="text-center">No products found. Please add a product.</td></tr>';
                            resolve();
                        });
                    return;
                }
                
                // Clear products array
                productsData = [];
                
                // Process products data
                snapshot.forEach(productSnapshot => {
                    const product = productSnapshot.val();
                    product.id = productSnapshot.key;
                    productsData.push(product);
                });
                
                console.log(`Loaded ${productsData.length} products`);
                
                if (productsData.length === 0) {
                    productsTable.innerHTML = '<tr><td colspan="6" class="text-center">No products found. Please add a product.</td></tr>';
                    resolve();
                    return;
                }
                
                // Sort products by name (default)
                productsData.sort((a, b) => a.name.localeCompare(b.name));
                
                // Render products
                renderProducts();
                resolve(); // Resolve the promise when done
            })
            .catch(error => {
                console.error('Error fetching products:', error);
                productsTable.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading products: ' + error.message + '</td></tr>';
                
                // Show error in UI
                if (typeof AdminAuth !== 'undefined' && typeof AdminAuth.showToast === 'function') {
                    AdminAuth.showToast('Error loading products: ' + error.message, 'error');
                } else {
                    alert('Error loading products: ' + error.message);
                }
                
                reject(error); // Reject the promise on error
            });
    });
}

// Render products table with pagination
function renderProducts(filteredProducts = null) {
    const products = filteredProducts || productsData;
    const productsTable = document.getElementById('products-table').querySelector('tbody');
    const pagination = document.getElementById('product-pagination');
    
    console.log(`Rendering ${products.length} products (filtered: ${filteredProducts !== null})`);
    
    // Calculate pagination
    const totalPages = Math.ceil(products.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProducts = products.slice(startIndex, endIndex);
    
    // Clear table
    productsTable.innerHTML = '';
    
    if (products.length === 0) {
        productsTable.innerHTML = '<tr><td colspan="6" class="text-center">No products found</td></tr>';
        pagination.innerHTML = '';
        return;
    }
    
    if (currentProducts.length === 0) {
        currentPage = 1; // Reset to first page if current page has no items
        renderProducts(filteredProducts); // Re-render with page 1
        return;
    }
    
    // Add products to table
    currentProducts.forEach(product => {
        const tr = document.createElement('tr');
        
        // Set image HTML based on available data
        let imageHtml = '<div style="width:50px;height:50px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;"><i class="fas fa-image"></i></div>';
        
        try {
            if (product.image) {
                if (product.image.startsWith('data:image')) {
                    imageHtml = `<img src="${product.image}" alt="${product.name}" style="width:50px;height:50px;object-fit:cover;">`;
                } else {
                    imageHtml = `<img src="${product.image}" alt="${product.name}" style="width:50px;height:50px;object-fit:cover;">`;
                }
            } else if (product.imageBase64) {
                imageHtml = `<img src="${product.imageBase64}" alt="${product.name}" style="width:50px;height:50px;object-fit:cover;">`;
            }
        } catch (imageError) {
            console.error('Error rendering product image:', imageError);
        }
        
        // Format price to handle numeric values
        const priceDisplay = typeof product.price === 'number' ? 
            `₹${product.price.toFixed(2)}` : 
            `₹${parseFloat(product.price || 0).toFixed(2)}`;
        
        tr.innerHTML = `
            <td>${product.id}</td>
            <td>${imageHtml}</td>
            <td>${product.name || 'Untitled Product'}</td>
            <td>${priceDisplay}</td>
            <td>${product.stock || 'N/A'}</td>
            <td>
                <div class="action-icons">
                    <i class="fas fa-edit" title="Edit" onclick="editProduct('${product.id}')"></i>
                    <i class="fas fa-trash-alt" title="Delete" onclick="confirmDelete('${product.id}', '${product.name || 'This product'}')"></i>
                </div>
            </td>
        `;
        
        productsTable.appendChild(tr);
    });
    
    // Render pagination
    renderPagination(totalPages);
}

// Render pagination controls
function renderPagination(totalPages) {
    const pagination = document.getElementById('product-pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHtml = '';
    
    // Previous button
    paginationHtml += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
        </li>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        paginationHtml += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }
    
    // Next button
    paginationHtml += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
        </li>
    `;
    
    pagination.innerHTML = paginationHtml;
    
    // Add event listeners to pagination links
    pagination.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const page = parseInt(this.dataset.page);
            
            if (page < 1 || page > totalPages || page === currentPage) {
                return;
            }
            
            currentPage = page;
            renderProducts();
        });
    });
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('product-search');
    
    searchInput.addEventListener('input', function() {
        const searchValue = this.value.toLowerCase().trim();
        
        if (searchValue === '') {
            currentPage = 1;
            renderProducts();
            return;
        }
        
        const filteredProducts = productsData.filter(product => {
            return (
                product.name.toLowerCase().includes(searchValue) ||
                (product.description && product.description.toLowerCase().includes(searchValue)) ||
                (product.category && product.category.toLowerCase().includes(searchValue)) ||
                product.id.toLowerCase().includes(searchValue)
            );
        });
        
        currentPage = 1;
        renderProducts(filteredProducts);
    });
}

// Setup table sorting
function setupTableSorting() {
    const sortableHeaders = document.querySelectorAll('th.sortable');
    
    sortableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const sortKey = this.dataset.sort;
            const isAsc = !this.classList.contains('asc');
            
            // Remove sorting classes from all headers
            sortableHeaders.forEach(h => {
                h.classList.remove('asc', 'desc');
            });
            
            // Add sorting class to current header
            this.classList.add(isAsc ? 'asc' : 'desc');
            
            // Sort products
            productsData.sort((a, b) => {
                if (sortKey === 'price') {
                    const aValue = parseFloat(a[sortKey] || 0);
                    const bValue = parseFloat(b[sortKey] || 0);
                    return isAsc ? aValue - bValue : bValue - aValue;
                } else if (sortKey === 'stock') {
                    const aValue = parseInt(a[sortKey] || 0);
                    const bValue = parseInt(b[sortKey] || 0);
                    return isAsc ? aValue - bValue : bValue - aValue;
                } else {
                    const aValue = a[sortKey] || '';
                    const bValue = b[sortKey] || '';
                    return isAsc ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                }
            });
            
            // Reset to first page
            currentPage = 1;
            
            // Render sorted products
            renderProducts();
        });
    });
}

// Open product modal for adding a new product
function openProductModal(productId = null) {
    const modal = document.getElementById('product-modal');
    const modalTitle = document.getElementById('product-modal-title');
    const productForm = document.getElementById('product-form');
    const imagePreview = document.getElementById('product-image-preview');

    // Reset form
    productForm.reset();

    // Hide image preview
    imagePreview.src = '';
    imagePreview.style.display = 'none';

    // Set modal title and active product ID
    if (productId) {
        modalTitle.textContent = 'Edit Product';
        activeProductId = productId;

        // Find product
        const product = productsData.find(p => p.id === productId);

        if (product) {
            // Fill form with product data
            document.getElementById('product-id').value = product.id;
            document.getElementById('product-name').value = product.name || '';
            document.getElementById('product-description').value = product.description || '';
            document.getElementById('product-price').value = product.price || '';
            document.getElementById('product-stock').value = product.stock || '';
            document.getElementById('product-category').value = product.category || 'spices';
            // Removed product-featured checkbox (no longer present)

            // Show image preview if available
            if (product.image) {
                imagePreview.src = product.image;
                imagePreview.style.display = 'block';
            } else if (product.imageBase64) {
                imagePreview.src = product.imageBase64;
                imagePreview.style.display = 'block';
            }
        }
    } else {
        modalTitle.textContent = 'Add New Product';
        activeProductId = null;
        document.getElementById('product-id').value = '';
    }

    // Show modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Close product modal
function closeProductModal() {
    const modal = document.getElementById('product-modal');
    
    modal.classList.remove('show');
    document.body.style.overflow = '';
    
    // Clear active product ID
    activeProductId = null;
}

// Open edit product modal
function editProduct(productId) {
    openProductModal(productId);
}

// Open delete confirmation modal
function confirmDelete(productId, productName) {
    const modal = document.getElementById('confirm-delete-modal');
    const productNameElem = document.getElementById('delete-product-name');
    
    // Set product name and ID
    productNameElem.textContent = productName;
    activeProductId = productId;
    
    // Show modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Close delete confirmation modal
function closeDeleteModal() {
    const modal = document.getElementById('confirm-delete-modal');
    
    modal.classList.remove('show');
    document.body.style.overflow = '';
    
    // Clear active product ID
    activeProductId = null;
}

// Open reorder modal
function openReorderModal() {
    const modal = document.getElementById('reorder-modal');
    const sortableList = document.getElementById('sortable-products');
    
    // Clear list
    sortableList.innerHTML = '';
    
    // Add products to list
    productsData.forEach(product => {
        const li = document.createElement('li');
        li.className = 'sortable-item';
        li.dataset.id = product.id;
        
        // Set image HTML based on available data
        let imageHtml = '';
        
        if (product.image) {
            if (product.image.startsWith('data:image')) {
                imageHtml = `<img src="${product.image}" alt="${product.name}" style="width:40px;height:40px;object-fit:cover;margin-right:10px;">`;
            } else {
                imageHtml = `<img src="${product.image}" alt="${product.name}" style="width:40px;height:40px;object-fit:cover;margin-right:10px;">`;
            }
        } else if (product.imageBase64) {
            imageHtml = `<img src="${product.imageBase64}" alt="${product.name}" style="width:40px;height:40px;object-fit:cover;margin-right:10px;">`;
        } else {
            imageHtml = '<div style="width:40px;height:40px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;margin-right:10px;"><i class="fas fa-image"></i></div>';
        }
        
        li.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-grip-vertical drag-handle" style="margin-right:10px;cursor:grab;"></i>
                ${imageHtml}
                <span>${product.name}</span>
            </div>
        `;
        
        sortableList.appendChild(li);
    });
    
    // Show modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Close reorder modal
function closeReorderModal() {
    const modal = document.getElementById('reorder-modal');
    
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

// Save product order
function saveProductOrder() {
    const sortableList = document.getElementById('sortable-products');
    const items = sortableList.querySelectorAll('.sortable-item');
    const database = firebase.database();
    
    // Show loading
    AdminAuth.showToast('Saving product order...', 'info');
    
    // Create an object with product IDs and their order
    const orderUpdates = {};
    
    items.forEach((item, index) => {
        const productId = item.dataset.id;
        orderUpdates[`products/${productId}/displayOrder`] = index;
    });
    
    // Update database
    database.ref().update(orderUpdates).then(() => {
        AdminAuth.showToast('Product order saved successfully', 'success');
        
        // Update local data
        productsData.forEach(product => {
            const item = Array.from(items).find(item => item.dataset.id === product.id);
            if (item) {
                const index = Array.from(items).indexOf(item);
                product.displayOrder = index;
            }
        });
        
        // Close modal
        closeReorderModal();
        
        // Sort products by display order
        productsData.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        
        // Render products
        renderProducts();
    }).catch(error => {
        console.error('Error saving product order:', error);
        AdminAuth.showToast('Error saving product order: ' + error.message, 'error');
    });
}

// Save product data
function saveProduct() {
    const productForm = document.getElementById('product-form');
    const imageInput = document.getElementById('product-image-file');
    const database = firebase.database();
    
    // Validate form
    if (!productForm.checkValidity()) {
        productForm.reportValidity();
        return;
    }
    
    // Get form data
    const productId = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value;
    const description = document.getElementById('product-description').value;
    const price = document.getElementById('product-price').value;
    const stock = document.getElementById('product-stock').value;
    const category = document.getElementById('product-category').value;
    // const featured = document.getElementById('product-featured').checked; // Removed featured checkbox
    
    // Show loading
    AdminAuth.showToast('Saving product...', 'info');
    
    // Create product object
    const productData = {
        name,
        description,
        price: parseFloat(price).toFixed(2),
        stock: parseInt(stock),
        category,
        updatedAt: Date.now()
    };
    
    // If editing, keep the existing image if no new one is selected
    if (productId && !imageInput.files.length) {
        const existingProduct = productsData.find(p => p.id === productId);
        if (existingProduct && (existingProduct.image || existingProduct.imageBase64)) {
            if (existingProduct.image) {
                productData.image = existingProduct.image;
            }
            if (existingProduct.imageBase64) {
                productData.imageBase64 = existingProduct.imageBase64;
            }
        }
        
        // Update product in database
        updateProductInDatabase(productId, productData);
    } else if (imageInput.files.length > 0) {
        // If a new image is selected, convert it to Base64
        const file = imageInput.files[0];
        
        const reader = new FileReader();
        reader.onload = function(e) {
            productData.imageBase64 = e.target.result;
            
            if (productId) {
                // Update existing product
                updateProductInDatabase(productId, productData);
            } else {
                // Add new product
                addProductToDatabase(productData);
            }
        };
        reader.readAsDataURL(file);
    } else {
        // No image selected for new product
        if (productId) {
            // Update existing product
            updateProductInDatabase(productId, productData);
        } else {
            // Add new product
            addProductToDatabase(productData);
        }
    }
}

// Add a new product to the database
function addProductToDatabase(productData) {
    const database = firebase.database();
    
    // Add created timestamp
    productData.createdAt = Date.now();
    
    // Add product to database
    const newProductRef = database.ref('products').push();
    
    newProductRef.set(productData).then(() => {
        AdminAuth.showToast('Product added successfully', 'success');
        
        // Add product to local data
        productData.id = newProductRef.key;
        productsData.push(productData);
        
        // Close modal
        closeProductModal();
        
        // Render products
        renderProducts();
    }).catch(error => {
        console.error('Error adding product:', error);
        AdminAuth.showToast('Error adding product: ' + error.message, 'error');
    });
}

// Update an existing product in the database
function updateProductInDatabase(productId, productData) {
    const database = firebase.database();
    
    database.ref('products/' + productId).update(productData).then(() => {
        AdminAuth.showToast('Product updated successfully', 'success');
        
        // Update product in local data
        const index = productsData.findIndex(p => p.id === productId);
        if (index !== -1) {
            productsData[index] = { ...productsData[index], ...productData };
        }
        
        // Close modal
        closeProductModal();
        
        // Render products
        renderProducts();
    }).catch(error => {
        console.error('Error updating product:', error);
        AdminAuth.showToast('Error updating product: ' + error.message, 'error');
    });
}

// Delete a product from the database
function deleteProduct(productId) {
    const database = firebase.database();
    
    if (!productId) {
        AdminAuth.showToast('Invalid product ID', 'error');
        return;
    }
    
    // Show loading
    AdminAuth.showToast('Deleting product...', 'info');
    
    database.ref('products/' + productId).remove().then(() => {
        AdminAuth.showToast('Product deleted successfully', 'success');
        
        // Remove product from local data
        const index = productsData.findIndex(p => p.id === productId);
        if (index !== -1) {
            productsData.splice(index, 1);
        }
        
        // Render products
        renderProducts();
    }).catch(error => {
        console.error('Error deleting product:', error);
        AdminAuth.showToast('Error deleting product: ' + error.message, 'error');
    });
}

// Make functions available globally
window.editProduct = editProduct;
window.confirmDelete = confirmDelete;
