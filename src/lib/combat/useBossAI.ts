import { useEffect, useRef } from "react";
import { useGameStore } from "../../store/useGameStore";
import { syncBossSpatialMotion } from "./bossSpatialMotion";
import { createSeededRandom, rollGlitchMiss } from "./anomalyProcessor";
import { MAX_PLAYER_SHIELD } from "./defenseProcessor";
import { playSingularityHeartbeatVibration } from "./vibrationEngine";

const TOP_SCORE_REFERENCE = 5200;
const OVERLOAD_SHIELD_RATIO = 0.75;
const EVOLUTION_SCALE_SMOOTH = 0.062;
const PULSE_FREQ_OVERLOAD = 1 / 1.15;

/** Phase 3 Singularity: festes hektisches Puls-Tempo (ms) */
export const SINGULARITY_PULSE_INTERVAL_MS = 680;

const SINGULARITY_HP_RATIO = 0.1;

export function useBossAI() {
  const rafRef = useRef<number | null>(null);
  const lastPulseAtRef = useRef(0);
  const lastFlowTickRef = useRef(0);
  const prevStrategyRef = useRef({ overload: false, pierce: false });
  const fightEnteredRef = useRef(false);
  const prevSingularityRef = useRef(false);

  useEffect(() => {
    const tick = (now: number) => {
      const state = useGameStore.getState();
      const lastT = lastFlowTickRef.current || now;
      lastFlowTickRef.current = now;
      const dt = Math.min(0.12, Math.max(0, (now - lastT) / 1000));
      if (state.gameState === "FIGHTING" || state.gameState === "STARTING") {
        state.tickSynapticFlowDecay(dt);
      }
      const totalArtifacts = Object.values(state.globalCollection).reduce(
        (sum, row) => sum + row.count,
        0
      );
      const userScore = totalArtifacts * 100;
      const rankPressure = Math.max(0, TOP_SCORE_REFERENCE - userScore) / TOP_SCORE_REFERENCE;
      const streakPressure = Math.min(1, state.sRankStreak / 4);
      const artifactPressure = Math.min(1, totalArtifacts / 14);
      const aggressionRaw = 1 + artifactPressure * 2.4 + streakPressure * 1.1 + rankPressure * 0.5;
      let aggression = Math.max(1, Math.min(5, aggressionRaw));
      if (state.isTutorialCombatRun) {
        aggression = Math.min(aggression, 1.2);
      }

      if (state.bossAggressionLevel !== Math.round(aggression)) {
        state.setBossAggressionLevel(Math.round(aggression));
      }

      syncBossSpatialMotion(aggressionRaw);

      const shouldResistCrit = state.sRankStreak >= 2 && totalArtifacts >= 2;
      const targetResistance = shouldResistCrit ? 0.88 : 1;
      if (
        Math.abs(state.activeCombatBoosts.criticalResistanceMultiplier - targetResistance) > 0.001
      ) {
        state.recalculateCombatBoosts();
      }

      const inFight = state.gameState === "FIGHTING";
      const singularity =
        inFight &&
        state.maxBossHP > 0 &&
        state.currentBossHP / state.maxBossHP < SINGULARITY_HP_RATIO;

      if (!inFight && prevSingularityRef.current) {
        prevSingularityRef.current = false;
        if (state.isSingularityActive) {
          useGameStore.setState({ isSingularityActive: false });
        }
      } else if (singularity && !prevSingularityRef.current) {
        prevSingularityRef.current = true;
        useGameStore.setState((s) => ({
          isSingularityActive: true,
          singularityEnteredToken: s.singularityEnteredToken + 1,
        }));
      } else if (!singularity && prevSingularityRef.current) {
        prevSingularityRef.current = false;
        useGameStore.setState({ isSingularityActive: false });
      }

      const overload =
        inFight && state.playerShield > MAX_PLAYER_SHIELD * OVERLOAD_SHIELD_RATIO;
      const pierce =
        inFight &&
        state.maxBossHP > 0 &&
        state.currentBossHP / state.maxBossHP < 0.25;

      const prev = prevStrategyRef.current;
      if (
        inFight &&
        (overload !== prev.overload || pierce !== prev.pierce)
      ) {
        prevStrategyRef.current = { overload, pierce };
        state.bumpBossStrategyScan();
      } else if (!inFight) {
        prevStrategyRef.current = { overload: false, pierce: false };
      }

      const targetEvolutionScale = inFight && overload ? 1.15 : 1;
      const curScale = state.bossEvolutionTimeScale;
      const nextScale =
        curScale + (targetEvolutionScale - curScale) * EVOLUTION_SCALE_SMOOTH;
      if (Math.abs(nextScale - curScale) > 0.0035) {
        useGameStore.setState({ bossEvolutionTimeScale: nextScale });
      }

      let pulseIntervalMs = 2600 - aggression * 360;
      if (state.isTutorialCombatRun) {
        pulseIntervalMs *= 1.55;
      }
      if (singularity) {
        pulseIntervalMs = SINGULARITY_PULSE_INTERVAL_MS;
      } else {
        if (state.activeCombatAnomaly === "GLITCH_STORM") {
          pulseIntervalMs *= 0.62;
        }
        if (overload) {
          pulseIntervalMs *= PULSE_FREQ_OVERLOAD;
        }
      }

      if (inFight) {
        if (!fightEnteredRef.current) {
          fightEnteredRef.current = true;
          lastPulseAtRef.current = now;
        }
        const nextDue = lastPulseAtRef.current + pulseIntervalMs;
        if (Math.abs(state.bossNextPulseDueAtPerf - nextDue) > 2) {
          useGameStore.setState({ bossNextPulseDueAtPerf: nextDue });
        }
      } else {
        fightEnteredRef.current = false;
        if (state.bossNextPulseDueAtPerf !== 0) {
          useGameStore.setState({ bossNextPulseDueAtPerf: 0 });
        }
      }

      if (inFight && now < state.bossPulseFreezeUntilPerf) {
        lastPulseAtRef.current = now;
      }

      if (
        inFight &&
        now >= state.bossPulseFreezeUntilPerf &&
        now - lastPulseAtRef.current >= pulseIntervalMs
      ) {
        if (state.activeCombatAnomaly === "GLITCH_STORM") {
          const rng = createSeededRandom(
            (state.anomalyRngSalt ^ Math.floor(now / 180) ^ 0xdeadbeef) >>> 0
          );
          if (!rollGlitchMiss(rng)) {
            state.triggerBossAdaptivePulse();
          }
        } else {
          state.triggerBossAdaptivePulse();
        }
        if (singularity) {
          playSingularityHeartbeatVibration();
        }
        lastPulseAtRef.current = now;
      }

      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);
}

export default useBossAI;
