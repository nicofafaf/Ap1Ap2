import type { LearningField } from "../data/nexusRegistry";
import veilUrl from "./_shared/iridium-veil.svg?url";
import { LfMilestoneTracker, type LfMilestone } from "../components/navigation/LfMilestoneTracker";
import { useGameStore } from "../store/useGameStore";
import { RAHMENLEHRPLAN_MASTERY } from "../lib/learning/rahmenlehrplanMastery";
import lf01 from "./lf01/content.json";
import lf02 from "./lf02/content.json";
import lf03 from "./lf03/content.json";
import lf04 from "./lf04/content.json";
import lf05 from "./lf05/content.json";
import lf06 from "./lf06/content.json";
import lf07 from "./lf07/content.json";
import lf08 from "./lf08/content.json";
import lf09 from "./lf09/content.json";
import lf10 from "./lf10/content.json";
import lf11 from "./lf11/content.json";
import lf12 from "./lf12/content.json";

type LfContentMilestone =
  | { id: string; type: "workbench"; task: string; context?: string }
  | { id: string; type: "mc"; question: string };

type LfManifest = {
  lf: LearningField;
  ap: "AP1" | "AP2";
  title: string;
  milestones?: LfContentMilestone[];
};

const MANIFEST: Record<LearningField, LfManifest> = {
  LF1: lf01 as LfManifest,
  LF2: lf02 as LfManifest,
  LF3: lf03 as LfManifest,
  LF4: lf04 as LfManifest,
  LF5: lf05 as LfManifest,
  LF6: lf06 as LfManifest,
  LF7: lf07 as LfManifest,
  LF8: lf08 as LfManifest,
  LF9: lf09 as LfManifest,
  LF10: lf10 as LfManifest,
  LF11: lf11 as LfManifest,
  LF12: lf12 as LfManifest,
};

export type LfTerminalShellProps = {
  lf: LearningField;
};

/**
 * Iridium Terminal-Rahmen je Lernfeld — Inhalt kommt aus dem Kampf-LearningTerminal
 * JSON-Manifeste liefern AP-Zuordnung und Titel für den Master Leitfaden
 */
export function LfTerminalShell({ lf }: LfTerminalShellProps) {
  const meta = MANIFEST[lf];
  const setPreferredLearningExerciseId = useGameStore((s) => s.setPreferredLearningExerciseId);
  const learningCorrectByLf = useGameStore((s) => s.learningCorrectByLf);
  const selectedExerciseId = useGameStore((s) => s.preferredLearningExerciseId);
  const campaign = useGameStore((s) => s.campaign);
  const trackerMilestones: LfMilestone[] = (meta.milestones ?? []).map((m) => ({
    id: m.id,
    type: m.type,
    label: m.type === "workbench" ? m.task : m.question,
  }));
  const correctIds = learningCorrectByLf[lf] ?? [];
  const mastery = RAHMENLEHRPLAN_MASTERY[lf];
  const lfNum = Number.parseInt(lf.replace("LF", ""), 10);
  const unlocked = campaign.unlockedSectors.includes(lfNum);

  return (
    <section
      data-lf-terminal={lf}
      style={{
        borderRadius: 8,
        overflow: "hidden",
        border: "1px solid rgba(232, 233, 240, 0.14)",
        background: "color-mix(in srgb, var(--nx-vantablack) 94%, transparent)",
      }}
    >
      <img src={veilUrl} alt="" width={320} height={120} style={{ width: "100%", height: "auto", display: "block" }} />
      <div style={{ padding: "12px 16px 16px", fontFamily: "var(--nx-font-sans)", fontWeight: 100 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--nx-bone-50)" }}>
          {meta.ap} · {lf}
        </div>
        <div style={{ marginTop: 6, fontSize: 13, color: "var(--nx-bone-90)" }}>{meta.title}</div>
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--nx-bone-50)", lineHeight: 1.4 }}>
          Mastery Check {mastery.masteryCheck}
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 10,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: unlocked ? "var(--nx-bone-90)" : "rgba(232,233,240,0.42)",
          }}
        >
          {unlocked ? "Sektor freigeschaltet" : "Sektor gesperrt"}
        </div>
        {trackerMilestones.length > 0 ? (
          <div style={{ marginTop: 14 }}>
            <LfMilestoneTracker
              lf={lf}
              milestones={trackerMilestones}
              correctIds={correctIds}
              selectedId={selectedExerciseId}
              onSelectMilestone={(id) => setPreferredLearningExerciseId(id)}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
