/**
 * ═══════════════════════════════════════════════════════════════════
 * ATELIER ĀKĀRA — Main JavaScript
 * Precision Forge Labs | akaraonline.co.in
 * ═══════════════════════════════════════════════════════════════════
 *
 * HOW TO USE ON GITHUB PAGES
 * ───────────────────────────
 * Load as a plain <script> on every page, just before </body>:
 *   <script src="/utils/main.js"></script>
 *
 * Everything is attached to window.Akara — no global pollution.
 *
 * ───────────────────────────────────────────────────────────────────
 * WHAT'S IMPROVED vs. the old main.js
 * ─────────────────────────────────────
 * ✓ No ES module exports — plain <script> compatible
 * ✓ Namespaced under window.Akara
 * ✓ Full cart management (add, remove, update qty, clear)
 * ✓ Wishlist management (add, remove, toggle)
 * ✓ Cart badge updates on every page automatically
 * ✓ formatPrice, formatDate, formatRelativeTime
 * ✓ Toast notification system
 * ✓ Mobile nav toggle
 * ✓ Scroll-to-top button
 * ✓ Active nav link detection
 * ✓ Smooth anchor scroll
 * ✓ Local storage helpers with error handling
 * ✓ Debounce + throttle utilities
 * ✓ GST extraction helper
 * ═══════════════════════════════════════════════════════════════════
 */

;(function (global) {
  'use strict';

  // ─────────────────────────────────────────────────────────────────
  // STORAGE KEYS — single source of truth
  // ─────────────────────────────────────────────────────────────────
  const KEYS = {
    cart:        'akara_cart',
    wishlist:    'akara_wishlist',
    lastOrder:   'akara_last_order',
    cookieConsent:'akara_cookie_consent',
    notified:    'akara_notified',
  };

  // ─────────────────────────────────────────────────────────────────
  // 1. LOCAL STORAGE HELPERS
  // Never throws — returns null on any error
  // ─────────────────────────────────────────────────────────────────

  function lsGet(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function lsSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      console.warn(`[Akara] localStorage write failed for key: ${key}`);
      return false;
    }
  }

  function lsRemove(key) {
    try { localStorage.removeItem(key); return true; }
    catch { return false; }
  }

  // ─────────────────────────────────────────────────────────────────
  // 2. FORMATTING HELPERS
  // ─────────────────────────────────────────────────────────────────

  /**
   * Format a number as INR currency.
   * Akara.formatPrice(2400) → '₹2,400'
   */
  function formatPrice(amount) {
    return '₹' + Number(amount || 0).toLocaleString('en-IN');
  }

  /**
   * Format a date string into readable Indian format.
   * Akara.formatDate('2026-05-07') → '7 May 2026'
   */
  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  /**
   * Format a date relative to now.
   * Akara.formatRelativeTime('2026-05-06') → 'Yesterday'
   */
  function formatRelativeTime(dateStr) {
    if (!dateStr) return '—';
    const diff  = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return 'Just now';
    if (mins < 60)  return `${mins} minute${mins > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7)   return `${days} days ago`;
    return formatDate(dateStr);
  }

  /**
   * Extract GST from GST-inclusive price.
   * Akara.extractGST(2400, 18, false)
   * → { base: 2034, gst: 366, cgst: 183, sgst: 183, igst: 0 }
   */
  function extractGST(grossTotal, rate = 18, isInterstate = false) {
    const base = Math.round(grossTotal / (1 + rate / 100));
    const gst  = grossTotal - base;
    return {
      base,
      gst,
      cgst: isInterstate ? 0 : Math.round(gst / 2),
      sgst: isInterstate ? 0 : Math.round(gst / 2),
      igst: isInterstate ? gst : 0,
    };
  }

  /**
   * Escape HTML to prevent XSS when inserting into innerHTML.
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str ?? '');
    return div.innerHTML;
  }

  // ─────────────────────────────────────────────────────────────────
  // 3. CART MANAGEMENT
  // Cart item shape:
  // { id, key?, name, price, image_url, category, qty, size?, color?, bundle?, limited? }
  // ─────────────────────────────────────────────────────────────────

  function getCart() {
    return lsGet(KEYS.cart, []);
  }

  function saveCart(cart) {
    lsSet(KEYS.cart, cart);
    updateCartBadge();
    global.dispatchEvent(new CustomEvent('akara:cart:updated', { detail: { cart } }));
  }

  /**
   * Add an item to the cart. If an identical item (same id + variant key) exists,
   * increments its quantity instead.
   */
  function addToCart(item) {
    const cart = getCart();
    const key  = item.key || `${item.id}-${item.size || ''}-${item.color || ''}`;
    const existing = cart.find(i => (i.key || i.id) === key);

    if (existing) {
      existing.qty = (existing.qty || 1) + (item.qty || 1);
    } else {
      cart.push({ ...item, key, qty: item.qty || 1 });
    }

    saveCart(cart);
    showToast(`${item.name} added to cart`);
    return cart;
  }

  /**
   * Remove an item from the cart by its key.
   */
  function removeFromCart(key) {
    const cart = getCart().filter(i => (i.key || i.id) !== key);
    saveCart(cart);
    return cart;
  }

  /**
   * Update the quantity of a cart item. Removes item if qty <= 0.
   */
  function updateCartQty(key, qty) {
    let cart = getCart();
    if (qty <= 0) {
      cart = cart.filter(i => (i.key || i.id) !== key);
    } else {
      const item = cart.find(i => (i.key || i.id) === key);
      if (item) item.qty = qty;
    }
    saveCart(cart);
    return cart;
  }

  /**
   * Clear the entire cart.
   */
  function clearCart() {
    saveCart([]);
  }

  /**
   * Get cart totals — subtotal, item count, GST breakdown.
   */
  function getCartTotals(customerState = 'maharashtra') {
    const cart     = getCart();
    const qty      = cart.reduce((s, i) => s + (i.qty || 1), 0);
    const subtotal = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);
    const isInter  = customerState.toLowerCase() !== 'maharashtra';
    const gst      = extractGST(subtotal, 18, isInter);
    return { qty, subtotal, ...gst, grandTotal: subtotal };
  }

  /**
   * Update every cart badge element on the page (id="cartCount").
   */
  function updateCartBadge() {
    const cart  = getCart();
    const count = cart.reduce((s, i) => s + (i.qty || 1), 0);
    document.querySelectorAll('#cartCount, .cart-count').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? '' : '';
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // 4. WISHLIST MANAGEMENT
  // Wishlist item shape: { id, name, price, image_url, category }
  // ─────────────────────────────────────────────────────────────────

  function getWishlist() {
    return lsGet(KEYS.wishlist, []);
  }

  function saveWishlist(list) {
    lsSet(KEYS.wishlist, list);
    global.dispatchEvent(new CustomEvent('akara:wishlist:updated', { detail: { wishlist: list } }));
  }

  function addToWishlist(item) {
    const list = getWishlist();
    if (!list.find(i => i.id === item.id)) {
      list.push(item);
      saveWishlist(list);
      showToast(`${item.name} saved to wishlist`);
    }
    return list;
  }

  function removeFromWishlist(id) {
    const list = getWishlist().filter(i => i.id !== id);
    saveWishlist(list);
    return list;
  }

  function toggleWishlist(item) {
    const list = getWishlist();
    const inList = list.find(i => i.id === item.id);
    if (inList) { removeFromWishlist(item.id); showToast(`${item.name} removed from wishlist`); }
    else        { addToWishlist(item); }
    return !inList;
  }

  function isInWishlist(id) {
    return !!getWishlist().find(i => i.id === id);
  }

  // ─────────────────────────────────────────────────────────────────
  // 5. TOAST NOTIFICATION
  // Renders a dismissible toast. Creates the element once per page.
  // ─────────────────────────────────────────────────────────────────

  let _toastTimer = null;

  function showToast(message, type = 'default', duration = 2800) {
    let toast = document.getElementById('akara-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'akara-toast';
      toast.style.cssText = `
        position:fixed; bottom:2rem; right:2rem; z-index:9999;
        font-family:'Josefin Sans',sans-serif;
        font-size:0.65rem; letter-spacing:0.2em; text-transform:uppercase;
        padding:0.78rem 1.6rem;
        opacity:0; transition:opacity 0.3s; pointer-events:none;
        max-width:320px; line-height:1.5;
      `;
      document.body.appendChild(toast);
    }

    const styles = {
      default: 'background:#c9a96e; color:#002b2b;',
      success: 'background:#70c9a0; color:#002b2b;',
      error:   'background:#e07070; color:#fff8e7;',
      info:    'background:#002b2b; color:#fff8e7; border:1px solid rgba(201,169,110,0.35);',
    };

    toast.style.cssText += styles[type] || styles.default;
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.pointerEvents = 'none';

    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, duration);
  }

  // ─────────────────────────────────────────────────────────────────
  // 6. MOBILE NAV
  // Expects: button#menuToggle, nav#mobileNav
  // ─────────────────────────────────────────────────────────────────

  function initMobileNav() {
    const toggle = document.getElementById('menuToggle');
    const nav    = document.getElementById('mobileNav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (nav.classList.contains('open') && !nav.contains(e.target) && e.target !== toggle) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });

    // Close on escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // 7. ACTIVE NAV LINK
  // Adds .active-page class to any nav link matching the current URL.
  // ─────────────────────────────────────────────────────────────────

  function markActiveNavLink() {
    const current = window.location.pathname.replace(/\/+$/, '') || '/';
    document.querySelectorAll('nav a[href], .nav-links a, .mobile-nav a').forEach(link => {
      try {
        const href = new URL(link.href).pathname.replace(/\/+$/, '') || '/';
        if (href === current || (href !== '/' && current.startsWith(href))) {
          link.classList.add('active-page');
        }
      } catch {}
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // 8. SCROLL TO TOP BUTTON
  // Auto-creates a scroll-to-top button. Shows after 400px of scroll.
  // ─────────────────────────────────────────────────────────────────

  function initScrollToTop() {
    const btn = document.createElement('button');
    btn.id = 'scrollToTopBtn';
    btn.innerHTML = '↑';
    btn.setAttribute('aria-label', 'Scroll to top');
    btn.style.cssText = `
      position:fixed; bottom:2rem; left:2rem; z-index:200;
      width:40px; height:40px;
      background:rgba(0,43,43,0.88); border:1px solid rgba(201,169,110,0.35);
      color:#c9a96e; font-size:1rem; cursor:pointer;
      display:none; align-items:center; justify-content:center;
      transition:opacity 0.3s, transform 0.3s;
      font-family:'Josefin Sans',sans-serif;
      backdrop-filter:blur(8px);
    `;
    document.body.appendChild(btn);

    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    const onScroll = throttle(() => {
      const show = window.scrollY > 400;
      btn.style.display   = show ? 'flex' : 'none';
      btn.style.opacity   = show ? '1'    : '0';
    }, 100);

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ─────────────────────────────────────────────────────────────────
  // 9. HEADER SCROLL SHADOW
  // Adds .scrolled class to .site-header when page is scrolled.
  // ─────────────────────────────────────────────────────────────────

  function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const update = throttle(() => {
      header.classList.toggle('scrolled', window.scrollY > 10);
    }, 100);

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // ─────────────────────────────────────────────────────────────────
  // 10. SMOOTH SCROLL for anchor links
  // ─────────────────────────────────────────────────────────────────

  function initSmoothScroll() {
    document.addEventListener('click', e => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const targetId = link.getAttribute('href').slice(1);
      const target   = document.getElementById(targetId);
      if (!target) return;
      e.preventDefault();
      const headerH = document.querySelector('.site-header')?.offsetHeight || 70;
      const top     = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // 11. FOOTER YEAR
  // Auto-fills any element with id="year"
  // ─────────────────────────────────────────────────────────────────

  function initYear() {
    document.querySelectorAll('#year, .current-year').forEach(el => {
      el.textContent = new Date().getFullYear();
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // 12. LAZY IMAGE LOADING (improved)
  // Use on <img data-src="real-url.jpg" src="placeholder.jpg">
  // Falls back to immediate load if IntersectionObserver not supported.
  // ─────────────────────────────────────────────────────────────────

  function initLazyImages() {
    const lazyImages = document.querySelectorAll('img[data-src]');
    if (!lazyImages.length) return;

    if (!('IntersectionObserver' in window)) {
      // Immediate fallback for old browsers
      lazyImages.forEach(img => {
        img.src = img.dataset.src;
        if (img.dataset.srcset) img.srcset = img.dataset.srcset;
      });
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const img = entry.target;

        // Set real src
        img.src = img.dataset.src;
        if (img.dataset.srcset) img.srcset = img.dataset.srcset;
        if (img.dataset.sizes)  img.sizes  = img.dataset.sizes;

        // Fade in after load
        img.style.opacity   = '0';
        img.style.transition = 'opacity 0.4s ease';
        img.addEventListener('load',  () => { img.style.opacity = '1'; }, { once: true });
        img.addEventListener('error', () => { img.style.opacity = '0.4'; }, { once: true });

        img.removeAttribute('data-src');
        obs.unobserve(img);
      });
    }, {
      rootMargin: '200px 0px',  // start loading 200px before entering viewport
      threshold:  0,
    });

    lazyImages.forEach(img => observer.observe(img));
  }

  /**
   * Manually trigger lazy loading (call after dynamically injecting new images).
   */
  function refreshLazyImages() {
    initLazyImages();
  }

  // ─────────────────────────────────────────────────────────────────
  // 13. PERFORMANCE UTILITIES
  // ─────────────────────────────────────────────────────────────────

  function debounce(fn, ms = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function throttle(fn, ms = 100) {
    let last = 0;
    return function (...args) {
      const now = Date.now();
      if (now - last >= ms) { last = now; fn.apply(this, args); }
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // 14. URL HELPERS
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get a single query param.
   * Akara.getParam('id') → 'vetra-planter'
   */
  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  /**
   * Get all query params as a plain object.
   */
  function getAllParams() {
    const params = {};
    new URLSearchParams(window.location.search).forEach((v, k) => { params[k] = v; });
    return params;
  }

  /**
   * Build a URL with query params.
   * Akara.buildUrl('/catalog.html', { category: 'planters', sort: 'price_asc' })
   * → '/catalog.html?category=planters&sort=price_asc'
   */
  function buildUrl(base, params = {}) {
    const q = new URLSearchParams(params).toString();
    return q ? `${base}?${q}` : base;
  }

  // ─────────────────────────────────────────────────────────────────
  // 15. DOM HELPERS
  // ─────────────────────────────────────────────────────────────────

  /**
   * Shorthand querySelector that returns null instead of throwing.
   */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /**
   * Show/hide an element by toggling display.
   */
  function show(el, display = 'block') {
    if (el) el.style.display = display;
  }
  function hide(el) {
    if (el) el.style.display = 'none';
  }

  // ─────────────────────────────────────────────────────────────────
  // 16. AUTO-INIT
  // Runs automatically when the script loads.
  // Individual inits are guarded so they never throw.
  // ─────────────────────────────────────────────────────────────────

  function init() {
    try { updateCartBadge();    } catch {}
    try { initMobileNav();      } catch {}
    try { markActiveNavLink();  } catch {}
    try { initHeaderScroll();   } catch {}
    try { initSmoothScroll();   } catch {}
    try { initScrollToTop();    } catch {}
    try { initYear();           } catch {}
    try { initLazyImages();     } catch {}
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ─────────────────────────────────────────────────────────────────
  // EXPOSE PUBLIC API
  // ─────────────────────────────────────────────────────────────────

  global.Akara = {
    // Storage
    lsGet, lsSet, lsRemove, KEYS,

    // Formatting
    formatPrice, formatDate, formatRelativeTime, extractGST, escapeHtml,

    // Cart
    getCart, addToCart, removeFromCart, updateCartQty, clearCart,
    getCartTotals, updateCartBadge,

    // Wishlist
    getWishlist, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist,

    // UI
    showToast, refreshLazyImages,

    // URL
    getParam, getAllParams, buildUrl,

    // DOM
    $, $$, show, hide,

    // Utilities
    debounce, throttle,
  };

  // Also expose addToCart and addToWishlist at window level
  // so inline onclick="" handlers can call them directly
  global.addToCart     = addToCart;
  global.addToWishlist = addToWishlist;
  global.showToast     = showToast;

})(window);

/*
 * ═══════════════════════════════════════════════════════════════════
 * QUICK REFERENCE
 * ═══════════════════════════════════════════════════════════════════
 *
 * LOAD (every page, before </body>):
 *   <script src="/utils/main.js"></script>
 *
 * FORMATTING
 *   Akara.formatPrice(2400)                   → '₹2,400'
 *   Akara.formatDate('2026-05-07')            → '7 May 2026'
 *   Akara.formatRelativeTime('2026-05-06')    → 'Yesterday'
 *   Akara.extractGST(2400, 18, false)         → { base, gst, cgst, sgst, igst }
 *   Akara.escapeHtml('<script>')              → '&lt;script&gt;'
 *
 * CART
 *   Akara.addToCart({ id, name, price, qty }) → cart array
 *   Akara.removeFromCart(key)                 → cart array
 *   Akara.updateCartQty(key, qty)             → cart array
 *   Akara.getCartTotals('maharashtra')        → { qty, subtotal, gst, grandTotal }
 *   Akara.clearCart()
 *   Akara.updateCartBadge()                   → updates #cartCount elements
 *   // Inline usage:
 *   <button onclick="addToCart({id:'vetra',name:'Vetra Planter',price:849,qty:1})">Add</button>
 *
 * WISHLIST
 *   Akara.addToWishlist({ id, name, price })  → wishlist array
 *   Akara.removeFromWishlist(id)              → wishlist array
 *   Akara.toggleWishlist(item)               → boolean (true = now in list)
 *   Akara.isInWishlist(id)                   → boolean
 *
 * TOAST
 *   Akara.showToast('Added!', 'success')
 *   Akara.showToast('Error occurred', 'error')
 *   Akara.showToast('Note', 'info')
 *   // types: 'default' | 'success' | 'error' | 'info'
 *
 * URL HELPERS
 *   Akara.getParam('id')                      → 'vetra-planter' | null
 *   Akara.getAllParams()                       → { id: 'vetra', cat: 'planters' }
 *   Akara.buildUrl('/catalog.html', { category: 'planters' })
 *
 * DOM HELPERS
 *   Akara.$('#myBtn')                         → element | null
 *   Akara.$$('.card')                         → array of elements
 *   Akara.show(el); Akara.hide(el);
 *
 * UTILITIES
 *   Akara.debounce(fn, 300)
 *   Akara.throttle(fn, 100)
 *
 * LAZY IMAGES (after dynamically adding images):
 *   Akara.refreshLazyImages()
 *
 * STORAGE
 *   Akara.lsGet('my_key', [])                → value or fallback
 *   Akara.lsSet('my_key', { data: true })    → boolean
 *   Akara.lsRemove('my_key')                 → boolean
 *
 * EVENTS (fired on window):
 *   window.addEventListener('akara:cart:updated',     e => console.log(e.detail.cart))
 *   window.addEventListener('akara:wishlist:updated', e => console.log(e.detail.wishlist))
 *
 * ═══════════════════════════════════════════════════════════════════
 */