/**
 * Entfernt Medien und Artefakte unter ./assets die nicht vom Nexus-Iridium-Stack referenziert werden
 * Ausführung: node scripts/prune-nexus-assets.mjs
 */
import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL("..", import.meta.url)));

const ASSETS = join(root, "assets");

const keepDirs = new Set([
  "BluezoneCorp_Alien_Interface",
  "BluezoneCorp_Futuristic_User_Interface",
  "BluezoneCorp_Industrial_Lever_Switch",
  "BluezoneCorp_Modern_Cinematic_Impact",
  "Characters",
  "Geist_Mono",
  "Inter",
  "ui",
  "game",
]);

const keepExactFiles = new Set([
  "GeistMono-VariableFont_wght.ttf",
  "nexus-integration.css",
  "nexus-ui-audio.js",
  "OFL.txt",
  "Readme.txt",
  "BossThemen.mp3",
  "BossThemen2.mp3",
  "BossThemen3.mp3",
  "BossThemen4.mp3",
  "BossThemen5.mp3",
  "lobbysound_2.mp3",
  "inter-latin-400-normal-c38fxh4l.woff2",
  "inter-latin-400-normal-cycys3eg.woff",
  "inter-latin-600-normal-lgql8muc.woff2",
  "inter-latin-600-normal-cibq2dwp.woff",
  "inter-latin-700-normal-yt3apruw.woff2",
  "inter-latin-700-normal-blavimhd.woff",
]);

function keepFile(name) {
  if (keepExactFiles.has(name)) return true;
  if (/^LF\d+GIF\.mp4$/i.test(name)) return true;
  if (name.startsWith("hintergrund-atmosph") && name.endsWith(".mp4")) return true;
  return false;
}

let removed = 0;
for (const name of readdirSync(ASSETS)) {
  const p = join(ASSETS, name);
  if (!existsSync(p)) continue;
  let st;
  try {
    st = statSync(p);
  } catch {
    continue;
  }
  if (st.isDirectory()) {
    if (keepDirs.has(name)) continue;
    rmSync(p, { recursive: true, force: true });
    removed++;
    console.log("removed dir", name);
    continue;
  }
  if (keepFile(name)) continue;
  rmSync(p, { force: true });
  removed++;
  console.log("removed file", name);
}

console.log("prune complete removed count", removed);
