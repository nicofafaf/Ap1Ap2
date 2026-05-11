import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { LearningField, NexusRegistryEntry } from "../../data/nexusRegistry";
import { getFinalExamLearningBundle, getTerminalLearningBundle } from "../../lib/learning/terminalContent";
import { highlightCode } from "../../lib/learning/codeHighlight";
import { TerminalCodeWorkbench } from "../../lib/learning/terminalCodeWorkbench";
import { InteractiveMissionInput } from "./InteractiveMissionInput";
import { typography } from "../../theme/typography";
import { useGameStore } from "../../store/useGameStore";
import { useNexusI18n } from "../../lib/i18n/I18nProvider";

export type LearningTerminalProps = {
  currentLF: LearningField;
  combatPhase: 1 | 2;
  semantic: NexusRegistryEntry["combatPalette"]["semantic"];
  morphLf?: number | null;
  sectorZero?: boolean;
  visible: boolean;
};

/** Ein onError pro Asset — kein Retry, kein erneutes Setzen von src (verhindert Browser-Spam bei 404) */
function SafeLearningFigure({ src, alt }: { src: string; alt: string }) {
  const errorOnceRef = useRef(false);
  const [failed, setFailed] = useState(false);

  const onError = useCallback(() => {
    if (errorOnceRef.current) return;
    errorOnceRef.current = true;
    setFailed(true);
  }, []);

  if (failed) {
    return (
      <p
        style={{
          margin: "var(--nx-space-16) 0 0",
          padding: "var(--nx-space-16) var(--nx-space-8)",
          fontFamily: typography.fontSans,
          fontSize: "max(15px, 0.95rem)",
          lineHeight: 1.55,
          color: "var(--nx-bone-50)",
          background: "color-mix(in srgb, var(--nx-vantablack) 92%, transparent)",
          borderLeft: "2px solid var(--nx-bone-25)",
        }}
      >
        Abbildung nicht verfügbar Medien Asset fehlt oder Netzwerkfehler kein erneuter Ladevorgang
      </p>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      decoding="async"
      loading="lazy"
      onError={onError}
      draggable={false}
      style={{
        marginTop: "var(--nx-space-16)",
        maxWidth: "100%",
        height: "auto",
        borderRadius: 4,
        display: "block",
      }}
    />
  );
}

export function LearningTerminal({
  currentLF,
  combatPhase,
  semantic,
  morphLf,
  sectorZero,
  visible,
}: LearningTerminalProps) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  const entryToken = useGameStore((s) => s.entryToken);
  const preferredLearningExerciseId = useGameStore((s) => s.preferredLearningExerciseId);
  const sectorZeroMorphToken = useGameStore((s) => s.sectorZeroMorphToken);
  const recordCombatLearningAttempt = useGameStore((s) => s.recordCombatLearningAttempt);
  const triggerBossHit = useGameStore((s) => s.triggerBossHit);
  const markMissionCleared = useGameStore((s) => s.markMissionCleared);
  const setActiveMissionContext = useGameStore((s) => s.setActiveMissionContext);
  const clearActiveMissionContext = useGameStore((s) => s.clearActiveMissionContext);
  const mission = useGameStore((s) => s.mission);
  const archiveWorkbenchSnippet = useGameStore((s) => s.archiveWorkbenchSnippet);
  const [pickedId, setPickedId] = useState<string | null>(null);

  const bundle = useMemo(() => {
    const leitner = useGameStore.getState().learningLeitnerByExerciseId;
    if (sectorZero) {
      const seed = (entryToken ^ (sectorZeroMorphToken * 0x9e3779b9)) >>> 0;
      return getFinalExamLearningBundle(seed, leitner);
    }
    return getTerminalLearningBundle(
      currentLF,
      semantic,
      entryToken,
      leitner,
      preferredLearningExerciseId
    );
  }, [sectorZero, sectorZeroMorphToken, currentLF, semantic, entryToken, preferredLearningExerciseId]);

  const { snippet, exercise, exerciseLf } = bundle;
  const answerLf = exerciseLf ?? currentLF;

  const learningFocus = Boolean(visible && exercise);

  useEffect(() => {
    setPickedId(null);
  }, [entryToken, currentLF, semantic, visible, sectorZero, sectorZeroMorphToken]);

  useEffect(() => {
    if (!learningFocus) {
      document.documentElement.removeAttribute("data-nx-learning-focus");
      return;
    }
    document.documentElement.setAttribute("data-nx-learning-focus", "1");
    return () => {
      document.documentElement.removeAttribute("data-nx-learning-focus");
    };
  }, [learningFocus]);

  useEffect(() => {
    if (!exercise) {
      clearActiveMissionContext();
      return;
    }
    setActiveMissionContext(answerLf, exercise.id);
  }, [exercise?.id, answerLf, clearActiveMissionContext, setActiveMissionContext]);

  const highlighted = useMemo(
    () => highlightCode(snippet.code, snippet.lang),
    [snippet.code, snippet.lang]
  );

  const phaseLabel =
    combatPhase === 2 ? t("learningTerminal.phase2") : t("learningTerminal.phase1");

  const semanticLabel =
    semantic === "HardwareNetworking"
      ? t("learningTerminal.semanticHardware")
      : semantic === "SecurityCryptography"
        ? t("learningTerminal.semanticSecurity")
        : t("learningTerminal.semanticDatabase");

  const crumbLf = sectorZero
    ? exerciseLf
      ? `${t("learningTerminal.sectorZero")} · ${exerciseLf}`
      : morphLf != null
        ? `${t("learningTerminal.sectorZeroMorph")} LF${morphLf}`
        : t("learningTerminal.sectorZero")
    : `${currentLF} · ${semanticLabel}`;

  const interactiveMc = Boolean(exercise);

  const streamEase = [0.22, 1, 0.36, 1] as const;
  const dur = reduceMotion ? 0.01 : 0.44;
  const stagger = reduceMotion ? 0 : 0.055;
  const delayCh = reduceMotion ? 0 : 0.045;

  const streamParent = {
    hidden: { opacity: reduceMotion ? 1 : 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: stagger, delayChildren: delayCh },
    },
  };

  const streamChild = {
    hidden: {
      opacity: reduceMotion ? 1 : 0,
      y: reduceMotion ? 0 : 5,
      filter: reduceMotion ? "none" : "blur(5px)",
    },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: dur, ease: streamEase },
    },
  };

  const streamKey = `${entryToken}-${sectorZero}-${currentLF}-${exercise?.id ?? "x"}-${snippet.code.length}`;

  const ruleStyle = learningFocus
    ? ({
        height: 1,
        width: "100%",
        flexShrink: 0,
        background: "rgba(232, 233, 240, 0.12)",
        alignSelf: "stretch",
      } as const)
    : ({
        height: 1,
        width: "100%",
        flexShrink: 0,
        background: "var(--nx-vantablack)",
        opacity: 0.94,
        alignSelf: "stretch",
      } as const);

  if (!visible) return null;

  return (
    <>
      {learningFocus ? (
        <div
          aria-hidden
          style={{
            position: "fixed",
            inset: 0,
            zIndex: "var(--nx-z-learning-focus-backdrop)",
            pointerEvents: "none",
            background: "rgba(5, 5, 7, 0.86)",
          }}
        />
      ) : null}
      <motion.aside
        data-nx-tutorial="terminal"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        style={{
          position: "absolute",
          ...(learningFocus
            ? {
                left: "50%",
                top: "50%",
                bottom: "auto",
                transform: "translate(-50%, -50%)",
                width: "min(960px, calc(100vw - var(--nx-space-24)))",
                maxHeight: "min(90dvh, 960px)",
                zIndex: "var(--nx-z-learning-focus-panel)",
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
              }
            : {
                left: "50%",
                bottom: "calc(224px + env(safe-area-inset-bottom, 0px))",
                transform: "translateX(-50%)",
                zIndex: 45,
                width: "min(720px, calc(100vw - var(--nx-space-32)))",
              }),
          pointerEvents: interactiveMc ? "auto" : "none",
        }}
      >
        <div
          style={{
            borderRadius: learningFocus ? 6 : 16,
            padding: learningFocus
              ? "var(--nx-space-32) var(--nx-space-32)"
              : "var(--nx-space-24) var(--nx-space-32)",
            background: learningFocus ? "var(--nx-vantablack)" : "var(--nx-panel-frost)",
            border: learningFocus
              ? "1px solid rgba(232, 233, 240, 0.16)"
              : "1px solid var(--nx-border-readable)",
            boxShadow: learningFocus
              ? "0 0 0 1px rgba(0,0,0,0.4), 0 var(--nx-space-64) 120px rgba(0,0,0,0.55)"
              : "0 var(--nx-space-24) var(--nx-space-64) var(--nx-shadow-deep), inset 0 1px 0 var(--nx-bone-25)",
          }}
        >
          <motion.div
            key={streamKey}
            variants={streamParent}
            initial="hidden"
            animate="show"
            style={{ display: "flex", flexDirection: "column", gap: 0 }}
          >
            {!learningFocus ? (
              <motion.nav
                variants={streamChild}
                aria-label={t("learningTerminal.ariaLearningPath")}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "var(--nx-space-8)",
                  fontFamily: typography.fontSans,
                  fontSize: "max(12px, 0.75rem)",
                  fontWeight: 100,
                  letterSpacing: "0.02em",
                  color: typography.fgMuted,
                  paddingBottom: "var(--nx-space-8)",
                }}
              >
                <span style={{ color: typography.fg }}>Lernfeld</span>
                <span aria-hidden style={{ color: typography.fgTertiary }}>
                  /
                </span>
                <span style={{ color: typography.fg }}>{crumbLf}</span>
                <span aria-hidden style={{ color: typography.fgTertiary }}>
                  /
                </span>
                <span style={{ color: typography.fgMuted }}>{phaseLabel}</span>
              </motion.nav>
            ) : null}

            {!learningFocus ? <motion.div variants={streamChild} aria-hidden style={ruleStyle} /> : null}

            {exercise ? (
              <>
                <motion.div
                  variants={streamChild}
                  style={{
                    padding: learningFocus ? "0 0 var(--nx-space-8)" : "var(--nx-space-8) 0",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                  }}
                >
                  <div
                    style={{
                      marginBottom: "var(--nx-space-8)",
                      fontFamily: typography.fontSans,
                      fontSize: "max(11px, 0.7rem)",
                      fontWeight: 100,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--nx-bone-50)",
                    }}
                  >
                    Mission {exercise.id} Status {mission.status}
                  </div>
                  <h2
                    style={{
                      margin: 0,
                      fontFamily: typography.fontSans,
                      fontSize: learningFocus
                        ? "clamp(13px, 2vw, 15px)"
                        : "clamp(17px, 2.4vw, 20px)",
                      fontWeight: learningFocus ? 500 : typography.headingWeight,
                      letterSpacing: learningFocus ? "0.14em" : undefined,
                      textTransform: learningFocus ? "uppercase" : undefined,
                      lineHeight: 1.35,
                      color: learningFocus ? "var(--nx-bone-50)" : typography.fg,
                    }}
                  >
                    {exercise.title}
                  </h2>
                  <p
                    style={{
                      margin: "var(--nx-space-16) 0 0",
                      fontFamily: typography.fontSans,
                      fontSize: learningFocus
                        ? "clamp(1.05rem, 2.5vw, 1.35rem)"
                        : typography.bodySize,
                      lineHeight: learningFocus ? 1.55 : typography.bodyLineHeight,
                      color: learningFocus ? "var(--nx-bone-50)" : typography.fgMuted,
                    }}
                  >
                    {exercise.problem}
                  </p>
                  {exercise.illustrationSrc ? (
                    <SafeLearningFigure src={exercise.illustrationSrc} alt="" />
                  ) : null}
                </motion.div>

                <motion.div variants={streamChild} aria-hidden style={ruleStyle} />

                {learningFocus && (exercise.lang === "sql" || exercise.lang === "csharp") ? (
                  <motion.div
                    variants={streamChild}
                    style={{
                      padding: "var(--nx-space-8) 0",
                      display: "flex",
                      flexDirection: "column",
                      gap: 0,
                    }}
                  >
                    <TerminalCodeWorkbench
                      lang={exercise.lang}
                      reference={exercise.solutionCode}
                      milestoneId={exercise.id}
                      onSuccess={() => markMissionCleared(exercise.id)}
                      initialDraft={
                        archiveWorkbenchSnippet &&
                        archiveWorkbenchSnippet.lf === answerLf &&
                        archiveWorkbenchSnippet.lang === exercise.lang
                          ? archiveWorkbenchSnippet.code
                          : undefined
                      }
                      initialToken={archiveWorkbenchSnippet?.updatedAt}
                    />
                  </motion.div>
                ) : null}

                {learningFocus && exercise.lang !== "sql" && exercise.lang !== "csharp" ? (
                  <motion.div
                    variants={streamChild}
                    style={{ padding: "var(--nx-space-8) 0", display: "flex", flexDirection: "column", gap: 0 }}
                  >
                    <InteractiveMissionInput
                      expected={exercise.solutionCode}
                      onSuccess={() => {
                        markMissionCleared(exercise.id);
                        triggerBossHit(12);
                      }}
                    />
                  </motion.div>
                ) : null}

                {learningFocus ? (
                  <motion.div variants={streamChild} aria-hidden style={ruleStyle} />
                ) : null}

                <motion.div
                  variants={streamChild}
                  style={{
                    padding: learningFocus ? "var(--nx-space-8) 0" : "var(--nx-space-8) 0",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontFamily: typography.fontSans,
                      fontSize: learningFocus
                        ? "clamp(1.35rem, 4.5vw, 2.2rem)"
                        : "max(13px, 0.82rem)",
                      fontWeight: learningFocus ? 650 : 650,
                      lineHeight: learningFocus ? 1.22 : 1.4,
                      letterSpacing: learningFocus ? "-0.02em" : undefined,
                      color: "var(--nx-bone-90)",
                    }}
                  >
                    {exercise.mcQuestion}
                  </p>
                </motion.div>

                <motion.div variants={streamChild} aria-hidden style={ruleStyle} />

                <motion.div
                  role="group"
                  aria-label={t("learningTerminal.ariaMc")}
                  variants={streamChild}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                    padding: learningFocus ? "var(--nx-space-8) 0 0" : "var(--nx-space-8) 0",
                  }}
                >
                  {exercise.mcOptions.map((opt, optIdx) => {
                    const showFeedback = pickedId === opt.id;
                    const isLast = optIdx === exercise.mcOptions.length - 1;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setPickedId(opt.id);
                          recordCombatLearningAttempt({
                            lf: answerLf,
                            exerciseId: exercise.id,
                            title: exercise.title,
                            problem: exercise.problem,
                            mcQuestion: exercise.mcQuestion,
                            selectedOptionId: opt.id,
                            wasCorrect: opt.isCorrect,
                          });
                        }}
                        style={{
                          textAlign: "left",
                          width: "100%",
                          border: "none",
                          borderRadius: 0,
                          borderBottom: isLast
                            ? "none"
                            : "1px solid rgba(232, 233, 240, 0.14)",
                          background: showFeedback
                            ? opt.isCorrect
                              ? "rgba(255, 214, 165, 0.07)"
                              : "rgba(248, 113, 113, 0.05)"
                            : "transparent",
                          padding: learningFocus
                            ? "var(--nx-space-24) 0"
                            : "var(--nx-space-8) var(--nx-space-16)",
                          cursor: "pointer",
                          fontFamily: typography.fontSans,
                          fontSize: learningFocus
                            ? "clamp(1.08rem, 2.8vw, 1.42rem)"
                            : typography.bodySize,
                          lineHeight: 1.45,
                          color: "var(--nx-bone-90)",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            marginRight: "var(--nx-space-16)",
                            color: "var(--nx-bone-50)",
                          }}
                        >
                          {opt.id.toUpperCase()}
                        </span>
                        {opt.text}
                        {showFeedback && !opt.isCorrect && opt.whyWrongHint ? (
                          <div
                            style={{
                              marginTop: "var(--nx-space-16)",
                              fontSize: "max(14px, 0.88rem)",
                              lineHeight: 1.5,
                              color: "var(--nx-bone-90)",
                            }}
                          >
                            Hinweis {opt.whyWrongHint}
                          </div>
                        ) : null}
                        {showFeedback && opt.isCorrect ? (
                          <div
                            style={{
                              marginTop: "var(--nx-space-16)",
                              fontSize: "max(14px, 0.88rem)",
                              color: "var(--nx-bone-90)",
                            }}
                          >
                            Passt weiter mit den Skill Karten unten
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </motion.div>
              </>
            ) : (
              <>
                <motion.div
                  variants={streamChild}
                  style={{ padding: "var(--nx-space-8) 0", display: "flex", flexDirection: "column", gap: 0 }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontFamily: typography.fontSans,
                      fontSize: "clamp(17px, 2.4vw, 20px)",
                      fontWeight: typography.headingWeight,
                      lineHeight: 1.35,
                      color: typography.fg,
                    }}
                  >
                    Ordne die passende Fähigkeit der aktuellen Bedrohung zu
                  </h2>
                  <p
                    style={{
                      margin: "var(--nx-space-8) 0 0",
                      fontFamily: typography.fontSans,
                      fontSize: typography.bodySize,
                      lineHeight: typography.bodyLineHeight,
                      color: typography.fgMuted,
                    }}
                  >
                    Nutze die Karten unten wie Antwortoptionen — richtige Karte = dein Angriff, Fehlwahl =
                    Konter des Titans
                  </p>
                </motion.div>
              </>
            )}

            {(pickedId != null || !exercise) && (
              <>
                <motion.div variants={streamChild} aria-hidden style={ruleStyle} />
                <motion.div
                  variants={streamChild}
                  style={{ padding: "var(--nx-space-8) 0", display: "flex", flexDirection: "column", gap: 0 }}
                >
                  <div
                    style={{
                      fontFamily: typography.fontSans,
                      fontSize: "max(11px, 0.7rem)",
                      fontWeight: 100,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: learningFocus ? "var(--nx-bone-50)" : typography.fgMuted,
                      paddingBottom: "var(--nx-space-8)",
                    }}
                  >
                    {exercise ? "Musterlösung (JetBrains Mono)" : snippet.caption}
                  </div>
                  <pre
                    className="nx-code-block"
                    style={{
                      margin: 0,
                      padding: "var(--nx-space-16)",
                      borderRadius: 8,
                      background: learningFocus
                        ? "rgba(8, 9, 12, 0.95)"
                        : "color-mix(in srgb, var(--nx-vantablack) 88%, transparent)",
                      border: learningFocus
                        ? "1px solid rgba(232, 233, 240, 0.1)"
                        : "1px solid var(--nx-border-readable)",
                      overflowX: "auto",
                      maxHeight: learningFocus ? "min(22vh, 200px)" : "min(28vh, 224px)",
                      overflowY: "auto",
                      fontFamily: "var(--nx-font-mono, JetBrains Mono, monospace)",
                    }}
                  >
                    <code>{highlighted}</code>
                  </pre>
                </motion.div>
              </>
            )}

            {!learningFocus ? (
              <>
                <motion.div variants={streamChild} aria-hidden style={ruleStyle} />
                <motion.div
                  variants={streamChild}
                  style={{
                    paddingTop: "var(--nx-space-8)",
                    fontFamily: typography.fontSans,
                    fontSize: "max(12px, 0.75rem)",
                    fontWeight: 100,
                    letterSpacing: "0.06em",
                    color: typography.fgMuted,
                    textTransform: "uppercase",
                  }}
                >
                  Antwortoptionen — Skill-Karten unten
                </motion.div>
              </>
            ) : pickedId != null ? (
              <>
                <motion.div variants={streamChild} aria-hidden style={ruleStyle} />
                <motion.div
                  variants={streamChild}
                  style={{
                    paddingTop: "var(--nx-space-8)",
                    fontFamily: typography.fontSans,
                    fontSize: "max(11px, 0.72rem)",
                    fontWeight: 100,
                    letterSpacing: "0.1em",
                    color: "var(--nx-bone-50)",
                    textTransform: "uppercase",
                  }}
                >
                  Skill-Karten unten — weiter im Kampf
                </motion.div>
              </>
            ) : null}
          </motion.div>
        </div>
      </motion.aside>
    </>
  );
}

export default LearningTerminal;
