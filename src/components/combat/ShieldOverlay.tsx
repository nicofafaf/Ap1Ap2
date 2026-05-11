import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { MAX_PLAYER_SHIELD } from "../../lib/combat/defenseProcessor";
import { useGameStore } from "../../store/useGameStore";

const HEX =
  "polygon(50% 6%, 93% 28%, 93% 72%, 50% 94%, 7% 72%, 7% 28%)";

type Shard = { id: number; x: number; y: number; vx: number; vy: number; rot: number; delay: number };

export function ShieldOverlay() {
  const gameState = useGameStore((s) => s.gameState);
  const pulseToken = useGameStore((s) => s.bossAdaptivePulseToken);
  const playerShield = useGameStore((s) => s.playerShield);
  const shatterToken = useGameStore((s) => s.shieldShatterToken);
  const absorbToken = useGameStore((s) => s.sentinelAbsorbToken);

  const [barrierOn, setBarrierOn] = useState(false);
  const [absorbFlash, setAbsorbFlash] = useState(false);
  const [shards, setShards] = useState<Shard[]>([]);
  const shardId = useRef(0);

  const inCombat = gameState === "FIGHTING" || gameState === "STARTING";

  useEffect(() => {
    if (!inCombat) return;
    setBarrierOn(true);
    const t = window.setTimeout(() => setBarrierOn(false), 220);
    return () => window.clearTimeout(t);
  }, [pulseToken, inCombat]);

  useEffect(() => {
    if (absorbToken <= 0) return;
    setAbsorbFlash(true);
    const t = window.setTimeout(() => setAbsorbFlash(false), 180);
    return () => window.clearTimeout(t);
  }, [absorbToken]);

  useEffect(() => {
    if (shatterToken <= 0) return;
    const n = 14;
    const next: Shard[] = [];
    for (let i = 0; i < n; i += 1) {
      shardId.current += 1;
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
      const sp = 38 + Math.random() * 52;
      next.push({
        id: shardId.current,
        x: 50 + Math.cos(a) * 8,
        y: 50 + Math.sin(a) * 8,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 20,
        rot: (Math.random() - 0.5) * 420,
        delay: Math.random() * 0.04,
      });
    }
    setShards((prev) => [...prev, ...next]);
    const clear = window.setTimeout(() => {
      setShards((prev) => prev.filter((s) => !next.find((x) => x.id === s.id)));
    }, 720);
    return () => window.clearTimeout(clear);
  }, [shatterToken]);

  const showBarrier = (barrierOn && playerShield > 0) || absorbFlash;

  const barrierOpacity = useMemo(() => {
    if (!inCombat) return 0;
    if (playerShield <= 0) return 0;
    return 0.35 + Math.min(0.45, playerShield / MAX_PLAYER_SHIELD);
  }, [inCombat, playerShield]);

  if (!inCombat) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AnimatePresence>
        {showBarrier ? (
          <motion.div
            key={`barrier-${pulseToken}-${absorbToken}`}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{
              opacity: barrierOpacity + (absorbFlash ? 0.32 : 0),
              scale: absorbFlash ? [1, 1.06, 1] : [1, 1.02, 1],
            }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: absorbFlash ? 0.34 : 0.2 }}
            style={{
              position: "absolute",
              width: "min(42vw, 280px)",
              height: "min(42vw, 280px)",
              maxWidth: 280,
              maxHeight: 280,
              marginBottom: "6%",
              background:
                "radial-gradient(circle at 45% 40%, rgba(34,211,238,0.42) 0%, rgba(59,130,246,0.18) 45%, transparent 70%)",
              clipPath: HEX,
              boxShadow:
                "0 0 48px rgba(34,211,238,0.45), inset 0 0 36px rgba(165,243,252,0.22)",
              border: "1px solid rgba(103,232,249,0.5)",
              filter: absorbFlash
                ? "drop-shadow(0 0 22px rgba(34,211,238,0.95))"
                : "drop-shadow(0 0 14px rgba(34,211,238,0.55))",
            }}
          />
        ) : null}
      </AnimatePresence>

      {shards.map((s) => (
        <motion.span
          key={s.id}
          initial={{ opacity: 1, x: `${s.x}%`, y: `${s.y}%`, rotate: 0, scale: 1 }}
          animate={{
            opacity: 0,
            x: `${s.x + s.vx * 0.012}%`,
            y: `${s.y + s.vy * 0.012}%`,
            rotate: s.rot,
            scale: 0.2,
          }}
          transition={{ duration: 0.65, ease: "easeOut", delay: s.delay }}
          style={{
            position: "absolute",
            width: 9,
            height: 14,
            marginBottom: "6%",
            background: "linear-gradient(180deg, rgba(186,230,253,0.95), rgba(59,130,246,0.75))",
            clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
            boxShadow: "0 0 10px rgba(147,197,253,0.9)",
          }}
        />
      ))}
    </div>
  );
}

export default ShieldOverlay;
