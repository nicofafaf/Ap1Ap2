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
  hint?: string;
};

/** Zwölf Kurzfragen — eine pro LF, korrekte Antwort bewusst auf verschiedene IDs verteilt */
export const INITIAL_SKILL_SCAN_QUESTIONS = [
  {
    lf: "LF1",
    question: "Welche Kosten gehören in eine Vorkalkulation typischerweise dazu",
    hint: "Material, Lohn und Gemeinkosten bilden die Stückkostenbasis",
    options: [
      { id: "a", text: "Nur Marketing-Budget und Social-Media-Reichweite", isCorrect: false },
      { id: "b", text: "Material, Lohn und Gemeinkosten je Stück oder Auftrag", isCorrect: true },
      { id: "c", text: "Ausschließlich die Umsatzsteuer ohne Bezug zum Produkt", isCorrect: false },
      { id: "d", text: "Nur die IP-Adresse des Firmenrouters", isCorrect: false },
    ],
  },
  {
    lf: "LF2",
    question: "Was beschreibt einen Thin Client am treffendsten",
    hint: "Rechenleistung liegt meist zentral, der Client zeigt nur die Oberfläche",
    options: [
      { id: "a", text: "Ein Router, der ausschließlich VLANs taggt", isCorrect: false },
      { id: "b", text: "Ein Backup-Tape mit RAID-Controller", isCorrect: false },
      { id: "c", text: "Ein schlankes Endgerät mit Anzeige, Verarbeitung oft auf dem Server", isCorrect: true },
      { id: "d", text: "Ein Drucker mit fest eingebautem DHCP-Server", isCorrect: false },
    ],
  },
  {
    lf: "LF3",
    question: "Wozu dient eine Subnetzmaske in IPv4",
    hint: "Sie trennt Netzwerk- und Hostanteil einer Adresse",
    options: [
      { id: "a", text: "Sie legt die Kabellänge im Patchfeld fest", isCorrect: false },
      { id: "b", text: "Sie ersetzt DNS vollständig im LAN", isCorrect: false },
      { id: "c", text: "Sie definiert, welcher Teil der IP Netz und welcher Host ist", isCorrect: true },
      { id: "d", text: "Sie misst die CPU-Temperatur des Switches", isCorrect: false },
    ],
  },
  {
    lf: "LF4",
    question: "Warum installiert man nach einem Hardwaretausch oft neue Treiber",
    hint: "Das OS muss die neue Komponente korrekt ansprechen können",
    options: [
      { id: "a", text: "Damit das Betriebssystem die Hardware zuverlässig ansteuert", isCorrect: true },
      { id: "b", text: "Damit E-Mails automatisch verschlüsselt werden", isCorrect: false },
      { id: "c", text: "Weil sonst jedes WLAN dauerhaft deaktiviert ist", isCorrect: false },
      { id: "d", text: "Weil Netzwerkkarten ohne Treiber keine MAC-Adresse haben", isCorrect: false },
    ],
  },
  {
    lf: "LF5",
    question: "Was kennzeichnet eine relationale Tabelle",
    hint: "Zeilen sind Datensätze, Spalten sind Attribute",
    options: [
      { id: "a", text: "Ein Mindmap-Kreis ohne festes Schema", isCorrect: false },
      { id: "b", text: "Ein Video-Stream mit Keyframes", isCorrect: false },
      { id: "c", text: "Zeilen und Spalten mit eindeutig adressierbaren Datensätzen", isCorrect: true },
      { id: "d", text: "Ein DNS-Cache ohne Primärschlüssel", isCorrect: false },
    ],
  },
  {
    lf: "LF6",
    question: "Wann nutzt du in einem Skript eine Schleife",
    hint: "Wiederholung mit klarer Abbruchbedingung",
    options: [
      { id: "a", text: "Wenn du einen Router einmalig formatierst", isCorrect: false },
      { id: "b", text: "Wenn sich Schritte wiederholen und eine Abbruchbedingung existiert", isCorrect: true },
      { id: "c", text: "Wenn du nur Kommentare ohne Logik brauchst", isCorrect: false },
      { id: "d", text: "Wenn du ausschließlich GUI-Farben änderst", isCorrect: false },
    ],
  },
  {
    lf: "LF7",
    question: "Was drückt Vererbung in der OOP aus",
    hint: "Kindklassen erweitern Basisklassen",
    options: [
      { id: "a", text: "Jede Methode ist automatisch privat", isCorrect: false },
      { id: "b", text: "Objekte existieren ohne Klassendefinition", isCorrect: false },
      { id: "c", text: "Eine Kindklasse übernimmt und erweitert Verhalten der Basisklasse", isCorrect: true },
      { id: "d", text: "Interfaces ersetzen jede Datenbank dauerhaft", isCorrect: false },
    ],
  },
  {
    lf: "LF8",
    question: "Warum normalisiert man relationale Datenmodelle",
    hint: "Redundanz und Anomalien sollen sinken",
    options: [
      { id: "a", text: "Damit Bilder in der UI schneller rendern", isCorrect: false },
      { id: "b", text: "Um Redundanz zu reduzieren und Update-Anomalien zu vermeiden", isCorrect: true },
      { id: "c", text: "Damit HTTP automatisch TLS nutzt", isCorrect: false },
      { id: "d", text: "Damit jede Spalte nur Emojis enthalten darf", isCorrect: false },
    ],
  },
  {
    lf: "LF9",
    question: "Was bedeutet der HTTP-Statuscode 404 für eine REST-Anfrage",
    hint: "Die angefragte Ressource wurde nicht gefunden",
    options: [
      { id: "a", text: "Die Ressource wurde auf dem Server nicht gefunden", isCorrect: true },
      { id: "b", text: "Die Anmeldung war erfolgreich", isCorrect: false },
      { id: "c", text: "Der Client muss dauerhaft umleiten", isCorrect: false },
      { id: "d", text: "Der Server hat absichtlich keine Ports", isCorrect: false },
    ],
  },
  {
    lf: "LF10",
    question: "Was gehört typischerweise ins Sprint Backlog in Scrum",
    hint: "Ausgewählte Items plus Team-Plan für den Sprint",
    options: [
      { id: "a", text: "Die komplette Website ohne Priorisierung", isCorrect: false },
      { id: "b", text: "Nur Architekturdiagramme ohne Backlog-Bezug", isCorrect: false },
      { id: "c", text: "Ausgewählte Product-Backlog-Items plus Plan des Teams", isCorrect: true },
      { id: "d", text: "Alle Bugs der letzten fünf Jahre ungefiltert", isCorrect: false },
    ],
  },
  {
    lf: "LF11",
    question: "Was meint Vertraulichkeit im Schutzziel-Modell",
    hint: "Nur Berechtigte sehen die Daten",
    options: [
      { id: "a", text: "Jeder Ping muss öffentlich sichtbar sein", isCorrect: false },
      { id: "b", text: "Backups sind grundsätzlich verboten", isCorrect: false },
      { id: "c", text: "Nur berechtigte Personen dürfen Daten einsehen", isCorrect: true },
      { id: "d", text: "Passwörter dürfen nur ein Zeichen lang sein", isCorrect: false },
    ],
  },
  {
    lf: "LF12",
    question: "Was kennzeichnet einen Sprint in Scrum",
    hint: "Zeitbox mit Ziel und Review",
    options: [
      { id: "a", text: "Ein dauerhaftes Brainstorming ohne Ende", isCorrect: false },
      { id: "b", text: "Eine Zeitbox mit Zielbündel und Review am Ende", isCorrect: true },
      { id: "c", text: "Ein Ersatz für Git und Versionskontrolle", isCorrect: false },
      { id: "d", text: "Ein reines Marketing-Wort ohne Ablauf", isCorrect: false },
    ],
  },
] as const satisfies readonly InitialSkillScanBlock[];
