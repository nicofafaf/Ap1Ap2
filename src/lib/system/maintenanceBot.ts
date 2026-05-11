/**
 * Boot-Integrität + Registry-Drift: lokales Lern-Wissen (localStorage) mit Curriculum abgleichen
 */

import { CURRICULUM_BY_LF } from "../learning/learningRegistry";
import type { LearningField } from "../../data/nexusRegistry";
import { NEXUS_CORE_INTEGRITY_TAG, NEXUS_MANIFEST_SHA256_EXPECTED } from "./coreIntegrityManifest";

export const REGISTRY_FINGERPRINT_STORAGE_KEY = "nexus.registryContentFingerprint.v2";

const LF_ORDER: LearningField[] = [
  "LF1",
  "LF2",
  "LF3",
  "LF4",
  "LF5",
  "LF6",
  "LF7",
  "LF8",
  "LF9",
  "LF10",
  "LF11",
  "LF12",
];

export async function computeLearningRegistryFingerprint(): Promise<string> {
  const parts: string[] = [];
  for (const lf of LF_ORDER) {
    const bag = CURRICULUM_BY_LF[lf] ?? [];
    const ids = bag
      .map((e) => e.id)
      .sort()
      .join(",");
    parts.push(`${lf}:${ids}`);
  }
  parts.push(`tag:${NEXUS_CORE_INTEGRITY_TAG}`);
  const enc = new TextEncoder().encode(parts.join("|"));
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export type IntegrityLine = {
  id: string;
  ok: boolean;
  detail: string;
};

export type BootIntegrityReport = {
  lines: IntegrityLine[];
  manifestSha256?: string;
  registryFingerprint: string;
  registryDrift: boolean;
};

async function sha256Text(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function runBootIntegritySuite(): Promise<BootIntegrityReport> {
  const lines: IntegrityLine[] = [];
  let manifestSha256: string | undefined;

  try {
    const res = await fetch("/nexus-precache-manifest.json", { cache: "no-store" });
    if (!res.ok) {
      lines.push({
        id: "precache-manifest",
        ok: false,
        detail: `HTTP ${res.status}`,
      });
    } else {
      const text = await res.text();
      manifestSha256 = await sha256Text(text);
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }
      const n = Array.isArray(parsed) ? parsed.length : 0;
      lines.push({
        id: "precache-manifest",
        ok: n > 0,
        detail: n > 0 ? `${n} Einträge · SHA-256 ${manifestSha256.slice(0, 16)}…` : "Leer / kein Array",
      });
      if (NEXUS_MANIFEST_SHA256_EXPECTED && manifestSha256 !== NEXUS_MANIFEST_SHA256_EXPECTED) {
        lines.push({
          id: "manifest-checksum",
          ok: false,
          detail: "Manifest-Checksum weicht von Erwartung ab (Build-Tag prüfen)",
        });
      } else if (NEXUS_MANIFEST_SHA256_EXPECTED) {
        lines.push({
          id: "manifest-checksum",
          ok: true,
          detail: "Manifest-Checksum OK",
        });
      }
    }
  } catch (e) {
    lines.push({
      id: "precache-manifest",
      ok: false,
      detail: e instanceof Error ? e.message : "Fetch fehlgeschlagen",
    });
  }

  try {
    const r = await fetch("/manifest.webmanifest", { method: "HEAD", cache: "no-store" });
    lines.push({
      id: "pwa-manifest",
      ok: r.ok,
      detail: r.ok ? "PWA-Manifest erreichbar" : `HTTP ${r.status}`,
    });
  } catch (e) {
    lines.push({
      id: "pwa-manifest",
      ok: false,
      detail: e instanceof Error ? e.message : "HEAD fehlgeschlagen",
    });
  }

  lines.push({
    id: "core-integrity-tag",
    ok: true,
    detail: `Kern-Tag ${NEXUS_CORE_INTEGRITY_TAG}`,
  });

  const registryFingerprint = await computeLearningRegistryFingerprint();
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(REGISTRY_FINGERPRINT_STORAGE_KEY);
  } catch {
    stored = null;
  }
  const registryDrift = Boolean(stored && stored !== registryFingerprint);

  lines.push({
    id: "learning-registry",
    ok: !registryDrift || !stored,
    detail: registryDrift
      ? "Neue oder geänderte Lerninhalte erkannt"
      : stored
        ? "Registry-Fingerprint unverändert"
        : "Erster Start — Baseline wird beim Merge gesetzt",
  });

  return { lines, manifestSha256, registryFingerprint, registryDrift };
}

export function readStoredRegistryFingerprint(): string | null {
  try {
    return localStorage.getItem(REGISTRY_FINGERPRINT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function persistRegistryFingerprint(fp: string): void {
  try {
    localStorage.setItem(REGISTRY_FINGERPRINT_STORAGE_KEY, fp);
  } catch {
    // no-op
  }
}
