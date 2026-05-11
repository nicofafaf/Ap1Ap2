import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { collectNexusPrecacheUrls } from "./nexusAssetManifest";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const assetsRoot = join(projectRoot, "assets");

function filePathForAssetUrl(url: string): string {
  if (!url.startsWith("/assets/")) {
    throw new Error(`Expected /assets/ URL, got: ${url}`);
  }
  const rel = decodeURIComponent(url.slice("/assets/".length));
  const segments = rel.split("/").filter(Boolean);
  return join(assetsRoot, ...segments);
}

describe("collectNexusPrecacheUrls", () => {
  it("resolves every /assets/ URL to an existing file under ./assets (Netlify/CI)", () => {
    const missing: string[] = [];
    for (const url of collectNexusPrecacheUrls()) {
      if (!url.startsWith("/assets/")) continue;
      try {
        const p = filePathForAssetUrl(url);
        if (!existsSync(p)) {
          missing.push(`${url}\n  expected: ${p}`);
        }
      } catch (e) {
        missing.push(`${url}\n  error: ${e}`);
      }
    }
    if (missing.length > 0) {
      expect.fail(
        `Fehlende Medien unter ./assets (Netlify braucht dieselben Dateien):\n\n${missing.join("\n\n")}`
      );
    }
  });
});
