import type { ReactNode, RefObject } from "react";

type BossAuraVFXProps = {
  children: ReactNode;
  trailARef: RefObject<HTMLDivElement | null>;
  trailBRef: RefObject<HTMLDivElement | null>;
};

/**
 * Ghost trail layers (updated imperatively from BossStage rAF).
 * Visible when velocity or attack pulses exceed thresholds.
 */
export function BossAuraVFX({ children, trailARef, trailBRef }: BossAuraVFXProps) {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        height: "100%",
        transform: "translateZ(0)",
      }}
    >
      <div
        ref={trailARef}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0,
          willChange: "transform, opacity, filter",
          mixBlendMode: "screen",
          borderRadius: 8,
          background:
            "radial-gradient(ellipse 52% 48% at 50% 48%, rgba(34,211,238,0.28) 0%, rgba(168,85,247,0.12) 42%, transparent 72%)",
          filter: "blur(10px)",
        }}
      />
      <div
        ref={trailBRef}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0,
          willChange: "transform, opacity, filter",
          mixBlendMode: "color-dodge",
          borderRadius: 8,
          background:
            "radial-gradient(ellipse 46% 40% at 50% 52%, rgba(251,113,133,0.2) 0%, transparent 68%)",
          filter: "blur(14px)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          height: "100%",
          transform: "translateZ(0)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default BossAuraVFX;
