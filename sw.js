// ROLLING THUNDER service worker — makes the installed app fully offline.
const CACHE = 'rt-2026-11-23T04:35:05.676Z';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-512.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // the shell itself (navigations / index.html) is NETWORK-FIRST so a relaunch with a
  // connection always runs the newest build; cache is the offline fallback (2026-11-22)
  const url = new URL(e.request.url);
  if (e.request.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname)) {
    e.respondWith(fetch(e.request).then((res) => {
      if (res && res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true })));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => {
    const refresh = fetch(e.request).then((res) => {
      if (res && res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
      return res;
    }).catch(() => hit);
    return hit || refresh;
  }));
});