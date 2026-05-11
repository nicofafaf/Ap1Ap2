import { useMemo } from "react";
import { readMasterLeitfaden } from "../../lernfelder/masterLeitfaden";
import { LfTerminalShell } from "../../lernfelder/LfTerminalShell";
import { typography } from "../../theme/typography";
import type { LearningField } from "../../data/nexusRegistry";

type MasterLeitfadenPanelProps = {
  learningCorrectByLf: Readonly<Record<LearningField, readonly string[]>>;
  activeLf: LearningField;
};

function pct(x: number): string {
  return `${Math.round(Math.min(1, Math.max(0, x)) * 100)}%`;
}

export function MasterLeitfadenPanel({ learningCorrectByLf, activeLf }: MasterLeitfadenPanelProps) {
  const snap = useMemo(() => readMasterLeitfaden(learningCorrectByLf), [learningCorrectByLf]);

  return (
    <section
      style={{
        borderRadius: 10,
        border: "1px solid rgba(232, 233, 240, 0.16)",
        background: "color-mix(in srgb, var(--nx-vantablack) 88%, transparent)",
        padding: "16px 18px",
        marginBottom: 8,
      }}
    >
      <h3
        style={{
          margin: "0 0 12px",
          fontFamily: typography.fontSans,
          fontSize: "max(12px, 0.76rem)",
          fontWeight: 100,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--nx-bone-50)",
        }}
      >
        Master Leitfaden
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <div style={{ fontFamily: typography.fontSans, fontSize: 11, color: "var(--nx-bone-50)" }}>AP1 LF1 bis LF6</div>
          <div style={{ marginTop: 6, fontFamily: typography.fontSans, fontSize: 22, fontWeight: 200, color: "var(--nx-bone-90)" }}>
            {pct(snap.ap1)}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: typography.fontSans, fontSize: 11, color: "var(--nx-bone-50)" }}>AP2 LF7 bis LF12</div>
          <div style={{ marginTop: 6, fontFamily: typography.fontSans, fontSize: 22, fontWeight: 200, color: "var(--nx-bone-90)" }}>
            {pct(snap.ap2)}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <LfTerminalShell lf={activeLf} />
      </div>
    </section>
  );
}
