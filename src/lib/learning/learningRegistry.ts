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
  level: string;
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
    type: string;
    question: string;
    coachLine?: string;
    expected?: string;
    /** multi = mehrere correct:true (WiSo) */
    selectMode?: "single" | "multi";
    brokenCode?: string;
    solutionHint?: string;
    options: BeginnerPathOption[];
  };
};

type BeginnerBossPhaseJson = {
  id?: string;
  title?: string;
  problemLead?: string;
  epicCoach?: {
    starwars?: string;
    anime?: string;
    gym?: string;
  };
  practice?: BeginnerPathEntry["practice"];
};

type Lf5ContentShape = {
  lf: "LF5" | 5;
  title: string;
  beginnerPath?: BeginnerPathEntry[];
  bossPhase?: {
    id?: string;
    title?: string;
    epicCoach?: {
      starwars?: string;
      anime?: string;
      gym?: string;
    };
    expected?: Record<string, string>;
  };
  milestones: Array<Lf5WorkbenchMilestone | Lf5McMilestone>;
};

type BeginnerContentShape = {
  lf?: LearningField | number | string;
  title?: string;
  beginnerPath?: BeginnerPathEntry[];
  bossPhase?: any;
};

function normalizeLearningField(rawLf: BeginnerContentShape["lf"]): LearningField | null {
  if (rawLf == null) return null;
  if (typeof rawLf === "number") {
    return rawLf >= 1 && rawLf <= 12 ? (`LF${rawLf}` as LearningField) : null;
  }
  const normalized = rawLf.toString().toUpperCase();
  return /^LF(?:[1-9]|1[0-2])$/.test(normalized) ? (normalized as LearningField) : null;
}

function practiceLang(type: string): LearningExercise["lang"] {
  if (type === "mc") return "markdown";
  if (type === "sql" || type === "csharp" || type === "bash" || type === "javascript") return type;
  if (type === "plain-text") return "plain-text";
  if (type === "markdown") return "markdown";
  return "plain-text";
}

/** C#/SQL/Bash-Boss aus beginnerPath-JSON (brokenCode + expected + MC) */
function buildOptionalBossCodeExercise(raw: BeginnerContentShape): LearningExercise | null {
  const lf = normalizeLearningField(raw.lf);
  const bp = raw.bossPhase;
  if (!lf || !bp?.practice) return null;
  const p = bp.practice;
  if (p.type !== "csharp" && p.type !== "sql" && p.type !== "bash") return null;
  const options: BeginnerPathOption[] = (p.options ?? []) as BeginnerPathOption[];
  if (options.length < 2) return null;
  const expected = p.expected?.trim();
  const broken = p.brokenCode?.trim();
  if (!expected || !broken) return null;

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
  const bossId = bp.id?.trim() ? bp.id.trim() : `${lf.toLowerCase()}-boss`;
  const bossTitle = bp.title?.trim() ? bp.title.trim() : "Abschlussübung";
  const q = p.question.trim();
  const lead = bp.problemLead?.trim();
  const problem = lead ? `${lead}\n\n${q}` : q;
  const coachLineEpic =
    bp.epicCoach?.starwars?.trim() ||
    bp.epicCoach?.anime?.trim() ||
    bp.epicCoach?.gym?.trim();
  const coachLine = p.coachLine?.trim() || coachLineEpic;

  return {
    id: bossId,
    title: bossTitle,
    problem,
    solutionCode: expected,
    lang: practiceLang(p.type),
    mcQuestion: q,
    mcOptions,
    ...(coachLine ? { coachLine } : {}),
    workbenchInitialDraft: broken,
    solutionHint:
      p.solutionHint?.trim() ||
      "Nutze zuerst das Mini-Beispiel. Es ist erlaubt, die Struktur zu übernehmen und nur den Kern zu verstehen",
  } satisfies LearningExercise;
}

function buildOptionalBossMcExercise(raw: BeginnerContentShape): LearningExercise | null {
  const lf = normalizeLearningField(raw.lf);
  const bp = raw.bossPhase;
  if (!lf || !bp?.practice || bp.practice.type !== "mc") return null;
  const options: BeginnerPathOption[] = (bp.practice.options ?? []) as BeginnerPathOption[];
  if (options.length < 2) return null;
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
        : option.hint || "Prüfe Hostbits Netz und Broadcast ziehen sich von der Gesamtzahl ab",
  }));
  const correctText = options[normalizedCorrectIdx]?.text ?? options[0]?.text ?? "";
  const solutionCode = bp.practice.expected ?? correctText;
  const bossId = bp.id?.trim() ? bp.id.trim() : `${lf.toLowerCase()}-boss`;
  const bossTitle = bp.title?.trim() ? bp.title.trim() : "Abschlussübung";
  const q = bp.practice.question.trim();
  const lead = bp.problemLead?.trim();
  const problem = lead ? `${lead}\n\n${q}` : q;
  return {
    id: bossId,
    title: bossTitle,
    problem,
    solutionCode,
    lang: "markdown",
    mcQuestion: q,
    mcOptions,
    solutionHint: undefined,
  } satisfies LearningExercise;
}

function buildBeginnerPathFromJson(raw: BeginnerContentShape): LearningExercise[] {
  const lf = normalizeLearningField(raw.lf);
  if (!lf || !raw.beginnerPath?.length) return [];

  return raw.beginnerPath.map((path, pathIdx) => {
    const options = path.practice.options.length
      ? path.practice.options
      : [{ text: "Ich habe den ersten Schritt verstanden", correct: true }];
    const correctCount = options.filter((option) => option.correct).length;
    const mcSelectMode: "single" | "multi" =
      path.practice.selectMode === "multi" || correctCount > 1 ? "multi" : "single";
    const correctIdx = Math.max(0, options.findIndex((option) => option.correct));
    const normalizedCorrectIdx = correctIdx === -1 ? 0 : correctIdx;
    const optIds = ["a", "b", "c", "d", "e", "f"];
    const mcOptions: LearningMcOption[] = options.map((option, idx) => ({
      id: optIds[idx] ?? `o${idx + 1}`,
      text: option.text,
      isCorrect: mcSelectMode === "multi" ? Boolean(option.correct) : idx === normalizedCorrectIdx,
      whyWrongHint:
        (mcSelectMode === "multi" ? option.correct : idx === normalizedCorrectIdx)
          ? undefined
          : option.hint || "Schau noch einmal auf die Action-Cards über der Übung",
    }));
    const correctTexts = options.filter((option) => option.correct).map((option) => option.text);
    const correctText =
      correctTexts.length > 0
        ? correctTexts.join(" | ")
        : (options[normalizedCorrectIdx]?.text ?? options[0]?.text ?? "");
    const solutionCode = path.practice.expected ?? correctText;

    const coachLine = path.practice.coachLine?.trim();
    const workbenchInitialDraft = path.practice.brokenCode?.trim();

    return {
      id: path.id || `${lf.toLowerCase()}-start-${pathIdx + 1}`,
      title: path.title || `${raw.title ?? lf} Einstieg`,
      problem: path.practice.question,
      solutionCode,
      lang: practiceLang(path.practice.type),
      mcQuestion: path.practice.question,
      mcOptions,
      mcSelectMode,
      lessonCards: path.lessonCards,
      example: path.example,
      ...(coachLine ? { coachLine } : {}),
      ...(workbenchInitialDraft ? { workbenchInitialDraft } : {}),
      solutionHint:
        path.practice.solutionHint?.trim() ||
        (path.practice.type === "sql" ||
        path.practice.type === "csharp" ||
        path.practice.type === "bash"
          ? "Nutze zuerst das Mini-Beispiel. Es ist erlaubt, die Struktur zu übernehmen und nur den Kern zu verstehen"
          : coachLine && !path.example?.body
            ? undefined
            : path.example?.body || `Starte ruhig mit der ersten ${lf} Action-Card`),
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

  const bossId = raw.bossPhase?.id?.trim() ? raw.bossPhase.id.trim() : "lf5-boss";
  const bossTitle = raw.bossPhase?.title?.trim() ? raw.bossPhase.title.trim() : "Abschlussübung";

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
    {
      id: bossId,
      title: bossTitle,
      problem:
        "Abschlussübung: SQL-Abfrage\n\nNutze SELECT und WHERE zusammen und halte die Struktur sauber",
      /** Referenz wird im Workbench je Multiversum aus content.json geladen */
      solutionCode: "SELECT * FROM Kunden WHERE Stadt = 'Berlin'",
      lang: "sql",
      mcQuestion: "Welche Clause begrenzt die Zeilenmenge in SQL",
      mcOptions: [
        { id: "a", text: "WHERE", isCorrect: true },
        { id: "b", text: "FROM", isCorrect: false, whyWrongHint: "FROM wählt die Tabelle" },
        { id: "c", text: "SELECT", isCorrect: false, whyWrongHint: "SELECT wählt Spalten" },
        { id: "d", text: "ORDER BY", isCorrect: false, whyWrongHint: "ORDER BY sortiert Ergebnisse" },
      ],
      solutionHint: "SELECT zuerst dann FROM dann WHERE als Filter",
    },
  ];
}

/** Grundlagen → Vertiefung (Story) → Prüfung — JSON-Reihenfolge je Teilmenge */
function buildLearnAndExamPathsFromJson(raw: BeginnerContentShape): {
  grundlage: LearningExercise[];
  vertiefung: LearningExercise[];
  learn: LearningExercise[];
  exam: LearningExercise[];
} {
  const entries = raw.beginnerPath ?? [];
  const grundlageEntries = entries.filter((entry) => isGrundlagePathMission(entry));
  const vertiefungEntries = entries.filter((entry) => isVertiefungPathMission(entry));
  const examEntries = entries.filter((entry) => isExamPathMission(entry));
  const grundlage = buildBeginnerPathFromJson({ ...raw, beginnerPath: grundlageEntries });
  const vertiefung = buildBeginnerPathFromJson({ ...raw, beginnerPath: vertiefungEntries });
  return {
    grundlage,
    vertiefung,
    learn: [...grundlage, ...vertiefung],
    exam: buildBeginnerPathFromJson({ ...raw, beginnerPath: examEntries }),
  };
}

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
const SQL_EXAM_LF5 = mergeFullCurriculum("LF5", [
  ...LF5_NON_BOSS,
  ...SQL_EXAM_LF5_DEPRECATED,
  ...(LF5_BOSS ? [LF5_BOSS] : []),
]);

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

function stablePick<T>(arr: T[], seed: number, salt: number): T {
  if (arr.length === 0) throw new Error("empty registry");
  const idx = Math.abs((seed * 1103515245 + salt) % arr.length);
  return arr[idx]!;
}

/** Vollständiges Curriculum je Lernfeld (mind. 5 Aufgaben pro LF) */
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
  now: number,
  edtechCtx?: EdtechExercisePickContext | null
): LearningExercise | null {
  const bag = CURRICULUM_BY_LF[lf];
  if (!bag?.length) return null;
  const pendingBeginner = getPendingBeginnerExercise(lf, leitner, edtechCtx);
  if (pendingBeginner) return pendingBeginner;

  const beginnerIds = BEGINNER_EXERCISE_IDS_BY_LF[lf];
  const examIds = EXAM_EXERCISE_IDS_BY_LF[lf];
  const solved = new Set(edtechCtx?.solvedExerciseIds ?? []);
  let reviewBag = bag.filter(
    (exercise) => !beginnerIds.has(exercise.id) && !examIds.has(exercise.id)
  );
  reviewBag = filterExercisePool(reviewBag, edtechCtx);
  if (!reviewBag.length) {
    reviewBag = filterExercisePool(
      bag.filter((exercise) => !beginnerIds.has(exercise.id) && !examIds.has(exercise.id)),
      edtechCtx
    );
  }

  const unseen = reviewBag.filter((exercise) => !solved.has(exercise.id));
  const pickPool = unseen.length ? unseen : reviewBag;
  if (!pickPool.length) return null;

  return pickWeightedExercise(pickPool, rng, (id) => leitnerPickWeight(id, leitner, now));
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
  const exercise = pickLearningExerciseFromLfAdaptive(lf, rng, leitner, now, null);
  if (!exercise) return null;
  return { exercise, lf };
}

export function assertMcIntegrity(ex: LearningExercise): void {
  const correct = ex.mcOptions.filter((o) => o.isCorrect);
  const isMulti = ex.mcSelectMode === "multi";
  if (isMulti) {
    if (correct.length < 2) {
      throw new Error(`Exercise ${ex.id}: Mehrfachauswahl braucht mindestens zwei richtige MC-Optionen`);
    }
  } else if (correct.length !== 1) {
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
