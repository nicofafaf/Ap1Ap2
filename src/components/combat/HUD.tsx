import type { CSSProperties } from "react";
import CombatHUD from "./CombatHUD";

const EDGE = "max(var(--nx-space-32), env(safe-area-inset-left, 0px))";
const EDGE_T = "max(var(--nx-space-32), env(safe-area-inset-top, 0px))";
const EDGE_B = "max(var(--nx-space-32), env(safe-area-inset-bottom, 0px))";

/** Angedeutete Koordinaten-Kreuze — Bone White nur über Opacity */
function PeripheralCrosshair({ style }: { style: CSSProperties }) {
  const arm = 8;
  const t = 16;
  return (
    <svg
      width={t}
      height={t}
      viewBox={`0 0 ${t} ${t}`}
      style={{
        position: "fixed",
        ...style,
        zIndex: 86,
        pointerEvents: "none",
        color: "var(--nx-bone)",
      }}
      aria-hidden
    >
      <path
        d={`M ${t / 2} 1 V ${arm} M ${t / 2} ${t - arm} V ${t - 1} M 1 ${t / 2} H ${arm} M ${t - arm} ${t / 2} H ${t - 1}`}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.5}
        strokeWidth={0.75}
        strokeLinecap="square"
      />
    </svg>
  );
}

/**
 * PERIPHERAL_HUD — 32px Raster + Safe-Area, Kreuze statt Rahmen
 */
export function HUD() {
  return (
    <>
      <PeripheralCrosshair style={{ top: EDGE_T, left: EDGE }} />
      <PeripheralCrosshair style={{ top: EDGE_T, right: EDGE, transform: "scaleX(-1)" }} />
      <PeripheralCrosshair
        style={{ bottom: EDGE_B, left: EDGE, transform: "scaleY(-1)" }}
      />
      <PeripheralCrosshair
        style={{
          bottom: EDGE_B,
          right: EDGE,
          transform: "scale(-1,-1)",
        }}
      />
      <CombatHUD />
    </>
  );
}

export default HUD;
