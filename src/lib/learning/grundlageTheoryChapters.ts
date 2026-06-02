import type { LearningField } from "../../data/nexusRegistry";
import { CATALOG_RAW_BY_LF } from "./lernfelderContentIndex";
import { getGrundlageExercisesByLf, isCurriculumLoaded } from "./curriculumAccess";
import {
  formatLearningDisplayText,
  friendlyExampleLabel,
  friendlyMissionTitle,
  friendlyTopicLine,
  mergeLessonCardsForEdtech,
} from "./edtechLfDisplay";
import { isGrundlagePathMission } from "./learnPathFilters";
import type { LearningExercise } from "./learningExerciseTypes";

export type GrundlageTheoryChapter = {
  id: string;
  title: string;
  topic: string;
  readTitle: string;
  body: string;
  coachLine: string | null;
  example: { label: string; body: string } | null;
};

type PathEntry = { id?: string; topic?: string; learnPhase?: string };

function mapExerciseToChapter(
  ex: LearningExercise,
  storyMode: boolean,
  topicRaw: string
): GrundlageTheoryChapter | null {
  const cards = ex.lessonCards ?? [];
  const merged = mergeLessonCardsForEdtech(cards, storyMode);
  if (!merged) return null;
  const topic = friendlyTopicLine(topicRaw, storyMode) || "Grundlagen";
  return {
    id: ex.id,
    title: friendlyMissionTitle(ex.id, ex.title, storyMode),
    topic,
    readTitle: merged.title,
    body: merged.body,
    coachLine: ex.coachLine
      ? formatLearningDisplayText(ex.coachLine, storyMode)
      : null,
    example: ex.example?.body
      ? {
          label: friendlyExampleLabel(ex.example.label ?? "Beispiel"),
          body: formatLearningDisplayText(ex.example.body, storyMode),
        }
      : null,
  };
}

export function getGrundlageTheoryChapters(
  lf: LearningField,
  storyMode: boolean
): GrundlageTheoryChapter[] {
  if (!isCurriculumLoaded()) return [];

  const raw = CATALOG_RAW_BY_LF[lf] as { beginnerPath?: PathEntry[] } | undefined;
  const byId = new Map<string, LearningExercise>();
  for (const ex of getGrundlageExercisesByLf(lf)) {
    if ((ex.lessonCards?.length ?? 0) > 0) byId.set(ex.id, ex);
  }

  const ordered: GrundlageTheoryChapter[] = [];
  const seen = new Set<string>();

  for (const entry of raw?.beginnerPath ?? []) {
    if (!isGrundlagePathMission(entry)) continue;
    const id = entry.id?.trim();
    if (!id || seen.has(id)) continue;
    const ex = byId.get(id);
    if (!ex) continue;
    const ch = mapExerciseToChapter(ex, storyMode, entry.topic?.trim() ?? "");
    if (ch) {
      ordered.push(ch);
      seen.add(id);
    }
  }

  for (const ex of byId.values()) {
    if (seen.has(ex.id)) continue;
    const ch = mapExerciseToChapter(ex, storyMode, "");
    if (ch) ordered.push(ch);
  }

  return ordered;
}
