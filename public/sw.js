/* global self, caches, fetch, clients */
const CACHE_NAME = "nexus-media-v16";
const MANIFEST_PATH = "/nexus-precache-manifest.json";

function offlinePlainResponse() {
  return new Response("Offline", {
    status: 503,
    statusText: "Offline",
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function shouldHandleFetch(url, request) {
  if (request.method !== "GET") return false;
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (url.pathname.endsWith("/sw.js")) return false;
  if (url.pathname.endsWith("/nexus-precache-manifest.json")) return false;
  return true;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      let urls = [];
      try {
        const cache = await caches.open(CACHE_NAME);
        const res = await fetch(MANIFEST_PATH, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            urls = data.filter((u) => typeof u === "string");
          }
        }
        if (urls.length > 0) {
          await Promise.all(urls.map((u) => cache.add(u).catch(() => {})));
        }
      } catch {
        /* Slim-Modus: leeres oder fehlendes Manifest ist OK */
      }
      try {
        const all = await self.clients.matchAll({ includeUncontrolled: true });
        all.forEach((c) =>
          c.postMessage({ type: "NEXUS_PRECACHE_DONE", ok: true, count: urls.length })
        );
      } catch {
        /* no-op */
      }
      await self.skipWaiting();
    })().catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
      await self.clients.claim();
      try {
        const all = await self.clients.matchAll({ includeUncontrolled: true });
        all.forEach((c) => c.postMessage({ type: "NEXUS_SW_ACTIVATED", cacheName: CACHE_NAME }));
      } catch {
        /* no-op */
      }
    })().catch(() => {})
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (!shouldHandleFetch(url, req)) return;

  const isNavigate =
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  event.respondWith(
    (async () => {
      try {
        if (isNavigate) {
          return await fetch(req, { cache: "no-store" });
        }
        const isBuildAsset =
          url.pathname.startsWith("/assets/") && /\.(js|css)$/i.test(url.pathname);
        if (isBuildAsset || url.pathname === "/index.html") {
          return await fetch(req, { cache: "no-store" });
        }
        const hit = await caches.match(req);
        if (hit) return hit;
        return await fetch(req);
      } catch {
        if (isNavigate) {
          const cached = await caches.match("/index.html");
          if (cached) return cached;
          try {
            return await fetch("/index.html", { cache: "reload" });
          } catch {
            return offlinePlainResponse();
          }
        }
        const hit = await caches.match(req);
        if (hit) return hit;
        return offlinePlainResponse();
      }
    })().catch(() => offlinePlainResponse())
  );
});
