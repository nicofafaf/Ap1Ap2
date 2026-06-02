/**
 * Curriculum-Daten — separater Chunk (lazy via curriculumAccess).
 */
import type { LearningField } from "../../data/nexusRegistry";
import type { LearningExercise, LearningMcOption } from "./learningExerciseTypes";
import type { LeitnerCardState } from "./leitnerEngine";
import {
  LF10_PROJEKT_AGIL,
  LF11_INFO_SICHERHEIT,
  LF12_AGILE_PM,
  LF1_WIRTSCHAFT,
  LF2_IT_GRUNDLAGEN,
  LF3_NETZWERK,
  LF4_NETZ_HARDWARE,
  LF8_DATENMODELL,
  LF9_DIENSTE_PROTOKOLLE,
} from "./expandedCurriculum";
import { REFERENCE_EXERCISES_BY_LF } from "./buildReferenceExercises";
import { LF_DRILL_PACKS } from "./lfDrillPacks";
import {
  isExamPathMission,
  isGrundlagePathMission,
  isVertiefungPathMission,
} from "./learnPathFilters";
import {
  BEGINNER_CONTENT_BY_LF,
  lf01Content,
  lf03Content,
  lf05Content,
  lf08Content,
  lf10Content,
  lf11Content,
} from "./lernfelderContentIndex";
import {
  buildBeginnerPathFromJson,
  buildLf5FromJson,
  buildLearnAndExamPathsFromJson,
  buildOptionalBossCodeExercise,
  buildOptionalBossMcExercise,
  assertMcIntegrity,
  type BeginnerContentShape,
  type Lf5ContentShape,
} from "./learningRegistry";

const lf02WithExam = BEGINNER_CONTENT_BY_LF.LF2;
const lf01WithSommer2026 = BEGINNER_CONTENT_BY_LF.LF1;
const lf10WithSommer2026 = BEGINNER_CONTENT_BY_LF.LF10;

const BEGINNER_CONTENT_REGISTRY = BEGINNER_CONTENT_BY_LF;

const LEARN_AND_EXAM_BY_LF = Object.fromEntries(
  Object.entries(BEGINNER_CONTENT_REGISTRY).map(([lf, content]) => [
    lf,
    buildLearnAndExamPathsFromJson(content as BeginnerContentShape),
  ])
) as Record<
  LearningField,
  { grundlage: LearningExercise[]; vertiefung: LearningExercise[]; learn: LearningExercise[]; exam: LearningExercise[] }
>;

/** Nur lxpert-Grundlagen — zuerst im Lernmodus */
export const GRUNDLAGE_EXERCISES_BY_LF: Record<LearningField, LearningExercise[]> = Object.fromEntries(
  Object.entries(LEARN_AND_EXAM_BY_LF).map(([lf, paths]) => [lf, paths.grundlage])
) as Record<LearningField, LearningExercise[]>;

/** Story / Multiversum / CCNA — nach den Grundlagen */
export const VERTIEFUNG_EXERCISES_BY_LF: Record<LearningField, LearningExercise[]> = Object.fromEntries(
  Object.entries(LEARN_AND_EXAM_BY_LF).map(([lf, paths]) => [lf, paths.vertiefung])
) as Record<LearningField, LearningExercise[]>;

/** Sequentieller Lernpfad — ohne Prüfung · / IHK-Sommer-Aufgaben */
export const BEGINNER_EXERCISES_BY_LF: Record<LearningField, LearningExercise[]> = Object.fromEntries(
  Object.entries(LEARN_AND_EXAM_BY_LF).map(([lf, paths]) => [lf, paths.learn])
) as Record<LearningField, LearningExercise[]>;

/** Nur Prüfungs- und IHK-Aufgaben — für Prüfungsmodus / Blitz-Prüfung */
export const EXAM_PATH_EXERCISES_BY_LF: Record<LearningField, LearningExercise[]> = Object.fromEntries(
  Object.entries(LEARN_AND_EXAM_BY_LF).map(([lf, paths]) => [lf, paths.exam])
) as Record<LearningField, LearningExercise[]>;

export const BEGINNER_EXERCISE_IDS_BY_LF: Record<LearningField, Set<string>> = Object.fromEntries(
  Object.entries(BEGINNER_EXERCISES_BY_LF).map(([lf, exercises]) => [
    lf,
    new Set(exercises.map((exercise) => exercise.id)),
  ])
) as Record<LearningField, Set<string>>;

export const EXAM_EXERCISE_IDS_BY_LF: Record<LearningField, Set<string>> = Object.fromEntries(
  Object.entries(EXAM_PATH_EXERCISES_BY_LF).map(([lf, exercises]) => [
    lf,
    new Set(exercises.map((exercise) => exercise.id)),
  ])
) as Record<LearningField, Set<string>>;

export function getBeginnerExerciseForLf(lf: LearningField): LearningExercise | null {
  return GRUNDLAGE_EXERCISES_BY_LF[lf][0] ?? BEGINNER_EXERCISES_BY_LF[lf][0] ?? null;
}

export function getNextLearnExerciseForLf(
  lf: LearningField,
  leitner?: Readonly<Record<string, LeitnerCardState>>,
  solvedExerciseIds?: readonly string[]
): LearningExercise | null {
  return getPendingBeginnerExercise(lf, leitner, { solvedExerciseIds });
}

function withBeginnerPath(lf: LearningField, advanced: LearningExercise[]): LearningExercise[] {
  return mergeFullCurriculum(lf, advanced);
}

/** Beginner + Advanced + Codex-Referenz + Drill-Packs — ohne doppelte IDs */
function mergeFullCurriculum(
  lf: LearningField,
  advanced: LearningExercise[],
  extra: LearningExercise[] = []
): LearningExercise[] {
  const seen = new Set<string>();
  const out: LearningExercise[] = [];
  const push = (ex: LearningExercise) => {
    if (seen.has(ex.id)) return;
    seen.add(ex.id);
    out.push(ex);
  };
  for (const ex of BEGINNER_EXERCISES_BY_LF[lf]) push(ex);
  for (const ex of advanced) push(ex);
  for (const ex of REFERENCE_EXERCISES_BY_LF[lf] ?? []) push(ex);
  for (const ex of LF_DRILL_PACKS[lf] ?? []) push(ex);
  for (const ex of extra) push(ex);
  for (const ex of EXAM_PATH_EXERCISES_BY_LF[lf] ?? []) push(ex);
  return out;
}

const LF2_MC_BOSS = buildOptionalBossMcExercise(lf02WithExam);
const LF3_MC_BOSS = buildOptionalBossMcExercise(lf03Content as BeginnerContentShape);
const LF1_BOSS = buildOptionalBossMcExercise(lf01Content as BeginnerContentShape);
const LF10_BOSS = buildOptionalBossMcExercise(lf10Content as BeginnerContentShape);

/** LF1 Finale · WiSo Corporate Espionage MC aus lf01/content.json bossPhase */
export { LF1_BOSS };
/** LF10 Finale · PM Netzplan Puffer MC aus lf10/content.json bossPhase */
export { LF10_BOSS };
export const LF11_BOSS = buildOptionalBossCodeExercise(lf11Content as BeginnerContentShape);

/** LF8 Finale · Bash System-Rettung aus lf08/content.json bossPhase */
export const LF8_BOSS = buildOptionalBossCodeExercise(lf08Content as BeginnerContentShape);

/** Terminal: Obsidian-Rot-Puls und Boss-Epic — LF1/LF5/LF10 MC-Boss, LF8 Bash-Boss, LF11 C#-Boss, optionale JSON-MC-Bosse (LF2/LF3) */
export function resolveTerminalBossMode(
  lf: LearningField,
  exerciseId: string | undefined
): { isBoss: boolean; epicLine: string | null } {
  if (!exerciseId) return { isBoss: false, epicLine: null };
  if (lf === "LF5") {
    const raw = lf05Content as Lf5ContentShape;
    const bossId = raw.bossPhase?.id?.trim() || "lf5-boss";
    if (exerciseId === bossId) {
      const e = raw.bossPhase?.epicCoach;
      return { isBoss: true, epicLine: e?.starwars ?? e?.anime ?? e?.gym ?? null };
    }
    return { isBoss: false, epicLine: null };
  }
  const raw = BEGINNER_CONTENT_BY_LF[lf] as BeginnerContentShape;
  const bossId = raw.bossPhase?.id?.trim();
  if (bossId && exerciseId === bossId) {
    const e = raw.bossPhase?.epicCoach;
    return { isBoss: true, epicLine: e?.starwars ?? e?.anime ?? e?.gym ?? null };
  }
  return { isBoss: false, epicLine: null };
}

export type EdtechExercisePickContext = {
  excludeExerciseId?: string | null;
  /** Zuletzt gelöste IDs in dieser Sitzung — keine direkte Wiederholung */
  recentExerciseIds?: readonly string[];
  /** Bereits richtig gelöste IDs je LF (persistiert) */
  solvedExerciseIds?: readonly string[];
};

/** Nächste Lern-Übung in JSON-Reihenfolge (ohne Prüfungs-/IHK-Missionen) */
function getPendingInLearnPath(
  path: LearningExercise[],
  leitner?: Readonly<Record<string, LeitnerCardState>>,
  ctx?: EdtechExercisePickContext | null
): LearningExercise | null {
  if (!path.length) return null;
  const solved = new Set(ctx?.solvedExerciseIds ?? []);
  const exclude = ctx?.excludeExerciseId;
  for (const ex of path) {
    if (exclude && ex.id === exclude) continue;
    if (solved.has(ex.id)) continue;
    const state = leitner?.[ex.id];
    if (!state || state.repetitions < 1) return ex;
  }
  return null;
}

function getPendingBeginnerExercise(
  lf: LearningField,
  leitner?: Readonly<Record<string, LeitnerCardState>>,
  ctx?: EdtechExercisePickContext | null
): LearningExercise | null {
  const grundlage = GRUNDLAGE_EXERCISES_BY_LF[lf] ?? [];
  const pendingGrund = getPendingInLearnPath(grundlage, leitner, ctx);
  if (pendingGrund) return pendingGrund;

  const vertiefung = VERTIEFUNG_EXERCISES_BY_LF[lf] ?? [];
  return getPendingInLearnPath(vertiefung, leitner, ctx);
}

function filterExercisePool<T extends { id: string }>(
  pool: T[],
  ctx?: EdtechExercisePickContext | null
): T[] {
  if (!pool.length) return pool;
  const exclude = ctx?.excludeExerciseId;
  const recent = new Set(ctx?.recentExerciseIds ?? []);
  let out = pool.filter((ex) => ex.id !== exclude && !recent.has(ex.id));
  if (out.length) return out;
  out = pool.filter((ex) => ex.id !== exclude);
  if (out.length) return out;
  if (recent.size) {
    out = pool.filter((ex) => !recent.has(ex.id));
    if (out.length) return out;
  }
  return pool;
}

const LF5_JSON_CORE = buildLf5FromJson(lf05Content as Lf5ContentShape);
const LF5_BOSS = LF5_JSON_CORE.find((ex) => /boss/i.test(ex.id));
const LF5_NON_BOSS = LF5_JSON_CORE.filter((ex) => !/boss/i.test(ex.id));
const SQL_EXAM_LF5 = mergeFullCurriculum("LF5", LF5_JSON_CORE);

/** 5 C#-Aufgaben — LF6: Variablen, Schleifen, Klasse (Prüfungssprache) */
export const CSHARP_EXAM_LF6: LearningExercise[] = [
  {
    id: "cs6-int-string",
    title: "int vs string",
    problem: "Deklariere einen Zähler als int und einen Namen als string — sinnvolle Initialisierung",
    solutionCode: `int count = 0;\nstring name = "Azubi";`,
    lang: "csharp",
    mcQuestion: "Warum int für count und string für name?",
    mcOptions: [
      {
        id: "a",
        text: "count ist Ganzzahl — name ist Text; Typ muss zum Wert passen",
        isCorrect: true,
      },
      {
        id: "b",
        text: "string speichert nur Zahlen ohne Anführungszeichen",
        isCorrect: false,
        whyWrongHint: "string braucht Anführungszeichen für Textliterale",
      },
      {
        id: "c",
        text: "int darf in C# keine 0 sein",
        isCorrect: false,
        whyWrongHint: "0 ist eine gültige int-Initialisierung",
      },
      {
        id: "d",
        text: "var verbietet Mischung aus int und string",
        isCorrect: false,
        whyWrongHint: "var leitet den Typ pro Variable ab — kein Konflikt zwischen zwei Variablen",
      },
    ],
  },
  {
    id: "cs6-for-sum",
    title: "for-Schleife — Summe",
    problem: "Summe der Zahlen 1 bis n (n≥1) mit klassischer for-Schleife in C#",
    solutionCode: `int SumToN(int n) {\n  int s = 0;\n  for (int i = 1; i <= n; i++) {\n    s += i;\n  }\n  return s;\n}`,
    lang: "csharp",
    mcQuestion: "Warum `i <= n` statt `< n`?",
    mcOptions: [
      {
        id: "a",
        text: "Die obere Grenze n soll inklusive sein",
        isCorrect: true,
      },
      {
        id: "b",
        text: "< n wäre semantisch gleich wenn i bei 0 startet",
        isCorrect: false,
        whyWrongHint: "Hier startet i bei 1 — i<=n ist die direkte Lesbarkeit 1…n",
      },
      {
        id: "c",
        text: "for darf in C# nur i < n verwenden",
        isCorrect: false,
        whyWrongHint: "Beide Vergleiche sind erlaubt — abhängig von Start/Inkrement",
      },
      {
        id: "d",
        text: "i++ ist in C# verboten",
        isCorrect: false,
        whyWrongHint: "i++ ist gültig; Stil kann i += 1 sein",
      },
    ],
  },
  {
    id: "cs6-while",
    title: "while — Herunterzählen",
    problem: "Zähle von `start` bis 1 herunter und sammle die Werte in einer List<int>",
    solutionCode: `List<int> Countdown(int start) {\n  var out = new List<int>();\n  int n = start;\n  while (n > 0) {\n    out.Add(n);\n    n -= 1;\n  }\n  return out;\n}`,
    lang: "csharp",
    mcQuestion: "Risiko bei while gegenüber for?",
    mcOptions: [
      {
        id: "a",
        text: "Endlosschleife wenn Abbruchbedingung/Update fehlt — hier n -= 1 sichert Terminierung",
        isCorrect: true,
      },
      {
        id: "b",
        text: "while ist in C# schneller als for",
        isCorrect: false,
        whyWrongHint: "Laufzeit hängt von Logik ab — didaktisch: Korrektheit und Abbruch zuerst",
      },
      {
        id: "c",
        text: "while darf keine List füllen",
        isCorrect: false,
        whyWrongHint: "Add in while ist üblich",
      },
      {
        id: "d",
        text: "n > 0 schließt 0 aus — daher falsch für countdown",
        isCorrect: false,
        whyWrongHint: "Aufgabe verlangt bis 1; 0 soll nicht in die Liste — Bedingung passt",
      },
    ],
  },
  {
    id: "cs6-tryparse",
    title: "int.TryParse",
    problem: "Prüfe, ob ein string eine gültige Ganzzahl ist — ohne Exception",
    solutionCode: `bool IsValidInt(string text) {\n  return int.TryParse(text, out _);\n}`,
    lang: "csharp",
    mcQuestion: "Warum TryParse statt int.Parse?",
    mcOptions: [
      {
        id: "a",
        text: "TryParse liefert false bei ungültiger Eingabe — Parse wirft Exception",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Parse akzeptiert nur negative Zahlen",
        isCorrect: false,
        whyWrongHint: "Parse akzeptiert gültige int-Literale allgemein",
      },
      {
        id: "c",
        text: "TryParse gibt immer true zurück",
        isCorrect: false,
        whyWrongHint: "Bei \"abc\" ist das Ergebnis false",
      },
      {
        id: "d",
        text: "out _ ist in C# ungültig",
        isCorrect: false,
        whyWrongHint: "Discard _ ist seit C# 7 gültig wenn der out-Wert ignoriert wird",
      },
    ],
  },
  {
    id: "cs6-class-basic",
    title: "Klasse — Property + Methode",
    problem: "Klasse `Counter` mit Startwert und Methode `Tick()` die intern erhöht",
    solutionCode: `public class Counter {\n  public int Value { get; private set; }\n  public Counter(int start = 0) => Value = start;\n  public int Tick() => ++Value;\n}`,
    lang: "csharp",
    mcQuestion: "Warum Property Value statt public int value Feld?",
    mcOptions: [
      {
        id: "a",
        text: "Property kapselt Zugriff — private set verhindert unkontrollierte Änderung von außen",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Felder sind in C# verboten",
        isCorrect: false,
        whyWrongHint: "Felder sind erlaubt — Properties sind aber üblicher für Kapselung",
      },
      {
        id: "c",
        text: "Tick muss static sein",
        isCorrect: false,
        whyWrongHint: "static gehört zur Klasse — hier brauchst du Instanzstate",
      },
      {
        id: "d",
        text: "Konstruktor darf keine Parameter haben",
        isCorrect: false,
        whyWrongHint: "Parameter im Konstruktor sind Standard",
      },
    ],
  },
];

/** 5 C#-Aufgaben — LF7 (SecurityCryptography): Typen, Schleifen, Klasse */
export const CSHARP_EXAM_LF7: LearningExercise[] = [
  {
    id: "cs-int-double",
    title: "int vs double",
    problem: "Zwei Variablen: Ganzzahl `count`, Gleitkomma `load` — sinnvolle Initialisierung",
    solutionCode: `int count = 0;\ndouble load = 0.0;`,
    lang: "csharp",
    mcQuestion: "Warum double für Lastwerte mit Nachkommastellen?",
    mcOptions: [
      {
        id: "a",
        text: "int schneidet Nachkommastellen ab — Messwerte brauchen oft double/decimal",
        isCorrect: true,
      },
      {
        id: "b",
        text: "int speichert intern Komma als Float",
        isCorrect: false,
        whyWrongHint: "int ist 32-bit-Ganzzahl — keine gebrochenen Anteile",
      },
      {
        id: "c",
        text: "double ist nur für Text",
        isCorrect: false,
        whyWrongHint: "double ist numerischer Typ — string wäre für Text",
      },
      {
        id: "d",
        text: "var verbietet Mischung aus int und double",
        isCorrect: false,
        whyWrongHint: "var leitet Typ ab — Problem wäre implizite Konvertierung, nicht var selbst",
      },
    ],
  },
  {
    id: "cs-for",
    title: "for-Schleife",
    problem: "Summe 1..n in C#",
    solutionCode: `int SumToN(int n) {\n  int s = 0;\n  for (int i = 1; i <= n; i++) {\n    s += i;\n  }\n  return s;\n}`,
    lang: "csharp",
    mcQuestion: "Was passiert bei n < 1?",
    mcOptions: [
      {
        id: "a",
        text: "Schleife läuft nicht — Rückgabe 0 (hier sinnvoll für leere Summe)",
        isCorrect: true,
      },
      {
        id: "b",
        text: "for wirft eine Exception wenn n < 1",
        isCorrect: false,
        whyWrongHint: "for prüft Bedingung — bei false kein Durchlauf, keine automatische Exception",
      },
      {
        id: "c",
        text: "i++ ist in C# verboten",
        isCorrect: false,
        whyWrongHint: "i++ ist gültig; Stil kann i += 1 bevorzugen",
      },
      {
        id: "d",
        text: "int overflow ist hier garantiert",
        isCorrect: false,
        whyWrongHint: "Overflow hängt von n ab — nicht automatisch bei kleinen n",
      },
    ],
  },
  {
    id: "cs-while",
    title: "while-Schleife",
    problem: "Halbiere `n` ganzzahlig, bis 0 erreicht ist — zähle Schritte",
    solutionCode: `int StepsUntilZero(int n) {\n  int steps = 0;\n  while (n > 0) {\n    n /= 2;\n    steps++;\n  }\n  return steps;\n}`,
    lang: "csharp",
    mcQuestion: "Warum n /= 2 in der Schleife?",
    mcOptions: [
      {
        id: "a",
        text: "Ganzzahlige Division halbiert n schrittweise Richtung 0",
        isCorrect: true,
      },
      {
        id: "b",
        text: "n /= 2 ist dasselbe wie Fließkomma-Halbierung ohne Rundung",
        isCorrect: false,
        whyWrongHint: "Integer-Division rundet ab — kein exakter Float-Halbwert",
      },
      {
        id: "c",
        text: "while stoppt nie bei positiven n",
        isCorrect: false,
        whyWrongHint: "n wird kleiner bis 0 — Terminierung bei korrekter Update-Logik",
      },
      {
        id: "d",
        text: "steps++ ist in C# veraltet",
        isCorrect: false,
        whyWrongHint: "steps++ ist üblich und gültig",
      },
    ],
  },
  {
    id: "cs-class-prop",
    title: "Klasse mit Property",
    problem: "Klasse `Session` mit read-only Property `Id` und setzbarem `ExpiresAt`",
    solutionCode: `public sealed class Session {\n  public Guid Id { get; }\n  public DateTime ExpiresAt { get; set; }\n  public Session(Guid id) => Id = id;\n}`,
    lang: "csharp",
    mcQuestion: "Warum `Id` nur get?",
    mcOptions: [
      {
        id: "a",
        text: "Identifier soll nach Erzeugung unveränderlich sein — nur Konstruktor setzt via init",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Guid darf in C# nicht als Property existieren",
        isCorrect: false,
        whyWrongHint: "Guid ist normaler Werttyp — Property ist erlaubt",
      },
      {
        id: "c",
        text: "get-only ohne init wäre hier kompilierbar ohne Konstruktor",
        isCorrect: false,
        whyWrongHint: "Id braucht Zuweisung im Konstruktor oder Feldinit — sonst Fehler",
      },
      {
        id: "d",
        text: "sealed verhindert Properties",
        isCorrect: false,
        whyWrongHint: "sealed blockt Vererbung — nicht Property-Syntax",
      },
    ],
  },
  {
    id: "cs-list-add",
    title: "List<string> sammeln",
    problem: "Erzeuge eine Liste, füge drei Einträge hinzu, gib Anzahl zurück",
    solutionCode: `int BuildAndCount() {\n  var items = new List<string>();\n  items.Add("read");\n  items.Add("eval");\n  items.Add("print");\n  return items.Count;\n}`,
    lang: "csharp",
    mcQuestion: "Warum List<string> statt string[]?",
    mcOptions: [
      {
        id: "a",
        text: "Liste wächst dynamisch; Array braucht feste Größe oder Neuzuweisung",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Array.Add existiert wie bei List",
        isCorrect: false,
        whyWrongHint: "Arrays haben feste Länge — kein Add wie List<T>",
      },
      {
        id: "c",
        text: "List erlaubt keine Duplikate",
        isCorrect: false,
        whyWrongHint: "List erlaubt Duplikate — HashSet wäre für Eindeutigkeit",
      },
      {
        id: "d",
        text: "items.Count ist die Kapazität, nicht Anzahl Elemente",
        isCorrect: false,
        whyWrongHint: "Count ist Elementanzahl; Capacity ist intern größer",
      },
    ],
  },
];

function curriculumWithOptionalBoss(
  lf: LearningField,
  advanced: LearningExercise[],
  boss: LearningExercise | null
): LearningExercise[] {
  return boss ? mergeFullCurriculum(lf, advanced, [boss]) : mergeFullCurriculum(lf, advanced);
}

export const CURRICULUM_BY_LF: Record<LearningField, LearningExercise[]> = {
  LF1: curriculumWithOptionalBoss("LF1", LF1_WIRTSCHAFT, LF1_BOSS),
  LF2: curriculumWithOptionalBoss("LF2", LF2_IT_GRUNDLAGEN, LF2_MC_BOSS),
  LF3: curriculumWithOptionalBoss("LF3", LF3_NETZWERK, LF3_MC_BOSS),
  LF4: mergeFullCurriculum("LF4", LF4_NETZ_HARDWARE),
  LF5: SQL_EXAM_LF5,
  LF6: mergeFullCurriculum("LF6", CSHARP_EXAM_LF6),
  LF7: mergeFullCurriculum("LF7", CSHARP_EXAM_LF7),
  LF8: curriculumWithOptionalBoss("LF8", LF8_DATENMODELL, LF8_BOSS),
  LF9: mergeFullCurriculum("LF9", LF9_DIENSTE_PROTOKOLLE),
  LF10: curriculumWithOptionalBoss("LF10", LF10_PROJEKT_AGIL, LF10_BOSS),
  LF11: curriculumWithOptionalBoss("LF11", LF11_INFO_SICHERHEIT, LF11_BOSS),
  LF12: mergeFullCurriculum("LF12", LF12_AGILE_PM),
};

for (const ex of Object.values(CURRICULUM_BY_LF).flat()) {
  assertMcIntegrity(ex);
}

for (const lf of Object.keys(CURRICULUM_BY_LF) as LearningField[]) {
  const minExercises = lf === "LF5" ? 1 : 5;
  if (CURRICULUM_BY_LF[lf].length < minExercises) {
    throw new Error(`Curriculum ${lf}: mindestens ${minExercises} Aufgaben erforderlich`);
  }
}
