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

/** Story, Multiversum, CCNA — nach allen Grundlagen */
export function isVertiefungPathMission(meta: BeginnerPathMeta): boolean {
  if (isExamPathMission(meta)) return false;

  const phase = meta.learnPhase?.trim().toLowerCase();
  if (phase === "grundlage") return false;
  if (phase === "vertiefung") return true;

  const topic = meta.topic?.trim() ?? "";
  if (/multiversum|ccna|corporate espionage/i.test(topic)) return true;

  const id = meta.id?.trim().toLowerCase() ?? "";
  if (/lf\d+-mission-|lf\d+-sw-|lf\d+-an-|lf\d+-gym-/.test(id)) return true;

  return false;
}

export function isGrundlagePathMission(meta: BeginnerPathMeta): boolean {
  return isLearnPathMission(meta) && !isVertiefungPathMission(meta);
}

export function isLearnPathMission(meta: BeginnerPathMeta): boolean {
  return !isExamPathMission(meta);
}
