import { useEffect, useMemo, useRef, useState } from "react";
import type { LearningField } from "../../data/nexusRegistry";
import { useNexusAssetProvider } from "../assets/nexusAssetProvider";
import { useBossAudioEngine } from "../audio/bossAudioEngine";
import { useGameStore } from "../../store/useGameStore";
import { useShallow } from "zustand/react/shallow";
import type { SkillVfx } from "../../data/skillRegistry";

/**
 * Reagiert auf Store-Tokens (entry, Treffer, Finisher, VFX), damit Audio und HUD
 * nicht mit Polling laufen — jede Zustandsänderung feuert gezielt Effekte und spart Arbeit pro Frame
 */
export type CombatPhase = "idle" | "lore" | "spawn" | "combat" | "victory";

export interface ExternalCombatState {
  phase?: CombatPhase;
  bossSpawnToken?: number | string;
  bossHitToken?: number | string;
  isBossDefeated?: boolean;
  isFinalStrike?: boolean;
}

type UseCombatControllerParams = {
  currentLF: LearningField;
  gameState?: ExternalCombatState;
  autoStartTheme?: boolean;
};

export const useCombatController = ({
  currentLF,
  gameState,
  autoStartTheme = true,
}: UseCombatControllerParams) => {
  const nexusEntry = useNexusAssetProvider(currentLF);
  const { startBossTheme, stopCurrent, playVictory, playLootRevealOneShot } =
    useBossAudioEngine();
  const triggerImpactZoom = useGameStore((state) => state.triggerImpactZoom);
  const calculateRank = useGameStore((state) => state.calculateRank);

  const [entryCounter, setEntryCounter] = useState(0);
  const [damageCounter, setDamageCounter] = useState(0);
  const [isVictory, setIsVictory] = useState(false);
  const [slowMotionActive, setSlowMotionActive] = useState(false);
  const [skillVfxCounter, setSkillVfxCounter] = useState(0);
  const [activeSkillVfx, setActiveSkillVfx] = useState<SkillVfx | null>(null);

  const storeSlice = useGameStore(
    useShallow((state) => ({
      currentBossHP: state.currentBossHP,
      gameState: state.gameState,
      entryToken: state.entryToken,
      damagePulseToken: state.damagePulseToken,
      finalStrikeToken: state.finalStrikeToken,
      skillVfxToken: state.skillVfxToken,
      activeSkillVfx: state.activeSkillVfx,
    }))
  );
  const entryTokenForReset = useGameStore((state) => state.entryToken);

  const resolvedState: ExternalCombatState = useMemo(() => {
    if (gameState) return gameState;
    return {
      phase:
        storeSlice.gameState === "STARTING"
          ? "spawn"
          : storeSlice.gameState === "FIGHTING"
          ? "combat"
          : storeSlice.gameState === "VICTORY"
          ? "victory"
          : "idle",
      bossSpawnToken: storeSlice.entryToken,
      bossHitToken: storeSlice.damagePulseToken,
      isBossDefeated:
        storeSlice.gameState === "VICTORY" || storeSlice.currentBossHP <= 0,
      isFinalStrike: storeSlice.finalStrikeToken > 0,
    };
  }, [gameState, storeSlice]);

  const prevSpawnToken = useRef<number | string | undefined>(undefined);
  const prevHitToken = useRef<number | string | undefined>(undefined);
  const prevDefeated = useRef(false);
  const prevFinalStrike = useRef(false);
  const prevSkillVfxToken = useRef(0);

  useEffect(() => {
    setIsVictory(false);
    setSlowMotionActive(false);
    prevDefeated.current = false;
    prevFinalStrike.current = false;
  }, [entryTokenForReset]);

  useEffect(() => {
    if (
      storeSlice.gameState === "FIGHTING" &&
      storeSlice.currentBossHP > 0 &&
      isVictory
    ) {
      setIsVictory(false);
    }
  }, [storeSlice.gameState, storeSlice.currentBossHP, isVictory]);

  useEffect(() => {
    const spawnSignal = resolvedState.bossSpawnToken;
    const phaseSpawn = resolvedState.phase === "spawn";
    const shouldSpawn =
      phaseSpawn ||
      (spawnSignal !== undefined && spawnSignal !== prevSpawnToken.current);

    if (!shouldSpawn) return;

    prevSpawnToken.current = spawnSignal;
    setEntryCounter((n) => n + 1);
    setIsVictory(false);
    if (autoStartTheme) {
      void startBossTheme(nexusEntry.audio.trackPath, 2);
    }
  }, [
    autoStartTheme,
    resolvedState.bossSpawnToken,
    resolvedState.phase,
    nexusEntry,
    startBossTheme,
  ]);

  useEffect(() => {
    const hitSignal = resolvedState.bossHitToken;
    const isNewHit =
      hitSignal !== undefined && hitSignal !== prevHitToken.current;
    if (!isNewHit) return;
    prevHitToken.current = hitSignal;
    setDamageCounter((n) => n + 1);
    triggerImpactZoom();
  }, [resolvedState.bossHitToken, triggerImpactZoom]);

  useEffect(() => {
    const defeated = Boolean(
      resolvedState.isBossDefeated || resolvedState.phase === "victory"
    );
    if (!defeated || prevDefeated.current) return;

    prevDefeated.current = true;
    setIsVictory(true);
    if (!useGameStore.getState().endlessDeepDiveActive) {
      calculateRank();
    }
    stopCurrent(0.32);
    void (async () => {
      await new Promise((r) => setTimeout(r, 3300));
      await playVictory(nexusEntry.audio.victoryPath);
    })();
    void playLootRevealOneShot(nexusEntry.audio.lootRevealPath, 3450);
  }, [
    resolvedState.isBossDefeated,
    resolvedState.phase,
    nexusEntry,
    calculateRank,
    stopCurrent,
    playVictory,
    playLootRevealOneShot,
  ]);

  useEffect(() => {
    const finalStrike = Boolean(resolvedState.isFinalStrike);
    if (!finalStrike || prevFinalStrike.current) return;
    prevFinalStrike.current = true;
    setSlowMotionActive(true);
    const timer = window.setTimeout(() => {
      setSlowMotionActive(false);
      prevFinalStrike.current = false;
    }, 900);
    return () => {
      window.clearTimeout(timer);
    };
  }, [resolvedState.isFinalStrike]);

  useEffect(() => {
    const skillToken = storeSlice.skillVfxToken ?? 0;
    if (skillToken === prevSkillVfxToken.current) return;
    prevSkillVfxToken.current = skillToken;
    setSkillVfxCounter((n) => n + 1);
    setActiveSkillVfx(storeSlice.activeSkillVfx ?? null);
  }, [storeSlice.skillVfxToken, storeSlice.activeSkillVfx]);

  const tokens = useMemo(
    () => ({
      entryToken: entryCounter,
      damagePulseToken: damageCounter,
      isVictory,
      slowMotionActive,
      skillVfxToken: skillVfxCounter,
      activeSkillVfx,
    }),
    [
      entryCounter,
      damageCounter,
      isVictory,
      slowMotionActive,
      skillVfxCounter,
      activeSkillVfx,
    ]
  );

  return {
    tokens,
    nexusEntry,
  };
};
