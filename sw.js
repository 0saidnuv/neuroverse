/* NEUROVERSE — Service worker
   Guarda todos los archivos del juego en la caché del navegador para que la app
   instalada abra y funcione SIN servidor y SIN internet.
   Si cambias algún archivo del juego, sube el número de VERSION. */
var VERSION = 'neuroverse-v3-arcade';
var FILES = [
  './', './index.html', './manifest.webmanifest', './css/styles.css', './css/arcade.css',
  './js/arcade/arcade.js', './js/arcade/games1.js', './js/arcade/games2.js', './js/arcade/games3.js',
  './js/data/worlds.js', './js/data/questions.js', './js/data/challenges.js',
  './js/storage.js', './js/audio.js', './js/network.js', './js/pwa.js', './js/engine.js',
  './js/ui.js', './js/screens.js', './js/match.js', './js/main.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  // Fuentes de Google: se guardan cuando hay internet y se reutilizan sin conexión
  if (url.hostname.indexOf('fonts.') === 0) {
    e.respondWith(caches.open(VERSION + '-fonts').then(function (c) {
      return c.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) { c.put(req, res.clone()); return res; }).catch(function () { return hit || Response.error(); });
      });
    }));
    return;
  }
  if (url.origin !== self.location.origin) return;
  // Archivos del juego: primero la red (para recibir cambios) y, si no hay servidor, la caché
  e.respondWith(fetch(req).then(function (res) {
    if (res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(req, { ignoreSearch: true }).then(function (hit) { return hit || caches.match('./index.html'); });
  }));
});
