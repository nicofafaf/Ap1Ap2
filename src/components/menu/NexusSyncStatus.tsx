import { useEffect, useState } from "react";

const CACHE_NAME = "nexus-media-v1";

type SyncState = "checking" | "synced" | "degraded";

export function NexusSyncStatus() {
  const [sync, setSync] = useState<SyncState>("checking");

  useEffect(() => {
    let cancelled = false;

    const verifyCache = async () => {
      try {
        const res = await fetch("/nexus-precache-manifest.json", {
          cache: "no-store",
          signal: AbortSignal.timeout(9000),
        });
        if (!res.ok) throw new Error("no manifest");
        const urls = (await res.json()) as unknown;
        if (!Array.isArray(urls) || urls.length === 0) throw new Error("empty");
        const cache = await caches.open(CACHE_NAME);
        let hits = 0;
        for (const u of urls) {
          if (typeof u !== "string") continue;
          const m = await cache.match(u);
          if (m) hits += 1;
        }
        if (!cancelled) {
          setSync(hits >= urls.length ? "synced" : "degraded");
        }
      } catch {
        if (!cancelled) setSync("degraded");
      }
    };

    void verifyCache();

    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "NEXUS_PRECACHE_DONE") {
        void verifyCache();
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", onMsg);
    }

    const id = window.setInterval(() => {
      void verifyCache();
    }, 12000);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", onMsg);
      }
    };
  }, []);

  const label =
    sync === "synced"
      ? "Nexus-Sync"
      : sync === "degraded"
        ? "Nexus-Sync"
        : "Nexus-Sync";
  const sub =
    sync === "synced"
      ? "Offline-Bundle bereit"
      : sync === "degraded"
        ? "Cache wird aufgebaut"
        : "Prüfe Medien-Archive";
  const dot =
    sync === "synced"
      ? "rgba(34, 197, 94, 0.98)"
      : sync === "degraded"
        ? "rgba(250, 204, 21, 0.85)"
        : "rgba(148, 163, 184, 0.75)";

  return (
    <div
      style={{
        pointerEvents: "auto",
        padding: "8px 12px",
        borderRadius: 10,
        border: "1px solid rgba(34, 211, 238, 0.35)",
        background: "rgba(6, 18, 32, 0.82)",
        minWidth: 168,
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: ".22em",
          color: "rgba(103, 232, 249, 0.72)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: dot,
            boxShadow: sync === "synced" ? `0 0 12px ${dot}` : "none",
          }}
        />
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 10,
          color: "rgba(226, 232, 240, 0.88)",
          letterSpacing: ".06em",
        }}
      >
        {sub}
      </div>
    </div>
  );
}
