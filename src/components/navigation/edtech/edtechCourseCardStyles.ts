import type { CSSProperties } from "react";
import { cyanAccent } from "./edtechHubTokens";

export const edtechCourseGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 200px), 1fr))",
  gap: 14,
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
  height: 118,
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
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  color: "#f8fafc",
  background: "rgba(15,23,42,0.72)",
  padding: "4px 8px",
  borderRadius: 6,
  border: `1px solid ${cyanAccent}`,
};

export const edtechCourseBody: CSSProperties = {
  padding: "12px 14px 16px",
  display: "flex",
  flexDirection: "column",
  gap: 4,
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
  fontSize: 16,
  fontWeight: 800,
  color: "#0f172a",
  lineHeight: 1.25,
};

export const edtechCourseMeta: CSSProperties = {
  fontFamily: "var(--nx-font-sans)",
  fontSize: 13,
  color: "#64748b",
  marginTop: 2,
};

export const edtechPrimaryBtn: CSSProperties = {
  borderRadius: 12,
  border: "1px solid rgba(37, 99, 235, 0.35)",
  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
  color: "#fff",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 14,
  fontWeight: 800,
  padding: "10px 18px",
  cursor: "pointer",
  boxShadow: "0 12px 32px rgba(37, 99, 235, 0.22)",
};

export const edtechGhostBtn: CSSProperties = {
  borderRadius: 12,
  border: "1px solid rgba(148, 163, 184, 0.55)",
  background: "rgba(255,255,255,0.92)",
  color: "#0f172a",
  fontFamily: "var(--nx-font-sans)",
  fontSize: 14,
  fontWeight: 750,
  padding: "10px 18px",
  cursor: "pointer",
  boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
};

export const edtechMenuBtn: CSSProperties = {
  borderRadius: 10,
  border: "1px solid rgba(148, 163, 184, 0.55)",
  background: "rgba(255,255,255,0.94)",
  color: "#0f172a",
  letterSpacing: ".06em",
  fontSize: 12,
  fontWeight: 700,
  padding: "10px 14px",
  cursor: "pointer",
  boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
};
