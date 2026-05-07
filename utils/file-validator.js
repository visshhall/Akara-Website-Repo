/**
 * ═══════════════════════════════════════════════════════════════════
 * ATELIER ĀKĀRA — File Upload Validator
 * Precision Forge Labs | akaraonline.co.in
 * ═══════════════════════════════════════════════════════════════════
 *
 * HOW TO USE ON GITHUB PAGES
 * ───────────────────────────
 * Load as a plain <script> — no build step, no modules:
 *   <script src="../utils/file-validator.js"></script>
 *
 * Then use the global:
 *   const result = await AkaraFiles.validateImage(file);
 *   if (!result.ok) showError(result.error);
 *
 * ───────────────────────────────────────────────────────────────────
 * WHAT'S IMPROVED vs. the old file-validator.js
 * ──────────────────────────────────────────────
 * ✓ No ES module exports — plain <script> compatible
 * ✓ Returns { ok, error } — no bare throws to catch
 * ✓ Image dimension validation (min/max width & height)
 * ✓ Aspect ratio validation (e.g. 1:1 for product images)
 * ✓ Preview URL generator (for showing before upload)
 * ✓ Compression / resize helper before Supabase upload
 * ✓ Supabase Storage upload wrapper with progress
 * ✓ File name sanitizer (removes special chars, spaces)
 * ✓ Validates PDFs (for GST invoice uploads)
 * ✓ Rate limits concurrent uploads (max 3 at once)
 * ✓ All magic byte signatures extended (AVIF, GIF, SVG, PDF)
 * ═══════════════════════════════════════════════════════════════════
 */

;(function (global) {
  'use strict';

  // ─────────────────────────────────────────────────────────────────
  // CONSTANTS
  // ─────────────────────────────────────────────────────────────────

  const LIMITS = {
    product_image: {
      maxSizeMB:   5,
      minWidth:    400,
      minHeight:   400,
      maxWidth:    4000,
      maxHeight:   4000,
      aspectRatio: null,         // null = any ratio
      types:       ['image/jpeg', 'image/png', 'image/webp'],
    },
    avatar: {
      maxSizeMB:   2,
      minWidth:    100,
      minHeight:   100,
      maxWidth:    2000,
      maxHeight:   2000,
      aspectRatio: 1,            // square only
      types:       ['image/jpeg', 'image/png', 'image/webp'],
    },
    document: {
      maxSizeMB:   10,
      minWidth:    null,
      minHeight:   null,
      maxWidth:    null,
      maxHeight:   null,
      aspectRatio: null,
      types:       ['application/pdf'],
    },
    general: {
      maxSizeMB:   8,
      minWidth:    null,
      minHeight:   null,
      maxWidth:    null,
      maxHeight:   null,
      aspectRatio: null,
      types:       ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    },
  };

  // ─────────────────────────────────────────────────────────────────
  // MAGIC BYTE SIGNATURES
  // Real file type detection — cannot be faked by changing extension
  // ─────────────────────────────────────────────────────────────────

  const SIGNATURES = {
    'image/jpeg':       { offset: 0, bytes: [[0xFF, 0xD8, 0xFF]] },
    'image/png':        { offset: 0, bytes: [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]] },
    'image/webp':       { offset: 0, bytes: [[0x52, 0x49, 0x46, 0x46]], also: { offset: 8, bytes: [[0x57, 0x45, 0x42, 0x50]] } },
    'image/gif':        { offset: 0, bytes: [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]] },
    'image/avif':       { offset: 4, bytes: [[0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66]] },
    'application/pdf':  { offset: 0, bytes: [[0x25, 0x50, 0x44, 0x46]] }, // %PDF
  };

  /**
   * Read the first N bytes of a File as a Uint8Array.
   * Much faster than reading the whole file.
   */
  async function readMagicBytes(file, length = 16) {
    return new Promise((resolve, reject) => {
      const slice  = file.slice(0, length);
      const reader = new FileReader();
      reader.onload  = e => resolve(new Uint8Array(e.target.result));
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsArrayBuffer(slice);
    });
  }

  /**
   * Check magic bytes against known signatures.
   * Returns the detected MIME type string, or null if unrecognised.
   */
  async function detectMimeType(file) {
    try {
      const bytes = await readMagicBytes(file, 24);

      for (const [mime, sig] of Object.entries(SIGNATURES)) {
        const primaryMatch = sig.bytes.some(pattern =>
          pattern.every((b, i) => bytes[sig.offset + i] === b)
        );
        if (!primaryMatch) continue;

        // WebP needs a secondary check at offset 8
        if (sig.also) {
          const secondaryMatch = sig.also.bytes.some(pattern =>
            pattern.every((b, i) => bytes[sig.also.offset + i] === b)
          );
          if (!secondaryMatch) continue;
        }

        return mime;
      }

      // SVG — text-based, no magic bytes; check for XML/SVG tags
      const text = await readAsText(file.slice(0, 256));
      if (text.includes('<svg') || text.includes('<?xml')) return 'image/svg+xml';

      return null;
    } catch {
      return null;
    }
  }

  function readAsText(blob) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload  = e => resolve(e.target.result || '');
      reader.onerror = () => resolve('');
      reader.readAsText(blob);
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // DIMENSION & RATIO CHECKER
  // ─────────────────────────────────────────────────────────────────

  function getImageDimensions(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload  = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image dimensions')); };
      img.src     = url;
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // FILE NAME SANITIZER
  // ─────────────────────────────────────────────────────────────────

  /**
   * Produce a safe, URL-friendly file name.
   * "My Product Photo!.JPEG" → "my-product-photo.jpeg"
   */
  function sanitizeFileName(originalName) {
    const ext  = originalName.split('.').pop().toLowerCase();
    const base = originalName
      .replace(/\.[^.]+$/, '')           // remove extension
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')       // non-alphanumeric → hyphens
      .replace(/^-+|-+$/g, '')           // trim leading/trailing hyphens
      .substring(0, 60);                  // max 60 chars
    const ts   = Date.now();
    return `${base || 'file'}-${ts}.${ext}`;
  }

  // ─────────────────────────────────────────────────────────────────
  // CORE VALIDATOR
  // ─────────────────────────────────────────────────────────────────

  /**
   * Validate a file against a preset or custom config.
   *
   * @param {File}   file
   * @param {string|object} preset — 'product_image' | 'avatar' | 'document' | 'general'
   *                                  OR a custom config object matching LIMITS shape
   * @returns {{ ok: boolean, error?: string, warnings?: string[], meta?: object }}
   */
  async function validate(file, preset = 'product_image') {
    const config = typeof preset === 'string' ? (LIMITS[preset] || LIMITS.general) : preset;
    const warnings = [];

    // ── 1. Existence ──────────────────────────────────────────────
    if (!file || !(file instanceof File)) {
      return { ok: false, error: 'No file provided' };
    }

    // ── 2. File size ──────────────────────────────────────────────
    const maxBytes = config.maxSizeMB * 1024 * 1024;
    if (file.size === 0) {
      return { ok: false, error: 'File is empty' };
    }
    if (file.size > maxBytes) {
      return { ok: false, error: `File too large. Maximum is ${config.maxSizeMB}MB (this file: ${(file.size / 1024 / 1024).toFixed(1)}MB)` };
    }

    // ── 3. MIME type (reported by browser) ───────────────────────
    if (config.types && !config.types.includes(file.type)) {
      const allowed = config.types.map(t => t.split('/')[1].toUpperCase()).join(', ');
      return { ok: false, error: `Invalid file type. Allowed: ${allowed}` };
    }

    // ── 4. Magic bytes verification (actual content) ──────────────
    const detectedMime = await detectMimeType(file);
    if (detectedMime === null) {
      return { ok: false, error: 'File format not recognised or may be corrupted' };
    }
    if (detectedMime !== file.type) {
      return { ok: false, error: `File extension does not match content (reported: ${file.type}, detected: ${detectedMime}). Possible security issue.` };
    }

    // ── 5. Image dimension checks ─────────────────────────────────
    let dimensions = null;
    if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
      try {
        dimensions = await getImageDimensions(file);

        if (config.minWidth && dimensions.width < config.minWidth) {
          return { ok: false, error: `Image too small. Minimum width: ${config.minWidth}px (this image: ${dimensions.width}px)` };
        }
        if (config.minHeight && dimensions.height < config.minHeight) {
          return { ok: false, error: `Image too small. Minimum height: ${config.minHeight}px (this image: ${dimensions.height}px)` };
        }
        if (config.maxWidth && dimensions.width > config.maxWidth) {
          warnings.push(`Image is very large (${dimensions.width}px wide). Consider resizing before uploading for faster loads.`);
        }
        if (config.maxHeight && dimensions.height > config.maxHeight) {
          warnings.push(`Image is very tall (${dimensions.height}px). Consider resizing.`);
        }

        // Aspect ratio check
        if (config.aspectRatio !== null && config.aspectRatio !== undefined) {
          const actual = dimensions.width / dimensions.height;
          const tolerance = 0.05; // 5% tolerance
          if (Math.abs(actual - config.aspectRatio) > tolerance) {
            const targetLabel = config.aspectRatio === 1 ? 'square (1:1)' : `${config.aspectRatio}:1`;
            return { ok: false, error: `Image must be ${targetLabel}. This image is ${dimensions.width}×${dimensions.height}px` };
          }
        }
      } catch (e) {
        return { ok: false, error: 'Could not read image dimensions: ' + e.message };
      }
    }

    // ── 6. All checks passed ──────────────────────────────────────
    return {
      ok:   true,
      warnings: warnings.length ? warnings : undefined,
      meta: {
        name:         file.name,
        safeName:     sanitizeFileName(file.name),
        size:         file.size,
        sizeLabel:    formatFileSize(file.size),
        type:         file.type,
        detectedType: detectedMime,
        dimensions,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // PREVIEW URL
  // ─────────────────────────────────────────────────────────────────

  /**
   * Create an object URL for previewing an image file.
   * Remember to call AkaraFiles.revokePreview(url) when done.
   */
  function createPreview(file) {
    if (!file || !file.type.startsWith('image/')) return null;
    return URL.createObjectURL(file);
  }

  function revokePreview(url) {
    if (url) URL.revokeObjectURL(url);
  }

  // ─────────────────────────────────────────────────────────────────
  // IMAGE COMPRESSION / RESIZE
  // Resizes and re-encodes using Canvas before uploading to Supabase.
  // Reduces bandwidth and storage costs.
  // ─────────────────────────────────────────────────────────────────

  /**
   * Compress and optionally resize an image file.
   *
   * @param {File}   file
   * @param {object} options
   *   maxWidth   {number} — default 1200
   *   maxHeight  {number} — default 1200
   *   quality    {number} — 0.0–1.0, default 0.85
   *   outputType {string} — 'image/jpeg' | 'image/webp', default 'image/webp'
   * @returns {{ ok, file, originalSize, compressedSize, ratio }}
   */
  function compress(file, options = {}) {
    const {
      maxWidth   = 1200,
      maxHeight  = 1200,
      quality    = 0.85,
      outputType = 'image/webp',
    } = options;

    return new Promise(resolve => {
      if (!file.type.startsWith('image/')) {
        return resolve({ ok: false, error: 'Not an image file' });
      }

      const url = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);

        // Calculate new dimensions maintaining aspect ratio
        let { naturalWidth: w, naturalHeight: h } = img;
        if (w > maxWidth)  { h = Math.round(h * maxWidth  / w); w = maxWidth;  }
        if (h > maxHeight) { w = Math.round(w * maxHeight / h); h = maxHeight; }

        const canvas = document.createElement('canvas');
        canvas.width  = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        canvas.toBlob(blob => {
          if (!blob) return resolve({ ok: false, error: 'Canvas compression failed' });
          const compressedFile = new File([blob], sanitizeFileName(file.name.replace(/\.[^.]+$/, '.webp')), { type: outputType });
          resolve({
            ok:             true,
            file:           compressedFile,
            originalSize:   file.size,
            compressedSize: compressedFile.size,
            ratio:          +(compressedFile.size / file.size * 100).toFixed(1) + '%',
            dimensions:     { width: w, height: h },
          });
        }, outputType, quality);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ ok: false, error: 'Could not load image for compression' });
      };

      img.src = url;
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // SUPABASE STORAGE UPLOAD
  // ─────────────────────────────────────────────────────────────────

  // Track concurrent uploads
  let _activeUploads = 0;
  const MAX_CONCURRENT = 3;

  /**
   * Validate, optionally compress, then upload to Supabase Storage.
   *
   * @param {object} options
   *   supabase      {object}  — Supabase client
   *   file          {File}
   *   bucket        {string}  — Supabase storage bucket name (e.g. 'product-images')
   *   path          {string}  — Storage path (e.g. 'products/planter-1.webp')
   *   preset        {string}  — Validation preset (default 'product_image')
   *   compress      {boolean} — Compress before uploading (default true)
   *   compressOptions         — Passed to compress()
   *   onProgress    {function(pct)} — Called with 0–100 (simulated)
   *
   * @returns {{ ok, url, path, meta, error? }}
   */
  async function upload(options = {}) {
    const {
      supabase,
      file,
      bucket        = 'product-images',
      path,
      preset        = 'product_image',
      compress: doCompress = true,
      compressOptions = {},
      onProgress    = null,
    } = options;

    if (!supabase)  return { ok: false, error: 'Supabase not configured' };
    if (!file)      return { ok: false, error: 'No file provided' };

    // Rate limit concurrent uploads
    if (_activeUploads >= MAX_CONCURRENT) {
      return { ok: false, error: `Too many simultaneous uploads. Wait for one to finish.` };
    }

    try {
      _activeUploads++;

      // 1. Validate
      const validation = await validate(file, preset);
      if (!validation.ok) return { ok: false, error: validation.error };

      // 2. Optionally compress
      let uploadFile = file;
      let meta       = validation.meta;

      if (doCompress && file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
        const compressed = await compress(file, compressOptions);
        if (compressed.ok) {
          uploadFile = compressed.file;
          meta = { ...meta, ...compressed, safeName: compressed.file.name };
        }
        // If compression fails, continue with original file
      }

      // 3. Build storage path
      const safeName   = meta.safeName || sanitizeFileName(file.name);
      const storagePath = path || `uploads/${Date.now()}-${safeName}`;

      // 4. Simulate progress (Supabase JS SDK v2 doesn't expose upload progress)
      let progressTimer = null;
      if (typeof onProgress === 'function') {
        let pct = 0;
        progressTimer = setInterval(() => {
          pct = Math.min(pct + 10, 85);
          onProgress(pct);
        }, 150);
      }

      // 5. Upload
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(storagePath, uploadFile, {
          cacheControl: '3600',
          upsert:       false,
          contentType:  uploadFile.type,
        });

      if (progressTimer) clearInterval(progressTimer);
      if (typeof onProgress === 'function') onProgress(100);

      if (error) return { ok: false, error: error.message };

      // 6. Get public URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);

      return {
        ok:   true,
        url:  urlData.publicUrl,
        path: storagePath,
        meta,
      };

    } catch (e) {
      return { ok: false, error: e.message };
    } finally {
      _activeUploads--;
    }
  }

  /**
   * Delete a file from Supabase Storage.
   * @param {object} supabase
   * @param {string} bucket
   * @param {string} path
   */
  async function remove(supabase, bucket, path) {
    if (!supabase) return { ok: false, error: 'Supabase not configured' };
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // DRAG & DROP HELPER
  // ─────────────────────────────────────────────────────────────────

  /**
   * Attach drag-and-drop handlers to a drop zone element.
   *
   * Usage:
   *   AkaraFiles.bindDropZone(document.getElementById('dropZone'), {
   *     preset:    'product_image',
   *     onFile:    async (file) => { ... },
   *     onError:   (msg) => showError(msg),
   *   });
   */
  function bindDropZone(element, options = {}) {
    if (!element) return;
    const { preset = 'product_image', onFile, onError, onDragOver, onDragLeave } = options;

    element.addEventListener('dragover', e => {
      e.preventDefault();
      element.classList.add('drag-over');
      onDragOver?.();
    });

    element.addEventListener('dragleave', () => {
      element.classList.remove('drag-over');
      onDragLeave?.();
    });

    element.addEventListener('drop', async e => {
      e.preventDefault();
      element.classList.remove('drag-over');

      const file = e.dataTransfer?.files?.[0];
      if (!file) return;

      const result = await validate(file, preset);
      if (!result.ok) {
        onError?.(result.error);
        return;
      }
      onFile?.(file, result);
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────────────────────────

  function formatFileSize(bytes) {
    if (bytes < 1024)             return bytes + ' B';
    if (bytes < 1024 * 1024)      return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  }

  /**
   * Check if the browser supports required APIs.
   * Useful to show a message if old browser is detected.
   */
  function checkBrowserSupport() {
    const issues = [];
    if (!window.FileReader)    issues.push('FileReader API not supported');
    if (!window.URL?.createObjectURL) issues.push('Object URL API not supported');
    if (!window.crypto?.getRandomValues) issues.push('Web Crypto API not supported');
    if (!HTMLCanvasElement)    issues.push('Canvas API not supported');
    return { supported: issues.length === 0, issues };
  }

  // ─────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────

  const AkaraFiles = {

    // Core
    validate,
    sanitizeFileName,

    // Convenience shortcuts matching old API pattern
    validateImage:    (file) => validate(file, 'product_image'),
    validateAvatar:   (file) => validate(file, 'avatar'),
    validateDocument: (file) => validate(file, 'document'),

    // Preview
    createPreview,
    revokePreview,

    // Compression
    compress,

    // Supabase
    upload,
    remove,

    // Drop zone
    bindDropZone,

    // Utilities
    formatFileSize,
    detectMimeType,
    getImageDimensions,
    checkBrowserSupport,

    // Presets (exposed for customisation)
    LIMITS,
  };

  global.AkaraFiles = AkaraFiles;

})(window);

/*
 * ═══════════════════════════════════════════════════════════════════
 * QUICK REFERENCE
 * ═══════════════════════════════════════════════════════════════════
 *
 * LOAD:
 *   <script src="../utils/file-validator.js"></script>
 *
 * VALIDATE ONLY:
 *   const result = await AkaraFiles.validateImage(file);
 *   if (!result.ok) showError(result.error);
 *   // result.meta → { name, safeName, size, sizeLabel, type, dimensions }
 *   // result.warnings → optional array of non-fatal warnings
 *
 * VALIDATE + UPLOAD TO SUPABASE:
 *   const result = await AkaraFiles.upload({
 *     supabase,
 *     file,
 *     bucket:  'product-images',
 *     path:    'products/planter-1.webp',  // optional
 *     preset:  'product_image',
 *     compress: true,
 *     onProgress: (pct) => updateProgressBar(pct),
 *   });
 *   if (result.ok) saveImageUrl(result.url);
 *
 * PREVIEW BEFORE UPLOAD:
 *   const url = AkaraFiles.createPreview(file);
 *   imgEl.src = url;
 *   // later, when done:
 *   AkaraFiles.revokePreview(url);
 *
 * COMPRESS BEFORE UPLOAD:
 *   const compressed = await AkaraFiles.compress(file, {
 *     maxWidth: 800, maxHeight: 800, quality: 0.8
 *   });
 *   if (compressed.ok) console.log(compressed.ratio); // e.g. "42.3%"
 *
 * DRAG & DROP:
 *   AkaraFiles.bindDropZone(dropZoneEl, {
 *     preset:  'product_image',
 *     onFile:  async (file, meta) => { ... },
 *     onError: (msg) => showError(msg),
 *   });
 *
 * CUSTOM PRESET:
 *   const result = await AkaraFiles.validate(file, {
 *     maxSizeMB:   2,
 *     minWidth:    800,
 *     minHeight:   800,
 *     aspectRatio: 1,   // square only
 *     types: ['image/jpeg', 'image/png'],
 *   });
 *
 * DETECT REAL FILE TYPE:
 *   const mime = await AkaraFiles.detectMimeType(file);
 *   // 'image/jpeg', 'image/png', 'application/pdf', null if unknown
 *
 * CHECK BROWSER SUPPORT:
 *   const { supported, issues } = AkaraFiles.checkBrowserSupport();
 *
 * ═══════════════════════════════════════════════════════════════════
 */