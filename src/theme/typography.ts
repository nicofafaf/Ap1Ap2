/** Zentral für TS/Inline-Styles — ruhige Premium-Lernoberfläche, synchron zu globals.css */
export const typography = {
  fontSans:
    '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontMono:
    '"Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  /** Mindest-Basis 24px — entspannt lesen statt HUD scannen */
  bodySize: "clamp(24px, 0.3vw + 22px, 26px)",
  bodyLineHeight: 1.68,
  displaySize: "var(--nx-type-display)",
  fg: "var(--nx-bone-90)",
  fgMuted: "var(--nx-bone-55)",
  fgTertiary: "var(--nx-bone-25)",
  headingWeight: 700,
  learnInk: "var(--nx-learn-ink)",
  learnMuted: "var(--nx-learn-muted)",
} as const;
