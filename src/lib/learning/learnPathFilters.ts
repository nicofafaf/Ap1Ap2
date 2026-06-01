/** Trennung Lernpfad (Grundlagen zuerst) vs. Prüfungs-/IHK-Aufgaben */

export const EXAM_TOPIC_PREFIX = "Prüfung ·";

export type BeginnerPathMeta = {
  id?: string;
  topic?: string;
  /** grundlage | vertiefung | pruefung — optional in content.json */
  learnPhase?: string;
};

export function isExamPathMission(meta: BeginnerPathMeta): boolean {
  const phase = meta.learnPhase?.trim().toLowerCase();
  if (phase === "pruefung" || phase === "exam") return true;

  const topic = meta.topic?.trim() ?? "";
  if (topic.startsWith(EXAM_TOPIC_PREFIX)) return true;
  if (/^IHK\b/i.test(topic) || /\bIHK\s+/i.test(topic)) return true;

  const id = meta.id?.trim().toLowerCase() ?? "";
  if (id.startsWith("ihk26-")) return true;

  return false;
}

export function isLearnPathMission(meta: BeginnerPathMeta): boolean {
  return !isExamPathMission(meta);
}
