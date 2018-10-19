(function () {
  "use strict";
  var version = 'service-worker::';
  var pathToCache = [
    'index.html',
    'assets/css/index.css',
    'favicon.ico',
  ];

  self.addEventListener("install", function(event) {
    console.log('SERVICE WORKER: install event in progress.');

    event.waitUntil(
      caches
        .open(version + 'demonstration')
        .then(function(cache) {
          return cache.addAll(pathToCache);
        })
        .then(function() {
          console.log('SERVICE WORKER: install completed');
        })
    );
  });

  self.addEventListener("fetch", function(event) {
    console.log('SERVICE WORKER: fetch event in progress.');

    if (event.request.method !== 'GET') {
      console.log('SERVICE WORKER: fetch event ignored.', event.request.method, event.request.url);
      return;
    }
    event.respondWith(
      caches
        .match(event.request)
        .then(function(cached) {
          var networked = fetch(event.request)
            .then(fetchedFromNetwork, unableToResolve)
            .catch(unableToResolve);
            console.log('SERVICE WORKER: fetch event', cached ? '(cached)' : '(network)', event.request.url);
          return cached || networked;

          function fetchedFromNetwork(response) {
            var cacheCopy = response.clone();
            console.log('SERVICE WORKER: fetch response from network.', event.request.url);
            caches
              .open(version + 'pages')
              .then(function add(cache) {
                cache.put(event.request, cacheCopy);
              })
              .then(function() {
                console.log('SERVICE WORKER: fetch response stored in cache.', event.request.url);
              });

            return response;
          }

          function unableToResolve () {
            console.log('SERVICE WORKER: fetch request failed in both cache and network.');
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

  self.addEventListener("activate", function(event) {
    console.log('SERVICE WORKER: activate event in progress.');

    event.waitUntil(
      caches
        .keys()
        .then(function (keys) {
          return Promise.all(
            keys
              .filter(function (key) {
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
})();
