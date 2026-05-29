import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/inter/latin-100.css";
import "./styles/globals.css";
import { FractalDepthRoot } from "./components/FractalDepthRoot";
import { NexusShell } from "./components/NexusShell";
import { CertificateVerifyPage } from "./components/menu/CertificateVerifyPage";
import { syncOpenGraphMetaFromLocalState } from "./lib/social/syncOpenGraphMeta";
import { I18nProvider } from "./lib/i18n/I18nProvider";
import { attachNexusHealthToWindow } from "./lib/system/healthCheck";
import { NexusErrorBoundary } from "./components/system/NexusErrorBoundary";

attachNexusHealthToWindow();
syncOpenGraphMetaFromLocalState();

/** Einmal pro Inhalts-Release: alte PWA-Caches leeren (veraltete Texte / fehlendes Hero-Video) */
const CONTENT_REV = "2026-05-29-curriculum-cleanup";
const CONTENT_REV_KEY = "nexus.contentRev.v1";
if (typeof localStorage !== "undefined" && localStorage.getItem(CONTENT_REV_KEY) !== CONTENT_REV) {
  localStorage.setItem(CONTENT_REV_KEY, CONTENT_REV);
  if ("caches" in window) {
    void caches.keys().then((names) => Promise.all(names.map((name) => caches.delete(name))));
  }
}

async function clearStaleNexusShellAndReload(reason: string) {
  const key = `nexus.reload.${reason}.v1`;
  if (sessionStorage.getItem(key) === "1") return;
  sessionStorage.setItem(key, "1");
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
    }
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }
  } catch {
    // Reload anyway; stale chunks are worse than a missed cleanup
  }
  const url = new URL(window.location.href);
  url.searchParams.set("nx-cache", String(Date.now()));
  window.location.replace(url);
}

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`/sw.js?v=${Date.now()}`, { updateViaCache: "none" })
      .then((reg) => {
        void reg.update();
      })
      .catch(() => {});
  });
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    void clearStaleNexusShellAndReload("sw-controller");
  });
}

window.addEventListener("unhandledrejection", (event) => {
  const message = String(event.reason?.message ?? event.reason ?? "");
  if (message.includes("Failed to fetch dynamically imported module")) {
    event.preventDefault();
    void clearStaleNexusShellAndReload("dynamic-import");
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <NexusErrorBoundary>
      <I18nProvider>
        <FractalDepthRoot>
          <div
            className="nx-app-frame"
            style={{ width: "100%", minHeight: "100dvh", minWidth: 0, background: "transparent" }}
          >
            <NexusShell />
            <CertificateVerifyPage />
          </div>
        </FractalDepthRoot>
      </I18nProvider>
    </NexusErrorBoundary>
  </React.StrictMode>
);
