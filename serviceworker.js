(function () {
  "use strict";

  var version = 'pwa-starter-v1::';

  // Defining paths to cache.
  var pathToCache = [
    'index.html',
    '/pwa-starter/assets/img/16x16.png',
    '/pwa-starter/assets/img/512x512.png',
    '/pwa-starter/assets/img/256x256.png',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css'
  ];

  // SERVICE WORKER: install event in progress.
  self.addEventListener("install", function(event) {
    event.waitUntil(caches.open(version + 'demonstration')
      .then(function(cache) {
        return cache.addAll(pathToCache);
      })
      .then(function() {
        console.log('SERVICE WORKER: install completed');
      })
    );
  });

  // SERVICE WORKER: activate event in progress.
  self.addEventListener("activate", function(event) {
    event.waitUntil(caches.keys()
      .then(function (keys) {
        return Promise.all(
          keys.filter(function (key) {
            return !key.startsWith(version);
          })
          .map(function (key) {
            return caches.delete(key);
          })
        );
      })
      .then(function() {
        console.log('SERVICE WORKER: activate completed.');
      })
    );
  });

  // SERVICE WORKER: fetch event in progress.
  self.addEventListener("fetch", function(event) {
    if (event.request.method !== 'GET') {
      console.info('SERVICE WORKER: fetch event ignored.', event.request.method, event.request.url);
      return;
    }

    event.respondWith(caches.match(event.request)
      .then(function(cached) {
        var networked = fetch(event.request)
          .then(fetchedFromNetwork, unableToResolve)
          .catch(unableToResolve);

          console.log('SERVICE WORKER: fetch event', cached ? '(cached)' : '(network)', event.request.url);

          return cached || networked;

        function fetchedFromNetwork(response) {
          var cacheCopy = response.clone();

          console.log('SERVICE WORKER: fetch response from network.', event.request.url);

          caches.open(version + 'pages')
            .then(function add(cache) {
              cache.put(event.request, cacheCopy);
            })
            .then(function() {
              console.log('SERVICE WORKER: fetch response stored in cache.', event.request.url);
            });

            return response;
          }

        function unableToResolve () {
          console.error('SERVICE WORKER: fetch request failed in both cache and network.');

          return new Response('<h1>Service Unavailable</h1>', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/html'
            })
          });
        }
      })
    );
  });
})();
