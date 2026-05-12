import { cpSync, existsSync, mkdirSync, realpathSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv, type Plugin } from "vite";
import type { OutputChunk } from "rollup";
import react from "@vitejs/plugin-react";
import { collectNexusPrecacheUrls } from "./src/lib/nexusAssetManifest";
import { getAllNexusEntries } from "./src/data/nexusRegistry";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Netlify/Linux: ohne Windows-Junction muss public/assets existieren.
 * Wenn public/assets fehlt oder leer ist, wird aus ./assets synchronisiert (einmalig pro Build-Start).
 *
 * Lokales Windows/OneDrive: ein vollständiges cpSync von ./assets (~250MB+) bei jedem Build kann
 * instabil werden — wenn Kern-Assets bereits unter public/assets liegen, wird übersprungen
 * (NEXUS_FORCE_PUBLIC_ASSET_SYNC=1 erzwingt erneutes Kopieren).
 */
function ensurePublicAssetsPlugin(): Plugin {
  return {
    name: "ensure-public-assets",
    buildStart() {
      if (process.env.GITLAB_PAGES_SKIP_MEDIA === "1") {
        console.warn("[ensure-public-assets] Skip ./assets → public/assets (GITLAB_PAGES_SKIP_MEDIA=1)");
        return;
      }
      const srcDir = resolve(__dirname, "assets");
      const destDir = resolve(__dirname, "public", "assets");
      if (!existsSync(srcDir) || !statSync(srcDir).isDirectory()) return;
      try {
        if (realpathSync(srcDir) === realpathSync(destDir)) return;
      } catch {
        // dest may not exist yet
      }
      const marker = join(destDir, "inter-latin-400-normal-c38fxh4l.woff2");
      if (
        existsSync(destDir) &&
        existsSync(marker) &&
        process.env.NEXUS_FORCE_PUBLIC_ASSET_SYNC !== "1"
      ) {
        try {
          const n = readdirSync(destDir).length;
          if (n > 0) {
            console.warn(
              `[ensure-public-assets] public/assets vorhanden (${n} Einträge) — überspringe schweres Kopieren (NEXUS_FORCE_PUBLIC_ASSET_SYNC=1 zum Neu-Sync)`,
            );
            return;
          }
        } catch {
          // fall through to copy
        }
      }
      mkdirSync(resolve(__dirname, "public"), { recursive: true });
      mkdirSync(destDir, { recursive: true });
      cpSync(srcDir, destDir, { recursive: true });
    },
  };
}

function nexusPrecacheManifestPlugin(): Plugin {
  const out = resolve(__dirname, "public", "nexus-precache-manifest.json");
  return {
    name: "nexus-precache-manifest",
    buildStart() {
      const urls = collectNexusPrecacheUrls();
      const publicRoot = resolve(__dirname, "public");
      const filtered = urls.filter((path) => {
        if (typeof path !== "string" || !path.startsWith("/")) return false;
        const rel = path.slice(1);
        return existsSync(join(publicRoot, rel));
      });
      if (filtered.length < urls.length) {
        console.warn(
          `[nexus-precache-manifest] ${urls.length - filtered.length}/${urls.length} URLs nicht unter public/ — werden nicht precached (keine 404-Flut im SW)`
        );
      }
      mkdirSync(resolve(__dirname, "public"), { recursive: true });
      writeFileSync(out, `${JSON.stringify(filtered, null, 0)}\n`, "utf8");
    },
  };
}

function requiredNexusMediaPlugin(): Plugin {
  return {
    name: "required-nexus-media",
    buildStart() {
      const publicRoot = resolve(__dirname, "public");
      const missingBossVideos = getAllNexusEntries()
        .map((entry) => entry.bossVisual.primaryPath)
        .filter((path) => {
          if (!path.startsWith("/")) return true;
          return !existsSync(join(publicRoot, path.slice(1)));
        });

      if (missingBossVideos.length > 0) {
        throw new Error(
          `[required-nexus-media] Fehlende Boss-Videos: ${missingBossVideos.join(", ")}`
        );
      }
    },
  };
}

/**
 * Rollup manualChunks: schwere Libs aus dem Entry heraus — schnellerer First Paint.
 * Prüfsumme nur für den/die isEntry-Chunk(s) (ohne parallele vendor-* beim ersten Parse).
 */
function nexusManualChunk(id: string): string | undefined {
  if (!id.includes("node_modules")) return undefined;
  if (id.includes("framer-motion")) return "vendor-motion";
  if (id.includes("recharts")) return "vendor-charts";
  if (id.includes("jspdf") || id.includes("html2canvas")) return "vendor-pdf-capture";
  if (id.includes("node_modules/zustand")) return "vendor-zustand";
  if (id.includes("web-vitals")) return "vendor-vitals";
  if (
    id.includes("node_modules/react-dom") ||
    id.includes("node_modules/react/") ||
    id.includes("node_modules/scheduler")
  ) {
    return "vendor-react";
  }
  return "vendor-misc";
}

/** Build-Log: Budget für Entry-Chunk (Bytes, gzip-naiv: Roh-JS) */
function nexusInitialBundleBudgetPlugin(maxEntryKb: number): Plugin {
  const maxBytes = maxEntryKb * 1024;
  return {
    name: "nexus-initial-bundle-budget",
    generateBundle(_options, bundle) {
      let entryBytes = 0;
      const entryNames: string[] = [];
      for (const [fileName, chunk] of Object.entries(bundle)) {
        const c = chunk as OutputChunk;
        if (c.type === "chunk" && c.isEntry) {
          entryBytes += Buffer.byteLength(c.code, "utf8");
          entryNames.push(fileName);
        }
      }
      const kb = entryBytes / 1024;
      const ok = entryBytes <= maxBytes;
      const green = "\x1b[32m";
      const yellow = "\x1b[33m";
      const reset = "\x1b[0m";
      if (ok) {
        console.log(
          `${green}✓ [Nexus] INITIAL BUNDLE OK — entry ≈ ${kb.toFixed(1)} KB (budget ≤ ${maxEntryKb} KB) · ${entryNames.join(", ")}${reset}`
        );
      } else {
        console.log(
          `${yellow}△ [Nexus] INITIAL BUNDLE BUDGET — entry ≈ ${kb.toFixed(1)} KB (budget ≤ ${maxEntryKb} KB) · ${entryNames.join(", ")}${reset}`
        );
      }
    },
  };
}

function openGraphInjectPlugin(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), "");
  const site = (env.VITE_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const ogImage = site ? `${site}/og-nexus-share.svg` : "/og-nexus-share.svg";
  const ogUrl = site ? `${site}/` : "/";
  return {
    name: "nexus-open-graph-inject",
    transformIndexHtml(html) {
      return html
        .replace(/__OG_IMAGE__/g, ogImage)
        .replace(/__OG_URL__/g, ogUrl);
    },
  };
}

/** Statische Dateien: public/ → dist/ (Root-URL), inkl. /assets/* */
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ensurePublicAssetsPlugin(),
    requiredNexusMediaPlugin(),
    nexusPrecacheManifestPlugin(),
    openGraphInjectPlugin(mode),
    nexusInitialBundleBudgetPlugin(520),
  ],
  publicDir: "public",
  build: {
    rollupOptions: {
      output: {
        manualChunks: nexusManualChunk,
      },
    },
    chunkSizeWarningLimit: 650,
  },
}));
