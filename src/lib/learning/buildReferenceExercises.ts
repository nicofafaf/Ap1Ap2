import type { LearningField } from "../../data/nexusRegistry";
import type { LearningExercise, LearningMcOption } from "./learningExerciseTypes";
import lf01 from "../../lernfelder/lf01/content.json";
import lf02 from "../../lernfelder/lf02/content.json";
import lf03 from "../../lernfelder/lf03/content.json";
import lf04 from "../../lernfelder/lf04/content.json";
import lf05 from "../../lernfelder/lf05/content.json";
import lf06 from "../../lernfelder/lf06/content.json";
import lf07 from "../../lernfelder/lf07/content.json";
import lf08 from "../../lernfelder/lf08/content.json";
import lf09 from "../../lernfelder/lf09/content.json";
import lf10 from "../../lernfelder/lf10/content.json";
import lf11 from "../../lernfelder/lf11/content.json";
import lf12 from "../../lernfelder/lf12/content.json";

type RefItem = {
  id?: string;
  chapter?: string;
  type?: string;
  title?: string;
  body?: string;
  code?: string;
  coachLine?: string;
};

type ContentWithRef = { lf?: string | number; reference?: RefItem[] };

const CONTENT_BY_LF: Record<LearningField, ContentWithRef> = {
  LF1: lf01 as ContentWithRef,
  LF2: lf02 as ContentWithRef,
  LF3: lf03 as ContentWithRef,
  LF4: lf04 as ContentWithRef,
  LF5: lf05 as ContentWithRef,
  LF6: lf06 as ContentWithRef,
  LF7: lf07 as ContentWithRef,
  LF8: lf08 as ContentWithRef,
  LF9: lf09 as ContentWithRef,
  LF10: lf10 as ContentWithRef,
  LF11: lf11 as ContentWithRef,
  LF12: lf12 as ContentWithRef,
};

function mc(
  question: string,
  correct: string,
  wrong: [string, string, string],
  hints?: [string, string, string]
): LearningMcOption[] {
  const ids = ["a", "b", "c", "d"] as const;
  return [
    { id: "a", text: correct, isCorrect: true },
    ...wrong.map((text, i) => ({
      id: ids[i + 1]!,
      text,
      isCorrect: false as const,
      whyWrongHint: hints?.[i] || "Prüfe noch einmal die Kernaussage im Codex",
    })),
  ];
}

function langFromType(type: string): LearningExercise["lang"] {
  if (type === "sql") return "sql";
  if (type === "csharp") return "csharp";
  if (type === "bash") return "bash";
  return "markdown";
}

function exerciseFromCodeRef(lf: LearningField, item: RefItem): LearningExercise | null {
  const code = item.code?.trim();
  const title = item.title?.trim() || item.chapter?.trim() || "Codex";
  const id = item.id?.trim();
  if (!code || !id) return null;

  const upper = code.toUpperCase();
  const hasJoin = /\bJOIN\b/.test(upper);
  const hasWhere = /\bWHERE\b/.test(upper);
  const hasGroup = /\bGROUP\s+BY\b/.test(upper);
  const hasSelect = /\bSELECT\b/.test(upper);

  let mcQuestion: string;
  let options: LearningMcOption[];

  if (hasJoin) {
    mcQuestion = `${title}: Was koppeln JOIN und ON in dieser Abfrage?`;
    options = mc(
      mcQuestion,
      "Zwei Tabellen über den passenden Schlüssel verbinden",
      [
        "Nur eine Tabelle auswählen ohne Verknüpfung",
        "WHERE ersetzt JOIN vollständig",
        "ORDER BY sortiert die Tabellen zusammen",
      ],
      [
        "Ohne JOIN fehlt die zweite Tabelle",
        "WHERE filtert Zeilen, JOIN verbindet Tabellen",
        "ORDER BY kommt nach dem Join-Ergebnis",
      ]
    );
  } else if (hasGroup) {
    mcQuestion = `${title}: Wozu dient GROUP BY hier?`;
    options = mc(
      mcQuestion,
      "Zeilen in Gruppen fassen für Aggregatfunktionen",
      [
        "Einzelzeilen alphabetisch sortieren",
        "Nur die erste Zeile behalten",
        "WHERE durch GROUP ersetzen",
      ],
      [
        "ORDER BY sortiert, GROUP BY gruppiert",
        "GROUP BY löscht keine Zeilen allein",
        "WHERE filtert vor der Gruppierung",
      ]
    );
  } else if (hasWhere) {
    const filterHint = code.match(/WHERE\s+(.+)/i)?.[1]?.slice(0, 48) ?? "Filter";
    mcQuestion = `${title}: Was bewirkt der Filter (${filterHint}…)?`;
    options = mc(
      mcQuestion,
      "Es werden nur Zeilen angezeigt, die die Bedingung erfüllen",
      [
        "Alle Zeilen werden gelöscht",
        "Die Tabelle wird umbenannt",
        "Spalten werden automatisch hinzugefügt",
      ],
      [
        "WHERE filtert, löscht nicht",
        "Tabellennamen ändert FROM, nicht WHERE",
        "SELECT bestimmt Spalten, nicht WHERE",
      ]
    );
  } else if (hasSelect) {
    mcQuestion = `${title}: Was macht SELECT in dieser Abfrage?`;
    options = mc(
      mcQuestion,
      "Legt fest, welche Spalten oder Ausdrücke im Ergebnis erscheinen",
      [
        "Verbindet zwei Datenbanken automatisch",
        "Verschlüsselt die Tabelle",
        "Ersetzt die WHERE-Klausel",
      ],
      [
        "Verbindung ist Aufgabe von JOIN",
        "Verschlüsselung ist kein SELECT-Thema",
        "WHERE und SELECT haben verschiedene Rollen",
      ]
    );
  } else {
    mcQuestion = `${title}: Was beschreibt dieser Code am besten?`;
    options = mc(
      mcQuestion,
      "Ein ausführbarer Befehl für Daten oder Logik",
      [
        "Ein reiner Kommentar ohne Wirkung",
        "Eine Hardware-Konfigurationsdatei",
        "Ein Netzwerkprotokoll-Header",
      ],
      [
        "Kommentare beginnen oft mit // oder --",
        "Hardware nutzt andere Formate",
        "Protokolle sind keine Anwendungslogik",
      ]
    );
  }

  const type = item.type ?? "markdown";
  return {
    id: `${lf.toLowerCase()}-ref-${id}`,
    title: `Codex · ${title}`,
    problem: `${item.chapter ? `Kapitel: ${item.chapter}\n\n` : ""}${item.coachLine?.trim() || "Lies den Code im Codex und ordne die Klauseln zu"}\n\n\`\`\`\n${code}\n\`\`\``,
    solutionCode: code,
    lang: langFromType(type),
    mcQuestion,
    mcOptions: options,
    ...(item.coachLine?.trim() ? { coachLine: item.coachLine.trim() } : {}),
    solutionHint: "Vergleiche SELECT, FROM, WHERE und JOIN in der Reihenfolge der Abfrage",
  };
}

function exerciseFromNoteRef(lf: LearningField, item: RefItem): LearningExercise | null {
  const body = item.body?.trim();
  const title = item.title?.trim() || "Theorie";
  const id = item.id?.trim();
  if (!body || !id || body.length < 12) return null;

  const firstSentence = body.split(/[.!]/)[0]?.trim() || body.slice(0, 80);
  return {
    id: `${lf.toLowerCase()}-ref-${id}`,
    title: `Codex · ${title}`,
    problem: `${item.chapter ? `Kapitel: ${item.chapter}\n\n` : ""}${body}`,
    solutionCode: body,
    lang: "markdown",
    mcQuestion: `Was ist die Kernaussage zu „${title}"?`,
    mcOptions: mc(
      `Was ist die Kernaussage zu „${title}"?`,
      firstSentence.length > 120 ? `${firstSentence.slice(0, 117)}…` : firstSentence,
      [
        "Nur Hardware ohne Bezug zum Lernfeld",
        "Rein optisches Design ohne Lernziel",
        "Ein Netzwerkkabel-Standard",
      ],
      [
        "Der Fokus liegt auf Prüfungswissen, nicht Hardware allein",
        "Didaktik zielt auf verständliche Kernbegriffe",
        "Netzwerk ist ein anderes Teilgebiet",
      ]
    ),
    solutionHint: "Die Antwort steht wörtlich oder sinngemäß in der Codex-Notiz",
  };
}

export function buildReferenceExercisesForLf(lf: LearningField): LearningExercise[] {
  const raw = CONTENT_BY_LF[lf];
  const refs = raw.reference ?? [];
  const out: LearningExercise[] = [];

  for (const item of refs) {
    const type = (item.type ?? "note").toLowerCase();
    if (type === "note") {
      const ex = exerciseFromNoteRef(lf, item);
      if (ex) out.push(ex);
    } else if (type === "sql" || type === "csharp" || type === "bash") {
      const ex = exerciseFromCodeRef(lf, item);
      if (ex) out.push(ex);
    }
  }
  return out;
}

export const REFERENCE_EXERCISES_BY_LF: Record<LearningField, LearningExercise[]> = {
  LF1: buildReferenceExercisesForLf("LF1"),
  LF2: buildReferenceExercisesForLf("LF2"),
  LF3: buildReferenceExercisesForLf("LF3"),
  LF4: buildReferenceExercisesForLf("LF4"),
  LF5: buildReferenceExercisesForLf("LF5"),
  LF6: buildReferenceExercisesForLf("LF6"),
  LF7: buildReferenceExercisesForLf("LF7"),
  LF8: buildReferenceExercisesForLf("LF8"),
  LF9: buildReferenceExercisesForLf("LF9"),
  LF10: buildReferenceExercisesForLf("LF10"),
  LF11: buildReferenceExercisesForLf("LF11"),
  LF12: buildReferenceExercisesForLf("LF12"),
};
