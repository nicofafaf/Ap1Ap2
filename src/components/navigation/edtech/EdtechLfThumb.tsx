import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { getNexusEntryForLF, publicAssetUrl, type LearningField } from "../../../data/nexusRegistry";
import { cyanAccent, goldAccent } from "./edtechHubTokens";
import { edtechCourseThumbImg, edtechCourseThumbWrap } from "./edtechCourseCardStyles";

type EdtechLfThumbProps = {
  lf: number;
  /** Tages-LF: Video sofort laden wenn sichtbar */
  priority?: boolean;
};

/**
 * Max. ein Video pro sichtbarer Karte — kein 12× autoplay (Main-Thread + Decoder).
 */
export function EdtechLfThumb({ lf, priority = false }: EdtechLfThumbProps) {
  const reduceMotion = useReducedMotion();
  const wrapRef = useRef<HTMLSpanElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [hover, setHover] = useState(false);

  const lfKey = `LF${lf}` as LearningField;
  const videoSrc =
    getNexusEntryForLF(lfKey).bossVisual.primaryPath || publicAssetUrl(`/assets/LF${lf}GIF.mp4`);

  const shouldPlay = !reduceMotion && (visible || hover || priority);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node || reduceMotion) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry?.isIntersecting ?? false),
      { rootMargin: "120px 0px", threshold: 0.12 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [reduceMotion]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (shouldPlay) {
      if (v.preload === "none") v.preload = "metadata";
      void v.play().catch(() => {});
      return;
    }
    v.pause();
  }, [shouldPlay]);

  return (
    <span
      ref={wrapRef}
      style={edtechCourseThumbWrap}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(145deg, #0f172a 0%, #1e293b 42%, rgba(6,182,212,0.18) 100%)`,
        }}
      />
      {shouldPlay ? (
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          loop
          playsInline
          preload={priority ? "metadata" : "none"}
          aria-hidden
          style={edtechCourseThumbImg}
        />
      ) : null}
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, transparent 0%, rgba(15,23,42,0.35) 55%, rgba(15,23,42,0.82) 100%)",
          pointerEvents: "none",
        }}
      />
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 3,
          background: `linear-gradient(90deg, ${cyanAccent}, ${goldAccent})`,
          opacity: hover || priority ? 1 : 0.65,
        }}
      />
    </span>
  );
}
