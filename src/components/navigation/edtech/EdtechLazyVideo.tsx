import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";
import { acquireEdtechVideoSlot, releaseEdtechVideoSlot } from "./edtechVideoBudget";

export type EdtechLazyVideoMode = "hover" | "viewport";

type EdtechLazyVideoProps = {
  src: string;
  mode: EdtechLazyVideoMode;
  style?: CSSProperties;
  /** viewport: sofort sichtbar halten (Hero) */
  priority?: boolean;
};

/**
 * Lernseiten-Video: erst bei Hover oder im Viewport, global nur 1 Slot.
 */
export function EdtechLazyVideo({ src, mode, style, priority = false }: EdtechLazyVideoProps) {
  const reduceMotion = useReducedMotion();
  const reactId = useId();
  const slotId = `edtech-vid-${reactId}`;
  const wrapRef = useRef<HTMLSpanElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hover, setHover] = useState(false);
  const [inView, setInView] = useState(priority);
  const [armed, setArmed] = useState(priority);
  const [loadFailed, setLoadFailed] = useState(false);

  const viewportVisible = mode === "viewport" && (inView || priority);

  const wantsPlay =
    !reduceMotion &&
    !loadFailed &&
    armed &&
    (mode === "hover" ? hover : viewportVisible);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node || reduceMotion || mode !== "viewport") return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { rootMargin: "80px 0px", threshold: 0.15 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [mode, reduceMotion]);

  /** Viewport: Video mounten sobald sichtbar — Hover geht auf .nx-cinematic-media nicht (pointer-events: none) */
  useEffect(() => {
    if (mode === "viewport" && viewportVisible) {
      setArmed(true);
    }
  }, [mode, viewportVisible]);

  useEffect(() => {
    setLoadFailed(false);
  }, [src]);

  useEffect(() => {
    const v = videoRef.current;
    if (!armed || !v) return;

    if (!wantsPlay) {
      releaseEdtechVideoSlot(slotId);
      v.pause();
      if (mode === "viewport" && viewportVisible) {
        v.preload = "metadata";
        v.load();
      }
      return;
    }
    if (!acquireEdtechVideoSlot(slotId)) {
      v.pause();
      v.preload = "metadata";
      v.load();
      return;
    }
    v.preload = "auto";
    void v.play().catch(() => {});
    return () => {
      releaseEdtechVideoSlot(slotId);
    };
  }, [wantsPlay, slotId, armed, mode, viewportVisible]);

  return (
    <span
      ref={wrapRef}
      style={{ display: "block", position: "relative", overflow: "hidden", ...style }}
      onPointerEnter={() => {
        setHover(true);
        setArmed(true);
      }}
      onPointerLeave={() => setHover(false)}
      onFocus={() => {
        setHover(true);
        setArmed(true);
      }}
      onBlur={() => setHover(false)}
    >
      {armed ? (
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          preload={viewportVisible || priority ? "metadata" : "none"}
          aria-hidden
          onError={() => setLoadFailed(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            opacity: wantsPlay || (mode === "viewport" && armed) ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}
        />
      ) : null}
    </span>
  );
}
