import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import {
  BUNDESLAND_OPTIONS,
  DEFAULT_BUNDESLAND,
  TRAINING_TRACK_OPTIONS,
  type BundeslandId,
  type TrainingTrack,
} from "../../lib/curriculum/trainingProfile";
import { useNexusI18n } from "../../lib/i18n/I18nProvider";
import "./nexusOnboarding.css";

const CARD: CSSProperties = {
  width: "min(640px, 92vw)",
  margin: "0 auto",
  padding: "clamp(28px, 4vw, 40px)",
  borderRadius: 24,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background: "linear-gradient(165deg, #ffffff 0%, #f8fafc 100%)",
  boxShadow:
    "0 1px 0 rgba(255,255,255,0.9) inset, 0 24px 64px rgba(15, 23, 42, 0.08)",
};

export function OnboardingProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const { t } = useNexusI18n();
  return (
    <div className="nx-onboard-progress" role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
      <span className="nx-onboard-progress-label">
        {t("onboarding.stepOf")
          .replace("{current}", String(current))
          .replace("{total}", String(total))}
      </span>
      <div className="nx-onboard-progress-track">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`nx-onboard-progress-dot${i < current ? " is-done" : ""}${i === current - 1 ? " is-active" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}

function StepShell({
  stepIndex,
  children,
}: {
  stepIndex: number;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      key={`onboard-${stepIndex}`}
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
      className="nx-onboard-step"
    >
      <OnboardingProgress current={stepIndex} total={6} />
      <div style={CARD}>{children}</div>
    </motion.div>
  );
}

export function OnboardingWelcomeStep({ onContinue }: { onContinue: () => void }) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  return (
    <StepShell stepIndex={1}>
      <p className="nx-onboard-kicker">{t("onboarding.welcomeKicker")}</p>
      <h1 className="nx-onboard-title">{t("onboarding.welcomeTitle")}</h1>
      <p className="nx-onboard-lead">{t("onboarding.welcomeLead")}</p>
      <ul className="nx-onboard-bullets">
        <li>{t("onboarding.welcomeBullet1")}</li>
        <li>{t("onboarding.welcomeBullet2")}</li>
        <li>{t("onboarding.welcomeBullet3")}</li>
      </ul>
      <motion.button
        type="button"
        className="nx-onboard-primary"
        whileHover={reduceMotion ? undefined : { scale: 1.02 }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        onClick={onContinue}
      >
        {t("onboarding.welcomeCta")}
      </motion.button>
    </StepShell>
  );
}

export function OnboardingTrackStep({
  value,
  onSelect,
}: {
  value: TrainingTrack | null;
  onSelect: (track: TrainingTrack) => void;
}) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  return (
    <StepShell stepIndex={2}>
      <p className="nx-onboard-kicker">{t("onboarding.trackKicker")}</p>
      <h1 className="nx-onboard-title">{t("onboarding.trackTitle")}</h1>
      <p className="nx-onboard-lead">{t("onboarding.trackLead")}</p>
      <div className="nx-onboard-choice-grid">
        {TRAINING_TRACK_OPTIONS.map((opt) => {
          const selected = value === opt.id;
          return (
            <motion.button
              key={opt.id}
              type="button"
              className={`nx-onboard-choice${selected ? " is-selected" : ""}`}
              whileHover={reduceMotion ? undefined : { scale: 1.01 }}
              whileTap={reduceMotion ? undefined : { scale: 0.99 }}
              onClick={() => onSelect(opt.id)}
              aria-pressed={selected}
            >
              <span className="nx-onboard-choice-title">{t(opt.titleKey)}</span>
              <span className="nx-onboard-choice-lead">{t(opt.leadKey)}</span>
              <span className="nx-onboard-choice-meta">{t(opt.ap2Key)}</span>
            </motion.button>
          );
        })}
      </div>
      <p className="nx-onboard-hint">{t("onboarding.trackHint")}</p>
    </StepShell>
  );
}

export function OnboardingRegionStep({
  value,
  onSelect,
  onContinue,
}: {
  value: BundeslandId;
  onSelect: (id: BundeslandId) => void;
  onContinue: () => void;
}) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  return (
    <StepShell stepIndex={3}>
      <p className="nx-onboard-kicker">{t("onboarding.regionKicker")}</p>
      <h1 className="nx-onboard-title">{t("onboarding.regionTitle")}</h1>
      <p className="nx-onboard-lead">{t("onboarding.regionLead")}</p>
      <label className="nx-onboard-select-wrap">
        <span className="nx-onboard-select-label">{t("onboarding.regionLabel")}</span>
        <select
          className="nx-onboard-select"
          value={value}
          onChange={(e) => onSelect(e.target.value as BundeslandId)}
        >
          {BUNDESLAND_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <p className="nx-onboard-hint">{t("onboarding.regionHint")}</p>
      <motion.button
        type="button"
        className="nx-onboard-primary"
        whileHover={reduceMotion ? undefined : { scale: 1.02 }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        onClick={onContinue}
      >
        {t("onboarding.regionCta")}
      </motion.button>
    </StepShell>
  );
}

export { DEFAULT_BUNDESLAND };
