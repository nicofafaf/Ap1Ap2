import type { Sommer2026PackId } from "../../../../lib/curriculum/sommer2026Exams";
import type { NexusHubMapExtras } from "../../../../lib/ui/hubMapNavigation";
import type { EdtechHubZoneId } from "../edtechHubZones";

export type HubContinueTarget = {
  lf: number;
  title: string;
  solved: number;
  total: number;
} | null;

export type HubLearningMode = {
  title: string;
  body: string;
  accent: string;
  onClick: () => void;
};

export type HubZoneContext = {
  playerName: string;
  trainingTrack: string | null;
  bundeslandId: string | null;
  lastLine: string;
  reduceMotion: boolean;
  continueTarget: HubContinueTarget;
  learningModes: HubLearningMode[];
  coveragePct: number;
  totalCorrect: number;
  totalCurriculum: number;
  nexusFragments: number;
  dailyParticipationStreak: number;
  unlockedSectors: number;
  dailyLf: number;
  learningTip: { lf: number; message: string; examReadyPct: number };
  onOpenMap: () => void;
  onBeginLearningField: (lf: number) => void;
  onBeginExamField?: (lf: number) => void;
  onBlitzTraining?: () => void;
  onBeginRanked?: () => void;
  mapWithExtras: (extras: NexusHubMapExtras) => void;
  beginExamForLf: (lf: number) => void;
  beginSommer2026Exam: (packId: Sommer2026PackId) => void;
  onZoneChange: (zone: EdtechHubZoneId) => void;
};
