import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  BUNDESLAND_OPTIONS,
  DEFAULT_BUNDESLAND,
  TRAINING_TRACK_OPTIONS,
  type BundeslandId,
  type TrainingTrack,
} from "../../lib/curriculum/trainingProfile";
import { publicAssetUrl } from "../../data/nexusRegistry";
import { useNexusI18n } from "../../lib/i18n/I18nProvider";
import { FRACTAL_COMMAND_BG_MP4 } from "../../lib/ui/fractalConstants";
import { NexusOnboardingLayout } from "./NexusOnboardingLayout";
import "./nexusOnboarding.css";

type StepHeroConfig = {
  heroKickerKey: string;
  heroTitleKey: string;
  heroLeadKey: string;
  videoSrc: string;
  videoPriority?: boolean;
};

const ONBOARDING_HERO_BY_STEP: Record<number, StepHeroConfig> = {
  1: {
    heroKickerKey: "onboarding.welcomeKicker",
    heroTitleKey: "onboarding.heroWelcomeTitle",
    heroLeadKey: "onboarding.heroWelcomeLead",
    videoSrc: FRACTAL_COMMAND_BG_MP4,
    videoPriority: true,
  },
  2: {
    heroKickerKey: "onboarding.trackKicker",
    heroTitleKey: "onboarding.heroTrackTitle",
    heroLeadKey: "onboarding.heroTrackLead",
    videoSrc: publicAssetUrl("/assets/LF7GIF.mp4"),
  },
  3: {
    heroKickerKey: "onboarding.regionKicker",
    heroTitleKey: "onboarding.heroRegionTitle",
    heroLeadKey: "onboarding.heroRegionLead",
    videoSrc: publicAssetUrl("/assets/LF3GIF.mp4"),
  },
  5: {
    heroKickerKey: "onboarding.codenameKicker",
    heroTitleKey: "onboarding.heroCodenameTitle",
    heroLeadKey: "onboarding.heroCodenameLead",
    videoSrc: publicAssetUrl("/assets/LF1GIF.mp4"),
  },
};

const ONBOARDING_TOTAL = 6;

const STEP_LABEL_KEYS = [
  "onboarding.stepLabelWelcome",
  "onboarding.stepLabelTrack",
  "onboarding.stepLabelRegion",
  "onboarding.stepLabelAvatar",
  "onboarding.stepLabelCodename",
  "onboarding.stepLabelScan",
] as const;

const STAGGER = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

const STAGGER_ITEM = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 320, damping: 28 },
  },
};

export function OnboardingProgress({
  current,
  total = ONBOARDING_TOTAL,
  stepIndex,
}: {
  current: number;
  total?: number;
  stepIndex: number;
}) {
  const { t } = useNexusI18n();
  const pct = Math.round((current / total) * 100);
  const labelKey = STEP_LABEL_KEYS[stepIndex - 1];
  return (
    <div
      className="nx-onboard-progress"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuetext={`${t(labelKey)} — ${pct}%`}
    >
      <div className="nx-onboard-progress-head">
        <span className="nx-onboard-progress-label">
          {t("onboarding.stepOf")
            .replace("{current}", String(current))
            .replace("{total}", String(total))}
        </span>
        <span className="nx-onboard-progress-name">{t(labelKey)}</span>
      </div>
      <div className="nx-onboard-progress-bar">
        <motion.span
          className="nx-onboard-progress-fill"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
        />
      </div>
      <div className="nx-onboard-progress-track" aria-hidden>
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

function OnboardingStepFrame({
  stepIndex,
  children,
}: {
  stepIndex: number;
  children: ReactNode;
}) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  const hero = ONBOARDING_HERO_BY_STEP[stepIndex];
  return (
    <NexusOnboardingLayout
      layout="split"
      heroKicker={hero ? t(hero.heroKickerKey) : undefined}
      heroTitle={hero ? t(hero.heroTitleKey) : undefined}
      heroLead={hero ? t(hero.heroLeadKey) : undefined}
      videoSrc={hero?.videoSrc}
      videoPriority={hero?.videoPriority}
    >
      <motion.div
        className="nx-onboard-step"
        initial={reduceMotion ? false : { opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: -14 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
      >
        <OnboardingProgress current={stepIndex} stepIndex={stepIndex} />
        <div className="nx-onboard-card">{children}</div>
      </motion.div>
    </NexusOnboardingLayout>
  );
}

export function OnboardingWelcomeStep({ onContinue }: { onContinue: () => void }) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  return (
    <OnboardingStepFrame stepIndex={1}>
      <motion.div variants={STAGGER} initial="hidden" animate="show">
        <motion.h2 variants={STAGGER_ITEM} className="nx-onboard-card-title">
          {t("onboarding.welcomeCardTitle")}
        </motion.h2>
        <motion.ul variants={STAGGER_ITEM} className="nx-onboard-bullets">
          <li>{t("onboarding.welcomeBullet1")}</li>
          <li>{t("onboarding.welcomeBullet2")}</li>
          <li>{t("onboarding.welcomeBullet3")}</li>
        </motion.ul>
        <motion.button
          variants={STAGGER_ITEM}
          type="button"
          className="nx-onboard-primary"
          whileHover={reduceMotion ? undefined : { scale: 1.02, y: -1 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          onClick={onContinue}
        >
          {t("onboarding.welcomeCta")}
        </motion.button>
      </motion.div>
    </OnboardingStepFrame>
  );
}

const TRACK_ICONS: Record<TrainingTrack, string> = {
  ae: "</>",
  fisi: "NET",
};

export function OnboardingTrackStep({
  pending,
  onPick,
  onContinue,
}: {
  pending: TrainingTrack | null;
  onPick: (track: TrainingTrack) => void;
  onContinue: () => void;
}) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  return (
    <OnboardingStepFrame stepIndex={2}>
      <motion.div variants={STAGGER} initial="hidden" animate="show">
        <motion.h2 variants={STAGGER_ITEM} className="nx-onboard-card-title">
          {t("onboarding.trackTitle")}
        </motion.h2>
        <motion.div variants={STAGGER_ITEM} className="nx-onboard-choice-grid">
          {TRAINING_TRACK_OPTIONS.map((opt, ix) => {
            const selected = pending === opt.id;
            return (
              <motion.button
                key={opt.id}
                type="button"
                className={`nx-onboard-choice${selected ? " is-selected" : ""}`}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : ix * 0.06, type: "spring", stiffness: 300, damping: 26 }}
                whileHover={
                  reduceMotion
                    ? undefined
                    : {
                        y: -3,
                        boxShadow:
                          "0 16px 40px rgba(6, 182, 212, 0.14), 0 0 0 1px rgba(214, 181, 111, 0.35)",
                      }
                }
                whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                onClick={() => onPick(opt.id)}
                aria-pressed={selected}
              >
                <span className="nx-onboard-choice-icon" aria-hidden>
                  {TRACK_ICONS[opt.id]}
                </span>
                <span className="nx-onboard-choice-title">{t(opt.titleKey)}</span>
                <span className="nx-onboard-choice-lead">{t(opt.leadKey)}</span>
                <span className="nx-onboard-choice-meta">{t(opt.ap2Key)}</span>
                {selected ? (
                  <span className="nx-onboard-choice-check" aria-hidden>
                    ✓
                  </span>
                ) : null}
              </motion.button>
            );
          })}
        </motion.div>
        <motion.p variants={STAGGER_ITEM} className="nx-onboard-hint">
          {t("onboarding.trackHint")}
        </motion.p>
        <AnimatePresence>
          {pending ? (
            <motion.button
              key="track-continue"
              type="button"
              className="nx-onboard-primary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              whileHover={reduceMotion ? undefined : { scale: 1.02, y: -1 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              onClick={onContinue}
            >
              {t("onboarding.trackContinue")}
            </motion.button>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </OnboardingStepFrame>
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
    <OnboardingStepFrame stepIndex={3}>
      <motion.div variants={STAGGER} initial="hidden" animate="show">
        <motion.h2 variants={STAGGER_ITEM} className="nx-onboard-card-title">
          {t("onboarding.regionTitle")}
        </motion.h2>
        <motion.label variants={STAGGER_ITEM} className="nx-onboard-select-wrap">
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
        </motion.label>
        <motion.p variants={STAGGER_ITEM} className="nx-onboard-hint">
          {t("onboarding.regionHint")}
        </motion.p>
        <motion.button
          variants={STAGGER_ITEM}
          type="button"
          className="nx-onboard-primary"
          whileHover={reduceMotion ? undefined : { scale: 1.02, y: -1 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          onClick={onContinue}
        >
          {t("onboarding.regionCta")}
        </motion.button>
      </motion.div>
    </OnboardingStepFrame>
  );
}

export function OnboardingCodenameStep({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  const valid = value.trim().length >= 1;
  const submit = useCallback(() => {
    if (valid) onSubmit();
  }, [onSubmit, valid]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && valid) submit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submit, valid]);

  return (
    <OnboardingStepFrame stepIndex={5}>
      <motion.div variants={STAGGER} initial="hidden" animate="show">
        <motion.h2 variants={STAGGER_ITEM} className="nx-onboard-card-title">
          {t("profile.codenameTitle")}
        </motion.h2>
        <motion.input
          variants={STAGGER_ITEM}
          className="nx-onboard-input"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 32))}
          placeholder={t("profile.codenamePlaceholder")}
          autoComplete="username"
          autoFocus
          maxLength={32}
        />
        <motion.button
          variants={STAGGER_ITEM}
          type="button"
          className="nx-onboard-primary"
          disabled={!valid}
          whileHover={valid && !reduceMotion ? { scale: 1.02, y: -1 } : undefined}
          whileTap={valid && !reduceMotion ? { scale: 0.98 } : undefined}
          onClick={submit}
        >
          {t("onboarding.codenameCta")}
        </motion.button>
      </motion.div>
    </OnboardingStepFrame>
  );
}

/** Fortschrittsleiste für Avatar-Schritt (Schritt 4) — Inhalt bleibt in NeuralInitializer */
export function OnboardingAvatarProgressShell({ children }: { children: ReactNode }) {
  const { t } = useNexusI18n();
  return (
    <NexusOnboardingLayout
      layout="wide"
      heroKicker={t("onboarding.stepLabelAvatar")}
      heroTitle={t("onboarding.heroAvatarTitle")}
      heroLead={t("onboarding.heroAvatarLead")}
      videoSrc={publicAssetUrl("/assets/LF11GIF.mp4")}
    >
      <div className="nx-onboard-step nx-onboard-step--wide">
        <OnboardingProgress current={4} stepIndex={4} />
        <div className="nx-onboard-card nx-onboard-card--wide">{children}</div>
      </div>
    </NexusOnboardingLayout>
  );
}

export { DEFAULT_BUNDESLAND };
