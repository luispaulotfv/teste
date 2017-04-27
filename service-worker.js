

var cacheName = 'ProgressiveTriPointApp-v10';
var dataCacheName = 'PackagesData-v10';
var filesToCache = [
    '/teste/index.html',
    '/teste/js/indexController.js',
    '/teste/css/bootstrap.min.css',
    '/teste/css/site.css',
    '/teste/images/ic_refresh_white_24px.svg',
    '/teste/images/LogoTFVsaFinal-médio.png'
];

// install
self.addEventListener('install', function(e) {
    console.log('[ServiceWorker] Install. (event)', e);
    e.waitUntil(
        caches.open(cacheName).then(function(cache) {
            console.log('[ServiceWorker] Caching app shell. (cache)', cache);
            return cache.addAll(filesToCache);
        })
    );
});

// activate
self.addEventListener('activate', function(e) {
    console.log('[ServiceWorker] Activate. (event)', e);
    e.waitUntil(
        caches.keys().then(function(keyList) {
            console.log('[ServiceWorker] Caches. (keyList)', keyList);
            return Promise.all(keyList.map(function(key) {
                if(key !== cacheName && key !== dataCacheName) {
                    console.log('[ServiceWorker] Removing old cache (key)', key);
                    return caches.delete(key);
                }
            }));
        })
    );
});

// fetch
self.addEventListener('fetch', function(e) {
    console.log('[ServiceWorker] Fetch. (event)', e);
    var dataUrl = '/teste/js/data.json';
    if (e.request.url.indexOf(dataUrl) > -1) {
        /*
        * When the request URL contains dataUrl, the app is asking for fresh
        * data. In this case, the service worker always goes to the
        * network and then caches the response. This is called the "Cache then
        * network" strategy:
        * https://jakearchibald.com/2014/offline-cookbook/#cache-then-network
        */
        e.respondWith(
            caches.open(dataCacheName).then(function(cache) {
                return fetch(e.request).then(function(response){
                cache.put(e.request.url, response.clone());
                return response;
                });
            })
        );
    } else {
        /*
        * The app is asking for app shell files. In this scenario the app uses the
        * "Cache, falling back to the network" offline strategy:
        * https://jakearchibald.com/2014/offline-cookbook/#cache-falling-back-to-network
        */
        e.respondWith(
            caches.match(e.request).then(function(response) {
                return response || fetch(e.request);
            })
        );
    }
});
