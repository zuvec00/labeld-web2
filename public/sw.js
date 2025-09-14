/**
 * Labeld Scanner PWA Service Worker
 * Optimized for offline scanner functionality and fast loading
 */

const VERSION = "v1.0.1";
const STATIC_CACHE = `labeld-static-${VERSION}`;
const PAGE_CACHE = `labeld-pages-${VERSION}`;
const API_CACHE = `labeld-api-${VERSION}`;

// Critical assets for scanner functionality
const STATIC_ASSETS = [
  "/",
  "/scan",
  "/manifest.webmanifest",
  // Icons
  "/icons/icon-72.png",
  "/icons/icon-96.png", 
  "/icons/icon-128.png",
  "/icons/icon-144.png",
  "/icons/icon-152.png",
  "/icons/icon-192.png",
  "/icons/icon-384.png",
  "/icons/icon-512.png",
  "/icons/maskable-192.png",
  "/icons/maskable-512.png",
  // Critical CSS/JS for scanner
  "/_next/static/css/", // Will be populated dynamically
  "/_next/static/js/",  // Will be populated dynamically
];

// Scanner-specific routes that should be cached
const SCANNER_ROUTES = [
  "/scan",
  "/wallet",
  "/orders"
];

// Install: Pre-cache critical assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[SW] Pre-caching static assets");
      return cache.addAll(STATIC_ASSETS.filter(asset => !asset.endsWith('/')));
    }).then(() => {
      console.log("[SW] Static assets cached successfully");
      return self.skipWaiting();
    })
  );
});

// Activate: Clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return ![
              STATIC_CACHE,
              PAGE_CACHE,
              API_CACHE
            ].includes(cacheName);
          })
          .map((cacheName) => {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log("[SW] Service worker activated");
      return self.clients.claim();
    })
  );
});

// Fetch: Handle different types of requests
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Handle different types of requests
  if (request.mode === "navigate") {
    // HTML navigation - network first with cache fallback
    event.respondWith(handleNavigation(request));
  } else if (request.destination === "image") {
    // Images - cache first with network fallback
    event.respondWith(handleImage(request));
  } else if (url.pathname.startsWith("/_next/static/")) {
    // Next.js static assets - cache first
    event.respondWith(handleStaticAsset(request));
  } else if (url.pathname.startsWith("/api/") || url.hostname.includes("firebase")) {
    // API calls - network first with cache fallback
    event.respondWith(handleAPI(request));
  } else {
    // Other requests - network first
    event.respondWith(fetch(request));
  }
});

// Handle HTML navigation
async function handleNavigation(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(PAGE_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error("Network response not ok");
  } catch (error) {
    console.log("[SW] Network failed for navigation, trying cache:", url.pathname);
    
    // Try cache
    const cache = await caches.open(PAGE_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to scanner page for protected routes
    if (url.pathname.startsWith("/scan") || url.pathname.startsWith("/wallet") || url.pathname.startsWith("/orders")) {
      const scannerFallback = await cache.match("/scan");
      if (scannerFallback) {
        return scannerFallback;
      }
    }
    
    // Final fallback to home page
    const homeFallback = await cache.match("/");
    return homeFallback || new Response("Offline - Please check your connection", {
      status: 503,
      statusText: "Service Unavailable"
    });
  }
}

// Handle images
async function handleImage(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return a placeholder image or empty response
    return new Response("", { status: 404 });
  }
}

// Handle static assets
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Return cached version immediately, but update in background
    fetch(request).then((response) => {
      if (response.ok) {
        cache.put(request, response);
      }
    }).catch(() => {
      // Ignore background update errors
    });
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response("Asset not available offline", { status: 404 });
  }
}

// Handle API calls
async function handleAPI(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    // Try network first for API calls
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses (with short TTL)
      const responseClone = networkResponse.clone();
      const responseData = await responseClone.json();
      
      // Only cache certain types of API responses
      if (shouldCacheAPIResponse(request.url, responseData)) {
        cache.put(request, networkResponse.clone());
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log("[SW] API network failed, trying cache:", request.url);
    
    // Try cache for API calls
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API calls
    return new Response(JSON.stringify({
      error: "Offline",
      message: "This feature requires an internet connection"
    }), {
      status: 503,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// Determine if API response should be cached
function shouldCacheAPIResponse(url, data) {
  // Cache user profile, event data, but not real-time scanner data
  if (url.includes("/api/user") || url.includes("/api/events")) {
    return true;
  }
  
  // Don't cache scanner results, real-time data
  if (url.includes("/api/scan") || url.includes("/api/tickets")) {
    return false;
  }
  
  return false;
}

// Handle background sync for scanner data
self.addEventListener("sync", (event) => {
  if (event.tag === "scanner-sync") {
    event.waitUntil(syncScannerData());
  }
});

// Sync scanner data when back online
async function syncScannerData() {
  console.log("[SW] Syncing scanner data...");
  
  try {
    // Get pending scan results from IndexedDB
    // This would integrate with your scanner data storage
    const pendingScans = await getPendingScans();
    
    for (const scan of pendingScans) {
      try {
        await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(scan)
        });
        
        // Remove from pending after successful sync
        await removePendingScan(scan.id);
      } catch (error) {
        console.log("[SW] Failed to sync scan:", scan.id);
      }
    }
  } catch (error) {
    console.log("[SW] Background sync failed:", error);
  }
}

// Placeholder functions for IndexedDB operations
async function getPendingScans() {
  // Implement IndexedDB logic to get pending scans
  return [];
}

async function removePendingScan(id) {
  // Implement IndexedDB logic to remove synced scan
  return;
}

// Handle push notifications (for scanner alerts)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-72.png",
      vibrate: [200, 100, 200],
      data: data.data,
      actions: [
        {
          action: "open",
          title: "Open Scanner",
          icon: "/icons/icon-72.png"
        },
        {
          action: "close",
          title: "Close"
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  if (event.action === "open") {
    event.waitUntil(
      clients.openWindow("/scan")
    );
  }
});
