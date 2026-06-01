import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { buildExamReadinessSnapshot } from "../../../lib/curriculum/examReadiness";
import { useNexusI18n } from "../../../lib/i18n/I18nProvider";
import { useGameStore } from "../../../store/useGameStore";
import { cyanAccent, goldAccent } from "./edtechHubTokens";
import "./edtechExamReadiness.css";

export type EdtechExamReadinessCardProps = {
  onFocusLf?: (lf: number) => void;
  compact?: boolean;
};

export function EdtechExamReadinessCard({ onFocusLf, compact = false }: EdtechExamReadinessCardProps) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  const learningCorrectByLf = useGameStore((s) => s.learningCorrectByLf);
  const learningLeitnerByExerciseId = useGameStore((s) => s.learningLeitnerByExerciseId);

  const snapshot = useMemo(
    () => buildExamReadinessSnapshot(learningLeitnerByExerciseId, learningCorrectByLf),
    [learningCorrectByLf, learningLeitnerByExerciseId]
  );

  const mentorTone =
    snapshot.mentorScore >= 78
      ? "ready"
      : snapshot.mentorScore >= 45
        ? "ontrack"
        : "start";

  return (
    <section
      className={compact ? "nx-edtech-readiness nx-edtech-readiness--compact" : "nx-edtech-readiness"}
      aria-labelledby="nx-edtech-readiness-title"
    >
      <div className="nx-edtech-readiness-head">
        <div>
          <h2 id="nx-edtech-readiness-title">{t("hub.edtech.readiness.title")}</h2>
          <p className="nx-edtech-readiness-lead">{t("hub.edtech.readiness.lead")}</p>
        </div>
        <div className={`nx-edtech-readiness-score nx-edtech-readiness-score--${mentorTone}`}>
          <span className="nx-edtech-readiness-score-label">
            {t("hub.edtech.readiness.mentorScore")}
          </span>
          <span className="nx-edtech-readiness-score-value">
            {snapshot.mentorScore}
            <span className="nx-edtech-readiness-score-max">/100</span>
          </span>
        </div>
      </div>

      <div className="nx-edtech-readiness-bars">
        <ReadinessBar
          label={t("hub.edtech.readiness.ap1")}
          pct={snapshot.ap1Pct}
          sub={t("hub.edtech.readiness.apSub")
            .replace("{solved}", String(snapshot.ap1Solved))
            .replace("{total}", String(snapshot.ap1Total))}
          accent={cyanAccent}
          reduceMotion={reduceMotion}
        />
        <ReadinessBar
          label={t("hub.edtech.readiness.ap2")}
          pct={snapshot.ap2Pct}
          sub={t("hub.edtech.readiness.apSub")
            .replace("{solved}", String(snapshot.ap2Solved))
            .replace("{total}", String(snapshot.ap2Total))}
          accent={goldAccent}
          reduceMotion={reduceMotion}
        />
        <ReadinessBar
          label={t("hub.edtech.readiness.overall")}
          pct={snapshot.overallPct}
          sub={t("hub.edtech.readiness.overallSub").replace("{pct}", String(snapshot.overallPct))}
          accent="rgba(139, 92, 246, 0.95)"
          reduceMotion={reduceMotion}
        />
      </div>

      {!compact ? (
        <div className="nx-edtech-readiness-grid" role="list" aria-label={t("hub.edtech.readiness.gridAria")}>
          {snapshot.rows.map((row) => (
            <motion.button
              key={row.lf}
              type="button"
              role="listitem"
              className="nx-edtech-readiness-lf"
              onClick={() => onFocusLf?.(row.lf)}
              whileHover={reduceMotion || !onFocusLf ? undefined : { y: -2 }}
              whileTap={reduceMotion || !onFocusLf ? undefined : { scale: 0.99 }}
              disabled={!onFocusLf}
            >
              <span className="nx-edtech-readiness-lf-num">LF{row.lf}</span>
              <span className="nx-edtech-readiness-lf-pct">{row.pct}%</span>
              {row.examMissionTotal ? (
                <span className="nx-edtech-readiness-lf-exam">
                  {t("hub.edtech.readiness.examMissions")
                    .replace("{solved}", String(row.examMissionSolved ?? 0))
                    .replace("{total}", String(row.examMissionTotal))}
                </span>
              ) : null}
            </motion.button>
          ))}
        </div>
      ) : null}

      {onFocusLf ? (
        <motion.button
          type="button"
          className="nx-edtech-readiness-cta"
          onClick={() => onFocusLf(snapshot.focusLf)}
          whileHover={reduceMotion ? undefined : { scale: 1.02 }}
        >
          {t("hub.edtech.readiness.cta").replace("{lf}", String(snapshot.focusLf))}
        </motion.button>
      ) : null}
    </section>
  );
}

function ReadinessBar({
  label,
  pct,
  sub,
  accent,
  reduceMotion,
}: {
  label: string;
  pct: number;
  sub: string;
  accent: string;
  reduceMotion: boolean | null;
}) {
  return (
    <div className="nx-edtech-readiness-bar-block">
      <div className="nx-edtech-readiness-bar-head">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="nx-edtech-readiness-bar-track" aria-hidden>
        <motion.span
          className="nx-edtech-readiness-bar-fill"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 28 }}
          style={{ background: `linear-gradient(90deg, ${accent}, rgba(255,255,255,0.35))` }}
        />
      </div>
      <span className="nx-edtech-readiness-bar-sub">{sub}</span>
    </div>
  );
}
