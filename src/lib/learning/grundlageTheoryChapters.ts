import type { LearningField } from "../../data/nexusRegistry";
import { getGrundlageExercisesByLf, isCurriculumLoaded } from "./curriculumAccess";
import {
  formatLearningDisplayText,
  friendlyExampleLabel,
  friendlyMissionTitle,
} from "./edtechLfDisplay";

export type TheoryLessonCard = { title: string; body: string };

export type GrundlageTheoryChapter = {
  id: string;
  title: string;
  topic: string;
  cards: TheoryLessonCard[];
  example: { label: string; body: string } | null;
};

export function getGrundlageTheoryChapters(
  lf: LearningField,
  storyMode: boolean
): GrundlageTheoryChapter[] {
  if (!isCurriculumLoaded()) return [];
  return getGrundlageExercisesByLf(lf)
    .filter((ex) => (ex.lessonCards?.length ?? 0) > 0)
    .map((ex) => {
      const topic = ex.id.includes("-grund-") ? "Grundlagen" : "";
      return {
        id: ex.id,
        title: friendlyMissionTitle(ex.id, ex.title, storyMode),
        topic,
        cards: (ex.lessonCards ?? []).map((c) => ({
          title: formatLearningDisplayText(c.title, storyMode),
          body: formatLearningDisplayText(c.body, storyMode),
        })),
        example: ex.example?.body
          ? {
              label: friendlyExampleLabel(ex.example.label ?? "Beispiel"),
              body: formatLearningDisplayText(ex.example.body, storyMode),
            }
          : null,
      };
    });
}
