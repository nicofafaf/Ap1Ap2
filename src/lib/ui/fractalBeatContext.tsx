import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useGameStore } from "../../store/useGameStore";

const FractalBeatContext = createContext<number | undefined>(undefined);

/** Subtile UI-Pulse — nicht jedes rAF in React state (vermeidet Dutzende Re-Renders pro Karte / Sekunde) */
const BEAT_PHASE_EPS = 0.022;
const BEAT_MAX_INTERVAL_MS = 52;
const BEAT_PULSE_FLOOR = 0.12;

function shouldPublishBeat(phase: number, now: number, lastV: number, lastT: number, pulseBoost: number) {
  if (pulseBoost > BEAT_PULSE_FLOOR) return true;
  if (Math.abs(phase - lastV) >= BEAT_PHASE_EPS) return true;
  return now - lastT >= BEAT_MAX_INTERVAL_MS;
}

export function useFractalBeat(): number {
  const ctx = useContext(FractalBeatContext);
  const [local, setLocal] = useState(0.5);
  const lastSentRef = useRef({ v: 0.5, t: 0 });
  useEffect(() => {
    if (ctx !== undefined) return;
    let rafId = 0;
    let cancelled = false;

    const tick = () => {
      if (cancelled || document.visibilityState === "hidden") {
        rafId = 0;
        return;
      }
      const phase = (Math.sin(performance.now() / 320) + 1) / 2;
      const now = performance.now();
      const { v, t } = lastSentRef.current;
      if (shouldPublishBeat(phase, now, v, t, 0)) {
        lastSentRef.current = { v: phase, t: now };
        setLocal(phase);
      }
      rafId = requestAnimationFrame(tick);
    };

    const resume = () => {
      if (cancelled || document.visibilityState === "hidden") return;
      if (!rafId) rafId = requestAnimationFrame(tick);
    };

    document.addEventListener("visibilitychange", resume);
    rafId = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", resume);
      cancelAnimationFrame(rafId);
    };
  }, [ctx]);
  return ctx !== undefined ? ctx : local;
}

type FractalBeatBridgeProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  children: ReactNode;
};

/** Liest optional Video-Zeit oder Fallback-Sinus; koppelt leicht an Kampf-Pulse */
export function FractalBeatBridge({ videoRef, children }: FractalBeatBridgeProps) {
  const [beat, setBeat] = useState(0.5);
  const damagePulse = useGameStore((s) => s.damagePulseToken);
  const lastPulseRef = useRef(0);
  const pulseBoostRef = useRef(0);
  const lastSentRef = useRef({ v: 0.5, t: 0 });

  useEffect(() => {
    if (damagePulse > lastPulseRef.current) {
      pulseBoostRef.current = 1;
    }
    lastPulseRef.current = damagePulse;
  }, [damagePulse]);

  useEffect(() => {
    let rafId = 0;
    let cancelled = false;

    const tick = () => {
      if (cancelled || document.visibilityState === "hidden") {
        rafId = 0;
        return;
      }
      const v = videoRef.current;
      let phase: number;
      if (v && !v.paused && v.readyState >= 2) {
        phase = (Math.sin(v.currentTime * Math.PI * 3.2) + 1) / 2;
      } else {
        phase = (Math.sin(performance.now() / 280) + 1) / 2;
      }
      if (pulseBoostRef.current > 0) {
        pulseBoostRef.current = Math.max(0, pulseBoostRef.current - 0.06);
        phase = Math.min(1, phase + pulseBoostRef.current * 0.35);
      }
      const now = performance.now();
      const pulse = pulseBoostRef.current;
      const { v: lv, t: lt } = lastSentRef.current;
      if (shouldPublishBeat(phase, now, lv, lt, pulse)) {
        lastSentRef.current = { v: phase, t: now };
        setBeat(phase);
      }
      rafId = requestAnimationFrame(tick);
    };

    const resume = () => {
      if (cancelled || document.visibilityState === "hidden") return;
      if (!rafId) rafId = requestAnimationFrame(tick);
    };

    document.addEventListener("visibilitychange", resume);
    rafId = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", resume);
      cancelAnimationFrame(rafId);
    };
  }, [videoRef]);

  return <FractalBeatContext.Provider value={beat}>{children}</FractalBeatContext.Provider>;
}
