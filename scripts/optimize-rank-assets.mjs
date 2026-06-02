/**
 * Konvertiert assets/ranks/*.png nach WebP (Qualität 82).
 * Einmal ausführen: npx sharp-cli ... oder npm install sharp && node scripts/optimize-rank-assets.mjs
 */
import { readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ranksDir = join(root, "assets", "ranks");

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error(
    "[optimize-rank-assets] sharp fehlt — bitte: npm install -D sharp && node scripts/optimize-rank-assets.mjs"
  );
  process.exit(1);
}

const names = readdirSync(ranksDir).filter((n) => n.toLowerCase().endsWith(".png"));
let ok = 0;
for (const name of names) {
  const src = join(ranksDir, name);
  const dest = join(ranksDir, name.replace(/\.png$/i, ".webp"));
  await sharp(src).webp({ quality: 82, effort: 4 }).toFile(dest);
  const before = statSync(src).size;
  const after = statSync(dest).size;
  ok += 1;
  console.log(`${name} → ${name.replace(/\.png$/i, ".webp")} (${Math.round(before / 1024)}KB → ${Math.round(after / 1024)}KB)`);
}
console.log(`[optimize-rank-assets] ${ok} WebP-Dateien in assets/ranks/`);
