import { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useGameStore } from "../../store/useGameStore";
import type { SkillDefinition } from "../../data/skillRegistry";
import { RARITY_LEVELS, type LootRarity } from "../../data/nexusRegistry";
import { playHoverResonancePing } from "../../lib/audio/nexusUiAudio";
import {
  NX_GLASS_NOISE_BG,
  NX_GLASS_NOISE_OPACITY_HOVER,
  NX_GLASS_NOISE_OPACITY_IDLE,
} from "../../lib/ui/glassNoiseTexture";
import { useFractalBeat } from "../../lib/ui/fractalBeatContext";
import {
  NX_UI_INSTANT,
  nxHudPulseTransition,
  nxSkillCardTiltSpring,
} from "../../lib/ui/textMotionPolicy";
import { shardLabel } from "../../lib/ui/shardLabel";

type SkillCardProps = {
  skill: SkillDefinition;
  onPlaySkill?: (skillId: SkillDefinition["id"]) => void;
  compact?: boolean;
  lootRarity?: LootRarity;
  /** Nur Darstellung (z. B. Loot-Detail), keine Interaktion */
  interactionDisabled?: boolean;
  /** DATA_TURBULENCE: angezeigte Slot-Kosten 0–3 */
  dataTurbulenceCost?: number | null;
  dataTurbulenceBlocked?: boolean;
  /** Flow 100 %: Halten löst Synaptic Overload aus */
  overloadReady?: boolean;
  onSynapticOverload?: (skillId: SkillDefinition["id"]) => void;
};

const CODE_CHARSET = "01∑∏Ω<>[]{}%#@$&^*+=XABΓΔΛΣΨΩ▄▀▐▌░▒▓";

const DATA_SHARD_CLIP =
  "polygon(5% 0%, 100% 0%, 100% 92%, 93% 100%, 0% 100%, 0% 11%)";

/** Scan-Fadenkreuz, Hotspot zentriert — Fallback crosshair */
const SCAN_CURSOR =
  `url("data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><g fill="none" stroke="#67e8f9" stroke-width="1.15"><path d="M14 4v20M4 14h20"/><circle cx="14" cy="14" r="5"/></g></svg>'
  )}") 14 14, crosshair`;

function randomCipherLine(length: number): string {
  let s = "";
  for (let i = 0; i < length; i += 1) {
    s += CODE_CHARSET[Math.floor(Math.random() * CODE_CHARSET.length)] ?? "0";
  }
  return s;
}

export function SkillCard({
  skill,
  onPlaySkill,
  compact = false,
  lootRarity = "COMMON",
  interactionDisabled = false,
  dataTurbulenceCost = null,
  dataTurbulenceBlocked = false,
  overloadReady = false,
  onSynapticOverload,
}: SkillCardProps) {
  const reduceMotion = useReducedMotion();
  const beat = useFractalBeat();
  const playSkillCard = useGameStore((state) => state.playSkillCard);
  const setSourceMirrorSkill = useGameStore((state) => state.setSourceMirrorSkill);
  const isDataEncrypted = useGameStore((state) => state.isDataEncrypted);
  const gameState = useGameStore((state) => state.gameState);
  const victoryFinisherComplete = useGameStore((state) => state.victoryFinisherComplete);
  const isLootErupting = useGameStore((state) => state.isLootErupting);
  const cinematicInputLocked = useGameStore(
    (state) => state.isFinisherActive || state.isLootErupting
  );
  const [hoverInspect, setHoverInspect] = useState(false);
  const [shardGlassHover, setShardGlassHover] = useState(false);

  const inspectIdentifyUi =
    gameState === "VICTORY" &&
    victoryFinisherComplete &&
    !isLootErupting &&
    !interactionDisabled;
  const inspectGlowActive = inspectIdentifyUi;
  const sourceMirrorEligible =
    (gameState === "FIGHTING" || gameState === "STARTING") &&
    !interactionDisabled &&
    !inspectIdentifyUi;
  const tierStyle = RARITY_LEVELS[lootRarity];
  const draggedFarRef = useRef(false);
  const decryptTimerRef = useRef<number | null>(null);
  const holdOverloadTimerRef = useRef<number | null>(null);
  const suppressClickForOverloadRef = useRef(false);

  const [revealUntilMs, setRevealUntilMs] = useState(0);
  const [cipherLines, setCipherLines] = useState<string[]>(() => [
    randomCipherLine(48),
    randomCipherLine(44),
    randomCipherLine(52),
  ]);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const tiltSpring = nxSkillCardTiltSpring(reduceMotion);
  const rotateX = useSpring(useTransform(y, [-160, 160], [8, -8]), tiltSpring);
  const rotateY = useSpring(useTransform(x, [-160, 160], [-9, 9]), tiltSpring);

  const vfxTag = useMemo(
    () => shardLabel(skill.vfx.replaceAll("_", " ")),
    [skill.vfx]
  );

  const encryptionMode = isDataEncrypted;
  const decryptedReadable = encryptionMode && Date.now() < revealUntilMs;

  useEffect(() => {
    if (!encryptionMode) {
      setRevealUntilMs(0);
      if (decryptTimerRef.current != null) {
        window.clearTimeout(decryptTimerRef.current);
        decryptTimerRef.current = null;
      }
    }
  }, [encryptionMode]);

  useEffect(
    () => () => {
      if (holdOverloadTimerRef.current != null) {
        window.clearTimeout(holdOverloadTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (!encryptionMode || decryptedReadable) return;
    const id = window.setInterval(() => {
      setCipherLines([randomCipherLine(48), randomCipherLine(44), randomCipherLine(52)]);
    }, 95);
    return () => window.clearInterval(id);
  }, [encryptionMode, decryptedReadable]);

  useEffect(() => {
    if (!encryptionMode || revealUntilMs <= Date.now()) return;
    if (decryptTimerRef.current != null) {
      window.clearTimeout(decryptTimerRef.current);
    }
    decryptTimerRef.current = window.setTimeout(() => {
      decryptTimerRef.current = null;
      setRevealUntilMs(0);
    }, Math.max(0, revealUntilMs - Date.now()));
    return () => {
      if (decryptTimerRef.current != null) {
        window.clearTimeout(decryptTimerRef.current);
        decryptTimerRef.current = null;
      }
    };
  }, [encryptionMode, revealUntilMs]);

  const scheduleDecryptWindow = () => {
    if (!encryptionMode) return;
    setRevealUntilMs(Date.now() + 500);
  };

  const handleHoverResonance = () => {
    void playHoverResonancePing();
  };

  const executePlay = () => {
    if (cinematicInputLocked || interactionDisabled || dataTurbulenceBlocked) return;
    if (onPlaySkill) {
      onPlaySkill(skill.id);
      return;
    }
    playSkillCard(skill.id);
  };

  const clearOverloadHold = () => {
    if (holdOverloadTimerRef.current != null) {
      window.clearTimeout(holdOverloadTimerRef.current);
      holdOverloadTimerRef.current = null;
    }
  };

  const beginOverloadHold = () => {
    if (
      !overloadReady ||
      !onSynapticOverload ||
      inspectIdentifyUi ||
      cinematicInputLocked ||
      interactionDisabled ||
      dataTurbulenceBlocked
    ) {
      return;
    }
    clearOverloadHold();
    holdOverloadTimerRef.current = window.setTimeout(() => {
      holdOverloadTimerRef.current = null;
      suppressClickForOverloadRef.current = true;
      onSynapticOverload(skill.id);
      window.setTimeout(() => {
        suppressClickForOverloadRef.current = false;
      }, 120);
    }, 520);
  };

  const rmLegendaryInspect = {
    filter: "drop-shadow(0 0 32px rgba(250, 204, 21, 0.82)) brightness(1.08)",
    boxShadow:
      "inset 0 0 22px rgba(34,211,238,0.22), 0 0 32px rgba(250,204,21,0.35), 0 0 28px rgba(0,255,255,0.2)",
  } as const;
  const rmLegendary = {
    filter: "drop-shadow(0 0 32px rgba(250, 204, 21, 0.82)) brightness(1.08)",
  } as const;
  const rmInspect = {
    boxShadow:
      "inset 0 0 22px rgba(34,211,238,0.18), 0 0 28px rgba(0,255,255,0.14), 0 0 0 1px rgba(34,211,238,0.35)",
  } as const;

  return (
    <motion.button
      type="button"
      data-sfx="off"
      onPointerDown={() => beginOverloadHold()}
      onPointerUp={() => clearOverloadHold()}
      onPointerCancel={() => clearOverloadHold()}
      onPointerLeave={() => clearOverloadHold()}
      onMouseEnter={() => {
        if (inspectIdentifyUi) setHoverInspect(true);
        if (cinematicInputLocked || interactionDisabled) return;
        setShardGlassHover(true);
        handleHoverResonance();
        scheduleDecryptWindow();
      }}
      onMouseLeave={() => {
        setHoverInspect(false);
        setShardGlassHover(false);
      }}
      onFocus={() => {
        if (inspectIdentifyUi) setHoverInspect(true);
        if (cinematicInputLocked || interactionDisabled) return;
        setShardGlassHover(true);
        handleHoverResonance();
        scheduleDecryptWindow();
      }}
      onBlur={() => {
        setHoverInspect(false);
        setShardGlassHover(false);
      }}
      onClick={() => {
        if (suppressClickForOverloadRef.current) return;
        executePlay();
      }}
      drag={!reduceMotion && !cinematicInputLocked && !interactionDisabled}
      dragConstraints={{ left: -260, right: 260, top: -180, bottom: 180 }}
      dragElastic={0.36}
      onDrag={(event, info) => {
        clearOverloadHold();
        x.set(info.offset.x);
        y.set(info.offset.y);
        if (Math.abs(info.offset.x) > 110 || Math.abs(info.offset.y) > 90) {
          draggedFarRef.current = true;
        }
      }}
      onDragEnd={(_, info) => {
        clearOverloadHold();
        if (cinematicInputLocked || interactionDisabled) {
          draggedFarRef.current = false;
          x.set(0);
          y.set(0);
          return;
        }
        if (
          draggedFarRef.current &&
          (info.offset.x > 120 || Math.abs(info.offset.y) > 80)
        ) {
          executePlay();
        }
        draggedFarRef.current = false;
        x.set(0);
        y.set(0);
      }}
      whileHover={
        reduceMotion || cinematicInputLocked || interactionDisabled
          ? undefined
          : { scale: 1.02 }
      }
      whileTap={
        reduceMotion || cinematicInputLocked || interactionDisabled
          ? undefined
          : { scale: 0.97 }
      }
      animate={
        reduceMotion
          ? lootRarity === "LEGENDARY" && inspectGlowActive
            ? rmLegendaryInspect
            : lootRarity === "LEGENDARY"
              ? rmLegendary
              : inspectGlowActive
                ? rmInspect
                : undefined
          : lootRarity === "LEGENDARY" && inspectGlowActive
            ? {
                filter: [
                  "drop-shadow(0 0 32px rgba(250, 204, 21, 0.82)) brightness(1.08)",
                  "drop-shadow(0 0 56px rgba(255, 235, 150, 0.95)) brightness(1.32)",
                  "drop-shadow(0 0 32px rgba(250, 204, 21, 0.82)) brightness(1.08)",
                ],
                boxShadow: [
                  "inset 0 0 22px rgba(34,211,238,0.22), 0 0 32px rgba(250,204,21,0.35), 0 0 28px rgba(0,255,255,0.2)",
                  "inset 0 0 28px rgba(34,211,238,0.32), 0 0 48px rgba(255,235,150,0.45), 0 0 40px rgba(0,255,255,0.35)",
                  "inset 0 0 22px rgba(34,211,238,0.22), 0 0 32px rgba(250,204,21,0.35), 0 0 28px rgba(0,255,255,0.2)",
                ],
              }
            : lootRarity === "LEGENDARY"
              ? {
                  filter: [
                    "drop-shadow(0 0 32px rgba(250, 204, 21, 0.82)) brightness(1.08)",
                    "drop-shadow(0 0 56px rgba(255, 235, 150, 0.95)) brightness(1.32)",
                    "drop-shadow(0 0 32px rgba(250, 204, 21, 0.82)) brightness(1.08)",
                  ],
                }
              : inspectGlowActive
                ? {
                    boxShadow: [
                      "inset 0 0 22px rgba(34,211,238,0.18), 0 0 28px rgba(0,255,255,0.14), 0 0 0 1px rgba(34,211,238,0.35)",
                      "inset 0 0 26px rgba(34,211,238,0.28), 0 0 44px rgba(0,255,255,0.32), 0 0 0 1px rgba(103,232,249,0.55)",
                      "inset 0 0 22px rgba(34,211,238,0.18), 0 0 28px rgba(0,255,255,0.14), 0 0 0 1px rgba(34,211,238,0.35)",
                    ],
                  }
                : undefined
      }
      transition={
        reduceMotion
          ? NX_UI_INSTANT
          : {
              type: "spring",
              stiffness: 260,
              damping: 20,
              ...(lootRarity === "LEGENDARY"
                ? { filter: { duration: 1.15, repeat: Infinity, ease: "easeInOut" as const } }
                : {}),
              ...(inspectGlowActive
                ? { boxShadow: { duration: 2.2, repeat: Infinity, ease: "easeInOut" as const } }
                : {}),
            }
      }
      style={{
        width: compact ? 198 : 240,
        minHeight: compact ? 148 : 168,
        borderRadius: 0,
        clipPath: DATA_SHARD_CLIP,
        border: `1px solid color-mix(in srgb, ${tierStyle.color} 55%, rgba(186,230,253,0.35))`,
        background:
          "linear-gradient(160deg, rgba(7,19,30,0.88) 0%, rgba(4,14,22,0.78) 56%, rgba(10,28,39,0.92) 100%)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        boxShadow: `inset 0 0 ${12 + beat * 26}px rgba(34,211,238,${0.14 + beat * 0.26}), inset 0 0 0 1px rgba(255,255,255,0.06), 0 0 28px rgba(0,255,255,0.14), ${tierStyle.glow} ${tierStyle.color}`,
        color: "rgba(207, 250, 254, 0.96)",
        textAlign: "left",
        padding: compact ? 12 : 14,
        cursor:
          cinematicInputLocked || interactionDisabled
            ? "default"
            : inspectIdentifyUi && hoverInspect
              ? SCAN_CURSOR
              : "grab",
        position: "relative",
        overflow: "hidden",
        transformStyle: "preserve-3d",
        rotateX,
        rotateY,
      }}
    >
      <motion.div
        aria-hidden
        animate={{
          opacity: shardGlassHover ? NX_GLASS_NOISE_OPACITY_HOVER : NX_GLASS_NOISE_OPACITY_IDLE,
        }}
        transition={nxHudPulseTransition(reduceMotion, {
          duration: 0.22,
          ease: "easeOut" as const,
        })}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage: NX_GLASS_NOISE_BG,
          mixBlendMode: "overlay",
        }}
      />
      <motion.div
        aria-hidden="true"
        animate={
          reduceMotion ? { opacity: 0.42 } : { opacity: [0.25, 0.58, 0.25] }
        }
        transition={
          reduceMotion
            ? NX_UI_INSTANT
            : { duration: 1.5, repeat: Infinity, ease: "easeInOut" as const }
        }
        style={{
          position: "absolute",
          inset: "-20% 0 auto -10%",
          height: 70,
          background:
            "linear-gradient(100deg, rgba(0,255,255,0) 0%, rgba(0,255,255,0.24) 45%, rgba(0,255,255,0) 100%)",
          transform: "rotate(-7deg)",
          mixBlendMode: "screen",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {sourceMirrorEligible ? (
        <button
          type="button"
          aria-label="Source Mirror — Kartenlogik"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setSourceMirrorSkill(skill.id);
          }}
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            zIndex: 6,
            width: 30,
            height: 30,
            borderRadius: 8,
            border: "1px solid rgba(103,232,249,0.45)",
            background: "rgba(4,18,28,0.88)",
            color: "rgba(165, 243, 252, 0.95)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            lineHeight: 1,
            padding: 0,
            boxShadow: "0 0 12px rgba(0,255,255,0.2)",
          }}
        >
          ⚙
        </button>
      ) : null}

      {inspectIdentifyUi ? (
        <motion.div
          aria-hidden="true"
          initial={false}
          animate={
            reduceMotion
              ? { scale: 1, opacity: 1 }
              : { scale: [1, 1.06, 1], opacity: [0.82, 1, 0.82] }
          }
          transition={
            reduceMotion
              ? NX_UI_INSTANT
              : { duration: 1.35, repeat: Infinity, ease: "easeInOut" as const }
          }
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 4,
            padding: "3px 7px",
            borderRadius: 6,
            border: "1px solid rgba(103,232,249,0.65)",
            background: "rgba(4,18,28,0.82)",
            fontSize: 8,
            letterSpacing: ".2em",
            fontWeight: 700,
            color: "rgba(165, 243, 252, 0.98)",
            textTransform: "uppercase",
            boxShadow: "0 0 14px rgba(0,255,255,0.35)",
            pointerEvents: "none",
          }}
        >
          IDENTIFY
        </motion.div>
      ) : null}

      {dataTurbulenceCost != null && !inspectIdentifyUi ? (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 4,
            padding: "3px 8px",
            borderRadius: 6,
            border: "1px solid rgba(167,139,250,0.55)",
            background: "rgba(15,23,42,0.88)",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: ".12em",
            color: dataTurbulenceBlocked ? "rgba(248,113,113,0.95)" : "rgba(216,180,254,0.98)",
            pointerEvents: "none",
          }}
        >
          {dataTurbulenceCost} NF
        </div>
      ) : null}

      {overloadReady && !inspectIdentifyUi ? (
        <motion.div
          aria-hidden
          initial={false}
          animate={
            reduceMotion
              ? { opacity: 1, scale: 1 }
              : { opacity: [0.75, 1, 0.75], scale: [1, 1.04, 1] }
          }
          transition={
            reduceMotion
              ? NX_UI_INSTANT
              : { duration: 1.1, repeat: Infinity, ease: "easeInOut" as const }
          }
          style={{
            position: "absolute",
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 4,
            padding: "3px 8px",
            borderRadius: 6,
            border: "1px solid rgba(0,255,255,0.65)",
            background: "rgba(4,24,32,0.88)",
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: ".28em",
            color: "rgba(0,255,255,0.95)",
            pointerEvents: "none",
            textTransform: "uppercase",
            boxShadow: "0 0 16px rgba(0,255,255,0.35)",
          }}
        >
          Halten
        </motion.div>
      ) : null}

      <div
        style={{
          position: "relative",
          zIndex: 2,
          filter:
            encryptionMode && !decryptedReadable ? "blur(3px)" : "blur(0px)",
          transition: "filter 200ms ease-out",
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: ".22em",
            textTransform: "uppercase",
            color: "rgba(103, 232, 249, 0.92)",
            marginBottom: 6,
          }}
        >
          {shardLabel(skill.type)}
        </div>
        <div style={{ fontSize: compact ? 15 : 18, fontWeight: 600, marginBottom: 8 }}>
          {shardLabel(skill.name)}
        </div>
        <div style={{ fontSize: compact ? 10 : 11, opacity: 0.92, lineHeight: 1.45 }}>
          {shardLabel(skill.lore)}
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 10,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "rgba(125, 211, 252, 0.95)",
            mixBlendMode: "screen",
          }}
        >
          {vfxTag}
        </div>
      </div>

      {encryptionMode ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 10,
            zIndex: 5,
            borderRadius: 10,
            pointerEvents: "none",
            overflow: "hidden",
            opacity: decryptedReadable ? 0 : 1,
            transition: "opacity 200ms ease-out",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            background: "rgba(2, 12, 22, 0.38)",
            boxShadow: "inset 0 0 0 1px rgba(34,211,238,0.2)",
          }}
        >
          <motion.div
            animate={
              reduceMotion ? { opacity: 0.9 } : { opacity: [0.82, 1, 0.76, 0.94] }
            }
            transition={
              reduceMotion
                ? NX_UI_INSTANT
                : { duration: 0.22, repeat: Infinity, ease: "linear" as const }
            }
            style={{
              position: "absolute",
              inset: 6,
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: compact ? 9 : 10,
              lineHeight: 1.25,
              letterSpacing: "0.04em",
              color: "rgba(34, 211, 238, 0.82)",
              textShadow: "0 0 6px rgba(34,211,238,0.35)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              mixBlendMode: "screen",
            }}
          >
            {cipherLines.join("\n")}
          </motion.div>
        </div>
      ) : null}
    </motion.button>
  );
}

export default SkillCard;
