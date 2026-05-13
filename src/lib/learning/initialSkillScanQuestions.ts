import type { LearningField } from "../../data/nexusRegistry";

export type InitialSkillScanOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type InitialSkillScanBlock = {
  lf: LearningField;
  question: string;
  options: readonly InitialSkillScanOption[];
};

/** Genau zwölf Kurzfragen — eine pro LF1 bis LF12 (ohne Satzzeichen am Ende) */
export const INITIAL_SKILL_SCAN_QUESTIONS = [
  {
    lf: "LF1",
    question: "Was gehört typischerweise in eine Vorkalkulation",
    options: [
      { id: "a", text: "Material, Lohn und Gemeinkosten je Stück", isCorrect: true },
      { id: "b", text: "Nur die Marketing-Story", isCorrect: false },
      { id: "c", text: "Ausschließlich Steuersätze", isCorrect: false },
      { id: "d", text: "Nur die Server-IP", isCorrect: false },
    ],
  },
  {
    lf: "LF2",
    question: "Welche Rolle hat ein typischer Thin Client",
    options: [
      { id: "a", text: "Zeigt Oberfläche, Rechenleistung liegt zentral", isCorrect: true },
      { id: "b", text: "Ersetzt komplett jedes Backup", isCorrect: false },
      { id: "c", text: "Ist immer identisch mit einem Router", isCorrect: false },
      { id: "d", text: "Speichert nur Druckertreiber dauerhaft", isCorrect: false },
    ],
  },
  {
    lf: "LF3",
    question: "Was beschreibt eine Subnetzmaske am treffendsten",
    options: [
      { id: "a", text: "Welcher Teil der IP Netz- und welcher Teil Host-Adresse ist", isCorrect: true },
      { id: "b", text: "Die physische Kabellänge", isCorrect: false },
      { id: "c", text: "Die Uhrzeit des DHCP-Leases", isCorrect: false },
      { id: "d", text: "Den freien Speicher auf der SSD", isCorrect: false },
    ],
  },
  {
    lf: "LF4",
    question: "Warum werden Treiber nach einer Hardwareänderung oft neu installiert",
    options: [
      { id: "a", text: "Damit das Betriebssystem die Komponente korrekt ansteuert", isCorrect: true },
      { id: "b", text: "Damit der Bildschirm automatisch größer wird", isCorrect: false },
      { id: "c", text: "Weil sonst jede E-Mail verschlüsselt wird", isCorrect: false },
      { id: "d", text: "Weil Netzwerke sonst keine Ports mehr haben", isCorrect: false },
    ],
  },
  {
    lf: "LF5",
    question: "Was ist eine relationale Tabelle in einem Satz",
    options: [
      { id: "a", text: "Zeilen und Spalten mit eindeutig adressierbaren Datensätzen", isCorrect: true },
      { id: "b", text: "Ein frei gezeichneter Mindmap-Kreis", isCorrect: false },
      { id: "c", text: "Ein reines Video-Keyframe", isCorrect: false },
      { id: "d", text: "Ein DNS-Cache ohne Schema", isCorrect: false },
    ],
  },
  {
    lf: "LF6",
    question: "Wofür eignet sich eine Schleife in einem Skript am ehesten",
    options: [
      { id: "a", text: "Wiederholte Schritte mit klarer Abbruchbedingung", isCorrect: true },
      { id: "b", text: "Einmaliges Löschen des Routers", isCorrect: false },
      { id: "c", text: "Manuelles Formatieren ohne Logik", isCorrect: false },
      { id: "d", text: "Nur für 3D-Texturen", isCorrect: false },
    ],
  },
  {
    lf: "LF7",
    question: "Was drückt Vererbung in der OOP typischerweise aus",
    options: [
      { id: "a", text: "Eine Kindklasse übernimmt und erweitert Verhalten der Basisklasse", isCorrect: true },
      { id: "b", text: "Jede Methode ist immer privat", isCorrect: false },
      { id: "c", text: "Objekte existieren ohne Klassen", isCorrect: false },
      { id: "d", text: "Interfaces ersetzen jede Datenbank", isCorrect: false },
    ],
  },
  {
    lf: "LF8",
    question: "Warum normalisiert man Datenmodelle häufig",
    options: [
      { id: "a", text: "Redundanz reduzieren und Anomalien vermeiden", isCorrect: true },
      { id: "b", text: "Damit Bilder schneller rendern", isCorrect: false },
      { id: "c", text: "Damit HTTP automatisch verschlüsselt", isCorrect: false },
      { id: "d", text: "Damit jede Spalte nur Emojis enthalten darf", isCorrect: false },
    ],
  },
  {
    lf: "LF9",
    question: "Was signalisiert HTTP 404 in der Regel",
    options: [
      { id: "a", text: "Die angefragte Ressource wurde auf dem Server nicht gefunden", isCorrect: true },
      { id: "b", text: "Erfolgreiche Authentifizierung", isCorrect: false },
      { id: "c", text: "Dauerhafte Umleitung ohne Ziel", isCorrect: false },
      { id: "d", text: "Server ist absichtlich ohne Ports", isCorrect: false },
    ],
  },
  {
    lf: "LF10",
    question: "Was gehört typischerweise in das Sprint Backlog im Scrum",
    options: [
      { id: "a", text: "Ausgewählte Product-Backlog-Items plus Plan des Teams für den Sprint", isCorrect: true },
      { id: "b", text: "Die komplette Marketing-Website ohne Priorisierung", isCorrect: false },
      { id: "c", text: "Nur die Liste aller Bugs aus dem letzten Jahr", isCorrect: false },
      { id: "d", text: "Ausschließlich Architekturdiagramme ohne Backlog-Bezug", isCorrect: false },
    ],
  },
  {
    lf: "LF11",
    question: "Was beschreibt Vertraulichkeit in der IT-Sicherheit kurz",
    options: [
      { id: "a", text: "Nur Berechtigte dürfen Daten einsehen", isCorrect: true },
      { id: "b", text: "Jeder Ping muss öffentlich sein", isCorrect: false },
      { id: "c", text: "Backups sind verboten", isCorrect: false },
      { id: "d", text: "Passwörter dürfen nur ein Zeichen haben", isCorrect: false },
    ],
  },
  {
    lf: "LF12",
    question: "Was ist ein Sprint im Scrum-Alltag",
    options: [
      { id: "a", text: "Zeitbox mit festem Zielbündel und Review am Ende", isCorrect: true },
      { id: "b", text: "Ein dauerhaftes freies Brainstorming ohne Ende", isCorrect: false },
      { id: "c", text: "Ein Ersatz für Versionskontrolle", isCorrect: false },
      { id: "d", text: "Ein reines Marketing-Wort ohne Ablauf", isCorrect: false },
    ],
  },
] as const satisfies readonly InitialSkillScanBlock[];
