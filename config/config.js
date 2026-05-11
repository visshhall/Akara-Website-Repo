/**
 * ═══════════════════════════════════════════════════════════════════
 * ATELIER ĀKĀRA — Configuration
 * Precision Forge Labs | akaraonline.co.in
 * ═══════════════════════════════════════════════════════════════════
 *
 * This file exists at TWO locations in the repo:
 *   /config.js          ← root (loaded by pages at root level)
 *   /config/config.js   ← subfolder (loaded by pages in subfolders)
 *
 * Both files must be identical.
 *
 * HOW TO USE:
 *   <script src="/config.js"></script>          ← root pages
 *   <script src="../config/config.js"></script>  ← subpages
 *   <script src="../../config/config.js"></script> ← deep subpages
 *
 * After loading, access via:
 *   AkaraConfig.SUPABASE_URL
 *   AkaraConfig.SUPABASE_ANON_KEY
 *   AkaraConfig.RAZORPAY_KEY_ID
 *
 * ── IMPORTANT ─────────────────────────────────────────────────────
 * Only the ANON key goes here — never the service_role key.
 * The anon key is safe to expose client-side (protected by RLS).
 * Regenerate it at: Supabase Dashboard → Settings → API
 * ═══════════════════════════════════════════════════════════════════
 */

;(function (global) {
  'use strict';

  global.AkaraConfig = {

    // ── Supabase ───────────────────────────────────────────────────
    SUPABASE_URL:      'https://agojovxnbouopqvwjhco.supabase.co',
    SUPABASE_ANON_KEY: '',   // ← Paste your NEW anon key here after regenerating

    // ── Site ───────────────────────────────────────────────────────
    SITE_URL:    'https://akaraonline.co.in',
    BRAND_NAME:  'Atelier Ākāra',
    LEGAL_NAME:  'Precision Forge Labs',
    GSTIN:       '27GZCPS9353H1ZQ',
    SUPPORT_EMAIL: 'support@akaraonline.co.in',
    SUPPORT_PHONE: '+91 82780 85572',
    ADMIN_EMAIL:   'support@akaraonline.co.in',
    INSTAGRAM:     'https://instagram.com/atelier.akara',

    // ── Auth redirect URLs ─────────────────────────────────────────
    // Must match exactly what's configured in:
    // Supabase Dashboard → Authentication → URL Configuration
    VERIFY_REDIRECT:   'https://akaraonline.co.in/auth/callback.html',
    PASSWORD_REDIRECT: 'https://akaraonline.co.in/auth/update-password.html',

    // ── Razorpay ───────────────────────────────────────────────────
    // Leave empty until Razorpay KYC is approved.
    // Use rzp_test_xxxxx for testing, rzp_live_xxxxx for production.
    RAZORPAY_KEY_ID: '',

    // ── Shipping ───────────────────────────────────────────────────
    FREE_SHIPPING_THRESHOLD: 2500,  // ₹ — orders above this get free shipping
    STANDARD_SHIPPING_COST:  150,   // ₹
    EXPRESS_SHIPPING_COST:   199,   // ₹

    // ── GST ────────────────────────────────────────────────────────
    GST_RATE:       18,   // %  (CGST 9% + SGST 9% intra / IGST 18% inter)
    HOME_STATE:     'maharashtra',
    HOME_STATE_CODE: '27',

    // ── Reward points ──────────────────────────────────────────────
    POINTS_PER_RUPEE:    0.1,   // 10 points per ₹100
    POINTS_PER_REVIEW:   50,
    POINTS_PER_REFERRAL: 100,
    MIN_REDEEM_POINTS:   2000,

    // ── Production limits ──────────────────────────────────────────
    // Used for capacity warnings in admin
    DAILY_PRODUCTION_MAX:   3,    // planters/day
    MONTHLY_PRODUCTION_MAX: 90,   // units/month

    // ── Feature flags ──────────────────────────────────────────────
    // Set to false to temporarily disable a feature
    FEATURES: {
      bundleBuilder:  true,
      styleQuiz:      true,
      limitedDrops:   true,
      rewardPoints:   true,
      guestCheckout:  true,
      razorpay:       false,  // ← flip to true once KYC approved
    },

    // ── Storage buckets ────────────────────────────────────────────
    BUCKETS: {
      productImages: 'product-images',
      reviewImages:  'review-images',
      invoices:      'invoices',
    },

    // ── Low stock threshold ────────────────────────────────────────
    LOW_STOCK_THRESHOLD: 5,

  };

  // Freeze to prevent accidental mutation
  Object.freeze(global.AkaraConfig);
  Object.freeze(global.AkaraConfig.FEATURES);
  Object.freeze(global.AkaraConfig.BUCKETS);

})(window);

/*
 * ═══════════════════════════════════════════════════════════════════
 * USAGE EXAMPLES
 * ═══════════════════════════════════════════════════════════════════
 *
 * In any page that loads this file:
 *
 *   const supabase = window.supabase.createClient(
 *     AkaraConfig.SUPABASE_URL,
 *     AkaraConfig.SUPABASE_ANON_KEY
 *   );
 *
 *   if (AkaraConfig.FEATURES.razorpay) {
 *     // show Razorpay payment option
 *   }
 *
 *   const isIntraState = (state) =>
 *     state.toLowerCase() === AkaraConfig.HOME_STATE;
 *
 * ═══════════════════════════════════════════════════════════════════
 */