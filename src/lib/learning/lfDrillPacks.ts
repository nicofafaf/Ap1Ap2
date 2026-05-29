import type { LearningField } from "../../data/nexusRegistry";
import type { LearningExercise } from "./learningExerciseTypes";

/** Zusätzliche IHK-nahe Übungen je LF — ergänzt expandedCurriculum + Codex-Referenz */
const LF1: LearningExercise[] = [
  {
    id: "wirt-gmbh-haftung",
    title: "GmbH — Haftung",
    problem: "Ein Geschäftsführer einer GmbH verursacht im Auftrag einen Schaden. Wer haftet typischerweise nach außen?",
    solutionCode: "Die GmbH als juristische Person; Gesellschafter nur mit ihrer Einlage",
    lang: "markdown",
    mcQuestion: "Typische Haftung der GmbH-Gesellschafter?",
    mcOptions: [
      { id: "a", text: "Beschränkt auf die Einlage — nicht mit Privatvermögen für GmbH-Schulden", isCorrect: true },
      { id: "b", text: "Unbeschränkt persönlich wie bei einer OHG", isCorrect: false, whyWrongHint: "Das ist OHG/KG-Komplementär, nicht GmbH-Gesellschafter" },
      { id: "c", text: "Gar nicht — nur der Geschäftsführer privat", isCorrect: false, whyWrongHint: "Die GmbH haftet als Rechtsträger; GF nur bei Pflichtverletzung" },
      { id: "d", text: "Nur der Staat", isCorrect: false, whyWrongHint: "Staatliche Haftung ist hier nicht das Thema" },
    ],
  },
  {
    id: "wirt-betriebspruefung",
    title: "Betriebsprüfung — Aufbewahrung",
    problem: "Welche Unterlagen müssen Unternehmen für die Betriebsprüfung typischerweise aufbewahren?",
    solutionCode: "Handels- und steuerrechtlich relevante Belege, Bücher, Aufzeichnungen (Fristen je nach Art)",
    lang: "markdown",
    mcQuestion: "Kern der Aufbewahrungspflicht?",
    mcOptions: [
      { id: "a", text: "Belege und Bücher für steuerliche Nachprüfbarkeit", isCorrect: true },
      { id: "b", text: "Nur mündliche Absprachen", isCorrect: false, whyWrongHint: "Schriftliche Belege sind zentral" },
      { id: "c", text: "Nur Social-Media-Posts", isCorrect: false, whyWrongHint: "Kein Ersatz für Buchführungsunterlagen" },
      { id: "d", text: "Nur Verträge ohne Rechnungen", isCorrect: false, whyWrongHint: "Rechnungen und Buchungen gehören dazu" },
    ],
  },
  {
    id: "wirt-ust",
    title: "Umsatzsteuer — B2B",
    problem: "Ein IT-Dienstleister stellt eine Rechnung an eine deutsche GmbH (B2B, Inland). Welche USt-Angabe ist typisch?",
    solutionCode: "19 % USt ausweisen (Regelsteuersatz) oder korrekte Befreiung mit Hinweis",
    lang: "markdown",
    mcQuestion: "Regelsteuersatz Deutschland (Prüfungsstand)?",
    mcOptions: [
      { id: "a", text: "19 % (Regelsteuersatz)", isCorrect: true },
      { id: "b", text: "7 % auf alle IT-Dienstleistungen", isCorrect: false, whyWrongHint: "7 % ist ermäßigt für bestimmte Waren/Leistungen, nicht pauschal IT" },
      { id: "c", text: "0 % ohne Begründung", isCorrect: false, whyWrongHint: "0 % braucht Rechtsgrundlage (Export, Befreiung)" },
      { id: "d", text: "50 % pauschal", isCorrect: false, whyWrongHint: "Kein üblicher Steuersatz" },
    ],
  },
];

const LF4: LearningExercise[] = [
  {
    id: "netz-subnet-hosts",
    title: "Subnetz — nutzbare Hosts",
    problem: "/26-Netz: Wie viele nutzbare IPv4-Hostadressen (klassische Prüfungsannahme mit Netz+Broadcast)?",
    solutionCode: "62 Hosts (/26 = 64 Adressen − Netz − Broadcast)",
    lang: "markdown",
    mcQuestion: "Nutzbare Hosts bei /26?",
    mcOptions: [
      { id: "a", text: "62", isCorrect: true },
      { id: "b", text: "64", isCorrect: false, whyWrongHint: "64 ist die Gesamtadressen — 2 reserviert" },
      { id: "c", text: "256", isCorrect: false, whyWrongHint: "Das wäre /24" },
      { id: "d", text: "30", isCorrect: false, whyWrongHint: "Das wäre eher /27" },
    ],
  },
  {
    id: "netz-vlan",
    title: "VLAN — Zweck",
    problem: "Warum segmentiert man ein LAN mit VLANs?",
    solutionCode: "Logische Trennung von Broadcast-Domänen, Sicherheit und Struktur",
    lang: "markdown",
    mcQuestion: "Hauptnutzen von VLANs?",
    mcOptions: [
      { id: "a", text: "Broadcast-Domänen trennen ohne physisches Neukabeln", isCorrect: true },
      { id: "b", text: "CPU-Takt erhöhen", isCorrect: false, whyWrongHint: "VLAN betrifft Layer-2-Logik, nicht CPU-Takt" },
      { id: "c", text: "Festplatten verschlüsseln", isCorrect: false, whyWrongHint: "Das ist Storage/BitLocker-Thema" },
      { id: "d", text: "SQL-Joins beschleunigen", isCorrect: false, whyWrongHint: "Datenbank ≠ Switching" },
    ],
  },
  {
    id: "netz-dns",
    title: "DNS — Auflösung",
    problem: "Ein Nutzer tippt https://lernapp.example — welcher Dienst löst den Namen zuerst auf?",
    solutionCode: "DNS (ggf. Cache) liefert IP zur Namensauflösung",
    lang: "markdown",
    mcQuestion: "Namensauflösung im LAN/Internet?",
    mcOptions: [
      { id: "a", text: "DNS", isCorrect: true },
      { id: "b", text: "DHCP vergibt den Hostnamen global", isCorrect: false, whyWrongHint: "DHCP verteilt IP-Konfiguration, löst keine FQDNs" },
      { id: "c", text: "ARP übersetzt DNS-Namen", isCorrect: false, whyWrongHint: "ARP mappt IP→MAC, nicht Name→IP" },
      { id: "d", text: "SMTP", isCorrect: false, whyWrongHint: "SMTP ist E-Mail-Transport" },
    ],
  },
];

const LF6: LearningExercise[] = [
  {
    id: "js-array-map",
    title: "Array.map",
    problem: "const prices = [10, 20]; const gross = prices.map(p => p * 1.19); — Was enthält gross?",
    solutionCode: "[11.9, 23.8]",
    lang: "javascript",
    mcQuestion: "Was macht map hier?",
    mcOptions: [
      { id: "a", text: "Neues Array mit transformierten Werten", isCorrect: true },
      { id: "b", text: "Nur die erste Position ändern", isCorrect: false, whyWrongHint: "map wendet die Funktion auf jedes Element an" },
      { id: "c", text: "Das Array sortieren", isCorrect: false, whyWrongHint: "sort() wäre separate Methode" },
      { id: "d", text: "Einen einzelnen Summenwert", isCorrect: false, whyWrongHint: "reduce() summiert, map mappt" },
    ],
  },
  {
    id: "js-strict-equal",
    title: "=== vs ==",
    problem: "Warum bevorzugt man oft === in JavaScript?",
    solutionCode: "=== vergleicht ohne Typumwandlung",
    lang: "javascript",
    mcQuestion: "Unterschied === und ==?",
    mcOptions: [
      { id: "a", text: "=== ohne implizite Typumwandlung", isCorrect: true },
      { id: "b", text: "=== wandelt Strings immer in Zahlen", isCorrect: false, whyWrongHint: "Das ist eher == Verhalten" },
      { id: "c", text: "== ist strikter", isCorrect: false, whyWrongHint: "== ist lockerer wegen Coercion" },
      { id: "d", text: "Kein Unterschied", isCorrect: false, whyWrongHint: "0 == '0' ist true, 0 === '0' ist false" },
    ],
  },
  {
    id: "js-function-arrow",
    title: "Arrow Function",
    problem: "const add = (a, b) => a + b; — Was ist add?",
    solutionCode: "Eine Funktion, die die Summe zurückgibt",
    lang: "javascript",
    mcQuestion: "Was beschreibt diese Schreibweise?",
    mcOptions: [
      { id: "a", text: "Kurzsyntax für eine Funktion mit implizitem return", isCorrect: true },
      { id: "b", text: "Eine Schleife", isCorrect: false, whyWrongHint: "Kein for/while — Funktionsausdruck" },
      { id: "c", text: "Ein SQL-Join", isCorrect: false, whyWrongHint: "Kein SQL" },
      { id: "d", text: "Ein VLAN-Tag", isCorrect: false, whyWrongHint: "Netzwerk-Thema" },
    ],
  },
  {
    id: "js-json-parse",
    title: "JSON.parse",
    problem: "API liefert String '{\"ok\":true}'. Wie wird ein Objekt daraus?",
    solutionCode: "JSON.parse(text)",
    lang: "javascript",
    mcQuestion: "String → JavaScript-Objekt?",
    mcOptions: [
      { id: "a", text: "JSON.parse", isCorrect: true },
      { id: "b", text: "JSON.stringify", isCorrect: false, whyWrongHint: "stringify macht Objekt → String" },
      { id: "c", text: "console.log allein", isCorrect: false, whyWrongHint: "log gibt aus, parst nicht" },
      { id: "d", text: "SELECT * FROM json", isCorrect: false, whyWrongHint: "SQL-Syntax in JS ungültig" },
    ],
  },
  {
    id: "js-dom-query",
    title: "DOM — querySelector",
    problem: "Dokument soll Button mit id save finden — welche Methode?",
    solutionCode: "document.querySelector('#save')",
    lang: "javascript",
    mcQuestion: "Element per CSS-Selektor?",
    mcOptions: [
      { id: "a", text: "document.querySelector('#save')", isCorrect: true },
      { id: "b", text: "document.join('#save')", isCorrect: false, whyWrongHint: "join existiert nicht am document" },
      { id: "c", text: "ping save", isCorrect: false, whyWrongHint: "ping ist Netzwerk" },
      { id: "d", text: "chmod 755 save", isCorrect: false, whyWrongHint: "Shell-Befehl" },
    ],
  },
];

const LF7: LearningExercise[] = [
  {
    id: "cs-try-catch",
    title: "try/catch",
    problem: "Warum try/catch um Datei-IO?",
    solutionCode: "Laufzeitfehler abfangen statt Programmabbruch",
    lang: "csharp",
    mcQuestion: "Zweck von try/catch?",
    mcOptions: [
      { id: "a", text: "Ausnahmen behandeln und kontrolliert reagieren", isCorrect: true },
      { id: "b", text: "Code automatisch schneller machen", isCorrect: false, whyWrongHint: "Performance ist nicht der Hauptzweck" },
      { id: "c", text: "SQL-Tabellen anlegen", isCorrect: false, whyWrongHint: "DDL ist SQL" },
      { id: "d", text: "MAC-Adressen filtern", isCorrect: false, whyWrongHint: "Netzwerk" },
    ],
  },
  {
    id: "cs-interface",
    title: "interface",
    problem: "interface IRepo { void Save(); } — Wozu dient das?",
    solutionCode: "Vertrag für Implementierungen — lose Kopplung, testbar",
    lang: "csharp",
    mcQuestion: "Nutzen eines Interface?",
    mcOptions: [
      { id: "a", text: "Implementierungen austauschbar machen (Vertrag)", isCorrect: true },
      { id: "b", text: "CPU-Register setzen", isCorrect: false, whyWrongHint: "Kein Hardware-Interface" },
      { id: "c", text: "VLAN definieren", isCorrect: false, whyWrongHint: "Netzwerk" },
      { id: "d", text: "Nur Kommentare ohne Wirkung", isCorrect: false, whyWrongHint: "Interfaces werden vom Compiler erzwungen" },
    ],
  },
  {
    id: "cs-linq-where",
    title: "LINQ Where",
    problem: "users.Where(u => u.Active). — Was passiert?",
    solutionCode: "Gefilterte Sequenz nur aktiver User",
    lang: "csharp",
    mcQuestion: "LINQ Where?",
    mcOptions: [
      { id: "a", text: "Filtert Elemente nach Bedingung", isCorrect: true },
      { id: "b", text: "Sortiert alphabetisch", isCorrect: false, whyWrongHint: "OrderBy sortiert" },
      { id: "c", text: "Verbindet zwei Tabellen", isCorrect: false, whyWrongHint: "Join/Join in LINQ anders" },
      { id: "d", text: "Löscht die Datenbank", isCorrect: false, whyWrongHint: "Where ist nicht destruktiv" },
    ],
  },
];

const LF9: LearningExercise[] = [
  {
    id: "svc-http-get",
    title: "HTTP GET",
    problem: "Browser lädt eine HTML-Seite. Welche Methode ist typisch?",
    solutionCode: "GET",
    lang: "markdown",
    mcQuestion: "Standard für Ressourcenabruf?",
    mcOptions: [
      { id: "a", text: "GET", isCorrect: true },
      { id: "b", text: "DELETE", isCorrect: false, whyWrongHint: "DELETE entfernt Ressourcen" },
      { id: "c", text: "TRACE für HTML", isCorrect: false, whyWrongHint: "TRACE ist Diagnose, nicht Seitenabruf" },
      { id: "d", text: "SMTP", isCorrect: false, whyWrongHint: "E-Mail-Protokoll" },
    ],
  },
  {
    id: "svc-https",
    title: "HTTPS",
    problem: "Was bringt HTTPS gegenüber HTTP?",
    solutionCode: "Verschlüsselung + Integrität (TLS) für Transport",
    lang: "markdown",
    mcQuestion: "Kernvorteil HTTPS?",
    mcOptions: [
      { id: "a", text: "Verschlüsselter und integritätsgeschützter Transport", isCorrect: true },
      { id: "b", text: "Schnellere CPU", isCorrect: false, whyWrongHint: "TLS hat Overhead — Sicherheit ist der Punkt" },
      { id: "c", text: "Keine Zertifikate nötig", isCorrect: false, whyWrongHint: "Zertifikate sind üblich" },
      { id: "d", text: "Ersetzt DNS", isCorrect: false, whyWrongHint: "DNS bleibt separat" },
    ],
  },
  {
    id: "svc-smtp-port",
    title: "SMTP",
    problem: "Welcher Dienst versendet E-Mails zwischen Mailservern (Klassiker)?",
    solutionCode: "SMTP",
    lang: "markdown",
    mcQuestion: "Mail-Transport?",
    mcOptions: [
      { id: "a", text: "SMTP", isCorrect: true },
      { id: "b", text: "FTP", isCorrect: false, whyWrongHint: "FTP ist Dateitransfer" },
      { id: "c", text: "SNMP", isCorrect: false, whyWrongHint: "SNMP ist Management" },
      { id: "d", text: "ARP", isCorrect: false, whyWrongHint: "ARP ist Layer-2" },
    ],
  },
  {
    id: "svc-dhcp",
    title: "DHCP",
    problem: "Neuer Laptop im WLAN — IP kommt automatisch. Welcher Dienst?",
    solutionCode: "DHCP",
    lang: "markdown",
    mcQuestion: "Automatische IPv4-Konfiguration?",
    mcOptions: [
      { id: "a", text: "DHCP", isCorrect: true },
      { id: "b", text: "Telnet", isCorrect: false, whyWrongHint: "Telnet ist Remote-Shell, vergibt keine IPs" },
      { id: "c", text: "IMAP", isCorrect: false, whyWrongHint: "IMAP liest Mailboxen" },
      { id: "d", text: "NTP für IP", isCorrect: false, whyWrongHint: "NTP synchronisiert Zeit" },
    ],
  },
  {
    id: "svc-dns-records",
    title: "DNS A-Record",
    problem: "Welcher Record mappt einen Hostnamen auf eine IPv4-Adresse?",
    solutionCode: "A-Record",
    lang: "markdown",
    mcQuestion: "Name → IPv4?",
    mcOptions: [
      { id: "a", text: "A-Record", isCorrect: true },
      { id: "b", text: "MX für Webseiten-HTML", isCorrect: false, whyWrongHint: "MX ist Mail-Exchange" },
      { id: "c", text: "CNAME ersetzt immer A", isCorrect: false, whyWrongHint: "CNAME ist Alias auf einen Namen" },
      { id: "d", text: "TXT nur für IP", isCorrect: false, whyWrongHint: "TXT ist Textdaten (SPF etc.)" },
    ],
  },
];

const LF12: LearningExercise[] = [
  {
    id: "pm-dod",
    title: "Definition of Done",
    problem: "Was ist die Definition of Done (DoD)?",
    solutionCode: "Gemeinsame Qualitätskriterien, wann ein Inkrement fertig ist",
    lang: "markdown",
    mcQuestion: "DoD beschreibt …",
    mcOptions: [
      { id: "a", text: "Wann ein Inkrement als fertig gilt (Qualitätsstandard)", isCorrect: true },
      { id: "b", text: "Den Stundenlohn", isCorrect: false, whyWrongHint: "HR/Vertrag, nicht Scrum-Artefakt" },
      { id: "c", text: "Den Netzplan", isCorrect: false, whyWrongHint: "Netzplan ist PM-Klassiker, nicht DoD" },
      { id: "d", text: "Ein RAID-Level", isCorrect: false, whyWrongHint: "Storage" },
    ],
  },
  {
    id: "pm-kanban-wip",
    title: "Kanban — WIP-Limit",
    problem: "Warum WIP-Limits auf einer Kanban-Wand?",
    solutionCode: "Fluss stabilisieren, Multitasking reduzieren",
    lang: "markdown",
    mcQuestion: "Zweck WIP-Limit?",
    mcOptions: [
      { id: "a", text: "Engpass sichtbar machen und Durchsatz verbessern", isCorrect: true },
      { id: "b", text: "Mehr parallele Tasks erzwingen", isCorrect: false, whyWrongHint: "WIP begrenzt Parallelität bewusst" },
      { id: "c", text: "SQL-Joins begrenzen", isCorrect: false, whyWrongHint: "Kein SQL-Thema" },
      { id: "d", text: "VLANs taggen", isCorrect: false, whyWrongHint: "Netzwerk" },
    ],
  },
  {
    id: "pm-risk",
    title: "Risikomanagement",
    problem: "Ein Release droht zu kippen wegen unklarer Schnittstelle. Erste PM-Maßnahme?",
    solutionCode: "Risiko identifizieren, bewerten, Maßnahme (Mitigation) planen",
    lang: "markdown",
    mcQuestion: "Sinnvoller erster Schritt?",
    mcOptions: [
      { id: "a", text: "Risiko dokumentieren und Gegenmaßnahme mit Verantwortlichem planen", isCorrect: true },
      { id: "b", text: "Ignorieren bis Go-Live", isCorrect: false, whyWrongHint: "Unklare Schnittstellen sind klassische Projektrisiken" },
      { id: "c", text: "Alle Tests abschalten", isCorrect: false, whyWrongHint: "Verschärft das Risiko" },
      { id: "d", text: "Subnetz verkleinern", isCorrect: false, whyWrongHint: "Technik-Lösung ohne PM-Klärung" },
    ],
  },
  {
    id: "pm-stakeholder",
    title: "Stakeholder",
    problem: "Wer sind Stakeholder in einem IT-Projekt?",
    solutionCode: "Alle mit Interesse/Einfluss am Projektergebnis",
    lang: "markdown",
    mcQuestion: "Stakeholder sind …",
    mcOptions: [
      { id: "a", text: "Personen/Gruppen mit Interesse oder Einfluss auf das Projekt", isCorrect: true },
      { id: "b", text: "Nur Entwickler ohne Kunden", isCorrect: false, whyWrongHint: "Kunden, Management, Betrieb zählen mit" },
      { id: "c", text: "Nur Switches im Rack", isCorrect: false, whyWrongHint: "Hardware ist kein Stakeholder" },
      { id: "d", text: "Nur externe Hacker", isCorrect: false, whyWrongHint: "Security-Rolle kann Stakeholder sein, nicht „nur Hacker“" },
    ],
  },
];

const LF3: LearningExercise[] = [
  {
    id: "netz-osi-l3",
    title: "OSI — Layer 3",
    problem: "Routing zwischen Subnetzen — welcher OSI-Layer?",
    solutionCode: "Layer 3 (Netzwerk)",
    lang: "markdown",
    mcQuestion: "Routing gehört zu …",
    mcOptions: [
      { id: "a", text: "Schicht 3 — Netzwerk", isCorrect: true },
      { id: "b", text: "Schicht 2 — Sicherung", isCorrect: false, whyWrongHint: "L2 ist Switching/MAC" },
      { id: "c", text: "Schicht 7 — nur HTTP", isCorrect: false, whyWrongHint: "L7 ist Anwendung, Routing ist darunter" },
      { id: "d", text: "Schicht 1 — Routing", isCorrect: false, whyWrongHint: "L1 ist Bitübertragung" },
    ],
  },
];

const LF8: LearningExercise[] = [
  {
    id: "dm-1nf",
    title: "1NF",
    problem: "Tabelle mit mehreren Telefonnummern in einer Zelle (kommasepariert). Welche Normalform verletzt?",
    solutionCode: "1NF — atomare Werte",
    lang: "markdown",
    mcQuestion: "Verletzte Normalform?",
    mcOptions: [
      { id: "a", text: "1NF — Werte nicht atomar", isCorrect: true },
      { id: "b", text: "3NF nur wegen Farbe", isCorrect: false, whyWrongHint: "Mehrfachwerte in einer Zelle ist 1NF" },
      { id: "c", text: "Keine — erlaubt in SQL", isCorrect: false, whyWrongHint: "Modellierung ≠ SQL-Syntax" },
      { id: "d", text: "BCNF immer zuerst", isCorrect: false, whyWrongHint: "Erst 1NF klären" },
    ],
  },
];

const LF10: LearningExercise[] = [
  {
    id: "pm-netz-faz",
    title: "Netzplan — FAZ",
    problem: "Vorgang ohne Vorgänger startet zum Projektbeginn. Welcher Termin ist das?",
    solutionCode: "FAZ — frühester Anfangszeitpunkt",
    lang: "markdown",
    mcQuestion: "Frühester Start ohne Vorgänger?",
    mcOptions: [
      { id: "a", text: "FAZ", isCorrect: true },
      { id: "b", text: "SEZ", isCorrect: false, whyWrongHint: "SEZ ist spätestes Ende" },
      { id: "c", text: "Puffer gesamt", isCorrect: false, whyWrongHint: "Puffer ist Differenz, kein Starttermin" },
      { id: "d", text: "RAID 5", isCorrect: false, whyWrongHint: "Kein Netzplan-Begriff" },
    ],
  },
];

const LF11: LearningExercise[] = [
  {
    id: "sec-phishing",
    title: "Phishing",
    problem: "Mitarbeiter klickt Link in gefälschter Mail und gibt Zugangsdaten ein. Welche Maßnahme hilft langfristig am meisten?",
    solutionCode: "Awareness + technische Filter + MFA + Meldeprozess",
    lang: "markdown",
    mcQuestion: "Nachhaltige Kombination?",
    mcOptions: [
      { id: "a", text: "Schulung, Phishing-Filter, MFA und klare Meldestelle", isCorrect: true },
      { id: "b", text: "Nur Firewall ohne Schulung", isCorrect: false, whyWrongHint: "Social Engineering umgeht reine Perimeter-Defense" },
      { id: "c", text: "Alle Ports öffnen", isCorrect: false, whyWrongHint: "Erhöht Angriffsfläche" },
      { id: "d", text: "Passwörter per Mail senden", isCorrect: false, whyWrongHint: "Verschärft das Problem" },
    ],
  },
];

export const LF_DRILL_PACKS: Record<LearningField, LearningExercise[]> = {
  LF1,
  LF2: [],
  LF3,
  LF4,
  LF5: [],
  LF6,
  LF7,
  LF8,
  LF9,
  LF10,
  LF11,
  LF12,
};
