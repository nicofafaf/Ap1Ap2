/**
 * Kurze Mentor-Erklärungen (Deep-Dive) pro Übung — für Review nach dem Kampf
 * Unbekannte IDs fallen auf einen verständlichen Fallback zurück
 */

const MENTOR_BY_ID: Record<string, string> = {
  "sql-join-inner-orders":
    "Ein INNER JOIN behält nur Zeilen, für die auf beiden Seiten ein Partner existiert — genau wie „nur Kunden mit echter Bestellung“. Stell dir zwei Listen vor, die du an einem gemeinsamen Schlüssel zusammenklebst: ohne Treffer gibt es keine Ausgabezeile. In Prüfungen wird oft LEFT gegen INNER getauscht — merke dir: INNER schneidet strikt zu. Wenn du unsicher bist, male zwei Mini-Tabellen mit je drei Zeilen und zähle das Ergebnis von Hand nach",
  "sql-left-customer-count":
    "LEFT JOIN behält die linke Tabelle komplett; fehlende rechte Zeilen werden mit NULL aufgefüllt. COUNT(o.id) zählt nur nicht-NULL-Werte — dadurch werden „0 Bestellungen“ korrekt, COUNT(*) würde die Gruppenzeile selbst mitzählen. Das ist ein klassischer SQL-Fallenstreich in der IHK: Semantik vor Syntax. Probier es mit einem Kunden ohne Orders — nur COUNT(o.id) bleibt ehrlich",
  "sql-group-sum":
    "GROUP BY fasst Zeilen zu Buckets zusammen; Aggregatfunktionen wie SUM arbeiten pro Bucket. Ohne GROUP BY passt eine nicht-aggregierte Spalte wie category nicht zum Gesamt-SUM — der Standard verbietet das. Denk an eine Kasse: erst Warengruppe wählen (GROUP), dann summieren. Wenn du GROUP BY weglässt, will die Datenbank nicht raten, welche Kategorie gemeint ist",
  "sql-group-avg-having":
    "WHERE filtert Zeilen vor der Gruppierung, HAVING filtert Gruppen nach Aggregation — z. B. nur Kategorien mit Mittelwert über Schwellwert. Die Reihenfolge im Kopf: FROM → WHERE → GROUP BY → HAVING → SELECT. In Aufgaben wird HAVING oft vergessen, obwohl der Text nach einem Kriterium auf dem Durchschnitt fragt. Formuliere die Frage erst umgangssprachlich, dann übersetzt sich das SQL fast von selbst",
  "sql-inner-multi":
    "Mehrere INNER JOINs hängen Tabellen an eine Kette — jeder Schritt reduziert auf Zeilen mit passenden Schlüsseln. Die Reihenfolge der JOINs ändert bei INNER meist nur die Lesbarkeit, nicht die Menge (bei gleicher Logik). Achte auf Aliasnamen: sie verhindern Mehrdeutigkeit bei gleichnamigen Spalten. Skizziere das Entity-Relationship-Bild, dann siehst du, welche Tabelle die „Brücke“ ist",
  "sql-left-anti":
    "Ein Anti-Join findet linke Zeilen ohne Partner rechts — typisch mit LEFT JOIN … WHERE partner.id IS NULL. Das ist „alles ohne Treffer“, nicht „alles mit Treffer“. INNER würde solche Kandidaten sofort verwerfen. In Prüfungen taucht das als „Liste der X ohne Y“ auf. Teste mental einen Datensatz, der nur links existiert — der muss im Ergebnis landen",
  "sql-group-two-aggregates":
    "Mehrere Aggregates in einer GROUP BY-Abfrage sind erlaubt, solange alle Nicht-Gruppenspalten entweder in GROUP BY liegen oder aggregiert werden. Du bekommst pro Gruppe mehrere Kennzahlen auf einmal — z. B. SUM und AVG parallel. Der Fehler entsteht, wenn eine Spalte „nebenher“ ohne Aggregat steht. Schreib dir pro Zeile im SELECT auf: gruppiert oder aggregiert",
  "sql-join-aggregate-sub":
    "Eine Unterabfrage liefert eine temporäre Tabelle, auf die der äußere SELECT wie auf eine echte Tabelle zugreift — nützlich für Zwischenaggregationen. JOIN auf Subqueries strukturiert komplexe Reports lesbarer als verschachtelte Korrelationen. Achte auf Aliase für die Subquery — ohne Namen beschwert sich der Parser. Frag dich: Was ist die kleinste Zwischenfrage, die ich zuerst beantworten kann",
  "sql-inner-left-mix":
    "Mischformen aus INNER und LEFT in einem Query kombinieren strikte und erhaltende Teile — z. B. Pflicht-Joins INNER, optionale Daten LEFT. Jede JOIN-Art wirkt nur auf ihre direkte Nachbartabelle. Zeichne Pfeile: INNER = beide müssen passen, LEFT = links bleibt. So vermeidest du, dass ein optionaler Teil deine Pflichtzeilen wegschneidet",
  "sql-sum-avg-train":
    "SUM und AVG sind Aggregates auf numerischen Spalten pro Gruppe — AVG ignoriert NULL-Werte in vielen Dialekten wie ein „Durchschnitt nur über bekannte Werte“. COUNT(*) vs COUNT(spalte) ist ein anderes Thema: hier geht es um Kennzahlen auf Mengen. Lies die Aufgabe: will sie Gesamtlast (SUM) oder typische Größe (AVG). Ein schneller Plausibilitätscheck mit kleinen Zahlen rettet Punkte",

  "js-let-const":
    "let ist block-scoped und veränderlich, const fixiert die Bindung — der Wert hinter Referenzen kann bei Objekten trotzdem mutieren. var ist funktionsscoped und hoistet sich mit undefined — deshalb gilt in modernem JS: lieber let/const. In Prüfungsfragen geht es oft um Shadowing in inneren Blöcken. Schließe den Block mentally: wo endet die Sichtbarkeit",
  "js-for-sum":
    "Eine for-Schleife summiert, indem sie einen Akkumulator in jedem Schritt aktualisiert — klassisches Muster für deterministische Iteration. Achte auf Start-, End- und Schrittweite, sonst hast du Off-by-one. while ist äquivalent möglich, for packt Kopf und Zähler kompakt. Spiele den Loop mit drei Elementen durch — dann siehst du den Akku-Lauf",
  "js-while":
    "while wiederholt, solange die Bedingung wahr ist — die kann schon vor dem ersten Lauf false sein. Im Gegensatz zu do-while wird also kein Pflicht-Durchlauf erzwungen. Endlosschleifen entstehen, wenn der Zustand sich nicht annähert. Schreib die Abbruchbedingung als Invariante: „Was muss irgendwann false werden“",
  "js-typeof":
    "typeof liefert Strings wie „string“ oder „number“ und ist der schnelle Laufzeit-Check für primitive Typen — null ist historisch „object“, das kennst du als JS-Eckenfall. Für Arrays nutzt man oft Array.isArray. In MC-Fragen wird typeof mit instanceof verwechselt — instanceof braucht Konstruktoren/Prototypen. Frag: will ich einen Typnamen oder eine Vererbungskette prüfen",
  "js-class-basic":
    "Klassen in JS sind syntaktischer Zucker über Prototypen — Methoden landen am Prototyp, nicht als Kopie pro Instanz. constructor initialisiert Zustand; this zeigt auf die Instanz beim Aufruf über Objekt.punkt. Fehler entstehen, wenn Methoden losgelöst werden und this verloren geht — dann braucht es bind oder Arrow im Feld. Denk an eine Fabrik: class ist die Blaupause",

  "cs-int-double":
    "int ist ganzzahlig, double ist Gleitkomma — Divisionen verhalten sich unterschiedlich (Ganzzahl-Division vs. echte Teilung). Rundungsfehler entstehen nur bei Floating-Point, nicht bei sauberen ints innerhalb des Bereichs. Casting wie (double)a / b erzwingt Fließkomma-Pfad. Lies die Aufgabe: geht es um Rest, Quotient oder exakte Physik",
  "cs-for":
    "C# for bündelt Initialisierung, Bedingung und Inkrement — ideal für Zählerschleifen mit fester Struktur. foreach ist besser für IEnumerable, wenn kein Index nötig ist. Achte auf < vs <= in der Grenze — klassischer Off-by-one. Ein Trockenlauf mit n=3 macht die Iteration transparent",
  "cs-while":
    "while testet vor jedem Durchlauf — kann also null mal laufen. do-while garantiert mindestens einen Lauf. Bei while musst du sicherstellen, dass der Zustand sich ändert, sonst hängt die Schleife. Formuliere die Schleifen-Invariante: welche Größe sinkt oder welches Flag wird gesetzt",
  "cs-class-prop":
    "Auto-Properties { get; set; } erzeugen implizite Backing-Felder — kompakt und idiomatisch in C#. Felder vs. Properties: von außen sollst du meist Properties exponieren, um später Logik einziehen zu können. readonly setzt Unveränderlichkeit zur Initialisierungszeit. Überlege: braucht die Kapselung später Validierung",
  "cs-list-add":
    "List<T> ist dynamisch wachsend; Add hängt am Ende an mit amortisiert O(1). Arrays haben feste Länge — Resize bedeutet neues Array. Contains ist linear, Dictionary ist für Schlüssellookups besser. Die Frage ist oft: brauche ich Reihenfolge und Duplikate — dann List",

  "wirt-handelsspanne":
    "Die Handelsspanne vergleicht Verkauf und Bezug — sie zeigt, wie viel vom Ladenpreis nach Abzug des Einkaufs übrig bleibt. Formeln wirken kompliziert, bis du sie mit konkreten Eurobeträgen nachrechnest. Achte auf Prozent vom Verkauf vs. vom Einkauf — das sind verschiedene Bezugsgrößen. Schreib die Definition in eigenen Worten, bevor du die MC liest",
  "wirt-kaufvertrag-gefahr":
    "Gefahrübergang regelt, wer den zufälligen Untergang trägt — das ist klassisches BGB-Grundwissen für Einkauf/Verkauf. Übergabe und Übereignung sind nicht immer zeitlich identisch; Incoterms und Vereinbarungen modifizieren das Bild. In Prüfungen werden Schlagwörter wie „Gefahr“ und „Lieferung“ gegeneinander gespielt. Ordne: wem gehört das Risiko in der konkreten Story",
  "wirt-werk-dienst":
    "Werkvertrag liefert ein konkretes Ergebnis, Dienstvertrag liefert Tätigkeit — der Unterschied steuert Gewährleistung und Abnahme. Beim Werk zählt „fertig und vertragsgemäß“, beim Dienst oft nur ordnungsgemäße Ausführung. Such im Sachverhalt nach messbarem Ergebnis vs. reiner Aufwand. Das entscheidet oft eine einzige Schlüsselfrage",
  "wirt-skonto":
    "Skonto ist ein Zahlungsnachlass bei pünktlicher Begleichung — rechnerisch ein Rabatt auf den Zahlungsbetrag, nicht auf die Rechnung ohne Kontext. Fristen und Basisbetrag musst du exakt lesen. Rechne mit einem Mini-Beispiel: 3 % von welchem Betrag. Dann springen Fallen mit „brutto/netto“ auf",
  "wirt-einkaufspreis":
    "Von Listeneinkaufspreis zum Bezugspreis addierst du Zuschläge, subtrahierst Rabatte — die Kette ist eine Buchungs- und Kalkulationslogik, kein Rätsel. Jeder Schritt hat einen Namen; wenn einer fehlt, passt das Endergebnis nicht. Mach eine Tabelle mit Zwischenspalten. So siehst du, welche Option eine Zeile überspringt",

  "hw-ram-volatile":
    "RAM ist flüchtig — ohne Strom ist der Inhalt weg. Persistenz lebt auf SSD/HDD oder ROM. Deshalb heißt es „Arbeitsspeicher“: er hält aktive Programme und Daten für schnellen Zugriff. In MC-Fragen wird RAM mit Cache oder Register verwechselt — ordne Größe und Geschwindigkeit der Speicherpyramide zu",
  "hw-uefi":
    "UEFI ist der moderne Firmware-Nachfolger mit Grafik, Netzboot und signierter Bootkette. BIOS ist das alte CSM-Konzept — viele Boards kapseln beides. Sicherheitsfeatures wie Secure Boot hängen an UEFI. Frag: geht es um Startsequenz, Treiber oder Security Policy",
  "hw-thermik":
    "Thermische Grenzen begrenzen Takt und Dauerlast — Kühlung ist Teil der Systemstabilität, nicht Luxus. Throttling senkt Leistung, um Schäden zu vermeiden. Wärmeleitpaste, Kühlkörper und Gehäuseluft sind konkrete Bausteine. Überlege: Symptom Hitzestau vs. Stromversorgung — unterschiedliche Diagnosepfade",
  "hw-usb":
    "USB vereint Daten und Strom; Versionen unterscheiden Geschwindigkeit und Protokoll-Features. Kabellängen und Hubs beeinflussen Stabilität — nicht jede Farbe am Stecker ist „nur Deko“. Bei MC geht es oft um richtige Version zur passenden Bandbreite. Halte die Spec-Namen grob im Kopf",
  "hw-display":
    "Auflösung, Farbraum und Panel-Tech (IPS/TN/OLED) bestimmen Bildqualität und Blickwinkel. Refreshrate ist Gaming-relevant, Kalibrierung für Design. Verwechsel nicht HDMI-Bandbreite mit „wie viele Pixel fühlbar“. Ordne Anwendungsfall und Spec",

  "net-osi-ebene":
    "OSI schichtet Netzfunktionen — Transport (z. B. TCP) ist nicht dasselbe wie Vermittlung oder Sicherung. Merkhilfe: Please Do Not Throw Sausage Pizza Away — aber verstehen ist besser als auswendig. Wenn die Frage nach Segmenten vs. Frames fragt, bist du bei Schichten 4 vs. 2. Ordne das konkrete Protokoll der Schicht zu",
  "net-subnet-24":
    "/24 bedeutet 24 feste Netzbits — typisch 256 Adressen, davon nutzbar 254 IPv4-Hosts mit klassischer Subnetzlogik. Broadcast und Netzadresse sind reserviert. Rechnen mit Hostbits = 32-24. Wenn eine Option „255 Hosts“ ohne Kontext sagt, ist Vorsicht angesagt",
  "net-dns-ablauf":
    "DNS löst Namen in Adressen auf — rekursiv beim Resolver, autoritativ beim zuständigen Server. Caching beschleunigt, TTL steuert Frische. Verwechsel nicht DNS mit ARP oder DHCP — andere Schicht, andere Aufgabe. Folge einem Lookup als Kette: Client → Resolver → autoritative Antwort",
  "net-dhcp-dora":
    "DHCP nutzt Discover/Offer/Request/Ack — dynamische Vergabe von IPv4-Konfiguration. Ohne Lease-Erneuerung läuft die Adresse ab. Reservierungen und Pools sind Admin-Konzepte. Wenn die Frage nach Broadcast vs. Unicast im frühen Schritt fragt, denk an Discover",
  "net-default-gw":
    "Der Default-Gateway ist der nächste Hop ins fremde Subnet — ohne ihn bleibt lokaler Verkehr lokal. Hosts brauchen Route oder Gateway-Eintrag. Verwechsel nicht Gateway mit DNS-Server. Stell dir zwei Subnetze vor: Pakete „nach draußen“ wandern zur Router-Schnittstelle",

  "net4-stp":
    "STP verhindert Schleifen in geswitchten LANs durch logisches Deaktivieren von Ports — Redundanz bleibt physisch, aber nicht alle Pfade sind aktiv. Root-Bridge und Port-Rollen bestimmen die Topologie. Ohne STP würden Broadcaststürme eskalieren. Frag: geht es um Layer-2-Loops oder Routing",
  "net4-cat6":
    "Cat6 definiert Kabelklassen für Gigabit und höhere Frequenzen — Länge und Terminierung wirken auf Störfestigkeit. Ältere Kat-Klassen haben geringere Bandbreite. Bei MC: Paaranzahl und Stecker bleiben RJ45, die Klasse ändert Signalqualität",
  "net4-lwl":
    "Glasfaser nutzt Lichtwellenleiter — hohe Bandbreite, gute EMV, aber Biegeradien und saubere Steckverbindungen sind kritisch. Singlemode vs. Multimode ist Distanz vs. Lichtführung. Nicht mit Kupfer-Kategorien vermischen",
  "net4-ap-router":
    "Access Points fokussieren Funkzugang; Router routen zwischen Netzen — Home-Geräte kombinieren oft Funktionen. In der Prüfung zählt saubere Rollentrennung im Text. Frag: geht es um Layer-3-Entscheid oder Layer-2-Funkzelle",
  "net4-poe":
    "Power over Ethernet versorgt Geräte über das gleiche Kabel — Watt-Klassen und Switch-Fähigkeiten müssen passen. Nicht jedes Gerät unterstützt jeden Standard. Plane Last pro Port, nicht nur „irgendwie Strom“",

  "db-nf1":
    "Erste Normalform: atomare Werte — keine wiederholenden Gruppen in einer Zelle. Jede Spalte soll einen einfachen Wert tragen, keine Listen-in-Spalten-Excel-Stil. Wenn du mehrfache Telefonnummern siehst, gehört das in eine Kind-Tabelle. NF1 ist die Basis für alles Weitere",
  "db-nf2":
    "Zweite Normalform: volle funktionale Abhängigkeit vom gesamten Schlüssel — bei zusammengesetztem Schlüssel dürfen Nicht-Schlüsselattribute nicht nur von einem Teil abhängen. Partial Dependencies raus in eigene Tabellen. Zeichne Schlüssel unter und markiere, welche Spalte von welchem Teil lebt",
  "db-pk":
    "Primary Key identifiziert eindeutig eine Zeile — not null und uniqueness. Surrogate Keys sind künstlich, natural keys kommen aus der Domäne. Ohne PK wird Referenzierung unscharf. Überlege: kann sich ein natürlicher Schlüssel ändern — dann ist Surrogat oft robuster",
  "db-fk":
    "Foreign Key stellt referentielle Integrität sicher — Kind zeigt auf gültiges Elternteil. ON DELETE/UPDATE Regeln steuern Kaskaden. Ohne FK bleiben verwaiste Zeilen möglich. Die MC testet oft: was passiert beim Löschen der Elternzeile",
  "db-er":
    "ER-Modelle zeigen Entitäten, Attribute und Beziehungen — Kardinalitäten (1:1, 1:n, n:m) steuern spätere Tabellen. n:m braucht Auflösungstabellen. Wenn du das Diagramm lesen kannst, ist das SQL daneben nur noch Abbildung",

  "srv-ports":
    "Wohlbekannte Ports ordnen Diensten zu — 443/TLS-Web, 22/SSH, 25/SMTP (Kontext!). Dynamische Ports sind Client-seitig oft hoch. Die Frage will Zuordnung, keine auswendig alle 65535. Denk an „welcher Dienst lauscht hier typischerweise“",
  "srv-smtp-imap":
    "SMTP überträgt Mail zustellend, IMAP hält Postfächer synchron — unterschiedliche Rollen im Mail-Ökosystem. POP3 lädt eher weg. Verwechsel nicht Transport mit Abruf. Ordne: senden vs. lesen/ordnen",
  "srv-dns-a-cname":
    "A/AAAA liefern Adressen, CNAME ist Alias auf einen Namen — Ketten und Apex-Regeln (CNAME am Root) sind Stolpersteine. Für schnelle MC: brauche ich direkt eine IP oder einen Verweis auf einen anderen Hostnamen",
  "srv-http-stateless":
    "HTTP ist zustandslos — jede Anfrage trägt alle nötigen Infos oder Cookies/Sessions bauen Zustand darüber. Das skaliert gut für Server. Stateless heißt nicht „ohne Login“, sondern ohne eingebauten Server-Speicher pro Socket-Verbindung",
  "srv-client-server":
    "Client-Server trennt Rollen: Server bietet Dienst, Client konsumiert. Peer-to-peer ist symmetrischer. In Prüfungen geht es um Verantwortungsteilung und Skalierung. Frag: wo läuft die Geschäftslogik typischerweise zentral",

  "pm-scrum-rollen-po":
    "Product Owner maximiert Wert und priorisiert das Product Backlog — Scrum Master moderiert Prozess, Team liefert. Verwechsel nicht: wer entscheidet über Reihenfolge und Scope auf Product-Ebene",
  "pm-sprint-backlog-inhalt":
    "Sprint Backlog ist der Sprint-Schnitt plus konkreter Umsetzungsplan des Teams — nicht die ganze Roadmap. Es lebt im Sprint und wird vom Team gepflegt. Die MC testet oft den Unterschied zwischen Product Backlog und Sprint Backlog",
  "pm-definition-of-done":
    "Definition of Done ist die gemeinsame Qualitätsleiste — erst wenn DoD erfüllt ist, gilt Arbeit als fertig fürs Inkrement. Akzeptanzkriterien beschreiben die Story, DoD beschreibt Team-Standard. Ohne DoD driftet fertig zwischen Köpfen",
  "pm-daily-scrum-zweck":
    "Daily synchronisiert das Team kurz — Inspektion aufs Sprint Goal, dann Anpassung des Plans. Kein Management-Statusmarathon. Zu lange Dailies deuten auf falsche Themen oder fehlende Vorbereitung",
  "pm-kanban-pull-prinzip":
    "Kanban zieht Arbeit wenn Kapazität frei wird — WIP-Limits machen Engpässe sichtbar. Push ohne Limit erzeugt Halbfertiges. Die MC will oft den Unterschied zwischen Pull-Fluss und blindem Mehr-parallel",
  "lf10-boss":
    "Puffer schützt vor Verschiebung des Enddatums solange Verzug auf dem Nebenpfad kleiner bleibt als der freie Spielraum bis zum Merge. Kritischer Pfad entscheidet über den Endtermin — Nebenpfad-Verzug frisst zuerst Reserve",

  "sec-cia":
    "CIA trias: Vertraulichkeit, Integrität, Verfügbarkeit — jede Maßnahme lässt sich dort einordnen. Verschlüsselung schützt Vertraulichkeit, Checksummen Integrität, Redundanz Verfügbarkeit. Wenn eine Option „alles auf einmal“ verspricht, ist Skepsis gesund",
  "sec-321":
    "3-2-1 Backup: drei Kopien, zwei Medien, eine offsite — Recovery-Strategie statt nur „wir haben irgendwo was“. Es geht um Ausfallszenarien, nicht um einzelne USB-Sticks. Übersetze Story in: wie viele unabhängige Speicherorte habe ich wirklich",
  "sec-integritaet":
    "Integrität bedeutet: Daten sind unverfälscht und vollständig im Sinne der Policy — Hashing, Signaturen und Kontrollsummen helfen. Verfügbarkeit ist ein anderes Ziel. Wenn die Frage Manipulation vs. Lauschen stellt, ist Integrität vs. Vertraulichkeit der Dreh",
  "sec-phishing":
    "Phishing tarnt sich als vertrauenswürdige Kommunikation — technische und organisatorische Maßnahmen zusammen wirken. MFA erschwert Kontoübernahme, Schulung reduziert Klickrisiko. Eine URL optisch zu prüfen reicht oft nicht — strukturelle Absicherung braucht es trotzdem",
  "sec-mfa":
    "Multi-Faktor kombiniert Kategorien — Wissen, Besitz, Inherence. Zwei gleiche Kategorien (zwei Passwörter) ist schwächer als echter MFA. Die MC testet oft den Unterschied zwischen 2FA und zwei Schritten derselben Art",

  "pm-scrum-master":
    "Scrum Master schützt den Prozess und entfernt Hindernisse — nicht der Aufgabenverteiler des Teams. Product Owner priorisiert Wert, Entwicklerteam liefert Inkrement. Verwechsel Rollen nicht: Facilitation ≠ Entscheidung über Inhalt",
  "pm-daily":
    "Daily ist Synchronisation und Transparenz — kurz, fokussiert, nicht Status vor dem Chef. Ziel ist Koordination für die nächsten 24h. Zu lange Dailies deuten auf falsche Themen oder fehlende Vorbereitung",
  "pm-review-retro":
    "Review zeigt Stakeholdern das Inkrement, Retro verbessert die Zusammenarbeit — unterschiedliche Ziele, beide Events wichtig. Retro ist vertraulicher und prozessorientiert. Wenn die Frage nach „was liefern wir“ vs. „wie arbeiten wir“ fragt, ist das die Trennlinie",
  "pm-po-backlog":
    "Product Owner besitzt das Product Backlog und priorisiert — nicht das Team und nicht der Scrum Master allein. Klare Priorisierung reduziert Scope-Diskussionen im Sprint. Achte in Texten darauf, wer „was wann“ entscheidet",
  "pm-dod":
    "Definition of Done ist die gemeinsame Qualitätsleiste — erst wenn DoD erfüllt ist, gilt eine User Story als fertig. Ohne DoD driftet „fertig“ zwischen Köpfen. Die MC fragt oft nach Transparenz und messbaren Kriterien",
};

function buildFallback(title: string, problem: string): string {
  const clip = problem.length > 260 ? `${problem.slice(0, 257).trim()}…` : problem.trim();
  return [
    `Stell dir vor, dein Lehrer sitzt neben dir: Es geht um „${title}“ — bleib bei der Aufgabenstellung und übersetze sie in eigene Worte`,
    clip,
    "Prüfungsantworten testen oft genau eine Nuance: lies jede Option als Behauptung und suche die, die zur Story passt",
    "Wenn du unsicher bist, nimm ein Mini-Beispiel mit zwei oder drei Zeilen Daten — oft wird die richtige Idee dann sichtbar, ohne Formeln auswendig zu müssen",
  ].join(" ");
}

export function getMentorDeepDive(
  exerciseId: string,
  title: string,
  problem: string
): string {
  const fixed = MENTOR_BY_ID[exerciseId];
  if (fixed) return fixed;
  return buildFallback(title, problem);
}
