import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { LearningField } from "../../data/nexusRegistry";
import {
  INITIAL_SKILL_SCAN_QUESTIONS,
  type InitialSkillScanOption,
} from "../../lib/learning/initialSkillScanQuestions";
import { shuffleScanOptions } from "../../lib/learning/shuffleScanOptions";
import { publicAssetUrl } from "../../data/nexusRegistry";
import { useNexusI18n } from "../../lib/i18n/I18nProvider";
import { SkillRadar } from "../navigation/SkillRadar";
import { NexusCinematicShell } from "../ui/NexusCinematicShell";
import { MentorPortrait } from "../ui/MentorPortrait";
import "./initialScan.css";

export type InitialScanProps = {
  mentorAvatarId: number;
  onComplete: (byLf: Partial<Record<LearningField, boolean>>) => void;
  title: string;
  subtitle: string;
  ctaLabel: string;
  nextLabel: string;
};

type ScanPhase = "question" | "summary";

const LF_TITLES: Record<LearningField, string> = {
  LF1: "Wirtschaft & Recht",
  LF2: "IT-Systeme",
  LF3: "Netzwerke",
  LF4: "Hardware",
  LF5: "Datenbanken",
  LF6: "Skripte",
  LF7: "OOP",
  LF8: "Datenmodelle",
  LF9: "Schnittstellen",
  LF10: "Projektmanagement",
  LF11: "Security",
  LF12: "Projekt",
};

export function InitialScan({
  mentorAvatarId,
  onComplete,
  title,
  subtitle,
  ctaLabel,
  nextLabel,
}: InitialScanProps) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<ScanPhase>("question");
  const [step, setStep] = useState(0);
  const [pickedByLf, setPickedByLf] = useState<Partial<Record<LearningField, string>>>({});
  const [revealed, setRevealed] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<InitialSkillScanOption[]>([]);

  const block = INITIAL_SKILL_SCAN_QUESTIONS[step];
  const lf = block.lf;
  const pick = pickedByLf[lf];
  const isLast = step >= INITIAL_SKILL_SCAN_QUESTIONS.length - 1;

  useEffect(() => {
    setShuffledOptions(shuffleScanOptions([...block.options]));
    setRevealed(false);
  }, [step, block.options]);

  const pickedOption = useMemo(
    () => shuffledOptions.find((o) => o.id === pick),
    [pick, shuffledOptions]
  );
  const correctOption = useMemo(
    () => shuffledOptions.find((o) => o.isCorrect),
    [shuffledOptions]
  );
  const wasCorrect = Boolean(pickedOption?.isCorrect);

  const scoreMap = useCallback((): Partial<Record<LearningField, boolean>> => {
    const out: Partial<Record<LearningField, boolean>> = {};
    for (const b of INITIAL_SKILL_SCAN_QUESTIONS) {
      const id = pickedByLf[b.lf];
      const opt = b.options.find((o) => o.id === id);
      out[b.lf] = Boolean(opt?.isCorrect);
    }
    return out;
  }, [pickedByLf]);

  const { strengths, weaknesses } = useMemo(() => {
    const scores = scoreMap();
    const strong: LearningField[] = [];
    const weak: LearningField[] = [];
    for (const b of INITIAL_SKILL_SCAN_QUESTIONS) {
      if (scores[b.lf]) strong.push(b.lf);
      else weak.push(b.lf);
    }
    return { strengths: strong, weaknesses: weak };
  }, [scoreMap]);

  const setPick = useCallback(
    (optionId: string) => {
      if (revealed) return;
      setPickedByLf((prev) => ({ ...prev, [lf]: optionId }));
      setRevealed(true);
    },
    [lf, revealed]
  );

  const goNext = useCallback(() => {
    if (!revealed) return;
    if (isLast) {
      setPhase("summary");
      return;
    }
    setStep((s) => s + 1);
  }, [isLast, revealed]);

  const finishScan = useCallback(() => {
    onComplete(scoreMap());
  }, [onComplete, scoreMap]);

  const progressLine = `${step + 1} / ${INITIAL_SKILL_SCAN_QUESTIONS.length}`;
  const lfNum = Number.parseInt(lf.replace("LF", ""), 10);

  return (
    <motion.div
      key="initial-scan-root"
      className="nx-initial-scan"
      role="dialog"
      aria-modal="true"
      aria-labelledby="initial-scan-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
    >
      <motion.div className="nx-initial-scan-layout">
        <motion.aside
          className="nx-initial-scan-aside"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 28 }}
        >
          <MentorPortrait
            mentorId={mentorAvatarId}
            variant="idle"
            size={120}
            radius={20}
            border="2px solid rgba(214, 181, 111, 0.45)"
            boxShadow="0 0 24px rgba(214, 181, 111, 0.18)"
          />
          <p id="initial-scan-title" className="nx-initial-scan-aside-title">
            {phase === "summary" ? t("scan.summaryTitle") : title}
          </p>
          <p className="nx-initial-scan-aside-lead">
            {phase === "summary" ? t("scan.summaryLead") : subtitle}
          </p>
        </motion.aside>

        <motion.div className="nx-initial-scan-panel">
          {phase === "question" ? (
            <div className="nx-initial-scan-cinematic">
              <NexusCinematicShell
                variant="strip"
                videoSrc={publicAssetUrl(`/assets/LF${lfNum}GIF.mp4`)}
                kicker={lf}
                title={LF_TITLES[lf]}
                lead={progressLine}
              />
            </div>
          ) : null}
          <div className="nx-initial-scan-panel-inner">
          {phase === "summary" ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
            >
              <div style={{ marginBottom: 20 }}>
                <SkillRadar layoutVariant="compact" scanPreview={scoreMap()} />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 14,
                  marginBottom: 22,
                }}
              >
                <StrengthPanel
                  title={t("scan.strengthsTitle")}
                  items={strengths}
                  tone="ok"
                />
                <StrengthPanel
                  title={t("scan.weaknessesTitle")}
                  items={weaknesses}
                  tone="weak"
                />
              </div>

              <motion.button
                type="button"
                className="nx-initial-scan-primary"
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                onClick={finishScan}
              >
                {ctaLabel}
              </motion.button>
            </motion.div>
          ) : (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h2 className="nx-initial-scan-question">{block.question}</h2>

                  {revealed ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`nx-initial-scan-feedback${wasCorrect ? " nx-initial-scan-feedback--ok" : " nx-initial-scan-feedback--miss"}`}
                    >
                      {wasCorrect ? t("scan.feedbackCorrect") : t("scan.feedbackWrong")}
                      {!wasCorrect && correctOption ? (
                        <span style={{ display: "block", marginTop: 6, fontWeight: 550 }}>
                          {t("scan.feedbackSolution")} {correctOption.text}
                        </span>
                      ) : null}
                    </motion.div>
                  ) : null}

                  <div className="nx-initial-scan-options">
                    {shuffledOptions.map((opt) => {
                      const active = pick === opt.id;
                      const showCorrect = revealed && opt.isCorrect;
                      const showWrong = revealed && active && !opt.isCorrect;
                      return (
                        <motion.button
                          key={opt.id}
                          type="button"
                          disabled={revealed}
                          className={`nx-initial-scan-option${active ? " is-active" : ""}${showCorrect ? " is-correct" : ""}${showWrong ? " is-wrong" : ""}`}
                          whileHover={revealed ? undefined : { scale: 1.01 }}
                          whileTap={revealed ? undefined : { scale: 0.99 }}
                          onClick={() => setPick(opt.id)}
                        >
                          {opt.text}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>

              <motion.button
                type="button"
                className="nx-initial-scan-primary"
                disabled={!revealed}
                whileHover={revealed && !reduceMotion ? { scale: 1.02 } : undefined}
                whileTap={revealed && !reduceMotion ? { scale: 0.98 } : undefined}
                onClick={goNext}
              >
                {isLast && revealed ? t("scan.showResults") : nextLabel}
              </motion.button>
            </>
          )}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function StrengthPanel({
  title,
  items,
  tone,
}: {
  title: string;
  items: LearningField[];
  tone: "ok" | "weak";
}) {
  const accent = tone === "ok" ? "#047857" : "#b45309";
  return (
    <div
      className={`nx-initial-scan-strength-panel${tone === "ok" ? " nx-initial-scan-strength-panel--ok" : " nx-initial-scan-strength-panel--weak"}`}
    >
      <div
        style={{
          fontFamily: "var(--nx-font-mono)",
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: accent,
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
        {items.length === 0 ? (
          <li style={{ color: "#94a3b8", fontSize: 15 }}>—</li>
        ) : (
          items.map((lf) => (
            <li
              key={lf}
              style={{
                fontFamily: "var(--nx-font-sans)",
                fontSize: 15,
                fontWeight: 650,
                color: "#0f172a",
              }}
            >
              {lf} · {LF_TITLES[lf]}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default InitialScan;
