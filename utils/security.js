/**
 * ═══════════════════════════════════════════════════════════════════
 * ATELIER ĀKĀRA — Security & Validation Utilities
 * Precision Forge Labs | akaraonline.co.in
 * ═══════════════════════════════════════════════════════════════════
 *
 * HOW TO USE ON GITHUB PAGES
 * ───────────────────────────
 * Since GitHub Pages serves static files, ES module imports DON'T work
 * across file boundaries (no build step). Two options:
 *
 * Option A — Inline (recommended for self-contained pages):
 *   Copy the contents of this file into a <script> block on each page.
 *   All functions are attached to window.AkaraUtils so they never
 *   pollute global scope.
 *
 * Option B — Loaded as a regular script (NOT a module):
 *   <script src="../utils/security.js"></script>
 *   Then call: AkaraUtils.sanitizeInput(value), AkaraUtils.isValidEmail(email), etc.
 *
 * ───────────────────────────────────────────────────────────────────
 * WHAT'S IMPROVED vs. the old security.js
 * ───────────────────────────────────────
 * ✓ No ES module exports — works in plain <script> tags on GitHub Pages
 * ✓ All functions namespaced under window.AkaraUtils (no global leaks)
 * ✓ Rate limiter — prevents brute-force on login/auth forms
 * ✓ GSTIN validator — for B2B invoice requests (new for Ākāra)
 * ✓ Better password strength (0–4 numeric score for UI meters)
 * ✓ XSS protection via DOMPurify-style escaping
 * ✓ CSRF token generator for form submissions
 * ✓ Input debounce utility for real-time validation
 * ✓ Admin auth via is_admin column only (not UUID — simpler & safer)
 * ✓ Graceful fallback if Supabase not configured
 * ✓ All async functions return { ok, error } objects — no bare throws
 * ═══════════════════════════════════════════════════════════════════
 */

;(function (global) {
  'use strict';

  // ─────────────────────────────────────────────────────────────────
  // NAMESPACE
  // ─────────────────────────────────────────────────────────────────
  const Utils = {};

  // ─────────────────────────────────────────────────────────────────
  // 1. INPUT SANITIZATION
  // ─────────────────────────────────────────────────────────────────

  /**
   * Trim whitespace from any string value.
   * Returns non-strings unchanged.
   */
  Utils.sanitizeInput = function (value) {
    if (typeof value !== 'string') return value;
    return value.trim();
  };

  /**
   * Escape HTML special characters to prevent XSS.
   * Use when inserting user-supplied text into innerHTML.
   */
  Utils.escapeHtml = function (text) {
    if (typeof text !== 'string') return String(text);
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  /**
   * Strip HTML tags entirely from a string.
   * More aggressive than escapeHtml — use for plain-text-only fields.
   */
  Utils.stripHtml = function (text) {
    if (typeof text !== 'string') return String(text);
    return text.replace(/<[^>]*>/g, '');
  };

  /**
   * Sanitize all inputs inside a form element and return a plain object.
   */
  Utils.sanitizeForm = function (formElement) {
    if (!(formElement instanceof HTMLFormElement)) return {};
    const formData = new FormData(formElement);
    const result = {};
    for (const [key, value] of formData.entries()) {
      result[key] = Utils.sanitizeInput(value);
    }
    return result;
  };

  // ─────────────────────────────────────────────────────────────────
  // 2. VALIDATORS
  // ─────────────────────────────────────────────────────────────────

  /** Email — RFC-style check */
  Utils.isValidEmail = function (email) {
    const s = Utils.sanitizeInput(email);
    return s.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
  };

  /**
   * Password — returns { isValid, score (0–4), checks }
   * score: 0 = too short, 1 = weak, 2 = fair, 3 = good, 4 = strong
   */
  Utils.validatePassword = function (password) {
    const s = Utils.sanitizeInput(password);
    const checks = {
      length:   s.length >= 8,
      uppercase:/[A-Z]/.test(s),
      lowercase:/[a-z]/.test(s),
      number:   /[0-9]/.test(s),
      special:  /[^A-Za-z0-9]/.test(s),
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const score  = s.length === 0 ? 0 : Math.min(4, passed);
    return {
      isValid: checks.length && checks.uppercase && checks.lowercase && checks.number,
      score,
      checks,
    };
  };

  /**
   * Indian phone number — accepts 10 digits, optional +91 or 0 prefix.
   * Valid starting digits: 6–9.
   */
  Utils.isValidPhone = function (phone) {
    const s = Utils.sanitizeInput(phone).replace(/[\s\-()]/g, '');
    return /^(\+91|0)?[6-9]\d{9}$/.test(s);
  };

  /** Indian PIN code — 6 digits, first digit non-zero */
  Utils.isValidPincode = function (pincode) {
    const s = Utils.sanitizeInput(pincode);
    return /^[1-9][0-9]{5}$/.test(s);
  };

  /** Person / business name — letters, spaces, hyphens, apostrophes */
  Utils.isValidName = function (name) {
    const s = Utils.sanitizeInput(name);
    return s.length > 0 && /^[a-zA-Z\u0900-\u097F\s'\-]+$/.test(s);
  };

  /**
   * GSTIN — Indian Goods & Services Tax Identification Number.
   * Format: 2-digit state code + 10-char PAN + 1-char entity + 1-char Z + 1-char checksum
   * Example: 27GZCPS9353H1ZQ
   */
  Utils.isValidGSTIN = function (gstin) {
    const s = Utils.sanitizeInput(gstin).toUpperCase();
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(s);
  };

  /** Non-empty after trim */
  Utils.isRequired = function (value) {
    return Utils.sanitizeInput(String(value ?? '')).length > 0;
  };

  /** URL — basic http/https check */
  Utils.isValidUrl = function (url) {
    try {
      const u = new URL(Utils.sanitizeInput(url));
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // 3. COMPREHENSIVE FORM VALIDATION
  // ─────────────────────────────────────────────────────────────────

  /**
   * Validate a plain-object payload against a rules map.
   *
   * Rules object shape:
   * {
   *   email:    { label: 'Email', required: true, type: 'email' },
   *   phone:    { label: 'Phone', required: false, type: 'phone' },
   *   gstin:    { label: 'GSTIN', required: false, type: 'gstin' },
   *   password: { label: 'Password', required: true, type: 'password' },
   *   name:     { label: 'Name', required: true, type: 'name', minLength: 2, maxLength: 80 },
   *   pincode:  { label: 'Pincode', required: true, type: 'pincode' },
   *   note:     { label: 'Note', required: false, maxLength: 500 },
   * }
   *
   * Returns { isValid: boolean, errors: { fieldName: 'message' } }
   */
  Utils.validateFormData = function (data, rules) {
    const errors = {};

    for (const field in rules) {
      const value     = String(data[field] ?? '');
      const rule      = rules[field];
      const label     = rule.label || field;
      const sanitized = Utils.sanitizeInput(value);
      const isEmpty   = sanitized.length === 0;

      if (rule.required && isEmpty) {
        errors[field] = `${label} is required`;
        continue;
      }
      if (isEmpty && !rule.required) continue;

      if (rule.type === 'email'    && !Utils.isValidEmail(value))     { errors[field] = `${label}: invalid email address`; continue; }
      if (rule.type === 'phone'    && !Utils.isValidPhone(value))     { errors[field] = `${label}: invalid Indian phone number`; continue; }
      if (rule.type === 'pincode'  && !Utils.isValidPincode(value))   { errors[field] = `${label}: invalid PIN code (6 digits)`; continue; }
      if (rule.type === 'name'     && !Utils.isValidName(value))      { errors[field] = `${label}: only letters, spaces, hyphens allowed`; continue; }
      if (rule.type === 'gstin'    && !Utils.isValidGSTIN(value))     { errors[field] = `${label}: invalid GSTIN format`; continue; }
      if (rule.type === 'url'      && !Utils.isValidUrl(value))       { errors[field] = `${label}: invalid URL`; continue; }
      if (rule.type === 'password') {
        const pv = Utils.validatePassword(value);
        if (!pv.isValid) { errors[field] = `${label}: min 8 characters, 1 uppercase, 1 lowercase, 1 number`; continue; }
      }
      if (rule.minLength && sanitized.length < rule.minLength) { errors[field] = `${label}: minimum ${rule.minLength} characters`; continue; }
      if (rule.maxLength && sanitized.length > rule.maxLength) { errors[field] = `${label}: maximum ${rule.maxLength} characters`; continue; }
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  };

  // ─────────────────────────────────────────────────────────────────
  // 4. FORM UI HELPERS
  // ─────────────────────────────────────────────────────────────────

  /**
   * Display validation errors next to their form fields.
   * Looks for elements with [name="fieldName"] and appends an error div.
   */
  Utils.displayErrors = function (errors, containerSelector) {
    Utils.clearErrors(containerSelector);
    const root = containerSelector ? document.querySelector(containerSelector) : document;
    if (!root) return;

    for (const field in errors) {
      const input = root.querySelector(`[name="${field}"]`);
      if (!input) continue;

      const wrap = input.closest('.form-field') || input.parentElement;
      wrap?.classList.add('has-error');
      input.classList.add('invalid');

      const errEl = document.createElement('span');
      errEl.className = 'field-err';
      errEl.setAttribute('data-for', field);
      errEl.textContent = errors[field];

      // Insert existing or append
      const existing = wrap?.querySelector('.field-err');
      if (existing) existing.remove();
      wrap?.appendChild(errEl);
    }

    // Focus first errored field
    const firstField = Object.keys(errors)[0];
    if (firstField) root.querySelector(`[name="${firstField}"]`)?.focus();
  };

  /** Clear all displayed errors */
  Utils.clearErrors = function (containerSelector) {
    const root = containerSelector ? document.querySelector(containerSelector) : document;
    if (!root) return;
    root.querySelectorAll('.field-err[data-for]').forEach(el => el.remove());
    root.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
    root.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
  };

  /**
   * Auto-trim inputs on blur and on form submission.
   * Call once per form after DOM is ready.
   */
  Utils.initializeFormSecurity = function (formElement) {
    if (!(formElement instanceof HTMLFormElement)) return;

    const selector = 'input[type="text"], input[type="email"], input[type="tel"], input[type="url"], textarea';

    formElement.addEventListener('submit', () => {
      formElement.querySelectorAll(selector).forEach(el => { el.value = el.value.trim(); });
    });

    formElement.querySelectorAll(selector).forEach(el => {
      el.addEventListener('blur', function () { this.value = this.value.trim(); });
    });
  };

  // ─────────────────────────────────────────────────────────────────
  // 5. RATE LIMITER
  // Prevents brute-force attempts on login / auth forms
  // ─────────────────────────────────────────────────────────────────

  const _rateLimits = {};

  /**
   * Check if an action is rate-limited.
   *
   * @param {string} key       — Unique key (e.g. 'login', 'reset')
   * @param {number} maxAttempts — Max allowed attempts
   * @param {number} windowMs  — Time window in milliseconds
   * @returns {{ allowed: boolean, remaining: number, resetInMs: number }}
   */
  Utils.checkRateLimit = function (key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const now    = Date.now();
    const record = _rateLimits[key] || { attempts: [], blockedUntil: 0 };

    // Still in block window?
    if (record.blockedUntil > now) {
      return { allowed: false, remaining: 0, resetInMs: record.blockedUntil - now };
    }

    // Prune attempts outside the window
    record.attempts = record.attempts.filter(t => now - t < windowMs);

    if (record.attempts.length >= maxAttempts) {
      record.blockedUntil = now + windowMs;
      _rateLimits[key] = record;
      return { allowed: false, remaining: 0, resetInMs: windowMs };
    }

    record.attempts.push(now);
    _rateLimits[key] = record;
    return { allowed: true, remaining: maxAttempts - record.attempts.length, resetInMs: 0 };
  };

  /** Reset rate limit for a key (call on successful auth) */
  Utils.resetRateLimit = function (key) {
    delete _rateLimits[key];
  };

  /** Format milliseconds as "X minutes Y seconds" */
  Utils.formatRateLimitReset = function (ms) {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  // ─────────────────────────────────────────────────────────────────
  // 6. SECURE ID / TOKEN GENERATION
  // ─────────────────────────────────────────────────────────────────

  /**
   * Generate a cryptographically random alphanumeric ID.
   * Default length 8, uppercase only. Useful for member IDs, ticket IDs, etc.
   */
  Utils.generateSecureId = function (length = 8, prefix = '') {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    const id = Array.from(array, b => chars[b % chars.length]).join('');
    return prefix ? `${prefix}-${id}` : id;
  };

  /**
   * Generate a CSRF token and store it in sessionStorage.
   * Include as a hidden field on sensitive forms.
   */
  Utils.generateCSRFToken = function () {
    const token = Utils.generateSecureId(32);
    sessionStorage.setItem('akara_csrf', token);
    return token;
  };

  /** Verify a CSRF token against the stored one */
  Utils.verifyCSRFToken = function (token) {
    return token === sessionStorage.getItem('akara_csrf');
  };

  // ─────────────────────────────────────────────────────────────────
  // 7. UTILITY HELPERS
  // ─────────────────────────────────────────────────────────────────

  /**
   * Debounce — delays a function call until ms have passed since last invocation.
   * Use for real-time validation on keyup to avoid validating every keystroke.
   *
   * Usage:
   *   input.addEventListener('input', AkaraUtils.debounce(validateFn, 300));
   */
  Utils.debounce = function (fn, ms = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  };

  /**
   * Throttle — executes fn at most once every ms milliseconds.
   */
  Utils.throttle = function (fn, ms = 300) {
    let last = 0;
    return function (...args) {
      const now = Date.now();
      if (now - last >= ms) { last = now; fn.apply(this, args); }
    };
  };

  /**
   * Format INR currency for display.
   * Utils.formatINR(2400) → '₹2,400'
   */
  Utils.formatINR = function (amount) {
    return '₹' + Number(amount).toLocaleString('en-IN');
  };

  /**
   * Extract GST from a GST-inclusive amount.
   * Returns { base, gst, cgst, sgst, igst }
   * @param {number} total — GST-inclusive amount
   * @param {number} rate  — GST rate (default 18)
   * @param {boolean} isInterstate — true = IGST, false = CGST+SGST
   */
  Utils.extractGST = function (total, rate = 18, isInterstate = false) {
    const base = Math.round(total / (1 + rate / 100));
    const gst  = total - base;
    return {
      base,
      gst,
      cgst: isInterstate ? 0 : Math.round(gst / 2),
      sgst: isInterstate ? 0 : Math.round(gst / 2),
      igst: isInterstate ? gst : 0,
    };
  };

  // ─────────────────────────────────────────────────────────────────
  // 8. SUPABASE AUTH HELPERS
  // All return { ok: boolean, error?: string, data?: any }
  // so callers never need to catch — just check .ok
  // ─────────────────────────────────────────────────────────────────

  /** Returns true if there is an active Supabase session */
  Utils.isAuthenticated = async function (supabase) {
    if (!supabase) return { ok: false, error: 'Supabase not configured' };
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) return { ok: false, error: error.message };
      return { ok: !!session };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };

  /** Returns true if the current user's email is confirmed */
  Utils.isEmailVerified = async function (supabase) {
    if (!supabase) return { ok: false, error: 'Supabase not configured' };
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return { ok: false, error: error?.message || 'Not signed in' };
      return { ok: !!user.email_confirmed_at };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };

  /**
   * Returns true if the current user has is_admin = true in profiles table.
   * No longer requires ADMIN_UUID — uses the profiles column instead.
   */
  Utils.isAdmin = async function (supabase) {
    if (!supabase) return { ok: false, error: 'Supabase not configured' };
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) return { ok: false, error: 'Not signed in' };

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (profileErr) return { ok: false, error: profileErr.message };
      return { ok: profile?.is_admin === true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };

  /**
   * Guard: redirect to loginUrl if not authenticated.
   * Returns true if auth passed, false if redirected.
   */
  Utils.requireAuth = async function (supabase, loginUrl = '../auth/login.html') {
    const result = await Utils.isAuthenticated(supabase);
    if (!result.ok) { window.location.href = loginUrl; return false; }
    return true;
  };

  /**
   * Guard: redirect to loginUrl if email not verified.
   * Signs user out before redirecting.
   */
  Utils.requireVerification = async function (supabase, loginUrl = '../auth/login.html') {
    const result = await Utils.isEmailVerified(supabase);
    if (!result.ok) {
      if (supabase) await supabase.auth.signOut().catch(() => {});
      window.location.href = loginUrl;
      return false;
    }
    return true;
  };

  /**
   * Guard: redirect to loginUrl if not admin.
   */
  Utils.requireAdmin = async function (supabase, loginUrl = '../auth/login.html') {
    const result = await Utils.isAdmin(supabase);
    if (!result.ok) { window.location.href = loginUrl; return false; }
    return true;
  };

  /**
   * Full auth chain: authenticated → verified → (optionally) admin.
   * Returns true only if all checks pass.
   *
   * Usage on admin pages:
   *   const ok = await AkaraUtils.guardPage(supabase, { requireAdmin: true });
   *   if (!ok) return;
   *
   * Usage on user pages:
   *   const ok = await AkaraUtils.guardPage(supabase);
   *   if (!ok) return;
   */
  Utils.guardPage = async function (supabase, options = {}) {
    const { requireAdmin = false, loginUrl = '../auth/login.html' } = options;

    const authResult = await Utils.isAuthenticated(supabase);
    if (!authResult.ok) { window.location.href = loginUrl; return false; }

    const verResult = await Utils.isEmailVerified(supabase);
    if (!verResult.ok) {
      if (supabase) await supabase.auth.signOut().catch(() => {});
      window.location.href = loginUrl;
      return false;
    }

    if (requireAdmin) {
      const adminResult = await Utils.isAdmin(supabase);
      if (!adminResult.ok) { window.location.href = loginUrl; return false; }
    }

    return true;
  };

  /**
   * Get the current user's profile from the profiles table.
   * Returns { ok, data, error }
   */
  Utils.getProfile = async function (supabase) {
    if (!supabase) return { ok: false, error: 'Supabase not configured' };
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) return { ok: false, error: 'Not signed in' };

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) return { ok: false, error: error.message };
      return { ok: true, data: { ...data, email: user.email } };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // EXPOSE
  // ─────────────────────────────────────────────────────────────────
  global.AkaraUtils = Utils;

})(window);

/*
 * ═══════════════════════════════════════════════════════════════════
 * QUICK REFERENCE
 * ═══════════════════════════════════════════════════════════════════
 *
 * SANITIZATION
 *   AkaraUtils.sanitizeInput(value)           → trimmed string
 *   AkaraUtils.escapeHtml(text)               → HTML-safe string
 *   AkaraUtils.stripHtml(text)                → tags removed
 *   AkaraUtils.sanitizeForm(formEl)           → { field: value }
 *
 * VALIDATORS
 *   AkaraUtils.isValidEmail(email)            → boolean
 *   AkaraUtils.validatePassword(password)     → { isValid, score 0–4, checks }
 *   AkaraUtils.isValidPhone(phone)            → boolean (Indian +91)
 *   AkaraUtils.isValidPincode(pincode)        → boolean (6-digit Indian)
 *   AkaraUtils.isValidName(name)              → boolean
 *   AkaraUtils.isValidGSTIN(gstin)            → boolean
 *   AkaraUtils.isRequired(value)              → boolean
 *   AkaraUtils.isValidUrl(url)               → boolean
 *   AkaraUtils.validateFormData(data, rules)  → { isValid, errors }
 *
 * FORM UI
 *   AkaraUtils.displayErrors(errors, sel?)    → void
 *   AkaraUtils.clearErrors(sel?)              → void
 *   AkaraUtils.initializeFormSecurity(formEl) → void
 *
 * RATE LIMITING
 *   AkaraUtils.checkRateLimit(key, max, ms)   → { allowed, remaining, resetInMs }
 *   AkaraUtils.resetRateLimit(key)            → void
 *   AkaraUtils.formatRateLimitReset(ms)       → "2m 30s"
 *
 * TOKENS
 *   AkaraUtils.generateSecureId(len, prefix)  → "AKR-X7K2M9PQ"
 *   AkaraUtils.generateCSRFToken()            → token string + saves to sessionStorage
 *   AkaraUtils.verifyCSRFToken(token)         → boolean
 *
 * UTILITIES
 *   AkaraUtils.debounce(fn, ms)               → debounced function
 *   AkaraUtils.throttle(fn, ms)               → throttled function
 *   AkaraUtils.formatINR(amount)              → "₹2,400"
 *   AkaraUtils.extractGST(total, rate, inter) → { base, gst, cgst, sgst, igst }
 *
 * SUPABASE AUTH GUARDS
 *   AkaraUtils.isAuthenticated(supabase)      → { ok, error? }
 *   AkaraUtils.isEmailVerified(supabase)      → { ok, error? }
 *   AkaraUtils.isAdmin(supabase)              → { ok, error? }
 *   AkaraUtils.requireAuth(supabase, url?)    → boolean (redirects if false)
 *   AkaraUtils.requireVerification(supabase)  → boolean (redirects if false)
 *   AkaraUtils.requireAdmin(supabase, url?)   → boolean (redirects if false)
 *   AkaraUtils.guardPage(supabase, options?)  → boolean (all-in-one guard)
 *   AkaraUtils.getProfile(supabase)           → { ok, data, error? }
 *
 * EXAMPLE — login form with rate limiting:
 *
 *   async function handleLogin() {
 *     const limit = AkaraUtils.checkRateLimit('login', 5, 15 * 60 * 1000);
 *     if (!limit.allowed) {
 *       showError(`Too many attempts. Try again in ${AkaraUtils.formatRateLimitReset(limit.resetInMs)}`);
 *       return;
 *     }
 *     const email = AkaraUtils.sanitizeInput(document.getElementById('email').value);
 *     if (!AkaraUtils.isValidEmail(email)) { showError('Invalid email'); return; }
 *     const { data, error } = await supabase.auth.signInWithPassword({ email, password });
 *     if (error) { showError(error.message); return; }
 *     AkaraUtils.resetRateLimit('login');
 *     window.location.href = 'profile.html';
 *   }
 *
 * EXAMPLE — protect an admin page:
 *
 *   const supabase = window.supabase.createClient(URL, KEY);
 *   const ok = await AkaraUtils.guardPage(supabase, { requireAdmin: true });
 *   if (!ok) return; // guardPage already redirected
 *   // safe to continue loading admin content
 *
 * ═══════════════════════════════════════════════════════════════════
 */