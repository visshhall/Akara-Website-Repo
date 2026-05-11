/**
 * ═══════════════════════════════════════════════════════════════════
 * ATELIER ĀKĀRA — Device Tracker
 * Precision Forge Labs | akaraonline.co.in
 * ═══════════════════════════════════════════════════════════════════
 *
 * HOW TO USE
 * ──────────
 * Load after Supabase client is initialised:
 *   <script src="../security/device-tracker.js"></script>
 *
 * On login success:
 *   await AkaraDeviceTracker.recordLogin(supabase, userId);
 *
 * On page load for authenticated users:
 *   const ok = await AkaraDeviceTracker.verifyDevice(supabase, userId);
 *   if (!ok) { force re-auth }
 *
 * ───────────────────────────────────────────────────────────────────
 * WHAT IT DOES
 * ────────────
 * ✓ Generates a stable device fingerprint (no external libs)
 * ✓ Stores trusted devices in localStorage + Supabase profiles
 * ✓ Detects logins from new/unrecognised devices
 * ✓ Tracks last seen timestamp per device
 * ✓ Max 5 trusted devices per account (oldest auto-removed)
 * ✓ Never stores PII — only anonymised fingerprint hash
 * ✓ Session validation on sensitive pages
 * ═══════════════════════════════════════════════════════════════════
 */

;(function (global) {
  'use strict';

  const STORAGE_KEY    = 'akara_trusted_devices';
  const MAX_DEVICES    = 5;
  const SESSION_KEY    = 'akara_device_session';

  // ─────────────────────────────────────────────────────────────────
  // 1. DEVICE FINGERPRINTING
  // Collects stable, non-PII browser signals and hashes them.
  // No canvas fingerprinting, no IP collection.
  // ─────────────────────────────────────────────────────────────────

  function collectSignals() {
    const nav = window.navigator;
    const scr = window.screen;

    return {
      userAgent:    nav.userAgent        || '',
      language:     nav.language         || '',
      platform:     nav.platform         || '',
      screenRes:    `${scr.width}x${scr.height}`,
      colorDepth:   scr.colorDepth       || 0,
      timezone:     Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      touchPoints:  nav.maxTouchPoints   || 0,
      cookieEnabled:nav.cookieEnabled    ? '1' : '0',
    };
  }

  /**
   * Simple non-cryptographic hash (djb2 variant).
   * Good enough for device fingerprinting — not for passwords.
   */
  function hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) + h) ^ str.charCodeAt(i);
      h = h >>> 0; // keep unsigned 32-bit
    }
    return h.toString(16).toUpperCase().padStart(8, '0');
  }

  /**
   * Generate a stable device fingerprint string.
   * Returns a short hex string like "A3F2B891-C7D40123"
   */
  function generateFingerprint() {
    const signals = collectSignals();
    const raw     = Object.values(signals).join('|');
    const h1      = hash(raw);
    const h2      = hash(raw.split('').reverse().join(''));
    return `${h1}-${h2}`;
  }

  /**
   * Human-readable device label from user agent.
   * e.g. "Chrome on Windows", "Safari on iPhone"
   */
  function getDeviceLabel() {
    const ua = navigator.userAgent;
    let browser = 'Browser';
    let os      = 'Unknown OS';

    if      (/Edg\//i.test(ua))     browser = 'Edge';
    else if (/OPR\//i.test(ua))     browser = 'Opera';
    else if (/Chrome\//i.test(ua))  browser = 'Chrome';
    else if (/Firefox\//i.test(ua)) browser = 'Firefox';
    else if (/Safari\//i.test(ua))  browser = 'Safari';

    if      (/iPhone|iPad/i.test(ua)) os = 'iOS';
    else if (/Android/i.test(ua))     os = 'Android';
    else if (/Windows/i.test(ua))     os = 'Windows';
    else if (/Mac OS X/i.test(ua))    os = 'macOS';
    else if (/Linux/i.test(ua))       os = 'Linux';

    return `${browser} on ${os}`;
  }

  // ─────────────────────────────────────────────────────────────────
  // 2. TRUSTED DEVICE STORAGE
  // Stored in localStorage as JSON array.
  // Optionally synced to Supabase profiles.trusted_devices (JSONB).
  // ─────────────────────────────────────────────────────────────────

  function getTrustedDevices() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function saveTrustedDevices(devices) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
    } catch {}
  }

  function isDeviceTrusted(fingerprint) {
    return getTrustedDevices().some(d => d.fingerprint === fingerprint);
  }

  function addTrustedDevice(fingerprint, label) {
    let devices = getTrustedDevices();

    // Update if already exists
    const existing = devices.find(d => d.fingerprint === fingerprint);
    if (existing) {
      existing.lastSeen = new Date().toISOString();
      saveTrustedDevices(devices);
      return;
    }

    // Add new device
    const newDevice = {
      fingerprint,
      label,
      addedAt:  new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    };

    devices.unshift(newDevice);

    // Keep only MAX_DEVICES — remove oldest
    if (devices.length > MAX_DEVICES) {
      devices = devices.slice(0, MAX_DEVICES);
    }

    saveTrustedDevices(devices);
  }

  function removeDevice(fingerprint) {
    const devices = getTrustedDevices().filter(d => d.fingerprint !== fingerprint);
    saveTrustedDevices(devices);
  }

  function clearAllDevices() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_KEY);
  }

  // ─────────────────────────────────────────────────────────────────
  // 3. SESSION VALIDATION
  // Stores a session token in sessionStorage on login.
  // Checked on page load — if missing, requires re-auth.
  // ─────────────────────────────────────────────────────────────────

  function createSessionToken(userId, fingerprint) {
    const token = {
      userId,
      fingerprint,
      createdAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    };
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(token));
    } catch {}
    return token;
  }

  function getSessionToken() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function isSessionValid(userId) {
    const token = getSessionToken();
    if (!token) return false;
    if (token.userId !== userId) return false;
    if (Date.now() > token.expiresAt) return false;
    return true;
  }

  function clearSession() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
  }

  // ─────────────────────────────────────────────────────────────────
  // 4. SUPABASE SYNC (optional)
  // Syncs trusted devices to profiles.trusted_devices JSONB column.
  // Falls back gracefully if column doesn't exist.
  // ─────────────────────────────────────────────────────────────────

  async function syncToSupabase(supabase, userId) {
    if (!supabase) return;
    try {
      const devices = getTrustedDevices();
      await supabase
        .from('profiles')
        .update({ trusted_devices: devices, updated_at: new Date().toISOString() })
        .eq('id', userId);
    } catch {
      // Column may not exist yet — silent fail
    }
  }

  async function loadFromSupabase(supabase, userId) {
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('trusted_devices')
        .eq('id', userId)
        .single();

      if (data?.trusted_devices && Array.isArray(data.trusted_devices)) {
        // Merge remote + local, deduplicate by fingerprint
        const local  = getTrustedDevices();
        const remote = data.trusted_devices;
        const merged = [...local];

        remote.forEach(rd => {
          if (!merged.find(d => d.fingerprint === rd.fingerprint)) {
            merged.push(rd);
          }
        });

        saveTrustedDevices(merged.slice(0, MAX_DEVICES));
      }
    } catch {}
  }

  // ─────────────────────────────────────────────────────────────────
  // 5. PUBLIC API
  // ─────────────────────────────────────────────────────────────────

  /**
   * Call on successful login.
   * Marks current device as trusted and creates a session token.
   *
   * @param {object} supabase — Supabase client (or null)
   * @param {string} userId   — auth.users UUID
   * @returns {{ fingerprint, label, isNewDevice }}
   */
  async function recordLogin(supabase, userId) {
    const fingerprint = generateFingerprint();
    const label       = getDeviceLabel();
    const isNewDevice = !isDeviceTrusted(fingerprint);

    await loadFromSupabase(supabase, userId);
    addTrustedDevice(fingerprint, label);
    createSessionToken(userId, fingerprint);
    await syncToSupabase(supabase, userId);

    return { fingerprint, label, isNewDevice };
  }

  /**
   * Call on page load for authenticated pages.
   * Returns true if the current device is trusted and session is valid.
   *
   * @param {object} supabase
   * @param {string} userId
   * @returns {boolean}
   */
  async function verifyDevice(supabase, userId) {
    if (!userId) return false;

    const fingerprint = generateFingerprint();

    // Check session token first (fast path)
    if (isSessionValid(userId)) {
      // Update lastSeen silently
      addTrustedDevice(fingerprint, getDeviceLabel());
      return true;
    }

    // Load from Supabase and re-check
    await loadFromSupabase(supabase, userId);
    return isDeviceTrusted(fingerprint);
  }

  /**
   * Get all trusted devices for display in account settings.
   * @returns {Array}
   */
  function listDevices() {
    return getTrustedDevices().map(d => ({
      fingerprint: d.fingerprint,
      label:       d.label,
      addedAt:     d.addedAt,
      lastSeen:    d.lastSeen,
      isCurrent:   d.fingerprint === generateFingerprint(),
    }));
  }

  /**
   * Remove a specific trusted device (e.g. "sign out from this device").
   */
  async function revokeDevice(supabase, userId, fingerprint) {
    removeDevice(fingerprint);
    if (fingerprint === generateFingerprint()) clearSession();
    await syncToSupabase(supabase, userId);
  }

  /**
   * Remove all trusted devices (full sign-out from all devices).
   */
  async function revokeAllDevices(supabase, userId) {
    clearAllDevices();
    await syncToSupabase(supabase, userId);
  }

  /**
   * Check if the current device is already trusted without async.
   * Use for quick UI decisions (e.g. show "trusted" badge).
   */
  function isCurrentDeviceTrusted() {
    return isDeviceTrusted(generateFingerprint());
  }

  /**
   * Get current device info.
   */
  function getCurrentDevice() {
    return {
      fingerprint: generateFingerprint(),
      label:       getDeviceLabel(),
      isTrusted:   isCurrentDeviceTrusted(),
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // EXPOSE
  // ─────────────────────────────────────────────────────────────────
  global.AkaraDeviceTracker = {
    recordLogin,
    verifyDevice,
    listDevices,
    revokeDevice,
    revokeAllDevices,
    isCurrentDeviceTrusted,
    getCurrentDevice,
    clearSession,
    MAX_DEVICES,
  };

})(window);

/*
 * ═══════════════════════════════════════════════════════════════════
 * QUICK REFERENCE
 * ═══════════════════════════════════════════════════════════════════
 *
 * LOAD:
 *   <script src="../security/device-tracker.js"></script>
 *
 * ON LOGIN SUCCESS:
 *   const { isNewDevice, label } = await AkaraDeviceTracker.recordLogin(supabase, user.id);
 *   if (isNewDevice) showToast(`New sign-in from ${label}`);
 *
 * ON SENSITIVE PAGE LOAD:
 *   const trusted = await AkaraDeviceTracker.verifyDevice(supabase, user.id);
 *   if (!trusted) { window.location.href = '../auth/login.html'; return; }
 *
 * LIST TRUSTED DEVICES (for account settings UI):
 *   const devices = AkaraDeviceTracker.listDevices();
 *   // [{ fingerprint, label, addedAt, lastSeen, isCurrent }]
 *
 * REVOKE A DEVICE:
 *   await AkaraDeviceTracker.revokeDevice(supabase, userId, fingerprint);
 *
 * SIGN OUT ALL DEVICES:
 *   await AkaraDeviceTracker.revokeAllDevices(supabase, userId);
 *
 * ═══════════════════════════════════════════════════════════════════
 */