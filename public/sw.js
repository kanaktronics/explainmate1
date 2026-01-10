
const CACHE_NAME = 'explainmate-cache-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  // Add other important assets you want to pre-cache
];

// Install the service worker and cache important assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Serve cached content when offline, and implement a stale-while-revalidate strategy
self.addEventListener('fetch', event => {
  // We only want to handle navigation requests for the reload logic
  if (event.request.mode !== 'navigate') {
    // For non-navigation requests, use a cache-first strategy
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request).then(fetchResponse => {
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, fetchResponse.clone());
              return fetchResponse;
            });
          });
        })
    );
    return;
  }

  // Stale-while-revalidate for navigation
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Try to get the response from the cache.
      const cachedResponse = await cache.match(event.request);
      
      // Fetch the response from the network.
      const networkResponsePromise = fetch(event.request)
        .then(response => {
          // If we get a valid response, update the cache.
          if (response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(error => {
          // This is where we handle the ChunkLoadError scenario.
          // If fetching fails, it might be because the user is on an old version.
          // The cached version will be served if available, but for next navigation,
          // we should ensure they get the new version.
          console.warn('Service Worker: Fetch failed, possibly due to new deployment.', error);
          
          // If a user navigates to a page that isn't cached and the network fails,
          // this indicates a stale client. We can force a reload on the next navigation.
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                // You could post a message to the client to inform them they are offline
                // or that a new version is available.
            });
          });
          
          // If there's a cached response, we return it. If not, the error propagates.
          return cachedResponse || Promise.reject(error);
        });

      // Serve from cache first, and update in the background.
      return cachedResponse || networkResponsePromise;
    })
  );
});


// This is the crucial part for handling ChunkLoadErrors.
// If a navigation fetch fails, this logic will hard-reload the page.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'RELOAD_PAGE_ON_CHUNK_ERROR') {
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      if (clients && clients.length) {
        clients[0].navigate(clients[0].url).then(client => client.focus());
      }
    });
  }
});

// Clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
