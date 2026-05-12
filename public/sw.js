/* global self, caches, fetch, clients */
const CACHE_NAME = "nexus-media-v3";
const MANIFEST_PATH = "/nexus-precache-manifest.json";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        const res = await fetch(MANIFEST_PATH, { cache: "no-store" });
        if (!res.ok) throw new Error("manifest fetch failed");
        const urls = await res.json();
        if (!Array.isArray(urls)) throw new Error("manifest not array");
        await Promise.all(
          urls.map((u) =>
            typeof u === "string"
              ? cache.add(u).catch(() => {})
              : Promise.resolve()
          )
        );
        const all = await self.clients.matchAll({ includeUncontrolled: true });
        all.forEach((c) =>
          c.postMessage({ type: "NEXUS_PRECACHE_DONE", ok: true, count: urls.length })
        );
      } catch {
        const all = await self.clients.matchAll({ includeUncontrolled: true });
        all.forEach((c) => c.postMessage({ type: "NEXUS_PRECACHE_DONE", ok: false }));
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)));
      await self.clients.claim();
      const all = await self.clients.matchAll({ includeUncontrolled: true });
      all.forEach((c) => c.postMessage({ type: "NEXUS_SW_ACTIVATED", cacheName: CACHE_NAME }));
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const isNavigate =
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  event.respondWith(
    (async () => {
      try {
        if (isNavigate) {
          return await fetch(req, { cache: "no-store" });
        }
        const url = new URL(req.url);
        const isBuildAsset = url.pathname.startsWith("/assets/") && /\.(js|css)$/i.test(url.pathname);
        if (isBuildAsset || url.pathname === "/index.html") {
          return await fetch(req, { cache: "no-store" });
        }
        const hit = await caches.match(req);
        if (hit) return hit;
        return await fetch(req);
      } catch {
        if (isNavigate) {
          return fetch("/index.html", { cache: "reload" }).catch(() => Response.error());
        }
        return Response.error();
      }
    })()
  );
});
