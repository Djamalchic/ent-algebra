// Кэш для работы без интернета: сначала сеть, при её отсутствии — сохранённая копия.
const CACHE = "ent-algebra-v2";
const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./js/program.js",
  "./js/store.js",
  "./js/home.js",
  "./js/lesson.js",
  "./js/content.js",
  "./firebase-config.js",
  "./manifest.webmanifest",
  "./content/manifest.json",
  "./icons/icon-192.png",
  "./icons/favicon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const cacheable =
    url.origin === self.location.origin ||
    (url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/")) ||
    (url.hostname === "cdn.jsdelivr.net" && url.pathname.startsWith("/npm/katex@")) ||
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com";
  if (!cacheable) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && (res.ok || res.type === "opaque")) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: url.origin === self.location.origin }))
  );
});
