/**
 * Laufzeit-„API“: Integrität aller 12 LFs + AES-GCM-Roundtrip für Live-Demos
 */

import {
  openNexusMasterDossier,
  sealNexusMasterDossier,
  type NexusMasterCertPlain,
} from "../cert/nexusMasterCertificate";
import type { LearningField } from "../../data/nexusRegistry";
import { getNexusEntryForLF } from "../../data/nexusRegistry";
import { CURRICULUM_BY_LF } from "../learning/learningRegistry";

export type LfHealthRow = {
  lf: LearningField;
  curriculumExercises: number;
  registryEntryPresent: boolean;
};

export type NexusHealthReport = {
  ok: boolean;
  lfRows: LfHealthRow[];
  lfIntegrityOk: boolean;
  aesRoundtripOk: boolean;
  aesError?: string;
  checkedAt: number;
};

const EXPECTED_LFS: LearningField[] = [
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

const MIN_EXERCISES_PER_LF = 5;

function collectLfHealth(): { rows: LfHealthRow[]; integrityOk: boolean } {
  const rows: LfHealthRow[] = [];
  let integrityOk = true;

  for (const lf of EXPECTED_LFS) {
    const bag = CURRICULUM_BY_LF[lf];
    const curriculumExercises = bag?.length ?? 0;
    let registryEntryPresent = false;
    try {
      const entry = getNexusEntryForLF(lf);
      registryEntryPresent = Boolean(entry?.currentLF === lf);
    } catch {
      registryEntryPresent = false;
    }
    if (curriculumExercises < MIN_EXERCISES_PER_LF || !registryEntryPresent) {
      integrityOk = false;
    }
    rows.push({ lf, curriculumExercises, registryEntryPresent });
  }

  if (EXPECTED_LFS.length !== Object.keys(CURRICULUM_BY_LF).length) {
    integrityOk = false;
  }

  return { rows, integrityOk };
}

async function verifyAesGcmRoundtrip(): Promise<{ ok: boolean; error?: string }> {
  try {
    const key = crypto.getRandomValues(new Uint8Array(32)).buffer;
    const plain: NexusMasterCertPlain = {
      v: 1,
      kind: "NEXUS_MASTER",
      issuedAt: new Date().toISOString(),
      combatRank: "C",
      timeGrade: "B",
      activeLF: 3,
      sectorZero: true,
    };
    const sealed = await sealNexusMasterDossier(plain, key);
    const opened = await openNexusMasterDossier(sealed, key);
    const a = JSON.stringify(plain);
    const b = JSON.stringify(opened);
    if (a !== b) {
      return { ok: false, error: "Klartext nach Entschlüsselung abweichend" };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Vollständiger Health-Check (async wegen SubtleCrypto)
 */
export async function runNexusHealthCheck(): Promise<NexusHealthReport> {
  const { rows, integrityOk } = collectLfHealth();
  const aes = await verifyAesGcmRoundtrip();
  return {
    ok: integrityOk && aes.ok,
    lfRows: rows,
    lfIntegrityOk: integrityOk,
    aesRoundtripOk: aes.ok,
    aesError: aes.error,
    checkedAt: Date.now(),
  };
}

/** Kurz-Snapshot nur Curriculum-Zählung (sync, für Logging) */
export function getNexusLfCurriculumSnapshot(): Record<LearningField, number> {
  const out = {} as Record<LearningField, number>;
  for (const lf of EXPECTED_LFS) {
    out[lf] = CURRICULUM_BY_LF[lf]?.length ?? 0;
  }
  return out;
}

declare global {
  interface Window {
    __NEXUS_HEALTH__?: () => Promise<NexusHealthReport>;
  }
}

/** DevTools: `await __NEXUS_HEALTH__()` */
export function attachNexusHealthToWindow(): void {
  if (typeof window === "undefined") return;
  window.__NEXUS_HEALTH__ = runNexusHealthCheck;
}
