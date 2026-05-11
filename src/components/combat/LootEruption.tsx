import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, useAnimationControls } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "../../store/useGameStore";
import { skillRegistry, type SkillId } from "../../data/skillRegistry";
import type { LootRarity } from "../../data/nexusRegistry";
import { SkillCard } from "./SkillCard";
import { useBossAudioEngine } from "../../lib/audio/bossAudioEngine";
import {
  hideNexusCombatFxCanvas,
  lootRarityFlightFilters,
  obtainNexusCombatFxCanvas,
  readThemeColorRgb,
} from "../../lib/combat/lootLogic";

const CARD_W = 198;
const CARD_H = 148;
const GAP = 12;
const BAR_BOTTOM = 26;
const BAR_PAD_BOTTOM = 14;

/** Boss-Shatter-Zentrum → Hand: Funken zuerst nach oben */
function computeLayout(n: number, vw: number, vh: number) {
  const centerX = vw / 2;
  const shatterX = centerX;
  const shatterY = vh * 0.42;
  const finalTop = vh - BAR_BOTTOM - BAR_PAD_BOTTOM - CARD_H;
  const slots = Array.from({ length: n }, (_, i) => {
    const offset = (i - (n - 1) / 2) * (CARD_W + GAP);
    const finalLeft = centerX + offset - CARD_W / 2;
    const startX = shatterX - (finalLeft + CARD_W / 2);
    const startY = shatterY - (finalTop + CARD_H / 2);
    return { finalLeft, finalTop, startX, startY };
  });
  return { slots };
}

type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  s: number;
  hue: number;
};

type ShockRing = {
  t: number;
  cx: number;
  cy: number;
  maxR: number;
  life: number;
  maxLife: number;
};

/**
 * Ein Canvas-Node (wie Shatter): goldener Partikel-Regen + radiale Schockringe
 */
function LootLegendaryUnifiedCanvas({
  active,
  cardRefs,
  maskRef,
  ringVersion,
}: {
  active: boolean;
  cardRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  maskRef: React.MutableRefObject<boolean[]>;
  ringVersion: number;
}) {
  const ringVersionRef = useRef(ringVersion);
  ringVersionRef.current = ringVersion;

  useEffect(() => {
    if (!active) {
      return undefined;
    }
    const lastSpawnedRings = { current: 0 };
    const canvas = obtainNexusCombatFxCanvas({
      zIndex: "2147482638",
      mixBlendMode: "screen",
    });
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const particles: Spark[] = [];
    const rings: ShockRing[] = [];
    let raf = 0;
    let last = performance.now();
    let frame = 0;

    const gold = readThemeColorRgb("--gold");

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const tick = (now: number) => {
      const dt = Math.min(40, now - last);
      last = now;
      frame += 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const rv = ringVersionRef.current;
      if (rv > lastSpawnedRings.current) {
        for (let u = lastSpawnedRings.current; u < rv; u += 1) {
          const cx = w / 2;
          const cy = h * 0.42;
          rings.push({
            t: 0,
            cx,
            cy,
            maxR: Math.max(w, h) * 0.52,
            life: 0,
            maxLife: 620,
          });
        }
        lastSpawnedRings.current = rv;
      }

      const mask = maskRef.current;
      for (let i = 0; i < mask.length; i += 1) {
        if (!mask[i]) continue;
        const el = cardRefs.current[i];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        if (frame % 2 === 0) {
          for (let k = 0; k < 6; k += 1) {
            const a = Math.random() * Math.PI * 2;
            const sp = 0.14 + Math.random() * 0.48;
            const maxL = 400 + Math.random() * 260;
            particles.push({
              x: cx + (Math.random() - 0.5) * 20,
              y: cy + (Math.random() - 0.5) * 20,
              vx: Math.cos(a) * sp,
              vy: Math.sin(a) * sp - 0.16,
              life: maxL,
              maxLife: maxL,
              s: 0.55 + Math.random() * 1.8,
              hue: 38 + Math.random() * 20,
            });
          }
        }
      }

      for (let j = particles.length - 1; j >= 0; j -= 1) {
        const p = particles[j];
        p.life -= dt;
        if (p.life <= 0) {
          particles.splice(j, 1);
          continue;
        }
        p.x += p.vx * dt * 0.088;
        p.y += p.vy * dt * 0.088;
        p.vy += 0.00045 * dt;
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.globalAlpha = Math.min(0.95, alpha * 1.08);
        ctx.fillStyle = `hsla(${p.hue}, 92%, 58%, ${0.38 + alpha * 0.52})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let r = rings.length - 1; r >= 0; r -= 1) {
        const ring = rings[r];
        ring.life += dt;
        const u = Math.min(1, ring.life / ring.maxLife);
        const radius = ring.maxR * (0.08 + u * 0.92);
        const a = Math.max(0, 0.55 * (1 - u) * (1 - u));
        ctx.globalAlpha = Math.min(0.85, a * 1.2);
        ctx.strokeStyle = `rgba(${gold.r},${gold.g},${gold.b},${0.35 + 0.4 * (1 - u)})`;
        ctx.lineWidth = 3.2 * (1 - u) + 0.5;
        ctx.beginPath();
        ctx.arc(ring.cx, ring.cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        if (ring.life >= ring.maxLife) {
          rings.splice(r, 1);
        }
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
      hideNexusCombatFxCanvas();
    };
  }, [active, cardRefs, maskRef]);

  return null;
}

type EruptingCardProps = {
  skillId: SkillId;
  layoutId: string;
  startX: number;
  startY: number;
  finalLeft: number;
  finalTop: number;
  peakX: number;
  peakY: number;
  staggerMs: number;
  rarity: LootRarity;
  onFlightDone: () => void;
  playLootPop: (delayMs?: number) => void;
  playLegendaryReveal: (delayMs?: number) => void;
  onLegendaryAppear: () => void;
  onLegendaryLand: () => void;
};

const EruptingCard = forwardRef<HTMLDivElement, EruptingCardProps>(
  function EruptingCard(
    {
      skillId,
      layoutId,
      startX,
      startY,
      finalLeft,
      finalTop,
      peakX,
      peakY,
      staggerMs,
      rarity,
      onFlightDone,
      playLootPop,
      playLegendaryReveal,
      onLegendaryAppear,
      onLegendaryLand,
    },
    ref
  ) {
    const skill = skillRegistry[skillId];
    const controls = useAnimationControls();
    const filters = lootRarityFlightFilters(rarity);
    const onDoneRef = useRef(onFlightDone);
    const popRef = useRef(playLootPop);
    const gongRef = useRef(playLegendaryReveal);
    const landRef = useRef(onLegendaryLand);
    const appearRef = useRef(onLegendaryAppear);
    onDoneRef.current = onFlightDone;
    popRef.current = playLootPop;
    gongRef.current = playLegendaryReveal;
    landRef.current = onLegendaryLand;
    appearRef.current = onLegendaryAppear;

    useEffect(() => {
      let alive = true;
      if (!skill) {
        onDoneRef.current();
        return undefined;
      }
      const f = lootRarityFlightFilters(rarity);
      void popRef.current(staggerMs);
      if (rarity === "LEGENDARY") {
        appearRef.current();
        void gongRef.current(staggerMs);
      }

      const run = async () => {
        await new Promise<void>((r) => {
          window.setTimeout(r, staggerMs);
        });
        if (!alive) return;
        await controls.start({
          x: startX + peakX,
          y: startY + peakY,
          rotateX: 12,
          rotateY: -12,
          scale: 0.76,
          filter: f.burst,
          transition: { type: "spring", stiffness: 420, damping: 38, mass: 0.78 },
        });
        if (!alive) return;
        await controls.start({
          x: 0,
          y: 0,
          rotateX: -5,
          rotateY: 4,
          scale: 1,
          filter: f.land,
          transition: { type: "spring", stiffness: 88, damping: 28, mass: 1.02 },
        });
        if (!alive) return;
        if (rarity === "LEGENDARY") {
          landRef.current();
        }
        await controls.start({
          rotateX: 0,
          rotateY: 0,
          filter: "none",
          transition: { type: "spring", stiffness: 140, damping: 28 },
        });
        if (!alive) return;
        onDoneRef.current();
      };

      void run();
      return () => {
        alive = false;
      };
    }, [skill, controls, startX, startY, peakX, peakY, staggerMs, rarity]);

    if (!skill) return null;

    const legend = rarity === "LEGENDARY";
    const rare = rarity === "RARE";
    const initialFilters = lootRarityFlightFilters(rarity);

    return (
      <motion.div
        ref={ref}
        layoutId={layoutId}
        initial={{
          x: startX,
          y: startY,
          rotateX: -8,
          rotateY: 10,
          scale: 0.48,
          filter: initialFilters.initial,
        }}
        animate={controls}
        style={{
          position: "fixed",
          left: finalLeft,
          top: finalTop,
          width: CARD_W,
          zIndex: 2147482640,
          transformStyle: "preserve-3d",
          perspective: 1100,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "relative",
            transformStyle: "preserve-3d",
          }}
        >
          <motion.div
            aria-hidden
            style={{
              position: "absolute",
              inset: -6,
              borderRadius: 14,
              background: legend
                ? "linear-gradient(125deg, color-mix(in srgb, var(--gold, #facc15) 45%, transparent), color-mix(in srgb, var(--violet, #a78bfa) 28%, transparent), color-mix(in srgb, var(--cyan, #22d3ee) 22%, transparent))"
                : rare
                  ? "linear-gradient(125deg, color-mix(in srgb, var(--violet, #a78bfa) 42%, transparent), color-mix(in srgb, var(--cyan, #22d3ee) 24%, transparent))"
                  : "linear-gradient(125deg, color-mix(in srgb, var(--cyan, #22d3ee) 40%, transparent), color-mix(in srgb, var(--violet, #a78bfa) 18%, transparent))",
              filter: "blur(12px)",
              opacity: 0.55,
              mixBlendMode: "screen",
              pointerEvents: "none",
            }}
            animate={{
              opacity: legend ? [0.48, 0.88, 0.42] : rare ? [0.4, 0.72, 0.36] : [0.32, 0.58, 0.3],
            }}
            transition={{ duration: 0.48, repeat: 2, ease: "easeInOut" }}
          />
          <SkillCard skill={skill} compact lootRarity={rarity} />
        </div>
      </motion.div>
    );
  }
);

export function LootEruption() {
  const { hand, handRarities, completeLootEruption } = useGameStore(
    useShallow((s) => ({
      hand: s.hand,
      handRarities: s.handRarities,
      completeLootEruption: s.completeLootEruption,
    }))
  );
  const { playLootPop, playLegendaryReveal } = useBossAudioEngine();
  const doneRef = useRef(0);
  const nRef = useRef(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const legendaryMaskRef = useRef<boolean[]>([]);
  const [ringVersion, setRingVersion] = useState(0);

  const visible = useMemo(() => hand.slice(0, 5), [hand]);
  const n = visible.length;

  const layout = useMemo(() => {
    if (n === 0 || typeof window === "undefined") {
      return { slots: [] as ReturnType<typeof computeLayout>["slots"] };
    }
    return computeLayout(n, window.innerWidth, window.innerHeight);
  }, [n]);

  const legendaryMask = useMemo(
    () => visible.map((_, i) => handRarities[i] === "LEGENDARY"),
    [visible, handRarities]
  );

  legendaryMaskRef.current = legendaryMask;

  const hasLegendary = legendaryMask.some(Boolean);

  useEffect(() => {
    doneRef.current = 0;
    nRef.current = n;
    cardRefs.current = [];
  }, [n]);

  useEffect(() => {
    if (n === 0) {
      completeLootEruption();
    }
  }, [n, completeLootEruption]);

  const handleOneDone = useCallback(() => {
    doneRef.current += 1;
    if (doneRef.current >= nRef.current) {
      window.setTimeout(() => {
        completeLootEruption();
      }, 40);
    }
  }, [completeLootEruption]);

  const pulseLegendaryRing = useCallback(() => {
    setRingVersion((v) => v + 1);
  }, []);

  if (n === 0) return null;

  return (
    <>
      {hasLegendary ? (
        <LootLegendaryUnifiedCanvas
          active={hasLegendary}
          cardRefs={cardRefs}
          maskRef={legendaryMaskRef}
          ringVersion={ringVersion}
        />
      ) : null}
      {visible.map((skillId, index) => {
        const slot = layout.slots[index];
        if (!slot) return null;
        const fan = (index - (n - 1) / 2) * 0.42;
        const peakX = Math.sin(fan) * (88 + index * 14);
        const peakY = -Math.abs(Math.cos(fan * 0.92)) * (138 + n * 12) - 22;
        const layoutId = `skill-hand-${index}-${skillId}`;
        const rarity = handRarities[index] ?? "COMMON";
        return (
          <EruptingCard
            key={`erupt-${layoutId}`}
            ref={(el) => {
              cardRefs.current[index] = el;
            }}
            skillId={skillId}
            layoutId={layoutId}
            startX={slot.startX}
            startY={slot.startY}
            finalLeft={slot.finalLeft}
            finalTop={slot.finalTop}
            peakX={peakX}
            peakY={peakY}
            staggerMs={index * 74}
            rarity={rarity}
            onFlightDone={handleOneDone}
            playLootPop={playLootPop}
            playLegendaryReveal={playLegendaryReveal}
            onLegendaryAppear={
              rarity === "LEGENDARY" ? pulseLegendaryRing : () => undefined
            }
            onLegendaryLand={
              rarity === "LEGENDARY" ? pulseLegendaryRing : () => undefined
            }
          />
        );
      })}
    </>
  );
}

export default LootEruption;
