import type { CSSProperties } from "react";

export const EDTECH_STAGGER = {
  hidden: { opacity: 0, pointerEvents: "none" as const },
  show: {
    opacity: 1,
    pointerEvents: "auto" as const,
    transition: { staggerChildren: 0.03, delayChildren: 0.01 },
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

/** Karten-Grid: ohne backdrop-blur — spart GPU auf der Lernseite */
export const edtechCardPanel: CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(226, 232, 240, 0.92)",
  background: "linear-gradient(165deg, #ffffff 0%, #f8fafc 100%)",
  boxShadow: "0 10px 32px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,1)",
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
  "radial-gradient(ellipse 70% 50% at 8% 0%, rgba(6,182,212,0.08), transparent 55%), radial-gradient(ellipse 60% 45% at 92% 8%, rgba(214,181,111,0.1), transparent 52%), linear-gradient(165deg, #f8fafc 0%, #f1f5f9 42%, #e8eef4 100%)";

export const edtechPrimaryBtn: CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(214,181,111,0.55)",
  background: "linear-gradient(125deg, rgba(214,181,111,0.95) 0%, rgba(180,140,70,0.9) 100%)",
  color: "#0f172a",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 14,
  fontWeight: 800,
  padding: "10px 20px",
  cursor: "pointer",
  boxShadow: "0 12px 32px rgba(214,181,111,0.28)",
};

export const edtechGhostBtn: CSSProperties = {
  borderRadius: 999,
  border: `1px solid ${cyanAccent}`,
  background: "linear-gradient(90deg, rgba(6,182,212,0.12) 0%, rgba(214,181,111,0.08) 100%)",
  color: "#0f172a",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 13,
  fontWeight: 750,
  padding: "8px 16px",
  cursor: "pointer",
};

export const edtechMenuBtn: CSSProperties = {
  borderRadius: 10,
  border: "1px solid rgba(148, 163, 184, 0.45)",
  background: "rgba(255,255,255,0.96)",
  color: "#0f172a",
  letterSpacing: ".04em",
  fontSize: 12,
  fontWeight: 700,
  padding: "10px 14px",
  cursor: "pointer",
  boxShadow: "0 6px 20px rgba(15,23,42,0.05)",
};

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
