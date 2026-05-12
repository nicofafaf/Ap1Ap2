/**
 * Prüfungsnahe Aufgaben + MC — Code in JetBrains Mono via Klasse `nx-code-block` / CSS-Variable
 */

import type { LearningField } from "../../data/nexusRegistry";
import type { LearningExercise, LearningMcOption } from "./learningExerciseTypes";
import {
  leitnerPickWeight,
  pickWeightedExercise,
  type LeitnerCardState,
} from "./leitnerEngine";
import {
  LF10_UI_BARREFREI,
  LF11_INFO_SICHERHEIT,
  LF12_AGILE_PM,
  LF1_WIRTSCHAFT,
  LF2_IT_GRUNDLAGEN,
  LF3_NETZWERK,
  LF4_NETZ_HARDWARE,
  LF8_DATENMODELL,
  LF9_DIENSTE_PROTOKOLLE,
} from "./expandedCurriculum";
import lf01Content from "../../lernfelder/lf01/content.json";
import lf02Content from "../../lernfelder/lf02/content.json";
import lf03Content from "../../lernfelder/lf03/content.json";
import lf04Content from "../../lernfelder/lf04/content.json";
import lf05Content from "../../lernfelder/lf05/content.json";
import lf06Content from "../../lernfelder/lf06/content.json";
import lf07Content from "../../lernfelder/lf07/content.json";
import lf08Content from "../../lernfelder/lf08/content.json";
import lf09Content from "../../lernfelder/lf09/content.json";
import lf10Content from "../../lernfelder/lf10/content.json";
import lf11Content from "../../lernfelder/lf11/content.json";
import lf12Content from "../../lernfelder/lf12/content.json";

export type { LearningExercise, LearningMcOption } from "./learningExerciseTypes";
export type { LeitnerCardState } from "./leitnerEngine";
export { applyLeitnerReview } from "./leitnerEngine";

/** 10 SQL-Aufgaben: JOIN, GROUP BY, Aggregates — für LF5 (DatabaseLogic) */
/** @deprecated LF5 läuft über src/lernfelder/lf05/content.json */
export const SQL_EXAM_LF5_DEPRECATED: LearningExercise[] = [
  {
    id: "sql-join-inner-orders",
    title: "INNER JOIN — Bestellungen mit Kunde",
    problem:
      "Tabellen `customers(id, name)` und `orders(id, customer_id, total)`. Liste nur Kunden, die mindestens eine Bestellung haben — mit Bestellbetrag je Zeile",
    solutionCode: `SELECT c.name, o.total\nFROM customers c\nINNER JOIN orders o ON c.id = o.customer_id;`,
    lang: "sql",
    mcQuestion: "Welches JOIN erfüllt die Aufgabe (nur Kunden mit Bestellung)?",
    mcOptions: [
      { id: "a", text: "INNER JOIN … ON c.id = o.customer_id", isCorrect: true },
      {
        id: "b",
        text: "LEFT JOIN … ON c.id = o.customer_id",
        isCorrect: false,
        whyWrongHint:
          "LEFT JOIN behält Kunden ohne Bestellung — die Aufgabe verlangt explizit nur Kunden mit Orders",
      },
      {
        id: "c",
        text: "CROSS JOIN ohne ON",
        isCorrect: false,
        whyWrongHint: "CROSS JOIN erzeugt alle Kombinationen — keine sinnvolle Bestell-Zuordnung",
      },
      {
        id: "d",
        text: "SELECT * FROM customers, orders",
        isCorrect: false,
        whyWrongHint: "Implizites Kreuzprodukt ohne WHERE/ON — falsche Kardinalität und Prüfungsfalle",
      },
    ],
  },
  {
    id: "sql-left-customer-count",
    title: "LEFT JOIN + COUNT — alle Kunden",
    problem:
      "`customers` und `orders`. Zeige jeden Kundennamen und wie viele Bestellungen er hat (0 wenn keine)",
    solutionCode: `SELECT c.name, COUNT(o.id) AS order_count\nFROM customers c\nLEFT JOIN orders o ON c.id = o.customer_id\nGROUP BY c.id, c.name;`,
    lang: "sql",
    mcQuestion: "Warum COUNT(o.id) statt COUNT(*)?",
    mcOptions: [
      {
        id: "a",
        text: "COUNT(o.id) zählt nur echte Zeilen aus orders; NULL-Zeilen vom LEFT zählen nicht",
        isCorrect: true,
      },
      {
        id: "b",
        text: "COUNT(*) wäre hier immer identisch",
        isCorrect: false,
        whyWrongHint:
          "COUNT(*) zählt die Gruppenzeile auch ohne Order — 0-Bestellungen würden als ≥1 erscheinen",
      },
      {
        id: "c",
        text: "COUNT(o.id) ist schneller als COUNT(*)",
        isCorrect: false,
        whyWrongHint: "Performance ist nicht der Prüfungskern — semantisch entscheidet NULL-Handling",
      },
      {
        id: "d",
        text: "Man muss SUM(o.id) verwenden",
        isCorrect: false,
        whyWrongHint: "SUM summiert IDs sinnlos — für Anzahl ist COUNT korrekt",
      },
    ],
  },
  {
    id: "sql-group-sum",
    title: "GROUP BY + SUM",
    problem: "`order_lines(order_id, category, amount)`. Umsatz je `category`",
    solutionCode: `SELECT category, SUM(amount) AS revenue\nFROM order_lines\nGROUP BY category;`,
    lang: "sql",
    mcQuestion: "Was passiert ohne GROUP BY bei category?",
    mcOptions: [
      {
        id: "a",
        text: "Fehler oder eine Zeile — je nach DB/Modus; Kategorie+SUM ohne GROUP ist unzulässig im Standard",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Es entsteht automatisch eine Zeile pro category",
        isCorrect: false,
        whyWrongHint: "Ohne GROUP BY gibt es keine Gruppierung — Aggregat+nicht-aggregierte Spalte verletzt SQL-Regeln",
      },
      {
        id: "c",
        text: "SUM wird ignoriert",
        isCorrect: false,
        whyWrongHint: "SUM wird ausgewertet — das Problem ist die fehlende Gruppenspalte",
      },
      {
        id: "d",
        text: "Man braucht stets HAVING",
        isCorrect: false,
        whyWrongHint: "HAVING filtert Gruppen nach Aggregation — hier reicht GROUP BY ohne Filter auf Aggregat",
      },
    ],
  },
  {
    id: "sql-group-avg-having",
    title: "GROUP BY + AVG + HAVING",
    problem:
      "`products(category, price)`. Nur Kategorien, deren durchschnittlicher Preis über 50 liegt",
    solutionCode: `SELECT category, AVG(price) AS avg_price\nFROM products\nGROUP BY category\nHAVING AVG(price) > 50;`,
    lang: "sql",
    mcQuestion: "Warum HAVING statt WHERE für AVG(price) > 50?",
    mcOptions: [
      {
        id: "a",
        text: "WHERE filtert Zeilen vor Aggregation; HAVING filtert das Aggregat-Ergebnis",
        isCorrect: true,
      },
      {
        id: "b",
        text: "WHERE und HAVING sind hier austauschbar",
        isCorrect: false,
        whyWrongHint: "WHERE kennt AVG(price) pro Gruppe nicht — Aggregatfilter gehört nach HAVING",
      },
      {
        id: "c",
        text: "HAVING ist nur für COUNT erlaubt",
        isCorrect: false,
        whyWrongHint: "HAVING gilt für alle Aggregatfunktionen inkl. AVG, SUM, MIN",
      },
      {
        id: "d",
        text: "Man muss eine Subquery statt HAVING nutzen",
        isCorrect: false,
        whyWrongHint: "Subquery geht, ist aber nicht Pflicht — HAVING ist die direkte Lösung",
      },
    ],
  },
  {
    id: "sql-inner-multi",
    title: "INNER JOIN — drei Partner",
    problem: "`users`, `roles`, `user_roles(user_id, role_id)`. Aktive User mit Rollennamen",
    solutionCode: `SELECT u.login, r.name AS role_name\nFROM users u\nINNER JOIN user_roles ur ON u.id = ur.user_id\nINNER JOIN roles r ON ur.role_id = r.id\nWHERE u.active = 1;`,
    lang: "sql",
    mcQuestion: "Warum zwei INNER JOINs?",
    mcOptions: [
      {
        id: "a",
        text: "N:M-Beziehung: Verknüpfungs- und Zieltabelle müssen beide angebunden werden",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Ein JOIN reicht, die DB erkennt N:M automatisch",
        isCorrect: false,
        whyWrongHint: "Ohne explizite Join-Pfade fehlen die FK-Beziehungen — Ergebnis ist falsch oder Kreuzprodukt",
      },
      {
        id: "c",
        text: "LEFT JOIN wäre hier immer besser",
        isCorrect: false,
        whyWrongHint: "LEFT würde User ohne Rolle zeigen — Aufgabe verlangt zugeordnete Rollen",
      },
      {
        id: "d",
        text: "Zweites JOIN muss CROSS JOIN sein",
        isCorrect: false,
        whyWrongHint: "CROSS JOIN würde Rollen unkontrolliert multiplizieren",
      },
    ],
  },
  {
    id: "sql-left-anti",
    title: "LEFT JOIN — Kunden ohne Bestellung",
    problem: "Finde Kunden, die noch nie bestellt haben",
    solutionCode: `SELECT c.name\nFROM customers c\nLEFT JOIN orders o ON c.id = o.customer_id\nWHERE o.id IS NULL;`,
    lang: "sql",
    mcQuestion: "Warum `WHERE o.id IS NULL` nach LEFT JOIN?",
    mcOptions: [
      {
        id: "a",
        text: "LEFT erhält Kunden ohne Order; dort sind Spalten aus orders NULL — IS NULL filtert diese Fälle",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Weil INNER JOIN keine NULLs liefert",
        isCorrect: false,
        whyWrongHint: "Richtig, aber die Frage zielt auf die Rolle von IS NULL nach LEFT — Antwort A erklärt das Muster",
      },
      {
        id: "c",
        text: "Weil COUNT(o.id) = 0 in WHERE reicht",
        isCorrect: false,
        whyWrongHint: "COUNT in WHERE ohne GROUP BY ist hier nicht das übliche Anti-Join-Muster",
      },
      {
        id: "d",
        text: "Man sollte `WHERE c.id NOT IN (SELECT customer_id FROM orders)` immer vermeiden — geht nie",
        isCorrect: false,
        whyWrongHint: "NOT IN kann NULL-Fallen haben; LEFT/IS NULL ist ein Standard-Pattern, nicht „nie NOT IN“",
      },
    ],
  },
  {
    id: "sql-group-two-aggregates",
    title: "Mehrere Aggregate pro Gruppe",
    problem: "`sales(region, amount)`. Pro Region: Summe und Durchschnitt",
    solutionCode: `SELECT region,\n       SUM(amount) AS total,\n       AVG(amount) AS avg_amount\nFROM sales\nGROUP BY region;`,
    lang: "sql",
    mcQuestion: "Darf `region` in SELECT ohne Aggregat stehen?",
    mcOptions: [
      {
        id: "a",
        text: "Ja, wenn region in GROUP BY steht",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Nein, jede SELECT-Spalte braucht ein Aggregat",
        isCorrect: false,
        whyWrongHint: "Gruppenspalten dürfen nackt im SELECT stehen — nur Nicht-Gruppenspalten brauchen Aggregat",
      },
      {
        id: "c",
        text: "Nur mit DISTINCT region",
        isCorrect: false,
        whyWrongHint: "DISTINCT ersetzt nicht GROUP BY für SUM/AVG pro Region",
      },
      {
        id: "d",
        text: "SUM und AVG dürfen nicht gemeinsam vorkommen",
        isCorrect: false,
        whyWrongHint: "Mehrere Aggregatfunktionen pro GROUP BY sind üblich und erlaubt",
      },
    ],
  },
  {
    id: "sql-join-aggregate-sub",
    title: "JOIN + gefilterter Durchschnitt",
    problem:
      "`employees(dept_id, salary)`, `departments(id, name)`. Abteilungen, deren Ø-Gehalt über dem Gesamt-Ø liegt",
    solutionCode: `SELECT d.name, AVG(e.salary) AS dept_avg\nFROM departments d\nINNER JOIN employees e ON d.id = e.dept_id\nGROUP BY d.id, d.name\nHAVING AVG(e.salary) > (SELECT AVG(salary) FROM employees);`,
    lang: "sql",
    mcQuestion: "Wozu die Subquery im HAVING?",
    mcOptions: [
      {
        id: "a",
        text: "Vergleich des Abteilungs-Ø mit dem globalen Ø aller Mitarbeitenden",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Um Duplikate zu entfernen",
        isCorrect: false,
        whyWrongHint: "DISTINCT/Keys entfernen Duplikate — hier geht es um den globalen Durchschnitt als Schwellwert",
      },
      {
        id: "c",
        text: "Subquery ersetzt GROUP BY",
        isCorrect: false,
        whyWrongHint: "GROUP BY bleibt für dept_avg; Subquery liefert nur Skalarvergleich",
      },
      {
        id: "d",
        text: "Ohne Subquery reicht AVG(salary) in WHERE",
        isCorrect: false,
        whyWrongHint: "Gesamt-Ø ist ein Aggregat über alle Zeilen — WHERE kann das nicht direkt mit Gruppen-Ø vergleichen",
      },
    ],
  },
  {
    id: "sql-inner-left-mix",
    title: "INNER + LEFT Kombination",
    problem:
      "`projects(id, name)`, `tasks(project_id, done)`. Pro Projekt: Name und Anzahl erledigter Tasks (done=1), Projekte ohne Tasks sollen 0 zeigen",
    solutionCode: `SELECT p.name,\n       SUM(CASE WHEN t.done = 1 THEN 1 ELSE 0 END) AS done_count\nFROM projects p\nLEFT JOIN tasks t ON p.id = t.project_id\nGROUP BY p.id, p.name;`,
    lang: "sql",
    mcQuestion: "Warum LEFT JOIN auf tasks?",
    mcOptions: [
      {
        id: "a",
        text: "Projekte ohne Tasks bleiben erhalten; COUNT aggregiert dann 0",
        isCorrect: true,
      },
      {
        id: "b",
        text: "INNER JOIN zeigt auch Projekte ohne Tasks",
        isCorrect: false,
        whyWrongHint: "INNER JOIN verwirft Projekte ohne passende Task-Zeile",
      },
      {
        id: "c",
        text: "LEFT JOIN verdoppelt Projektzeilen immer",
        isCorrect: false,
        whyWrongHint: "Mehrfachzeilen kommen von mehreren Tasks — GROUP BY fasst sie zusammen",
      },
      {
        id: "d",
        text: "SUM(CASE…) ist dasselbe wie COUNT(*) ohne JOIN",
        isCorrect: false,
        whyWrongHint: "Ohne JOIN fehlt die Projekt-Gruppierung — CASE zählt nur innerhalb der Task-Zeilen pro Projekt",
      },
    ],
  },
  {
    id: "sql-sum-avg-train",
    title: "SUM + AVG in einer Abfrage",
    problem: "`invoices(customer_id, amount)`. Pro Kunde: Gesamtsumme und durchschnittlicher Rechnungsbetrag",
    solutionCode: `SELECT customer_id,\n       SUM(amount) AS total,\n       AVG(amount) AS avg_invoice\nFROM invoices\nGROUP BY customer_id;`,
    lang: "sql",
    mcQuestion: "Welche Aussage zu AVG(amount) pro Kunde ist richtig?",
    mcOptions: [
      {
        id: "a",
        text: "AVG bildet den Mittelwert nur über die Rechnungen dieses Kunden in der Gruppe",
        isCorrect: true,
      },
      {
        id: "b",
        text: "AVG ist identisch mit SUM wenn GROUP BY customer_id fehlt",
        isCorrect: false,
        whyWrongHint: "Ohne GROUP BY gibt es eine Gesamtgruppe — Semantik ändert sich, nicht „identisch pro Kunde“",
      },
      {
        id: "c",
        text: "SUM und AVG dürfen nicht in einer Query stehen",
        isCorrect: false,
        whyWrongHint: "Beide Aggregatfunktionen über dieselbe Gruppe sind üblich",
      },
      {
        id: "d",
        text: "customer_id darf nicht in GROUP BY",
        isCorrect: false,
        whyWrongHint: "customer_id ist die Gruppenspalte — muss in GROUP BY stehen",
      },
    ],
  },
];

type Lf5WorkbenchMilestone = {
  id: string;
  type: "workbench";
  task: string;
  context: string;
  expected_query: string;
  hint: string;
};

type Lf5McMilestone = {
  id: string;
  type: "mc";
  question: string;
  options: string[];
  answer: number;
};

type BeginnerPathOption = {
  text: string;
  correct?: boolean;
  hint?: string;
};

type BeginnerPathEntry = {
  id: string;
  topic: string;
  level: "beginner";
  title: string;
  lessonCards: Array<{
    title: string;
    body: string;
  }>;
  example?: {
    label: string;
    body: string;
  };
  practice: {
    type: "mc" | "sql" | "csharp" | "javascript" | "markdown" | "plain-text";
    question: string;
    expected?: string;
    options: BeginnerPathOption[];
  };
};

type Lf5ContentShape = {
  lf: "LF5" | 5;
  title: string;
  beginnerPath?: BeginnerPathEntry[];
  milestones: Array<Lf5WorkbenchMilestone | Lf5McMilestone>;
};

type BeginnerContentShape = {
  lf: LearningField | number | string;
  title: string;
  beginnerPath?: BeginnerPathEntry[];
};

function normalizeLearningField(rawLf: BeginnerContentShape["lf"]): LearningField | null {
  if (typeof rawLf === "number") {
    return rawLf >= 1 && rawLf <= 12 ? (`LF${rawLf}` as LearningField) : null;
  }
  const normalized = rawLf.toString().toUpperCase();
  return /^LF(?:[1-9]|1[0-2])$/.test(normalized) ? (normalized as LearningField) : null;
}

function practiceLang(type: BeginnerPathEntry["practice"]["type"]): LearningExercise["lang"] {
  return type === "mc" ? "markdown" : type;
}

function buildBeginnerPathFromJson(raw: BeginnerContentShape): LearningExercise[] {
  const lf = normalizeLearningField(raw.lf);
  if (!lf || !raw.beginnerPath?.length) return [];

  return raw.beginnerPath.map((path, pathIdx) => {
    const options = path.practice.options.length
      ? path.practice.options
      : [{ text: "Ich habe den ersten Schritt verstanden", correct: true }];
    const correctIdx = Math.max(0, options.findIndex((option) => option.correct));
    const normalizedCorrectIdx = correctIdx === -1 ? 0 : correctIdx;
    const optIds = ["a", "b", "c", "d", "e", "f"];
    const mcOptions: LearningMcOption[] = options.map((option, idx) => ({
      id: optIds[idx] ?? `o${idx + 1}`,
      text: option.text,
      isCorrect: idx === normalizedCorrectIdx,
      whyWrongHint:
        idx === normalizedCorrectIdx
          ? undefined
          : option.hint || "Schau noch einmal auf die Action-Cards über der Übung",
    }));
    const correctText = options[normalizedCorrectIdx]?.text ?? options[0]?.text ?? "";
    const solutionCode = path.practice.expected ?? correctText;

    return {
      id: path.id || `${lf.toLowerCase()}-start-${pathIdx + 1}`,
      title: path.title || `${raw.title} Einstieg`,
      problem: path.practice.question,
      solutionCode,
      lang: practiceLang(path.practice.type),
      mcQuestion: path.practice.question,
      mcOptions,
      lessonCards: path.lessonCards,
      example: path.example,
      solutionHint:
        path.practice.type === "sql" || path.practice.type === "csharp"
          ? "Nutze zuerst das Mini-Beispiel. Es ist erlaubt, die Struktur zu übernehmen und nur den Kern zu verstehen"
          : path.example?.body || `Starte ruhig mit der ersten ${lf} Action-Card`,
    } satisfies LearningExercise;
  });
}

function buildLf5FromJson(raw: Lf5ContentShape): LearningExercise[] {
  const workbench = raw.milestones.find((m): m is Lf5WorkbenchMilestone => m.type === "workbench");
  const mc = raw.milestones.find((m): m is Lf5McMilestone => m.type === "mc");
  if (!workbench || !mc || mc.options.length < 2) return SQL_EXAM_LF5_DEPRECATED;

  const normalizedAnswer = Number.isFinite(mc.answer) ? Math.max(0, Math.floor(mc.answer)) : 0;
  const optIds = ["a", "b", "c", "d", "e", "f"];
  const mcOptions: LearningMcOption[] = mc.options.map((text, idx) => ({
    id: optIds[idx] ?? `o${idx + 1}`,
    text,
    isCorrect: idx === normalizedAnswer,
    whyWrongHint:
      idx === normalizedAnswer ? undefined : workbench.hint || "Prüfe Join Semantik und Ergebnisumfang",
  }));

  return [
    {
      id: workbench.id,
      title: "Daten filtern ohne Vorwissen",
      problem: `${workbench.task}\n\n${workbench.context}`,
      solutionCode: workbench.expected_query,
      lang: "sql",
      mcQuestion: mc.question,
      mcOptions,
      solutionHint:
        "Du musst dir SQL noch nicht merken. Lies zuerst: FROM sagt aus welcher Tabelle, WHERE ist der Filter",
    },
  ];
}

const BEGINNER_CONTENT_BY_LF: Record<LearningField, BeginnerContentShape> = {
  LF1: lf01Content as BeginnerContentShape,
  LF2: lf02Content as BeginnerContentShape,
  LF3: lf03Content as BeginnerContentShape,
  LF4: lf04Content as BeginnerContentShape,
  LF5: lf05Content as BeginnerContentShape,
  LF6: lf06Content as BeginnerContentShape,
  LF7: lf07Content as BeginnerContentShape,
  LF8: lf08Content as BeginnerContentShape,
  LF9: lf09Content as BeginnerContentShape,
  LF10: lf10Content as BeginnerContentShape,
  LF11: lf11Content as BeginnerContentShape,
  LF12: lf12Content as BeginnerContentShape,
};

const BEGINNER_EXERCISES_BY_LF: Record<LearningField, LearningExercise[]> = Object.fromEntries(
  Object.entries(BEGINNER_CONTENT_BY_LF).map(([lf, content]) => [
    lf,
    buildBeginnerPathFromJson(content),
  ])
) as Record<LearningField, LearningExercise[]>;

export const BEGINNER_EXERCISE_IDS_BY_LF: Record<LearningField, Set<string>> = Object.fromEntries(
  Object.entries(BEGINNER_EXERCISES_BY_LF).map(([lf, exercises]) => [
    lf,
    new Set(exercises.map((exercise) => exercise.id)),
  ])
) as Record<LearningField, Set<string>>;

export function getBeginnerExerciseForLf(lf: LearningField): LearningExercise | null {
  return BEGINNER_EXERCISES_BY_LF[lf][0] ?? null;
}

function withBeginnerPath(lf: LearningField, advanced: LearningExercise[]): LearningExercise[] {
  return [...BEGINNER_EXERCISES_BY_LF[lf], ...advanced];
}

function getPendingBeginnerExercise(
  lf: LearningField,
  leitner?: Readonly<Record<string, LeitnerCardState>>
): LearningExercise | null {
  const beginner = BEGINNER_EXERCISES_BY_LF[lf][0];
  if (!beginner) return null;
  const state = leitner?.[beginner.id];
  return !state || state.repetitions < 1 ? beginner : null;
}

const SQL_EXAM_LF5 = withBeginnerPath("LF5", buildLf5FromJson(lf05Content as Lf5ContentShape));

/** 5 JS-Aufgaben — LF6 (HardwareNetworking): Variablen, Schleifen, Klasse */
export const JAVASCRIPT_EXAM_LF6: LearningExercise[] = [
  {
    id: "js-let-const",
    title: "let vs const",
    problem: "Deklariere einen Zähler, der später erhöht wird, und eine feste Maximalgrenze",
    solutionCode: `let count = 0;\nconst max = 100;\ncount += 1;`,
    lang: "javascript",
    mcQuestion: "Warum `let` für count und `const` für max?",
    mcOptions: [
      {
        id: "a",
        text: "count wird neu zugewiesen → let; max bleibt gleiche Bindung → const",
        isCorrect: true,
      },
      {
        id: "b",
        text: "const erlaubt doch += wenn der Wert Zahl ist",
        isCorrect: false,
        whyWrongHint: "const verbietet Re-Binding; count += 1 ist Reassignment — const auf count wäre Syntaxfehler",
      },
      {
        id: "c",
        text: "var ist heute identisch mit let",
        isCorrect: false,
        whyWrongHint: "var hat Function-Scope und Hoisting — nicht identisch mit block-scoped let",
      },
      {
        id: "d",
        text: "let ist nur für Schleifen erlaubt",
        isCorrect: false,
        whyWrongHint: "let ist allgemein für veränderliche Bindungen in Blöcken nutzbar",
      },
    ],
  },
  {
    id: "js-for-sum",
    title: "for-Schleife — Summe",
    problem: "Summe der Zahlen 1 bis n (n≥1) mit klassischer for-Schleife",
    solutionCode: `function sumToN(n) {\n  let s = 0;\n  for (let i = 1; i <= n; i += 1) {\n    s += i;\n  }\n  return s;\n}`,
    lang: "javascript",
    mcQuestion: "Warum `i <= n` statt `< n`?",
    mcOptions: [
      {
        id: "a",
        text: "Die obere Grenze n soll inklusive sein",
        isCorrect: true,
      },
      {
        id: "b",
        text: "< n wäre semantisch gleich wenn i bei 0 startet und n+1 nutzt",
        isCorrect: false,
        whyWrongHint: "Andere Startwerte ändern die Formel — hier ist i<=n die direkte Lesbarkeit 1…n",
      },
      {
        id: "c",
        text: "for darf nur i < n verwenden",
        isCorrect: false,
        whyWrongHint: "Beide Vergleiche sind erlaubt — abhängig von Start/Inkrement",
      },
      {
        id: "d",
        text: "i++ und i += 1 sind in JS unterschiedlich schnell",
        isCorrect: false,
        whyWrongHint: "Praktisch gleichwertig; Stilfrage, nicht Prüfungskern",
      },
    ],
  },
  {
    id: "js-while",
    title: "while — Herunterzählen",
    problem: "Zähle von `start` bis 1 herunter und sammle die Werte in einem Array",
    solutionCode: `function countdown(start) {\n  const out = [];\n  let n = start;\n  while (n > 0) {\n    out.push(n);\n    n -= 1;\n  }\n  return out;\n}`,
    lang: "javascript",
    mcQuestion: "Risiko bei while gegenüber for?",
    mcOptions: [
      {
        id: "a",
        text: "Endlosschleife wenn Abbruchbedingung/Update fehlt — hier n -= 1 sichert Terminierung",
        isCorrect: true,
      },
      {
        id: "b",
        text: "while ist schneller als for",
        isCorrect: false,
        whyWrongHint: "Laufzeit hängt von Logik ab — didaktisch: Korrektheit und Abbruch zuerst",
      },
      {
        id: "c",
        text: "while darf keine Arrays füllen",
        isCorrect: false,
        whyWrongHint: "push in while ist üblich",
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
    id: "js-typeof",
    title: "Typen — typeof",
    problem: "Prüfe, ob ein Wert eine endliche Zahl ist (ohne Number.isNaN allein)",
    solutionCode: `function isFiniteNumber(x) {\n  return typeof x === "number" && Number.isFinite(x);\n}`,
    lang: "javascript",
    mcQuestion: "Warum reicht typeof x === 'number' nicht?",
    mcOptions: [
      {
        id: "a",
        text: "typeof erkennt NaN und Infinity trotzdem als number",
        isCorrect: true,
      },
      {
        id: "b",
        text: "typeof liefert bei Zahlen immer 'integer'",
        isCorrect: false,
        whyWrongHint: "JS hat nur 'number' — kein separates 'integer' bei typeof",
      },
      {
        id: "c",
        text: "NaN ist vom Typ 'NaN'",
        isCorrect: false,
        whyWrongHint: "typeof NaN ist 'number' — daher Zusatzcheck nötig",
      },
      {
        id: "d",
        text: "Number.isFinite schließt Strings mit aus — deshalb falsch",
        isCorrect: false,
        whyWrongHint: "isFinite prüft Zahlen; Strings würden vorher coerced — hier reicht die Kombination für reine Zahl",
      },
    ],
  },
  {
    id: "js-class-basic",
    title: "Klasse — Konstruktor + Methode",
    problem: "Klasse `Counter` mit startwert und Methode `tick()` die intern erhöht",
    solutionCode: `class Counter {\n  constructor(start = 0) {\n    this.value = start;\n  }\n  tick() {\n    this.value += 1;\n    return this.value;\n  }\n}`,
    lang: "javascript",
    mcQuestion: "Warum `this.value` in Methoden?",
    mcOptions: [
      {
        id: "a",
        text: "Instanzfelder hängen am Objekt — this verweist auf die Instanz",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Ohne this sind Felder automatisch global",
        isCorrect: false,
        whyWrongHint: "Strikter Modus/let verhindert Globals — this ist das definierte Instanz-Pattern",
      },
      {
        id: "c",
        text: "constructor darf keine Parameter haben",
        isCorrect: false,
        whyWrongHint: "Parameter im constructor sind Standard",
      },
      {
        id: "d",
        text: "tick muss static sein",
        isCorrect: false,
        whyWrongHint: "static gehört zur Klasse, nicht zur Instanz — hier brauchst du Instanzstate",
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

function stablePick<T>(arr: T[], seed: number, salt: number): T {
  if (arr.length === 0) throw new Error("empty registry");
  const idx = Math.abs((seed * 1103515245 + salt) % arr.length);
  return arr[idx]!;
}

/** Vollständiges Curriculum je Lernfeld (mind. 5 Aufgaben pro LF) */
export const CURRICULUM_BY_LF: Record<LearningField, LearningExercise[]> = {
  LF1: withBeginnerPath("LF1", LF1_WIRTSCHAFT),
  LF2: withBeginnerPath("LF2", LF2_IT_GRUNDLAGEN),
  LF3: withBeginnerPath("LF3", LF3_NETZWERK),
  LF4: withBeginnerPath("LF4", LF4_NETZ_HARDWARE),
  LF5: SQL_EXAM_LF5,
  LF6: withBeginnerPath("LF6", JAVASCRIPT_EXAM_LF6),
  LF7: withBeginnerPath("LF7", CSHARP_EXAM_LF7),
  LF8: withBeginnerPath("LF8", LF8_DATENMODELL),
  LF9: withBeginnerPath("LF9", LF9_DIENSTE_PROTOKOLLE),
  LF10: withBeginnerPath("LF10", LF10_UI_BARREFREI),
  LF11: withBeginnerPath("LF11", LF11_INFO_SICHERHEIT),
  LF12: withBeginnerPath("LF12", LF12_AGILE_PM),
};

export function pickLearningExercise(
  lf: LearningField,
  _semantic: "HardwareNetworking" | "SecurityCryptography" | "DatabaseLogic",
  seed: number
): LearningExercise | null {
  const bag = CURRICULUM_BY_LF[lf];
  if (!bag?.length) return null;
  const beginner = getPendingBeginnerExercise(lf);
  if (beginner) return beginner;
  const n = Number.parseInt(lf.replace("LF", ""), 10);
  const salt = Number.isFinite(n) ? n * 131 : 0;
  return stablePick(bag, seed, salt);
}

/** Adaptive Auswahl: Leitner-Gewichte + Ebbinghaus-Retention (siehe leitnerEngine) */
export function pickLearningExerciseFromLfAdaptive(
  lf: LearningField,
  rng: () => number,
  leitner: Readonly<Record<string, LeitnerCardState>>,
  now: number
): LearningExercise | null {
  const bag = CURRICULUM_BY_LF[lf];
  if (!bag?.length) return null;
  const pendingBeginner = getPendingBeginnerExercise(lf, leitner);
  if (pendingBeginner) return pendingBeginner;

  const beginnerIds = BEGINNER_EXERCISE_IDS_BY_LF[lf];
  const reviewBag = bag.filter((exercise) => !beginnerIds.has(exercise.id));
  return pickWeightedExercise(reviewBag.length ? reviewBag : bag, rng, (id) =>
    leitnerPickWeight(id, leitner, now)
  );
}

export function getLearningExerciseById(
  lf: LearningField,
  exerciseId: string
): LearningExercise | null {
  const bag = CURRICULUM_BY_LF[lf];
  if (!bag?.length) return null;
  return bag.find((ex) => ex.id === exerciseId) ?? null;
}

export function pickRandomLf(rng: () => number): LearningField {
  const n = 1 + Math.floor(rng() * 12);
  return `LF${n}` as LearningField;
}

/** Final Exam: zufälliges LF, dann adaptive Übung aus dessen Curriculum */
export function pickFinalExamExercise(
  rng: () => number,
  leitner: Readonly<Record<string, LeitnerCardState>>,
  now: number
): { exercise: LearningExercise; lf: LearningField } | null {
  const lf = pickRandomLf(rng);
  const exercise = pickLearningExerciseFromLfAdaptive(lf, rng, leitner, now);
  if (!exercise) return null;
  return { exercise, lf };
}

export function assertMcIntegrity(ex: LearningExercise): void {
  const correct = ex.mcOptions.filter((o) => o.isCorrect);
  if (correct.length !== 1) {
    throw new Error(`Exercise ${ex.id}: genau eine richtige MC-Option nötig`);
  }
  for (const o of ex.mcOptions) {
    if (!o.isCorrect && (!o.whyWrongHint || o.whyWrongHint.trim() === "")) {
      throw new Error(`Exercise ${ex.id}: falsche Option braucht whyWrongHint`);
    }
  }
}

for (const ex of Object.values(CURRICULUM_BY_LF).flat()) {
  assertMcIntegrity(ex);
}

for (const lf of Object.keys(CURRICULUM_BY_LF) as LearningField[]) {
  const minExercises = lf === "LF5" ? 1 : 5;
  if (CURRICULUM_BY_LF[lf].length < minExercises) {
    throw new Error(`Curriculum ${lf}: mindestens ${minExercises} Aufgaben erforderlich`);
  }
}
