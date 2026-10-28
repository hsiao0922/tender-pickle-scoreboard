/*
 * Offline cache, network-first: when online you always get the latest files,
 * when offline (or the network is slower than TIMEOUT) the cached copy is used.
 * Bump CACHE (and VERSION in app.js) when any file changes.
 */
var CACHE = 'tender-pickle-v1.4.1';
var TIMEOUT = 4000;
var FILES = [
  './', 'index.html', 'style.css', 'engine.js', 'app.js', 'manifest.json',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  // cache:'reload' skips the browser HTTP cache so a new version never stores stale files
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return Promise.all(FILES.map(function (f) { return c.add(new Request(f, { cache: 'reload' })); })); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// no-cache = always revalidate with the server instead of trusting the browser HTTP cache
function networkWithTimeout(url) {
  return new Promise(function (resolve, reject) {
    var timer = setTimeout(function () { reject(new Error('timeout')); }, TIMEOUT);
    fetch(url, { cache: 'no-cache' }).then(function (res) { clearTimeout(timer); resolve(res); }, function (err) { clearTimeout(timer); reject(err); });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    networkWithTimeout(req.url).then(function (res) {
      // keep the cache fresh; requests with a query string (e.g. the connection ping) are not stored
      if (res && res.ok && !url.search) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      // Offline: exact match for files; for page loads ignore the query string and fall back to the app shell.
      if (req.mode === 'navigate') {
        return caches.match(req, { ignoreSearch: true }).then(function (hit) { return hit || caches.match('index.html'); });
      }
      return caches.match(req).then(function (hit) { return hit || Response.error(); });
    })
  );
});
