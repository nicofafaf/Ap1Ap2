# Lernstil „SQL Grundlagen“ (lxpert) — Vorbild für alle Themen

**Referenz:** [SQL Grundlagen — Fachinformatiker](https://lxpert-eo.github.io/sql-grundlagen/) (lxpert-eo.github.io)

Dieses Material erklärt **von null** — ohne dass man schon Fachbegriffe kennen muss. Genau so sollen **alle** Lern-Missionen in Nexus Path aufgebaut sein (Netzwerk, Linux, WiSo, PM, …).

---

## Die 8 Bausteine jeder Lern-Mission

| # | Baustein | In `content.json` | Beispiel |
|---|----------|-------------------|----------|
| 1 | **Kernaussage** | `lessonCards[0]` Titel `In einfachen Worten` | „SQL ist die Sprache, mit der du der Datenbank sagst, was sie tun soll“ |
| 2 | **Alltags-Vergleich** | `lessonCards[1]` Titel `Vergleich aus dem Alltag` | Aktenschrank = DB, Bibliothekar = DBMS |
| 3 | **Merksatz** | `lessonCards[2]` Titel `Merksatz` | „SELECT = was sehen? FROM = woher?“ |
| 4 | **Mini-Beispiel** | `example` | Kurzer Satz + optional ein Code-/Schema-Schnipsel |
| 5 | **Ein Konzept** | `title` + `practice.question` | Nur **eine** neue Idee pro Mission |
| 6 | **Leichte Frage** | `practice` MC oder Workbench | Verständnis, nicht Auswendiglernen |
| 7 | **Konkreter Hint** | `options[].hint` | Sagt **warum** falsch — nicht „falsch“ |
| 8 | **Reihenfolge** | Position in `beginnerPath` | Grundlagen **vor** Vertiefung (Story) **vor** Prüfung |

`learnPhase`: `"grundlage"` | `"vertiefung"` | Prüfung via `Prüfung ·` / IHK

---

## Feste `lessonCards`-Titel (Lernmodus)

| Titel | Inhalt |
|-------|--------|
| `In einfachen Worten` | 1–2 Sätze, null Vorwissen |
| `Vergleich aus dem Alltag` | Excel, Aktenschrank, Post, Werkstatt, Team-Chat — je nach LF |
| `Merksatz` | Kurzformel zum Mitnehmen |
| `Erster Schritt` | Was der Lernende **jetzt** tun soll (oft: Beispiel lesen, noch nicht alles verstehen) |

**Nicht** im Lernmodus: `Definition`, `Prüfungsfokus`, `Anwendung` — die nur bei `topic: "Prüfung · …"`.

---

## Themen → Alltags-Vergleiche (für alle Lernfelder)

| Lernfeld | Vergleich nutzen |
|----------|------------------|
| LF1 WiSo | Vertrag = Regeln im Verein, Rechtsform = „Wer haftet?“ |
| LF2 IT | PC = Werkzeugkasten, Client = Arbeitsplatz des Nutzers |
| LF3 Netz | Brief mit Hausnummer (IP) und Abteilung (Port) |
| LF4 Server | Lager + Werkstatt, USV = Notstromaggregat |
| LF5 SQL | Excel-Tabelle, Aktenschrank/DBMS (wie lxpert) |
| LF6 Skripte | Kochrezept / Checkliste die der PC abarbeitet |
| LF7 OOP | Bauplan einer Klasse, Objekt = ein gebautes Exemplar |
| LF8 Linux | Ordnerstruktur = Schrank mit beschrifteten Fächern |
| LF9 APIs | Kellner: Bestellung (Request) → Küche → Essen (Response) |
| LF10 PM | Netzplan = Reihenfolge beim Umzug, Puffer = Zeitreserve |
| LF11 Security | Schloss, Ausweis, Alarmanlage |
| LF12 Agile | Sprint = eine Woche Umzugskartons packen mit klarem Ziel |

---

## Kapitel-Logik (wie lxpert SQL)

Ein Thema = **ein Kapitel** = **eine Mission** im Lernpfad.

**SQL (LF5) — empfohlene Reihenfolge:**

1. Was ist SQL? (DB, DBMS, DBS)
2. Tabellen verstehen (Spalte, Zeile, Primary Key)
3. SELECT
4. WHERE
5. ORDER BY / LIMIT
6. … später: JOIN, GROUP BY nur in **Prüfung ·** oder eigene Vertiefungs-Missionen

**Netzwerk (LF3) — analog:**

1. Gerät vs. Dienst (IP vs. Port)
2. MAC / Switch
3. …

---

## Sprache

- Du-Ansprache, kurze Sätze
- Fachbegriff **einmal** einführen, dann wiederverwenden
- Keine Punktuation am Ende von `coachLine` (UI-Regel)
- Keine Punkte am Ende von MC-`question` / `options` / `hint` wo die App das verlangt
- `example.label`: `Mini-Beispiel` oder Firmenname aus IHK-Fall

---

## Prüfung vs. Lernen

| | Lernmodus | Prüfungsmodus |
|---|-----------|---------------|
| `topic` | z. B. `SQL-Grundlagen`, `Netzwerk-Grundidee` | `Prüfung · LF5`, `IHK WiSo 2026` |
| Karten | In einfachen Worten / Vergleich / Merksatz | Definition / Anwendung / Prüfungsfokus |
| Schwierigkeit | Eine Idee, einfache Frage | IHK-nah, mehrere Konzepte erlaubt |

---

## Kurz-Prompt für KI-Autoren

> Schreibe eine `beginnerPath`-Mission im Stil von https://lxpert-eo.github.io/sql-grundlagen/ — drei Karten (In einfachen Worten, Vergleich aus dem Alltag, Merksatz), Mini-Beispiel, eine leichte MC-Frage mit konkreten hints. Kein `Prüfung ·` im topic. Ein Konzept pro Mission.

*Stand: Mai 2026 — an Nexus Path Lernpfad-Trennung gekoppelt.*
