/** KMK LF2 Feinlernziele (Richt-/Grobziel aus Schulunterlage) — Checkliste für Prüfungsvorbereitung */
export const LF02_KMK_RICHTZIEL =
  "Planung, Installation und Inbetriebnahme von IT-Systemen sicher beherrschen";

export const LF02_KMK_GROBZIEL =
  "Systemanforderungen ermitteln, IT-Systeme installieren, konfigurieren und testen";

export const LF02_FEINLERNZIELE: readonly string[] = [
  "Systemanforderungen ermitteln und spezifizieren",
  "Installation von Hardware und Software durchführen",
  "IT-Systeme konfigurieren und auf Funktionsfähigkeit testen",
  "Sicherheitsvorkehrungen während der Installation beachten",
] as const;

export const LF02_EXAM_TOPIC_GROUPS: readonly { title: string; items: readonly string[] }[] = [
  {
    title: "Anforderungen & Beratung",
    items: [
      "Anforderungsanalyse und Kundenbedarf",
      "Lastenheft (Was) vs. Pflichtenheft (Wie)",
      "Softwareauswahl für kundenspezifische Arbeitsplätze",
    ],
  },
  {
    title: "Installation & Betrieb",
    items: [
      "Schritte bei neuer Arbeitsplatzeinrichtung",
      "Betriebssystem-Image und Clean-Install vs. Upgrade",
      "Systempartitionierung",
      "Tools für Installation und Konfiguration",
      "Fehlerfreien Betrieb prüfen",
    ],
  },
  {
    title: "Sicherheit & Dokumentation",
    items: [
      "Sicherheitsaspekte bei Serverinstallation",
      "Vollständige Systemdokumentation",
    ],
  },
  {
    title: "Netzwerk & Cloud",
    items: [
      "Netzwerkeinstellungen für Firmenanbindung",
      "Vorteile cloudbasierter Arbeitsplatzlösungen",
    ],
  },
  {
    title: "Hardware & Ergonomie",
    items: [
      "Typische Hardwarekomponenten und Funktion",
      "Ergonomische Arbeitsplatzgestaltung",
    ],
  },
] as const;
