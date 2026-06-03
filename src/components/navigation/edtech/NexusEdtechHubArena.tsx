import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { useNexusI18n } from "../../../lib/i18n/I18nProvider";
import {
  getHubContinueTarget,
  getHubLearningTip,
} from "../../../lib/learning/hubDashboardInsights";
import { getAllLfCourseMeta } from "../../../lib/learning/lfCourseCatalog";
import { getDailyIncursionDefinition, getUtcDateKey } from "../../../lib/dailyIncursion";
import type { NexusHubMapExtras } from "../../../lib/ui/hubMapNavigation";
import { useGameStore } from "../../../store/useGameStore";
import { EdtechHubZoneIntro, EdtechHubZoneNav } from "./EdtechHubZoneNav";
import type { EdtechHubZoneId } from "./edtechHubZones";
import { EDTECH_STAGGER, cyanAccent, goldAccent } from "./edtechHubTokens";
import "./edtechHubArena.css";
import "./edtechZoneShell.css";
import { HubZoneCcna } from "./hubZones/HubZoneCcna";
import { HubZoneCourses } from "./hubZones/HubZoneCourses";
import { HubZoneExams } from "./hubZones/HubZoneExams";
import { HubZoneHome } from "./hubZones/HubZoneHome";
import { HubZoneProgress } from "./hubZones/HubZoneProgress";
import type { HubZoneContext } from "./hubZones/hubZoneTypes";
import { StreakCelebration } from "./StreakCelebration";

export type NexusEdtechHubArenaProps = {
  activeZone: EdtechHubZoneId;
  onZoneChange: (zone: EdtechHubZoneId) => void;
  onOpenMap: () => void;
  onBeginLearningField: (lf: number) => void;
  onBeginExamField?: (lf: number) => void;
  onBlitzTraining?: () => void;
  onBeginRanked?: () => void;
  mapWithExtras: (extras: NexusHubMapExtras) => void;
};

export function NexusEdtechHubArena({
  activeZone,
  onZoneChange,
  onOpenMap,
  onBeginLearningField,
  onBeginExamField,
  onBlitzTraining,
  onBeginRanked,
  mapWithExtras,
}: NexusEdtechHubArenaProps) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();

  const playerName = useGameStore((s) => s.playerName);
  const trainingTrack = useGameStore((s) => s.trainingTrack);
  const bundeslandId = useGameStore((s) => s.bundeslandId);
  const learningCorrectByLf = useGameStore((s) => s.learningCorrectByLf);
  const nexusFragments = useGameStore((s) => s.nexusFragments);
  const dailyParticipationStreak = useGameStore((s) => s.dailyParticipationStreak);
  const unlockedSectors = useGameStore((s) => s.campaign.unlockedSectors);
  const lastEvents = useGameStore((s) => s.lastCombatLearningEvents);
  const learningLeitnerByExerciseId = useGameStore((s) => s.learningLeitnerByExerciseId);
  const streakCelebrationMilestone = useGameStore((s) => s.streakCelebrationMilestone);
  const clearStreakCelebration = useGameStore((s) => s.clearStreakCelebration);
  const beginExamForLf = useGameStore((s) => s.beginExamForLf);
  const beginSommer2026Exam = useGameStore((s) => s.beginSommer2026Exam);

  const dateKey = getUtcDateKey();
  const dailyLf = useMemo(() => getDailyIncursionDefinition(dateKey).targetLf, [dateKey]);
  const allLfMeta = useMemo(() => getAllLfCourseMeta(), []);
  const continueTarget = useMemo(
    () => getHubContinueTarget(lastEvents[0], learningCorrectByLf),
    [lastEvents, learningCorrectByLf],
  );
  const learningTip = useMemo(
    () => getHubLearningTip(learningLeitnerByExerciseId, learningCorrectByLf),
    [learningLeitnerByExerciseId, learningCorrectByLf],
  );

  const learningModes = useMemo(
    () => [
      {
        title: t("hub.edtech.modeLearn"),
        body: t("hub.edtech.modeLearnBody"),
        accent: goldAccent,
        onClick: onOpenMap,
      },
      {
        title: t("hub.edtech.modeExam"),
        body: t("hub.edtech.modeExamBody"),
        accent: "rgba(239, 68, 68, 0.92)",
        onClick: () => {
          const lf = continueTarget?.lf ?? learningTip.lf;
          if (onBeginExamField) onBeginExamField(lf);
          else beginExamForLf(lf);
        },
      },
      {
        title: t("hub.edtech.modeBlitz"),
        body: t("hub.edtech.modeBlitzBody"),
        accent: cyanAccent,
        onClick: () => onBlitzTraining?.(),
      },
      {
        title: t("hub.edtech.modeDaily"),
        body: t("hub.edtech.modeDailyBody"),
        accent: "rgba(139, 92, 246, 0.95)",
        onClick: () => mapWithExtras({ openDailyPanel: true }),
      },
      {
        title: t("hub.edtech.modeRanked"),
        body: t("hub.edtech.modeRankedBody"),
        accent: "rgba(245, 158, 11, 0.95)",
        onClick: () => onBeginRanked?.(),
      },
    ],
    [
      beginExamForLf,
      continueTarget?.lf,
      learningTip.lf,
      mapWithExtras,
      onBeginExamField,
      onBeginRanked,
      onBlitzTraining,
      onOpenMap,
      t,
    ],
  );

  const { totalCorrect, totalCurriculum } = useMemo(() => {
    let correct = 0;
    let curriculum = 0;
    for (const meta of allLfMeta) {
      correct += new Set(learningCorrectByLf[meta.lfKey] ?? []).size;
      curriculum += meta.totalExercises;
    }
    return { totalCorrect: correct, totalCurriculum: curriculum };
  }, [allLfMeta, learningCorrectByLf]);

  const lastLine = useMemo(() => {
    const ev = lastEvents[0];
    if (!ev) return t("hub.edtech.lastActivityNone");
    const title = ev.title?.trim() || ev.exerciseId;
    return `${t("hub.edtech.lastActivityLabel")} ${title}`;
  }, [lastEvents, t]);

  const coveragePct =
    totalCurriculum > 0 ? Math.min(100, Math.round((totalCorrect / totalCurriculum) * 100)) : 0;

  const ctx: HubZoneContext = {
    playerName: playerName ?? "",
    trainingTrack,
    bundeslandId,
    lastLine,
    reduceMotion: Boolean(reduceMotion),
    continueTarget,
    learningModes,
    coveragePct,
    totalCorrect,
    totalCurriculum,
    nexusFragments,
    dailyParticipationStreak,
    unlockedSectors: unlockedSectors.length,
    dailyLf,
    learningTip,
    onOpenMap,
    onBeginLearningField,
    onBeginExamField,
    onBlitzTraining,
    onBeginRanked,
    mapWithExtras,
    beginExamForLf,
    beginSommer2026Exam,
    onZoneChange,
  };

  return (
    <motion.div
      className="nx-edtech-hub-arena nx-edtech-zone-shell"
      variants={EDTECH_STAGGER}
      initial="hidden"
      animate="show"
    >
      <StreakCelebration milestone={streakCelebrationMilestone} onDismiss={clearStreakCelebration} />

      <EdtechHubZoneNav active={activeZone} onChange={onZoneChange} />
      <EdtechHubZoneIntro zone={activeZone} />

      <div className="nx-edtech-zone-viewport" aria-live="polite">
        {activeZone === "home" ? <HubZoneHome ctx={ctx} /> : null}
        {activeZone === "ccna" ? <HubZoneCcna ctx={ctx} /> : null}
        {activeZone === "exams" ? <HubZoneExams ctx={ctx} /> : null}
        {activeZone === "courses" ? <HubZoneCourses ctx={ctx} /> : null}
        {activeZone === "progress" ? <HubZoneProgress ctx={ctx} /> : null}
      </div>
    </motion.div>
  );
}
