import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import type { LearningField } from "../../data/nexusRegistry";
import {
  INITIAL_SKILL_SCAN_QUESTIONS,
  type InitialSkillScanOption,
} from "../../lib/learning/initialSkillScanQuestions";
import { shuffleScanOptions } from "../../lib/learning/shuffleScanOptions";
import { useNexusI18n } from "../../lib/i18n/I18nProvider";
import { SkillRadar } from "../navigation/SkillRadar";
import { MentorPortrait } from "../ui/MentorPortrait";

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

  return (
    <motion.div
      key="initial-scan-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="initial-scan-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 2,
        display: "grid",
        placeItems: "center",
        padding: "clamp(16px, 4vw, 48px)",
        background: "rgba(4, 8, 7, 0.82)",
        backdropFilter: "blur(22px) saturate(118%)",
        WebkitBackdropFilter: "blur(22px) saturate(118%)",
        pointerEvents: "auto",
      }}
    >
      <motion.div
        style={{
          width: "min(1120px, 100%)",
          display: "flex",
          flexWrap: "wrap",
          gap: "clamp(20px, 3vw, 32px)",
          alignItems: "stretch",
        }}
      >
        <motion.aside
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 28 }}
          style={{
            flex: "1 1 220px",
            maxWidth: 280,
            borderRadius: 24,
            border: "1px solid rgba(214, 181, 111, 0.28)",
            background: "linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(8,14,12,0.55) 100%)",
            boxShadow: "inset 0 1px 0 rgba(251,247,239,0.12), 0 28px 80px rgba(0,0,0,0.45)",
            padding: "clamp(18px, 2.5vw, 28px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <MentorPortrait
            mentorId={mentorAvatarId}
            variant="idle"
            size={140}
            radius={22}
            border="2px solid rgba(212, 175, 55, 0.45)"
            boxShadow="0 0 32px rgba(214, 181, 111, 0.22)"
          />
          <p
            id="initial-scan-title"
            style={{
              margin: 0,
              fontFamily: "var(--nx-font-mono)",
              fontSize: 22,
              fontWeight: 750,
              letterSpacing: ".08em",
              color: "rgba(251,247,239,0.88)",
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            {phase === "summary" ? t("scan.summaryTitle") : title}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 17,
              lineHeight: 1.45,
              fontWeight: 500,
              color: "rgba(251,247,239,0.72)",
              textAlign: "center",
            }}
          >
            {phase === "summary" ? t("scan.summaryLead") : subtitle}
          </p>
        </motion.aside>

        <motion.div
          style={{
            flex: "3 1 320px",
            borderRadius: 24,
            border: "1px solid rgba(251,247,239,0.14)",
            background: "rgba(10, 16, 14, 0.78)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
            padding: "clamp(22px, 3vw, 32px)",
            minHeight: 360,
          }}
        >
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
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                onClick={finishScan}
                style={primaryBtnStyle(true)}
              >
                {ctaLabel}
              </motion.button>
            </motion.div>
          ) : (
            <>
              <motion.div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 16,
                  marginBottom: 18,
                }}
              >
                <span style={lfBadgeStyle}>{lf}</span>
                <span style={progressStyle}>{progressLine}</span>
              </motion.div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h2 style={questionStyle}>{block.question}</h2>

                  {revealed ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        marginBottom: 14,
                        padding: "12px 14px",
                        borderRadius: 12,
                        border: `1px solid ${wasCorrect ? "rgba(52, 211, 153, 0.45)" : "rgba(248, 113, 113, 0.45)"}`,
                        background: wasCorrect ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.1)",
                        color: wasCorrect ? "rgba(167, 243, 208, 0.98)" : "rgba(254, 202, 202, 0.98)",
                        fontFamily: "var(--nx-font-sans)",
                        fontSize: 17,
                        fontWeight: 700,
                      }}
                    >
                      {wasCorrect ? t("scan.feedbackCorrect") : t("scan.feedbackWrong")}
                      {!wasCorrect && correctOption ? (
                        <span style={{ display: "block", marginTop: 6, fontWeight: 550, opacity: 0.92 }}>
                          {t("scan.feedbackSolution")} {correctOption.text}
                        </span>
                      ) : null}
                    </motion.div>
                  ) : null}

                  <motion.div style={optionsGridStyle}>
                    {shuffledOptions.map((opt) => {
                      const active = pick === opt.id;
                      const showCorrect = revealed && opt.isCorrect;
                      const showWrong = revealed && active && !opt.isCorrect;
                      return (
                        <motion.button
                          key={opt.id}
                          type="button"
                          disabled={revealed}
                          whileHover={revealed ? undefined : { scale: 1.01 }}
                          whileTap={revealed ? undefined : { scale: 0.99 }}
                          onClick={() => setPick(opt.id)}
                          style={{
                            minHeight: 56,
                            borderRadius: 14,
                            border: showCorrect
                              ? "2px solid rgba(52, 211, 153, 0.75)"
                              : showWrong
                                ? "2px solid rgba(248, 113, 113, 0.75)"
                                : active
                                  ? "2px solid rgba(214, 181, 111, 0.75)"
                                  : "1px solid rgba(251,247,239,0.14)",
                            background: showCorrect
                              ? "rgba(16, 185, 129, 0.16)"
                              : showWrong
                                ? "rgba(239, 68, 68, 0.14)"
                                : active
                                  ? "rgba(214, 181, 111, 0.14)"
                                  : "rgba(255,255,255,0.04)",
                            color: "rgba(251,247,239,0.94)",
                            fontSize: 17,
                            lineHeight: 1.35,
                            fontWeight: 600,
                            textAlign: "left",
                            padding: "14px 16px",
                            cursor: revealed ? "default" : "pointer",
                          }}
                        >
                          {opt.text}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                </motion.div>
              </AnimatePresence>

              <motion.button
                type="button"
                disabled={!revealed}
                whileHover={revealed && !reduceMotion ? { scale: 1.02 } : undefined}
                whileTap={revealed && !reduceMotion ? { scale: 0.98 } : undefined}
                onClick={goNext}
                style={primaryBtnStyle(revealed)}
              >
                {isLast && revealed ? t("scan.showResults") : nextLabel}
              </motion.button>
            </>
          )}
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
  const accent = tone === "ok" ? "rgba(52, 211, 153, 0.9)" : "rgba(248, 113, 113, 0.9)";
  return (
    <div
      style={{
        borderRadius: 14,
        border: `1px solid ${tone === "ok" ? "rgba(52, 211, 153, 0.35)" : "rgba(248, 113, 113, 0.35)"}`,
        background: "rgba(0,0,0,0.22)",
        padding: "14px 16px",
      }}
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
          <li style={{ color: "rgba(251,247,239,0.5)", fontSize: 15 }}>—</li>
        ) : (
          items.map((lf) => (
            <li
              key={lf}
              style={{
                fontFamily: "var(--nx-font-sans)",
                fontSize: 15,
                fontWeight: 650,
                color: "rgba(251,247,239,0.9)",
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

function primaryBtnStyle(enabled: boolean): CSSProperties {
  return {
    marginTop: 8,
    width: "100%",
    borderRadius: 999,
    border: "1px solid rgba(214, 181, 111, 0.35)",
    background: enabled
      ? "linear-gradient(125deg, rgba(214,181,111,0.35) 0%, rgba(24,37,28,0.95) 48%, rgba(8,12,10,0.98) 100%)"
      : "rgba(255,255,255,0.06)",
    color: enabled ? "rgba(251,247,239,0.96)" : "rgba(251,247,239,0.35)",
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: ".04em",
    padding: "14px 22px",
    cursor: enabled ? "pointer" : "not-allowed",
  };
}

const lfBadgeStyle: React.CSSProperties = {
  fontFamily: "var(--nx-font-mono)",
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: ".06em",
  color: "rgba(214, 181, 111, 0.92)",
};

const progressStyle: React.CSSProperties = {
  fontFamily: "var(--nx-font-mono)",
  fontSize: 18,
  color: "rgba(251,247,239,0.55)",
};

const questionStyle: React.CSSProperties = {
  margin: "0 0 18px",
  fontFamily: "var(--nx-font-sans)",
  fontSize: "clamp(26px, 3.2vw, 36px)",
  fontWeight: 700,
  lineHeight: 1.12,
  letterSpacing: "-0.03em",
  color: "rgba(251,247,239,0.96)",
};

const optionsGridStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
};

export default InitialScan;
