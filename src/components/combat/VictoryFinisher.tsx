import { useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import { useBossAudioEngine } from "../../lib/audio/bossAudioEngine";
import { useGameStore } from "../../store/useGameStore";
import {
  VICTORY_FREEZE_MS,
  VICTORY_IMPLODE_MS,
  VICTORY_SHATTER_PHYSICS_MS,
  dispatchVictoryEnergyWave,
} from "../../lib/combat/finishLogic";
import {
  hideNexusCombatFxCanvas,
  obtainNexusCombatFxCanvas,
} from "../../lib/combat/lootLogic";

type Shard = {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
};

type VictoryFinisherProps = {
  captureRef: React.RefObject<HTMLElement | null>;
};

function runShardPhysics(
  canvas: HTMLCanvasElement,
  shards: Shard[],
  source: HTMLCanvasElement,
  signal: AbortSignal
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let last = performance.now();
  const endAt = last + VICTORY_SHATTER_PHYSICS_MS;
  const gravity = 0.00115;

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

  const onResize = () => resize();
  window.addEventListener("resize", onResize);

  const step = (now: number) => {
    if (signal.aborted || now >= endAt) {
      window.removeEventListener("resize", onResize);
      return;
    }
    const dt = Math.min(48, now - last);
    last = now;
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    for (let i = 0; i < shards.length; i += 1) {
      const s = shards[i];
      s.vy += gravity * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rot += s.vr * (dt / 16);
      s.vx *= 0.9992;

      ctx.save();
      ctx.translate(s.x + s.w / 2, s.y + s.h / 2);
      ctx.rotate(s.rot);
      ctx.translate(-(s.x + s.w / 2), -(s.y + s.h / 2));
      try {
        ctx.drawImage(
          source,
          s.sx,
          s.sy,
          s.sw,
          s.sh,
          s.x,
          s.y,
          s.w,
          s.h
        );
      } catch {
        // no-op
      }
      ctx.restore();
    }
    ctx.restore();

    requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

function buildShards(
  imgW: number,
  imgH: number,
  screenW: number,
  screenH: number
): Shard[] {
  const cols = 22;
  const rows = 18;
  const shards: Shard[] = [];
  const cw = imgW / cols;
  const ch = imgH / rows;
  const scaleX = screenW / imgW;
  const scaleY = screenH / imgH;

  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      const jitterX = (Math.random() - 0.5) * cw * 0.22;
      const jitterY = (Math.random() - 0.5) * ch * 0.22;
      const sx = Math.max(0, Math.min(imgW - 1, i * cw + jitterX));
      const sy = Math.max(0, Math.min(imgH - 1, j * ch + jitterY));
      const sw = Math.max(1, Math.min(imgW - sx, cw * (0.85 + Math.random() * 0.35)));
      const sh = Math.max(1, Math.min(imgH - sy, ch * (0.85 + Math.random() * 0.35)));
      const x = sx * scaleX;
      const y = sy * scaleY;
      const w = sw * scaleX;
      const h = sh * scaleY;
      const cx = screenW / 2;
      const cy = screenH / 2;
      const spread =
        Math.hypot(x + w / 2 - cx, y + h / 2 - cy) / Math.max(1, screenH);
      shards.push({
        x,
        y,
        w,
        h,
        vx: (Math.random() - 0.5) * 0.55 + spread * (Math.random() - 0.3) * 0.4,
        vy: -0.15 - Math.random() * 0.35 - spread * 0.5,
        rot: (Math.random() - 0.5) * 0.4,
        vr: (Math.random() - 0.5) * 0.018,
        sx,
        sy,
        sw,
        sh,
      });
    }
  }
  return shards;
}

export function VictoryFinisher({ captureRef }: VictoryFinisherProps) {
  const token = useGameStore((s) => s.victoryFinisherToken);
  const setFinisherPhase = useGameStore((s) => s.setVictoryFinisherPhase);
  const completeFinisher = useGameStore((s) => s.completeVictoryFinisher);
  const { playVictoryFinisherSequence } = useBossAudioEngine();
  const lastHandledRef = useRef(0);

  useEffect(() => {
    if (token === 0 || token === lastHandledRef.current) return;
    lastHandledRef.current = token;

    const ac = new AbortController();
    const { signal } = ac;

    const schedule = (ms: number, fn: () => void) => {
      const id = window.setTimeout(() => {
        if (!signal.aborted) fn();
      }, ms);
      return id;
    };

    const timers: number[] = [];
    let capturePromise: Promise<HTMLCanvasElement | null> = Promise.resolve(null);

    void playVictoryFinisherSequence(signal);
    dispatchVictoryEnergyWave();

    timers.push(
      schedule(VICTORY_IMPLODE_MS, () => {
        setFinisherPhase("freeze");
        const root = captureRef.current;
        capturePromise = root
          ? html2canvas(root, {
              scale: 0.72,
              useCORS: true,
              logging: false,
              backgroundColor: "#030b12",
            }).catch(() => null)
          : Promise.resolve(null);
      })
    );

    timers.push(
      schedule(VICTORY_IMPLODE_MS + VICTORY_FREEZE_MS, async () => {
        if (signal.aborted) return;
        setFinisherPhase("shatter");

        const snap = await capturePromise;

        if (signal.aborted) return;

        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const source = document.createElement("canvas");
        const iw = snap?.width ?? 16;
        const ih = snap?.height ?? 16;
        source.width = iw;
        source.height = ih;
        const sctx = source.getContext("2d");
        if (snap && sctx) {
          sctx.drawImage(snap, 0, 0);
        } else if (sctx) {
          sctx.fillStyle = "#061018";
          sctx.fillRect(0, 0, iw, ih);
        }

        const shards = buildShards(iw, ih, screenW, screenH);
        const overlay = obtainNexusCombatFxCanvas({
          zIndex: "2147483000",
          mixBlendMode: "normal",
        });

        runShardPhysics(overlay, shards, source, signal);

        window.setTimeout(() => {
          hideNexusCombatFxCanvas();
          if (!signal.aborted) completeFinisher();
        }, VICTORY_SHATTER_PHYSICS_MS);
      })
    );

    return () => {
      ac.abort();
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [
    token,
    captureRef,
    setFinisherPhase,
    completeFinisher,
    playVictoryFinisherSequence,
  ]);

  return null;
}
