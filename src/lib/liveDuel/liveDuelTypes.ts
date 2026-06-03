import type { CiscoPackId } from "../../cisco/types";
import type { Sommer2026PackId } from "../curriculum/sommer2026Exams";

/** Einheitliche Frage-Referenz — LF, CCNA, IHK Sommer 2026 */
export type LiveDuelQuestionRef =
  | { source: "lf"; lf: number; exerciseId: string }
  | { source: "cisco"; packId: CiscoPackId; questionId: string }
  | { source: "sommer2026"; packId: Sommer2026PackId; missionId: string };

export type LiveDuelContentKind = "lf" | "ccna" | "sommer2026" | "mixed";

export type LiveDuelContentSourceId =
  | `lf:${number}`
  | "lf:all"
  | `ccna:${CiscoPackId}`
  | "ccna:all"
  | `sommer2026:${Sommer2026PackId}`
  | "mixed:weakest";

export type LiveDuelScoringMode = "speed" | "correct-only";

export type LiveDuelRoomSettings = {
  questionCount: number;
  secondsPerQuestion: number;
  scoring: LiveDuelScoringMode;
  showExplanation: boolean;
  contentSourceId: LiveDuelContentSourceId;
};

export type LiveDuelPlayer = {
  id: string;
  displayName: string;
  isHost: boolean;
  score: number;
  lastAnswerCorrect?: boolean;
};

export type LiveDuelRoomPhase = "lobby" | "countdown" | "question" | "reveal" | "finished";

export type LiveDuelRoom = {
  code: string;
  createdAt: number;
  hostId: string;
  phase: LiveDuelRoomPhase;
  settings: LiveDuelRoomSettings;
  questionQueue: LiveDuelQuestionRef[];
  questionIndex: number;
  questionStartedAt: number | null;
  players: LiveDuelPlayer[];
};

export const LIVE_DUEL_DEFAULT_SETTINGS: LiveDuelRoomSettings = {
  questionCount: 10,
  secondsPerQuestion: 20,
  scoring: "speed",
  showExplanation: true,
  contentSourceId: "lf:all",
};

export const LIVE_DUEL_QUESTION_COUNT_MIN = 5;
export const LIVE_DUEL_QUESTION_COUNT_MAX = 30;
export const LIVE_DUEL_SECONDS_MIN = 10;
export const LIVE_DUEL_SECONDS_MAX = 120;
