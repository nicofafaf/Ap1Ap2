import { getAllNexusEntries } from "../data/nexusRegistry";
import { FRACTAL_COMMAND_BG_MP4 } from "./ui/fractalConstants";

/**
 * Medien-URLs für den Service-Worker (`nexus-precache-manifest.json`).
 * Schweres JS (Recharts, jsPDF, Framer Motion, …) liegt in separaten Vite-Chunks
 * (`vendor-charts`, `vendor-pdf-capture`, `vendor-motion`, …) und wird vom Browser
 * on-demand nachgeladen — nicht Teil dieser Medienliste.
 */
export function collectNexusPrecacheUrls(): string[] {
  const set = new Set<string>();
  const add = (path: string) => {
    if (path && !path.startsWith("data:")) set.add(path);
  };
  add(FRACTAL_COMMAND_BG_MP4);
  for (const e of getAllNexusEntries()) {
    add(e.bossVisual.primaryPath);
    /* Poster-Fallbacks (gif/webp/png) sind optional und oft nicht im Repo — nicht precachen */
    add(e.audio.trackPath);
    add(e.phase2ThemePath);
    add(e.audio.victoryPath);
    add(e.audio.lootRevealPath);
    add(e.loot.itemPath);
  }
  return [...set];
}
