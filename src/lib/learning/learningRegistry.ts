/**
 * Prüfungsnahe Aufgaben + MC — Code in JetBrains Mono via Klasse `nx-code-block` / CSS-Variable
 */

import type { LearningField } from "../../data/nexusRegistry";
import type { LearningExercise, LearningMcOption } from "./learningExerciseTypes";
import {
  leitnerPickWeight,
  pickWeightedExercise,
  type LeitnerCardState,
} from "./leitnerEngine";
import {
  isExamPathMission,
  isGrundlagePathMission,
  isVertiefungPathMission,
} from "./learnPathFilters";
import {
  getCurriculumByLf,
  getBeginnerExerciseIdsByLf,
  getExamExerciseIdsByLf,
  getGrundlageExercisesByLf,
  getVertiefungExercisesByLf,
  getBeginnerExercisesByLf,
  isCurriculumLoaded,
} from "./curriculumAccess";

export type { LearningExercise, LearningMcOption } from "./learningExerciseTypes";
export type { LeitnerCardState } from "./leitnerEngine";
export { applyLeitnerReview } from "./leitnerEngine";

/** LF5-Fallback wenn JSON-Milestones fehlen (minimal) */
const SQL_EXAM_LF5_FALLBACK: LearningExercise[] = [];

type Lf5WorkbenchMilestone = {
  id: string;
  type: "workbench";
  task: string;
  context: string;
  expected_query: string;
  hint: string;
};

type Lf5McMilestone = {
  id: string;
  type: "mc";
  question: string;
  options: string[];
  answer: number;
};

type BeginnerPathOption = {
  text: string;
  correct?: boolean;
  hint?: string;
};

type BeginnerPathEntry = {
  id: string;
  topic: string;
  level: string;
  title: string;
  lessonCards: Array<{
    title: string;
    body: string;
  }>;
  example?: {
    label: string;
    body: string;
  };
  practice: {
    type: string;
    question: string;
    coachLine?: string;
    expected?: string;
    /** multi = mehrere correct:true (WiSo) */
    selectMode?: "single" | "multi";
    brokenCode?: string;
    solutionHint?: string;
    options: BeginnerPathOption[];
  };
};

type BeginnerBossPhaseJson = {
  id?: string;
  title?: string;
  problemLead?: string;
  epicCoach?: {
    starwars?: string;
    anime?: string;
    gym?: string;
  };
  practice?: BeginnerPathEntry["practice"];
};

export type Lf5ContentShape = {
  lf: "LF5" | 5;
  title: string;
  beginnerPath?: BeginnerPathEntry[];
  bossPhase?: {
    id?: string;
    title?: string;
    epicCoach?: {
      starwars?: string;
      anime?: string;
      gym?: string;
    };
    expected?: Record<string, string>;
  };
  milestones: Array<Lf5WorkbenchMilestone | Lf5McMilestone>;
};

export type BeginnerContentShape = {
  lf?: LearningField | number | string;
  title?: string;
  beginnerPath?: BeginnerPathEntry[];
  bossPhase?: any;
};

function normalizeLearningField(rawLf: BeginnerContentShape["lf"]): LearningField | null {
  if (rawLf == null) return null;
  if (typeof rawLf === "number") {
    return rawLf >= 1 && rawLf <= 12 ? (`LF${rawLf}` as LearningField) : null;
  }
  const normalized = rawLf.toString().toUpperCase();
  return /^LF(?:[1-9]|1[0-2])$/.test(normalized) ? (normalized as LearningField) : null;
}

function practiceLang(type: string): LearningExercise["lang"] {
  if (type === "mc") return "markdown";
  if (type === "sql" || type === "csharp" || type === "bash" || type === "javascript") return type;
  if (type === "plain-text") return "plain-text";
  if (type === "markdown") return "markdown";
  return "plain-text";
}

/** C#/SQL/Bash-Boss aus beginnerPath-JSON (brokenCode + expected + MC) */
export function buildOptionalBossCodeExercise(raw: BeginnerContentShape): LearningExercise | null {
  const lf = normalizeLearningField(raw.lf);
  const bp = raw.bossPhase;
  if (!lf || !bp?.practice) return null;
  const p = bp.practice;
  if (p.type !== "csharp" && p.type !== "sql" && p.type !== "bash") return null;
  const options: BeginnerPathOption[] = (p.options ?? []) as BeginnerPathOption[];
  if (options.length < 2) return null;
  const expected = p.expected?.trim();
  const broken = p.brokenCode?.trim();
  if (!expected || !broken) return null;

  const correctIdx = Math.max(0, options.findIndex((option) => option.correct));
  const normalizedCorrectIdx = correctIdx === -1 ? 0 : correctIdx;
  const optIds = ["a", "b", "c", "d", "e", "f"];
  const mcOptions: LearningMcOption[] = options.map((option, idx) => ({
    id: optIds[idx] ?? `o${idx + 1}`,
    text: option.text,
    isCorrect: idx === normalizedCorrectIdx,
    whyWrongHint:
      idx === normalizedCorrectIdx
        ? undefined
        : option.hint || "Schau noch einmal auf die Action-Cards über der Übung",
  }));
  const bossId = bp.id?.trim() ? bp.id.trim() : `${lf.toLowerCase()}-boss`;
  const bossTitle = bp.title?.trim() ? bp.title.trim() : "Abschlussübung";
  const q = p.question.trim();
  const lead = bp.problemLead?.trim();
  const problem = lead ? `${lead}\n\n${q}` : q;
  const coachLineEpic =
    bp.epicCoach?.starwars?.trim() ||
    bp.epicCoach?.anime?.trim() ||
    bp.epicCoach?.gym?.trim();
  const coachLine = p.coachLine?.trim() || coachLineEpic;

  return {
    id: bossId,
    title: bossTitle,
    problem,
    solutionCode: expected,
    lang: practiceLang(p.type),
    mcQuestion: q,
    mcOptions,
    ...(coachLine ? { coachLine } : {}),
    workbenchInitialDraft: broken,
    solutionHint:
      p.solutionHint?.trim() ||
      "Nutze zuerst das Mini-Beispiel. Es ist erlaubt, die Struktur zu übernehmen und nur den Kern zu verstehen",
  } satisfies LearningExercise;
}

export function buildOptionalBossMcExercise(raw: BeginnerContentShape): LearningExercise | null {
  const lf = normalizeLearningField(raw.lf);
  const bp = raw.bossPhase;
  if (!lf || !bp?.practice || bp.practice.type !== "mc") return null;
  const options: BeginnerPathOption[] = (bp.practice.options ?? []) as BeginnerPathOption[];
  if (options.length < 2) return null;
  const correctIdx = Math.max(0, options.findIndex((option) => option.correct));
  const normalizedCorrectIdx = correctIdx === -1 ? 0 : correctIdx;
  const optIds = ["a", "b", "c", "d", "e", "f"];
  const mcOptions: LearningMcOption[] = options.map((option, idx) => ({
    id: optIds[idx] ?? `o${idx + 1}`,
    text: option.text,
    isCorrect: idx === normalizedCorrectIdx,
    whyWrongHint:
      idx === normalizedCorrectIdx
        ? undefined
        : option.hint || "Prüfe Hostbits Netz und Broadcast ziehen sich von der Gesamtzahl ab",
  }));
  const correctText = options[normalizedCorrectIdx]?.text ?? options[0]?.text ?? "";
  const solutionCode = bp.practice.expected ?? correctText;
  const bossId = bp.id?.trim() ? bp.id.trim() : `${lf.toLowerCase()}-boss`;
  const bossTitle = bp.title?.trim() ? bp.title.trim() : "Abschlussübung";
  const q = bp.practice.question.trim();
  const lead = bp.problemLead?.trim();
  const problem = lead ? `${lead}\n\n${q}` : q;
  return {
    id: bossId,
    title: bossTitle,
    problem,
    solutionCode,
    lang: "markdown",
    mcQuestion: q,
    mcOptions,
    solutionHint: undefined,
  } satisfies LearningExercise;
}

export function buildBeginnerPathFromJson(raw: BeginnerContentShape): LearningExercise[] {
  const lf = normalizeLearningField(raw.lf);
  if (!lf || !raw.beginnerPath?.length) return [];

  return raw.beginnerPath.map((path, pathIdx) => {
    const options = path.practice.options.length
      ? path.practice.options
      : [{ text: "Ich habe den ersten Schritt verstanden", correct: true }];
    const correctCount = options.filter((option) => option.correct).length;
    const mcSelectMode: "single" | "multi" =
      path.practice.selectMode === "multi" || correctCount > 1 ? "multi" : "single";
    const correctIdx = Math.max(0, options.findIndex((option) => option.correct));
    const normalizedCorrectIdx = correctIdx === -1 ? 0 : correctIdx;
    const optIds = ["a", "b", "c", "d", "e", "f"];
    const mcOptions: LearningMcOption[] = options.map((option, idx) => ({
      id: optIds[idx] ?? `o${idx + 1}`,
      text: option.text,
      isCorrect: mcSelectMode === "multi" ? Boolean(option.correct) : idx === normalizedCorrectIdx,
      whyWrongHint:
        (mcSelectMode === "multi" ? option.correct : idx === normalizedCorrectIdx)
          ? undefined
          : option.hint || "Schau noch einmal auf die Action-Cards über der Übung",
    }));
    const correctTexts = options.filter((option) => option.correct).map((option) => option.text);
    const correctText =
      correctTexts.length > 0
        ? correctTexts.join(" | ")
        : (options[normalizedCorrectIdx]?.text ?? options[0]?.text ?? "");
    const solutionCode = path.practice.expected ?? correctText;

    const coachLine = path.practice.coachLine?.trim();
    const workbenchInitialDraft = path.practice.brokenCode?.trim();

    return {
      id: path.id || `${lf.toLowerCase()}-start-${pathIdx + 1}`,
      title: path.title || `${raw.title ?? lf} Einstieg`,
      problem: path.practice.question,
      solutionCode,
      lang: practiceLang(path.practice.type),
      mcQuestion: path.practice.question,
      mcOptions,
      mcSelectMode,
      lessonCards: path.lessonCards,
      example: path.example,
      ...(coachLine ? { coachLine } : {}),
      ...(workbenchInitialDraft ? { workbenchInitialDraft } : {}),
      solutionHint:
        path.practice.solutionHint?.trim() ||
        (path.practice.type === "sql" ||
        path.practice.type === "csharp" ||
        path.practice.type === "bash"
          ? "Nutze zuerst das Mini-Beispiel. Es ist erlaubt, die Struktur zu übernehmen und nur den Kern zu verstehen"
          : coachLine && !path.example?.body
            ? undefined
            : path.example?.body || `Starte ruhig mit der ersten ${lf} Action-Card`),
    } satisfies LearningExercise;
  });
}

export function buildLf5FromJson(raw: Lf5ContentShape): LearningExercise[] {
  const workbench = raw.milestones.find((m): m is Lf5WorkbenchMilestone => m.type === "workbench");
  const mc = raw.milestones.find((m): m is Lf5McMilestone => m.type === "mc");
  if (!workbench || !mc || mc.options.length < 2) return SQL_EXAM_LF5_FALLBACK;

  const normalizedAnswer = Number.isFinite(mc.answer) ? Math.max(0, Math.floor(mc.answer)) : 0;
  const optIds = ["a", "b", "c", "d", "e", "f"];
  const mcOptions: LearningMcOption[] = mc.options.map((text, idx) => ({
    id: optIds[idx] ?? `o${idx + 1}`,
    text,
    isCorrect: idx === normalizedAnswer,
    whyWrongHint:
      idx === normalizedAnswer ? undefined : workbench.hint || "Prüfe Join Semantik und Ergebnisumfang",
  }));

  const bossId = raw.bossPhase?.id?.trim() ? raw.bossPhase.id.trim() : "lf5-boss";
  const bossTitle = raw.bossPhase?.title?.trim() ? raw.bossPhase.title.trim() : "Abschlussübung";

  return [
    {
      id: workbench.id,
      title: "Daten filtern ohne Vorwissen",
      problem: `${workbench.task}\n\n${workbench.context}`,
      solutionCode: workbench.expected_query,
      lang: "sql",
      mcQuestion: mc.question,
      mcOptions,
      solutionHint:
        "Du musst dir SQL noch nicht merken. Lies zuerst: FROM sagt aus welcher Tabelle, WHERE ist der Filter",
    },
    {
      id: bossId,
      title: bossTitle,
      problem:
        "Abschlussübung: SQL-Abfrage\n\nNutze SELECT und WHERE zusammen und halte die Struktur sauber",
      /** Referenz wird im Workbench je Multiversum aus content.json geladen */
      solutionCode: "SELECT * FROM Kunden WHERE Stadt = 'Berlin'",
      lang: "sql",
      mcQuestion: "Welche Clause begrenzt die Zeilenmenge in SQL",
      mcOptions: [
        { id: "a", text: "WHERE", isCorrect: true },
        { id: "b", text: "FROM", isCorrect: false, whyWrongHint: "FROM wählt die Tabelle" },
        { id: "c", text: "SELECT", isCorrect: false, whyWrongHint: "SELECT wählt Spalten" },
        { id: "d", text: "ORDER BY", isCorrect: false, whyWrongHint: "ORDER BY sortiert Ergebnisse" },
      ],
      solutionHint: "SELECT zuerst dann FROM dann WHERE als Filter",
    },
  ];
}

/** Grundlagen → Vertiefung (Story) → Prüfung — JSON-Reihenfolge je Teilmenge */
export function buildLearnAndExamPathsFromJson(raw: BeginnerContentShape): {
  grundlage: LearningExercise[];
  vertiefung: LearningExercise[];
  learn: LearningExercise[];
  exam: LearningExercise[];
} {
  const entries = raw.beginnerPath ?? [];
  const grundlageEntries = entries.filter((entry) => isGrundlagePathMission(entry));
  const vertiefungEntries = entries.filter((entry) => isVertiefungPathMission(entry));
  const examEntries = entries.filter((entry) => isExamPathMission(entry));
  const grundlage = buildBeginnerPathFromJson({ ...raw, beginnerPath: grundlageEntries });
  const vertiefung = buildBeginnerPathFromJson({ ...raw, beginnerPath: vertiefungEntries });
  return {
    grundlage,
    vertiefung,
    learn: [...grundlage, ...vertiefung],
    exam: buildBeginnerPathFromJson({ ...raw, beginnerPath: examEntries }),
  };
}

export function assertMcIntegrity(ex: LearningExercise): void {
  const correct = ex.mcOptions.filter((o) => o.isCorrect);
  const isMulti = ex.mcSelectMode === "multi";
  if (isMulti) {
    if (correct.length < 2) {
      throw new Error(`Exercise ${ex.id}: Mehrfachauswahl braucht mindestens zwei richtige MC-Optionen`);
    }
  } else if (correct.length !== 1) {
    throw new Error(`Exercise ${ex.id}: genau eine richtige MC-Option nötig`);
  }
  for (const o of ex.mcOptions) {
    if (!o.isCorrect && (!o.whyWrongHint || o.whyWrongHint.trim() === "")) {
      throw new Error(`Exercise ${ex.id}: falsche Option braucht whyWrongHint`);
    }
  }
}

function getPendingInLearnPath(
  path: LearningExercise[],
  leitner?: Readonly<Record<string, LeitnerCardState>>,
  ctx?: EdtechExercisePickContext | null
): LearningExercise | null {
  if (!path.length) return null;
  const solved = new Set(ctx?.solvedExerciseIds ?? []);
  const exclude = ctx?.excludeExerciseId;
  for (const ex of path) {
    if (exclude && ex.id === exclude) continue;
    if (solved.has(ex.id)) continue;
    const state = leitner?.[ex.id];
    if (!state || state.repetitions < 1) return ex;
  }
  return null;
}

function getPendingBeginnerExercise(
  lf: LearningField,
  leitner?: Readonly<Record<string, LeitnerCardState>>,
  ctx?: EdtechExercisePickContext | null
): LearningExercise | null {
  const grundlage = getGrundlageExercisesByLf(lf);
  const pendingGrund = getPendingInLearnPath(grundlage, leitner, ctx);
  if (pendingGrund) return pendingGrund;
  const vertiefung = getVertiefungExercisesByLf(lf);
  return getPendingInLearnPath(vertiefung, leitner, ctx);
}

function filterExercisePool<T extends { id: string }>(
  pool: T[],
  ctx?: EdtechExercisePickContext | null
): T[] {
  if (!pool.length) return pool;
  const exclude = ctx?.excludeExerciseId;
  const recent = new Set(ctx?.recentExerciseIds ?? []);
  let out = pool.filter((ex) => ex.id !== exclude && !recent.has(ex.id));
  if (out.length) return out;
  out = pool.filter((ex) => ex.id !== exclude);
  if (out.length) return out;
  if (recent.size) {
    out = pool.filter((ex) => !recent.has(ex.id));
    if (out.length) return out;
  }
  return pool;
}

export function getBeginnerExerciseForLf(lf: LearningField): LearningExercise | null {
  if (!isCurriculumLoaded()) return null;
  return getGrundlageExercisesByLf(lf)[0] ?? getBeginnerExercisesByLf(lf)[0] ?? null;
}

export function getNextLearnExerciseForLf(
  lf: LearningField,
  leitner?: Readonly<Record<string, LeitnerCardState>>,
  solvedExerciseIds?: readonly string[]
): LearningExercise | null {
  if (!isCurriculumLoaded()) return null;
  return getPendingBeginnerExercise(lf, leitner, { solvedExerciseIds });
}

export type EdtechExercisePickContext = {
  excludeExerciseId?: string | null;
  recentExerciseIds?: readonly string[];
  solvedExerciseIds?: readonly string[];
};

export function getLearningExerciseById(
  lf: LearningField,
  exerciseId: string
): LearningExercise | null {
  if (!isCurriculumLoaded()) return null;
  const bag = getCurriculumByLf(lf);
  return bag.find((ex) => ex.id === exerciseId) ?? null;
}

export function pickLearningExercise(
  lf: LearningField,
  _semantic: "HardwareNetworking" | "SecurityCryptography" | "DatabaseLogic",
  seed: number
): LearningExercise | null {
  const bag = getCurriculumByLf(lf);
  if (!bag?.length) return null;
  const beginner = getPendingBeginnerExercise(lf);
  if (beginner) return beginner;
  const n = Number.parseInt(lf.replace("LF", ""), 10);
  const salt = Number.isFinite(n) ? n * 131 : 0;
  const idx = Math.abs((seed * 1103515245 + salt) % bag.length);
  return bag[idx]!;
}

/** Adaptive Auswahl: Leitner-Gewichte + Ebbinghaus-Retention (siehe leitnerEngine) */
export function pickLearningExerciseFromLfAdaptive(
  lf: LearningField,
  rng: () => number,
  leitner: Readonly<Record<string, LeitnerCardState>>,
  now: number,
  edtechCtx?: EdtechExercisePickContext | null
): LearningExercise | null {
  const bag = getCurriculumByLf(lf);
  if (!bag?.length) return null;
  const pendingBeginner = getPendingBeginnerExercise(lf, leitner, edtechCtx);
  if (pendingBeginner) return pendingBeginner;

  const beginnerIds = getBeginnerExerciseIdsByLf(lf);
  const examIds = getExamExerciseIdsByLf(lf);
  const solved = new Set(edtechCtx?.solvedExerciseIds ?? []);
  let reviewBag = bag.filter(
    (exercise) => !beginnerIds.has(exercise.id) && !examIds.has(exercise.id)
  );
  reviewBag = filterExercisePool(reviewBag, edtechCtx);
  if (!reviewBag.length) {
    reviewBag = filterExercisePool(
      bag.filter((exercise) => !beginnerIds.has(exercise.id) && !examIds.has(exercise.id)),
      edtechCtx
    );
  }

  const unseen = reviewBag.filter((exercise) => !solved.has(exercise.id));
  const pickPool = unseen.length ? unseen : reviewBag;
  if (!pickPool.length) return null;

  return pickWeightedExercise(pickPool, rng, (id) => leitnerPickWeight(id, leitner, now));
}

export function pickRandomLf(rng: () => number): LearningField {
  const n = 1 + Math.floor(rng() * 12);
  return `LF${n}` as LearningField;
}

/** Final Exam: zufälliges LF, dann adaptive Übung aus dessen Curriculum */
export function pickFinalExamExercise(
  rng: () => number,
  leitner: Readonly<Record<string, LeitnerCardState>>,
  now: number
): { exercise: LearningExercise; lf: LearningField } | null {
  const lf = pickRandomLf(rng);
  const exercise = pickLearningExerciseFromLfAdaptive(lf, rng, leitner, now, null);
  if (!exercise) return null;
  return { exercise, lf };
}


export {
  ensureCurriculumLoaded,
  isCurriculumLoaded,
  CURRICULUM_BY_LF,
  GRUNDLAGE_EXERCISES_BY_LF,
  VERTIEFUNG_EXERCISES_BY_LF,
  BEGINNER_EXERCISES_BY_LF,
  EXAM_PATH_EXERCISES_BY_LF,
  BEGINNER_EXERCISE_IDS_BY_LF,
  EXAM_EXERCISE_IDS_BY_LF,
} from "./curriculumAccess";
export { resolveTerminalBossMode } from "./curriculumAccess";
