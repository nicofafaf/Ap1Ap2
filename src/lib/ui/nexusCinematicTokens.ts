import type { CSSProperties } from "react";

export const cinematicGold = "rgba(214, 181, 111, 0.95)";
export const cinematicCyan = "rgba(6, 182, 212, 0.95)";

export const cinematicPageBg =
  "radial-gradient(ellipse 70% 50% at 8% 0%, rgba(6,182,212,0.1), transparent 55%), radial-gradient(ellipse 60% 45% at 92% 8%, rgba(214,181,111,0.12), transparent 52%), linear-gradient(165deg, #f8fafc 0%, #f1f5f9 42%, #e8eef4 100%)";

export const cinematicShellBase: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  width: "100%",
  border: "1px solid rgba(214, 181, 111, 0.35)",
  boxShadow: "0 28px 64px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.12)",
};

export const cinematicVideoLayer: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  objectPosition: "center center",
  transform: "scale(1.04)",
  filter: "saturate(1.08) contrast(1.1)",
};

export const cinematicGradientFallback: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(145deg, #0f172a 0%, #1e3a5f 42%, rgba(6, 182, 212, 0.22) 72%, rgba(214, 181, 111, 0.12) 100%)",
};

export const cinematicOverlay: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(15,23,42,0.78) 0%, rgba(15,23,42,0.42) 45%, rgba(15,23,42,0.72) 100%)",
};

export const cinematicKicker: CSSProperties = {
  display: "inline-block",
  fontFamily: "var(--nx-font-mono)",
  fontSize: 11,
  fontWeight: 750,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: cinematicGold,
  marginBottom: 10,
};

export const cinematicTitle: CSSProperties = {
  margin: 0,
  fontFamily: "var(--nx-font-sans)",
  fontWeight: 800,
  letterSpacing: "-0.04em",
  color: "#f8fafc",
  lineHeight: 1.08,
  textShadow: "0 2px 24px rgba(15, 23, 42, 0.65)",
};

export const cinematicLead: CSSProperties = {
  margin: "12px 0 0",
  fontFamily: "var(--nx-font-sans)",
  fontWeight: 550,
  lineHeight: 1.5,
  color: "rgba(248, 250, 252, 0.88)",
  textShadow: "0 1px 16px rgba(15, 23, 42, 0.55)",
};

export const cinematicPrimaryBtn: CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(214,181,111,0.55)",
  background: "linear-gradient(125deg, rgba(214,181,111,0.95) 0%, rgba(180,140,70,0.9) 100%)",
  color: "#0f172a",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 16,
  fontWeight: 800,
  padding: "12px 22px",
  cursor: "pointer",
  boxShadow: "0 12px 32px rgba(214,181,111,0.35)",
};

export const cinematicGhostBtn: CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(248,250,252,0.35)",
  background: "rgba(15,23,42,0.35)",
  color: "#f8fafc",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 16,
  fontWeight: 700,
  padding: "12px 22px",
  cursor: "pointer",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
};

export const cinematicGlassCard: CSSProperties = {
  borderRadius: 20,
  border: "1px solid rgba(214, 181, 111, 0.22)",
  background: "linear-gradient(165deg, rgba(255,255,255,0.97) 0%, rgba(248,250,252,0.94) 100%)",
  boxShadow:
    "0 1px 0 rgba(255,255,255,1) inset, 0 0 0 1px rgba(6, 182, 212, 0.06), 0 28px 72px rgba(15, 23, 42, 0.1)",
  backdropFilter: "blur(16px) saturate(140%)",
  WebkitBackdropFilter: "blur(16px) saturate(140%)",
};
