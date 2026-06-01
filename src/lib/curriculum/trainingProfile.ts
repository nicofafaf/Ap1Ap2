import type { LearningField } from "../../data/nexusRegistry";

/** Fachinformatiker Fachrichtungen (Scope der App) */
export type TrainingTrack = "ae" | "fisi";

export type BundeslandId =
  | "BW"
  | "BY"
  | "BE"
  | "BB"
  | "HB"
  | "HH"
  | "HE"
  | "MV"
  | "NI"
  | "NW"
  | "RP"
  | "SL"
  | "SN"
  | "ST"
  | "SH"
  | "TH";

export type BundeslandOption = {
  id: BundeslandId;
  label: string;
};

/** Alle Bundesländer — Inhaltsbasis bleibt KMK-Rahmenlehrplan (bundeseinheitlich) */
export const BUNDESLAND_OPTIONS: readonly BundeslandOption[] = [
  { id: "BW", label: "Baden-Württemberg" },
  { id: "BY", label: "Bayern" },
  { id: "BE", label: "Berlin" },
  { id: "BB", label: "Brandenburg" },
  { id: "HB", label: "Bremen" },
  { id: "HH", label: "Hamburg" },
  { id: "HE", label: "Hessen" },
  { id: "MV", label: "Mecklenburg-Vorpommern" },
  { id: "NI", label: "Niedersachsen" },
  { id: "NW", label: "Nordrhein-Westfalen" },
  { id: "RP", label: "Rheinland-Pfalz" },
  { id: "SL", label: "Saarland" },
  { id: "SN", label: "Sachsen" },
  { id: "ST", label: "Sachsen-Anhalt" },
  { id: "SH", label: "Schleswig-Holstein" },
  { id: "TH", label: "Thüringen" },
] as const;

export const DEFAULT_BUNDESLAND: BundeslandId = "BW";

export const TRAINING_TRACK_OPTIONS: readonly {
  id: TrainingTrack;
  titleKey: string;
  leadKey: string;
  ap2Key: string;
}[] = [
  {
    id: "ae",
    titleKey: "onboarding.trackAeTitle",
    leadKey: "onboarding.trackAeLead",
    ap2Key: "onboarding.trackAeAp2",
  },
  {
    id: "fisi",
    titleKey: "onboarding.trackFisiTitle",
    leadKey: "onboarding.trackFisiLead",
    ap2Key: "onboarding.trackFisiAp2",
  },
] as const;

/** KMK LF10–12 Bezeichnungen je Fachrichtung (2019) */
const LF10_12_TITLES: Record<TrainingTrack, Record<"LF10" | "LF11" | "LF12", string>> = {
  ae: {
    LF10: "Benutzerschnittstellen gestalten und entwickeln",
    LF11: "Funktionalität in Anwendungen realisieren",
    LF12: "Kundenspezifische Anwendungsentwicklung",
  },
  fisi: {
    LF10: "Serverdienste bereitstellen und Administration automatisieren",
    LF11: "Betrieb und Sicherheit vernetzter Systeme",
    LF12: "Kundenspezifische Systemintegration",
  },
};

export function isTrainingTrack(v: unknown): v is TrainingTrack {
  return v === "ae" || v === "fisi";
}

export function isBundeslandId(v: unknown): v is BundeslandId {
  return BUNDESLAND_OPTIONS.some((o) => o.id === v);
}

export function getBundeslandLabel(id: BundeslandId): string {
  return BUNDESLAND_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

export function getTrackDisplayLabel(track: TrainingTrack): string {
  return track === "ae" ? "Anwendungsentwicklung" : "Systemintegration";
}

/** AP2-Spezial-Lernfelder mit berufsspezifischem KMK-Titel */
export function getTrackLfTitle(lf: LearningField, track: TrainingTrack): string | null {
  if (lf === "LF10" || lf === "LF11" || lf === "LF12") {
    return LF10_12_TITLES[track][lf];
  }
  return null;
}

export const ONBOARDING_STEP_ORDER = [
  "welcome",
  "track",
  "region",
  "avatar",
  "codename",
  "scan",
  "hub",
] as const;

export type OnboardingPhase = (typeof ONBOARDING_STEP_ORDER)[number];
