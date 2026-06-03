import type { CiscoExamPack, CiscoPackId, CiscoQuestion } from "../types";
import { ciscoQuestionHasMatch } from "./parseMatchPairs";

const packLoaders = import.meta.glob<{ default: CiscoExamPack }>("./packs/*.json");

const packsById = new Map<CiscoPackId, CiscoExamPack>();
let loadPromise: Promise<void> | null = null;

/** Lädt alle Pack-JSONs on-demand (nicht im Initial-Bundle — GitLab Pages stabil) */
export function ensureCiscoPacksLoaded(): Promise<void> {
  if (packsById.size > 0) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const entries = Object.entries(packLoaders);
    await Promise.all(
      entries.map(async ([, loader]) => {
        const mod = await loader();
        const pack = mod.default;
        if (pack?.id) packsById.set(pack.id as CiscoPackId, pack);
      })
    );
  })();
  return loadPromise;
}

export function getCiscoPack(id: CiscoPackId): CiscoExamPack | null {
  return packsById.get(id) ?? null;
}

export function getAllCiscoPacks(): CiscoExamPack[] {
  return [...packsById.values()];
}

function isPlayableCiscoItem(i: CiscoQuestion): boolean {
  if (i.type === "single" || i.type === "multi") {
    return Boolean(i.options && i.options.length >= 2);
  }
  if (i.type === "match") return ciscoQuestionHasMatch(i);
  return false;
}

export function getMcItemsForPack(id: CiscoPackId) {
  const pack = getCiscoPack(id);
  if (!pack) return [];
  return pack.items.filter((i) => i.type === "single" || i.type === "multi");
}

/** MC + Match — für Cisco-Sessions */
export function getQuizItemsForPack(id: CiscoPackId) {
  const pack = getCiscoPack(id);
  if (!pack) return [];
  return pack.items.filter(isPlayableCiscoItem);
}

export function totalCiscoMcCount(): number {
  return getAllCiscoPacks().reduce(
    (sum, p) => sum + p.items.filter((i) => i.type === "single" || i.type === "multi").length,
    0
  );
}

export function totalCiscoQuizCount(): number {
  return getAllCiscoPacks().reduce(
    (sum, p) => sum + getQuizItemsForPack(p.id as CiscoPackId).length,
    0
  );
}
