import type { LearningExercise } from "./learningExerciseTypes";

/**
 * LF5 SQL-Aufgaben sind in die JSON-Struktur migriert
 * Quelle: src/lernfelder/lf05/content.json
 * Diese Datei enthält nur LF1-4 und LF8-12 Curricula
 */

/** LF1 — Wirtschaft & Recht (IHK-nah), Tabellen in Markdown */
export const LF1_WIRTSCHAFT: LearningExercise[] = [
  {
    id: "wirt-handelsspanne",
    title: "Handelsspanne",
    problem:
      "Listen-EK 400 € · Rabatt 12 % · Bezug 28 € · Verkauf netto 520 €\nBerechne die Handelsspanne in Prozent auf den Verkaufspreis",
    solutionHint:
      "Tipp: 400 − 48 + 28 = 380 € Bezugspreis · 520 − 380 = 140 € Rohertrag · 140 ÷ 520 = 26,9 %",
    solutionCode: "26,9",
    lang: "markdown",
    mcQuestion: "Welche Formel passt zur Handelsspanne auf den Verkaufspreis?",
    mcOptions: [
      {
        id: "a",
        text: "(Verkaufspreis − Bezugspreis) / Verkaufspreis",
        isCorrect: true,
      },
      {
        id: "b",
        text: "(Verkaufspreis − Bezugspreis) / Bezugspreis",
        isCorrect: false,
        whyWrongHint:
          "Das ist die kalkulatorische Marge auf Einkauf (Bezug), nicht die Handelsspanne v.H. Verkauf — Nenner muss der VP sein",
      },
      {
        id: "c",
        text: "Listeneinkaufspreis / Verkaufspreis",
        isCorrect: false,
        whyWrongHint:
          "Ohne Rabatt und Bezugskosten vergleichst du falsche Bezugsbasis — Bezugspreis ist Ausgangspunkt für Rohertrag",
      },
      {
        id: "d",
        text: "Verkaufspreis − Rabatt",
        isCorrect: false,
        whyWrongHint:
          "Das ist keine Spanne, sondern eine Differenz ohne Bezug zum Einkauf — es fehlt der Bezugspreis im Zähler",
      },
    ],
  },
  {
    id: "wirt-kaufvertrag-gefahr",
    title: "Kaufvertrag — Gefahrübergang (B2B-Praxis)",
    problem:
      "Ein Händler bestellt 20 Monitore „Ab Werk“ mit Lieferung durch einen Spediteur. Wann trägt typischerweise der Käufer die Gefahr des zufälligen Untergangs (vereinfachte Prüfungslogik)?",
    solutionCode: `### Kaufvertrag — Lieferung „Ab Werk“ (Incoterms-nah Denken)\n\n1. Gefahr geht mit **Übergabe an ersten Beförderer** über, wenn nichts anderes vereinbart\n2. **Ab Werk** = Leistung am Standort Verkäufer — danach Transportrisiko beim Käufer\n\n| Rolle        | Risiko nach Übergabe an Spedition |\n|--------------|-------------------------------------|\n| Verkäufer    | vor Übergabe                        |\n| Käufer       | ab Übergabe an Frachtführer         |`,
    lang: "markdown",
    mcQuestion: "Bei „Ab Werk“ und Versand durch Spedition des Käufers liegt die Transportgefahr in der Regel …",
    mcOptions: [
      {
        id: "a",
        text: "Beim Käufer, sobald die Ware an den Spediteur übergeben wurde",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Dauerhaft beim Verkäufer bis zur Anlieferung",
        isCorrect: false,
        whyWrongHint:
          "Das wäre eher „frei Haus“ / andere Klausel — „Ab Werk“ verschiebt Risiko früher auf den Käufer",
      },
      {
        id: "c",
        text: "Beim Spediteur für immer",
        isCorrect: false,
        whyWrongHint:
          "Der Frachtführer haftet nach BGB/HGB nur nach besonderen Regeln — die Gefahr des Untergangs trägt grundsätzlich der Käufer nach Übergabe",
      },
      {
        id: "d",
        text: "Erst nach vollständiger Zahlung",
        isCorrect: false,
        whyWrongHint:
          "Gefahrübergang koppelt an Übergabe/Vereinbarung, nicht automatisch an Zahlungseingang",
      },
    ],
  },
  {
    id: "wirt-werk-dienst",
    title: "Werkvertrag vs. Dienstvertrag",
    problem:
      "Ein IT-Unternehmen soll ein messbares Ergebnis liefern: „Migration der Datenbank bis Go-Live mit Abnahmeprotokoll“. Welcher Vertragstyp passt primär?",
    solutionCode: `### Abgrenzung (Prüfungstypisch)\n\n| Merkmal              | Werkvertrag              | Dienstvertrag        |\n|----------------------|--------------------------|----------------------|\n| Erfolg geschuldet?   | ja (Werk)                | oft nur Tätigkeit    |\n| Abnahme              | zentral                  | meist nicht wie Werk |\n| Beispiel             | Programmierung mit Abnahme | Hotline-Stunden    |\n\n**Fall:** definierter Migrations-Erfolg + Abnahme → **Werkvertrag**`,
    lang: "markdown",
    mcQuestion: "Warum liegt hier ein Werkvertrag näher als ein reiner Dienstvertrag?",
    mcOptions: [
      {
        id: "a",
        text: "Es wird ein konkretes, abnahmefähiges Arbeitsergebnis geschuldet",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Weil Stunden abgerechnet werden",
        isCorrect: false,
        whyWrongHint:
          "Abrechnungsmodus allein entscheidet nicht — entscheidend ist die Erfolgspflicht und Abnahmefähigkeit",
      },
      {
        id: "c",
        text: "Weil es um IT geht, gilt immer Dienstvertrag",
        isCorrect: false,
        whyWrongHint:
          "IT kann Werk oder Dienst sein — hier ist das messbare Ergebnis entscheidend",
      },
      {
        id: "d",
        text: "Werkvertrag gibt es nur im Handwerk",
        isCorrect: false,
        whyWrongHint:
          "Werkvertrag ist allgemein BGB — auch Software/Migration kann Werk sein",
      },
    ],
  },
  {
    id: "wirt-skonto",
    title: "Skonto — Zielverkaufspreis",
    problem:
      "Zielverkaufspreis 1.000 € netto, Kunde nutzt 3 % Skonto. Wie hoch ist der tatsächliche Netto-Erlös nach Skonto?",
    solutionCode: `### Skonto vom Zielverkaufspreis\n\n| Größe        | Wert     |\n|--------------|----------|\n| Ziel-VP      | 1.000,00 |\n| − 3 % Skonto | −30,00   |\n| **Erlös**    | **970,00** |\n\nFormel: Erlös = Ziel-VP × (1 − Skonto/100)`,
    lang: "markdown",
    mcQuestion: "Welcher Betrag bleibt nach 3 % Skonto von 1.000 € netto übrig?",
    mcOptions: [
      { id: "a", text: "970 €", isCorrect: true },
      {
        id: "b",
        text: "1.030 €",
        isCorrect: false,
        whyWrongHint:
          "Skonto mindert den Erlös — Addition wäre Preiserhöhung, nicht Nachlass",
      },
      {
        id: "c",
        text: "300 €",
        isCorrect: false,
        whyWrongHint:
          "3 % von 1.000 € sind 30 €, nicht 300 — Kommastelle / Prozentrechnung prüfen",
      },
      {
        id: "d",
        text: "1.000 € — Skonto ist nur Zahlungsziel ohne Betrag",
        isCorrect: false,
        whyWrongHint:
          "Skonto ist ein Preisnachlass bei pünktlicher Zahlung — er wirkt auf den Netto-Erlös",
      },
    ],
  },
  {
    id: "wirt-einkaufspreis",
    title: "Einkauf — Liste, Rabatt, Bezug",
    problem:
      "Listenpreis 800 €, 15 % Lieferantenrabatt, 5 % Treuerabatt auf den bereits reduzierten Betrag, Bezugskosten 40 €. Bezugspreis?",
    solutionCode: `### Staffelrabatte (kaufmännisch)\n\n1. 800 − 15 % = 680,00\n2. 680 − 5 % = **646,00**\n3. + Bezug 40,00 → **686,00 € Bezugspreis**\n\n| Stufe        | Betrag |\n|--------------|-------:|\n| Nach 15 %    | 680,00 |\n| Nach weiter 5 % | 646,00 |\n| + Bezug      | 686,00 |`,
    lang: "markdown",
    mcQuestion: "Wo liegt der häufige Fehler bei mehrfachen Rabatten?",
    mcOptions: [
      {
        id: "a",
        text: "Zweiten Rabatt auf bereits reduzierten Betrag rechnen, nicht auf Listenpreis",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Beide Rabatte immer auf 800 € addieren (15 %+5 %=20 %)",
        isCorrect: false,
        whyWrongHint:
          "20 % von 800 wäre nur korrekt, wenn beide Rabatte auf Listenbasis gewährt werden — hier ist der 5 %-Rabatt staffelnd",
      },
      {
        id: "c",
        text: "Bezugskosten vor Rabatt addieren",
        isCorrect: false,
        whyWrongHint:
          "Bezugskosten werden in der Regel nach Lieferantenpreis (nach Rabatt) angesetzt — Prüfung: Aufgabenstellung beachten",
      },
      {
        id: "d",
        text: "Rabatte sind immer Brutto",
        isCorrect: false,
        whyWrongHint:
          "In der Aufgabe ist netto gerechnet — Mischung Brutto/Netto wäre ohne Umsatzsteuer-Info falsch",
      },
    ],
  },
];

/** LF2 — IT-Grundlagen (LF1–4: Markdown) */
export const LF2_IT_GRUNDLAGEN: LearningExercise[] = [
  {
    id: "hw-ram-volatile",
    title: "Arbeitsspeicher (RAM)",
    problem: "Warum gehen offene, nicht gespeicherte Dokumente nach Stromausfall typischerweise verloren?",
    solutionCode: `### RAM vs. permanenter Speicher\n\n- **RAM** ist flüchtig — Daten brauchen Refresh/Strom\n- **SSD/HDD** behält Daten ohne laufenden Strom (non-volatile)\n\n| Speicher | Flüchtig? |\n|----------|-------------|\n| DDR5 RAM | ja          |\n| NVMe SSD | nein        |`,
    lang: "markdown",
    mcQuestion: "Welche Aussage zu RAM ist richtig?",
    mcOptions: [
      {
        id: "a",
        text: "RAM ist flüchtig — ohne Strom sind die gespeicherten Inhalte weg",
        isCorrect: true,
      },
      {
        id: "b",
        text: "RAM sichert automatisch auf die Festplatte",
        isCorrect: false,
        whyWrongHint:
          "Dafür braucht es explizite Software/OS-Funktionen — physikalisch ist RAM flüchtig",
      },
      {
        id: "c",
        text: "RAM und ROM sind synonym",
        isCorrect: false,
        whyWrongHint:
          "ROM/Flash für Firmware ist nicht flüchtig wie DRAM — unterschiedliche Bausteine",
      },
      {
        id: "d",
        text: "Je höher die Taktfrequenz, desto flüchtiger der RAM",
        isCorrect: false,
        whyWrongHint:
          "Flüchtigkeit ist eine Eigenschaft der DRAM-Zelle, nicht der MHz-Zahl",
      },
    ],
  },
  {
    id: "hw-uefi",
    title: "Firmware — UEFI vs. Legacy-BIOS",
    problem: "Warum unterstützt UEFI typischerweise besser große Festplatten und sicheren Boot?",
    solutionCode: `### UEFI (Kurz)\n\n1. **GPT** statt klassischer MBR-Beschränkung\n2. **Secure Boot** — Prüfung von Bootloader-Signaturen\n3. Netzwerk- und Modul-Konzepte moderner Mainboards\n\n| Thema      | BIOS-Ära | UEFI      |\n|------------|----------|-----------|\n| große HDD  | begrenzt | GPT-freundlich |\n| Secure Boot| selten   | Standardfeature |`,
    lang: "markdown",
    mcQuestion: "Welches Argument spricht in Prüfungen am häufigsten für UEFI?",
    mcOptions: [
      {
        id: "a",
        text: "Bessere Unterstützung großer Datenträger (GPT) und moderner Boot-Sicherheit",
        isCorrect: true,
      },
      {
        id: "b",
        text: "UEFI ersetzt den Prozessor",
        isCorrect: false,
        whyWrongHint:
          "UEFI ist Firmware auf dem Mainboard — CPU bleibt separate Komponente",
      },
      {
        id: "c",
        text: "UEFI läuft nur ohne Betriebssystem",
        isCorrect: false,
        whyWrongHint:
          "UEFI startet vor dem OS und übergibt dann den Boot — OS läuft danach normal",
      },
      {
        id: "d",
        text: "GPT ist nur ein Grafikmodus",
        isCorrect: false,
        whyWrongHint:
          "GPT = GUID Partition Table — Partitionsschema, nicht Display",
      },
    ],
  },
  {
    id: "hw-thermik",
    title: "Thermisches Management",
    problem: "Warum ist Wärmeleitpaste zwischen CPU-Deckel und Kühlkörper sinnvoll?",
    solutionCode: `### Wärmeübergang\n\n- Mikrohohlräume zwischen Metallflächen → **Luftisolierung**\n- Paste verbessert **thermischen Kontakt**\n\nAblauf: sauber → dünn gleichmäßig → Kühlkörper montieren`,
    lang: "markdown",
    mcQuestion: "Was ist die Hauptfunktion der Wärmeleitpaste?",
    mcOptions: [
      {
        id: "a",
        text: "Reduziert Luftspalten und verbessert Wärmeübergang zur Kühlung",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Elektrische Isolation der CPU",
        isCorrect: false,
        whyWrongHint:
          "Paste leitet Wärme, nicht Strom blocken — Isolation wäre Keramik/Kunststoff anders definiert",
      },
      {
        id: "c",
        text: "Erhöht die Taktfrequenz automatisch",
        isCorrect: false,
        whyWrongHint:
          "Turbo-Boost steuert Firmware/CPU — Paste kühlt nur besser, „Auto-OC“ gibt es nicht so",
      },
      {
        id: "d",
        text: "Schützt vor Staub im Gehäuseinneren vollständig",
        isCorrect: false,
        whyWrongHint:
          "Staubschutz sind Filter/Luftstrom — Paste ist kein Dichtungsmittel",
      },
    ],
  },
  {
    id: "hw-usb",
    title: "USB — Datenrate (Konzept)",
    problem:
      "Ein Prüfling behauptet: „USB-C ist immer schneller als USB-A.“ Wie bewertest du das?",
    solutionCode: `### Stecker vs. Protokoll\n\n- **USB-C** = Formfaktor (oft moderne Generationen)\n- **USB-A** = Formfaktor (oft USB 2.0/3.x je nach Port)\n- Entscheidend: **USB-Generation** (2.0 / 3.2 / 4 …), nicht nur Steckerform`,
    lang: "markdown",
    mcQuestion: "Was ist die korrekte Einordnung?",
    mcOptions: [
      {
        id: "a",
        text: "Die Geschwindigkeit hängt vom USB-Standard/Controller ab, nicht vom Stecker allein",
        isCorrect: true,
      },
      {
        id: "b",
        text: "USB-C ist per Definition USB 2.0",
        isCorrect: false,
        whyWrongHint:
          "USB-C kann USB 3.2 Gen2x2, Thunderbolt usw. tragen — physische Form ≠ eine Geschwindigkeit",
      },
      {
        id: "c",
        text: "USB-A kann nie 5 Gbit/s",
        isCorrect: false,
        whyWrongHint:
          "USB 3.0 (blaue Ports) liefert 5 Gbit/s über USB-A — Aussage falsch",
      },
      {
        id: "d",
        text: "Nur die Kabellänge bestimmt die Rate",
        isCorrect: false,
        whyWrongHint:
          "Länge kann Signalqualität beeinflussen — Primär bestimmen Standard und aktive Elektronik die Rate",
      },
    ],
  },
  {
    id: "hw-display",
    title: "Display — Auflösung",
    problem: "1920×1080 Pixel bei 24″ Diagonale — was steigt primär mit höherer Auflösung bei gleicher Fläche?",
    solutionCode: `### Pixeldichte\n\n- Mehr Pixel auf gleicher Fläche → **höhere PPI** (schärfer)\n- **Nicht** automatisch größeres sichtbares „Arbeitsfeld“ ohne Skalierung — UI-Skalierung des OS entscheidet\n\n| Auflösung | Pixel gesamt |\n|-----------|--------------|\n| FHD       | ~2,1 MP      |\n| 4K        | ~8,3 MP      |`,
    lang: "markdown",
    mcQuestion: "Bei gleicher Bildschirmgröße erhöht 4K gegenüber FHD typischerweise …",
    mcOptions: [
      {
        id: "a",
        text: "Die Pixeldichte (feinere Darstellung), sofern Inhalte nicht stark hochskaliert werden",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Die Diagonale in Zoll",
        isCorrect: false,
        whyWrongHint:
          "Zoll sind die physische Größe — Auflösung ändert Pixelzahl, nicht die Gehäuse-Diagonale",
      },
      {
        id: "c",
        text: "Die Farbtiefe automatisch von 8 auf 16 Bit",
        isCorrect: false,
        whyWrongHint:
          "Farbtiefe ist Panel-/Treiber-Thema — nicht automatische Folge höherer Auflösung",
      },
      {
        id: "d",
        text: "Die Netzwerk-Latenz",
        isCorrect: false,
        whyWrongHint:
          "Display hat keine direkte Latenz zu Ethernet — Begriff verwechselt",
      },
    ],
  },
];

/** LF3 — Netzwerktechnik (ASCII-Diagramme, plain-text) */
export const LF3_NETZWERK: LearningExercise[] = [
  {
    id: "net-osi-ebene",
    title: "OSI-Modell — Zuordnung",
    problem: "Ordne TCP und IPv4 den Schichten zu (OSI, didaktische 7-Schichten-Zählung von oben 7=Anwendung)",
    solutionCode: `OSI-Schichten (vereinfachte Merkhilfe)\n+-----+--------------------------------+\n|  7  | Anwendung (HTTP, SMTP, DNS-Log)|\n|  6  | Darstellung (TLS-Teilaspekte)  |\n|  5  | Sitzung (logisch)              |\n|  4  | Transport (TCP, UDP)           |  <- TCP\n|  3  | Netzwerk (IPv4, IPv6, Routing) |  <- IPv4\n|  2  | Sicherung (MAC, Ethernet)      |\n|  1  | Bit-Übertragung (Kabel)        |\n+-----+--------------------------------+`,
    lang: "plain-text",
    mcQuestion: "In welcher Schicht liegt TCP?",
    mcOptions: [
      { id: "a", text: "Schicht 4 (Transport)", isCorrect: true },
      {
        id: "b",
        text: "Schicht 3 (Netzwerk)",
        isCorrect: false,
        whyWrongHint:
          "Schicht 3 ist u.a. IP-Routing — TCP ist End-zu-End-Transport auf Hosts",
      },
      {
        id: "c",
        text: "Schicht 2 (Sicherung)",
        isCorrect: false,
        whyWrongHint:
          "Schicht 2 rahmt Ethernet/MAC — TCP ist darüber gelagert",
      },
      {
        id: "d",
        text: "Schicht 7 (reine Anwendung)",
        isCorrect: false,
        whyWrongHint:
          "HTTP wäre eher Anwendung — TCP ist generischer Transportdienst",
      },
    ],
  },
  {
    id: "net-subnet-24",
    title: "IPv4 — /24 Subnetz",
    problem:
      "Netz 192.168.10.0/24 — wie viele **nutzbare** Hostadressen ergeben sich klassisch (alle Hostbits außer Netz- und Broadcast)?",
    solutionCode: `Subnetz /24\n-------------\nPrefix /24 -> 8 Hostbits\n2^8 = 256 Adressen gesamt\n- Netzadresse (.0)\n- Broadcast (.255)\n= 254 nutzbare Host-IPs\n\n  [192.168.10.0]----(Router .1)----[Internet]\n        |\n   .2 - .254 Hosts`,
    lang: "plain-text",
    mcQuestion: "Wie viele nutzbare Host-IPs hat ein typisches /24 ohne Subnet-Splitting?",
    mcOptions: [
      { id: "a", text: "254", isCorrect: true },
      {
        id: "b",
        text: "256",
        isCorrect: false,
        whyWrongHint:
          "256 ist Gesamtadressen — Netz und Broadcast sind nicht nutzbare Hosts in klassischer Auslegung",
      },
      {
        id: "c",
        text: "128",
        isCorrect: false,
        whyWrongHint:
          "128 wäre /25 mit einem freien Hostbit-Block — bei /24 sind es 8 Hostbits",
      },
      {
        id: "d",
        text: "252",
        isCorrect: false,
        whyWrongHint:
          "252 tritt z.B. bei /30 für Punkt-zu-Punkt auf — nicht bei /24",
      },
    ],
  },
  {
    id: "net-dns-ablauf",
    title: "DNS — Namensauflösung",
    problem: "Ein Client kennt nur www.example.de. Skizziere den logischen ersten Schritt im Heimnetz",
    solutionCode: `DNS im LAN (vereinfacht)\n\n  [PC] --(1) Query \"www.example.de?\")--> [DNS-Resolver]\n              ^\n              |\n         meist DHCP-\n         zugewiesen\n\nResolver fragt rekursiv/iterativ weiter bis Antwort A/AAAA`,
    lang: "plain-text",
    mcQuestion: "Wohin sendet ein Client typischerweise zuerst eine DNS-Anfrage?",
    mcOptions: [
      {
        id: "a",
        text: "Zum konfigurierten DNS-Resolver (oft Router/Fritzbox oder ISP/Google-Resolver per DHCP)",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Direkt zum Webserver auf Port 443",
        isCorrect: false,
        whyWrongHint:
          "HTTPS braucht zuerst eine IP — ohne DNS- oder Hosts-Eintrag geht der TCP-Connect nicht sinnvoll los",
      },
      {
        id: "c",
        text: "Zum DHCP-Server nur bei neuer Lease",
        isCorrect: false,
        whyWrongHint:
          "DHCP liefert oft Resolver-Adresse — die Namensauflösung läuft aber per DNS-Protokoll zum Resolver",
      },
      {
        id: "d",
        text: "Zur ARP-Tabelle des Routers",
        isCorrect: false,
        whyWrongHint:
          "ARP löst MAC zu bekannter IP — hier fehlt noch die IP aus DNS",
      },
    ],
  },
  {
    id: "net-dhcp-dora",
    title: "DHCP — Ablauf",
    problem: "Welche Reihenfolge beschreibt den klassischen DHCPv4-Vierer (DORA) sinngemäß?",
    solutionCode: `DHCP DORA (IPv4, klassisch)\n\n  Client                Server\n    |  Discover (Broadcast)\n    |-------------------->|\n    |  Offer\n    |<--------------------|\n    |  Request\n    |-------------------->|\n    |  ACK\n    |<--------------------|\n\nDanach: IP, Lease, Optionen (DNS, GW, ...) aktiv`,
    lang: "plain-text",
    mcQuestion: "Was folgt direkt auf die DHCP-Offer?",
    mcOptions: [
      {
        id: "a",
        text: "DHCP Request vom Client",
        isCorrect: true,
      },
      {
        id: "b",
        text: "DHCP ACK sofort ohne Request",
        isCorrect: false,
        whyWrongHint:
          "Der Client muss das Angebot formal annehmen — Request vor ACK",
      },
      {
        id: "c",
        text: "ARP-Request an den DNS-Server",
        isCorrect: false,
        whyWrongHint:
          "ARP gehört zur Schicht-2-Auflösung — nicht zur DHCP-Offer-Phase",
      },
      {
        id: "d",
        text: "TLS-Handshake",
        isCorrect: false,
        whyWrongHint:
          "TLS ist auf Anwendungstransport — DHCP arbeitet auf UDP 67/68",
      },
    ],
  },
  {
    id: "net-default-gw",
    title: "Standard-Gateway",
    problem: "Warum braucht ein Host in einem anderen Subnetz ein Default-Gateway?",
    solutionCode: `Routing-Idee\n------------\n  Host 10.0.0.5 /24 will 10.0.1.7 /24\n\n  gleiches Subnetz?  Nein\n  -> Paket an Default-Gateway (Router)\n     Router routet weiter\n\n  [Host]----[Switch]----[Router GW .1]---- andere Netze`,
    lang: "plain-text",
    mcQuestion: "Wann muss ein Host Frames an die MAC-Adresse des Default-Gateways senden?",
    mcOptions: [
      {
        id: "a",
        text: "Wenn die Ziel-IP nicht im eigenen Subnetz liegt (bei statischer Konfiguration ohne spezifischere Routen)",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Nur bei IPv6, nie bei IPv4",
        isCorrect: false,
        whyWrongHint:
          "Das Routing-Prinzip gilt analog — Subnetzvergleich ist IPv4/IPv6-Konzept",
      },
      {
        id: "c",
        text: "Immer, auch bei Ziel im gleichen /24",
        isCorrect: false,
        whyWrongHint:
          "Lokales Subnetz: direkter ARP zum Zielhost — Gateway wäre falsch",
      },
      {
        id: "d",
        text: "Nur wenn DNS versagt",
        isCorrect: false,
        whyWrongHint:
          "DNS löst Namen — Gateway ist Layer-3-Routing, unabhängig von DNS-Erfolg",
      },
    ],
  },
];

/** LF4 — Netz-Hardware & Verkabelung */
export const LF4_NETZ_HARDWARE: LearningExercise[] = [
  {
    id: "net4-stp",
    title: "STP — Zweck",
    problem: "Warum setzt man Spanning Tree in geswitchten Netzen mit redundanten Pfaden ein?",
    solutionCode: `### STP (Kurz)\n\n- Redundanz erzeugt **Schleifen** auf Schicht 2\n- STP deaktiviert logisch Ports → **baumförmige Topologie**\n- Verhindert Broadcast-Stürme\n\n| Ohne STP | Mit STP        |\n|----------|----------------|\n| Loops    | ein aktiver Pfad |`,
    lang: "markdown",
    mcQuestion: "Hauptziel von STP?",
    mcOptions: [
      {
        id: "a",
        text: "Schicht-2-Schleifen vermeiden bei redundanten Links",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Verschlüsselung von Ethernet-Frames",
        isCorrect: false,
        whyWrongHint:
          "Verschlüsselung ist Schicht-3/4/7 — STP ist reines Bridging",
      },
      {
        id: "c",
        text: "Erhöhung der WLAN-Reichweite",
        isCorrect: false,
        whyWrongHint:
          "Das ist Funkplanung — STP betrifft verkabelte Bridgedomains",
      },
      {
        id: "d",
        text: "Automatische VLAN-Zuordnung ohne Konfiguration",
        isCorrect: false,
        whyWrongHint:
          "VLANs sind Tagging/Konfig — STP verhindert nur Loops",
      },
    ],
  },
  {
    id: "net4-cat6",
    title: "Twisted Pair — Cat6",
    problem: "Warum Cat6 statt Cat5e für neue Verkabelung im Büro (Prüfungsargument)?",
    solutionCode: `### Kategorien (Auszug)\n\n| Kabel   | typ. 1G | 10G kurz |\n|---------|---------|----------|\n| Cat5e   | ja      | begrenzt |\n| Cat6    | ja      | besser   |\n\n- **AWG**, Schirmung, NEXT — bessere Übertragung höherer Frequenzen`,
    lang: "markdown",
    mcQuestion: "Welches Argument ist in Prüfungen am tragfähigsten?",
    mcOptions: [
      {
        id: "a",
        text: "Höhere Kategorie verbessert Übertragungsqualität/Headroom für schnellere Ethernet-Generationen",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Cat6 ist immer 10 Gbit/s über 100 m garantiert",
        isCorrect: false,
        whyWrongHint:
          "10GBASE-T auf Cat6 hat Distanzlimits — pauschale 100 m-Garantie ist falsch",
      },
      {
        id: "c",
        text: "Cat5e kann kein Gigabit",
        isCorrect: false,
        whyWrongHint:
          "1000BASE-T ist mit Cat5e spezifikationskonform möglich — Aussage falsch",
      },
      {
        id: "d",
        text: "Die Kabelfarbe bestimmt die Kategorie",
        isCorrect: false,
        whyWrongHint:
          "Farbe ist Konvention — Kategorie steht auf der Leitung/Prüfprotokoll",
      },
    ],
  },
  {
    id: "net4-lwl",
    title: "Lichtwellenleiter",
    problem: "Ein Vorteil von Glasfaser gegenüber Kupfer in der Backbone-Verkabelung?",
    solutionCode: `### LWL vs. Kupfer (Prüfung)\n\n- **Reichweite** ohne gleich schwere Dämpfungsprobleme\n- **EMV** — keine galvanische Kopplung\n- Höhere Datenraten über lange Distanz (WAN/MAN)\n\n| Medium | typ. EMV-Anfälligkeit |\n|--------|------------------------|\n| Kupfer | höher (klassisch)      |\n| LWL    | geringer               |`,
    lang: "markdown",
    mcQuestion: "Welcher Vorteil wird in IHK-nahen Antworten oft erwartet?",
    mcOptions: [
      {
        id: "a",
        text: "Geringere EMV-Probleme und hohe Bandbreite über große Distanzen",
        isCorrect: true,
      },
      {
        id: "b",
        text: "LWL braucht keine Spleiße",
        isCorrect: false,
        whyWrongHint:
          "Steckverbinder/Spleiße sind Pflicht — Wartung ist Aufwand",
      },
      {
        id: "c",
        text: "LWL versorgt PoE besser",
        isCorrect: false,
        whyWrongHint:
          "PoE ist elektrische Leistung — Glasfaser führt keinen Gleichstrom fürs Endgerät",
      },
      {
        id: "d",
        text: "LWL ist immer billiger als Kupfer im Bürohorizontal",
        isCorrect: false,
        whyWrongHint:
          "Kosten hängen von Projekt ab — pauschal unwahr",
      },
    ],
  },
  {
    id: "net4-ap-router",
    title: "Access Point vs. Router",
    problem: "Heim-WLAN: Was macht typischerweise der Router, nicht der reine AP?",
    solutionCode: `### Rollen\n\n| Gerät   | typische Funktionen              |\n|---------|----------------------------------|\n| Router  | NAT, DHCP-Server, Firewall, Routing |\n| AP      | nur Funk-Brücke zum LAN          |\n\n  Internet ----[Router+NAT]----[Switch]----[AP]~~~ Clients`,
    lang: "markdown",
    mcQuestion: "Welche Funktion gehört primär zum Router?",
    mcOptions: [
      {
        id: "a",
        text: "NAT und Weiterleitung zwischen Heim-LAN und ISP-Anschluss",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Nur 2,4-GHz-Kanalwahl ohne Ethernet",
        isCorrect: false,
        whyWrongHint:
          "Das ist reiner Funk-Teil — Router integriert oft WLAN, Kern ist Layer-3/NAT",
      },
      {
        id: "c",
        text: "VLAN-Tagging auf WAN ohne Router",
        isCorrect: false,
        whyWrongHint:
          "WAN-Tagging (z.B. bei ISP) wird am CPE/Router konfiguriert — AP allein nicht",
      },
      {
        id: "d",
        text: "DHCP gehört nie zum Router",
        isCorrect: false,
        whyWrongHint:
          "Heimrouter sind fast immer DHCP-Server — Standardbild",
      },
    ],
  },
  {
    id: "net4-poe",
    title: "PoE",
    problem: "Warum Power over Ethernet für IP-Telefone oder APs?",
    solutionCode: `### PoE (Konzept)\n\n- **Eine Leitung**: Daten + Strom\n- Weniger Steckernetzteile, zentrale USV möglich\n\n  Switch (PoE) ----RJ45---- [AP]\n              48V injiziert`,
    lang: "markdown",
    mcQuestion: "Hauptnutzen von PoE in der Praxis?",
    mcOptions: [
      {
        id: "a",
        text: "Stromversorgung des Endgeräts über die Datenleitung — weniger separate Strominstallation",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Ersetzt immer die Firewall",
        isCorrect: false,
        whyWrongHint:
          "Sicherheitsfunktionen sind unabhängig — PoE ist nur Energieversorgung",
      },
      {
        id: "c",
        text: "Verdoppelt automatisch die WLAN-Datenrate",
        isCorrect: false,
        whyWrongHint:
          "Datenrate hängt von Funkstandard und Kanalbreite ab — nicht von PoE",
      },
      {
        id: "d",
        text: "PoE funktioniert ohne PSE (Power Sourcing Equipment)",
        isCorrect: false,
        whyWrongHint:
          "Ein injizierender Switch/Injector ist nötig — sonst kein PoE",
      },
    ],
  },
];

/** LF8 — Datenmodell & Normalisierung */
export const LF8_DATENMODELL: LearningExercise[] = [
  {
    id: "db-nf1",
    title: "Erste Normalform (1NF)",
    problem: "Eine Zelle enthält „Tag1, Tag2, Tag3“ als CSV in einem Feld. Verletzung?",
    solutionCode: `### 1NF — atomare Werte\n\n| falsch (1NF verletzt) | richtiger Ansatz |\n|------------------------|------------------|\n| tags = \"a,b,c\"       | Hilfstabelle Tag_Zuordnung |\n\n- Keine **wiederholenden Gruppen** in einer Spalte`,
    lang: "markdown",
    mcQuestion: "Warum verletzt CSV in einer Zelle die 1NF?",
    mcOptions: [
      {
        id: "a",
        text: "Werte sind nicht atomar — mehrere Tags sind eine Liste, kein Skalar",
        isCorrect: true,
      },
      {
        id: "b",
        text: "CSV ist in SQL generell verboten",
        isCorrect: false,
        whyWrongHint:
          "Als Textskalar kann CSV existieren — semantisch sind es dennoch mehrere Werte",
      },
      {
        id: "c",
        text: "1NF verbietet nur Primärschlüssel",
        isCorrect: false,
        whyWrongHint:
          "Primärschlüssel gehört zu Integrität — 1NF fordert Atomarität der Domänen",
      },
      {
        id: "d",
        text: "Das ist nur eine Performance-Frage, kein Modellfehler",
        isCorrect: false,
        whyWrongHint:
          "Normalformen sind logische Designregeln — unabhängig von Performance",
      },
    ],
  },
  {
    id: "db-nf2",
    title: "Zweite Normalform (2NF)",
    problem: "Tabelle (bestell_id, produkt_id, menge, produkt_name) mit PK (bestell_id, produkt_id). Verletzung?",
    solutionCode: `### 2NF — volle funktionale Abhängigkeit vom gesamten Schlüssel\n\n- produkt_name hängt nur von **produkt_id** ab, nicht von **bestell_id**\n-> **partielle Abhängigkeit** vom zusammengesetzten PK\n\nLösung: Produkt in eigene Tabelle auslagern`,
    lang: "markdown",
    mcQuestion: "Welches Attribut verletzt typischerweise die 2NF?",
    mcOptions: [
      {
        id: "a",
        text: "produkt_name — hängt nur von produkt_id, nicht vom gesamten zusammengesetzten Schlüssel",
        isCorrect: true,
      },
      {
        id: "b",
        text: "menge — hängt von beiden",
        isCorrect: false,
        whyWrongHint:
          "menge bezieht sich auf die Kombination Bestellung+Produkt — das ist schlüsselgerecht",
      },
      {
        id: "c",
        text: "bestell_id allein",
        isCorrect: false,
        whyWrongHint:
          "bestell_id ist Schlüsselteil — kein Nicht-Schlüsselattribut",
      },
      {
        id: "d",
        text: "Keine — alles ist 2NF",
        isCorrect: false,
        whyWrongHint:
          "produkt_name ist klassisches Beispiel für partielle Abhängigkeit",
      },
    ],
  },
  {
    id: "db-pk",
    title: "Primärschlüssel",
    problem: "Warum ist eine reine Kunden-E-Mail als PK riskant?",
    solutionCode: `### Schlüsselwahl\n\n| PK auf E-Mail     | Problem                    |\n|-------------------|----------------------------|\n| änderbar          | Updates brechen FK-Referenzen |\n| nicht garantiert unique real world | menschliche Fehler |\n\nBesser: **surrogate key** (technische ID) + UNIQUE auf E-Mail`,
    lang: "markdown",
    mcQuestion: "Kernproblem natürlicher Schlüssel E-Mail?",
    mcOptions: [
      {
        id: "a",
        text: "Kann sich ändern — referentielle Integrität und Stabilität leiden",
        isCorrect: true,
      },
      {
        id: "b",
        text: "E-Mail darf nicht in Datenbanken gespeichert werden",
        isCorrect: false,
        whyWrongHint:
          "DSGVO erfordert Zweckbindung/Löschung — Speicherung ist nicht generell verboten",
      },
      {
        id: "c",
        text: "E-Mail ist immer 256 Zeichen lang",
        isCorrect: false,
        whyWrongHint:
          "Länge ist variabel — kein fachliches Kernproblem",
      },
      {
        id: "d",
        text: "Primärschlüssel dürfen nie UNIQUE sein",
        isCorrect: false,
        whyWrongHint:
          "PK ist per Definition eindeutig — UNIQUE ist implizit",
      },
    ],
  },
  {
    id: "db-fk",
    title: "Fremdschlüssel",
    problem: "Was erzwingt ein FOREIGN KEY ON DELETE RESTRICT typischerweise?",
    solutionCode: `### FK mit RESTRICT\n\n- Elternzeile kann nicht gelöscht werden, solange Kindzeilen existieren\n- Schützt vor **verwaisten Zeilen**\n\n  Kunde (id) 1---* Bestellung (customer_id FK)`,
    lang: "markdown",
    mcQuestion: "Effekt von ON DELETE RESTRICT?",
    mcOptions: [
      {
        id: "a",
        text: "Löschen des Elterndatensatzes wird verweigert, wenn Kinder existieren",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Kinder werden automatisch mit NULL überschrieben",
        isCorrect: false,
        whyWrongHint:
          "Das wäre SET NULL bei passender Spalte — nicht RESTRICT",
      },
      {
        id: "c",
        text: "Eltern und Kinder werden immer cascadiert gelöscht",
        isCorrect: false,
        whyWrongHint:
          "CASCADE ist eine andere Option — RESTRICT blockt",
      },
      {
        id: "d",
        text: "FK prüft nur Datentypen, keine Existenz",
        isCorrect: false,
        whyWrongHint:
          "Referentielle Integrität ist genau die Existenzprüfung",
      },
    ],
  },
  {
    id: "db-er",
    title: "ER — Kardinalität",
    problem: "Kunde bestellt viele Bestellungen, jede Bestellung einem Kunden — Kardinalität?",
    solutionCode: `### ER (Auszug)\n\n  [Kunde] 1 ----< [Bestellung] >---- n\n\n- Auf Kundenseite: **1**\n- Auf Bestellseite: **n**`,
    lang: "markdown",
    mcQuestion: "Welche Modellierung ist korrekt?",
    mcOptions: [
      {
        id: "a",
        text: "1:n von Kunde zu Bestellung",
        isCorrect: true,
      },
      {
        id: "b",
        text: "n:m ohne Auflösungstabelle",
        isCorrect: false,
        whyWrongHint:
          "n:m braucht typisch Zwischentabelle — hier ist 1:n aus der Aufgabenstellung klar",
      },
      {
        id: "c",
        text: "1:1 — jeder Kunde genau eine Bestellung",
        isCorrect: false,
        whyWrongHint:
          "„Viele Bestellungen“ widerspricht 1:1",
      },
      {
        id: "d",
        text: "n:1 von Bestellung zu Kunde ist etwas anderes als 1:n",
        isCorrect: false,
        whyWrongHint:
          "Richtung ist Perspektive — fachlich 1:n Kunde→Bestellung",
      },
    ],
  },
];

/** LF9 — Dienste & Protokolle (ASCII) */
export const LF9_DIENSTE_PROTOKOLLE: LearningExercise[] = [
  {
    id: "srv-ports",
    title: "Well-known Ports",
    problem: "Ordne zu: HTTP, HTTPS, DNS",
    solutionCode: `Standardports (typisch Prüfung)\n+------+-------+\n| Dienst | Port |\n+------+-------+\n| HTTP   |  80  |\n| HTTPS  | 443  |\n| DNS    |  53  |\n+------+-------+\n\n  Browser --:443 TLS--> Webserver`,
    lang: "plain-text",
    mcQuestion: "Welcher Port ist Standard für HTTPS?",
    mcOptions: [
      { id: "a", text: "443", isCorrect: true },
      {
        id: "b",
        text: "80",
        isCorrect: false,
        whyWrongHint:
          "80 ist klassisches HTTP ohne TLS — HTTPS nutzt 443 (außer explizit anders)",
      },
      {
        id: "c",
        text: "25",
        isCorrect: false,
        whyWrongHint:
          "25 ist SMTP — Mailübermittlung, nicht HTTPS",
      },
      {
        id: "d",
        text: "8080 ist immer HTTPS",
        isCorrect: false,
        whyWrongHint:
          "8080 ist oft alternativer HTTP-Port — nicht definierend für HTTPS",
      },
    ],
  },
  {
    id: "srv-smtp-imap",
    title: "SMTP vs. IMAP",
    problem: "Welches Protokoll dient primär dem **Zustellen** von Mail zum Server des Empfängers?",
    solutionCode: `Mail (vereinfacht)\n\n  [Client] --SMTP--> [MTA Empfänger]\n  [Client] --IMAP---> [Mailbox lesen]\n\nSMTP = Transport/Zustellung\nIMAP = Abruf/Ordner`,
    lang: "plain-text",
    mcQuestion: "Zustellung zwischen Servern / Einlieferung: typisches Protokoll?",
    mcOptions: [
      { id: "a", text: "SMTP", isCorrect: true },
      {
        id: "b",
        text: "IMAP",
        isCorrect: false,
        whyWrongHint:
          "IMAP holt Nachrichten aus der Mailbox — SMTP liefert/relayet",
      },
      {
        id: "c",
        text: "FTP",
        isCorrect: false,
        whyWrongHint:
          "FTP ist Dateitransfer — kein Mail-Zustellprotokoll",
      },
      {
        id: "d",
        text: "DHCP",
        isCorrect: false,
        whyWrongHint:
          "DHCP vergibt IP-Konfiguration — nicht Mailtransport",
      },
    ],
  },
  {
    id: "srv-dns-a-cname",
    title: "DNS — A vs. CNAME",
    problem: "Was macht ein CNAME-Record?",
    solutionCode: `DNS-Records (Auszug)\n\n  name.example.  CNAME  target.example.\n  -> Auflösung folgt weiter zu target (A/AAAA)\n\n  A-Record: Name -> IPv4 direkt`,
    lang: "plain-text",
    mcQuestion: "CNAME bedeutet …",
    mcOptions: [
      {
        id: "a",
        text: "Alias: der Name verweist auf einen anderen Kanonischen Namen",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Direkte IPv6-Zuweisung",
        isCorrect: false,
        whyWrongHint:
          "IPv6 wäre AAAA — CNAME ist ein indirekter Namensverweis",
      },
      {
        id: "c",
        text: "Mail-Weiterleitungspflicht",
        isCorrect: false,
        whyWrongHint:
          "MX-Records steuern Mailrouting — nicht CNAME-Zweck",
      },
      {
        id: "d",
        text: "CNAME und A dürfen am gleichen Namen koexistieren",
        isCorrect: false,
        whyWrongHint:
          "Klassisch ausgeschlossen — Name ist entweder CNAME oder andere Daten (Ausnahmen/Spezialfälle in DNSSEC/CDN ausklammern für IHK-Basis)",
      },
    ],
  },
  {
    id: "srv-http-stateless",
    title: "HTTP — Zustandslosigkeit",
    problem: "Warum gilt HTTP als zustandslos?",
    solutionCode: `HTTP Request/Response\n\n  Client ---- GET /page ---> Server\n         <--- 200 OK ----\n\nServer speichert **keinen** Sessionzustand zwischen Requests\n(Zustand über Cookies/Tokens auf Anwendungsebene)`,
    lang: "plain-text",
    mcQuestion: "Was bedeutet „stateless“ beim HTTP-Protokoll?",
    mcOptions: [
      {
        id: "a",
        text: "Jede Anfrage trägt alle nötigen Infos; der Server hält keine inhärente Session im Protokollkern",
        isCorrect: true,
      },
      {
        id: "b",
        text: "HTTP kann keine Cookies",
        isCorrect: false,
        whyWrongHint:
          "Cookies sind HTTP-Header-Mechanismus — stateless bezieht sich auf den Kern, nicht auf App-Layer",
      },
      {
        id: "c",
        text: "TCP ist stateless, HTTP nicht",
        isCorrect: false,
        whyWrongHint:
          "TCP ist verbindungsorientiert mit Zustand — HTTP sitzt darüber und ist anwendungsseitig zustandslos",
      },
      {
        id: "d",
        text: "Jeder Request muss UDP sein",
        isCorrect: false,
        whyWrongHint:
          "HTTP/1.1 und HTTP/2 nutzen typisch TCP — nicht UDP-Pflicht",
      },
    ],
  },
  {
    id: "srv-client-server",
    title: "Client-Server-Modell",
    problem: "Skizziere den ersten Schritt eines Webzugriffs nach DNS",
    solutionCode: `Ablauf (vereinfacht)\n\n  [Browser] --DNS--> Resolver\n  [Browser] --TCP SYN--> Webserver:443\n  [Browser] --TLS ClientHello-->\n  ... HTTP GET ...\n\n  +--------+   IP bekannt    +----------+\n  | Client | === TCP/443 === | Webserver|\n  +--------+                 +----------+`,
    lang: "plain-text",
    mcQuestion: "Was passiert unmittelbar nach erfolgreicher DNS-Auflösung zu einer HTTPS-Seite?",
    mcOptions: [
      {
        id: "a",
        text: "TCP-Verbindungsaufbau zum Ziel-IP:443, danach TLS-Handshake",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Sofortiges UDP-Broadcast im LAN",
        isCorrect: false,
        whyWrongHint:
          "HTTPS nutzt TCP — kein Broadcast für den Fernzugriff",
      },
      {
        id: "c",
        text: "DHCP Discover",
        isCorrect: false,
        whyWrongHint:
          "DHCP war beim Lease — nicht bei jeder Webanfrage",
      },
      {
        id: "d",
        text: "ARP-Anfrage an den Webserver in Japan ohne Gateway",
        isCorrect: false,
        whyWrongHint:
          "Fernziele gehen zum Gateway — ARP nur lokal im Subnetz",
      },
    ],
  },
];

/** LF10 — UI, Barrierefreiheit, UX */
export const LF10_UI_BARREFREI: LearningExercise[] = [
  {
    id: "ux-wcag-levels",
    title: "WCAG — Konformitätsstufen",
    problem: "Welche Stufe ist in öffentlichem Sektor Deutschland oft die relevante Planungsgröße (BITV 2.0 / EU-weit ähnlich)?",
    solutionCode: `### WCAG 2.x — Stufen\n\n- **A** — Basisforderungen\n- **AA** — gängige Zielmarke (u.a. Kontrast Normaltext)\n- **AAA** — maximale Anforderungen (nicht immer vollständig erreichbar)\n\n| Stufe | typische Nutzung        |\n|-------|-------------------------|\n| AA    | Referenz vieler Gesetze |`,
    lang: "markdown",
    mcQuestion: "Welche Stufe wird in der Praxis häufig als verbindliches Ziel genannt?",
    mcOptions: [
      { id: "a", text: "AA", isCorrect: true },
      {
        id: "b",
        text: "Nur A reicht immer",
        isCorrect: false,
        whyWrongHint:
          "A ist Minimum — viele Anforderungen (Kontrast) sitzen in AA",
      },
      {
        id: "c",
        text: "AAA ist Pflicht für alle Privatblogs",
        isCorrect: false,
        whyWrongHint:
          "AAA ist streng und kontextabhängig — nicht pauschal Pflicht",
      },
      {
        id: "d",
        text: "WCAG gilt nur für native Apps, nicht Web",
        isCorrect: false,
        whyWrongHint:
          "WCAG adressiert Webtechnologien — Apps haben verwandte Standards",
      },
    ],
  },
  {
    id: "ux-contrast",
    title: "Kontrast — Normaltext",
    problem: "Ungefähres Mindestkontrastverhältnis für normalen Text nach WCAG 2.1 AA?",
    solutionCode: `### Kontrast (AA, Auszug)\n\n- Normaltext: **4,5 : 1**\n- Großer Text: **3 : 1**\n\n| Inhalt    | AA-Kontrast |\n|-----------|-------------|\n| Body-Text | 4,5 : 1     |`,
    lang: "markdown",
    mcQuestion: "Welches Verhältnis ist die AA-Vorgabe für normalen Text?",
    mcOptions: [
      { id: "a", text: "4,5 : 1", isCorrect: true },
      {
        id: "b",
        text: "2 : 1",
        isCorrect: false,
        whyWrongHint:
          "2:1 reicht nicht für Normaltext-AA — zu niedrig für Lesbarkeit",
      },
      {
        id: "c",
        text: "10 : 1 Minimum immer",
        isCorrect: false,
        whyWrongHint:
          "10:1 ist nicht generelles AA-Minimum — 4,5:1 ist die Regelgröße",
      },
      {
        id: "d",
        text: "Kontrast ist nur Empfehlung ohne Messung",
        isCorrect: false,
        whyWrongHint:
          "WCAG definiert messbare Kontrastverhältnisse — Tools prüfen relativ luminance",
      },
    ],
  },
  {
    id: "ux-focus",
    title: "Tastatur — Fokus sichtbar",
    problem: "Warum dürfen Fokusrahmen bei Tastaturbedienung nicht „designbedingt“ komplett entfernt werden?",
    solutionCode: `### WCAG 2.4.7 Focus Visible (AA)\n\n- Nutzer:innen müssen **sehen**, wo sie sind\n- outline:none ohne sichtbaren Ersatz = Barriere\n\nTipp: sichtbaren Fokus-Stil definieren, der zum Theme passt`,
    lang: "markdown",
    mcQuestion: "Kernproblem bei unsichtbarem Fokus?",
    mcOptions: [
      {
        id: "a",
        text: "Tastatur-Nutzer:innen verlieren Orientierung — AA-Forderung verletzt",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Mausnutzer sind alle farbenblind",
        isCorrect: false,
        whyWrongHint:
          "Fokus betrifft Eingabemodalität — nicht alle Mausnutzer sind farbenblind",
      },
      {
        id: "c",
        text: "Fokus ist nur SEO",
        isCorrect: false,
        whyWrongHint:
          "SEO und Barrierefreiheit sind verschiedene Ziele — hier Usability/A11y",
      },
      {
        id: "d",
        text: "Browser erzwingen Fokus automatisch, CSS kann nichts ändern",
        isCorrect: false,
        whyWrongHint:
          "CSS kann Outline stark beeinflussen — Verantwortung bei Entwicklung",
      },
    ],
  },
  {
    id: "ux-color-alone",
    title: "Farbe allein",
    problem: "Fehlerzustände nur rot einfärben ohne Text/Ikon — Bewertung?",
    solutionCode: `### WCAG 1.4.1 Use of Color\n\n- Information nicht **nur durch Farbe** vermitteln\n- Zusatz: Text, Muster, Icon, Position\n\nSchlecht: nur roter Rand\nBesser: „Fehler: E-Mail ungültig“ + Icon`,
    lang: "markdown",
    mcQuestion: "Warum ist reines Rot ohne Zusatz kritisch?",
    mcOptions: [
      {
        id: "a",
        text: "Farbenblinde und Graustufen-Nutzer erkennen die Information nicht zuverlässig",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Rot ist in Deutschland verboten",
        isCorrect: false,
        whyWrongHint:
          "Es geht um Wahrnehmbarkeit — nicht um Verbotsfarbe",
      },
      {
        id: "c",
        text: "Nur Kontrast zählt, nicht Farbinformation",
        isCorrect: false,
        whyWrongHint:
          "Beides zählt — hier zusätzlich „nicht nur Farbe“",
      },
      {
        id: "d",
        text: "Screenreader lesen Farben automatisch vor",
        isCorrect: false,
        whyWrongHint:
          "Farbe wird nicht zuverlässig semantisch vorgelesen ohne Text",
      },
    ],
  },
  {
    id: "ux-nielsen",
    title: "Usability — Erwartungskonformität",
    problem: "Welche Nielsen-Heuristik wird verletzt, wenn ein „X“ oben rechts nicht schließt, sondern löscht?",
    solutionCode: `### Heuristik: Match real world / Konsistenz\n\n- Nutzer:innen erwarten **Konventionen** (X schließt)\n- Überraschung = Fehlerquote\n\n| Muster | Erwartung |\n|--------|-----------|\n| X      | Schließen |`,
    lang: "markdown",
    mcQuestion: "Welches UX-Prinzip ist primär verletzt?",
    mcOptions: [
      {
        id: "a",
        text: "Konsistenz und Übereinstimmung mit realen Konventionen / Erwartungskonformität",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Ästhetik und minimalistisches Design",
        isCorrect: false,
        whyWrongHint:
          "Minimalismus ist andere Heuristik — hier Bruch der erlernten Bedeutung von X",
      },
      {
        id: "c",
        text: "Flexibility — mehr Wege zum Ziel",
        isCorrect: false,
        whyWrongHint:
          "Es geht nicht um alternative Pfade, sondern um falsche Metapher",
      },
      {
        id: "d",
        text: "Lokalisierung — nur Englischproblem",
        isCorrect: false,
        whyWrongHint:
          "X ist kulturweit „close“ konnotiert — nicht Sprachproblem allein",
      },
    ],
  },
];

/** LF11 — Informationssicherheit */
export const LF11_INFO_SICHERHEIT: LearningExercise[] = [
  {
    id: "sec-cia",
    title: "CIA-Triade",
    problem: "Verschlüsselung ruhender Daten auf der Festplatte schützt primär welches Ziel?",
    solutionCode: `### CIA\n\n- **C**onfidentiality — Vertraulichkeit\n- **I**ntegrity — Unversehrtheit\n- **A**vailability — Verfügbarkeit\n\nFull-Disk-Encryption → primär **Vertraulichkeit** bei Diebstahl`,
    lang: "markdown",
    mcQuestion: "Full-Disk-Verschlüsselung eines Laptops?",
    mcOptions: [
      {
        id: "a",
        text: "Vertraulichkeit — Daten sind ohne Schlüssel nicht lesbar",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Integrität — verhindert Bit-Rot",
        isCorrect: false,
        whyWrongHint:
          "Integrität braucht Checksummen/Signaturen — Verschlüsselung allein stoppt nicht stille Datenkorruption",
      },
      {
        id: "c",
        text: "Verfügbarkeit — schneller Boot",
        isCorrect: false,
        whyWrongHint:
          "Verschlüsselung kann Latenz kosten — Verfügbarkeit ist nicht Hauptziel",
      },
      {
        id: "d",
        text: "Authentizität — sicherer Login",
        isCorrect: false,
        whyWrongHint:
          "Login ist IAM — FDE schützt Daten-at-rest, nicht primär Authentisierung",
      },
    ],
  },
  {
    id: "sec-321",
    title: "Backup 3-2-1",
    problem: "Was bedeutet die „1“ in 3-2-1?",
    solutionCode: `### 3-2-1 Regel\n\n- **3** Kopien der Daten\n- **2** verschiedene Medientypen\n- **1** Kopie **offsite** (externer Standort/Cloud)\n\nSchützt vor Brand, Ransomware im LAN, Hardware-Ausfall`,
    lang: "markdown",
    mcQuestion: "Die „1“ steht für …",
    mcOptions: [
      {
        id: "a",
        text: "Eine Kopie außerhalb des Primärstandorts (offsite)",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Ein Backup pro Tag",
        isCorrect: false,
        whyWrongHint:
          "Frequenz ist RPO-Planung — nicht die Definition der 1 in 3-2-1",
      },
      {
        id: "c",
        text: "Nur ein Dateisystem",
        isCorrect: false,
        whyWrongHint:
          "Medientypen sind „2“ — nicht die 1",
      },
      {
        id: "d",
        text: "Ein Administrator mit Vollzugriff",
        isCorrect: false,
        whyWrongHint:
          "Das ist Organisationsfrage — nicht 3-2-1-Bedeutung",
      },
    ],
  },
  {
    id: "sec-integritaet",
    title: "Integrität vs. Vertraulichkeit",
    problem: "Eine manipulierte Rechnungs-PDF ohne Kenntnis der Änderung — welches Schutzziel ist primär betroffen?",
    solutionCode: `### Zuordnung\n\n- Lesbarkeit für Unbefugte → **Vertraulichkeit**\n- Unbemerkte Änderung → **Integrität**\n\nSchutz: Signaturen, Hash-Ketten, Write-Once-Storage`,
    lang: "markdown",
    mcQuestion: "Unbemerkte inhaltliche Änderung?",
    mcOptions: [
      {
        id: "a",
        text: "Integrität — Inhalt ist nicht mehr authentisch/unversehrt nachweisbar",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Vertraulichkeit — PDF ist immer öffentlich",
        isCorrect: false,
        whyWrongHint:
          "Vertraulichkeit betrifft Zugriff — hier geht es um unerkannte Modifikation",
      },
      {
        id: "c",
        text: "Verfügbarkeit — Datei ist weg",
        isCorrect: false,
        whyWrongHint:
          "Die Datei existiert noch — sie ist nur inhaltlich untreu",
      },
      {
        id: "d",
        text: "Authentizität ist kein CIA-Ziel",
        isCorrect: false,
        whyWrongHint:
          "Authentizität ist verwandt mit Integrität/Identität — hier ist Integrität die beste Antwort",
      },
    ],
  },
  {
    id: "sec-phishing",
    title: "Phishing",
    problem: "Warum helfen technische Mailfilter allein nicht zu 100 %?",
    solutionCode: `### Defense in Depth\n\n- Filter: Heuristiken, SPF/DKIM/DMARC\n- Restrisiko: **menschliche Entscheidung**\n\nSchulung: Umgang mit Dringlichkeit, Anhängen, Links`,
    lang: "markdown",
    mcQuestion: "Restrisiko trotz Filter?",
    mcOptions: [
      {
        id: "a",
        text: "Nutzer:innen können social engineering trotzdem ausführen — Filter sind nicht perfekt",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Phishing existiert nur ohne TLS",
        isCorrect: false,
        whyWrongHint:
          "TLS schützt Transport — Phishing nutzt oft legitime Provider/Shortlinks",
      },
      {
        id: "c",
        text: "SPF reicht als alleinige Lösung",
        isCorrect: false,
        whyWrongHint:
          "SPF ist ein Puzzleteil — kein vollständiger Schutz",
      },
      {
        id: "d",
        text: "Filter blocken immer interne Mails",
        isCorrect: false,
        whyWrongHint:
          "Interne Mails sind Policy-Sache — nicht Allgemeingültigkeit",
      },
    ],
  },
  {
    id: "sec-mfa",
    title: "MFA",
    problem: "Warum ist Passwort + TOTP besser als nur Passwort?",
    solutionCode: `### MFA\n\n- Faktoren: Wissen, Besitz, Inherence\n- TOTP = **Besitz** (Gerät/Secret)\n\nAngriff auf geleaktes Passwort reicht nicht ohne zweiten Faktor`,
    lang: "markdown",
    mcQuestion: "Welches Argument trifft den Kern?",
    mcOptions: [
      {
        id: "a",
        text: "Kompromittierung eines Faktors reicht nicht — zweiter Faktor blockt viele Account-Takeovers",
        isCorrect: true,
      },
      {
        id: "b",
        text: "TOTP ersetzt TLS",
        isCorrect: false,
        whyWrongHint:
          "Transportverschlüsselung bleibt — MFA schützt Authentisierung, nicht Sniffing allein",
      },
      {
        id: "c",
        text: "MFA verkürzt Passwortrichtlinien sinnlos",
        isCorrect: false,
        whyWrongHint:
          "Passwortqualität bleibt wichtig — MFA addiert, ersetzt nicht immer schwache Secrets sinnvoll",
      },
      {
        id: "d",
        text: "MFA verhindert Phishing vollständig",
        isCorrect: false,
        whyWrongHint:
          "Moderne Angriffe (Proxy/MitM) können MFA umgehen — reduziert aber Risiko massiv",
      },
    ],
  },
];

/** LF12 — Projektmanagement & Scrum */
export const LF12_AGILE_PM: LearningExercise[] = [
  {
    id: "pm-scrum-master",
    title: "Scrum — Scrum Master",
    problem: "Welche Aufgabe ist primär?",
    solutionCode: `### Scrum Master (Scrum Guide — Kernideen)\n\n- Prozess & Zusammenarbeit **facilitieren**\n- Hindernisse **beseitigen**\n- **Kein** klassischer Weisungsprojektleiter über das Team`,
    lang: "markdown",
    mcQuestion: "Typische Scrum-Master-Aufgabe?",
    mcOptions: [
      {
        id: "a",
        text: "Impediments beseitigen und Scrum-Events wirksam gestalten",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Alle fachlichen Anforderungen allein festlegen",
        isCorrect: false,
        whyWrongHint:
          "Fachlich priorisiert der Product Owner — nicht der Scrum Master",
      },
      {
        id: "c",
        text: "Sprint-Ziele ohne Team festlegen",
        isCorrect: false,
        whyWrongHint:
          "Sprint Planning ist kollaborativ — PO + Team",
      },
      {
        id: "d",
        text: "Lineare Gantt-Planung erzwingen",
        isCorrect: false,
        whyWrongHint:
          "Scrum arbeitet iterativ-inkrementell — kein klassisches Waterfall-Gantt als Zwang",
      },
    ],
  },
  {
    id: "pm-daily",
    title: "Daily Scrum",
    problem: "Zweck des Daily Scrum?",
    solutionCode: `### Daily Scrum\n\n- **Synchronisation** für 24h\n- Hindernisse sichtbar machen\n- **Kein** Statusbericht an externe Stakeholder`,
    lang: "markdown",
    mcQuestion: "Was ist der Fokus?",
    mcOptions: [
      {
        id: "a",
        text: "Team abstimmen: Fortschritt zum Sprintziel und Blocker erkennen",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Abnahme des Inkrements durch den Kunden",
        isCorrect: false,
        whyWrongHint:
          "Abnahme ist Sprint Review — nicht Daily",
      },
      {
        id: "c",
        text: "Retrospektive durchführen",
        isCorrect: false,
        whyWrongHint:
          "Retro ist separates Event — nicht täglich",
      },
      {
        id: "d",
        text: "Backlog-Refinement ersetzen",
        isCorrect: false,
        whyWrongHint:
          "Refinement ist kontinuierlich geplant — Daily ersetzt es nicht",
      },
    ],
  },
  {
    id: "pm-review-retro",
    title: "Review vs. Retrospektive",
    problem: "Welches Event fokussiert das Inkrement und Stakeholder-Feedback?",
    solutionCode: `### Events\n\n| Event        | Fokus                          |\n|--------------|--------------------------------|\n| Sprint Review| Inkrement, Feedback, Markt   |\n| Retro        | Prozess/Team-Zusammenarbeit  |`,
    lang: "markdown",
    mcQuestion: "Inkrement zeigen und Feedback einholen?",
    mcOptions: [
      { id: "a", text: "Sprint Review", isCorrect: true },
      {
        id: "b",
        text: "Sprint Retrospektive",
        isCorrect: false,
        whyWrongHint:
          "Retro verbessert Arbeitsweise — nicht primär Produktvorführung",
      },
      {
        id: "c",
        text: "Daily Scrum",
        isCorrect: false,
        whyWrongHint:
          "Daily ist Kurzsync — kein Stakeholder-Inkrement-Review",
      },
      {
        id: "d",
        text: "Sprint Planning Teil 3",
        isCorrect: false,
        whyWrongHint:
          "Planning plant Arbeit — Review zeigt Ergebnis",
      },
    ],
  },
  {
    id: "pm-po-backlog",
    title: "Product Owner — Backlog",
    problem: "Wer ist für die Priorität des Product Backlogs verantwortlich?",
    solutionCode: `### Product Owner\n\n- **eine** Person entscheidet über **Priorität**\n- Entwicklungsteam schätzt, PO ordnet\n\nWidersprüche klären — keine „Committee-Priorität“ im klassischen Scrum`,
    lang: "markdown",
    mcQuestion: "Zuständigkeit Priorität?",
    mcOptions: [
      { id: "a", text: "Product Owner", isCorrect: true },
      {
        id: "b",
        text: "Scrum Master",
        isCorrect: false,
        whyWrongHint:
          "SM moderiert Prozess — PO entscheidet Wertschöpfungspriorität",
      },
      {
        id: "c",
        text: "Entwicklungsteam allein",
        isCorrect: false,
        whyWrongHint:
          "Team liefert wie — **was** zuerst kommt, bestimmt PO",
      },
      {
        id: "d",
        text: "Externer Projektleiter ohne PO-Rolle",
        isCorrect: false,
        whyWrongHint:
          "Ohne klare PO-Verantwortung entsteht Prioritätschaos — Scrum definiert PO-Rolle",
      },
    ],
  },
  {
    id: "pm-dod",
    title: "Definition of Done",
    problem: "Wozu dient die Definition of Done?",
    solutionCode: `### DoD\n\n- **Qualitätsstandard** für jedes Inkrement\n- Macht „fertig“ **transparent**\n\nBeispiele: Tests, Docs, Code-Review — teamweit vereinbart`,
    lang: "markdown",
    mcQuestion: "Kernzweck der DoD?",
    mcOptions: [
      {
        id: "a",
        text: "Gemeinsames Qualitätsniveau — erst dann gilt Arbeit als Sprint-Output „fertig“",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Marketingtext für Kunden",
        isCorrect: false,
        whyWrongHint:
          "DoD ist internes Qualitätsabkommen — nicht Werbetext",
      },
      {
        id: "c",
        text: "Ersatz für Tests",
        isCorrect: false,
        whyWrongHint:
          "DoD kann Tests fordern — ersetzt sie nicht",
      },
      {
        id: "d",
        text: "Nur für Bugs, nicht für Features",
        isCorrect: false,
        whyWrongHint:
          "DoD gilt für alle Product Backlog Items, die fertig werden",
      },
    ],
  },
];
