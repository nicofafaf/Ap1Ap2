import { useEffect, useMemo, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import { MAX_PLAYER_SHIELD } from "../../lib/combat/defenseProcessor";
import { comboRankFromCount } from "../../lib/combat/flowProcessor";
import { nxHudEntranceTransition, nxHudPulseTransition } from "../../lib/ui/textMotionPolicy";
import { useGameStore } from "../../store/useGameStore";
import LeaderboardTicker from "./LeaderboardTicker";

const FILL_CLIP = "polygon(0 0, 94% 0, 100% 50%, 94% 100%, 0 100%)";

const SAFE_L = "max(var(--nx-space-32), env(safe-area-inset-left, 0px))";
const SAFE_R = "max(var(--nx-space-32), env(safe-area-inset-right, 0px))";
const SAFE_T = "max(var(--nx-space-32), env(safe-area-inset-top, 0px))";
const SAFE_B = "max(var(--nx-space-32), env(safe-area-inset-bottom, 0px))";

const MONO = "var(--nx-font-mono)";
const SANS = "var(--nx-font-sans)";

const BONE_HI = "var(--nx-bone-90)";
const BONE_MID = "var(--nx-bone-50)";
const BONE_LOW = "var(--nx-bone-25)";
const TUNGSTEN = "var(--nx-tungsten)";
const OBS = "color-mix(in srgb, var(--nx-vantablack) 82%, transparent)";

function SegmentedBarTrack({
  children,
  accent,
}: {
  children: ReactNode;
  accent: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 8,
        background: OBS,
        overflow: "hidden",
        borderBottom: `1px solid color-mix(in srgb, ${accent} 35%, transparent)`,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.12,
          background: `repeating-linear-gradient(
            90deg,
            transparent 0px,
            transparent 7px,
            var(--nx-bone-25) 7px,
            var(--nx-bone-25) 8px
          )`,
          clipPath: FILL_CLIP,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "absolute", inset: 0 }}>{children}</div>
    </div>
  );
}

export function CombatHUD() {
  const reduceMotion = useReducedMotion();
  const entrance = nxHudEntranceTransition(reduceMotion);
  const state = useGameStore(
    useShallow((s) => ({
      gameState: s.gameState,
      overlayOpenState: s.overlayOpenState,
      globalCollection: s.globalCollection,
      gallerySeenTotal: s.gallerySeenTotal,
      setOverlayOpenState: s.setOverlayOpenState,
      markGallerySeen: s.markGallerySeen,
      activeCombatAnomaly: s.activeCombatAnomaly,
      playerHP: s.playerHP,
      maxPlayerHP: s.maxPlayerHP,
      playerShield: s.playerShield,
      damagePulseToken: s.damagePulseToken,
      bossAdaptivePulseToken: s.bossAdaptivePulseToken,
      bossStrategyScanToken: s.bossStrategyScanToken,
      combatComboCount: s.combatComboCount,
      activeCombatIsDailySector: s.activeCombatIsDailySector,
      hardcoreDriftEnabled: s.hardcoreDriftEnabled,
      endlessDeepDiveActive: s.endlessDeepDiveActive,
      endlessFloor: s.endlessFloor,
    }))
  );

  const combatActive = state.gameState === "FIGHTING" || state.gameState === "STARTING";
  const endlessHud =
    state.endlessDeepDiveActive &&
    (state.gameState === "FIGHTING" ||
      state.gameState === "STARTING" ||
      state.gameState === "VICTORY");
  const hc = combatActive && state.hardcoreDriftEnabled;
  const alertMuted = "rgba(140, 52, 48, 0.92)";

  const comboRank = comboRankFromCount(state.combatComboCount);
  const rankHueBase =
    comboRank === "NEXUS"
      ? BONE_HI
      : comboRank === "S"
        ? "color-mix(in srgb, var(--nx-bone) 78%, rgb(255 214 165) 22%)"
        : comboRank === "A"
          ? BONE_HI
          : comboRank === "B"
            ? BONE_MID
            : comboRank === "C"
              ? BONE_MID
              : BONE_LOW;
  const rankHue = hc ? alertMuted : rankHueBase;

  const totalArtifacts = useMemo(
    () =>
      Object.values(state.globalCollection).reduce((sum, row) => sum + row.count, 0),
    [state.globalCollection]
  );
  const unseenCount = Math.max(0, totalArtifacts - state.gallerySeenTotal);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "g") return;
      const s = useGameStore.getState();
      if (s.gameState !== "IDLE") return;
      if (s.overlayOpenState === "NONE") {
        s.setOverlayOpenState("GALLERY");
        s.markGallerySeen();
      } else {
        s.setOverlayOpenState("NONE");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const anomaly = state.activeCombatAnomaly;
  const hpRatio =
    state.maxPlayerHP > 0
      ? Math.max(0, Math.min(1, state.playerHP / state.maxPlayerHP))
      : 0;
  const shieldRatio =
    MAX_PLAYER_SHIELD > 0
      ? Math.max(0, Math.min(1, state.playerShield / MAX_PLAYER_SHIELD))
      : 0;

  const toggleGallery = () => {
    if (state.overlayOpenState === "NONE") {
      state.setOverlayOpenState("GALLERY");
      state.markGallerySeen();
    } else {
      state.setOverlayOpenState("NONE");
    }
  };

  return (
    <div
      className="nexus-combat-hud"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 91,
        pointerEvents: "none",
      }}
    >
      {combatActive && hc ? (
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scaleX: 0.96 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={entrance}
          style={{
            position: "fixed",
            top: SAFE_T,
            left: SAFE_L,
            right: SAFE_R,
            height: 1,
            transformOrigin: "center top",
            background: "linear-gradient(90deg, transparent, rgba(140,52,48,0.55), transparent)",
            zIndex: 93,
          }}
        />
      ) : combatActive && state.activeCombatIsDailySector ? (
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scaleX: 0.96 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={entrance}
          style={{
            position: "fixed",
            top: SAFE_T,
            left: SAFE_L,
            right: SAFE_R,
            height: 1,
            transformOrigin: "center top",
            background: `linear-gradient(90deg, transparent, ${TUNGSTEN}, transparent)`,
            opacity: 0.45,
            zIndex: 93,
          }}
        />
      ) : null}
      <div
        style={{
          position: "fixed",
          top: SAFE_T,
          right: SAFE_R,
          zIndex: 92,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "var(--nx-space-8)",
          pointerEvents: "none",
        }}
      >
        {combatActive ? (
          <motion.div
            key={`rank-${state.combatComboCount}-${comboRank}`}
            initial={{ scale: 1.06, opacity: 0.75 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={entrance}
            style={{
              fontFamily: MONO,
              fontSize: 8,
              fontWeight: 300,
              letterSpacing: "0.42em",
              color: rankHue,
              whiteSpace: "nowrap",
            }}
          >
            {comboRank}
          </motion.div>
        ) : null}
        {endlessHud ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={entrance}
            style={{
              fontFamily: MONO,
              fontSize: 8,
              fontWeight: 300,
              letterSpacing: "0.28em",
              color: BONE_MID,
            }}
          >
            {`DEPTH ${state.endlessFloor}`}
          </motion.div>
        ) : null}
      </div>
      {combatActive && anomaly ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={entrance}
          style={{
            position: "fixed",
            top: SAFE_T,
            left: SAFE_L,
            zIndex: 92,
            fontFamily: MONO,
            fontSize: 8,
            fontWeight: 300,
            letterSpacing: "0.22em",
            color: "rgba(200, 120, 118, 0.85)",
            pointerEvents: "none",
            maxWidth: "38vw",
          }}
        >
          {anomaly === "GLITCH_STORM"
            ? "GLITCH STORM"
            : anomaly === "VOID_RESONANCE"
              ? "VOID RESONANCE"
              : "DATA TURBULENCE"}
        </motion.div>
      ) : null}
      {combatActive ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={entrance}
          style={{
            position: "fixed",
            bottom: `calc(${SAFE_B} + var(--nx-space-16))`,
            left: SAFE_L,
            width: "min(200px, 34vw)",
            pointerEvents: "none",
            zIndex: 92,
          }}
        >
          <div
            style={{
              fontFamily: SANS,
              fontSize: 8,
              fontWeight: 100,
              letterSpacing: "0.36em",
              color: BONE_MID,
              marginBottom: "var(--nx-space-8)",
            }}
          >
            <span style={{ color: hc ? alertMuted : BONE_MID }}>VITALS</span>
          </div>
          <div style={{ position: "relative" }}>
            <SegmentedBarTrack accent={hc ? "rgba(140,52,48,0.8)" : BONE_LOW}>
              <motion.div
                key={state.damagePulseToken}
                animate={reduceMotion ? { opacity: 1 } : { opacity: [1, 0.88, 1] }}
                transition={nxHudPulseTransition(reduceMotion, {
                  duration: 0.34,
                  ease: "easeInOut" as const,
                })}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${hpRatio * 100}%`,
                  background: hc
                    ? "linear-gradient(90deg, rgba(120,44,40,0.95) 0%, rgba(90,32,30,0.75) 100%)"
                    : `linear-gradient(90deg, ${BONE_LOW} 0%, color-mix(in srgb, var(--nx-tungsten) 40%, transparent) 100%)`,
                  clipPath: FILL_CLIP,
                  transformOrigin: "left center",
                }}
              />
            </SegmentedBarTrack>
            {state.bossStrategyScanToken > 0 ? (
              <motion.div
                key={state.bossStrategyScanToken}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: "-22%" }}
                animate={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: [0, 0.85, 0], x: ["-22%", "122%"] }
                }
                transition={
                  reduceMotion
                    ? { duration: 0.01 }
                    : { duration: 0.42, ease: [0.25, 0.85, 0.35, 1] }
                }
                aria-hidden
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: "50%",
                  height: 2,
                  marginTop: -1,
                  pointerEvents: "none",
                  background: `linear-gradient(90deg, transparent 0%, ${BONE_LOW} 20%, ${BONE_MID} 50%, ${BONE_LOW} 80%, transparent 100%)`,
                  mixBlendMode: "overlay",
                }}
              />
            ) : null}
          </div>
          <div style={{ height: "var(--nx-space-8)" }} />
          <SegmentedBarTrack accent={hc ? "rgba(140,52,48,0.65)" : TUNGSTEN}>
            <motion.div
              key={state.bossAdaptivePulseToken}
              animate={reduceMotion ? { opacity: 1 } : { opacity: [1, 0.9, 1] }}
              transition={nxHudPulseTransition(reduceMotion, {
                duration: 0.32,
                ease: "easeInOut" as const,
              })}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${shieldRatio * 100}%`,
                background: hc
                  ? "linear-gradient(90deg, rgba(110,48,44,0.92) 0%, rgba(80,36,34,0.72) 100%)"
                  : `linear-gradient(90deg, color-mix(in srgb, var(--nx-bone) 18%, transparent) 0%, color-mix(in srgb, var(--nx-tungsten) 35%, transparent) 100%)`,
                clipPath: FILL_CLIP,
                transformOrigin: "left center",
              }}
            />
          </SegmentedBarTrack>
          <div
            style={{
              marginTop: "var(--nx-space-8)",
              display: "flex",
              justifyContent: "space-between",
              fontFamily: MONO,
              fontSize: 8,
              fontWeight: 300,
              letterSpacing: "0.12em",
              color: hc ? "rgba(220, 190, 188, 0.65)" : BONE_MID,
            }}
          >
            <span>
              HP {state.playerHP}/{state.maxPlayerHP}
            </span>
            <span>
              SLD {state.playerShield}/{MAX_PLAYER_SHIELD}
            </span>
          </div>
        </motion.div>
      ) : null}
      <LeaderboardTicker />
      <div
        style={{
          position: "fixed",
          top: combatActive && anomaly ? `calc(${SAFE_T} + var(--nx-space-16))` : SAFE_T,
          left: SAFE_L,
          pointerEvents: "auto",
          zIndex: 94,
        }}
      >
        <motion.div
          role="button"
          tabIndex={0}
          aria-label="Galerie Hall of Fame öffnen oder schließen"
          onClick={toggleGallery}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleGallery();
            }
          }}
          whileHover={reduceMotion ? undefined : { y: -0.5 }}
          whileTap={reduceMotion ? undefined : { scale: 0.985 }}
          transition={entrance}
          style={{
            fontFamily: MONO,
            fontSize: 8,
            fontWeight: 300,
            letterSpacing: "0.24em",
            color: hc ? alertMuted : BONE_MID,
            cursor: "pointer",
            padding: "4px 0",
            borderBottom: "1px solid var(--nx-border-readable)",
            background: "transparent",
            display: "inline-flex",
            alignItems: "baseline",
            gap: 8,
          }}
        >
          <span aria-hidden style={{ opacity: 0.45 }}>
            ◆
          </span>
          HALL OF FAME
          {unseenCount > 0 && (
            <span style={{ color: TUNGSTEN, letterSpacing: "0.14em" }}>{`+${unseenCount}`}</span>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default CombatHUD;
