import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import type { LearningField } from "../../data/nexusRegistry";
import { INITIAL_SKILL_SCAN_QUESTIONS } from "../../lib/learning/initialSkillScanQuestions";
import { MentorPortrait } from "../ui/MentorPortrait";

export type InitialScanProps = {
  mentorAvatarId: number;
  onComplete: (byLf: Partial<Record<LearningField, boolean>>) => void;
  title: string;
  subtitle: string;
  ctaLabel: string;
  nextLabel: string;
};

export function InitialScan({
  mentorAvatarId,
  onComplete,
  title,
  subtitle,
  ctaLabel,
  nextLabel,
}: InitialScanProps) {
  const [step, setStep] = useState(0);
  const [pickedByLf, setPickedByLf] = useState<Partial<Record<LearningField, string>>>({});

  const block = INITIAL_SKILL_SCAN_QUESTIONS[step];
  const lf = block.lf;
  const pick = pickedByLf[lf];
  const canAdvance = Boolean(pick);
  const isLast = step >= INITIAL_SKILL_SCAN_QUESTIONS.length - 1;

  const scoreMap = useCallback((): Partial<Record<LearningField, boolean>> => {
    const out: Partial<Record<LearningField, boolean>> = {};
    for (const b of INITIAL_SKILL_SCAN_QUESTIONS) {
      const id = pickedByLf[b.lf];
      const opt = b.options.find((o) => o.id === id);
      out[b.lf] = Boolean(opt?.isCorrect);
    }
    return out;
  }, [pickedByLf]);

  const setPick = useCallback((optionId: string) => {
    setPickedByLf((prev) => ({ ...prev, [lf]: optionId }));
  }, [lf]);

  const goNext = useCallback(() => {
    if (!canAdvance) return;
    if (isLast) {
      onComplete(scoreMap());
      return;
    }
    setStep((s) => s + 1);
  }, [canAdvance, isLast, onComplete, scoreMap]);

  const progressLine = useMemo(
    () => `${step + 1} / ${INITIAL_SKILL_SCAN_QUESTIONS.length}`,
    [step]
  );

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
        background: "rgba(4, 8, 7, 0.78)",
        backdropFilter: "blur(22px) saturate(118%)",
        WebkitBackdropFilter: "blur(22px) saturate(118%)",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          width: "min(1040px, 100%)",
          display: "flex",
          flexWrap: "wrap",
          gap: "clamp(20px, 3vw, 36px)",
          alignItems: "stretch",
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 28 }}
          style={{
            flex: "1 1 220px",
            maxWidth: 280,
            borderRadius: 28,
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
              size={160}
              radius={24}
              border="2px solid rgba(212, 175, 55, 0.45)"
              boxShadow="0 0 32px rgba(214, 181, 111, 0.22)"
            />
            <p
              id="initial-scan-title"
              style={{
                margin: 0,
                fontFamily: "var(--nx-font-mono)",
                fontSize: 24,
                fontWeight: 750,
                letterSpacing: ".08em",
                color: "rgba(251,247,239,0.88)",
                textTransform: "uppercase",
                textAlign: "center",
              }}
            >
              {title}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 24,
                lineHeight: 1.45,
                fontWeight: 500,
                color: "rgba(251,247,239,0.72)",
                textAlign: "center",
              }}
            >
              {subtitle}
            </p>
        </motion.div>

        <div
          style={{
            flex: "3 1 320px",
            borderRadius: 28,
            border: "1px solid rgba(251,247,239,0.14)",
            background: "rgba(10, 16, 14, 0.72)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
            padding: "clamp(22px, 3vw, 36px)",
            minHeight: 320,
          }}
        >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: 16,
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--nx-font-mono)",
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: ".06em",
                  color: "rgba(214, 181, 111, 0.92)",
                }}
              >
                {lf}
              </span>
              <span style={{ fontFamily: "var(--nx-font-mono)", fontSize: 24, color: "rgba(251,247,239,0.55)" }}>
                {progressLine}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -22 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontFamily: "var(--nx-font-sans)",
                    fontSize: 48,
                    fontWeight: 200,
                    lineHeight: 1.08,
                    letterSpacing: "-0.04em",
                    color: "rgba(251,247,239,0.96)",
                  }}
                >
                  {block.question}
                </h2>
                <div
                  style={{
                    marginTop: 24,
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  }}
                >
                  {block.options.map((opt) => {
                    const active = pick === opt.id;
                    return (
                      <motion.button
                        key={opt.id}
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setPick(opt.id)}
                        style={{
                          minHeight: 56,
                          borderRadius: 16,
                          border: active
                            ? "2px solid rgba(214, 181, 111, 0.75)"
                            : "1px solid rgba(251,247,239,0.14)",
                          background: active ? "rgba(214, 181, 111, 0.14)" : "rgba(255,255,255,0.04)",
                          color: "rgba(251,247,239,0.94)",
                          fontSize: 24,
                          lineHeight: 1.35,
                          fontWeight: 600,
                          textAlign: "left",
                          padding: "14px 16px",
                          cursor: "pointer",
                          backdropFilter: "blur(10px)",
                        }}
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
              disabled={!canAdvance}
              whileHover={canAdvance ? { scale: 1.02 } : undefined}
              whileTap={canAdvance ? { scale: 0.98 } : undefined}
              onClick={goNext}
              style={{
                marginTop: 28,
                width: "100%",
                borderRadius: 999,
                border: "1px solid rgba(214, 181, 111, 0.35)",
                background: canAdvance
                  ? "linear-gradient(125deg, rgba(214,181,111,0.35) 0%, rgba(24,37,28,0.95) 48%, rgba(8,12,10,0.98) 100%)"
                  : "rgba(255,255,255,0.06)",
                color: canAdvance ? "rgba(251,247,239,0.96)" : "rgba(251,247,239,0.35)",
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: ".04em",
                padding: "16px 22px",
                cursor: canAdvance ? "pointer" : "not-allowed",
              }}
            >
              {isLast ? ctaLabel : nextLabel}
            </motion.button>
          </div>
        </div>
    </motion.div>
  );
}

export default InitialScan;
