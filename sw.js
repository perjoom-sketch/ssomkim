const CACHE_NAME = 'pet-v4';
const ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './js/config.js',
  './js/audio.js',
  './js/character.js',
  './js/statemachine.js',
  './js/reactions.js',
  './js/main.js',
  './data/reactions.json',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then(response => response || caches.match('./index.html'))
  );
});
