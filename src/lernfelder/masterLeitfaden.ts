import type { LearningField } from "../data/nexusRegistry";
import { getCurriculumByLf, isCurriculumLoaded } from "../lib/learning/curriculumAccess";
import { getLfExerciseTotal } from "../lib/learning/lfExerciseTotals";

const AP1: LearningField[] = ["LF1", "LF2", "LF3", "LF4", "LF5", "LF6"];
const AP2: LearningField[] = ["LF7", "LF8", "LF9", "LF10", "LF11", "LF12"];

function ratioForLfs(
  lfs: readonly LearningField[],
  correctByLf: Readonly<Record<LearningField, readonly string[]>>
): number {
  let need = 0;
  let hit = 0;
  for (const lf of lfs) {
    const needCount = isCurriculumLoaded()
      ? getCurriculumByLf(lf).length
      : getLfExerciseTotal(lf);
    const want = isCurriculumLoaded()
      ? new Set(getCurriculumByLf(lf).map((e) => e.id))
      : null;
    const have = new Set(correctByLf[lf] ?? []);
    need += needCount;
    if (want) {
      for (const id of want) {
        if (have.has(id)) hit += 1;
      }
    } else {
      hit += Math.min(have.size, needCount);
    }
  }
  if (need === 0) return 1;
  return hit / need;
}

export type MasterLeitfadenSnapshot = {
  ap1: number;
  ap2: number;
};

export function readMasterLeitfaden(
  correctByLf: Readonly<Record<LearningField, readonly string[]>>
): MasterLeitfadenSnapshot {
  return {
    ap1: ratioForLfs(AP1, correctByLf),
    ap2: ratioForLfs(AP2, correctByLf),
  };
}
