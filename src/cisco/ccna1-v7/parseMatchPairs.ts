import type { CiscoMatchPair, CiscoQuestion } from "../types";

/** Pipe-Format aus ITExamAnswers-Text: „Prompt| left | right | …“ */
export function parsePipeMatchPairs(text: string): CiscoMatchPair[] {
  if (!text.includes("|")) return [];
  const parts = text
    .split("|")
    .map((s) => s.replace(/\*\*/g, "").trim())
    .filter(Boolean);
  if (parts.length < 3) return [];
  const pairs: CiscoMatchPair[] = [];
  for (let i = 1; i + 1 < parts.length; i += 2) {
    const left = parts[i];
    const right = parts[i + 1];
    if (!left || !right) continue;
    if (/^place the options/i.test(left)) continue;
    pairs.push({ left: { en: left, de: null }, right: { en: right, de: null } });
  }
  return pairs;
}

export function resolveCiscoMatchPairs(q: CiscoQuestion): CiscoMatchPair[] {
  if (q.matchPairs && q.matchPairs.length >= 2) return q.matchPairs;
  return parsePipeMatchPairs(q.question.en);
}

export function matchPromptFromQuestion(text: string): string {
  const idx = text.indexOf("|");
  if (idx < 0) return text.trim();
  return text.slice(0, idx).replace(/\*\*/g, "").trim();
}

export function ciscoQuestionHasMatch(q: CiscoQuestion): boolean {
  return resolveCiscoMatchPairs(q).length >= 2;
}
