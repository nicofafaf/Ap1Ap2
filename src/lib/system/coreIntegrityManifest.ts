/**
 * Erwartete Integritäts-Metadaten — Manifest-SHA nach Build setzen (optional):
 * VITE_NEXUS_MANIFEST_SHA256 in CI aus dist auslesen und hier eintragen
 */

export const NEXUS_CORE_INTEGRITY_TAG = "nexus-legacy-2026-05";

/** Leer = keine strikte Manifest-Prüfung (nur Fetch + JSON-Validität) */
export const NEXUS_MANIFEST_SHA256_EXPECTED: string =
  typeof import.meta.env.VITE_NEXUS_MANIFEST_SHA256 === "string"
    ? (import.meta.env.VITE_NEXUS_MANIFEST_SHA256 as string)
    : "";
