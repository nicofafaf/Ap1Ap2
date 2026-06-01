/** EdTech-Anzeige: ruhige Texte ohne Spiel-Jargon für Karte, Kurs-Sheet und Terminal */

import type { LearningField } from "../../data/nexusRegistry";
import { getTrackLfTitle, type TrainingTrack } from "../curriculum/trainingProfile";

export const LF_EDTECH_SUMMARY: Record<number, string> = {
  1: "Unternehmen, Verträge, Recht und einfache BWL — typische AP1-Themen",
  2: "Hardware, Clients, Beschaffung und IT-Grundlagen",
  3: "Netzwerke, Adressen, Protokolle und Dienste",
  4: "Server, Virtualisierung, Storage und Elektrotechnik-Basics",
  5: "Datenbanken, SQL und Daten organisieren",
  6: "Skripte, Automatisierung und erste Programmierung",
  7: "Objektorientierung, C# und IT-Sicherheit",
  8: "Linux, Datenmodelle und Server-Dienste",
  9: "APIs, Schnittstellen und Netzwerk-Dienste",
  10: "Projektmanagement, Netzpläne und agile Methoden",
  11: "Informationssicherheit, Schutzmaßnahmen und Compliance",
  12: "Agiles Arbeiten, Teams und Projektsteuerung",
};

export function getLfEdtechSummary(lf: number, track?: TrainingTrack | null): string {
  if (track && lf >= 10 && lf <= 12) {
    const key = `LF${lf}` as LearningField;
    const trackTitle = getTrackLfTitle(key, track);
    if (trackTitle) return trackTitle;
  }
  return LF_EDTECH_SUMMARY[lf] ?? "";
}

const MISSION_TITLE_OVERRIDES: Record<string, string> = {
  "lf1-mission-kuat": "Rechtsformen: AG, GmbH, KG und OHG",
  "lf1-mission-shinra": "Sozialversicherung und Arbeitgeber-Pflichten",
  "lf1-mission-ironforge": "Rechtsfähigkeit und Haftung",
  "lf1-mission-handel": "Handelsspanne und Bezugspreis rechnen",
};

const EDTECH_TEXT_REPLACEMENTS: ReadonlyArray<[RegExp, string]> = [
  [/kuat\s+triebwerkswerke/gi, "Ein börsennotiertes Unternehmen"],
  [/shinra\s+electric[^,.]*/gi, "Ein Arbeitgeber"],
  [/mission\s+[^·,]+·\s*/gi, ""],
  [/corporate\s+espionage/gi, ""],
  [/geheimdaten[^.]*\.?\s*/gi, ""],
  [/geheimbriefing/gi, "Beispiel"],
  [/wir\s+infiltrieren[^.]*\.\s*/gi, ""],
  [/im\s+reaktor\s+sektor[^.]*\.\s*/gi, ""],
  [/agentenstatus[^.]*\.\s*/gi, ""],
  [/signal\s+aus\s+sektor\s+\d+[^.]*\.\s*/gi, ""],
  [/die\s+zentrale\s+blockiert[^.]*\.\s*/gi, ""],
  [/einsatzlage/gi, "Ausgangslage"],
  [/spurensuche/gi, "Tipp"],
];

/** Spiel- und Fantasy-Bezüge für ruhiges Lernen entfernen oder neutralisieren */
export function sanitizeEdtechLearningText(raw: string): string {
  let t = raw.trim();
  if (!t) return t;
  for (const [pattern, replacement] of EDTECH_TEXT_REPLACEMENTS) {
    t = t.replace(pattern, replacement);
  }
  t = t.replace(/\s+/g, " ").replace(/\s+([,.!?])/g, "$1").trim();
  if (t.length > 0) {
    t = t.charAt(0).toUpperCase() + t.slice(1);
  }
  return t;
}

/** Spiel-/Mission-Präfixe für ruhige Anzeige entfernen */
export function friendlyMissionTitle(missionId: string, rawTitle: string): string {
  const key = missionId.trim().toLowerCase();
  if (MISSION_TITLE_OVERRIDES[key]) return MISSION_TITLE_OVERRIDES[key];

  let t = rawTitle.trim();
  t = t.replace(/^Mission\s+[^·]+·\s*/i, "");
  t = t.replace(/\s+im Schatten[^·]*$/i, "");
  t = t.replace(/\s+·\s*Corporate Espionage.*$/i, "");
  if (t.length > 72) t = `${t.slice(0, 69)}…`;
  return t || rawTitle;
}

export function friendlyTopicLine(raw: string): string {
  const t = raw.trim();
  if (/corporate espionage|multiversum|star wars|anime|gym/i.test(t)) return "";
  return t;
}

/** Drei Karten → eine Kurz-Erklärung für entspanntes Lesen */
export function mergeLessonCardsForEdtech(
  cards: ReadonlyArray<{ title: string; body: string }>
): { title: string; body: string } | null {
  if (!cards.length) return null;
  const parts = cards
    .map((c) => sanitizeEdtechLearningText(c.body.trim()))
    .filter((body) => body.length > 12);
  if (!parts.length) return null;
  const body = parts.join(" ").replace(/\s+/g, " ").trim();
  const clipped = body.length > 420 ? `${body.slice(0, 417)}…` : body;
  return { title: "Kurz erklärt", body: clipped };
}

export function friendlyExampleLabel(raw: string): string {
  const l = raw.trim().toLowerCase();
  if (l.includes("geheim") || l.includes("briefing")) return "Beispiel";
  return raw.trim() || "Beispiel";
}
