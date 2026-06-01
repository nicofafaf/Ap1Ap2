import type { LearningField } from "../../data/nexusRegistry";
import { LF_EDTECH_SUMMARY } from "./edtechLfDisplay";
import { getLfExerciseTotal } from "./lfExerciseTotals";
import { isExamPathMission, isGrundlagePathMission, isVertiefungPathMission } from "./learnPathFilters";
import lf01 from "../../lernfelder/lf01/content.json";
import lf02 from "../../lernfelder/lf02/content.json";
import lf02ExamPath from "../../lernfelder/lf02/examPath.json";
import wisoExamPath from "../../lernfelder/sommer2026/wisoExamPath.json";
import ga1ExamPath from "../../lernfelder/sommer2026/ga1ExamPath.json";
import ga2ExamPath from "../../lernfelder/sommer2026/ga2ExamPath.json";
import lf03 from "../../lernfelder/lf03/content.json";
import lf04 from "../../lernfelder/lf04/content.json";
import lf05 from "../../lernfelder/lf05/content.json";
import lf06 from "../../lernfelder/lf06/content.json";
import lf07 from "../../lernfelder/lf07/content.json";
import lf08 from "../../lernfelder/lf08/content.json";
import lf09 from "../../lernfelder/lf09/content.json";
import lf10 from "../../lernfelder/lf10/content.json";
import lf11 from "../../lernfelder/lf11/content.json";
import lf12 from "../../lernfelder/lf12/content.json";

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

const lf02MergedCatalog: ContentShape = {
  ...(lf02 as ContentShape),
  beginnerPath: [
    ...((lf02 as ContentShape).beginnerPath ?? []),
    ...(lf02ExamPath as NonNullable<ContentShape["beginnerPath"]>),
    ...(ga1ExamPath as NonNullable<ContentShape["beginnerPath"]>),
  ],
};

const lf01MergedCatalog: ContentShape = {
  ...(lf01 as ContentShape),
  beginnerPath: [
    ...((lf01 as ContentShape).beginnerPath ?? []),
    ...(wisoExamPath as NonNullable<ContentShape["beginnerPath"]>),
  ],
};

const lf10MergedCatalog: ContentShape = {
  ...(lf10 as ContentShape),
  beginnerPath: [
    ...((lf10 as ContentShape).beginnerPath ?? []),
    ...(ga2ExamPath as NonNullable<ContentShape["beginnerPath"]>),
  ],
};

const RAW: Record<LearningField, ContentShape> = {
  LF1: lf01MergedCatalog,
  LF2: lf02MergedCatalog,
  LF3: lf03 as ContentShape,
  LF4: lf04 as ContentShape,
  LF5: lf05 as ContentShape,
  LF6: lf06 as ContentShape,
  LF7: lf07 as ContentShape,
  LF8: lf08 as ContentShape,
  LF9: lf09 as ContentShape,
  LF10: lf10MergedCatalog,
  LF11: lf11 as ContentShape,
  LF12: lf12 as ContentShape,
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

function buildChapters(raw: ContentShape): LfCourseChapter[] {
  const counts = new Map<string, number>();
  for (const ref of raw.reference ?? []) {
    const ch = ref.chapter?.trim() || "Kurs";
    counts.set(ch, (counts.get(ch) ?? 0) + 1);
  }
  return [...counts.entries()].map(([title, noteCount], index) => ({
    id: chapterId(title, index),
    title,
    noteCount,
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
  const raw = RAW[lfKey];
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
