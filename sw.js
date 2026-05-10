/**
 * ═══════════════════════════════════════════════════════════════════
 * ATELIER ĀKĀRA — Service Worker (PWA)
 * Precision Forge Labs | akaraonline.co.in
 * ═══════════════════════════════════════════════════════════════════
 *
 * CACHING STRATEGY
 * ─────────────────
 * Static assets (HTML, fonts, icons)  → Cache First
 * Supabase API calls                  → Network First (never cached)
 * Images                              → Stale While Revalidate
 * Everything else                     → Network First with cache fallback
 *
 * HOW TO REGISTER (add to index.html before </body>):
 *   <script>
 *     if ('serviceWorker' in navigator) {
 *       navigator.serviceWorker.register('/sw.js')
 *         .then(reg => console.log('SW registered:', reg.scope))
 *         .catch(err => console.error('SW failed:', err));
 *     }
 *   </script>
 *
 * TO FORCE UPDATE after deploying changes:
 *   Increment CACHE_VERSION below, then push to GitHub.
 *   The old cache will be deleted automatically on next visit.
 * ═══════════════════════════════════════════════════════════════════
 */

const CACHE_VERSION   = 'v3';
const CACHE_STATIC    = `akara-static-${CACHE_VERSION}`;
const CACHE_IMAGES    = `akara-images-${CACHE_VERSION}`;
const CACHE_PAGES     = `akara-pages-${CACHE_VERSION}`;

// ─── URLs to pre-cache on install ─────────────────────────────────
// These are fetched and stored before the SW activates.
// Keep this list lean — only files that MUST work offline.
const PRE_CACHE_URLS = [
  '/',
  '/index.html',
  '/catalog.html',
  '/about.html',
  '/contact.html',
  '/404.html',
  '/offline.html',          // Offline fallback page (see below)
  '/manifest.json',
];

// ─── Never cache these domains / paths ────────────────────────────
const NEVER_CACHE = [
  'supabase.co',            // All Supabase API and auth calls
  'cdn.jsdelivr.net',       // CDN — always fresh
  'fonts.googleapis.com',   // Fonts API
  'fonts.gstatic.com',      // Fonts files (browser caches these)
  'razorpay.com',           // Payment gateway
  'checkout.razorpay.com',
];

// ─── Static file extensions — Cache First ─────────────────────────
const STATIC_EXTENSIONS = ['.js', '.css', '.woff', '.woff2', '.ttf', '.otf', '.ico', '.svg', '.webmanifest'];

// ─── Image extensions — Stale While Revalidate ────────────────────
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

function matchesExtension(url, extensions) {
  try {
    const pathname = new URL(url).pathname;
    return extensions.some(ext => pathname.toLowerCase().endsWith(ext));
  } catch {
    return false;
  }
}

function shouldNeverCache(url) {
  return NEVER_CACHE.some(domain => url.includes(domain));
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

function isGetRequest(request) {
  return request.method === 'GET';
}

// ─────────────────────────────────────────────────────────────────
// INSTALL — Pre-cache critical assets
// ─────────────────────────────────────────────────────────────────

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => {
        // Use individual fetches so one 404 doesn't block everything
        return Promise.allSettled(
          PRE_CACHE_URLS.map(url =>
            cache.add(url).catch(err => {
              console.warn(`[SW] Pre-cache failed for ${url}:`, err.message);
            })
          )
        );
      })
      .then(() => {
        console.log(`[SW] Installed ${CACHE_VERSION} — pre-cache complete`);
        // Skip waiting — activate immediately without waiting for old tabs to close
        return self.skipWaiting();
      })
  );
});

// ─────────────────────────────────────────────────────────────────
// ACTIVATE — Delete old caches
// ─────────────────────────────────────────────────────────────────

self.addEventListener('activate', event => {
  const currentCaches = [CACHE_STATIC, CACHE_IMAGES, CACHE_PAGES];

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        const toDelete = cacheNames.filter(name =>
          name.startsWith('akara-') && !currentCaches.includes(name)
        );
        return Promise.all(toDelete.map(name => {
          console.log(`[SW] Deleting old cache: ${name}`);
          return caches.delete(name);
        }));
      })
      .then(() => {
        console.log(`[SW] Activated ${CACHE_VERSION}`);
        // Take control of all open clients immediately
        return self.clients.claim();
      })
  );
});

// ─────────────────────────────────────────────────────────────────
// FETCH — Strategy routing
// ─────────────────────────────────────────────────────────────────

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = request.url;

  // 1. Only intercept GET requests
  if (!isGetRequest(request)) return;

  // 2. Never cache Supabase, CDN, payment, etc.
  if (shouldNeverCache(url)) return;

  // 3. Static files (JS, CSS, fonts) → Cache First
  if (matchesExtension(url, STATIC_EXTENSIONS)) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  // 4. Images → Stale While Revalidate
  if (matchesExtension(url, IMAGE_EXTENSIONS)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_IMAGES));
    return;
  }

  // 5. Page navigation → Network First with offline fallback
  if (isNavigationRequest(request)) {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // 6. Everything else → Network First
  event.respondWith(networkFirst(request, CACHE_PAGES));
});

// ─────────────────────────────────────────────────────────────────
// STRATEGIES
// ─────────────────────────────────────────────────────────────────

/**
 * Cache First — return cached version, fall back to network.
 * Best for: static assets that change rarely (JS, CSS, fonts).
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline — asset unavailable', { status: 503 });
  }
}

/**
 * Stale While Revalidate — return cached immediately, update in background.
 * Best for: product images — fast display, always freshening up.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkFetch = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached || networkFetch;
}

/**
 * Network First — always try network, fall back to cache.
 * Best for: API responses, frequently updated content.
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline — content unavailable', { status: 503 });
  }
}

/**
 * Network First with offline HTML fallback.
 * For navigation: tries network, falls back to cached page, then /offline.html.
 */
async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_PAGES);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Try the specific page from cache
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fall back to the root cached page (SPA-style)
    const indexCache = await caches.match('/index.html');
    if (indexCache) return indexCache;

    // Final fallback — offline page
    const offlineCache = await caches.match('/offline.html');
    return offlineCache || new Response(OFFLINE_FALLBACK_HTML, {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

// ─────────────────────────────────────────────────────────────────
// BACKGROUND SYNC — Queue failed requests for retry
// (e.g. add-to-cart or form submission while offline)
// ─────────────────────────────────────────────────────────────────

self.addEventListener('sync', event => {
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  }
  if (event.tag === 'sync-form') {
    event.waitUntil(syncForms());
  }
});

async function syncCart() {
  // Cart is already persisted in localStorage on the client.
  // When the client reconnects, it reads from localStorage and
  // syncs to Supabase automatically on next page load.
  // This sync tag is a hook for future server-side cart logic.
  console.log('[SW] Background sync: cart');
}

async function syncForms() {
  // Future: read from IndexedDB, retry failed form submissions
  console.log('[SW] Background sync: forms');
}

// ─────────────────────────────────────────────────────────────────
// PUSH NOTIFICATIONS — For drop alerts, order updates
// ─────────────────────────────────────────────────────────────────

self.addEventListener('push', event => {
  if (!event.data) return;

  let data;
  try { data = event.data.json(); } catch { data = { title: 'Atelier Ākāra', body: event.data.text() }; }

  const title   = data.title || 'Atelier Ākāra';
  const options = {
    body:    data.body || 'You have a new notification.',
    icon:    '/assets/images/icon-192.png',
    badge:   '/assets/images/badge-72.png',
    tag:     data.tag  || 'akara-notification',
    data:    { url: data.url || '/' },
    actions: data.actions || [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    vibrate:  [200, 100, 200],
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Focus existing window if already open
        const existing = windowClients.find(c => c.url.includes(self.location.origin) && 'focus' in c);
        if (existing) return existing.focus().then(c => c.navigate(targetUrl));
        // Open new window
        return clients.openWindow(targetUrl);
      })
  );
});

// ─────────────────────────────────────────────────────────────────
// INLINE OFFLINE FALLBACK HTML
// Shown when the user is offline and no cached page is available.
// Matches Atelier Ākāra brand design.
// ─────────────────────────────────────────────────────────────────

const OFFLINE_FALLBACK_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Offline — Atelier Ākāra</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=Josefin+Sans:wght@300;400&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Josefin Sans',sans-serif;background:#002b2b;color:#fff8e7;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2rem;}
    body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 80% 60% at 15% 5%,rgba(0,95,95,0.3) 0%,transparent 60%);pointer-events:none;}
    .icon{font-size:3rem;opacity:0.2;margin-bottom:1.5rem;}
    h1{font-family:'Cormorant Garamond',serif;font-size:clamp(2rem,5vw,3.5rem);font-weight:300;letter-spacing:0.1em;color:#fff8e7;margin-bottom:0.5rem;}
    .divider{width:40px;height:1px;background:#c9a96e;opacity:0.4;margin:0.75rem auto 1rem;}
    p{font-size:0.78rem;letter-spacing:0.07em;color:rgba(255,248,231,0.55);line-height:1.8;max-width:420px;margin-bottom:2rem;}
    .btn{display:inline-block;padding:0.85rem 2.5rem;font-family:'Josefin Sans',sans-serif;font-size:0.65rem;letter-spacing:0.3em;text-transform:uppercase;color:#002b2b;background:#c9a96e;border:1px solid #c9a96e;cursor:pointer;text-decoration:none;transition:all 0.25s;}
    .btn:hover{background:transparent;color:#c9a96e;}
    .note{font-size:0.62rem;letter-spacing:0.1em;color:rgba(255,248,231,0.35);margin-top:1.5rem;}
  </style>
</head>
<body>
  <div class="icon">◈</div>
  <h1>You're Offline</h1>
  <div class="divider"></div>
  <p>It looks like you've lost your internet connection. Some pages you've visited recently may still be available from cache.</p>
  <a href="/" class="btn" onclick="window.location.reload()">Try Again</a>
  <p class="note">Atelier Ākāra · akaraonline.co.in</p>
</body>
</html>`;

// ─────────────────────────────────────────────────────────────────
// CACHE SIZE MANAGEMENT
// Limit image cache to 60 entries to prevent storage bloat
// ─────────────────────────────────────────────────────────────────

const IMAGE_CACHE_LIMIT = 60;

async function trimImageCache() {
  const cache = await caches.open(CACHE_IMAGES);
  const keys  = await cache.keys();
  if (keys.length > IMAGE_CACHE_LIMIT) {
    // Delete oldest entries (front of array = oldest)
    const toDelete = keys.slice(0, keys.length - IMAGE_CACHE_LIMIT);
    await Promise.all(toDelete.map(key => cache.delete(key)));
    console.log(`[SW] Trimmed image cache: removed ${toDelete.length} entries`);
  }
}

// Run cache trim after each activation
self.addEventListener('activate', () => {
  trimImageCache().catch(() => {});
});