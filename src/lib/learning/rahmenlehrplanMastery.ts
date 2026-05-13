import type { LearningField } from "../../data/nexusRegistry";

export type RahmenlehrplanMastery = {
  lf: LearningField;
  title: string;
  masteryCheck: string;
};

/**
 * Rahmenlehrplan Mapping
 * Quelle aktuell projektintern konsolidiert
 * Wenn ein offizielles PDF vorliegt kann diese Tabelle 1:1 daraus gefüllt werden
 */
export const RAHMENLEHRPLAN_MASTERY: Record<LearningField, RahmenlehrplanMastery> = {
  LF1: { lf: "LF1", title: "Wirtschaft und Recht", masteryCheck: "kaufmännische Grundrechnungen sicher anwenden" },
  LF2: { lf: "LF2", title: "IT Grundlagen", masteryCheck: "Hardware Software Grundlagen korrekt erklären" },
  LF3: { lf: "LF3", title: "Netzwerkbasis", masteryCheck: "Subnetz und Protokollgrundlagen fehlerfrei lösen" },
  LF4: { lf: "LF4", title: "Netzhardware", masteryCheck: "Infrastrukturkomponenten sicher zuordnen" },
  LF5: { lf: "LF5", title: "Datenbanken", masteryCheck: "SQL Filter Join Abfragen korrekt formulieren" },
  LF6: { lf: "LF6", title: "Skripting", masteryCheck: "Kontrollstrukturen sicher in Code einsetzen" },
  LF7: { lf: "LF7", title: "Objektorientierung", masteryCheck: "Klassen Methoden und Typen sauber modellieren" },
  LF8: { lf: "LF8", title: "Datenmodell", masteryCheck: "Normalformen und Schlüsselkonzepte sicher anwenden" },
  LF9: { lf: "LF9", title: "Dienste und Protokolle", masteryCheck: "Netzdienste und Ports korrekt differenzieren" },
  LF10: { lf: "LF10", title: "Projektmanagement und agile Steuerung", masteryCheck: "Netzplan Scrum Rollen und Sprint Backlog sicher anwenden" },
  LF11: { lf: "LF11", title: "Informationssicherheit", masteryCheck: "CIA Backup MFA und Risikoanalyse beherrschen" },
  LF12: { lf: "LF12", title: "Agile Projektarbeit", masteryCheck: "Scrum Rollen Events und DoD sicher anwenden" },
};

