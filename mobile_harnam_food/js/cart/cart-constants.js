// =============== These are just the cart constants, so we don't get weird reference errors later ===============
const SHIPPING_COST = 40;
const FREE_SHIPPING_THRESHOLD = 500;

// =============== Making these available everywhere, just in case we need them in random places ===============
window.CART_CONSTANTS = {
    SHIPPING_COST: SHIPPING_COST,
    FREE_SHIPPING_THRESHOLD: FREE_SHIPPING_THRESHOLD
};
