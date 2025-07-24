/**
 * Fixed cart calculation functions
 * This file contains improved functions for handling cart calculations
 */

/**
 * Parse price from different formats and return a valid number
 * @param {string|number} price - Price in various formats
 * @return {number} - Parsed price as a number
 */
function parsePrice(price) {
    if (typeof price === 'number') {
        return isNaN(price) ? 0 : price;
    }
    
    if (typeof price === 'string') {
        // Handle comma as thousand separator and replace with nothing
        let cleanPrice = price.replace(/,/g, '');
        // Remove currency symbol and any non-numeric chars except decimal
        cleanPrice = cleanPrice.replace(/[^\d.-]/g, '');
        // Parse to float
        const parsedPrice = parseFloat(cleanPrice);
        return isNaN(parsedPrice) ? 0 : parsedPrice;
    }
    
    return 0;
}

/**
 * Format price in Indian Rupees format with proper thousands separators
 * @param {number} amount - The amount to format
 * @return {string} - Formatted price string
 */
function formatIndianPrice(amount) {
    if (isNaN(amount)) return '₹0.00';
    
    // Convert to 2 decimal places
    const fixedAmount = amount.toFixed(2);
    
    // Split into whole and decimal parts
    const parts = fixedAmount.split('.');
    const wholePart = parts[0];
    const decimalPart = parts[1] || '00';
    
    // Format whole part with Indian thousands separator format (e.g., 1,23,456)
    let formattedWhole = '';
    const wholeLength = wholePart.length;
    
    if (wholeLength <= 3) {
        formattedWhole = wholePart;
    } else {
        // First group is last 3 digits
        formattedWhole = wholePart.substring(wholeLength - 3);
        
        // Rest of the groups are 2 digits each, from right to left
        let remainingPart = wholePart.substring(0, wholeLength - 3);
        
        while (remainingPart.length > 0) {
            const group = remainingPart.substring(Math.max(0, remainingPart.length - 2));
            formattedWhole = group + "," + formattedWhole;
            remainingPart = remainingPart.substring(0, Math.max(0, remainingPart.length - 2));
        }
    }
    
    return `₹${formattedWhole}.${decimalPart}`;
}

// Export to window object for global access
window.parsePrice = parsePrice;
window.formatIndianPrice = formatIndianPrice;
