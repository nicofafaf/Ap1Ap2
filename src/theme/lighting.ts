import type { CSSProperties } from "react";

export const NX_VANTABLACK = "#050507";
export const NX_BONE_WHITE = "#E8E9F0";
export const NX_PANEL_FROST = "rgba(20, 22, 27, 0.6)";
export const NX_TUNGSTEN_GOLD = "rgba(255, 214, 165, 0.32)";

export const NX_DEPTH_SHADOW = "rgba(5, 5, 7, 0.62)";

/** @deprecated Alias — use NX_VANTABLACK */
export const NX_OBSIDIAN = NX_VANTABLACK;
/** @deprecated Alias — use NX_BONE_WHITE */
export const NX_IVORY_LIGHT = NX_BONE_WHITE;

export const NX_IVORY_MICRO_GLOW =
  "drop-shadow(0 0 24px rgba(255, 214, 165, 0.05)) drop-shadow(0 0 2px rgba(232, 233, 240, 0.04))";

export const nxPanelDropShadow = `0 32px 64px ${NX_DEPTH_SHADOW}`;

export function nxUiBloomExtra(style: CSSProperties): CSSProperties {
  const prev = (style.filter as string | undefined) ?? "none";
  const combined =
    prev === "none" || !prev ? NX_IVORY_MICRO_GLOW : `${prev} ${NX_IVORY_MICRO_GLOW}`;
  return { ...style, filter: combined };
}
