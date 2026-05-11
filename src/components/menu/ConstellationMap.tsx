import { motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type WheelEvent,
} from "react";
import { getNexusEntryForLF, type LearningField } from "../../data/nexusRegistry";
import { computeAllSectorStabilities } from "../../lib/math/mapLogic";
import { playHallVictoryLog } from "../../lib/audio/menuAudioEngine";
import type { CombatArchitectReportEntry } from "../../store/useGameStore";

type StarNode = {
  entry: CombatArchitectReportEntry;
  x: number;
  y: number;
  z: number;
  color: string;
  glow: string;
};

function hashUnit3(seed: string, salt: number): [number, number, number] {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const u = (n: number) => ((n >>> 0) % 0xffff) / 0xffff;
  const a = u(h) * Math.PI * 2;
  const b = u(h ^ 0x9e3779b9);
  const c = u(h ^ 0x85ebca6b);
  const phi = Math.acos(2 * b - 1);
  const r = 160 + c * 380;
  const sinP = Math.sin(phi);
  return [r * sinP * Math.cos(a), r * sinP * Math.sin(a), r * Math.cos(phi)];
}

function rotateY(x: number, y: number, z: number, ang: number): [number, number, number] {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return [x * c + z * s, y, -x * s + z * c];
}

function rotateX(x: number, y: number, z: number, ang: number): [number, number, number] {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return [x, y * c - z * s, y * s + z * c];
}

function project(
  x: number,
  y: number,
  z: number,
  cx: number,
  cy: number,
  camZ: number,
  fov: number
): { sx: number; sy: number; scale: number; ok: boolean } {
  const pz = z + camZ;
  if (pz < 40) return { sx: 0, sy: 0, scale: 0, ok: false };
  const s = fov / pz;
  return { sx: cx + x * s, sy: cy + y * s, scale: s, ok: true };
}

function rankPulse(rank: string): number {
  if (rank === "S") return 1;
  if (rank === "A") return 0.82;
  if (rank === "B") return 0.64;
  return 0.48;
}

function lineAlphaForStability(a: number, b: number): number {
  const m = Math.min(a, b);
  const t = Math.min(1, Math.max(0, m / 4));
  return 0.07 + t * 0.78;
}

export type ConstellationMapProps = {
  history: CombatArchitectReportEntry[];
  className?: string;
};

export function ConstellationMap({ history, className }: ConstellationMapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const rotRef = useRef({ x: 0.35, y: -0.5 });
  const draggingRef = useRef(false);
  const dragDistRef = useRef(0);
  const lastPtrRef = useRef({ x: 0, y: 0 });
  const camDistRef = useRef(920);
  const rafRef = useRef<number>(0);

  const stabilities = useMemo(() => computeAllSectorStabilities(history), [history]);

  const stars: StarNode[] = useMemo(() => {
    const sorted = [...history].sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );
    return sorted.map((entry, idx) => {
      const lfKey = `LF${Math.max(1, Math.min(12, entry.activeLF))}` as LearningField;
      const nx = getNexusEntryForLF(lfKey);
      const [jx, jy, jz] = hashUnit3(entry.reportId, idx * 9973);
      const spread = idx * 0.018;
      return {
        entry,
        x: jx * (0.92 + spread),
        y: jy * (0.92 + spread),
        z: jz * (0.92 + spread),
        color: nx.combatPalette.primary,
        glow: nx.combatPalette.accent,
      };
    });
  }, [history]);

  type ProjHit = {
    sx: number;
    sy: number;
    r: number;
    rz: number;
    entry: CombatArchitectReportEntry;
    node: StarNode;
  };
  const projectedRef = useRef<ProjHit[]>([]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "rgba(2, 6, 12, 0.94)";
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.48;
    const { x: rx, y: ry } = rotRef.current;
    const camZ = camDistRef.current;
    const fov = 640;

    const proj3 = (sx: number, sy: number, sz: number) => {
      let x = sx;
      let y = sy;
      let z = sz;
      [x, y, z] = rotateY(x, y, z, ry);
      [x, y, z] = rotateX(x, y, z, rx);
      return { x, y, z, p: project(x, y, z, cx, cy, camZ, fov) };
    };

    const projs: ProjHit[] = [];
    for (const s of stars) {
      const { z: rz, p } = proj3(s.x, s.y, s.z);
      if (!p.ok) continue;
      const pulse = rankPulse(s.entry.combatRank);
      const r = Math.max(2.2, 5.5 * p.scale * 120 * pulse);
      projs.push({ sx: p.sx, sy: p.sy, r, rz, entry: s.entry, node: s });
    }
    projectedRef.current = projs;

    ctx.save();
    ctx.strokeStyle = "rgba(34, 211, 238, 0.04)";
    ctx.lineWidth = 1;
    const gridStep = 48;
    for (let gx = 0; gx < w; gx += gridStep) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
    }
    for (let gy = 0; gy < h; gy += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < stars.length - 1; i += 1) {
      const a = stars[i]!;
      const b = stars[i + 1]!;
      const pa = proj3(a.x, a.y, a.z).p;
      const pb = proj3(b.x, b.y, b.z).p;
      if (!pa.ok || !pb.ok) continue;
      const sa = stabilities[a.entry.activeLF] ?? 0;
      const sb = stabilities[b.entry.activeLF] ?? 0;
      const alpha = lineAlphaForStability(sa, sb);
      ctx.save();
      ctx.strokeStyle = `rgba(103, 232, 249, ${alpha * 0.55})`;
      ctx.lineWidth = 0.85 + alpha * 1.2;
      ctx.beginPath();
      ctx.moveTo(pa.sx, pa.sy);
      ctx.lineTo(pb.sx, pb.sy);
      ctx.stroke();
      ctx.restore();
    }

    const byDepth = [...projs].sort((u, v) => u.rz - v.rz);
    for (const pr of byDepth) {
      const s = pr.node;
      const g = ctx.createRadialGradient(pr.sx, pr.sy, 0, pr.sx, pr.sy, pr.r * 4);
      g.addColorStop(0, s.color);
      g.addColorStop(0.35, s.glow);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(pr.sx, pr.sy, pr.r * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.beginPath();
      ctx.arc(pr.sx, pr.sy, pr.r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [stars, stabilities]);

  useEffect(() => {
    const loop = () => {
      draw();
      rafRef.current = window.requestAnimationFrame(loop);
    };
    rafRef.current = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(rafRef.current);
  }, [draw]);

  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

  const onPointerDown = useCallback((e: PointerEvent) => {
    draggingRef.current = true;
    dragDistRef.current = 0;
    lastPtrRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastPtrRef.current.x;
    const dy = e.clientY - lastPtrRef.current.y;
    dragDistRef.current += Math.abs(dx) + Math.abs(dy);
    lastPtrRef.current = { x: e.clientX, y: e.clientY };
    rotRef.current.y += dx * 0.0065;
    rotRef.current.x = Math.max(-1.1, Math.min(1.1, rotRef.current.x + dy * 0.0065));
  }, []);

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    camDistRef.current = Math.max(
      520,
      Math.min(1400, camDistRef.current + e.deltaY * 0.65)
    );
  }, []);

  const [hovering, setHovering] = useState(false);

  const pickStar = useCallback(
    (clientX: number, clientY: number) => {
      const wrap = wrapRef.current;
      if (!wrap) return null;
      const rect = wrap.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;
      const list = projectedRef.current;
      let best = -1;
      let bestD = 1e9;
      for (let i = 0; i < list.length; i += 1) {
        const p = list[i]!;
        const d = (p.sx - mx) ** 2 + (p.sy - my) ** 2;
        const hit = p.r * 3.2;
        if (d < hit * hit && d < bestD) {
          bestD = d;
          best = i;
        }
      }
      return best >= 0 ? list[best]!.entry : null;
    },
    []
  );

  const onClick = useCallback(
    (e: MouseEvent) => {
      if (dragDistRef.current > 14) return;
      const hit = pickStar(e.clientX, e.clientY);
      if (!hit) return;
      const lfKey = `LF${Math.max(1, Math.min(12, hit.activeLF))}` as LearningField;
      const path = getNexusEntryForLF(lfKey).audio.victoryPath;
      playHallVictoryLog(path);
    },
    [pickStar]
  );

  const onMoveHover = useCallback(
    (e: MouseEvent) => {
      const hit = pickStar(e.clientX, e.clientY);
      setHovering(Boolean(hit));
    },
    [pickStar]
  );

  const empty = stars.length === 0;

  return (
    <motion.div
      ref={wrapRef}
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      style={{
        position: "relative",
        width: "100%",
        minHeight: 320,
        flex: 1,
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid rgba(34,211,238,0.22)",
        cursor: hovering ? "pointer" : "grab",
      }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerMove={onPointerMove}
      onWheel={onWheel}
      onClick={onClick}
      onMouseMove={onMoveHover}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
      {empty ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(103,232,249,0.55)",
            fontSize: 12,
            letterSpacing: ".2em",
            pointerEvents: "none",
          }}
        >
          Keine archivierten Siege — das Sternfeld wartet auf den ersten Abschluss
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 12,
          bottom: 10,
          fontSize: 9,
          letterSpacing: ".18em",
          color: "rgba(103,232,249,0.5)",
          pointerEvents: "none",
        }}
      >
        Ziehen · Zoom · Stern — Audio-Log (Zeitlupe)
      </div>
    </motion.div>
  );
}

export default ConstellationMap;
