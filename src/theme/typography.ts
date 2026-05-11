/** Zentral für TS/Inline-Styles — Iridium: Geist Mono + Inter (100), synchron zu globals.css */
export const typography = {
  fontSans:
    '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontMono:
    '"Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  /** Mindest-Basis 20px — ADHD-Lesepfad */
  bodySize: "clamp(20px, 0.35vw + 18px, 22px)",
  bodyLineHeight: 1.55,
  /** Display für Hero-Überschriften — Zielgröße ~42px */
  displaySize: "clamp(34px, 2.6vw + 22px, 42px)",
  fg: "var(--nx-bone-90)",
  fgMuted: "var(--nx-bone-55)",
  fgTertiary: "var(--nx-bone-25)",
  headingWeight: 100,
} as const;
