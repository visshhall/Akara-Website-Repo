/**
 * ═══════════════════════════════════════════════════════════════════
 * ATELIER ĀKĀRA — Rate Limiter
 * Precision Forge Labs | akaraonline.co.in
 * ═══════════════════════════════════════════════════════════════════
 *
 * HOW TO USE
 * ──────────
 * Load as a plain <script>:
 *   <script src="../security/rate-limiter.js"></script>
 *
 * On any form submission:
 *   const result = AkaraRateLimit.check('login', userEmail);
 *   if (!result.allowed) {
 *     showError(`Too many attempts. Try again in ${result.resetLabel}.`);
 *     return;
 *   }
 *
 * On success (reset the counter):
 *   AkaraRateLimit.reset('login', userEmail);
 *
 * ───────────────────────────────────────────────────────────────────
 * BRUTE FORCE RULES (from FEATURES_GUIDE.md)
 * ────────────────────────────────────────────
 *  5 attempts  → 1 hour lockout
 * 10 attempts  → 24 hour lockout
 * 20 attempts  → permanent lock (requires manual reset or email)
 *
 * RATE LIMIT WINDOWS
 * ──────────────────
 * login         → 5 attempts / 15 minutes, escalating lockout
 * signup        → 3 attempts / 30 minutes
 * password_reset→ 3 attempts / 60 minutes
 * contact_form  → 5 attempts / 60 minutes
 * checkout      → 10 attempts / 60 minutes
 * ═══════════════════════════════════════════════════════════════════
 */

;(function (global) {
  'use strict';

  const STORAGE_KEY = 'akara_rate_limits';

  // ─────────────────────────────────────────────────────────────────
  // PRESETS
  // ─────────────────────────────────────────────────────────────────

  const PRESETS = {
    login: {
      maxAttempts:  5,
      windowMs:     15 * 60 * 1000,     // 15 minutes
      escalation: [
        { after:  5, lockMs:  60 * 60 * 1000 },       // 5 attempts  → 1 hour
        { after: 10, lockMs:  24 * 60 * 60 * 1000 },  // 10 attempts → 24 hours
        { after: 20, lockMs:  -1 },                    // 20 attempts → permanent
      ],
    },
    signup: {
      maxAttempts: 3,
      windowMs:    30 * 60 * 1000,
      escalation:  [],
    },
    password_reset: {
      maxAttempts: 3,
      windowMs:    60 * 60 * 1000,
      escalation:  [],
    },
    contact_form: {
      maxAttempts: 5,
      windowMs:    60 * 60 * 1000,
      escalation:  [],
    },
    checkout: {
      maxAttempts: 10,
      windowMs:    60 * 60 * 1000,
      escalation:  [],
    },
    otp: {
      maxAttempts: 5,
      windowMs:    10 * 60 * 1000,
      escalation:  [],
    },
  };

  // ─────────────────────────────────────────────────────────────────
  // STORAGE HELPERS
  // ─────────────────────────────────────────────────────────────────

  function getStore() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveStore(store) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {}
  }

  /**
   * Build a storage key from action + optional identifier (email/IP).
   * Never store raw emails — hash them first.
   */
  function buildKey(action, identifier = '') {
    if (!identifier) return action;
    // Simple hash to avoid storing PII in localStorage
    let h = 0;
    for (let i = 0; i < identifier.length; i++) {
      h = ((h << 5) - h) + identifier.charCodeAt(i);
      h = h | 0;
    }
    return `${action}_${Math.abs(h).toString(36)}`;
  }

  // ─────────────────────────────────────────────────────────────────
  // ESCALATION LOGIC
  // ─────────────────────────────────────────────────────────────────

  function getLockoutDuration(action, totalAttempts) {
    const preset = PRESETS[action];
    if (!preset || !preset.escalation.length) return null;

    let lockMs = null;
    for (const rule of preset.escalation) {
      if (totalAttempts >= rule.after) {
        lockMs = rule.lockMs;
      }
    }
    return lockMs;
  }

  // ─────────────────────────────────────────────────────────────────
  // CORE CHECK
  // ─────────────────────────────────────────────────────────────────

  /**
   * Check if an action is rate-limited.
   *
   * @param {string} action      — preset name or custom string
   * @param {string} identifier  — optional: email, userId, etc.
   * @param {object} options     — override preset: { maxAttempts, windowMs }
   *
   * @returns {{
   *   allowed:     boolean,
   *   remaining:   number,        // attempts left before lockout
   *   attempts:    number,        // total attempts in window
   *   totalAttempts: number,      // all-time attempts
   *   resetInMs:   number,        // ms until lockout lifts (0 if allowed)
   *   resetLabel:  string,        // human-readable "2m 30s"
   *   isPermanent: boolean,       // true if permanently locked
   *   locked:      boolean,       // true if currently locked out
   * }}
   */
  function check(action, identifier = '', options = {}) {
    const preset  = { ...(PRESETS[action] || PRESETS.login), ...options };
    const key     = buildKey(action, identifier);
    const now     = Date.now();
    const store   = getStore();
    const record  = store[key] || { attempts: [], totalAttempts: 0, lockedUntil: 0, permanent: false };

    // Permanent lock
    if (record.permanent) {
      return {
        allowed: false, remaining: 0,
        attempts: record.totalAttempts, totalAttempts: record.totalAttempts,
        resetInMs: -1, resetLabel: 'Account locked — contact support',
        isPermanent: true, locked: true,
      };
    }

    // Active lockout
    if (record.lockedUntil > now) {
      const resetInMs = record.lockedUntil - now;
      return {
        allowed: false, remaining: 0,
        attempts: record.attempts.length, totalAttempts: record.totalAttempts,
        resetInMs, resetLabel: formatMs(resetInMs),
        isPermanent: false, locked: true,
      };
    }

    // Prune attempts outside the window
    record.attempts = (record.attempts || []).filter(t => now - t < preset.windowMs);

    if (record.attempts.length >= preset.maxAttempts) {
      // Determine escalation lockout
      const lockMs = getLockoutDuration(action, record.totalAttempts + 1);

      if (lockMs === -1) {
        // Permanent lock
        record.permanent = true;
        store[key] = record;
        saveStore(store);
        return {
          allowed: false, remaining: 0,
          attempts: record.attempts.length, totalAttempts: record.totalAttempts,
          resetInMs: -1, resetLabel: 'Account locked — contact support@akaraonline.co.in',
          isPermanent: true, locked: true,
        };
      }

      const duration    = lockMs || preset.windowMs;
      record.lockedUntil = now + duration;
      store[key]         = record;
      saveStore(store);

      return {
        allowed: false, remaining: 0,
        attempts: record.attempts.length, totalAttempts: record.totalAttempts,
        resetInMs: duration, resetLabel: formatMs(duration),
        isPermanent: false, locked: true,
      };
    }

    // Allowed — record this attempt
    record.attempts.push(now);
    record.totalAttempts = (record.totalAttempts || 0) + 1;
    store[key] = record;
    saveStore(store);

    const remaining = preset.maxAttempts - record.attempts.length;

    return {
      allowed: true,
      remaining,
      attempts:      record.attempts.length,
      totalAttempts: record.totalAttempts,
      resetInMs:  0,
      resetLabel: '',
      isPermanent: false,
      locked:      false,
    };
  }

  /**
   * Record a failed attempt without checking.
   * Use when you want to separate the check from recording.
   */
  function recordFailure(action, identifier = '') {
    return check(action, identifier);
  }

  /**
   * Reset rate limit for a key on success.
   * Call after successful login, form submission, etc.
   */
  function reset(action, identifier = '') {
    const key   = buildKey(action, identifier);
    const store = getStore();
    if (store[key]) {
      // Keep totalAttempts for escalation history, but clear window + lock
      store[key].attempts    = [];
      store[key].lockedUntil = 0;
      // Don't clear permanent — that requires manual admin action
      saveStore(store);
    }
  }

  /**
   * Fully clear a rate limit record (admin use only).
   */
  function clear(action, identifier = '') {
    const key   = buildKey(action, identifier);
    const store = getStore();
    delete store[key];
    saveStore(store);
  }

  /**
   * Clear all rate limit records (e.g. on full sign-out).
   */
  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Get current status without recording an attempt.
   */
  function status(action, identifier = '') {
    const preset  = PRESETS[action] || PRESETS.login;
    const key     = buildKey(action, identifier);
    const now     = Date.now();
    const store   = getStore();
    const record  = store[key] || { attempts: [], totalAttempts: 0, lockedUntil: 0, permanent: false };

    if (record.permanent) {
      return { locked: true, isPermanent: true, remaining: 0, resetInMs: -1, resetLabel: 'Permanently locked' };
    }
    if (record.lockedUntil > now) {
      const resetInMs = record.lockedUntil - now;
      return { locked: true, isPermanent: false, remaining: 0, resetInMs, resetLabel: formatMs(resetInMs) };
    }

    const recentAttempts = (record.attempts || []).filter(t => now - t < preset.windowMs);
    const remaining      = Math.max(0, preset.maxAttempts - recentAttempts.length);

    return {
      locked:       false,
      isPermanent:  false,
      remaining,
      resetInMs:    0,
      resetLabel:   '',
      attempts:     recentAttempts.length,
      totalAttempts:record.totalAttempts || 0,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // UI HELPERS
  // ─────────────────────────────────────────────────────────────────

  /**
   * Format milliseconds as readable string.
   * formatMs(3723000) → "1h 2m 3s"
   */
  function formatMs(ms) {
    if (ms < 0) return 'permanently';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || !parts.length) parts.push(`${s}s`);
    return parts.join(' ');
  }

  /**
   * Start a countdown timer and update a DOM element.
   *
   * Usage:
   *   AkaraRateLimit.startCountdown(resetInMs, document.getElementById('lockMsg'), () => {
   *     // called when countdown reaches zero
   *     enableSubmitButton();
   *   });
   */
  function startCountdown(ms, element, onComplete) {
    if (!element) return;
    let remaining = ms;

    function tick() {
      if (remaining <= 0) {
        element.textContent = '';
        if (typeof onComplete === 'function') onComplete();
        return;
      }
      element.textContent = `Try again in ${formatMs(remaining)}`;
      remaining -= 1000;
      setTimeout(tick, 1000);
    }

    tick();
  }

  /**
   * Attach rate limiting to a form button automatically.
   *
   * Usage:
   *   AkaraRateLimit.protect('login', 'user@email.com', {
   *     button:       document.getElementById('submitBtn'),
   *     errorEl:      document.getElementById('errorMsg'),
   *     onAllowed:    () => submitForm(),
   *   });
   */
  function protect(action, identifier, opts = {}) {
    const { button, errorEl, onAllowed } = opts;

    const result = check(action, identifier);

    if (!result.allowed) {
      if (errorEl) {
        errorEl.textContent = result.isPermanent
          ? `Account locked. Email support@akaraonline.co.in to unlock.`
          : `Too many attempts. Try again in ${result.resetLabel}.`;
        errorEl.style.display = 'block';
      }
      if (button) {
        button.disabled = true;
        if (!result.isPermanent) {
          startCountdown(result.resetInMs, errorEl, () => {
            button.disabled    = false;
            if (errorEl) errorEl.style.display = 'none';
          });
        }
      }
      return false;
    }

    if (result.remaining <= 2 && errorEl) {
      errorEl.textContent  = `Warning: ${result.remaining} attempt${result.remaining !== 1 ? 's' : ''} remaining before lockout.`;
      errorEl.style.display = 'block';
      errorEl.style.color   = 'var(--warning, #e2a96e)';
    }

    if (typeof onAllowed === 'function') onAllowed();
    return true;
  }

  // ─────────────────────────────────────────────────────────────────
  // EXPOSE
  // ─────────────────────────────────────────────────────────────────

  global.AkaraRateLimit = {
    check,
    recordFailure,
    reset,
    clear,
    clearAll,
    status,
    formatMs,
    startCountdown,
    protect,
    PRESETS,
  };

})(window);

/*
 * ═══════════════════════════════════════════════════════════════════
 * QUICK REFERENCE
 * ═══════════════════════════════════════════════════════════════════
 *
 * LOAD:
 *   <script src="../security/rate-limiter.js"></script>
 *
 * CHECK BEFORE SUBMIT:
 *   const result = AkaraRateLimit.check('login', email);
 *   if (!result.allowed) {
 *     showError(`Too many attempts. Try again in ${result.resetLabel}.`);
 *     return;
 *   }
 *
 * RESET ON SUCCESS:
 *   AkaraRateLimit.reset('login', email);
 *
 * GET STATUS (no side effects):
 *   const s = AkaraRateLimit.status('login', email);
 *   // { locked, remaining, resetInMs, resetLabel, isPermanent }
 *
 * START COUNTDOWN IN UI:
 *   AkaraRateLimit.startCountdown(result.resetInMs, document.getElementById('errMsg'), () => {
 *     submitBtn.disabled = false;
 *   });
 *
 * AUTO-PROTECT A BUTTON:
 *   AkaraRateLimit.protect('login', email, {
 *     button:    document.getElementById('loginBtn'),
 *     errorEl:   document.getElementById('loginErr'),
 *     onAllowed: () => doLogin(),
 *   });
 *
 * LOCKOUT RULES:
 *   login:          5 att / 15min → 1hr lock → 24hr lock → permanent
 *   signup:         3 att / 30min
 *   password_reset: 3 att / 60min
 *   contact_form:   5 att / 60min
 *   checkout:       10 att / 60min
 *   otp:            5 att / 10min
 *
 * ═══════════════════════════════════════════════════════════════════
 */