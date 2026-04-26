// Main JavaScript - Global Functions
export function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountEl = document.getElementById('cartCount');
    if (cartCountEl) {
        cartCountEl.textContent = count;
    }
}

export function formatPrice(amount) {
    return `₹${amount.toLocaleString('en-IN')}`;
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
});
