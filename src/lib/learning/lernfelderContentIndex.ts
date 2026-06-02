/**
 * Zentrale JSON-Imports für Lernfelder — eine Quelle für Registry und Katalog.
 */
import type { LearningField } from "../../data/nexusRegistry";
import lf01Content from "../../lernfelder/lf01/content.json";
import lf02Content from "../../lernfelder/lf02/content.json";
import lf02ExamPath from "../../lernfelder/lf02/examPath.json";
import lf03Content from "../../lernfelder/lf03/content.json";
import lf04Content from "../../lernfelder/lf04/content.json";
import lf05Content from "../../lernfelder/lf05/content.json";
import lf06Content from "../../lernfelder/lf06/content.json";
import lf07Content from "../../lernfelder/lf07/content.json";
import lf08Content from "../../lernfelder/lf08/content.json";
import lf09Content from "../../lernfelder/lf09/content.json";
import lf10Content from "../../lernfelder/lf10/content.json";
import lf11Content from "../../lernfelder/lf11/content.json";
import lf12Content from "../../lernfelder/lf12/content.json";
import wisoExamPath from "../../lernfelder/sommer2026/wisoExamPath.json";
import ga1ExamPath from "../../lernfelder/sommer2026/ga1ExamPath.json";
import ga2ExamPath from "../../lernfelder/sommer2026/ga2ExamPath.json";

export type BeginnerPathEntry = NonNullable<
  (typeof lf01Content)["beginnerPath"]
>[number];

export type BeginnerContentShape = {
  lf?: string;
  ap?: string;
  title?: string;
  beginnerPath?: BeginnerPathEntry[];
  reference?: Array<{ id?: string; chapter?: string; title?: string; type?: string }>;
  milestones?: unknown[];
  bossPhase?: unknown;
  [key: string]: unknown;
};

export {
  lf01Content,
  lf02Content,
  lf02ExamPath,
  lf03Content,
  lf04Content,
  lf05Content,
  lf06Content,
  lf07Content,
  lf08Content,
  lf09Content,
  lf10Content,
  lf11Content,
  lf12Content,
  wisoExamPath,
  ga1ExamPath,
  ga2ExamPath,
};

export const lf01WithSommer2026: BeginnerContentShape = {
  ...(lf01Content as BeginnerContentShape),
  beginnerPath: [
    ...((lf01Content as BeginnerContentShape).beginnerPath ?? []),
    ...(wisoExamPath as BeginnerPathEntry[]),
  ],
};

export const lf02WithExam: BeginnerContentShape = {
  ...(lf02Content as BeginnerContentShape),
  beginnerPath: [
    ...((lf02Content as BeginnerContentShape).beginnerPath ?? []),
    ...(lf02ExamPath as BeginnerPathEntry[]),
    ...(ga1ExamPath as BeginnerPathEntry[]),
  ],
};

export const lf10WithSommer2026: BeginnerContentShape = {
  ...(lf10Content as BeginnerContentShape),
  beginnerPath: [
    ...((lf10Content as BeginnerContentShape).beginnerPath ?? []),
    ...(ga2ExamPath as BeginnerPathEntry[]),
  ],
};

export const BEGINNER_CONTENT_BY_LF: Record<LearningField, BeginnerContentShape> = {
  LF1: lf01WithSommer2026,
  LF2: lf02WithExam,
  LF3: lf03Content as BeginnerContentShape,
  LF4: lf04Content as BeginnerContentShape,
  LF5: lf05Content as BeginnerContentShape,
  LF6: lf06Content as BeginnerContentShape,
  LF7: lf07Content as BeginnerContentShape,
  LF8: lf08Content as BeginnerContentShape,
  LF9: lf09Content as BeginnerContentShape,
  LF10: lf10WithSommer2026,
  LF11: lf11Content as BeginnerContentShape,
  LF12: lf12Content as BeginnerContentShape,
};

/** Katalog-Shape (gleiche Daten, für Edtech-Hub) */
export type CatalogContentShape = BeginnerContentShape;

export const CATALOG_RAW_BY_LF: Record<LearningField, CatalogContentShape> =
  BEGINNER_CONTENT_BY_LF;
