import type { CSSProperties } from "react";
import { cyanAccent } from "./edtechHubTokens";

export const edtechCourseGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))",
  gap: 16,
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

export { edtechPrimaryBtn, edtechGhostBtn, edtechMenuBtn } from "./edtechHubTokens";
