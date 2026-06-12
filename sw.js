self.addEventListener('install', event => {
  event.waitUntil(caches.open('pet-v1').then(cache => cache.addAll([
    './', './index.html', './css/main.css', './js/config.js', './js/audio.js',
    './js/character.js', './js/statemachine.js', './js/reactions.js', './js/main.js',
    './data/reactions.json', './manifest.json'
  ])));
});
