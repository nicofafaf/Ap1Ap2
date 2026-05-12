import { lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import {
  NX_PANEL_ENTRANCE_ANIMATE,
  NX_PANEL_ENTRANCE_INITIAL,
  NX_UI_INSTANT,
  NX_UI_SPRING,
  nxHudPulseTransition,
} from "../lib/ui/textMotionPolicy";
import type { LearningField } from "../data/nexusRegistry";
import type { InitiateCombatOptions } from "../lib/dailyIncursion";
import { useGameStore } from "../store/useGameStore";
import { SectorMap } from "./navigation/SectorMap";
import { MaintenanceOverlay } from "./system/MaintenanceOverlay";
import { useNexusI18n } from "../lib/i18n/I18nProvider";

const NeuralInitializerLazy = lazy(() =>
  import("./navigation/NeuralInitializer").then((m) => ({ default: m.NeuralInitializer }))
);

const CombatManagerLazy = lazy(() =>
  import("./combat/CombatManager").then((m) => ({ default: m.CombatManager }))
);

function InitializationFallback() {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  return (
    <div
      style={{
        width: "100%",
        height: "100dvh",
        minHeight: "100dvh",
        background: "var(--nx-vantablack, #080c0a)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <motion.div
        aria-hidden
        initial={{ opacity: 0.04 }}
        animate={{ opacity: reduceMotion ? 0.06 : [0.04, 0.1, 0.06] }}
        transition={nxHudPulseTransition(reduceMotion, { duration: 2.8, ease: "easeInOut" })}
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 45% at 50% 30%, rgba(214,181,111,0.1), transparent 62%)",
          pointerEvents: "none",
        }}
      />
      <motion.div
        initial={{ opacity: 0.45, letterSpacing: "0.42em" }}
        animate={{
          opacity: reduceMotion ? 0.55 : [0.45, 0.88, 0.62],
          letterSpacing: reduceMotion ? "0.32em" : ["0.42em", "0.28em", "0.32em"],
        }}
        transition={nxHudPulseTransition(reduceMotion, { duration: 1.85, ease: "easeInOut" })}
        style={{
          position: "relative",
          zIndex: 1,
          color: "rgba(251,247,239,0.58)",
          fontFamily: "var(--nx-font-sans, system-ui)",
          fontSize: 20,
        }}
      >
        {t("shell.loading")}
      </motion.div>
    </div>
  );
}

function CombatSurfaceFallback({ label }: { label: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "100dvh",
        background: "var(--nx-vantablack, #080c0a)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <motion.div
        aria-hidden
        animate={
          reduceMotion
            ? { scale: 1, opacity: 0.12 }
            : { scale: [1, 1.02, 1], opacity: [0.08, 0.16, 0.1] }
        }
        transition={reduceMotion ? NX_UI_INSTANT : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          width: "120%",
          height: "120%",
          left: "-10%",
          top: "-10%",
          background:
            "radial-gradient(ellipse 50% 42% at 50% 50%, rgba(214,181,111,0.1), transparent 72%)",
          pointerEvents: "none",
        }}
      />
      <motion.div
        initial={{ opacity: 0.35 }}
        animate={{ opacity: reduceMotion ? 0.42 : [0.35, 0.72, 0.48] }}
        transition={nxHudPulseTransition(reduceMotion, { duration: 1.4, ease: "easeInOut" })}
        style={{
          position: "relative",
          zIndex: 1,
          color: "rgba(251,247,239,0.48)",
          fontFamily: "var(--nx-font-sans, system-ui)",
          fontSize: 20,
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </motion.div>
    </div>
  );
}

export function NexusShell() {
  const { t } = useNexusI18n();
  const reduceMotionShell = useReducedMotion();
  const [surface, setSurface] = useState<"overworld" | "combat">("overworld");
  const [diveBridgeLf, setDiveBridgeLf] = useState<number | null>(null);
  const [mapHoldCombat, setMapHoldCombat] = useState(false);
  const activeLfNum = useGameStore((s) => s.activeLF);
  const activeCombatIsSectorZero = useGameStore((s) => s.activeCombatIsSectorZero);
  const sectorZeroMorphLf = useGameStore((s) => s.sectorZeroMorphLf);
  const gameState = useGameStore((s) => s.gameState);
  const hasCompletedInitialization = useGameStore((s) => s.hasCompletedInitialization);
  const beginNeuralTrainingCombat = useGameStore((s) => s.beginNeuralTrainingCombat);
  const completeInitialization = useGameStore((s) => s.completeInitialization);
  const initiateCombat = useGameStore((s) => s.initiateCombat);
  const resetCombat = useGameStore((s) => s.resetCombat);
  const recomputeMenuSystemMood = useGameStore((s) => s.recomputeMenuSystemMood);

  const handleEngage = useCallback(
    (lf: number, opts?: InitiateCombatOptions) => {
      const hp = lf === 0 ? 128 : 100;
      initiateCombat(lf, hp, opts);
      const st = useGameStore.getState();
      const bridge = lf === 0 ? st.sectorZeroMorphLf : lf;
      setDiveBridgeLf(bridge);
      setMapHoldCombat(true);
      setSurface("combat");
    },
    [initiateCombat]
  );

  const handleBeginTraining = useCallback(() => {
    beginNeuralTrainingCombat();
    setDiveBridgeLf(1);
    setMapHoldCombat(true);
    setSurface("combat");
  }, [beginNeuralTrainingCombat]);

  const handleOpenOverview = useCallback(() => {
    completeInitialization();
    resetCombat();
    recomputeMenuSystemMood();
    setDiveBridgeLf(null);
    setMapHoldCombat(false);
    setSurface("overworld");
  }, [completeInitialization, resetCombat, recomputeMenuSystemMood]);

  const handleBeginLearningField = useCallback(
    (lf: number) => {
      completeInitialization();
      handleEngage(lf);
    },
    [completeInitialization, handleEngage]
  );

  useEffect(() => {
    if (surface !== "combat" || !mapHoldCombat) return;
    const t1 = window.setTimeout(() => setDiveBridgeLf(null), 1000);
    const t2 = window.setTimeout(() => setMapHoldCombat(false), 1200);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [surface, mapHoldCombat]);

  /** Kampf-Chunk im Leerlauf vorwärmen — kürzerer Fallback beim ersten Dive */
  useEffect(() => {
    if (surface === "combat") return;
    let idleId = 0;
    let timeoutId = 0;
    const run = () => {
      void import("./combat/CombatManager");
    };
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(run, { timeout: 4500 });
    } else {
      timeoutId = window.setTimeout(run, 1800);
    }
    return () => {
      if (idleId) window.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [surface]);

  const handleExitCombat = useCallback(() => {
    const s = useGameStore.getState();
    if (s.isTutorialCombatRun) {
      completeInitialization();
    }
    resetCombat();
    recomputeMenuSystemMood();
    setDiveBridgeLf(null);
    setMapHoldCombat(false);
    setSurface("overworld");
  }, [completeInitialization, resetCombat, recomputeMenuSystemMood]);

  const lfKey =
    activeLfNum === 0 || activeCombatIsSectorZero
      ? (`LF${Math.max(1, Math.min(12, sectorZeroMorphLf))}` as LearningField)
      : (`LF${Math.max(1, Math.min(12, activeLfNum))}` as LearningField);

  /** Erstkontakt-Sequenz nur im Leerlauf — sobald Trainingskampf startet, dieselbe Shell wie nach Init */
  const showNeuralIntroOnly = !hasCompletedInitialization && gameState === "IDLE";

  if (showNeuralIntroOnly) {
    return (
      <div style={{ width: "100%", height: "100%", minHeight: "100dvh", overflow: "hidden" }}>
        <Suspense fallback={<InitializationFallback />}>
          <NeuralInitializerLazy
            onBeginTraining={handleBeginTraining}
            onOpenOverview={handleOpenOverview}
            onBeginLearningField={handleBeginLearningField}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", minHeight: "100dvh", overflow: "hidden" }}>
      <LayoutGroup id="nexus-dive-bridge">
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            minHeight: "100dvh",
            overflow: "hidden",
          }}
        >
          <motion.div
            key={surface}
            initial={NX_PANEL_ENTRANCE_INITIAL}
            animate={NX_PANEL_ENTRANCE_ANIMATE}
            transition={reduceMotionShell ? NX_UI_INSTANT : NX_UI_SPRING}
            style={{
              position: "absolute",
              inset: 0,
              transformOrigin: "50% 50%",
            }}
          >
            {(surface === "overworld" || mapHoldCombat) && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: surface === "overworld" ? 1 : 0,
                  opacity: surface === "overworld" ? 1 : 0,
                  pointerEvents: surface === "overworld" ? "auto" : "none",
                  transition: "opacity 0.38s ease",
                }}
              >
                <SectorMap
                  onEngage={handleEngage}
                  layoutBridgeLf={diveBridgeLf}
                  seamlessEngage
                />
              </div>
            )}
            {surface === "combat" && (
              <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>
                <Suspense fallback={<CombatSurfaceFallback label={t("shell.loading")} />}>
                  <CombatManagerLazy
                    key="nexus-combat-session"
                    currentLF={lfKey}
                    diveLayoutBridgeLf={diveBridgeLf}
                    onLootScreenReady={handleExitCombat}
                  />
                </Suspense>
              </div>
            )}
          </motion.div>
        </div>
      </LayoutGroup>
      <MaintenanceOverlay />
    </div>
  );
}

export default NexusShell;
