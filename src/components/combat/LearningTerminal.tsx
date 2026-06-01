import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { motion, useAnimation, useReducedMotion } from "framer-motion";
import type { LearningField, NexusRegistryEntry } from "../../data/nexusRegistry";
import { getFinalExamLearningBundle, getTerminalLearningBundle } from "../../lib/learning/terminalContent";
import { highlightCode } from "../../lib/learning/codeHighlight";
import { TerminalCodeWorkbench } from "../../lib/learning/terminalCodeWorkbench";
import { InteractiveMissionInput } from "./InteractiveMissionInput";
import { NetplanVisualizer, resolveLf10Netplan } from "./NetplanVisualizer";
import { typography } from "../../theme/typography";
import { useGameStore } from "../../store/useGameStore";
import { useNexusI18n } from "../../lib/i18n/I18nProvider";
import type { LearningMcOption } from "../../lib/learning/learningExerciseTypes";
import { resolveTerminalBossMode } from "../../lib/learning/learningRegistry";
import { useBossAudioEngine } from "../../lib/audio/bossAudioEngine";
import { MentorPortrait } from "../ui/MentorPortrait";
import { EdtechExamTimerBar } from "../navigation/edtech/EdtechExamTimerBar";
import { EdtechLearningSession } from "../navigation/edtech/EdtechLearningSession";
import {
  formatLearningDisplayText,
  friendlyMissionTitle,
  mergeLessonCardsForEdtech,
  sanitizeEdtechLearningText,
} from "../../lib/learning/edtechLfDisplay";
import { BEGINNER_EXERCISE_IDS_BY_LF } from "../../lib/learning/learningRegistry";

export type LearningTerminalProps = {
  currentLF: LearningField;
  combatPhase: 1 | 2;
  semantic: NexusRegistryEntry["combatPalette"]["semantic"];
  morphLf?: number | null;
  sectorZero?: boolean;
  visible: boolean;
};

type McRowVariant = "focusPanel" | "ambientPanel";

function LearningMcOptionRow({
  opt,
  optIdx,
  totalOpts,
  pickedId,
  isBeginnerExercise,
  variant,
  onPick,
  t,
  hitMessageOverride,
  examStrict,
  sanitizeOptionText,
}: {
  opt: LearningMcOption;
  optIdx: number;
  totalOpts: number;
  pickedId: string | null;
  isBeginnerExercise: boolean;
  variant: McRowVariant;
  onPick: (opt: LearningMcOption) => void;
  t: (key: string, fallback?: string) => string;
  hitMessageOverride?: string | null;
  examStrict?: boolean;
  sanitizeOptionText?: boolean;
}) {
  const learningFocus = variant === "focusPanel";
  const showFeedback = pickedId === opt.id;
  const isLast = optIdx === totalOpts - 1;
  const hit = showFeedback && opt.isCorrect;
  const miss = showFeedback && !opt.isCorrect;

  const borderBottom = isLast
    ? "none"
    : learningFocus
      ? "1px solid var(--nx-learn-line)"
      : "1px solid rgba(232, 233, 240, 0.14)";

  let background: string = "transparent";
  if (showFeedback) {
    background = hit
      ? learningFocus
        ? "rgba(52, 211, 153, 0.14)"
        : "rgba(52, 211, 153, 0.12)"
      : learningFocus
        ? "rgba(248, 113, 113, 0.12)"
        : "rgba(248, 113, 113, 0.1)";
  }

  const accentBorder = showFeedback
    ? hit
      ? "4px solid rgba(52, 211, 153, 0.85)"
      : "4px solid rgba(248, 113, 113, 0.88)"
    : "4px solid transparent";

  return (
    <button
      type="button"
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onPick(opt);
      }}
      onClick={() => onPick(opt)}
      aria-pressed={showFeedback}
      style={{
        textAlign: "left",
        width: "100%",
        border: "none",
        borderRadius: showFeedback ? 14 : 0,
        borderBottom,
        borderLeft: accentBorder,
        background,
        boxShadow: showFeedback
          ? hit
            ? "inset 0 0 0 1px rgba(52, 211, 153, 0.35)"
            : "inset 0 0 0 1px rgba(248, 113, 113, 0.35)"
          : undefined,
        padding: learningFocus ? "18px 16px" : "var(--nx-space-8) var(--nx-space-16)",
        cursor: "pointer",
        fontFamily: typography.fontSans,
        fontSize: learningFocus ? "clamp(1.02rem, 2.6vw, 1.28rem)" : typography.bodySize,
        lineHeight: 1.45,
        color: learningFocus ? "var(--nx-learn-ink)" : "var(--nx-bone-90)",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 0,
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "var(--nx-space-12)",
          minWidth: 0,
        }}
      >
        <span
          aria-hidden
          style={{
            flexShrink: 0,
            fontWeight: 700,
            minWidth: "1.25em",
            color: hit
              ? "rgba(52, 211, 153, 0.95)"
              : miss
                ? "rgba(252, 165, 165, 0.95)"
                : learningFocus
                  ? "rgba(22,32,25,0.46)"
                  : "var(--nx-bone-50)",
          }}
        >
          {opt.id.toUpperCase()}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          {sanitizeOptionText ? sanitizeEdtechLearningText(opt.text) : opt.text}
        </span>
      </span>
      {miss ? (
        <div
          role="status"
          aria-live="polite"
          style={{
            marginTop: "var(--nx-space-16)",
            padding: "12px 14px",
            borderRadius: 12,
            fontSize: learningFocus ? 20 : 18,
            lineHeight: 1.45,
            fontWeight: 700,
            letterSpacing: "0.02em",
            color: "rgba(254, 226, 226, 0.96)",
            background: "rgba(127, 29, 29, 0.35)",
            border: "1px solid rgba(248, 113, 113, 0.45)",
          }}
        >
          <div>{t("learningTerminal.feedbackMcWrongTitle")}</div>
          <div
            style={{
              marginTop: 6,
              fontWeight: 600,
              fontSize: learningFocus ? 18 : 16,
              color: "rgba(254, 202, 202, 0.92)",
            }}
          >
            {examStrict
              ? t("learningTerminal.feedbackExamNoHint")
              : opt.whyWrongHint
                ? opt.whyWrongHint
                : t("learningTerminal.feedbackMcWrongPickOther")}
          </div>
        </div>
      ) : null}
      {hit ? (
        <div
          role="status"
          aria-live="polite"
          style={{
            marginTop: "var(--nx-space-16)",
            padding: "12px 14px",
            borderRadius: 12,
            fontSize: learningFocus ? 20 : 18,
            lineHeight: 1.45,
            fontWeight: 800,
            letterSpacing: "0.03em",
            color: "rgba(209, 250, 229, 0.98)",
            background: "rgba(6, 78, 59, 0.45)",
            border: "1px solid rgba(52, 211, 153, 0.5)",
          }}
        >
          {hitMessageOverride?.trim()
            ? hitMessageOverride
            : isBeginnerExercise
              ? t("learningTerminal.feedbackMcHitLesson")
              : t("learningTerminal.feedbackMcHitNumeric")}
        </div>
      ) : null}
    </button>
  );
}

/** Ein onError pro Asset — kein Retry, kein erneutes Setzen von src (verhindert Browser-Spam bei 404) */
function SafeLearningFigure({
  src,
  alt,
  coachMentorId,
  coachName,
}: {
  src: string;
  alt: string;
  coachMentorId: number | null;
  coachName: string | null;
}) {
  const errorOnceRef = useRef(false);
  const [failed, setFailed] = useState(false);

  const onError = useCallback(() => {
    if (errorOnceRef.current) return;
    errorOnceRef.current = true;
    setFailed(true);
  }, []);

  if (failed) {
    return (
      <div
        role="alert"
        style={{
          margin: "var(--nx-space-16) 0 0",
          display: "flex",
          alignItems: "flex-start",
          gap: "var(--nx-space-16)",
          padding: "var(--nx-space-16) var(--nx-space-20)",
          borderRadius: 22,
          border: "1px solid rgba(251, 247, 239, 0.12)",
          background:
            "linear-gradient(145deg, rgba(8, 10, 12, 0.94) 0%, rgba(18, 22, 26, 0.9) 100%)",
          boxShadow: "inset 0 1px 0 rgba(251, 247, 239, 0.06)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        {coachMentorId != null ? (
          <MentorPortrait
            mentorId={coachMentorId}
            variant="idle"
            size={56}
            radius={16}
            border="1px solid rgba(214, 181, 111, 0.35)"
          />
        ) : null}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: typography.fontMono,
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(251, 247, 239, 0.42)",
            }}
          >
            {coachName?.trim() ? `${coachName} · Coach` : "Coach"}
          </div>
          <p
            style={{
              margin: "8px 0 0",
              fontFamily: typography.fontSans,
              fontSize: 24,
              lineHeight: 1.5,
              fontWeight: 500,
              color: "rgba(251, 247, 239, 0.92)",
            }}
          >
            Ich sehe kein Bild das Asset fehlt oder das Netzwerk stockt wir überspringen die Abbildung
          </p>
        </div>
      </div>
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
  const { playVictoryFinisherSequence } = useBossAudioEngine();
  const entryToken = useGameStore((s) => s.entryToken);
  const preferredLearningExerciseId = useGameStore((s) => s.preferredLearningExerciseId);
  const edtechExcludeExerciseId = useGameStore((s) => s.edtechExcludeExerciseId);
  const edtechRecentExerciseIds = useGameStore((s) => s.edtechRecentExerciseIds);
  const learningCorrectByLf = useGameStore((s) => s.learningCorrectByLf);
  const sectorZeroMorphToken = useGameStore((s) => s.sectorZeroMorphToken);
  const recordCombatLearningAttempt = useGameStore((s) => s.recordCombatLearningAttempt);
  const triggerBossHit = useGameStore((s) => s.triggerBossHit);
  const markMissionCleared = useGameStore((s) => s.markMissionCleared);
  const recordLearningExerciseMastery = useGameStore((s) => s.recordLearningExerciseMastery);
  const advanceEdtechLearningTurn = useGameStore((s) => s.advanceEdtechLearningTurn);
  const nexusChrome = useGameStore((s) => s.nexusChrome);
  const edtechFlow = nexusChrome === "edtech";
  const examPresentationMode = useGameStore((s) => s.examPresentationMode);
  const examSessionEndsAt = useGameStore((s) => s.examSessionEndsAt);
  const isBlitzSession = useGameStore((s) => s.isBlitzSession);
  const blitzIndex = useGameStore((s) => s.blitzIndex);
  const blitzQueue = useGameStore((s) => s.blitzQueue);
  const examStrict = edtechFlow && examPresentationMode;
  const setActiveMissionContext = useGameStore((s) => s.setActiveMissionContext);
  const clearActiveMissionContext = useGameStore((s) => s.clearActiveMissionContext);
  const mission = useGameStore((s) => s.mission);
  const archiveWorkbenchSnippet = useGameStore((s) => s.archiveWorkbenchSnippet);
  const unlockSectorMastery = useGameStore((s) => s.unlockSectorMastery);
  const playerAvatar = useGameStore((s) => s.playerAvatar);
  const playerName = useGameStore((s) => s.playerName);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const selectionDebounceRef = useRef<string | null>(null);
  const panelShake = useAnimation();
  const [rimGold, setRimGold] = useState(false);

  const coachMentorId = playerAvatar ?? 1;
  const coachDisplayName = playerName?.trim() ? playerName : null;

  const triggerCodeSuccessFx = useCallback(() => {
    if (!reduceMotion) {
      void panelShake
        .start({
          x: [0, -9, 9, -6, 6, -4, 4, 0],
          y: [0, 4, -4, 3, -3, 0, 0, 0],
          transition: { duration: 0.52, ease: "easeInOut" },
        })
        .then(() => panelShake.start({ x: 0, y: 0, transition: { duration: 0 } }));
    }
    setRimGold(true);
    window.setTimeout(() => setRimGold(false), 840);
  }, [panelShake, reduceMotion]);

  const bundle = useMemo(() => {
    const leitner = useGameStore.getState().learningLeitnerByExerciseId;
    if (sectorZero) {
      const seed = (entryToken ^ (sectorZeroMorphToken * 0x9e3779b9)) >>> 0;
      return getFinalExamLearningBundle(seed, leitner);
    }
    const edtechPickCtx = edtechFlow
      ? {
          excludeExerciseId: edtechExcludeExerciseId,
          recentExerciseIds: edtechRecentExerciseIds,
          solvedExerciseIds: learningCorrectByLf[currentLF] ?? [],
        }
      : null;
    return getTerminalLearningBundle(
      currentLF,
      semantic,
      entryToken,
      leitner,
      preferredLearningExerciseId,
      edtechPickCtx
    );
  }, [
    sectorZero,
    sectorZeroMorphToken,
    currentLF,
    semantic,
    entryToken,
    preferredLearningExerciseId,
    edtechFlow,
    edtechExcludeExerciseId,
    edtechRecentExerciseIds,
    learningCorrectByLf,
  ]);

  const { snippet, exercise, exerciseLf } = bundle;
  const answerLf = exerciseLf ?? currentLF;

  const learningStoryMode = useGameStore((s) => s.learningStoryMode);
  const learningFocus = Boolean(visible && exercise);
  const isBeginnerExercise = Boolean(exercise?.lessonCards?.length);
  const edtechCalmBeginner = edtechFlow && isBeginnerExercise;
  const edtechSanitizeText = edtechCalmBeginner && !learningStoryMode;

  const displayExerciseTitle = useMemo(() => {
    if (!exercise) return "";
    if (edtechCalmBeginner) {
      return friendlyMissionTitle(exercise.id, exercise.title, learningStoryMode);
    }
    return exercise.title;
  }, [exercise, edtechCalmBeginner, learningStoryMode]);

  const edtechMergedLesson = useMemo(() => {
    if (!edtechCalmBeginner || !exercise?.lessonCards?.length) return null;
    return mergeLessonCardsForEdtech(exercise.lessonCards, learningStoryMode);
  }, [edtechCalmBeginner, exercise?.lessonCards, learningStoryMode]);

  const learningLeitnerByExerciseId = useGameStore((s) => s.learningLeitnerByExerciseId);

  const edtechBeginnerProgress = useMemo(() => {
    if (!edtechCalmBeginner || !exercise) return null;
    const ids = [...(BEGINNER_EXERCISE_IDS_BY_LF[answerLf] ?? [])];
    if (!ids.length) return null;
    const solved = ids.filter((id) => (learningLeitnerByExerciseId[id]?.repetitions ?? 0) >= 1).length;
    const idx = ids.indexOf(exercise.id);
    return {
      current: idx >= 0 ? idx + 1 : Math.min(solved + 1, ids.length),
      total: ids.length,
      solved,
    };
  }, [edtechCalmBeginner, exercise, answerLf, learningLeitnerByExerciseId]);

  const displayMcQuestion = useMemo(() => {
    if (!exercise?.mcQuestion) return "";
    return formatLearningDisplayText(exercise.mcQuestion, learningStoryMode);
  }, [exercise?.mcQuestion, learningStoryMode]);

  const displayProblem = useMemo(() => {
    if (!exercise?.problem) return "";
    return formatLearningDisplayText(exercise.problem, learningStoryMode);
  }, [exercise?.problem, learningStoryMode]);

  const displayCoachLine = useMemo(() => {
    if (!exercise?.coachLine) return null;
    return formatLearningDisplayText(exercise.coachLine, learningStoryMode);
  }, [exercise?.coachLine, learningStoryMode]);

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
  const bossUi = useMemo(() => resolveTerminalBossMode(answerLf, exercise?.id), [answerLf, exercise?.id]);
  const lf10NetplanSpec = useMemo(
    () => (answerLf === "LF10" && exercise?.id ? resolveLf10Netplan(exercise.id, semantic) : null),
    [answerLf, exercise?.id, semantic],
  );
  const isBossMode = learningFocus && bossUi.isBoss;
  const bossEpicLine = useMemo(() => {
    if (!isBossMode) return null;
    return (
      bossUi.epicLine ??
      t("learningTerminal.bossActive", "Letzte Aufgabe in diesem Thema")
    );
  }, [bossUi.epicLine, isBossMode, t]);

  const handleMcOption = useCallback(
    (opt: LearningMcOption) => {
      if (!exercise) return;
      const selectionKey = `${exercise.id}:${opt.id}`;
      if (selectionDebounceRef.current === selectionKey) return;
      selectionDebounceRef.current = selectionKey;
      window.setTimeout(() => {
        if (selectionDebounceRef.current === selectionKey) {
          selectionDebounceRef.current = null;
        }
      }, 300);

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
      const bossActive = resolveTerminalBossMode(answerLf, exercise.id).isBoss;
      if (opt.isCorrect && bossActive) {
        markMissionCleared(exercise.id);
        recordLearningExerciseMastery(answerLf, exercise.id);
        unlockSectorMastery(answerLf);
        void playVictoryFinisherSequence();
        window.dispatchEvent(new CustomEvent("nx:boss-clear-map"));
        triggerBossHit(8);
      } else if (opt.isCorrect) {
        recordLearningExerciseMastery(answerLf, exercise.id);
        if (!edtechFlow) {
          triggerBossHit(8);
        }
        if (edtechFlow) {
          window.setTimeout(() => advanceEdtechLearningTurn(exercise.id), 900);
        } else if (isBeginnerExercise) {
          markMissionCleared(exercise.id);
        }
      }
    },
    [
      answerLf,
      edtechFlow,
      exercise,
      advanceEdtechLearningTurn,
      isBeginnerExercise,
      markMissionCleared,
      recordCombatLearningAttempt,
      recordLearningExerciseMastery,
      triggerBossHit,
      unlockSectorMastery,
      playVictoryFinisherSequence,
    ]
  );

  const streamEase = [0.22, 1, 0.36, 1] as const;
  const streamInstant = edtechFlow || reduceMotion;
  const dur = streamInstant ? 0.01 : 0.44;
  const stagger = streamInstant ? 0 : 0.055;
  const delayCh = streamInstant ? 0 : 0.045;

  const streamParent = {
    hidden: { opacity: streamInstant ? 1 : 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: stagger, delayChildren: delayCh },
    },
  };

  const streamChild = {
    hidden: {
      opacity: streamInstant ? 1 : 0,
      y: streamInstant ? 0 : 5,
      filter: streamInstant ? "none" : "blur(5px)",
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

  const useEdtechSession =
    edtechFlow &&
    learningFocus &&
    exercise &&
    exercise.mcOptions.length > 0 &&
    exercise.lang !== "sql" &&
    exercise.lang !== "csharp" &&
    exercise.lang !== "bash";

  if (useEdtechSession) {
    return (
      <EdtechLearningSession
        lf={answerLf}
        exercise={exercise}
        pickedId={pickedId}
        examStrict={examStrict}
        onPick={handleMcOption}
      />
    );
  }

  if (!exercise && edtechFlow) {
    return (
      <motion.aside
        data-nx-edtech-terminal-empty="1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          position: "fixed",
          inset: "max(24px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left))",
          zIndex: "var(--nx-z-learning-focus-panel)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          className="nx-calm-card"
          style={{
            padding: 32,
            borderRadius: 24,
            maxWidth: 480,
            textAlign: "center",
            color: "var(--nx-learn-ink)",
            fontFamily: "var(--nx-font-sans)",
          }}
        >
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            {t("learningTerminal.edtechNoExercise", "Aufgabe wird geladen…")}
          </p>
        </div>
      </motion.aside>
    );
  }

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
            background:
              "linear-gradient(180deg, rgba(8,12,10,0.72) 0%, rgba(8,12,10,0.9) 100%)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        />
      ) : null}
      <motion.aside
        data-nx-tutorial="terminal"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        style={{
          position: learningFocus ? "fixed" : "absolute",
          ...(learningFocus
            ? {
                left: "max(24px, env(safe-area-inset-left))",
                right: "max(24px, env(safe-area-inset-right))",
                top: "max(24px, env(safe-area-inset-top))",
                bottom: "max(24px, env(safe-area-inset-bottom))",
                transform: "none",
                width: "auto",
                maxWidth: "1040px",
                marginInline: "auto",
                maxHeight: "calc(100dvh - 48px)",
                zIndex: "var(--nx-z-learning-focus-panel)",
                overflowY: "auto",
                overflowX: "hidden",
                WebkitOverflowScrolling: "touch",
                boxSizing: "border-box",
              }
            : {
                left: "50%",
                bottom: "calc(248px + env(safe-area-inset-bottom, 0px))",
                transform: "translateX(-50%)",
                zIndex: 45,
                width: "min(720px, calc(100vw - var(--nx-space-16)))",
                maxHeight: "min(52dvh, 520px)",
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
                boxSizing: "border-box",
              }),
          pointerEvents: interactiveMc ? "auto" : "none",
        }}
      >
        <motion.div
          className={learningFocus ? "nx-calm-card" : undefined}
          animate={panelShake}
          style={{
            borderRadius: learningFocus ? 32 : 22,
            padding: learningFocus
              ? "clamp(28px, 4vw, 56px)"
              : "var(--nx-space-24) var(--nx-space-32)",
            background: learningFocus ? "var(--nx-learn-surface)" : "var(--nx-panel-frost)",
            border: learningFocus
              ? rimGold
                ? "1px solid rgba(214, 181, 111, 0.65)"
                : "1px solid var(--nx-learn-line)"
              : "1px solid var(--nx-border-readable)",
            boxShadow: learningFocus
              ? rimGold
                ? "0 0 0 2px rgba(255, 214, 165, 0.35), 0 0 64px rgba(214, 181, 111, 0.42), 0 36px 110px rgba(0,0,0,0.28)"
                : "0 36px 110px rgba(0,0,0,0.28)"
              : "0 var(--nx-space-24) var(--nx-space-64) var(--nx-shadow-deep), inset 0 1px 0 var(--nx-bone-25)",
            color: learningFocus ? "var(--nx-learn-ink)" : undefined,
            transition: "box-shadow 0.25s ease, border-color 0.25s ease",
          }}
        >
          {isBossMode ? (
            <motion.div
              aria-hidden
              animate={
                reduceMotion
                  ? { opacity: 0.22 }
                  : { opacity: [0.18, 0.48, 0.22] }
              }
              transition={reduceMotion ? { duration: 0 } : { duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: "absolute",
                inset: -2,
                borderRadius: learningFocus ? 34 : 24,
                pointerEvents: "none",
                background:
                  "radial-gradient(circle at 50% 32%, rgba(248, 113, 113, 0.22), transparent 55%), linear-gradient(180deg, rgba(88, 12, 12, 0.22), transparent 68%)",
                boxShadow: "0 0 60px rgba(248, 113, 113, 0.22)",
              }}
            />
          ) : null}
          <motion.div
            key={streamKey}
            variants={streamParent}
            initial="hidden"
            animate="show"
            style={{ display: "flex", flexDirection: "column", gap: 0 }}
          >
            {learningFocus && examStrict && examSessionEndsAt ? (
              <EdtechExamTimerBar endsAt={examSessionEndsAt} compact />
            ) : null}
            {learningFocus && isBlitzSession && blitzQueue.length > 0 ? (
              <motion.div
                variants={streamChild}
                style={{
                  marginBottom: 12,
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "linear-gradient(90deg, rgba(6,182,212,0.12), rgba(214,181,111,0.08))",
                  border: "1px solid rgba(6,182,212,0.35)",
                  fontFamily: "var(--nx-font-mono)",
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  color: "var(--nx-learn-muted)",
                }}
              >
                {t("learningTerminal.blitzProgress")
                  .replace("{current}", String(blitzIndex + 1))
                  .replace("{total}", String(blitzQueue.length))}
              </motion.div>
            ) : null}
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
                  fontSize: 20,
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
                {isBossMode ? (
                  <motion.div
                    variants={streamChild}
                    style={{
                      marginBottom: "var(--nx-space-16)",
                      padding: "var(--nx-space-16) var(--nx-space-20)",
                      borderRadius: 24,
                      border: "1px solid rgba(248, 113, 113, 0.35)",
                      background: "rgba(18, 8, 8, 0.78)",
                      color: "rgba(251, 247, 239, 0.95)",
                      boxShadow: "0 0 42px rgba(248, 113, 113, 0.18), inset 0 1px 0 rgba(251,247,239,0.06)",
                      backdropFilter: "blur(14px)",
                      WebkitBackdropFilter: "blur(14px)",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: typography.fontMono,
                        fontSize: 20,
                        fontWeight: 850,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "rgba(248, 113, 113, 0.85)",
                      }}
                    >
                      {edtechFlow
                        ? t("learningTerminal.sectionBoss", "Abschlussübung")
                        : t("learningTerminal.sectionBoss", "Boss-Modus")}
                    </div>
                    <p
                      style={{
                        margin: "10px 0 0",
                        fontFamily: typography.fontSans,
                        fontSize: "clamp(24px, 3vw, 30px)",
                        lineHeight: 1.48,
                        fontWeight: 650,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {bossEpicLine}
                    </p>
                  </motion.div>
                ) : null}
                {learningFocus ? (
                  <motion.div
                    variants={streamChild}
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "var(--nx-space-20)",
                      marginBottom: "var(--nx-space-20)",
                      padding: "var(--nx-space-18) var(--nx-space-22)",
                      borderRadius: 26,
                      border: "1px solid rgba(251, 247, 239, 0.1)",
                      background:
                        "linear-gradient(150deg, rgba(10, 12, 14, 0.94) 0%, rgba(22, 26, 30, 0.9) 100%)",
                      boxShadow:
                        "inset 0 1px 0 rgba(251, 247, 239, 0.07), 0 18px 48px rgba(0,0,0,0.22)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                    }}
                  >
                    <motion.div
                      animate={
                        reduceMotion
                          ? {}
                          : {
                              scale: [1, 1.045, 1],
                              y: [0, -3, 0],
                            }
                      }
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { duration: 3.6, repeat: Infinity, ease: "easeInOut" }
                      }
                    >
                      <MentorPortrait
                        mentorId={coachMentorId}
                        variant="idle"
                        size={92}
                        radius={22}
                        border="1px solid rgba(214, 181, 111, 0.45)"
                        boxShadow="0 0 28px rgba(214, 181, 111, 0.18)"
                      />
                    </motion.div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontFamily: typography.fontMono,
                          fontSize: 20,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "rgba(251, 247, 239, 0.42)",
                          fontWeight: 700,
                        }}
                      >
                        {edtechFlow
                          ? `${coachDisplayName ?? t("profile.activeMentor", "Deine Begleiterin")} · Lernhilfe`
                          : `Cockpit · ${coachDisplayName ?? "Pilot"}`}
                      </div>
                      <p
                        style={{
                          margin: "10px 0 0",
                          fontFamily: typography.fontSans,
                          fontSize: 24,
                          lineHeight: 1.45,
                          fontWeight: 500,
                          color: "rgba(251, 247, 239, 0.92)",
                        }}
                      >
                        {edtechFlow
                          ? t(
                              "ui.combat.mentorHint",
                              "Lies die Aufgabe in Ruhe — bei Unsicherheit zuerst die Erklärung oben"
                            )
                          : t("ui.combat.mentorHintIndustrial", "Fokus auf die Aufgabe")}
                      </p>
                    </div>
                  </motion.div>
                ) : null}
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
                      fontSize: 20,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: learningFocus ? "var(--nx-learn-muted)" : "var(--nx-bone-50)",
                    }}
                  >
                    {edtechCalmBeginner
                      ? t("learningTerminal.edtechStepLabel", "Schritt 1 · Kurz lesen")
                      : isBeginnerExercise
                        ? t("learningTerminal.lessonLabel", "Lektion")
                        : t("learningTerminal.taskLabel", "Aufgabe")}{" "}
                    {!edtechCalmBeginner &&
                      (mission.status === "cleared"
                        ? t("learningTerminal.statusDone", "abgeschlossen")
                        : t("learningTerminal.statusActive", "in Arbeit"))}
                  </div>
                  <h2
                    style={{
                      margin: 0,
                      fontFamily: typography.fontSans,
                      fontSize: edtechCalmBeginner
                        ? "clamp(28px, 3.6vw, 36px)"
                        : learningFocus
                          ? "clamp(42px, 5.4vw, 64px)"
                          : "clamp(24px, 2.8vw, 30px)",
                      fontWeight: learningFocus ? 800 : typography.headingWeight,
                      letterSpacing: learningFocus ? "-0.03em" : undefined,
                      lineHeight: edtechCalmBeginner ? 1.2 : learningFocus ? 0.98 : 1.35,
                      color: learningFocus ? "var(--nx-learn-ink)" : typography.fg,
                    }}
                  >
                    {displayExerciseTitle}
                  </h2>
                  {edtechBeginnerProgress ? (
                    <p
                      style={{
                        margin: "var(--nx-space-10) 0 0",
                        fontFamily: typography.fontSans,
                        fontSize: 14,
                        fontWeight: 650,
                        color: "rgba(6, 182, 212, 0.9)",
                      }}
                    >
                      {t("learningTerminal.edtechPathProgress", "Einstieg {current} von {total}")
                        .replace("{current}", String(edtechBeginnerProgress.current))
                        .replace("{total}", String(edtechBeginnerProgress.total))}
                      {edtechBeginnerProgress.solved > 0
                        ? ` · ${t("learningTerminal.edtechPathDone", "{n} geschafft").replace("{n}", String(edtechBeginnerProgress.solved))}`
                        : ""}
                    </p>
                  ) : null}
                  {learningFocus && edtechMergedLesson ? (
                    <article
                      aria-label={t("learningTerminal.edtechReadAria", "Kurz erklärt")}
                      style={{
                        marginTop: "var(--nx-space-20)",
                        borderRadius: 16,
                        border: "1px solid rgba(6, 182, 212, 0.28)",
                        background:
                          "linear-gradient(165deg, rgba(14, 20, 28, 0.92) 0%, rgba(8, 12, 18, 0.95) 100%)",
                        padding: "var(--nx-space-20) var(--nx-space-22)",
                        boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: typography.fontMono,
                          fontSize: 11,
                          fontWeight: 750,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "rgba(6, 182, 212, 0.85)",
                        }}
                      >
                        {edtechMergedLesson.title}
                      </div>
                      <p
                        style={{
                          margin: "var(--nx-space-12) 0 0",
                          fontFamily: typography.fontSans,
                          fontSize: "clamp(17px, 2vw, 20px)",
                          lineHeight: 1.55,
                          fontWeight: 500,
                          color: "var(--nx-learn-ink)",
                        }}
                      >
                        {edtechMergedLesson.body}
                      </p>
                    </article>
                  ) : null}
                  {learningFocus &&
                  exercise.lessonCards?.length &&
                  !edtechCalmBeginner ? (
                    <div
                      aria-label="Was lernst du"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
                        gap: "var(--nx-space-12)",
                        marginTop: "var(--nx-space-24)",
                      }}
                    >
                      {exercise.lessonCards.map((card) => (
                        <article
                          key={`${exercise.id}-${card.title}`}
                          style={{
                            minHeight: 150,
                            borderRadius: 8,
                            border: "1px solid rgba(34, 211, 238, 0.18)",
                            background:
                              "linear-gradient(165deg, rgba(14, 16, 18, 0.88) 0%, rgba(8, 9, 10, 0.92) 100%)",
                            padding: "var(--nx-space-24)",
                            boxShadow:
                              "inset 0 1px 0 rgba(251,247,239,0.05), 0 0 0 1px rgba(214,181,111,0.12), 0 16px 40px rgba(0,0,0,0.35)",
                            backdropFilter: "blur(14px)",
                            WebkitBackdropFilter: "blur(14px)",
                          }}
                        >
                          <div
                            style={{
                              fontFamily: typography.fontMono,
                              fontSize: 20,
                              fontWeight: 850,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              color: "rgba(210, 208, 200, 0.55)",
                            }}
                          >
                            {card.title}
                          </div>
                          <p
                            style={{
                              margin: "var(--nx-space-12) 0 0",
                              fontFamily: typography.fontSans,
                              fontSize: "clamp(22px, 2.4vw, 26px)",
                              lineHeight: 1.5,
                              fontWeight: 500,
                              color: "var(--nx-learn-ink)",
                            }}
                          >
                            {card.body}
                          </p>
                        </article>
                      ))}
                    </div>
                  ) : null}
                  {learningFocus && lf10NetplanSpec ? (
                    <div
                      style={{
                        marginTop: "var(--nx-space-20)",
                        width: "100%",
                        maxWidth: 760,
                      }}
                    >
                      <NetplanVisualizer
                        scenario={lf10NetplanSpec.scenario}
                        multiverse={lf10NetplanSpec.multiverse}
                      />
                    </div>
                  ) : null}
                  {learningFocus && exercise.example && !edtechCalmBeginner ? (
                    <section
                      aria-label={exercise.example.label}
                      style={{
                        marginTop: "var(--nx-space-24)",
                        padding: "var(--nx-space-24)",
                        borderRadius: 8,
                        border: "1px solid rgba(214, 181, 111, 0.28)",
                        background: "rgba(10, 10, 12, 0.72)",
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                        boxShadow: "inset 0 1px 0 rgba(251,247,239,0.04)",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: typography.fontMono,
                          fontSize: 20,
                          fontWeight: 850,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "rgba(210, 208, 200, 0.55)",
                        }}
                      >
                        {exercise.example.label}
                      </div>
                      <p
                        style={{
                          margin: "var(--nx-space-8) 0 0",
                          fontFamily: typography.fontSans,
                          fontSize: "clamp(24px, 2.4vw, 30px)",
                          lineHeight: 1.55,
                          fontWeight: 650,
                          color: "var(--nx-learn-ink)",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {exercise.example.body}
                      </p>
                    </section>
                  ) : null}
                  {learningFocus && isBeginnerExercise ? (
                    <div
                      style={{
                        marginTop: "var(--nx-space-24)",
                        fontFamily: typography.fontSans,
                        fontSize: edtechCalmBeginner ? 13 : 20,
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: edtechCalmBeginner ? "rgba(6, 182, 212, 0.75)" : "rgba(22,32,25,0.5)",
                      }}
                    >
                      {edtechCalmBeginner
                        ? t("learningTerminal.edtechQuestionLabel", "Schritt 2 · Deine Frage")
                        : t("learningTerminal.sectionYourTurn", "Deine Aufgabe")}
                    </div>
                  ) : null}
                  {!(
                    learningFocus &&
                    !examStrict &&
                    exercise.coachLine &&
                    exercise.lang === "markdown" &&
                    exercise.mcOptions.length > 0
                  ) &&
                  !(edtechCalmBeginner && exercise.mcOptions.length > 0) ? (
                    <p
                      style={{
                        margin: isBeginnerExercise
                          ? "var(--nx-space-8) 0 0"
                          : "var(--nx-space-16) 0 0",
                        fontFamily: typography.fontSans,
                        fontSize: learningFocus
                          ? "clamp(24px, 2vw, 28px)"
                          : typography.bodySize,
                        lineHeight: learningFocus ? 1.72 : typography.bodyLineHeight,
                        color: learningFocus ? "var(--nx-learn-muted)" : typography.fgMuted,
                        whiteSpace: "pre-wrap",
                        maxWidth: "72ch",
                      }}
                    >
                      {displayProblem}
                    </p>
                  ) : null}
                  {learningFocus && exercise.solutionHint ? (
                    <p
                      style={{
                        margin: "var(--nx-space-16) 0 0",
                        padding: "var(--nx-space-16)",
                        borderRadius: 20,
                        border: "1px solid rgba(214,181,111,0.26)",
                        background: "rgba(214,181,111,0.12)",
                        fontFamily: typography.fontSans,
                        fontWeight: 600,
                        fontSize: "clamp(22px, 2.4vw, 26px)",
                        lineHeight: 1.6,
                        color: "var(--nx-learn-ink)",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {exercise.solutionHint}
                    </p>
                  ) : null}
                  {exercise.illustrationSrc ? (
                    <SafeLearningFigure
                      src={exercise.illustrationSrc}
                      alt=""
                      coachMentorId={learningFocus ? coachMentorId : null}
                      coachName={learningFocus ? coachDisplayName : null}
                    />
                  ) : null}
                </motion.div>

                <motion.div variants={streamChild} aria-hidden style={ruleStyle} />

                {learningFocus && (exercise.lang === "sql" || exercise.lang === "csharp" || exercise.lang === "bash") ? (
                  <motion.div
                    variants={streamChild}
                    style={{
                      padding: "var(--nx-space-8) 0",
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--nx-space-12)",
                    }}
                  >
                    {!examStrict && displayCoachLine && !edtechCalmBeginner ? (
                      <p
                        style={{
                          margin: 0,
                          padding: "var(--nx-space-16) var(--nx-space-20)",
                          borderRadius: 20,
                          fontFamily: typography.fontSans,
                          fontSize: "clamp(24px, 2.6vw, 30px)",
                          fontWeight: 750,
                          lineHeight: 1.45,
                          letterSpacing: "-0.02em",
                          color: "rgba(248, 244, 232, 0.96)",
                          background:
                            "linear-gradient(145deg, rgba(10, 16, 20, 0.94) 0%, rgba(18, 28, 24, 0.9) 100%)",
                          border: "1px solid rgba(214, 181, 111, 0.24)",
                          boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.04)",
                          whiteSpace: "pre-wrap",
                          maxWidth: "72ch",
                        }}
                      >
                        {displayCoachLine}
                      </p>
                    ) : null}
                    <TerminalCodeWorkbench
                      key={exercise.id}
                      lang={exercise.lang}
                      reference={exercise.solutionCode}
                      milestoneId={exercise.id}
                      onSuccess={() => {
                        recordLearningExerciseMastery(answerLf, exercise.id);
                        if (isBossMode) {
                          markMissionCleared(exercise.id);
                          unlockSectorMastery(answerLf);
                          void playVictoryFinisherSequence();
                          window.dispatchEvent(new CustomEvent("nx:boss-clear-map"));
                        } else if (edtechFlow) {
                          window.setTimeout(() => advanceEdtechLearningTurn(exercise.id), 1200);
                        } else {
                          markMissionCleared(exercise.id);
                        }
                      }}
                      onRunSuccessEffects={triggerCodeSuccessFx}
                      coachMentorId={coachMentorId}
                      coachName={coachDisplayName}
                      learningField={answerLf}
                      initialDraft={
                        exercise.workbenchInitialDraft ??
                        (archiveWorkbenchSnippet &&
                        archiveWorkbenchSnippet.lf === answerLf &&
                        archiveWorkbenchSnippet.lang === exercise.lang
                          ? archiveWorkbenchSnippet.code
                          : undefined)
                      }
                      initialToken={archiveWorkbenchSnippet?.updatedAt}
                    />
                  </motion.div>
                ) : null}

                {learningFocus &&
                exercise.lang !== "sql" &&
                exercise.lang !== "csharp" &&
                exercise.lang !== "bash" ? (
                  <>
                    <motion.div
                      variants={streamChild}
                      style={{
                        padding: "var(--nx-space-8) 0",
                        display: "flex",
                        flexDirection: "column",
                        gap: "var(--nx-space-12)",
                      }}
                    >
                      {!examStrict && displayCoachLine && !edtechCalmBeginner ? (
                        <p
                          style={{
                            margin: 0,
                            padding: "var(--nx-space-16) var(--nx-space-20)",
                            borderRadius: 20,
                            fontFamily: typography.fontSans,
                            fontSize: "clamp(24px, 2.6vw, 30px)",
                            fontWeight: 750,
                            lineHeight: 1.45,
                            letterSpacing: "-0.02em",
                            color: "rgba(248, 244, 232, 0.96)",
                            background:
                              "linear-gradient(145deg, rgba(10, 16, 20, 0.94) 0%, rgba(18, 28, 24, 0.9) 100%)",
                            border: "1px solid rgba(214, 181, 111, 0.24)",
                            boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.04)",
                            whiteSpace: "pre-wrap",
                            maxWidth: "72ch",
                          }}
                        >
                          {displayCoachLine}
                        </p>
                      ) : null}
                      <p
                        style={{
                          margin: 0,
                          fontFamily: typography.fontSans,
                          fontSize: edtechCalmBeginner
                            ? "clamp(1.125rem, 2.8vw, 1.35rem)"
                            : "clamp(1.05rem, 3.2vw, 1.45rem)",
                          fontWeight: 800,
                          lineHeight: 1.4,
                          letterSpacing: "-0.01em",
                          color: learningFocus ? "var(--nx-learn-ink)" : "var(--nx-bone-90)",
                        }}
                      >
                        {displayMcQuestion}
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
                        padding: "var(--nx-space-8) 0 0",
                      }}
                    >
                      {exercise.mcOptions.map((opt, optIdx) => (
                        <LearningMcOptionRow
                          key={opt.id}
                          opt={opt}
                          optIdx={optIdx}
                          totalOpts={exercise.mcOptions.length}
                          pickedId={pickedId}
                          isBeginnerExercise={isBeginnerExercise}
                          variant="focusPanel"
                          onPick={handleMcOption}
                          t={t}
                          hitMessageOverride={
                            edtechFlow
                              ? t(
                                  "learningTerminal.feedbackMcHitNext"
                                )
                              : null
                          }
                          examStrict={examStrict}
                          sanitizeOptionText={edtechSanitizeText}
                        />
                      ))}
                    </motion.div>
                    {!isBeginnerExercise ? (
                      <>
                        <motion.div variants={streamChild} aria-hidden style={ruleStyle} />
                        <motion.div
                          variants={streamChild}
                          style={{
                            fontFamily: typography.fontSans,
                            fontSize: 20,
                            fontWeight: 800,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: learningFocus ? "var(--nx-learn-muted)" : "var(--nx-bone-50)",
                            padding: "var(--nx-space-8) 0 0",
                          }}
                        >
                          Zahlenantwort
                        </motion.div>
                        <motion.div
                          variants={streamChild}
                          style={{ padding: "var(--nx-space-8) 0 0", display: "flex", flexDirection: "column", gap: 0 }}
                        >
                          <InteractiveMissionInput
                            expected={exercise.solutionCode}
                            onSuccess={() => {
                              recordLearningExerciseMastery(answerLf, exercise.id);
                              if (edtechFlow) {
                                window.setTimeout(() => advanceEdtechLearningTurn(exercise.id), 1200);
                              } else {
                                triggerBossHit(12);
                                markMissionCleared(exercise.id);
                              }
                            }}
                          />
                        </motion.div>
                      </>
                    ) : null}
                  </>
                ) : null}

                {learningFocus && (exercise.lang === "sql" || exercise.lang === "csharp" || exercise.lang === "bash") ? (
                  <motion.div variants={streamChild} aria-hidden style={ruleStyle} />
                ) : null}

                {exercise && !learningFocus ? (
                  <>
                    <motion.div
                      variants={streamChild}
                      style={{
                        padding: learningFocus ? "var(--nx-space-8) 0" : "var(--nx-space-8) 0",
                        display: "flex",
                        flexDirection: "column",
                        gap: exercise.coachLine ? "var(--nx-space-12)" : 0,
                      }}
                    >
                      {!examStrict && exercise.coachLine ? (
                        <p
                          style={{
                            margin: 0,
                            padding: "var(--nx-space-12) var(--nx-space-16)",
                            borderRadius: 16,
                            fontFamily: typography.fontSans,
                            fontSize: 24,
                            fontWeight: 720,
                            lineHeight: 1.42,
                            letterSpacing: "-0.015em",
                            color: "rgba(248, 244, 232, 0.94)",
                            background:
                              "linear-gradient(145deg, rgba(10, 16, 20, 0.88) 0%, rgba(18, 28, 24, 0.82) 100%)",
                            border: "1px solid rgba(214, 181, 111, 0.2)",
                            boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.035)",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {exercise.coachLine}
                        </p>
                      ) : null}
                      <p
                        style={{
                          margin: 0,
                          fontFamily: typography.fontSans,
                          fontSize: learningFocus
                            ? "clamp(1.35rem, 4.5vw, 2.2rem)"
                            : 20,
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
                      {exercise.mcOptions.map((opt, optIdx) => (
                        <LearningMcOptionRow
                          key={opt.id}
                          opt={opt}
                          optIdx={optIdx}
                          totalOpts={exercise.mcOptions.length}
                          pickedId={pickedId}
                          isBeginnerExercise={isBeginnerExercise}
                          variant="ambientPanel"
                          onPick={handleMcOption}
                          t={t}
                          hitMessageOverride={t(
                            "learningTerminal.feedbackMcHitCards"
                          )}
                          examStrict={examStrict}
                          sanitizeOptionText={edtechSanitizeText}
                        />
                      ))}
                    </motion.div>
                  </>
                ) : null}
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
                      fontSize: "clamp(24px, 2.8vw, 30px)",
                      fontWeight: typography.headingWeight,
                      lineHeight: 1.35,
                      color: typography.fg,
                    }}
                  >
                    {t(
                      "learningTerminal.pickSkillTitle",
                      "Welche Antwort passt?"
                    )}
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
                    {t(
                      "learningTerminal.pickSkillLead",
                      "Lies die Frage und wähle die beste Option unten"
                    )}
                  </p>
                </motion.div>
              </>
            )}

            {(pickedId != null || !exercise) &&
              (!learningFocus || !exercise || mission.status === "cleared") && (
              <>
                <motion.div variants={streamChild} aria-hidden style={ruleStyle} />
                <motion.div
                  variants={streamChild}
                  style={{ padding: "var(--nx-space-8) 0", display: "flex", flexDirection: "column", gap: 0 }}
                >
                  <div
                    style={{
                      fontFamily: typography.fontSans,
                      fontSize: 20,
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
                      fontSize: 20,
                      lineHeight: 1.5,
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
                    fontSize: 20,
                    fontWeight: 100,
                    letterSpacing: "0.06em",
                    color: typography.fgMuted,
                    textTransform: "uppercase",
                  }}
                >
                  Antwortoptionen unten
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
                    fontSize: 20,
                    fontWeight: 100,
                    letterSpacing: "0.1em",
                    color: "var(--nx-bone-50)",
                    textTransform: "uppercase",
                  }}
                >
                  Karten unten — weiter üben
                </motion.div>
              </>
            ) : null}
          </motion.div>
        </motion.div>
      </motion.aside>
    </>
  );
}

export default LearningTerminal;
