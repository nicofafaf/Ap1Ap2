import type { CSSProperties } from "react";
import { cyanAccent, goldAccent } from "./edtechHubTokens";

export const edtechCourseGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 252px), 1fr))",
  gap: 18,
  alignItems: "stretch",
};

export const edtechCourseCardShell: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  padding: 0,
  overflow: "hidden",
  textAlign: "left",
  cursor: "pointer",
};

export const edtechCourseThumbWrap: CSSProperties = {
  position: "relative",
  height: 128,
  background: "linear-gradient(145deg, #0f172a 0%, #1e293b 100%)",
};

export const edtechCourseThumbImg: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

export const edtechCourseLfBadge: CSSProperties = {
  position: "absolute",
  top: 10,
  left: 10,
  fontFamily: "var(--nx-font-mono)",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.1em",
  color: "#f8fafc",
  background: "rgba(15,23,42,0.78)",
  padding: "5px 9px",
  borderRadius: 8,
  border: `1px solid rgba(6,182,212,0.55)`,
  boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
};

export const edtechCourseBody: CSSProperties = {
  padding: "clamp(12px, 3vw, 14px) clamp(12px, 3.5vw, 16px) clamp(14px, 3.5vw, 16px)",
  display: "flex",
  flexDirection: "column",
  gap: 6,
  flex: "1 1 auto",
  minHeight: 0,
};

export const edtechCourseAp: CSSProperties = {
  fontFamily: "var(--nx-font-mono)",
  fontSize: 11,
  fontWeight: 750,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#94a3b8",
};

export const edtechCourseTitle: CSSProperties = {
  fontFamily: "var(--nx-font-sans)",
  fontSize: "clamp(14px, 3.6vw, 15px)",
  fontWeight: 800,
  color: "#0f172a",
  lineHeight: 1.3,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical" as const,
  overflow: "hidden",
  minHeight: "2.6em",
};

export const edtechCourseMeta: CSSProperties = {
  fontFamily: "var(--nx-font-sans)",
  fontSize: 12,
  color: "#64748b",
  lineHeight: 1.35,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const edtechLfProgressTrack: CSSProperties = {
  height: 5,
  borderRadius: 999,
  background: "rgba(148, 163, 184, 0.22)",
  overflow: "hidden",
  marginTop: 2,
};

export const edtechLfProgressFill: CSSProperties = {
  height: "100%",
  borderRadius: 999,
  background: `linear-gradient(90deg, ${cyanAccent} 0%, ${goldAccent} 100%)`,
  transition: "width 0.35s ease",
};

export const edtechLfFooterRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  marginTop: 4,
  minHeight: 22,
};

export const edtechLfTierPill: CSSProperties = {
  flexShrink: 0,
  fontFamily: "var(--nx-font-mono)",
  fontSize: 10,
  fontWeight: 750,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  padding: "3px 8px",
  borderRadius: 999,
  border: "1px solid rgba(226, 232, 240, 0.95)",
};

export const edtechLfSectionTitle: CSSProperties = {
  margin: "0 0 12px",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
  color: "#64748b",
};

export const edtechLfSectionBlock: CSSProperties = {
  marginBottom: 28,
};

export { edtechPrimaryBtn, edtechGhostBtn, edtechMenuBtn } from "./edtechHubTokens";
