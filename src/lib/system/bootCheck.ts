/**
 * Boot-Checks für nexus-precache-manifest.json
 * Slim-Deploy: leeres Array oder fehlendes Manifest ist immer OK
 */

export type PrecacheManifestEvaluation = {
  ok: boolean;
  entryCount: number;
  detail: string;
};

/** Gültiges Manifest = JSON-Array (Länge 0 erlaubt) */
export function evaluatePrecacheManifestPayload(parsed: unknown): PrecacheManifestEvaluation {
  if (!Array.isArray(parsed)) {
    return { ok: false, entryCount: 0, detail: "Ungültiges JSON" };
  }
  const entryCount = parsed.filter((u): u is string => typeof u === "string").length;
  if (parsed.length === 0) {
    return {
      ok: true,
      entryCount: 0,
      detail: "Slim-Modus (0 Einträge) — Boss-Videos on-demand",
    };
  }
  return {
    ok: true,
    entryCount,
    detail: `${entryCount} Einträge`,
  };
}

/** HTTP-Status beim Manifest-Fetch — 404 = Slim ohne Datei */
export function isPrecacheManifestHttpAcceptable(status: number): boolean {
  return status === 200 || status === 404;
}

export function precacheManifestMissingDetail(): string {
  return "Slim-Modus — Precache optional (Medien on-demand)";
}
