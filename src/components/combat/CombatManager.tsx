import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  LayoutGroup,
  motion,
  animate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { BossStage } from "./BossStage";
import EnvironmentBackdrop from "./EnvironmentBackdrop";
import { LoreOverlay } from "./LoreOverlay";
import { PostProcessing } from "./PostProcessing";
import AchievementOverlay from "./AchievementOverlay";
import HUD from "./HUD";
import ActiveBoostsHUD from "./ActiveBoostsHUD";
import { GameDebugPanel } from "../debug/GameDebugPanel";
import { SkillBar } from "./SkillBar";
import BossHealthBar from "./BossHealthBar";
import VictoryStats from "./VictoryStats";
import { VictoryScreen } from "./VictoryScreen";
import ArtifactGallery from "../gallery/ArtifactGallery";
import {
  useCombatController,
  type ExternalCombatState,
} from "../../lib/combat/useCombatController";
import type { LearningField } from "../../data/nexusRegistry";
import { useGameStore } from "../../store/useGameStore";
import { useShallow } from "zustand/react/shallow";
import { useBossAudioEngine } from "../../lib/audio/bossAudioEngine";
import type { AchievementType } from "../../data/achievementRegistry";
import { useBossAI } from "../../lib/combat/useBossAI";
import { VictoryFinisher } from "./VictoryFinisher";
import { LootEruption } from "./LootEruption";
import { LootDetailOverlay } from "./LootDetailOverlay";
import ShieldOverlay from "./ShieldOverlay";
import FlowIndicator from "./FlowIndicator";
import { TutorialCombatOverlay } from "./TutorialCombatOverlay";
import { LearningTerminal } from "./LearningTerminal";
import { SourceMirror } from "./SourceMirror";
import {
  playImpactVibration,
  playParryVibration,
} from "../../lib/combat/vibrationEngine";
import { SECTOR_ZERO_ORIGIN_LORE } from "../../lib/dailyIncursion";
import { AssetDataStreamOverlay } from "./AssetDataStreamOverlay";
import { LogicFlow } from "./LogicFlow";

const CAMERA_FLOW_SPRING = { stiffness: 52, damping: 15, mass: 1.08 };

function DynamicFlowCameraRig({
  synapticFlow,
  impactFrameToken,
  children,
}: {
  synapticFlow: number;
  impactFrameToken: number;
  children: ReactNode;
}) {
  const flowTarget = useMotionValue(1);
  const flowSpring = useSpring(flowTarget, CAMERA_FLOW_SPRING);
  const bump = useMotionValue(0);
  const totalScale = useTransform([flowSpring, bump], (latest: number[]) => {
    const [a, b] = latest;
    return Math.min(1.128, Math.max(0.94, a + b));
  });

  useEffect(() => {
    flowTarget.set(1 + (synapticFlow / 100) * 0.071);
  }, [synapticFlow, flowTarget]);

  const lastImp = useRef(0);
  useEffect(() => {
    if (impactFrameToken === 0 || impactFrameToken === lastImp.current) return;
    lastImp.current = impactFrameToken;
    bump.set(0.058);
    void animate(bump, 0, { type: "spring", stiffness: 420, damping: 26 });
  }, [impactFrameToken, bump]);

  return (
    <motion.div
      style={{
        scale: totalScale,
        transformOrigin: "center center",
        width: "100%",
        position: "relative",
        willChange: "transform",
      }}
    >
      {children}
    </motion.div>
  );
}

type CombatManagerProps = {
  currentLF?: LearningField;
  gameState?: ExternalCombatState;
  className?: string;
  onCombatUnlocked?: () => void;
  onLootScreenReady?: () => void;
  /** Kurz nach Map-Dive: gemeinsames layoutId mit Sektor-Knoten */
  diveLayoutBridgeLf?: number | null;
};

export function CombatManager({
  currentLF,
  gameState,
  className,
  onCombatUnlocked,
  onLootScreenReady,
  diveLayoutBridgeLf = null,
}: CombatManagerProps) {
  const storeSlice = useGameStore(
    useShallow((state) => ({
      activeLF: state.activeLF,
      playerHP: state.playerHP,
      maxPlayerHP: state.maxPlayerHP,
      gameState: state.gameState,
      chromaticIntensity: state.chromaticIntensity,
      vignetteStrength: state.vignetteStrength,
      timeScaleOverride: state.timeScaleOverride,
      particleDensity: state.particleDensity,
      activePreset: state.activePreset,
      cameraZoom: state.cameraZoom,
      cameraShake: state.cameraShake,
      currentBossHP: state.currentBossHP,
      maxBossHP: state.maxBossHP,
      dataBleedFragments: state.dataBleedFragments,
      criticalHitToken: state.criticalHitToken,
      isCriticalPhase: state.isCriticalPhase,
      startTime: state.startTime,
      totalDamageDealt: state.totalDamageDealt,
      missedSkills: state.missedSkills,
      accuracyRate: state.accuracyRate,
      timeGrade: state.timeGrade,
      combatRank: state.combatRank,
      unlockedAchievements: state.unlockedAchievements,
      overlayOpenState: state.overlayOpenState,
      bossAggressionLevel: state.bossAggressionLevel,
      bossAdaptivePulseToken: state.bossAdaptivePulseToken,
      currentCombatPhase: state.currentCombatPhase,
      isTransitioning: state.isTransitioning,
      combatPhaseTransitionToken: state.combatPhaseTransitionToken,
      isFinisherActive: state.isFinisherActive,
      victoryFinisherPhase: state.victoryFinisherPhase,
      victoryFinisherComplete: state.victoryFinisherComplete,
      isLootErupting: state.isLootErupting,
      identifiedSkillId: state.identifiedSkillId,
      activeCombatAnomaly: state.activeCombatAnomaly,
      bossEvolutionTimeScale: state.bossEvolutionTimeScale,
      synapticOverloadActive: state.synapticOverloadActive,
      synapticOverloadToken: state.synapticOverloadToken,
      synapticFlow: state.synapticFlow,
      sentinelAbsorbToken: state.sentinelAbsorbToken,
      isSingularityActive: state.isSingularityActive,
      impactFrameToken: state.impactFrameToken,
      isTutorialCombatRun: state.isTutorialCombatRun,
      combatTutorialStep: state.combatTutorialStep,
      endlessAwaitingBossSpawn: state.endlessAwaitingBossSpawn,
      endlessDeepDiveActive: state.endlessDeepDiveActive,
      combatIntroNonce: state.combatIntroNonce,
      activeCombatIsSectorZero: state.activeCombatIsSectorZero,
      sectorZeroMorphLf: state.sectorZeroMorphLf,
      sectorZeroMorphToken: state.sectorZeroMorphToken,
      examPresentationMode: state.examPresentationMode,
      examLogicFlowToken: state.examLogicFlowToken,
      learningMentorStreak: state.learningMentorStreak,
      learningMentorColdToken: state.learningMentorColdToken,
    }))
  );
  const clearAchievementBuffer = useGameStore((state) => state.clearAchievementBuffer);
  const consumeNextAchievement = useGameStore((state) => state.consumeNextAchievement);
  const setOverlayOpenState = useGameStore((state) => state.setOverlayOpenState);
  const sourceMirrorSkillId = useGameStore((s) => s.sourceMirrorSkillId);
  const setSourceMirrorSkill = useGameStore((s) => s.setSourceMirrorSkill);
  const triggerCriticalSlowMo = useGameStore((state) => state.triggerCriticalSlowMo);
  const {
    playAchievementStinger,
    playGrandSlamIntroStinger,
    playShieldBreak,
    playScannerChirp,
    playParryPing,
    playImpactFrameBlip,
  } = useBossAudioEngine();
  const impactFrameTokenGlobal = useGameStore((s) => s.impactFrameToken);
  const lastImpactAudioRef = useRef(0);
  const shieldShatterToken = useGameStore((s) => s.shieldShatterToken);
  const bossStrategyScanToken = useGameStore((s) => s.bossStrategyScanToken);
  const parryFeedbackToken = useGameStore((s) => s.parryFeedbackToken);
  const prevScanTokenRef = useRef(0);
  useBossAI();

  const impactFrameVariant = useGameStore((s) => s.impactFrameVariant);
  useEffect(() => {
    if (
      impactFrameTokenGlobal === 0 ||
      impactFrameTokenGlobal === lastImpactAudioRef.current
    ) {
      return;
    }
    lastImpactAudioRef.current = impactFrameTokenGlobal;
    if (impactFrameVariant === "parry") {
      playParryVibration();
    } else {
      playImpactVibration();
    }
    void playImpactFrameBlip();
  }, [impactFrameTokenGlobal, impactFrameVariant, playImpactFrameBlip]);

  const effectiveLF = useMemo(() => {
    if (currentLF) return currentLF;
    if (storeSlice.activeCombatIsSectorZero || storeSlice.activeLF === 0) {
      return `LF${storeSlice.sectorZeroMorphLf}` as LearningField;
    }
    return `LF${storeSlice.activeLF}` as LearningField;
  }, [
    currentLF,
    storeSlice.activeLF,
    storeSlice.activeCombatIsSectorZero,
    storeSlice.sectorZeroMorphLf,
  ]);

  const { tokens, nexusEntry } = useCombatController({
    currentLF: effectiveLF,
    gameState,
    autoStartTheme: true,
  });

  const assetStreamLines = useMemo(() => {
    const e = nexusEntry;
    const lines = [
      e.bossVisual.primaryPath,
      ...e.bossVisual.fallbackPaths,
      e.loot.itemPath,
      e.phase2ThemePath,
      e.audio.trackPath,
      e.audio.victoryPath,
      e.audio.lootRevealPath,
      "/manifest.webmanifest",
      "/src/data/nexusRegistry.ts",
      "/src/lib/learning/learningRegistry.ts",
    ];
    return lines.filter(Boolean);
  }, [nexusEntry]);

  const [loreVisible, setLoreVisible] = useState(true);
  const [bossVisible, setBossVisible] = useState(false);
  const [combatUnlocked, setCombatUnlocked] = useState(false);
  const [lootReady, setLootReady] = useState(false);
  const [lootGlowReady, setLootGlowReady] = useState(false);
  const [showVictoryStats, setShowVictoryStats] = useState(false);
  const [showAchievementOverlay, setShowAchievementOverlay] = useState(false);
  const [activeAchievement, setActiveAchievement] = useState<AchievementType | null>(null);
  const [comboStep, setComboStep] = useState(0);
  const [victoryFlashToken, setVictoryFlashToken] = useState(0);
  const combatCaptureRef = useRef<HTMLDivElement>(null);
  const pendingVictoryStatsRef = useRef(false);

  useEffect(() => {
    setLoreVisible(true);
    setBossVisible(false);
    setCombatUnlocked(false);
    setLootReady(false);
    setLootGlowReady(false);
    setShowVictoryStats(false);
    setShowAchievementOverlay(false);
    setActiveAchievement(null);
    setComboStep(0);
    setVictoryFlashToken(0);
    setOverlayOpenState("NONE");
    clearAchievementBuffer();

    // Phase 1: Lore focus
    const showBossTimer = window.setTimeout(() => {
      setBossVisible(true);
      setCombatUnlocked(true);
      onCombatUnlocked?.();
    }, 3000);

    // Phase 2: Lore auto-fade (hard requirement: 4s)
    const loreFadeTimer = window.setTimeout(() => {
      setLoreVisible(false);
    }, 4000);

    return () => {
      window.clearTimeout(showBossTimer);
      window.clearTimeout(loreFadeTimer);
    };
  }, [storeSlice.combatIntroNonce, onCombatUnlocked, clearAchievementBuffer, setOverlayOpenState]);

  useEffect(() => {
    if (!storeSlice.activeCombatIsSectorZero) return;
    if (storeSlice.gameState !== "FIGHTING" && storeSlice.gameState !== "STARTING") return;
    const id = window.setInterval(() => {
      useGameStore.getState().applySectorZeroMorphTick();
    }, 30000);
    return () => window.clearInterval(id);
  }, [storeSlice.activeCombatIsSectorZero, storeSlice.gameState]);

  useEffect(() => {
    if (!tokens.isVictory) {
      pendingVictoryStatsRef.current = false;
      setLootReady(false);
      setLootGlowReady(false);
      setShowVictoryStats(false);
      setShowAchievementOverlay(false);
      setActiveAchievement(null);
      setComboStep(0);
      return;
    }
    if (
      !storeSlice.victoryFinisherComplete ||
      storeSlice.isLootErupting ||
      storeSlice.endlessAwaitingBossSpawn
    ) {
      setLootReady(false);
      setLootGlowReady(false);
      setShowVictoryStats(false);
      setShowAchievementOverlay(false);
      setActiveAchievement(null);
      setComboStep(0);
      return;
    }
    setLootReady(true);
    setShowAchievementOverlay(false);
    const glowTimer = window.setTimeout(() => {
      setLootGlowReady(true);
    }, 1500);
    const sequenceStarter = window.setTimeout(() => {
      if (storeSlice.combatRank !== "S") return;
      const queue: AchievementType[] = [];
      let next = consumeNextAchievement();
      while (next) {
        queue.push(next);
        next = consumeNextAchievement();
      }
      const isGrandSlam = queue.length >= 3;
      if (isGrandSlam) {
        void playGrandSlamIntroStinger();
      }
      const baseOffset = isGrandSlam ? 400 : 0;
      queue.forEach((achievementType, idx) => {
        const showAt = baseOffset + idx * 4800;
        const hideAt = showAt + 4000;
        window.setTimeout(() => {
          setActiveAchievement(achievementType);
          setShowAchievementOverlay(true);
          setComboStep(idx + 1);
          void playAchievementStinger(idx);
        }, showAt);
        window.setTimeout(() => {
          setShowAchievementOverlay(false);
          setActiveAchievement(null);
        }, hideAt);
      });
    }, 1850);
    const sequenceCount = storeSlice.combatRank === "S" ? storeSlice.unlockedAchievements.length : 0;
    const statsDelay =
      3500 + sequenceCount * 4800 + (sequenceCount >= 3 && storeSlice.combatRank === "S" ? 400 : 0);
    const statsTimer = window.setTimeout(() => {
      if (useGameStore.getState().identifiedSkillId) {
        pendingVictoryStatsRef.current = true;
        return;
      }
      setShowVictoryStats(true);
    }, statsDelay);
    return () => {
      window.clearTimeout(glowTimer);
      window.clearTimeout(sequenceStarter);
      window.clearTimeout(statsTimer);
    };
  }, [
    tokens.isVictory,
    storeSlice.victoryFinisherComplete,
    storeSlice.isLootErupting,
    storeSlice.endlessAwaitingBossSpawn,
    storeSlice.combatRank,
    storeSlice.unlockedAchievements.length,
    consumeNextAchievement,
    playAchievementStinger,
    playGrandSlamIntroStinger,
  ]);

  useEffect(() => {
    if (
      !tokens.isVictory ||
      !storeSlice.victoryFinisherComplete ||
      storeSlice.isLootErupting ||
      storeSlice.endlessDeepDiveActive
    ) {
      return;
    }
    if (storeSlice.identifiedSkillId || !pendingVictoryStatsRef.current) return;
    pendingVictoryStatsRef.current = false;
    setShowVictoryStats(true);
  }, [
    tokens.isVictory,
    storeSlice.victoryFinisherComplete,
    storeSlice.isLootErupting,
    storeSlice.identifiedSkillId,
    storeSlice.endlessDeepDiveActive,
  ]);

  useEffect(() => {
    if (!storeSlice.criticalHitToken) return;
    triggerCriticalSlowMo();
  }, [storeSlice.criticalHitToken, triggerCriticalSlowMo]);

  useEffect(() => {
    if (shieldShatterToken <= 0) return;
    void playShieldBreak();
  }, [shieldShatterToken, playShieldBreak]);

  useEffect(() => {
    if (bossStrategyScanToken > prevScanTokenRef.current) {
      void playScannerChirp();
    }
    prevScanTokenRef.current = bossStrategyScanToken;
  }, [bossStrategyScanToken, playScannerChirp]);

  const prevParryTokenRef = useRef(0);
  useEffect(() => {
    if (parryFeedbackToken > prevParryTokenRef.current) {
      void playParryPing();
    }
    prevParryTokenRef.current = parryFeedbackToken;
  }, [parryFeedbackToken, playParryPing]);

  const stageTimeScale = useMemo(() => {
    const glitchMul = storeSlice.activeCombatAnomaly === "GLITCH_STORM" ? 1.16 : 1;
    const base = Math.max(
      0.5,
      Math.min(1.32, (tokens.slowMotionActive ? 0.62 : 1) * storeSlice.timeScaleOverride * glitchMul)
    );
    const overloadMul = storeSlice.synapticOverloadActive ? 0.52 : 1;
    return Math.max(
      0.42,
      Math.min(1.55, base * storeSlice.bossEvolutionTimeScale * overloadMul)
    );
  }, [
    tokens.slowMotionActive,
    storeSlice.timeScaleOverride,
    storeSlice.activeCombatAnomaly,
    storeSlice.bossEvolutionTimeScale,
    storeSlice.synapticOverloadActive,
  ]);
  const playerHpRatio = useMemo(
    () =>
      storeSlice.maxPlayerHP > 0
        ? storeSlice.playerHP / storeSlice.maxPlayerHP
        : 1,
    [storeSlice.playerHP, storeSlice.maxPlayerHP]
  );

  return (
    <div
      className={className}
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      <div
        ref={combatCaptureRef}
        className={`nexus-combat-capture${
          storeSlice.isFinisherActive || storeSlice.isLootErupting
            ? " nexus-cine-input-lock"
            : ""
        }`}
        data-nexus-loot-extraction={storeSlice.isLootErupting ? "1" : undefined}
        aria-busy={storeSlice.isLootErupting || undefined}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
        }}
      >
      <HUD />
      <TutorialCombatOverlay
        visible={
          storeSlice.isTutorialCombatRun &&
          storeSlice.combatTutorialStep < 3 &&
          combatUnlocked &&
          (storeSlice.gameState === "FIGHTING" || storeSlice.gameState === "STARTING")
        }
        step={storeSlice.combatTutorialStep}
      />
      <FlowIndicator />
      <LearningTerminal
        currentLF={effectiveLF}
        combatPhase={storeSlice.currentCombatPhase}
        semantic={nexusEntry.combatPalette.semantic}
        sectorZero={storeSlice.activeCombatIsSectorZero}
        morphLf={
          storeSlice.activeCombatIsSectorZero ? storeSlice.sectorZeroMorphLf : null
        }
        visible={
          combatUnlocked &&
          !tokens.isVictory &&
          !loreVisible &&
          (storeSlice.gameState === "FIGHTING" || storeSlice.gameState === "STARTING")
        }
      />
      <ArtifactGallery
        visible={storeSlice.overlayOpenState !== "NONE"}
        onClose={() => setOverlayOpenState("NONE")}
      />
      <SourceMirror
        skillId={sourceMirrorSkillId}
        onClose={() => setSourceMirrorSkill(null)}
      />

      {bossVisible && (
        <motion.div
          animate={{
            scale: tokens.isVictory
              ? [storeSlice.cameraZoom, 1.06, 1]
              : storeSlice.cameraZoom,
            x:
              storeSlice.cameraShake > 0
                ? [0, -12, 12, -9, 9, -6, 0]
                : 0,
            y:
              storeSlice.cameraShake > 0
                ? [0, 5, -4, 3, -2, 0]
                : 0,
          }}
          transition={{
            scale: tokens.isVictory
              ? { duration: 0.9, ease: "easeOut" }
              : { duration: 0.2, ease: "easeOut" },
            x: { duration: 0.2, ease: "easeInOut" },
            y: { duration: 0.2, ease: "easeInOut" },
          }}
          style={{
            transformOrigin: "center center",
            willChange: "transform",
            position: "relative",
            width: "100%",
            minHeight: "min(72vh, 640px)",
          }}
        >
          <DynamicFlowCameraRig
            synapticFlow={storeSlice.synapticFlow}
            impactFrameToken={storeSlice.impactFrameToken}
          >
            <EnvironmentBackdrop
              currentCombatPhase={storeSlice.currentCombatPhase}
              isTransitioning={storeSlice.isTransitioning}
              cameraShake={storeSlice.cameraShake}
              combatPhaseTransitionToken={storeSlice.combatPhaseTransitionToken}
              isSingularityActive={storeSlice.isSingularityActive}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <BossStage
                key={
                  storeSlice.activeCombatIsSectorZero
                    ? `${tokens.entryToken}-${storeSlice.sectorZeroMorphToken}`
                    : tokens.entryToken
                }
                currentLF={effectiveLF}
                entryToken={tokens.entryToken}
                damagePulseToken={tokens.damagePulseToken}
                skillVfxToken={tokens.skillVfxToken}
                activeSkillVfx={tokens.activeSkillVfx}
                isVictory={tokens.isVictory}
                timeScale={stageTimeScale}
                particleDensity={storeSlice.particleDensity}
                adaptivePulseToken={storeSlice.bossAdaptivePulseToken}
                bossAggressionLevel={storeSlice.bossAggressionLevel}
                criticalHitToken={storeSlice.criticalHitToken}
                cameraZoom={storeSlice.cameraZoom}
                currentCombatPhase={storeSlice.currentCombatPhase}
                isTransitioning={storeSlice.isTransitioning}
                combatPhaseTransitionToken={storeSlice.combatPhaseTransitionToken}
                diveLayoutBridgeActive={diveLayoutBridgeLf != null}
              />
            </div>
          </DynamicFlowCameraRig>
        </motion.div>
      )}

      <LoreOverlay
        currentLF={effectiveLF}
        lore={
          storeSlice.activeCombatIsSectorZero ? SECTOR_ZERO_ORIGIN_LORE : nexusEntry.lore
        }
        protocolHeading={
          storeSlice.activeCombatIsSectorZero
            ? "Sektor Ø · Shape-Shifter-Protokoll"
            : undefined
        }
        visible={loreVisible}
      />

      <AssetDataStreamOverlay visible={!bossVisible} lines={assetStreamLines} />

      <div
        data-nx-learning-dim-chrome="1"
        style={{
          position: "absolute",
          top: "34px",
          left: 0,
          right: 0,
          zIndex: 48,
          pointerEvents: "none",
        }}
      >
        <BossHealthBar
          currentBossHP={storeSlice.currentBossHP}
          maxBossHP={storeSlice.maxBossHP}
          damagePulseToken={tokens.damagePulseToken}
          primaryColor={nexusEntry.combatPalette.primary}
          accentColor={nexusEntry.combatPalette.accent}
          fragmentBurstCount={storeSlice.dataBleedFragments}
          cameraZoom={storeSlice.cameraZoom}
          isCriticalPhase={storeSlice.isCriticalPhase}
        />
      </div>

      {tokens.isVictory && lootReady && !storeSlice.endlessAwaitingBossSpawn && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.92 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            boxShadow: lootGlowReady
              ? "0 0 56px rgba(0,255,255,0.65)"
              : "0 0 22px rgba(0,255,255,0.22)",
          }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          style={{
            position: "absolute",
            right: "4%",
            bottom: "10%",
            width: "124px",
            height: "124px",
            borderRadius: "14px",
            overflow: "hidden",
            border: "1px solid rgba(34, 211, 238, 0.65)",
            background: "rgba(3, 18, 27, 0.94)",
            boxShadow: "0 0 36px rgba(0,255,255,0.38)",
          }}
        >
          <img
            src={nexusEntry.loot.itemPath}
            alt={`Loot ${effectiveLF}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              mixBlendMode: "screen",
            }}
          />
        </motion.div>
      )}

      {tokens.isVictory && showVictoryStats && !storeSlice.identifiedSkillId && (
        <VictoryScreen>
          <VictoryStats
            elapsedSec={
              storeSlice.startTime > 0
                ? (Date.now() - storeSlice.startTime) / 1000
                : 0
            }
            totalDamage={storeSlice.totalDamageDealt}
            missedSkills={storeSlice.missedSkills}
            accuracyRate={storeSlice.accuracyRate}
            timeGrade={storeSlice.timeGrade}
            rank={storeSlice.combatRank}
            victoryQuote={nexusEntry.victoryQuote}
            embeddedInVictoryScreen
            onRankReveal={() => {
              if (storeSlice.combatRank === "S") {
                setVictoryFlashToken((n) => n + 1);
              }
            }}
            onContinue={onLootScreenReady}
          />
        </VictoryScreen>
      )}

      <AchievementOverlay
        visible={tokens.isVictory && showAchievementOverlay}
        type={activeAchievement}
        isGrandSlam={storeSlice.unlockedAchievements.length >= 3}
        comboCount={storeSlice.unlockedAchievements.length}
        comboStep={comboStep}
      />

      {!combatUnlocked && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at center, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.68) 68%)",
          }}
        />
      )}

      {combatUnlocked && !tokens.isVictory && <ShieldOverlay />}

      <PostProcessing
        playerHpRatio={playerHpRatio}
        hitPulseToken={tokens.damagePulseToken}
        chromaticIntensity={
          storeSlice.chromaticIntensity +
          storeSlice.cameraShake * 0.35 +
          (storeSlice.synapticOverloadActive ? 0.95 : 0)
        }
        vignetteStrength={storeSlice.vignetteStrength}
        presetId={storeSlice.activePreset}
        victoryFlashToken={victoryFlashToken}
        bossAggressionLevel={storeSlice.bossAggressionLevel}
        finisherFreezeActive={storeSlice.victoryFinisherPhase === "freeze"}
        synapticOverloadToken={storeSlice.synapticOverloadToken}
        synapticOverloadActive={storeSlice.synapticOverloadActive}
        synapticFlow={storeSlice.synapticFlow}
        sentinelAbsorbToken={storeSlice.sentinelAbsorbToken}
        isSingularityActive={storeSlice.isSingularityActive}
        impactFrameToken={storeSlice.impactFrameToken}
        learningAscensionMix={Math.min(1, storeSlice.learningMentorStreak / 9)}
        learningMentorColdToken={storeSlice.learningMentorColdToken}
      />

      {combatUnlocked &&
        storeSlice.examPresentationMode &&
        !tokens.isVictory &&
        (storeSlice.gameState === "FIGHTING" || storeSlice.gameState === "STARTING") && (
          <LogicFlow pulseToken={storeSlice.examLogicFlowToken} />
        )}

      <LayoutGroup id="nexus-skill-hand">
        {tokens.isVictory &&
          storeSlice.victoryFinisherComplete &&
          storeSlice.isLootErupting && <LootEruption />}
        {combatUnlocked &&
          (!tokens.isVictory ||
            (storeSlice.victoryFinisherComplete &&
              !storeSlice.isLootErupting &&
              !storeSlice.endlessAwaitingBossSpawn)) && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: "86px",
                pointerEvents: "none",
                zIndex: 44,
              }}
            >
              <SkillBar />
            </div>
          )}
      </LayoutGroup>
      {combatUnlocked && !tokens.isVictory && <ActiveBoostsHUD />}
      </div>
      <VictoryFinisher captureRef={combatCaptureRef} />
      <LootDetailOverlay />
      {import.meta.env.DEV && <GameDebugPanel />}
    </div>
  );
}

export default CombatManager;
