import { ensureCiscoPacksLoaded, getQuizItemsForPack } from "../../cisco/ccna1-v7/loadPacks";
import type { CiscoPackId } from "../../cisco/types";
import type { LearningField } from "../../data/nexusRegistry";
import { SOMMER2026_EXAM_PACKS, type Sommer2026PackId } from "../curriculum/sommer2026Exams";
import { ensureCurriculumLoaded, getCurriculumByLf } from "../learning/curriculumAccess";
import { buildBlitzQueue, pickWeakestLf } from "../learning/blitzSession";
import type { LeitnerCardState } from "../learning/leitnerEngine";
import type { LiveDuelContentSourceId, LiveDuelQuestionRef } from "./liveDuelTypes";

function shuffle<T>(arr: T[]): T[] {
  const bag = [...arr];
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j]!, bag[i]!];
  }
  return bag;
}

function refsFromLf(lf: number): LiveDuelQuestionRef[] {
  const key = `LF${lf}` as LearningField;
  const bag = getCurriculumByLf(key);
  return bag.map((ex) => ({ source: "lf", lf, exerciseId: ex.id }));
}

function refsFromCiscoPack(packId: CiscoPackId): LiveDuelQuestionRef[] {
  return getQuizItemsForPack(packId).map((q) => ({
    source: "cisco",
    packId,
    questionId: q.id,
  }));
}

function refsFromSommer(packId: Sommer2026PackId): LiveDuelQuestionRef[] {
  const pack = SOMMER2026_EXAM_PACKS[packId];
  return pack.missionIds.map((missionId) => ({
    source: "sommer2026",
    packId,
    missionId,
  }));
}

export async function buildLiveDuelQuestionPool(
  sourceId: LiveDuelContentSourceId,
  count: number,
  ctx?: {
    leitner?: Readonly<Record<string, LeitnerCardState>>;
    learningCorrectByLf?: Readonly<Partial<Record<LearningField, string[]>>>;
  }
): Promise<LiveDuelQuestionRef[]> {
  await ensureCurriculumLoaded();
  await ensureCiscoPacksLoaded();

  let bag: LiveDuelQuestionRef[] = [];

  if (sourceId === "lf:all") {
    for (let lf = 1; lf <= 12; lf += 1) bag.push(...refsFromLf(lf));
  } else if (sourceId.startsWith("lf:")) {
    const lf = Number.parseInt(sourceId.slice(3), 10);
    if (Number.isFinite(lf) && lf >= 1 && lf <= 12) bag = refsFromLf(lf);
  } else if (sourceId === "ccna:all") {
    const packs = [
      "modules-1-3",
      "modules-4-7",
      "modules-8-10",
      "modules-11-13",
      "modules-14-15",
      "modules-16-17",
    ] as CiscoPackId[];
    for (const p of packs) bag.push(...refsFromCiscoPack(p));
  } else if (sourceId.startsWith("ccna:")) {
    const packId = sourceId.slice(5) as CiscoPackId;
    bag = refsFromCiscoPack(packId);
  } else if (sourceId.startsWith("sommer2026:")) {
    const packId = sourceId.slice(11) as Sommer2026PackId;
    bag = refsFromSommer(packId);
  } else if (sourceId === "mixed:weakest") {
    const lf = pickWeakestLf(ctx?.leitner ?? {}, ctx?.learningCorrectByLf ?? {});
    const ids = buildBlitzQueue(lf, count, "learn");
    bag = ids.map((exerciseId) => ({ source: "lf", lf, exerciseId }));
    return bag;
  }

  if (bag.length === 0) return [];
  const shuffled = shuffle(bag);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
