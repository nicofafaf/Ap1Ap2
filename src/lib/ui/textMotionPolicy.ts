import type { Transition } from "framer-motion";

/** Glitch-/Stör-Animationen nur bei sehr kurzen Texten (≤3 Wörter), Lesbarkeit bei Fließtext */
export function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

export function allowGlitchMotionForText(text: string, maxWords = 3): boolean {
  return wordCount(text) <= maxWords;
}

/** THE_WEIGHT_OF_MOTION — hohe träge Federn, physisches Gewicht */
export const NX_SPRING_PHYSICS = { stiffness: 40, damping: 20 };

export const NX_UI_SPRING = {
  type: "spring" as const,
  ...NX_SPRING_PHYSICS,
};

/** Schnelle, cinematische Ease — konsistent mit Kampf-HUD Einstiegen */
export const NX_UI_EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Bei prefers-reduced-motion: keine Federn, minimaler Crossfade */
export const NX_UI_INSTANT = {
  type: "tween" as const,
  duration: 0.01,
  ease: "linear" as const,
};

export function nxHudEntranceTransition(reducedMotion: boolean | null) {
  return reducedMotion ? NX_UI_INSTANT : NX_UI_SPRING;
}

export function nxHudPulseTransition(
  reducedMotion: boolean | null,
  normal: Pick<Transition, "duration" | "ease">
): Transition {
  return reducedMotion ? { duration: 0.01 } : normal;
}

/** SkillCard Parallax-Tilt — bei reduced motion praktisch starr */
export function nxSkillCardTiltSpring(reducedMotion: boolean | null) {
  return reducedMotion
    ? { stiffness: 6000, damping: 95 }
    : { stiffness: 180, damping: 18 };
}

/** BossStage layoutId Dive-Brücke */
export function nxBossSharedLayoutTransition(reducedMotion: boolean | null): Transition {
  return reducedMotion
    ? NX_UI_INSTANT
    : { type: "spring", stiffness: 320, damping: 34 };
}

/** Panel-Einflug: kaum sichtbarer Overshoot — wirkt weniger „aufgezoomt“ */
export const NX_PANEL_ENTRANCE_INITIAL = { scale: 1.018, opacity: 1 };
export const NX_PANEL_ENTRANCE_ANIMATE = { scale: 1, opacity: 1 };

export function nxUiSpringTransition(overrides?: Partial<{ stiffness: number; damping: number }>) {
  return {
    type: "spring" as const,
    stiffness: overrides?.stiffness ?? NX_UI_SPRING.stiffness,
    damping: overrides?.damping ?? NX_UI_SPRING.damping,
  };
}
