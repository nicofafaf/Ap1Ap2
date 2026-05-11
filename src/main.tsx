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

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

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
