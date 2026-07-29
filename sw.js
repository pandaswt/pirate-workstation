const CACHE_NAME = "pirate-workstation-v3";
const ASSETS = [
  "./",
  "./个人工作台.html",
  "./manifest.json",
  "./avatars/luffy.png",
  "./avatars/zoro.png",
  "./avatars/chopper.png",
  "./avatars/robin.png",
  "./avatars/nami.png",
  "./avatars/sanji.png",
  "./avatars/brook.png",
  "./avatars/usopp.png",
  "./avatars/ace.png",
  "./avatars/law.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
