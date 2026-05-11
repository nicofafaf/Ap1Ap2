/** Zentral für TS/Inline-Styles — synchron zu globals.css (Bone + Opacity) */
export const typography = {
  fontSans:
    '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontMono:
    '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  bodySize: "clamp(16px, 0.42vw + 15px, 18px)",
  bodyLineHeight: 1.55,
  fg: "var(--nx-bone-90)",
  fgMuted: "var(--nx-bone-50)",
  fgTertiary: "var(--nx-bone-25)",
  headingWeight: 650,
} as const;
