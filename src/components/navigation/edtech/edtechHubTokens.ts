import type { CSSProperties } from "react";

export const EDTECH_STAGGER = {
  hidden: { opacity: 0, pointerEvents: "none" as const },
  show: {
    opacity: 1,
    pointerEvents: "auto" as const,
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
};

export const EDTECH_CARD = {
  hidden: { opacity: 0, y: 12, pointerEvents: "none" as const },
  show: {
    opacity: 1,
    y: 0,
    pointerEvents: "auto" as const,
    transition: { type: "spring" as const, stiffness: 320, damping: 28 },
  },
};

export const glassPanel: CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(226, 232, 240, 0.95)",
  background: "linear-gradient(165deg, rgba(255,255,255,0.94) 0%, rgba(248,250,252,0.88) 100%)",
  boxShadow: "0 16px 48px rgba(15,23,42,0.07), inset 0 1px 0 rgba(255,255,255,0.98)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

export const sectionH2: CSSProperties = {
  margin: "0 0 16px",
  fontFamily: "var(--nx-font-sans)",
  fontSize: "clamp(22px, 2.4vw, 28px)",
  fontWeight: 800,
  letterSpacing: "-0.03em",
  color: "#0f172a",
};

export const sectionH3: CSSProperties = {
  margin: "0 0 12px",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 20,
  fontWeight: 800,
  letterSpacing: "-0.02em",
  color: "#0f172a",
};

export const goldAccent = "rgba(214, 181, 111, 0.95)";
export const cyanAccent = "rgba(6, 182, 212, 0.95)";

export const edtechPageBackground =
  "linear-gradient(165deg, #f8fafc 0%, #f1f5f9 42%, #e8eef4 100%)";

export const edtechHeaderBar: CSSProperties = {
  flexShrink: 0,
  zIndex: 20,
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  padding: "clamp(12px, 2vw, 18px) clamp(16px, 3vw, 28px)",
  borderBottom: "1px solid rgba(226, 232, 240, 0.95)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.78) 100%)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
};
