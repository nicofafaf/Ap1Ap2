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
  const [inView, setInView] = useState(false);
  const [armed, setArmed] = useState(priority);

  const wantsPlay =
    !reduceMotion &&
    armed &&
    (mode === "hover" ? hover : inView || priority);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node || reduceMotion || mode !== "viewport") return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { rootMargin: "80px 0px", threshold: 0.2 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [mode, reduceMotion]);

  useEffect(() => {
    if (!wantsPlay) {
      releaseEdtechVideoSlot(slotId);
      videoRef.current?.pause();
      return;
    }
    if (!acquireEdtechVideoSlot(slotId)) {
      videoRef.current?.pause();
      return;
    }
    const v = videoRef.current;
    if (v) {
      v.preload = "metadata";
      void v.play().catch(() => {});
    }
    return () => {
      releaseEdtechVideoSlot(slotId);
    };
  }, [wantsPlay, slotId]);

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
          preload="none"
          aria-hidden
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : null}
    </span>
  );
}
