# Nexus Path / LernenSchule — Vollständiges Briefing für Gemini

**Zweck dieses Dokuments:** Du (Gemini) sollst damit **prüfungsnahe Lernaufgaben**, **Story-Texte**, **MC-Fragen** und **Curriculum-Erweiterungen** erzeugen, die **direkt** in die App passen — ohne die Spiel-Logik zu vermischen und im **AAA-EdTech-Stil** (High-End Futuristic Industrial, deutsch, IHK-nah).

**Repository:** `LernenSchule` (npm-Paket `lernenschule-nexus`)  
**Live (GitLab Pages):** https://ap1ap2-ff67af.gitlab.io  
**Zielgruppe:** Fachinformatiker **Anwendungsentwicklung (AE)** und **Systemintegration (FISI)** — Abschlussprüfung **AP1** (LF1–6) und **AP2** (LF7–12), KMK-Rahmenlehrplan.

---

## 1. Produktvision (was „AAA“ hier bedeutet)

| Ebene | Anforderung |
|--------|-------------|
| **Didaktik** | Jede Aufgabe: kurze Lektion → Beispiel → Übung → sofortiges Feedback; Leitner-Wiederholung; Prüfungsmodus ohne Coach-Hinweise |
| **Inhalt** | IHK-/KMK-nah, realistische Firmennamen, keine erfundenen Gesetzesparagraphen; Rechenaufgaben mit nachvollziehbaren Zahlen |
| **UI/UX** | Cinematic Shell, Framer Motion, Gold/Cyan/Violet, responsive, PWA; **keine Punkte am Satzende** in der UI |
| **Technik** | TypeScript strict, JSON-Content getrennt von React; `npm run verify` muss grün bleiben |
| **Story** | Optionaler Story-Modus (Star-Wars-Multiversum-Metaphern) vs. ruhiger EdTech-Modus (neutral, prüfungsnah) |

**Kern-Loop im Spiel:**  
- **Richtige Antwort** = Spieler greift an (Damage/Heal)  
- **Falsche Antwort** = Monster/Boss greift an  
- Lernen und Kampf sind gekoppelt, aber **Fragentexte leben in JSON**, nicht in der Kampf-Engine.

---

## 2. Tech-Stack (kurz)

- **Frontend:** React 19, TypeScript, Vite 7, Framer Motion  
- **State:** Zustand (`useGameStore`) — Economy, Dungeon, Lernfortschritt, Prüfungsmodus  
- **Tests:** Vitest (Leitner, Crypto, Curriculum-Totals)  
- **Deploy:** GitLab CI → `npm run verify` → statischer Build  
- **PWA:** Service Worker (Slim-Modus: leeres Precache-Manifest ok)  
- **Medien:** `public/assets/LF1GIF.mp4` … `LF12GIF.mp4`, Hintergrund-Video „Fractal Command“

---

## 3. Architektur — strikt trennen

```
┌─────────────────────────────────────────────────────────────┐
│  CONTENT (JSON, expandedCurriculum, examPath, Drill-Packs) │
│  → learningRegistry.ts baut LearningExercise[]             │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  GAME LOGIC (Zustand, CombatManager, Leitner, Timer)        │
│  → wählt Exercise-ID, wertet MC aus, speichert Fortschritt   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  UI (Hub, Map, LearningTerminal, NexusCinematicShell)        │
└─────────────────────────────────────────────────────────────┘
```

**Regel für Gemini:** Liefere **nur Content** (JSON-Struktur unten) oder **Textvorschläge** für `de.json` — keine React-Komponenten, außer explizit gewünscht.

---

## 4. Lernfelder (LF1–LF12) und Prüfungsteile

| LF | AP | Standard-Thema (Kurz) | Übungen (Stand) | Besonderes |
|----|-----|------------------------|-----------------|------------|
| LF1 | AP1 | Wirtschaft, Recht, WiSo | 71 | +30 IHK WiSo Sommer 2026 |
| LF2 | AP1 | IT-Grundlagen, Clients, Infrastruktur | 64 | +15 LF2-Prüfungsmissionen + 8 GA1 Sommer 2026 |
| LF3 | AP1 | Netzwerke, Protokolle | 40 | Netplan-Simulator |
| LF4 | AP1 | Server, Virtualisierung, Hardware | 40 | |
| LF5 | AP1 | SQL, Datenbanken | 38 | SQL-Workbench |
| LF6 | AP1 | Skripte, Automatisierung | 30 | |
| LF7 | AP2 | OOP, C#, Sicherheit | 25 | C#-Exam-Drills |
| LF8 | AP2 | Linux, Datenmodelle | 31 | |
| LF9 | AP2 | APIs, Dienste | 35 | |
| LF10 | AP2 | PM / Server (track-abhängig) | 32 | +8 GA2 Sommer 2026; FISI: Server/Netz |
| LF11 | AP2 | Sicherheit / Funktionalität (track) | 24 | |
| LF12 | AP2 | Agile PM / Kundenentwicklung (track) | 23 | |

**Training Tracks (Onboarding):**
- `ae` = Anwendungsentwicklung  
- `fisi` = Systemintegration  
- LF10–12 **Titel** weichen je Track ab (`src/lib/curriculum/trainingProfile.ts`)  
- **Bundesland** wird gespeichert (Default BW); Inhalte sind KMK-basiert (bundeseinheitlich)

---

## 5. Ordnerstruktur (Content-relevant)

```
src/lernfelder/
  lf01/content.json          # Hauptinhalt LF1 (beginnerPath)
  lf02/content.json
  lf02/examPath.json         # 15 extra Prüfungs-MC für LF2
  lf03/content.json … lf12/content.json
  lfXX/LfTerminal.tsx        # LF-spezifische Terminal-UI (optional)
  sommer2026/
    wisoExamPath.json        # 30 WiSo-Aufgaben (IHK Sommer 2026)
    ga1ExamPath.json         # 8 GA1-MC
    ga2ExamPath.json         # 8 GA2-MC

src/lib/learning/
  learningRegistry.ts        # Merge aller Quellen → CURRICULUM_BY_LF
  expandedCurriculum.ts      # Zusätzliche IHK-nahe Übungen (Code)
  lfDrillPacks.ts            # Drill-Packs je LF
  buildReferenceExercises.ts # Codex-Referenz-Aufgaben
  lfExerciseTotals.ts        # Declared counts (muss zu Registry passen!)
  edtechLfDisplay.ts         # Story vs. neutraler Text

src/lib/curriculum/
  examReadiness.ts           # AP1/AP2-Fortschritt, Mentor-Score
  sommer2026Exams.ts         # Meta WiSo/GA1/GA2, Timer, Queue
  trainingProfile.ts         # AE/FISI, Bundesland

src/data/
  nexusRegistry.ts           # Boss-Lore, LF-Keys, Assets
  locales/de.json, en.json     # UI-Strings

src/store/useGameStore.ts      # Globaler State, beginSommer2026Exam, Leitner
```

**Nach Content-Änderungen immer:**
1. `LF_EXERCISE_TOTAL` in `lfExerciseTotals.ts` anpassen  
2. `npm run verify` (typecheck + test + build)  
3. Optional: `npm run audit:curriculum`

---

## 6. JSON-Schema für neue Aufgaben (`beginnerPath`)

Jede Mission ist ein Objekt in `content.json` → `beginnerPath[]` **oder** separate `examPath.json`.

### Pflichtfelder

```json
{
  "id": "lf3-netz-subnetz-01",
  "topic": "Prüfung · LF3",
  "level": "beginner",
  "title": "Subnetz berechnen",
  "lessonCards": [
    { "title": "Merksatz", "body": "Bei /24 sind die ersten drei Oktette die Netzadresse" },
    { "title": "Schritt", "body": "Broadcast = letzte Adresse im Subnetz" }
  ],
  "example": {
    "label": "Mini-Beispiel",
    "body": "192.168.1.0/24 → Netz 192.168.1.0, Broadcast 192.168.1.255"
  },
  "practice": {
    "type": "mc",
    "coachLine": "rechne zuerst die maske dann die grenzen",
    "question": "Wie lautet die Broadcast-Adresse von 192.168.1.0/24?",
    "options": [
      { "text": "192.168.1.255", "correct": true },
      { "text": "192.168.1.0", "correct": false, "hint": "Das ist die Netzadresse" },
      { "text": "192.168.0.255", "correct": false, "hint": "Falsches Oktett" },
      { "text": "255.255.255.255", "correct": false, "hint": "Globale Broadcast-Adresse" }
    ],
    "solutionHint": "Optional: Kurzer Tipp nach falscher Antwort",
    "expected": "Nur bei sql/csharp/bash: Musterlösung als String",
    "brokenCode": "Nur bei Workbench: fehlerhafter Startcode"
  }
}
```

### `practice.type` — erlaubte Werte

| type | Verwendung |
|------|------------|
| `mc` | Standard Multiple Choice (4–5 Optionen, **genau eine** `correct: true`) |
| `sql` | SQL-Workbench + meist begleitende MC |
| `csharp` | C#-Code + MC |
| `bash` | Shell + MC |
| `javascript` | Selten |
| `markdown` / `plain-text` | Theorie |

### ID-Konventionen

- Format: `lf{N}-{thema}-{nr}` oder `ihk26-wiso-01`, `lf2-exam-anforderung`  
- **Global eindeutig** pro LF (Registry merged mehrere Quellen — Duplikate werden verworfen)  
- Keine Leerzeichen in IDs

### Lernstil-Vorbild: SQL Grundlagen (lxpert)

**Referenz:** [SQL Grundlagen — Fachinformatiker](https://lxpert-eo.github.io/sql-grundlagen/)  
**Vollständige Regeln:** `docs/LXPERT-LEARN-STYLE.md`

Jede Lern-Mission soll sich so anfühlen wie ein Kapitel dort:

1. **In einfachen Worten** — Kernaussage in einem Satz  
2. **Vergleich aus dem Alltag** — Aktenschrank, Excel, Brief, Werkstatt (je nach LF)  
3. **Merksatz** — zum Mitnehmen  
4. **Mini-Beispiel** — `example` vor der Frage  
5. **Eine Idee pro Mission** — erst SELECT, dann WHERE, nicht alles auf einmal  
6. **Leichte MC** mit **konkreten** `hint`s  

LF5 enthält das Muster (`lf5-sql-00-was-ist` … `lf5-start`). Andere Lernfelder: gleiche Karten-Titel, passender Alltags-Vergleich aus `LXPERT-LEARN-STYLE.md`.

### Lernen zuerst (Pflicht für Einsteiger)

Die App trennt automatisch **Lernpfad** und **Prüfungspfad** (`learnPathFilters.ts`):

| Erkennung | Bedeutung |
|-----------|-----------|
| `topic` beginnt mit `Prüfung ·` | Nur Prüfungsmodus |
| `topic` enthält `IHK` (z. B. `IHK WiSo 2026`) | Nur Prüfungsmodus |
| `id` beginnt mit `ihk26-` | Nur Prüfungsmodus |
| `learnPhase: "pruefung"` | Nur Prüfungsmodus |
| alles andere in `beginnerPath` | **Lernmodus** — Reihenfolge = Lernreihenfolge |

**Neue Grundlagen-Missionen** (für Nutzer ohne Vorwissen):

- `topic` z. B. `Netzwerk-Grundidee`, **nicht** `Prüfung ·`  
- `lessonCards`-Titel: `In einfachen Worten`, `Vergleich aus dem Alltag`, `Merksatz` (kein `Prüfungsfokus`)  
- Erste Frage: **eine** einfache Idee, nicht mehrere Konzepte auf einmal  
- `example` mit Alltagsbezug (`Mini-Beispiel`)  
- Schwere Prüfungsthemen → `examPath.json` oder `topic: "Prüfung · LF{N}"`

### Text-Stil (Content)

- **Deutsch**, korrekte Umlaute (Ä, Ö, Ü)  
- `coachLine`: kleingeschrieben, rhythmisch, **ohne Punkt am Ende** (UI-Regel)  
- `lessonCards.body`: kurze Sätze — bei Lernmissionen **einfache Sprache**, bei Prüfung eher prüfungsnah  
- `hint` bei falschen Optionen: **konkret**, nicht belehrend  
- Story-Modus: dürfen Star-Wars-/Multiversum-Namen nutzen (siehe LF1 `mission-kuat`)  
- EdTech-Modus: `edtechLfDisplay.ts` ersetzt Fantasy-Namen durch neutrale Formulierungen — für **neue** WiSo/Prüfungsaufgaben lieber **CBA-IT-Service GmbH** o. ä. reale IHK-Firmennamen aus Prüfungen

---

## 7. Wie JSON zur Laufzeit wird

`learningRegistry.ts` → `buildLearnAndExamPathsFromJson()`:

- **Lernmodus:** nur Missionen ohne Prüfungs-/IHK-Marker, sequentiell (`getPendingBeginnerExercise`)  
- **Prüfungsmodus:** `EXAM_PATH_EXERCISES_BY_LF` / `buildBlitzQueue(..., "exam")`  

`buildBeginnerPathFromJson()` (intern):

- Eine `correct: true` Option → `mcOptions` mit `isCorrect`  
- `problem` = `practice.question`  
- `solutionCode` = `practice.expected` oder Text der richtigen Option  
- `coachLine`, `lessonCards`, `example` werden durchgereicht  

**Internes Zielformat** (`LearningExercise`):

```typescript
{
  id: string;
  title: string;
  problem: string;
  solutionCode: string;
  lang: "sql" | "csharp" | "bash" | "markdown" | "plain-text" | "javascript";
  mcQuestion: string;
  mcOptions: { id: "a"|"b"|...; text: string; isCorrect: boolean; whyWrongHint?: string }[];
  lessonCards?: { title: string; body: string }[];
  example?: { label: string; body: string };
  coachLine?: string;
  solutionHint?: string;
  workbenchInitialDraft?: string;
}
```

---

## 8. Spiel- und Lernmodi (für passende Aufgaben-Typen)

| Modus | Trigger | Verhalten | Aufgaben-Empfehlung |
|--------|---------|-----------|---------------------|
| **Normal lernen** | Karte / LF wählen | Coach-Hinweise, Leitner | Mix aus lessonCards + MC |
| **Prüfung LF** | Hub „Prüfungssimulation“ | 20 Min Timer, kein Coach, 10 Zufallsfragen aus schwächstem LF | Schwierige MC, wenig Story |
| **Blitz** | Hub „Schnell üben“ | 10 Fragen, kein Exam-Strict | Wiederholung schwacher Themen |
| **IHK Sommer 2026** | `beginSommer2026Exam('wiso'|'ga1'|'ga2')` | WiSo 60 Min / GA 90 Min, feste Queue, kein Coach | Bereits in `sommer2026/*.json` |

---

## 9. IHK Abschlussprüfung Sommer 2026 (bereits integriert)

| Pack | Datei | LF | MC-Anzahl | Original-Prüfung |
|------|-------|-----|-----------|------------------|
| WiSo | `wisoExamPath.json` | LF1 | 30 | 30 Aufgaben, 60 Min, 100 Pkt |
| GA1 | `ga1ExamPath.json` | LF2 | 8 | 4 Aufgaben (Konzeption & Administration IT-Systeme) |
| GA2 | `ga2ExamPath.json` | LF10 | 8 | 4 Aufgaben (Analyse & Entwicklung Netzwerke) |

**Hinweis:** Original-PDFs sind **gescannt** (kein Textlayer). Schriftliche Rechen-, Zuordnungs- und Erläuterungsaufgaben wurden als **MC adaptiert**. Für Handschrift brauchen Lernende weiterhin die PDF-Originale.

**Gemini-Aufgabe Erweiterung:**  
- GA1/GA2: mehr Subtasks aus PDF (PSU, GRUB, Firewall, Wireshark, DHCP) als MC ergänzen  
- WiSo: Aufgaben 1–30 bereits vorhanden — Qualität prüfen, `hint` schärfen  
- Neue Prüfungstermine: neue Datei `sommer2027/...` analog

---

## 10. Story-Modus vs. EdTech-Modus

- Store: `learningStoryMode` (Default: **true**, persistiert)  
- **Story an:** Originaltexte mit Mission/Multiversum  
- **Story aus:** `sanitizeEdtechLearningText()` entfernt Fantasy, neutralisiert Titel  

**Für Gemini:**  
- Liefere **zwei Varianten** optional: `storyTitle` / `edtechTitle` — oder eine neutrale Basis + kurze `storyFlavor`-Zeile in `coachLine`  
- Prüfungs-Packs (WiSo, GA): **immer neutral** (IHK-Fallstudie)

---

## 11. UI / Design Language (für Texte und Szenarien)

- **Ästhetik:** High-End Futuristic Industrial — Gold (#d6b56f), Cyan, Violett, dunkle Panels, Monospace für Metadaten  
- **Keine Punkte am Ende** von UI-Strings (Hub, Buttons, Coach)  
- **Framer Motion:** Karten heben sich leicht (Hub, Readiness)  
- **Videos:** Je LF `LFxGIF.mp4` in Hub und Kurskarten  
- **Boss-Kampf:** Jedes LF hat Boss-Lore in `nexusRegistry.ts` (getrennt von Lernfragen)

---

## 12. Fortschritt & Analytics

- `learningCorrectByLf`: welche `exerciseId` mindestens einmal richtig  
- `learningLeitnerByExerciseId`: Spaced Repetition  
- `buildExamReadinessSnapshot()`: AP1/AP2-%, Mentor-Score, LF2-Prüfungsmissionen  
- **LF2 exam IDs:** aus `lf02/examPath.json` (`LF02_EXAM_MISSION_IDS`)

---

## 13. Was Gemini konkret liefern soll — Prompt-Bausteine

### A) Neue MC-Mission für LF{X}

```
Erstelle 5 neue beginnerPath-Einträge für LF3 (Netzwerke, AP1).
Schema wie in GEMINI-BRIEFING Abschnitt 6.
Themen: Subnetting /24 und /16, DHCP DORA, DNS, VLAN-Grundlagen.
Je 3 lessonCards, 1 example, MC mit 4 Optionen, genau eine correct, hints auf Deutsch.
IDs: lf3-gemini-01 … lf3-gemini-05.
coachLine kleingeschrieben ohne Satzpunkt.
Stil: IHK-Prüfung Fachinformatiker FISI, Firma "NetSolutions GmbH".
```

### B) Prüfungspack ergänzen

```
Erweitere ga2ExamPath.json um 6 MC zu Wireshark (ARP-Konflikt, DHCP ACK, DNS Port 53).
IDs: ihk26-ga2-09 … ihk26-ga2-14.
Anknüpfung: IHK-BookWorm GmbH, RZ Köln, 10.0.0.0/16.
```

### C) Story-Mission LF1

```
Mission mit Star-Wars-Metapher (Kuat-Werften) zum Thema GmbH-Haftung.
Gleiche didaktische Struktur wie lf1-mission-kuat in content.json.
Zusätzlich edtech-neutrale Titelvariante.
```

### D) SQL-Workbench LF5

```
beginnerPath-Eintrag type sql: fehlerhafte Abfrage in brokenCode,
expected: korrektes SELECT mit JOIN und WHERE,
MC-Frage zur WHERE-Clause, 4 Optionen.
```

---

## 14. Qualitäts-Checkliste (vor Übergabe an Entwickler)

- [ ] ID eindeutig, Format konsistent  
- [ ] Genau **eine** richtige MC-Option  
- [ ] Jede falsche Option hat `hint`  
- [ ] Fachlich korrekt (IHK-Niveau, keine erfundenen Paragraphen)  
- [ ] Rechenwege stimmen (z. B. KV-Beitrag: (14,6+2,4)/2 % von Brutto)  
- [ ] Deutsche Umlaute  
- [ ] `coachLine` ohne abschließenden Punkt  
- [ ] LF/AP passend zum Thema  
- [ ] Bei neuen Dateien: Anzahl in `lfExerciseTotals.ts` mitteilen  

---

## 15. Bekannte Lücken & Wunsch-Roadmap (für Priorisierung)

| Priorität | Thema | Beschreibung |
|-----------|--------|--------------|
| Hoch | Mehr GA1/GA2 Subtasks | Original hat Erläuterungs- und Rechenaufgaben — nur teilweise als MC |
| Hoch | DOCX/Lernfeld-Import | Weitere offizielle LF-Materialien in JSON gießen |
| Mittel | LLM-Erklär-Coach | Falsche Antwort → tieferer Hint (ohne Lösung verraten) |
| Mittel | Multi-Select / Zuordnung | WiSo hat „kreuze zwei an“ — aktuell nur Single-MC |
| Niedrig | Bundle-Größe | Entry ~760 KB (Budget-Warnung 520 KB) — Code-Splitting |
| ~~Erledigt~~ | Lernpfad lxpert + Trennung | `learnPathFilters.ts`: grundlage → vertiefung → prüfung |
| ~~Erledigt~~ | LF5 SQL Grundlagen-Kette | Kapitel wie sql-grundlagen bis UPDATE/Tipps |

---

## 16. Beispiel: minimale `content.json`-Wurzel

```json
{
  "lf": "LF3",
  "ap": "AP1",
  "title": "Netzwerke",
  "beginnerPath": [ /* Missionen hier */ ],
  "bossPhase": { "id": "lf3-boss" }
}
```

Separate Prüfungsdatei (wird in Registry gemerged):

```json
[
  {
    "id": "lf3-exam-01",
    "topic": "Prüfung · LF3",
    "level": "beginner",
    "title": "...",
    "lessonCards": [{ "title": "Kern", "body": "..." }],
    "practice": { "type": "mc", "question": "...", "options": [...] }
  }
]
```

---

## 17. Kurz-Prompt für den Nutzer (copy & paste zu Gemini)

> Du bist Content-Autor für **Nexus Path**, eine IHK-Lern-PWA für Fachinformatiker AE/FISI. Halte dich an `docs/GEMINI-BRIEFING-NEXUS-PATH.md` und `docs/LXPERT-LEARN-STYLE.md` (Stil wie https://lxpert-eo.github.io/sql-grundlagen/). Lern-Missionen: drei Karten (In einfachen Worten, Vergleich aus dem Alltag, Merksatz), Mini-Beispiel, eine leichte Frage, topic ohne `Prüfung ·`. Prüfung nur mit `Prüfung · LF{N}`. Nach Lieferung: neue Übungsanzahl je LF nennen.

---

## 18. Kontakt / Kontext für den menschlichen Nutzer

- **Commits/Push:** nur auf ausdrückliche Anfrage  
- **PDFs IHK:** lokal in Downloads, nicht im Repo; OCR optional (Windows-Pfad-Probleme mit easyocr)  
- **Verify:** `npm run verify` ist die Qualitätsschwelle  

*Stand Dokument: Mai 2026 — nach Integration IHK Sommer 2026 (WiSo/GA1/GA2).*
