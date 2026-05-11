# Nexus Path — Technical Whitepaper

## 1. Core Vision

Nexus Path ist eine **produktionsnahe Progressive Web App (PWA)** für berufliche IHK-Vorbereitung, die **spielbare Tiefe** mit **nachweisbarer Lernwissenschaft** verbindet. Das Produkt adressiert drei Ebenen gleichzeitig:

- **Lernpsychologie**: Wiederholungsabstände nach Leitner und eine Ebbinghaus-inspirierte Retentionsschätzung machen Vergessen messbar und steuerbar
- **Systemarchitektur**: Klare Entkopplung von UI, Spielzustand und Security-relevanten Pfaden
- **Portfolio-Tauglichkeit**: AES-GCM-versiegelte Nachweise, Observer-lastige Metriken und dokumentierte Patterns demonstrieren professionelle Frontend- und Security-Kompetenz

Die Anwendung ist bewusst so gebaut, dass Prüfer:innen und Personalteams **das „Warum“** hinter den Features erkennen — nicht nur eine Demo-Oberfläche, sondern ein konsistentes technisches Narrativ.

## 2. Tech Stack

| Schicht | Technologie | Rolle |
|--------|-------------|--------|
| UI | React 19, Framer Motion | Deklarative Oberfläche, hochwertige Übergänge |
| State | Zustand | Globale Kampf- und Ökonomiezustände ohne Boilerplate |
| Build | Vite 7, TypeScript | Schnelle Builds, strikte Typen |
| Offline | Service Worker, Precache-Manifest | Installierbare PWA, definierte Asset-Graphen |
| Audio | Web Audio API | Reaktive Musiksynthese und Kampf-Feedback |
| Visual | CSS-Variablen, Post-Processing-Layer | Performancebewusste Effekte statt teurer Canvas-Flut |
| Tests | Vitest | Unit-Tests für mathematische und kryptographische Kerne |

**Epilog Weißgold**: Manifest- und Theme-Farben sind auf ein warmes Weißgold-Palette abgestimmt, damit der Homescreen-Start visuell zum narrativen „Epilog“-Auftritt passt.

## 3. Architecture Patterns

### Observer

Asynchrone und ereignisgetriebene Pfade (z. B. Web-Vitals, Audio-Engine-Reaktionen auf Store-Properties) folgen dem **Observer-Gedanken**: Subsysteme reagieren auf Zustandsänderungen, ohne den Kern synchron verkleben zu müssen. Im Exam-Modus macht ein **Live-Logic-Flow** die Datenpfad-Kette bei Kartenspielen kurz sichtbar — didaktisch für Reviews, ohne die Spiel-UX dauerhaft zu überfrachten.

### Strategy

Austauschbare Strategien tauchen dort auf, wo sich Verhalten zur Laufzeit unterscheiden muss: Presets, Boss-Anomalien, Rank-Audio-Profile und Verify-Routen für Zertifikate. Die **Strategy** bleibt über Registries und reine Funktionen greifbar statt über tiefe Vererbungshierarchien.

### Facade

Komplexe Teilbereiche (Versiegelung des Master-Dossiers, Cloud-Sync-Umschläge, Learning-Analytics-Reports) exponieren eine **Facade**: Aufrufer arbeiten mit wenigen, benannten Operationen (`seal`, `open`, `buildNeuralMentorReport`, …), während IV, AEAD-Tag und Serialisierung gekapselt bleiben.

## 4. Security Concept — AES-GCM-256

Das **Nexus Master Dossier** wird clientseitig mit **AES-GCM (256 Bit)** über einen gerätegebundenen Rohschlüssel versiegelt. Eigenschaften:

- **Authentisierte Verschlüsselung (AEAD)**: Manipulation am Ciphertext führt beim Öffnen zu einem Fehler — Integrität ist Teil des Konstrukts
- **Zufälliges IV (12 Byte)** pro Siegelvorgang
- **Kein Klartext-Persist** der Prüfungsnachweise im lokalen Umschlag — nur der versiegelte String und Hilfs-Metadaten nach Bedarf

Unit-Tests in `src/lib/security/__tests__/crypto.test.ts` verifizieren **Roundtrip-Gleichheit**, **Hash-Konsistenz des Klartext-JSON** nach Entschlüsselung und **Fehlschlag bei falschem Schlüssel**.

## 5. Pädagogische Psychologie — Spaced Repetition

Kernidee: **Verteiltes Üben** schlägt massiertes Pauken bei langfristiger Retention (Ebbinghaus, modern operationalisiert durch Boxen und Intervalle).

- **Leitner-Fächer** bündeln Schwierigkeit; falsche Antworten senken Box und Ease-Faktor, richtige Antworten strecken das nächste fällige Intervall
- **Geschätzte Retention** \(R(t) \approx e^{-t/\text{Stärke}}\) verbindet vergangene Zeit seit dem letzten Review mit Intervall und Ease-Faktor — sichtbar in Analytics und „Neural Mentor“-Coaching
- **Operante Verstärkung** im Kampfloop: korrektes Wissen wird mit unmittelbarem Feedback (Flow, Audio, FX) gekoppelt, ohne die inhaltliche Trennung von Prüfungsfragen und Spielmechanik aufzugeben

Damit wird der Mehrwert für Personaler und Ausbilder:innen **sofort lesbar** — es ist keine reine „Gamification“, sondern ein **messbares Wiederholungssystem** mit UI, das Motivation und Metrik nicht gegeneinander ausspielt.

## 6. Social Sharing und PWA-Metadaten

- **Open Graph / Twitter**: `index.html` liefert statische Basistags; der Build ersetzt Platzhalter für **`og:image`** und **`og:url`** mittels `VITE_PUBLIC_SITE_URL` (siehe `.env.example`)
- **Vorschaubild**: `public/og-nexus-share.svg` (1200×630, Weißgold) — für maximale Kompatibilität mit LinkedIn kann optional ein PNG derselben Szene gehostet werden
- **Client-Sync**: Nach dem Laden werden `document.title` und ausgewählte Meta-Tags aus **Architect-Persona** und **Nexus-Fragmenten** angereichert (`src/lib/social/syncOpenGraphMeta.ts`). Hinweis: Viele Crawler lesen nur das erste HTML; für garantiert dynamische Previews pro Nutzer wäre eine Edge-Rendering-Route nötig

## 7. Qualitätssicherung

```bash
npm install
npm run test    # Vitest — Leitner/Ebbinghaus + AES-GCM
npm run build
```

Die Suite `src/lib/math/__tests__/leitner.test.ts` absichert **monotonen Verfall**, **Skalierung mit Intervall und Ease** sowie **Leitner-Intervall-Wachstum** nach aufeinanderfolgenden korrekten Reviews.

## 8. Lizenz und Kontext

Projekt „Nexus Path“ / CodeSnap — **private** Portfolio- und Lernumgebung. Für Deployment: `VITE_PUBLIC_SITE_URL` setzen, Build ausführen, statische Assets und `sw.js` wie konfiguriert ausliefern.

## 9. Future Roadmap — KI und personalisiertes Feedback

Der Nexus ist heute bewusst **regelbasiert und erklärbar**: Leitner, Ebbinghaus-Heuristiken und der „Neural Mentor“ arbeiten auf **transparenten** Kennzahlen — wichtig für Prüfung, Nachweis und Vertrauen.

Als nächste Evolutionsstufe bieten sich **LLM-Schnittstellen** an, die diese Schicht nicht ersetzen, sondern **anreichern**:

- **Erklär-Coach**: Zu jeder falsch beantworteten MC-Option ein kurzer, kontextbezogener Hinweis (RAG über Curriculum-Snippets), ohne die Korrektheit der offiziellen Musterlösung zu verletzen
- **Adaptive Tonalität**: Sprachliche Anpassung an Lernstil und Zeitbudget — immer noch mit harten Guards (keine erfundenen Prüfungsfakten, Zitate nur aus verifizierten Quellen)
- **Session-Zusammenfassung**: Automatische „Briefings“ nach Kampf-Sessions, die Leitner-Box und Retention in natürlicher Sprache spiegeln — ideal für Reflexion vor der IHK
- **On-Device-First**: Priorität auf lokale oder EU-Hosting-Modelle; sensible Daten bleiben versiegelt, KI nur auf aggregierte oder explizit freigegebene Texte

Damit bleibt der Nexus **skalierbar**: gleiche Architektur (Facade, Tests, PWA), aber mit einer optionalen Intelligenzschicht, die echtes **personalisiertes Feedback** liefert — ohne die mathematische Integrität des Kernsystems aufzugeben.

---

## System Ready for Deployment

**Status: freigegeben.** CI (Vitest + Production-Build), Security-Health (LF-Integrität + AES-GCM-Selbsttest), PWA-Manifest und dokumentierte Architektur sind integriert. Der Produktions-Build meldet ein **INITIAL BUNDLE OK** innerhalb des konfigurierten Entry-Budgets — der Nexus ist für ein professionelles Deployment und die Abschlusspräsentation bereit.
