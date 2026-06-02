import type { LearningField } from "../../data/nexusRegistry";
import { LF_EDTECH_SUMMARY } from "./edtechLfDisplay";
import { getLfExerciseTotal } from "./lfExerciseTotals";
import { isExamPathMission, isGrundlagePathMission, isVertiefungPathMission } from "./learnPathFilters";
import { CATALOG_RAW_BY_LF } from "./lernfelderContentIndex";

type ContentShape = {
  lf?: string;
  title?: string;
  ap?: string;
  bossPhase?: { id?: string };
  beginnerPath?: Array<{
    id?: string;
    title?: string;
    topic?: string;
    practice?: { type?: string };
  }>;
  reference?: Array<{ id?: string; chapter?: string; title?: string; type?: string }>;
};

export type LfCourseChapter = {
  id: string;
  title: string;
  noteCount: number;
};

export type LfCourseMission = {
  id: string;
  title: string;
  topic: string;
};

export type LfCourseTool = {
  id: string;
  labelKey: string;
};

export type LfCourseMeta = {
  lf: number;
  lfKey: LearningField;
  title: string;
  summary: string;
  ap: string;
  chapters: LfCourseChapter[];
  /** Grundlagen- und Einstiegsmissionen (Lernmodus, zuerst) */
  missions: LfCourseMission[];
  /** Story / Multiversum / CCNA — nach den Grundlagen */
  vertiefungMissions: LfCourseMission[];
  /** Prüfung · / IHK — nur im Prüfungsmodus */
  examMissions: LfCourseMission[];
  tools: LfCourseTool[];
  totalExercises: number;
  hasBoss: boolean;
  hasCodeWorkbench: boolean;
  hasNetplan: boolean;
};

const TOOLS_BY_LF: Record<number, LfCourseTool[]> = {
  1: [{ id: "codex", labelKey: "map.edtechCourse.toolCodex" }],
  2: [{ id: "codex", labelKey: "map.edtechCourse.toolCodex" }],
  3: [
    { id: "codex", labelKey: "map.edtechCourse.toolCodex" },
    { id: "network", labelKey: "hub.edtech.mega.toolNetwork" },
  ],
  4: [{ id: "codex", labelKey: "map.edtechCourse.toolCodex" }],
  5: [
    { id: "sql", labelKey: "hub.edtech.mega.simSql" },
    { id: "codex", labelKey: "map.edtechCourse.toolCodex" },
  ],
  6: [
    { id: "code", labelKey: "hub.edtech.mega.simDojo" },
    { id: "codex", labelKey: "map.edtechCourse.toolCodex" },
  ],
  7: [
    { id: "code", labelKey: "hub.edtech.mega.simDojo" },
    { id: "codex", labelKey: "map.edtechCourse.toolCodex" },
  ],
  8: [
    { id: "codex", labelKey: "map.edtechCourse.toolCodex" },
    { id: "database", labelKey: "map.edtechCourse.toolDb" },
  ],
  9: [{ id: "codex", labelKey: "map.edtechCourse.toolCodex" }],
  10: [
    { id: "netplan", labelKey: "hub.edtech.mega.simNetplan" },
    { id: "codex", labelKey: "map.edtechCourse.toolCodex" },
  ],
  11: [
    { id: "codex", labelKey: "map.edtechCourse.toolCodex" },
    { id: "security", labelKey: "map.edtechCourse.toolSecurity" },
  ],
  12: [{ id: "codex", labelKey: "map.edtechCourse.toolCodex" }],
};

function chapterId(title: string, index: number): string {
  return `ch-${index}-${title.replace(/\s+/g, "-").slice(0, 24)}`;
}

/** Lesekapitel = Grundlagen-Missionen (nicht altes Codex-reference[]) */
function buildChapters(raw: ContentShape): LfCourseChapter[] {
  return (raw.beginnerPath ?? [])
    .filter((m) => isGrundlagePathMission(m))
    .map((m, index) => ({
      id: m.id?.trim() || chapterId(m.title?.trim() || "Kapitel", index),
      title: m.title?.trim() || `Kapitel ${index + 1}`,
      noteCount: 0,
    }));
}

function mapMission(
  raw: ContentShape,
  m: NonNullable<ContentShape["beginnerPath"]>[number],
  i: number
): LfCourseMission {
  return {
    id: m.id?.trim() || `mission-${i}`,
    title: m.title?.trim() || `Mission ${i + 1}`,
    topic: m.topic?.trim() || raw.title?.trim() || "",
  };
}

function buildLearnMissions(raw: ContentShape): LfCourseMission[] {
  return (raw.beginnerPath ?? [])
    .filter((m) => isGrundlagePathMission(m))
    .map((m, i) => mapMission(raw, m, i));
}

function buildVertiefungMissions(raw: ContentShape): LfCourseMission[] {
  return (raw.beginnerPath ?? [])
    .filter((m) => isVertiefungPathMission(m))
    .map((m, i) => mapMission(raw, m, i));
}

function buildExamMissions(raw: ContentShape): LfCourseMission[] {
  return (raw.beginnerPath ?? [])
    .filter((m) => isExamPathMission(m))
    .map((m, i) => mapMission(raw, m, i));
}

function detectFlags(lfKey: LearningField, raw: ContentShape) {
  const hasBoss = Boolean(raw.bossPhase?.id?.trim());
  const hasCodeWorkbench =
    lfKey === "LF5" ||
    lfKey === "LF6" ||
    lfKey === "LF7" ||
    lfKey === "LF8" ||
    (raw.beginnerPath ?? []).some((p) => {
      const t = p.practice?.type;
      return t === "sql" || t === "csharp" || t === "javascript" || t === "bash";
    });
  const hasNetplan = lfKey === "LF10";
  return { hasBoss, hasCodeWorkbench, hasNetplan };
}

export function getLfCourseMeta(lf: number): LfCourseMeta | null {
  if (!Number.isFinite(lf) || lf < 1 || lf > 12) return null;
  const lfKey = `LF${lf}` as LearningField;
  const raw = CATALOG_RAW_BY_LF[lfKey] as ContentShape;
  if (!raw) return null;
  const flags = detectFlags(lfKey, raw);
  return {
    lf,
    lfKey,
    title: raw.title?.trim() || lfKey,
    summary: LF_EDTECH_SUMMARY[lf] ?? raw.title?.trim() ?? lfKey,
    ap: raw.ap?.trim() || (lf <= 6 ? "AP1" : "AP2"),
    chapters: buildChapters(raw),
    missions: buildLearnMissions(raw),
    vertiefungMissions: buildVertiefungMissions(raw),
    examMissions: buildExamMissions(raw),
    tools: TOOLS_BY_LF[lf] ?? [{ id: "codex", labelKey: "map.edtechCourse.toolCodex" }],
    totalExercises: getLfExerciseTotal(lfKey),
    ...flags,
  };
}

export const ALL_LF_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export function getAllLfCourseMeta(): LfCourseMeta[] {
  return ALL_LF_NUMBERS.map((n) => getLfCourseMeta(n)).filter((m): m is LfCourseMeta => m != null);
}
