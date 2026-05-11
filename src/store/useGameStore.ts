import { create } from "zustand";
import { nexusPresets, type NexusPresetId, type ParticleDensity } from "../data/nexusPresets";
import { skillRegistry, type SkillId, type SkillType, type SkillVfx } from "../data/skillRegistry";
import {
  INITIAL_RANK_AUDIO_PROFILES,
  RANK_AUDIO_PROFILES,
  type CombatRank,
  type RankAudioProfile,
} from "../data/rankSoundConfig";
import {
  achievementOrder,
  achievementRegistry,
  type AchievementType,
} from "../data/achievementRegistry";
import { rollLootRarity, type LearningField, type LootRarity } from "../data/nexusRegistry";
import { CURRICULUM_BY_LF, applyLeitnerReview, type LeitnerCardState } from "../lib/learning/learningRegistry";
import {
  computeArchitectPersona,
  computePerformanceTrend,
  type ArchitectPersona,
  type TrendDirection,
} from "../lib/math/statCalculations";
import {
  anomalySeedEpoch,
  countAnomaliesToSpawn,
  createSeededRandom,
  mixSeed,
  nextDataTurbulenceStamina,
  outgoingDamageMultipliers,
  pickSectorAnomalies,
  rollGlitchMiss,
  rollHandCosts,
  type NexusAnomalyType,
} from "../lib/combat/anomalyProcessor";
import {
  addUtcCalendarDays,
  computeDailyRewardMultiplier,
  computeDailyRunScore,
  getDailyIncursionDefinition,
  getUtcDateKey,
  rollSectorZeroMorph,
  type DailyLeaderboardRow,
  type InitiateCombatOptions,
} from "../lib/dailyIncursion";
import {
  applyArchitectChromaToDocument,
  loadArchitectChromaActive,
  loadArchitectChromaUnlocks,
  persistArchitectChromaActive,
  persistArchitectChromaUnlocks,
  type ArchitectChromaId,
} from "../lib/ui/architectChromas";
import {
  applyReadabilityToDocument,
  loadReadabilityMode,
  persistReadabilityMode,
} from "../lib/ui/readabilityMode";
import { computeAllSectorStabilities, isSectorReachable } from "../lib/math/mapLogic";
import { appendRetentionSnapshot } from "../lib/math/learningAnalytics";
import { persistEpilogueUnlocked } from "../lib/progression/nexusEpilogue";
import { loadCloudSyncConfig, pushEncryptedNxcPayload } from "../lib/security/cloudSync";
import { persistRegistryFingerprint } from "../lib/system/maintenanceBot";
import {
  applyRoundEndShieldDecay,
  computeBossStrikeDamage,
  computeShieldPulseHeal,
  isPerfectParryWindow,
  MAX_PLAYER_SHIELD,
  mitigateBossDamageOnPlayer,
  PARRY_FLOW_RESTORE,
} from "../lib/combat/defenseProcessor";
import {
  applyFlowAfterBossCounterHit,
  applyFlowAfterGlitchMiss,
  applyFlowAfterSuccessfulCard,
  applyFlowDecay,
  computeSynapticOverloadDamage,
  damageMultiplierForFlow,
  SYNAPTIC_OVERLOAD_FREEZE_MS,
  SYNAPTIC_OVERLOAD_FX_MS,
} from "../lib/combat/flowProcessor";

export type { NexusAnomalyType } from "../lib/combat/anomalyProcessor";

export type GlobalCollectionEntry = { count: number; firstUnlocked: string };
export type ActiveCombatBoosts = {
  criticalDamageMultiplier: number;
  shieldStrengthMultiplier: number;
  cardDrawMultiplier: number;
  criticalResistanceMultiplier: number;
};

export type GameState =
  | "IDLE"
  | "STARTING"
  | "FIGHTING"
  | "VICTORY"
  | "DEFEATED";
export type OverlayOpenState =
  | "NONE"
  | "GALLERY"
  | "LEADERBOARD"
  | "DAILY"
  | "SKILL_TREE"
  | "ARCHITECT_DATA";

/** Einzelnes MC-Event im aktuellen Run — für Review im Sieg-Dossier */
export type CombatLearningEvent = {
  exerciseId: string;
  title: string;
  problem: string;
  mcQuestion: string;
  selectedOptionId: string;
  wasCorrect: boolean;
};

export type VictoryFinisherPhase = "idle" | "implode" | "freeze" | "shatter";

export type StoredAudioPreset = {
  id: string;
  name: string;
  createdAt: number;
  rankAudioProfiles: Record<CombatRank, RankAudioProfile>;
  rankSoundMasterGain: number;
  sRankDuckingDb: number;
  cRankStaticLayerEnabled: boolean;
};

let combatPhaseTransitionFinishTimer: number | null = null;

function scheduleCombatPhaseTransitionFinish() {
  if (combatPhaseTransitionFinishTimer != null) {
    window.clearTimeout(combatPhaseTransitionFinishTimer);
  }
  combatPhaseTransitionFinishTimer = window.setTimeout(() => {
    combatPhaseTransitionFinishTimer = null;
    useGameStore.setState((s) =>
      s.isTransitioning ? { currentCombatPhase: 2, isTransitioning: false } : {}
    );
  }, 2000);
}

function clearCombatPhaseTransitionFinishTimer() {
  if (combatPhaseTransitionFinishTimer != null) {
    window.clearTimeout(combatPhaseTransitionFinishTimer);
    combatPhaseTransitionFinishTimer = null;
  }
}

const AUDIO_PRESETS_STORAGE_KEY = "nexus.rankAudioPresets.v1";
const ACHIEVEMENT_ARCHIVE_STORAGE_KEY = "nexus.achievementArchive.v1";
const SKILL_BLUEPRINT_ARCHIVE_KEY = "nexus.skillBlueprintArchive.v1";
const COMBAT_ARCHITECT_HISTORY_KEY = "nexus.combatArchitectHistory.v1";
const ARCHITECT_PERSONA_PROFILE_KEY = "nexus.architectPersonaProfile.v1";
const HARDCORE_DRIFT_STORAGE_KEY = "nexus.hardcoreDrift.v1";
const FIRST_BOOT_COMPLETE_KEY = "nexus.firstBootCompleted.v1";
const TUTORIAL_ANIME_UNLOCK_KEY = "nexus.tutorialAnimeUnlocked.v1";

type PersonaPersistSlice = { personaId?: string; dominanceCount?: number };

function persistArchitectPersonaProfile(persona: ArchitectPersona, reportId: string) {
  try {
    const raw = localStorage.getItem(ARCHITECT_PERSONA_PROFILE_KEY);
    let prev: PersonaPersistSlice | null = null;
    if (raw) prev = JSON.parse(raw) as PersonaPersistSlice;
    const dominanceCount =
      prev?.personaId === persona.id ? Math.max(1, (prev.dominanceCount ?? 0) + 1) : 1;
    localStorage.setItem(
      ARCHITECT_PERSONA_PROFILE_KEY,
      JSON.stringify({
        personaId: persona.id,
        title: persona.title,
        flavor: persona.flavor,
        lastReportId: reportId,
        updatedAt: Date.now(),
        dominanceCount,
      })
    );
  } catch {
    // no-op
  }
}
const NEXUS_NEURAL_AUGMENTS_KEY = "nexus.neuralAugments.v1";
const HAS_COMPLETED_INITIALIZATION_KEY = "nexus.hasCompletedInitialization.v1";
const DAILY_INCURSION_STORAGE_KEY = "nexus.dailyIncursion.v1";
const LEARNING_MASTERY_STORAGE_KEY = "nexus.learningMastery.v1";

type LearningMasteryPersisted = {
  correctByLf: Partial<Record<LearningField, string[]>>;
  badgeGranted: Partial<Record<LearningField, boolean>>;
  leitner?: Record<string, LeitnerCardState>;
};

function persistLearningMastery(slice: LearningMasteryPersisted) {
  try {
    localStorage.setItem(LEARNING_MASTERY_STORAGE_KEY, JSON.stringify(slice));
  } catch {
    // no-op
  }
}

const EMPTY_LEARNING_FIELDS = (): LearningField[] => [
  "LF1",
  "LF2",
  "LF3",
  "LF4",
  "LF5",
  "LF6",
  "LF7",
  "LF8",
  "LF9",
  "LF10",
  "LF11",
  "LF12",
];

type MissionState = {
  lf: LearningField | null;
  missionId: string | null;
  status: "idle" | "active" | "cleared";
};

type CampaignState = {
  unlockedSectors: number[];
  masteryChecks: Partial<Record<LearningField, boolean>>;
};

function deriveUnlockedSectorsFromMastery(
  masteryChecks: Partial<Record<LearningField, boolean>>
): number[] {
  const unlocked: number[] = [1];
  for (let lf = 2; lf <= 12; lf += 1) {
    const prev = `LF${lf - 1}` as LearningField;
    if (!masteryChecks[prev]) break;
    unlocked.push(lf);
  }
  return unlocked;
}

function normalizeCorrectMap(
  raw: Partial<Record<LearningField, string[]>> | undefined
): Record<LearningField, string[]> {
  const out = {} as Record<LearningField, string[]>;
  for (const lf of EMPTY_LEARNING_FIELDS()) {
    const arr = raw?.[lf];
    out[lf] = Array.isArray(arr) ? [...new Set(arr.filter((x) => typeof x === "string"))] : [];
  }
  return out;
}

function normalizeLeitnerMap(raw: Record<string, unknown> | undefined): Record<string, LeitnerCardState> {
  const out: Record<string, LeitnerCardState> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [id, v] of Object.entries(raw)) {
    if (!v || typeof v !== "object" || Array.isArray(v)) continue;
    const o = v as Record<string, unknown>;
    const boxN = typeof o.box === "number" ? Math.floor(o.box) : 1;
    const box = Math.min(5, Math.max(1, boxN));
    const easeFactor =
      typeof o.easeFactor === "number" && Number.isFinite(o.easeFactor)
        ? Math.min(2.6, Math.max(1.3, o.easeFactor))
        : 2.5;
    const intervalDays =
      typeof o.intervalDays === "number" && Number.isFinite(o.intervalDays)
        ? Math.max(0, o.intervalDays)
        : 0;
    const repetitions =
      typeof o.repetitions === "number" && Number.isFinite(o.repetitions)
        ? Math.max(0, Math.floor(o.repetitions))
        : 0;
    const lastReviewedAt =
      typeof o.lastReviewedAt === "number" && Number.isFinite(o.lastReviewedAt) ? o.lastReviewedAt : 0;
    const nextDueAt =
      typeof o.nextDueAt === "number" && Number.isFinite(o.nextDueAt) ? o.nextDueAt : 0;
    out[id] = { box, easeFactor, intervalDays, repetitions, lastReviewedAt, nextDueAt };
  }
  return out;
}

export type PlayerDailyBestPayload = {
  dateKey: string;
  row: DailyLeaderboardRow;
};

type DailyIncursionPersisted = {
  dailyRankedClearDateUtc: string | null;
  dailyParticipationStreak: number;
  playerDailyBest: PlayerDailyBestPayload | null;
};

function persistDailySlice(slice: DailyIncursionPersisted) {
  try {
    localStorage.setItem(DAILY_INCURSION_STORAGE_KEY, JSON.stringify(slice));
  } catch {
    // no-op
  }
}

/** App-Phase: INITIALIZATION bis Erst-Onboarding abgeschlossen */
export type AppBootMode = "NORMAL" | "INITIALIZATION";

export type TalentPathId = "overclock" | "firewall" | "throughput";

export type TalentLevels = Record<TalentPathId, number>;

const DEFAULT_TALENT_LEVELS: TalentLevels = {
  overclock: 0,
  firewall: 0,
  throughput: 0,
};

/** Basis B für Bonus = B · (1 + log10(Level + 1)), Level ≥ 1 */
const TALENT_PATH_BASE: Record<TalentPathId, number> = {
  overclock: 0.035,
  firewall: 0.042,
  throughput: 0.038,
};

export function talentUpgradeCost(currentLevel: number): number {
  return Math.round(100 * Math.pow(1.5, currentLevel));
}

function talentPathMultiplier(level: number, base: number): number {
  if (level <= 0) return 1;
  return 1 + base * (1 + Math.log10(level + 1));
}

export function getTalentMultiplierForPath(path: TalentPathId, level: number): number {
  return talentPathMultiplier(level, TALENT_PATH_BASE[path]);
}

function computeFragmentGain(
  rank: CombatRank,
  accuracy: number,
  timeGrade: "S" | "A" | "B" | "C"
): number {
  const rankPart = { S: 95, A: 68, B: 44, C: 26 }[rank];
  const accPart = Math.round(Math.max(0, Math.min(1, accuracy)) * 52);
  const timePart = timeGrade === "S" ? 22 : timeGrade === "A" ? 14 : timeGrade === "B" ? 8 : 5;
  return rankPart + accPart + timePart;
}

function computeMergedBoosts(state: {
  globalCollection: Record<AchievementType, GlobalCollectionEntry>;
  sRankStreak: number;
  talentLevels: TalentLevels;
}): ActiveCombatBoosts {
  const hasPerfectSync = (state.globalCollection.PERFECT_SYNC?.count ?? 0) > 0;
  const hasImmortal = (state.globalCollection.IMMORTAL?.count ?? 0) > 0;
  const hasFastTrack = (state.globalCollection.FAST_TRACK?.count ?? 0) > 0;
  const achCrit = hasPerfectSync ? 1.05 : 1;
  const achShield = hasImmortal ? 1.1 : 1;
  const achDraw = hasFastTrack ? 1.15 : 1;
  const achResist = state.sRankStreak >= 2 && hasPerfectSync ? 0.88 : 1;
  const t = state.talentLevels;
  return {
    criticalDamageMultiplier:
      achCrit * talentPathMultiplier(t.overclock, TALENT_PATH_BASE.overclock),
    shieldStrengthMultiplier:
      achShield * talentPathMultiplier(t.firewall, TALENT_PATH_BASE.firewall),
    cardDrawMultiplier:
      achDraw * talentPathMultiplier(t.throughput, TALENT_PATH_BASE.throughput),
    criticalResistanceMultiplier: achResist,
  };
}

function persistNeuralAugmentsSnapshot(fragments: number, talents: TalentLevels) {
  try {
    localStorage.setItem(
      NEXUS_NEURAL_AUGMENTS_KEY,
      JSON.stringify({ fragments, talents })
    );
  } catch {
    // no-op
  }
}

export type SkillBlueprintEntry = { count: number; firstUnlocked: string };

/** Globale System-Stimmung aus Performance-Trend (Menü / Audio / Insights) */
export type MenuSystemMood = {
  direction: TrendDirection;
  delta: number;
  runCount: number;
  updatedAt: number;
};

/** Permanenter Verlauf für Global Architect / Zeitnote (Diagramme) */
export type CombatArchitectReportEntry = {
  reportId: string;
  recordedAt: string;
  activeLF: number;
  timeGrade: "S" | "A" | "B" | "C";
  architectPlace: 1 | 2 | 3 | 4;
  architectStratum: string;
  combatRank: CombatRank;
  elapsedSec: number;
  accuracyRate: number;
  /** Kumulativ absorbiertes Boss-Schild (Run) */
  shieldMitigationAbsorbed?: number;
  /** Anteil des Boss-Rohschadens ans Schild: 0–100 */
  shieldMitigationEfficiencyPct?: number;
  architectPersonaId?: string;
  architectPersonaTitle?: string;
  architectPersonaFlavor?: string;
  hardcoreDriftRun?: boolean;
};
const buildEmptyCollection = (): Record<AchievementType, GlobalCollectionEntry> => ({
  PERFECT_SYNC: { count: 0, firstUnlocked: "" },
  IMMORTAL: { count: 0, firstUnlocked: "" },
  FAST_TRACK: { count: 0, firstUnlocked: "" },
  OVERKILL: { count: 0, firstUnlocked: "" },
  ARCHITECT_BADGE: { count: 0, firstUnlocked: "" },
});

type GameStore = {
  campaign: CampaignState;
  mission: MissionState;
  archiveWorkbenchSnippet: {
    lf: LearningField;
    lang: "sql" | "csharp";
    code: string;
    updatedAt: number;
  } | null;
  codexXp: number;
  codexCompletedCards: Record<string, boolean>;
  currentBossHP: number;
  maxBossHP: number;
  playerHP: number;
  maxPlayerHP: number;
  /** Sentinel-Schild 0…100 */
  playerShield: number;
  shieldShatterToken: number;
  sentinelAbsorbToken: number;
  combatShieldDamageAbsorbedTotal: number;
  combatBossRawDamageAttempted: number;
  bossEvolutionTimeScale: number;
  bossStrategyScanToken: number;
  bumpBossStrategyScan: () => void;
  /** Synaptic Flow 0–100 (Flow-State) */
  synapticFlow: number;
  /** Aufeinanderfolgende erfolgreiche Karten ohne Boss-Gegentreffer */
  combatComboCount: number;
  lastFlowSkillType: SkillType | null;
  /** performance.now()-Zeitstempel: Boss-Pulse eingefroren bis dahin */
  bossPulseFreezeUntilPerf: number;
  /** Nächster geplanter Boss-Puls (performance.now()), für Parry-Fenster */
  bossNextPulseDueAtPerf: number;
  /** Nächster Puls: kein Schild-Decay nach Mitigation (Perfect Parry) */
  skipShieldDecayNextPulse: boolean;
  /** Kurz true für Parry-VFX (Fadenkreuz-Flash) */
  isParrying: boolean;
  parryFeedbackToken: number;
  synapticOverloadToken: number;
  synapticOverloadActive: boolean;
  /** Phase 3 Singularity: Boss-HP unter 10 % */
  isSingularityActive: boolean;
  singularityEnteredToken: number;
  tickSynapticFlowDecay: (deltaSec: number) => void;
  triggerSynapticOverload: (skillId: SkillId) => void;
  gameState: GameState;
  activeLF: number;
  activePreset: NexusPresetId;
  debugLowHP: boolean;
  chromaticIntensity: number;
  vignetteStrength: number;
  timeScaleOverride: number;
  particleDensity: ParticleDensity;
  activeAudioTrackPath: string | null;
  audioBufferCount: number;
  bossPlaybackRate: number;
  bossAggressionLevel: number;
  isDataEncrypted: boolean;
  currentCombatPhase: 1 | 2;
  isTransitioning: boolean;
  combatPhaseTransitionToken: number;
  /** Aktuell laufender Theme-Loop: Phase 1 = trackPath, nach Übergang = phase2ThemePath */
  activeBossThemePath: string | null;
  cameraZoom: number;
  cameraShake: number;
  isCriticalPhase: boolean;
  lastBossDamage: number;
  lastPreHitBossHP: number;
  dataBleedFragments: number;
  startTime: number;
  totalDamageDealt: number;
  missedSkills: number;
  accuracyRate: number;
  timeGrade: "S" | "A" | "B" | "C";
  combatRank: "S" | "A" | "B" | "C";
  unlockedAchievements: AchievementType[];
  achievementBuffer: AchievementType[];
  rankSoundPlayedForVictory: boolean;
  rankAudioProfiles: Record<CombatRank, RankAudioProfile>;
  rankSoundMasterGain: number;
  sRankDuckingDb: number;
  cRankStaticLayerEnabled: boolean;
  audioTuningRevision: number;
  savedAudioPresets: StoredAudioPreset[];
  globalCollection: Record<AchievementType, GlobalCollectionEntry>;
  overlayOpenState: OverlayOpenState;
  /** Letzter erfolgreicher Daily-Ranked-Clear (UTC YYYY-MM-DD) */
  dailyRankedClearDateUtc: string | null;
  /** Aufeinanderfolgende Tage mit Daily-Ranked-Clear */
  dailyParticipationStreak: number;
  playerDailyBest: PlayerDailyBestPayload | null;
  /** Aktueller Kampf zählt für Daily-Board & Bonus */
  activeCombatIsDailyRanked: boolean;
  /** Tages-Inkursion-Sektor (Purpur-HUD / Layout) */
  activeCombatIsDailySector: boolean;
  /** Geheimer Sektor 0 — Shape-Shifter */
  activeCombatIsSectorZero: boolean;
  sectorZeroMorphLf: number;
  sectorZeroMorphSeed: number;
  sectorZeroMorphToken: number;
  /** UI-Farbthemen (CSS-Variablen, ohne Re-Render-Flut) */
  architectChromaActive: ArchitectChromaId;
  architectChromaUnlocks: Record<ArchitectChromaId, boolean>;
  /** Lesemodus: reduziert Partikel/Backdrop-Bewegung (CSS + Store) */
  readabilityMode: boolean;
  /** Präsentationsmodus: Pattern-Tooltips im Technical Dossier */
  examPresentationMode: boolean;
  setExamPresentationMode: (enabled: boolean) => void;
  /** Exam-Mode: Live-Logic-Flow Visualisierung — inkrementiert pro gespielter Karte */
  examLogicFlowToken: number;
  /** Aufeinanderfolgende korrekte Lernantworten (MC) im laufenden Kampf */
  learningMentorStreak: number;
  /** Zähler bei falscher Antwort — triggert Atmosphäre-/Audio-Glitch */
  learningMentorColdToken: number;
  /** Curriculum-Merge: Leitner + correctByLf an aktuelle Registry binden */
  mergeLocalKnowledgeWithRegistry: (registryFingerprint: string) => Promise<void>;
  /** Optional: versiegeltes .nxc an Webhook/Supabase senden */
  pushNexusCloudBackup: () => Promise<{ ok: boolean; message: string }>;
  setArchitectChroma: (id: ArchitectChromaId) => void;
  tryUnlockArchitectChroma: (id: Exclude<ArchitectChromaId, "default">) => void;
  setReadabilityMode: (enabled: boolean) => void;
  applySectorZeroMorphTick: () => void;
  gallerySeenTotal: number;
  killfeedActiveUntilMs: number;
  activeCombatBoosts: ActiveCombatBoosts;
  sRankStreak: number;
  bossAdaptivePulseToken: number;
  entryToken: number;
  preferredLearningExerciseId: string | null;
  damagePulseToken: number;
  criticalHitToken: number;
  finalStrikeToken: number;
  skillVfxToken: number;
  activeSkillVfx: SkillVfx | null;
  pendingDoubleHit: boolean;
  hand: SkillId[];
  /** Parallel zu `hand`: Seltenheit pro Slot (Beute / Präsentation) */
  handRarities: LootRarity[];
  deck: SkillId[];
  discard: SkillId[];
  isFinisherActive: boolean;
  victoryFinisherToken: number;
  victoryFinisherPhase: VictoryFinisherPhase;
  victoryFinisherComplete: boolean;
  isLootErupting: boolean;
  /** Endless Deep Dive: mehrere Boss-Etagen ohne Dossier bis Run-Ende */
  endlessDeepDiveActive: boolean;
  endlessFloor: number;
  /** Nach Loot: Warte auf nächsten Boss (kein Victory-Overlay) */
  endlessAwaitingBossSpawn: boolean;
  /** Erhöht nur bei neuem Kampf vom Overworld (Lore-Intro) */
  combatIntroNonce: number;
  impactFrameVariant: "standard" | "parry";
  /** Skill-Karte im holografischen Detail-Modus (blockiert Auto-Victory-UI) */
  identifiedSkillId: SkillId | null;
  skillBlueprintArchive: Partial<Record<SkillId, SkillBlueprintEntry>>;
  setIdentifiedSkill: (id: SkillId | null) => void;
  collectIdentifiedSkill: () => void;
  setVictoryFinisherPhase: (phase: VictoryFinisherPhase) => void;
  completeVictoryFinisher: () => void;
  completeLootEruption: () => void;
  spawnNextEndlessBoss: () => void;
  initiateCombat: (lf: number, maxBossHP: number, opts?: InitiateCombatOptions) => void;
  triggerBossHit: (damage: number) => void;
  playSkillCard: (skillId: SkillId) => void;
  drawCards: (targetHandSize?: number) => void;
  playCardFromHand: (skillId: SkillId) => void;
  setPlayerHP: (hp: number) => void;
  setChromaticIntensity: (value: number) => void;
  setVignetteStrength: (value: number) => void;
  setTimeScaleOverride: (value: number) => void;
  applyPreset: (presetId: NexusPresetId) => void;
  toggleLowHP: () => void;
  setAudioDebug: (trackPath: string | null, bufferCount: number) => void;
  setBossPlaybackRate: (value: number) => void;
  setBossAggressionLevel: (value: number) => void;
  triggerBossAdaptivePulse: () => void;
  triggerCriticalSlowMo: () => void;
  setKillfeedActiveFor: (durationMs: number) => void;
  triggerImpactZoom: () => void;
  /** 2-Frame Impact (Parry / Shatter) — synchron für PostFX & Audio */
  triggerImpactFrames: (variant?: "standard" | "parry") => void;
  impactFrameToken: number;
  resetCamera: () => void;
  declareVictory: () => void;
  declareDefeated: () => void;
  calculateRank: () => void;
  consumeNextAchievement: () => AchievementType | null;
  clearAchievementBuffer: () => void;
  markRankSoundPlayed: () => void;
  resetRankSoundPlayed: () => void;
  setRankSoundMasterGain: (value: number) => void;
  setSRankDuckingDb: (value: number) => void;
  setCRankStaticLayerEnabled: (enabled: boolean) => void;
  updateRankAudioProfile: (rank: CombatRank, patch: Partial<RankAudioProfile>) => void;
  resetAudioToDefault: () => void;
  saveAudioPreset: (name: string) => void;
  loadAudioPreset: (presetId: string) => void;
  deleteAudioPreset: (presetId: string) => void;
  archiveAchievements: (achievements?: AchievementType[]) => void;
  setOverlayOpenState: (state: OverlayOpenState) => void;
  markGallerySeen: () => void;
  recalculateCombatBoosts: () => void;
  resetCombat: () => void;
  /** Pro LF: Übungs-IDs, die mindestens einmal korrekt beantwortet wurden */
  learningCorrectByLf: Record<LearningField, string[]>;
  /** Pro LF: Architekt-Abzeichen bereits ins Vault gebucht */
  lfArchitectBadgeGranted: Partial<Record<LearningField, boolean>>;
  /** MC-Verlauf für den laufenden Kampf (bzw. Endlos-Strecke bis neuer initiateCombat) */
  lastCombatLearningEvents: CombatLearningEvent[];
  recordCombatLearningAttempt: (payload: {
    lf: LearningField;
    exerciseId: string;
    title: string;
    problem: string;
    mcQuestion: string;
    selectedOptionId: string;
    wasCorrect: boolean;
  }) => void;
  /** LF-Mastery / Abzeichen — nur nach Code- oder Zahlen-Lösung (nicht schon nach MC) */
  recordLearningExerciseMastery: (lf: LearningField, exerciseId: string) => void;
  /** Leitner + Ebbinghaus je Übungs-ID (Spaced Repetition) */
  learningLeitnerByExerciseId: Record<string, LeitnerCardState>;
  sourceMirrorSkillId: SkillId | null;
  setSourceMirrorSkill: (id: SkillId | null) => void;
  /** AES-GCM versiegeltes Nexus-Master-Dossier (Base64) nach Sektor-0-Sieg */
  nexusMasterCertificateSealed: string | null;
  issueNexusMasterCertificate: () => void;
  combatArchitectHistory: CombatArchitectReportEntry[];
  /** Idempotent: gleiche reportId (Run) wird nicht doppelt gespeichert */
  appendCombatArchitectReportIfNew: () => boolean;
  menuSystemMood: MenuSystemMood | null;
  recomputeMenuSystemMood: () => void;
  nexusFragments: number;
  /** Permanente Fragmente −5 % bei Niederlage; Sieg: doppelter Basis-Gewinn */
  hardcoreDriftEnabled: boolean;
  setHardcoreDriftEnabled: (enabled: boolean) => void;
  talentLevels: TalentLevels;
  upgradeTalentPath: (path: TalentPathId) => boolean;
  sectorAnomalies: Partial<Record<number, NexusAnomalyType>>;
  sectorAnomalyEpoch: number;
  sectorAnomalyReachFp: number;
  activeCombatAnomaly: NexusAnomalyType | null;
  anomalyRngSalt: number;
  anomalyDrawNonce: number;
  dataTurbulenceStamina: number;
  handAnomalyCosts: number[];
  regenerateSectorAnomalies: () => void;
  /** Persistiert: Erstnutzer-Onboarding (Neural Init + Trainingskampf) abgeschlossen */
  hasCompletedInitialization: boolean;
  /** LF1-Trainingskampf mit reduzierter Boss-Aggression */
  isTutorialCombatRun: boolean;
  /** 0…3 — erwartete Karten: Encrypt → Overclock → Recursion; 3 = alle Schritte erledigt */
  combatTutorialStep: number;
  completeInitialization: () => void;
  beginNeuralTrainingCombat: () => void;
  setPreferredLearningExerciseId: (exerciseId: string | null) => void;
  setActiveMissionContext: (lf: LearningField, missionId: string | null) => void;
  clearActiveMissionContext: () => void;
  markMissionCleared: (missionId: string) => void;
  setArchiveWorkbenchSnippet: (payload: {
    lf: LearningField;
    lang: "sql" | "csharp";
    code: string;
  }) => void;
  clearArchiveWorkbenchSnippet: () => void;
  completeCodexCard: (cardId: string) => void;
  isFirstBoot: boolean;
  tutorialStepIndex: number;
  completeFirstBoot: () => void;
  advanceTutorialStep: () => void;
  resetTutorialSequence: () => void;
  isTutorialAnimeUnlocked: boolean;
  unlockTutorialAnime: () => void;
};

export const useGameStore = create<GameStore>((set, get) => ({
  campaign: { unlockedSectors: [1], masteryChecks: {} },
  mission: { lf: null, missionId: null, status: "idle" },
  archiveWorkbenchSnippet: null,
  codexXp: 0,
  codexCompletedCards: {},
  isFirstBoot: true,
  tutorialStepIndex: 0,
  isTutorialAnimeUnlocked: false,
  currentBossHP: 100,
  maxBossHP: 100,
  playerHP: 100,
  maxPlayerHP: 100,
  playerShield: 0,
  shieldShatterToken: 0,
  sentinelAbsorbToken: 0,
  combatShieldDamageAbsorbedTotal: 0,
  combatBossRawDamageAttempted: 0,
  bossEvolutionTimeScale: 1,
  bossStrategyScanToken: 0,
  synapticFlow: 0,
  combatComboCount: 0,
  lastFlowSkillType: null,
  bossPulseFreezeUntilPerf: 0,
  bossNextPulseDueAtPerf: 0,
  skipShieldDecayNextPulse: false,
  isParrying: false,
  parryFeedbackToken: 0,
  synapticOverloadToken: 0,
  synapticOverloadActive: false,
  isSingularityActive: false,
  singularityEnteredToken: 0,
  gameState: "IDLE",
  activeLF: 1,
  activePreset: "STREAMER",
  debugLowHP: false,
  chromaticIntensity: 0.55,
  vignetteStrength: 1,
  timeScaleOverride: 1,
  particleDensity: "MEDIUM",
  activeAudioTrackPath: null,
  audioBufferCount: 0,
  bossPlaybackRate: 1,
  bossAggressionLevel: 1,
  isDataEncrypted: false,
  currentCombatPhase: 1,
  isTransitioning: false,
  combatPhaseTransitionToken: 0,
  activeBossThemePath: null,
  cameraZoom: 1,
  cameraShake: 0,
  isCriticalPhase: false,
  lastBossDamage: 0,
  lastPreHitBossHP: 0,
  dataBleedFragments: 0,
  startTime: 0,
  totalDamageDealt: 0,
  missedSkills: 0,
  accuracyRate: 0,
  timeGrade: "C",
  combatRank: "C",
  unlockedAchievements: [],
  achievementBuffer: [],
  rankSoundPlayedForVictory: false,
  rankAudioProfiles: RANK_AUDIO_PROFILES,
  rankSoundMasterGain: 1,
  sRankDuckingDb: RANK_AUDIO_PROFILES.S.ducking,
  cRankStaticLayerEnabled: true,
  audioTuningRevision: 0,
  savedAudioPresets: [],
  globalCollection: buildEmptyCollection(),
  overlayOpenState: "NONE",
  dailyRankedClearDateUtc: null,
  dailyParticipationStreak: 0,
  playerDailyBest: null,
  activeCombatIsDailyRanked: false,
  activeCombatIsDailySector: false,
  activeCombatIsSectorZero: false,
  sectorZeroMorphLf: 1,
  sectorZeroMorphSeed: 0,
  sectorZeroMorphToken: 0,
  architectChromaActive: "default",
  architectChromaUnlocks: {
    default: true,
    "deepsea-neon": false,
    "monochrome-glitch": false,
  },
  readabilityMode: false,
  examPresentationMode: false,
  examLogicFlowToken: 0,
  learningMentorStreak: 0,
  learningMentorColdToken: 0,
  gallerySeenTotal: 0,
  killfeedActiveUntilMs: 0,
  activeCombatBoosts: {
    criticalDamageMultiplier: 1,
    shieldStrengthMultiplier: 1,
    cardDrawMultiplier: 1,
    criticalResistanceMultiplier: 1,
  },
  sRankStreak: 0,
  bossAdaptivePulseToken: 0,
  entryToken: 0,
  preferredLearningExerciseId: null,
  damagePulseToken: 0,
  criticalHitToken: 0,
  finalStrikeToken: 0,
  skillVfxToken: 0,
  activeSkillVfx: null,
  pendingDoubleHit: false,
  hand: ["SKILL_01_OVERCLOCK", "SKILL_02_ENCRYPT", "SKILL_03_RECURSION"],
  deck: [
    "SKILL_01_OVERCLOCK",
    "SKILL_02_ENCRYPT",
    "SKILL_03_RECURSION",
    "SKILL_01_OVERCLOCK",
    "SKILL_02_ENCRYPT",
    "SKILL_03_RECURSION",
  ],
  discard: [],
  handRarities: ["COMMON", "COMMON", "COMMON"],
  isFinisherActive: false,
  victoryFinisherToken: 0,
  victoryFinisherPhase: "idle",
  victoryFinisherComplete: false,
  isLootErupting: false,
  endlessDeepDiveActive: false,
  endlessFloor: 1,
  endlessAwaitingBossSpawn: false,
  combatIntroNonce: 0,
  impactFrameVariant: "standard",
  identifiedSkillId: null,
  skillBlueprintArchive: {},

  setIdentifiedSkill: (id) => set({ identifiedSkillId: id }),

  setPreferredLearningExerciseId: (exerciseId) => set({ preferredLearningExerciseId: exerciseId }),
  setActiveMissionContext: (lf, missionId) =>
    set((state) => ({
      mission: {
        lf,
        missionId,
        status:
          missionId != null && state.mission.missionId === missionId && state.mission.status === "cleared"
            ? "cleared"
            : missionId
              ? "active"
              : "idle",
      },
    })),
  clearActiveMissionContext: () => set({ mission: { lf: null, missionId: null, status: "idle" } }),
  markMissionCleared: (missionId) =>
    set((state) =>
      state.mission.missionId === missionId
        ? { mission: { ...state.mission, status: "cleared" } }
        : {}
    ),
  setArchiveWorkbenchSnippet: (payload) =>
    set({
      archiveWorkbenchSnippet: { ...payload, updatedAt: Date.now() },
      preferredLearningExerciseId: null,
      mission: { lf: payload.lf, missionId: payload.lang, status: "active" },
    }),
  clearArchiveWorkbenchSnippet: () => set({ archiveWorkbenchSnippet: null }),
  completeCodexCard: (cardId) =>
    set((state) => {
      if (state.codexCompletedCards[cardId]) return {};
      return {
        codexCompletedCards: { ...state.codexCompletedCards, [cardId]: true },
        codexXp: state.codexXp + 25,
      };
    }),
  completeFirstBoot: () => {
    try {
      localStorage.setItem(FIRST_BOOT_COMPLETE_KEY, "1");
    } catch {
      // no-op
    }
    set({ isFirstBoot: false, tutorialStepIndex: 0 });
  },
  advanceTutorialStep: () =>
    set((state) => ({ tutorialStepIndex: Math.min(state.tutorialStepIndex + 1, 2) })),
  resetTutorialSequence: () => set({ tutorialStepIndex: 0 }),
  unlockTutorialAnime: () => {
    try {
      localStorage.setItem(TUTORIAL_ANIME_UNLOCK_KEY, "1");
    } catch {
      // no-op
    }
    set({ isTutorialAnimeUnlocked: true });
  },

  collectIdentifiedSkill: () => {
    const id = get().identifiedSkillId;
    if (!id) return;
    set((state) => {
      const prev = state.skillBlueprintArchive[id];
      const nextArchive = {
        ...state.skillBlueprintArchive,
        [id]: {
          count: (prev?.count ?? 0) + 1,
          firstUnlocked: prev?.firstUnlocked ?? new Date().toISOString(),
        },
      };
      return {
        skillBlueprintArchive: nextArchive,
        identifiedSkillId: null,
      };
    });
    try {
      localStorage.setItem(
        SKILL_BLUEPRINT_ARCHIVE_KEY,
        JSON.stringify(get().skillBlueprintArchive)
      );
    } catch {
      // no-op
    }
  },

  setVictoryFinisherPhase: (phase) => set({ victoryFinisherPhase: phase }),

  completeVictoryFinisher: () =>
    set((state) => ({
      isFinisherActive: false,
      victoryFinisherPhase: "idle",
      victoryFinisherComplete: true,
      isLootErupting: true,
      handRarities: state.hand.map(() => rollLootRarity()),
    })),

  completeLootEruption: () => {
    const s = get();
    if (s.endlessDeepDiveActive) {
      set({ isLootErupting: false, endlessAwaitingBossSpawn: true });
      window.setTimeout(() => {
        get().spawnNextEndlessBoss();
      }, 2000);
      return;
    }
    set({ isLootErupting: false });
  },

  spawnNextEndlessBoss: () => {
    clearCombatPhaseTransitionFinishTimer();
    set((state) => {
      if (!state.endlessDeepDiveActive) return {};
      const nextFloor = state.endlessFloor + 1;
      if (nextFloor === 10) {
        get().tryUnlockArchitectChroma("deepsea-neon");
      }
      const nextLfNum = (state.activeLF % 12) + 1;
      const hpMult = state.endlessFloor < 10 ? 1.15 : 1;
      const spdMult = state.endlessFloor < 10 ? 1.05 : 1;
      const newMaxHp = Math.max(1, Math.round(state.maxBossHP * hpMult));
      const newScale = Math.min(1.85, state.bossEvolutionTimeScale * spdMult);
      return {
        endlessFloor: nextFloor,
        endlessAwaitingBossSpawn: false,
        activeLF: nextLfNum,
        maxBossHP: newMaxHp,
        currentBossHP: newMaxHp,
        bossEvolutionTimeScale: newScale,
        gameState: "FIGHTING",
        isFinisherActive: false,
        victoryFinisherPhase: "idle",
        victoryFinisherComplete: false,
        isLootErupting: false,
        currentCombatPhase: 1,
        isTransitioning: false,
        combatPhaseTransitionToken: 0,
        isCriticalPhase: false,
        isSingularityActive: false,
        entryToken: state.entryToken + 1,
        dataBleedFragments: 0,
        lastBossDamage: 0,
        lastPreHitBossHP: newMaxHp,
        pendingDoubleHit: false,
        bossAdaptivePulseToken: state.bossAdaptivePulseToken + 1,
        bossNextPulseDueAtPerf: 0,
        bossPulseFreezeUntilPerf: 0,
        skipShieldDecayNextPulse: false,
      };
    });
  },

  initiateCombat: (lf, maxBossHP, opts) => {
    if (lf === 0 && get().isTutorialCombatRun) return;
    clearCombatPhaseTransitionFinishTimer();
    /** Frischer Zufall pro Kampfstart: Sector-Ø-Morph, Anomalie-Kosten und RNG-Salz entkoppeln vom letzten Run */
    const salt = (Math.random() * 0x7fffffff) | 0;
    set((state) => {
      const sectorZero = lf === 0;
      const lfC = sectorZero ? 0 : Math.max(1, Math.min(12, lf));
      const tutorial = state.isTutorialCombatRun;
      const daily = getDailyIncursionDefinition();
      const applyDaily =
        Boolean(opts?.applyDailyRules) && !tutorial && lfC !== 0 && lfC === daily.targetLf;
      const ranked = Boolean(opts?.dailyRanked) && applyDaily;
      const endless = Boolean(opts?.endlessDeepDive) && !applyDaily && lfC !== 0;
      let anomaly: NexusAnomalyType | null = null;
      let startCombatPhase: 1 | 2 = 1;
      let costs = state.hand.map(() => 0);
      let morphLf = 1;
      let morphSeed = salt >>> 0;

      if (sectorZero) {
        const morph = rollSectorZeroMorph(salt >>> 0);
        morphLf = morph.morphLf;
        morphSeed = salt >>> 0;
        anomaly = morph.anomaly;
        startCombatPhase = morph.phase;
        const turbRng = createSeededRandom((salt ^ 0x9e3779b9) >>> 0);
        costs =
          anomaly === "DATA_TURBULENCE"
            ? rollHandCosts(state.hand.length, turbRng)
            : state.hand.map(() => 0);
      } else {
        const anomalyBase = state.sectorAnomalies[lfC] ?? null;
        anomaly = applyDaily ? (daily.anomalies[lfC] ?? anomalyBase) : anomalyBase;
        startCombatPhase = applyDaily ? daily.startCombatPhase : 1;
        const turbRng = createSeededRandom((salt ^ 0x9e3779b9) >>> 0);
        costs =
          anomaly === "DATA_TURBULENCE"
            ? rollHandCosts(state.hand.length, turbRng)
            : state.hand.map(() => 0);
      }

      return {
        activeLF: lfC,
        maxBossHP,
        currentBossHP: maxBossHP,
        currentCombatPhase: startCombatPhase,
        isTransitioning: false,
        combatPhaseTransitionToken: 0,
        activeBossThemePath: null,
        isCriticalPhase: false,
        startTime: Date.now(),
        totalDamageDealt: 0,
        missedSkills: 0,
        accuracyRate: 0,
        timeGrade: "C",
        combatRank: "C",
        sRankStreak: 0,
        /** Neuer Run vom Overworld: MC-Verlauf für Wissens-Analyse zurücksetzen */
        lastCombatLearningEvents: [],
        unlockedAchievements: [],
        achievementBuffer: [],
        rankSoundPlayedForVictory: false,
        isFinisherActive: false,
        victoryFinisherToken: 0,
        victoryFinisherPhase: "idle",
        victoryFinisherComplete: false,
        isLootErupting: false,
        endlessDeepDiveActive: endless,
        endlessFloor: 1,
        endlessAwaitingBossSpawn: false,
        combatIntroNonce: state.combatIntroNonce + 1,
        gameState: "STARTING",
        entryToken: state.entryToken + 1,
        damagePulseToken: state.damagePulseToken,
        criticalHitToken: state.criticalHitToken,
        finalStrikeToken: state.finalStrikeToken,
        handRarities: state.hand.map(() => "COMMON" as LootRarity),
        identifiedSkillId: null,
        activeCombatAnomaly: anomaly,
        activeCombatIsDailyRanked: ranked,
        activeCombatIsDailySector: applyDaily,
        activeCombatIsSectorZero: sectorZero,
        sectorZeroMorphLf: morphLf,
        sectorZeroMorphSeed: morphSeed,
        sectorZeroMorphToken: 0,
        anomalyRngSalt: salt,
        anomalyDrawNonce: 0,
        dataTurbulenceStamina: anomaly === "DATA_TURBULENCE" ? 7 : 0,
        handAnomalyCosts: costs,
        playerShield: 0,
        shieldShatterToken: 0,
        sentinelAbsorbToken: 0,
        combatShieldDamageAbsorbedTotal: 0,
        combatBossRawDamageAttempted: 0,
        bossEvolutionTimeScale: 1,
        bossStrategyScanToken: 0,
        synapticFlow: 0,
        combatComboCount: 0,
        lastFlowSkillType: null,
        bossPulseFreezeUntilPerf: 0,
        bossNextPulseDueAtPerf: 0,
        skipShieldDecayNextPulse: false,
        isParrying: false,
        parryFeedbackToken: 0,
        synapticOverloadToken: 0,
        synapticOverloadActive: false,
        isSingularityActive: false,
        singularityEnteredToken: 0,
        learningMentorStreak: 0,
        learningMentorColdToken: 0,
        examLogicFlowToken: 0,
        preferredLearningExerciseId: null,
        archiveWorkbenchSnippet: null,
        mission: { lf: null, missionId: null, status: "idle" as const },
      };
    });
    get().recalculateCombatBoosts();
  },

  applySectorZeroMorphTick: () => {
    const state = get();
    if (!state.activeCombatIsSectorZero) return;
    const seed = (state.sectorZeroMorphSeed ^ state.sectorZeroMorphToken ^ Date.now()) >>> 0;
    const m = rollSectorZeroMorph(seed);
    const turbRng = createSeededRandom((seed ^ 0x9e3779b9) >>> 0);
    const costs =
      m.anomaly === "DATA_TURBULENCE"
        ? rollHandCosts(state.hand.length, turbRng)
        : state.hand.map(() => 0);
    clearCombatPhaseTransitionFinishTimer();
    let isTransitioning = false;
    let cpt = state.combatPhaseTransitionToken;
    if (m.phaseSwap && state.currentCombatPhase === 1 && m.phase === 2) {
      isTransitioning = true;
      cpt += 1;
      scheduleCombatPhaseTransitionFinish();
    }
    set({
      sectorZeroMorphLf: m.morphLf,
      sectorZeroMorphSeed: seed,
      sectorZeroMorphToken: state.sectorZeroMorphToken + 1,
      currentCombatPhase: m.phase,
      activeCombatAnomaly: m.anomaly,
      isTransitioning,
      combatPhaseTransitionToken: cpt,
      handAnomalyCosts: costs,
      dataTurbulenceStamina: m.anomaly === "DATA_TURBULENCE" ? 7 : 0,
      anomalyRngSalt: seed,
    });
  },

  setArchitectChroma: (id) => {
    const u = get().architectChromaUnlocks;
    if (!u[id]) return;
    applyArchitectChromaToDocument(id);
    persistArchitectChromaActive(id);
    set({ architectChromaActive: id });
  },

  tryUnlockArchitectChroma: (id) => {
    const state = get();
    if (state.architectChromaUnlocks[id]) return;
    const next = { ...state.architectChromaUnlocks, [id]: true };
    persistArchitectChromaUnlocks(next);
    set({ architectChromaUnlocks: next });
  },

  setReadabilityMode: (enabled) => {
    persistReadabilityMode(enabled);
    applyReadabilityToDocument(enabled);
    set({ readabilityMode: enabled });
  },

  triggerBossHit: (damage) => {
    const before = get();
    const { critM, resistM } = outgoingDamageMultipliers(
      before.activeCombatBoosts,
      before.activeCombatAnomaly
    );
    const boostedDamage = Math.round(Math.max(0, damage) * critM * resistM);
    const appliedDamage = before.pendingDoubleHit ? boostedDamage * 2 : boostedDamage;
    const nextHp = Math.max(0, before.currentBossHP - appliedDamage);
    const halfHp =
      before.maxBossHP > 0 ? before.maxBossHP * 0.5 : Number.POSITIVE_INFINITY;
    const crossedPhase =
      before.currentCombatPhase === 1 &&
      !before.isTransitioning &&
      before.currentBossHP > halfHp &&
      nextHp <= halfHp;

    set((state) => {
      const { critM, resistM } = outgoingDamageMultipliers(
        state.activeCombatBoosts,
        state.activeCombatAnomaly
      );
      const boosted = Math.round(Math.max(0, damage) * critM * resistM);
      const applied = state.pendingDoubleHit ? boosted * 2 : boosted;
      const next = Math.max(0, state.currentBossHP - applied);
      const h = state.maxBossHP > 0 ? state.maxBossHP * 0.5 : Number.POSITIVE_INFINITY;
      const cross =
        state.currentCombatPhase === 1 &&
        !state.isTransitioning &&
        state.currentBossHP > h &&
        next <= h;
      const isFinalStrike = next === 0 && state.currentBossHP > 0;
      const fragmentCount = Math.max(6, Math.min(44, Math.round(applied * 0.9)));
      const critical = next < state.maxBossHP * 0.2;
      const criticalHit =
        critM > 1 &&
        state.activeCombatBoosts.criticalResistanceMultiplier >= 1 &&
        applied >= 16;
      return {
        lastPreHitBossHP: state.currentBossHP,
        currentBossHP: next,
        gameState: next > 0 ? "FIGHTING" : "VICTORY",
        damagePulseToken: state.damagePulseToken + 1,
        pendingDoubleHit: false,
        isCriticalPhase: critical,
        lastBossDamage: applied,
        totalDamageDealt: state.totalDamageDealt + applied,
        dataBleedFragments: fragmentCount,
        criticalHitToken: criticalHit
          ? state.criticalHitToken + 1
          : state.criticalHitToken,
        finalStrikeToken: isFinalStrike
          ? state.finalStrikeToken + 1
          : state.finalStrikeToken,
        ...(next === 0
          ? {
              isFinisherActive: true,
              victoryFinisherComplete: false,
              isLootErupting: false,
              victoryFinisherToken: state.victoryFinisherToken + 1,
              victoryFinisherPhase: "implode" as VictoryFinisherPhase,
            }
          : {}),
        ...(cross
          ? {
              isTransitioning: true,
              combatPhaseTransitionToken: state.combatPhaseTransitionToken + 1,
            }
          : {}),
      };
    });
    if (crossedPhase) {
      scheduleCombatPhaseTransitionFinish();
    }
  },

  playSkillCard: (skillId) => {
    const phaseSchedule = { cross: false };
    const impactSchedule = { parry: false };
    set((state) => {
      const skill = skillRegistry[skillId];
      if (!skill) return {};

      if (skill.type === "ATTACK") {
        const dmg = skill.damage ?? 0;
        const { critM, resistM } = outgoingDamageMultipliers(
          state.activeCombatBoosts,
          state.activeCombatAnomaly
        );
        const flowMul = damageMultiplierForFlow(state.synapticFlow);
        const scaledDamage = Math.round(dmg * critM * resistM * flowMul);
        const appliedDamage = state.pendingDoubleHit ? scaledDamage * 2 : scaledDamage;
        const nextHp = Math.max(0, state.currentBossHP - appliedDamage);
        const h = state.maxBossHP > 0 ? state.maxBossHP * 0.5 : Number.POSITIVE_INFINITY;
        const crossPhase =
          state.currentCombatPhase === 1 &&
          !state.isTransitioning &&
          state.currentBossHP > h &&
          nextHp <= h;
        if (crossPhase) phaseSchedule.cross = true;
        const isFinalStrike = nextHp === 0 && state.currentBossHP > 0;
        const fragmentCount = Math.max(
          6,
          Math.min(44, Math.round(appliedDamage * 0.9))
        );
        const critical = nextHp < state.maxBossHP * 0.2;
        const criticalHit =
          critM > 1 &&
          state.activeCombatBoosts.criticalResistanceMultiplier >= 1 &&
          appliedDamage >= 16;
        const flowUp = applyFlowAfterSuccessfulCard(
          state.synapticFlow,
          state.combatComboCount,
          state.lastFlowSkillType,
          skill.type
        );
        return {
          lastPreHitBossHP: state.currentBossHP,
          currentBossHP: nextHp,
          gameState: nextHp > 0 ? "FIGHTING" : "VICTORY",
          damagePulseToken: state.damagePulseToken + 1,
          skillVfxToken: state.skillVfxToken + 1,
          activeSkillVfx: skill.vfx,
          pendingDoubleHit: false,
          isCriticalPhase: critical,
          lastBossDamage: appliedDamage,
          totalDamageDealt: state.totalDamageDealt + appliedDamage,
          dataBleedFragments: fragmentCount,
          criticalHitToken: criticalHit
            ? state.criticalHitToken + 1
            : state.criticalHitToken,
          finalStrikeToken: isFinalStrike
            ? state.finalStrikeToken + 1
            : state.finalStrikeToken,
          ...flowUp,
          ...(nextHp === 0
            ? {
                isFinisherActive: true,
                victoryFinisherComplete: false,
                isLootErupting: false,
                victoryFinisherToken: state.victoryFinisherToken + 1,
                victoryFinisherPhase: "implode" as VictoryFinisherPhase,
              }
            : {}),
          ...(crossPhase
            ? {
                isTransitioning: true,
                combatPhaseTransitionToken: state.combatPhaseTransitionToken + 1,
              }
            : {}),
        };
      }

      if (skill.type === "DEFENSE") {
        const rawGain = computeShieldPulseHeal({
          skillShieldPower: skill.shield ?? 0,
          shieldStrengthMultiplier: state.activeCombatBoosts.shieldStrengthMultiplier,
          anomaly: state.activeCombatAnomaly,
        });
        const gain = state.isSingularityActive ? 0 : rawGain;
        const nextShield = Math.min(MAX_PLAYER_SHIELD, state.playerShield + gain);
        const nowPerf = performance.now();
        const parry =
          state.gameState === "FIGHTING" &&
          isPerfectParryWindow(nowPerf, state.bossNextPulseDueAtPerf);
        let flowDef = applyFlowAfterSuccessfulCard(
          state.synapticFlow,
          state.combatComboCount,
          state.lastFlowSkillType,
          skill.type
        );
        if (parry) {
          impactSchedule.parry = true;
          flowDef = {
            ...flowDef,
            synapticFlow: Math.min(100, flowDef.synapticFlow + PARRY_FLOW_RESTORE),
          };
          window.setTimeout(() => {
            useGameStore.setState({ isParrying: false });
          }, 220);
        }
        return {
          skillVfxToken: state.skillVfxToken + 1,
          activeSkillVfx: skill.vfx,
          playerShield: nextShield,
          isCriticalPhase: state.currentBossHP < state.maxBossHP * 0.2,
          lastBossDamage: 0,
          lastPreHitBossHP: state.currentBossHP,
          dataBleedFragments: 0,
          ...flowDef,
          skipShieldDecayNextPulse: parry ? true : state.skipShieldDecayNextPulse,
          isParrying: parry,
          parryFeedbackToken: parry ? state.parryFeedbackToken + 1 : state.parryFeedbackToken,
        };
      }

      if (skill.type === "SPECIAL" && skill.effect === "DOUBLE_NEXT_HIT") {
        const flowSp = applyFlowAfterSuccessfulCard(
          state.synapticFlow,
          state.combatComboCount,
          state.lastFlowSkillType,
          skill.type
        );
        return {
          pendingDoubleHit: true,
          skillVfxToken: state.skillVfxToken + 1,
          activeSkillVfx: skill.vfx,
          isCriticalPhase: state.currentBossHP < state.maxBossHP * 0.2,
          lastBossDamage: 0,
          lastPreHitBossHP: state.currentBossHP,
          dataBleedFragments: 0,
          missedSkills: state.missedSkills + 1,
          ...flowSp,
        };
      }

      const flowFb = applyFlowAfterSuccessfulCard(
        state.synapticFlow,
        state.combatComboCount,
        state.lastFlowSkillType,
        skill.type
      );
      return {
        skillVfxToken: state.skillVfxToken + 1,
        activeSkillVfx: skill.vfx,
        isCriticalPhase: state.currentBossHP < state.maxBossHP * 0.2,
        lastBossDamage: 0,
        lastPreHitBossHP: state.currentBossHP,
        dataBleedFragments: 0,
        missedSkills: state.missedSkills + 1,
        ...flowFb,
      };
    });
    if (impactSchedule.parry) {
      queueMicrotask(() => get().triggerImpactFrames("parry"));
    }
    if (phaseSchedule.cross) {
      scheduleCombatPhaseTransitionFinish();
    }
  },

  drawCards: (targetHandSize = 3) =>
    set((state) => {
      const effectiveTargetHandSize = Math.max(
        targetHandSize,
        Math.ceil(targetHandSize * state.activeCombatBoosts.cardDrawMultiplier)
      );
      const hand = [...state.hand];
      let deck = [...state.deck];
      let discard = [...state.discard];

      while (hand.length < effectiveTargetHandSize) {
        if (deck.length === 0) {
          if (discard.length === 0) break;
          deck = [...discard];
          discard = [];
        }
        const next = deck.shift();
        if (!next) break;
        hand.push(next);
      }

      const handRarities = hand.map((skillId, i) =>
        i < state.hand.length && state.hand[i] === skillId
          ? state.handRarities[i] ?? "COMMON"
          : "COMMON"
      );
      let handAnomalyCosts = state.handAnomalyCosts;
      let dataTurbulenceStamina = state.dataTurbulenceStamina;
      let anomalyDrawNonce = state.anomalyDrawNonce;
      if (state.activeCombatAnomaly === "DATA_TURBULENCE") {
        const rng = createSeededRandom(
          (state.anomalyRngSalt ^ anomalyDrawNonce * 0x85ebca6b ^ hand.length * 13) >>> 0
        );
        handAnomalyCosts = rollHandCosts(hand.length, rng);
        dataTurbulenceStamina = nextDataTurbulenceStamina(state.dataTurbulenceStamina);
        anomalyDrawNonce += 1;
      }
      return { hand, deck, discard, handRarities, handAnomalyCosts, dataTurbulenceStamina, anomalyDrawNonce };
    }),

  playCardFromHand: (skillId) => {
    const state = get();
    if (!state.hand.includes(skillId)) return;
    const handIdx = state.hand.indexOf(skillId);

    if (state.activeCombatAnomaly === "DATA_TURBULENCE") {
      const cost = state.handAnomalyCosts[handIdx] ?? 0;
      if (state.dataTurbulenceStamina < cost) return;
    }

    if (state.activeCombatAnomaly === "GLITCH_STORM") {
      const sk = skillRegistry[skillId];
      if (sk?.type === "ATTACK") {
        const rng = createSeededRandom(
          (state.anomalyRngSalt ^ handIdx * 131 ^ state.damagePulseToken * 17) >>> 0
        );
        if (rollGlitchMiss(rng)) {
          set((prev) => ({
            hand: prev.hand.filter((id) => id !== skillId),
            handRarities: prev.handRarities.filter((_, i) => i !== handIdx),
            discard: [...prev.discard, skillId],
            missedSkills: prev.missedSkills + 1,
            skillVfxToken: prev.skillVfxToken + 1,
            activeSkillVfx: sk.vfx,
            lastBossDamage: 0,
            lastPreHitBossHP: prev.currentBossHP,
            dataBleedFragments: 0,
            ...applyFlowAfterGlitchMiss(prev.synapticFlow),
          }));
          get().drawCards(3);
          return;
        }
      }
    }

    const costTurb = state.handAnomalyCosts[handIdx] ?? 0;

    set((prev) => ({
      hand: prev.hand.filter((id) => id !== skillId),
      handRarities: prev.handRarities.filter((_, i) => i !== handIdx),
      discard: [...prev.discard, skillId],
      ...(prev.activeCombatAnomaly === "DATA_TURBULENCE"
        ? { dataTurbulenceStamina: prev.dataTurbulenceStamina - costTurb }
        : {}),
    }));

    get().playSkillCard(skillId);
    get().drawCards(3);

    if (get().examPresentationMode) {
      set((s) => ({ examLogicFlowToken: s.examLogicFlowToken + 1 }));
    }

    const post = get();
    if (
      post.isTutorialCombatRun &&
      (post.gameState === "FIGHTING" || post.gameState === "STARTING")
    ) {
      const order: SkillId[] = [
        "SKILL_02_ENCRYPT",
        "SKILL_01_OVERCLOCK",
        "SKILL_03_RECURSION",
      ];
      const st = post.combatTutorialStep;
      if (st < order.length && skillId === order[st]) {
        set({ combatTutorialStep: st + 1 });
      }
    }
  },

  setPlayerHP: (hp) =>
    set((state) => ({
      playerHP: Math.max(0, Math.min(state.maxPlayerHP, hp)),
    })),

  setChromaticIntensity: (value) =>
    set({ chromaticIntensity: Math.max(0, Math.min(2, value)) }),

  setVignetteStrength: (value) =>
    set({ vignetteStrength: Math.max(0, Math.min(2, value)) }),

  setTimeScaleOverride: (value) =>
    set({ timeScaleOverride: Math.max(0.5, Math.min(1.25, value)) }),

  applyPreset: (presetId) => {
    const preset = nexusPresets[presetId];
    set({
      activePreset: presetId,
      vignetteStrength: Math.max(0.35, Math.min(2, preset.vignette)),
      chromaticIntensity: Math.max(0, Math.min(2, preset.chromatic)),
      timeScaleOverride: Math.max(0.5, Math.min(1.25, preset.slowMo)),
      particleDensity: preset.particleDensity,
    });
  },

  toggleLowHP: () =>
    set((state) => ({
      debugLowHP: !state.debugLowHP,
      playerHP: !state.debugLowHP
        ? Math.max(1, Math.round(state.maxPlayerHP * 0.18))
        : state.maxPlayerHP,
    })),

  setAudioDebug: (trackPath, bufferCount) =>
    set({ activeAudioTrackPath: trackPath, audioBufferCount: bufferCount }),

  setBossPlaybackRate: (value) =>
    set({ bossPlaybackRate: Math.max(0.5, Math.min(1.25, value)) }),
  setBossAggressionLevel: (value) => {
    const level = Math.max(1, Math.min(5, Math.round(value)));
    set({ bossAggressionLevel: level, isDataEncrypted: level === 5 });
  },

  bumpBossStrategyScan: () =>
    set((state) => ({ bossStrategyScanToken: state.bossStrategyScanToken + 1 })),

  tickSynapticFlowDecay: (deltaSec) =>
    set((state) => {
      if (state.gameState !== "FIGHTING" && state.gameState !== "STARTING") {
        return {};
      }
      const next = applyFlowDecay(state.synapticFlow, deltaSec);
      if (next === state.synapticFlow) return {};
      return { synapticFlow: next };
    }),

  triggerSynapticOverload: (skillId) => {
    const before = get();
    if (before.gameState !== "FIGHTING" || before.synapticFlow < 100) return;
    if (!before.hand.includes(skillId)) return;
    const handIdx = before.hand.indexOf(skillId);
    if (before.activeCombatAnomaly === "DATA_TURBULENCE") {
      const cost = before.handAnomalyCosts[handIdx] ?? 0;
      if (before.dataTurbulenceStamina < cost) return;
    }
    const skill = skillRegistry[skillId];
    if (!skill) return;
    const dmg = computeSynapticOverloadDamage(skill, before.maxBossHP);
    const freezeUntil = performance.now() + SYNAPTIC_OVERLOAD_FREEZE_MS;
    const costTurb = before.handAnomalyCosts[handIdx] ?? 0;

    set((state) => ({
      hand: state.hand.filter((id) => id !== skillId),
      handRarities: state.handRarities.filter((_, i) => i !== handIdx),
      discard: [...state.discard, skillId],
      ...(state.activeCombatAnomaly === "DATA_TURBULENCE"
        ? { dataTurbulenceStamina: state.dataTurbulenceStamina - costTurb }
        : {}),
      synapticFlow: 0,
      combatComboCount: 0,
      lastFlowSkillType: null,
      bossPulseFreezeUntilPerf: freezeUntil,
      synapticOverloadToken: state.synapticOverloadToken + 1,
      synapticOverloadActive: true,
    }));

    window.setTimeout(() => {
      useGameStore.setState({ synapticOverloadActive: false });
    }, SYNAPTIC_OVERLOAD_FX_MS);

    get().drawCards(3);
    get().triggerBossHit(dmg);
  },

  triggerBossAdaptivePulse: () => {
    let shatterImpact = false;
    let defeated = false;
    set((state) => {
      if (state.gameState !== "FIGHTING") {
        return { bossAdaptivePulseToken: state.bossAdaptivePulseToken + 1 };
      }
      if (performance.now() < state.bossPulseFreezeUntilPerf) {
        return {};
      }
      const token = state.bossAdaptivePulseToken + 1;
      const raw = computeBossStrikeDamage(
        state.bossAggressionLevel,
        state.maxBossHP,
        state.currentCombatPhase
      );
      const pierceFrac =
        state.maxBossHP > 0 && state.currentBossHP / state.maxBossHP < 0.25 ? 0.1 : 0;
      const preShield = state.playerShield;
      const mit = mitigateBossDamageOnPlayer(
        state.playerHP,
        state.maxPlayerHP,
        state.playerShield,
        raw,
        state.activeCombatBoosts.shieldStrengthMultiplier,
        state.activeCombatAnomaly,
        pierceFrac
      );
      let nextShield = mit.nextShield;
      if (!state.skipShieldDecayNextPulse) {
        nextShield = applyRoundEndShieldDecay(nextShield);
      }
      nextShield = Math.min(MAX_PLAYER_SHIELD, nextShield);
      const broke = preShield > 0 && nextShield <= 0;
      if (broke) shatterImpact = true;
      const absorbed = mit.absorbedByShield > 0;
      const gameOver = mit.nextHP <= 0;
      if (gameOver) defeated = true;
      const hardcoreLoss =
        gameOver && state.hardcoreDriftEnabled && state.nexusFragments > 0
          ? Math.max(1, Math.floor(state.nexusFragments * 0.05))
          : 0;
      const tookHit = mit.nextHP < state.playerHP || mit.absorbedByShield > 0;
      const flowHit = tookHit ? applyFlowAfterBossCounterHit(state.synapticFlow) : {};
      return {
        bossAdaptivePulseToken: token,
        playerHP: mit.nextHP,
        playerShield: nextShield,
        combatShieldDamageAbsorbedTotal:
          state.combatShieldDamageAbsorbedTotal + mit.absorbedByShield,
        combatBossRawDamageAttempted: state.combatBossRawDamageAttempted + raw,
        ...flowHit,
        ...(broke ? { shieldShatterToken: state.shieldShatterToken + 1 } : {}),
        ...(absorbed ? { sentinelAbsorbToken: state.sentinelAbsorbToken + 1 } : {}),
        ...(gameOver
          ? {
              gameState: "DEFEATED" as GameState,
              ...(hardcoreLoss > 0
                ? {
                    nexusFragments: Math.max(0, state.nexusFragments - hardcoreLoss),
                  }
                : {}),
            }
          : {}),
        skipShieldDecayNextPulse: false,
      };
    });
    if (shatterImpact) {
      queueMicrotask(() => get().triggerImpactFrames());
    }
    if (defeated) {
      const s = get();
      persistNeuralAugmentsSnapshot(s.nexusFragments, s.talentLevels);
    }
  },
  triggerCriticalSlowMo: () => {
    const previous = get().timeScaleOverride;
    const nowMs = Date.now();
    set({ killfeedActiveUntilMs: nowMs + 400 });
    set({ timeScaleOverride: 0.2 });
    window.setTimeout(() => {
      set({ timeScaleOverride: previous });
    }, 150);
    window.setTimeout(() => {
      const s = get();
      if (Date.now() >= s.killfeedActiveUntilMs) {
        set({ killfeedActiveUntilMs: 0 });
      }
    }, 410);
  },
  setKillfeedActiveFor: (durationMs) =>
    set({ killfeedActiveUntilMs: Date.now() + Math.max(0, durationMs) }),

  triggerImpactZoom: () => {
    set({ cameraZoom: 1.15, cameraShake: 1 });
    window.setTimeout(() => {
      set({ cameraZoom: 1, cameraShake: 0 });
    }, 200);
  },

  resetCamera: () => {
    set({ cameraZoom: 1, cameraShake: 0 });
  },

  declareVictory: () => {
    set((state) => ({
      gameState: "VICTORY",
      currentBossHP: 0,
      isCriticalPhase: true,
      unlockedAchievements: [],
      achievementBuffer: [],
      rankSoundPlayedForVictory: false,
      isFinisherActive: true,
      victoryFinisherComplete: false,
      isLootErupting: false,
      victoryFinisherToken: state.victoryFinisherToken + 1,
      victoryFinisherPhase: "implode",
    }));
    get().calculateRank();
  },

  declareDefeated: () => {
    set((state) => {
      if (!state.hardcoreDriftEnabled || state.nexusFragments <= 0) {
        return { gameState: "DEFEATED" as const };
      }
      const loss = Math.max(1, Math.floor(state.nexusFragments * 0.05));
      return {
        gameState: "DEFEATED" as const,
        nexusFragments: Math.max(0, state.nexusFragments - loss),
      };
    });
    const s = get();
    persistNeuralAugmentsSnapshot(s.nexusFragments, s.talentLevels);
  },

  calculateRank: () => {
    const state = get();
    const elapsedSec =
      state.startTime > 0 ? Math.max(1, (Date.now() - state.startTime) / 1000) : 999;
    const skillUses = state.damagePulseToken + state.missedSkills;
    const accuracy =
      skillUses > 0 ? state.damagePulseToken / Math.max(1, skillUses) : 0;
    let timeGrade: "S" | "A" | "B" | "C" = "C";
    if (elapsedSec <= 90) timeGrade = "S";
    else if (elapsedSec <= 150) timeGrade = "A";
    else if (elapsedSec <= 240) timeGrade = "B";

    let rank: "S" | "A" | "B" | "C" = "C";
    if (accuracy >= 0.9 && elapsedSec <= 90) rank = "S";
    else if (accuracy >= 0.75 && elapsedSec <= 150) rank = "A";
    else if (accuracy >= 0.55 && elapsedSec <= 240) rank = "B";
    const unlockPerfectSync = rank === "S" && state.missedSkills === 0;
    const unlockImmortal = rank === "S" && state.playerHP >= state.maxPlayerHP;
    const unlockFastTrack = elapsedSec <= 45;
    const unlockOverkill =
      state.currentBossHP === 0 &&
      state.lastPreHitBossHP > 0 &&
      state.lastBossDamage >= state.lastPreHitBossHP * 2;
    const unlockedSet = new Set<AchievementType>();
    if (unlockPerfectSync) unlockedSet.add("PERFECT_SYNC");
    if (unlockImmortal) unlockedSet.add("IMMORTAL");
    if (unlockFastTrack) unlockedSet.add("FAST_TRACK");
    if (unlockOverkill) unlockedSet.add("OVERKILL");
    /** Nur Kampf-Achievements in die Queue; ARCHITECT_BADGE kommt aus dem Lernfortschritt */
    const unlockedAchievements = achievementOrder
      .filter((key) => unlockedSet.has(key))
      .sort((a, b) => {
        const byPriority = achievementRegistry[b].priority - achievementRegistry[a].priority;
        if (byPriority !== 0) return byPriority;
        return a.localeCompare(b);
      });
    const nextStreak = rank === "S" ? state.sRankStreak + 1 : 0;
    set({
      combatRank: rank,
      accuracyRate: accuracy,
      timeGrade,
      sRankStreak: nextStreak,
      unlockedAchievements,
      achievementBuffer: [...unlockedAchievements],
    });
    get().archiveAchievements(unlockedAchievements);
    const post = get();
    if (post.gameState === "VICTORY" && post.activeCombatIsSectorZero && post.activeLF === 0) {
      queueMicrotask(() => get().issueNexusMasterCertificate());
    }
  },
  consumeNextAchievement: () => {
    let next: AchievementType | null = null;
    set((state) => {
      if (state.achievementBuffer.length === 0) return {};
      const [head, ...rest] = state.achievementBuffer;
      next = head;
      return { achievementBuffer: rest };
    });
    return next;
  },
  clearAchievementBuffer: () => set({ achievementBuffer: [] }),

  markRankSoundPlayed: () => set({ rankSoundPlayedForVictory: true }),
  resetRankSoundPlayed: () => set({ rankSoundPlayedForVictory: false }),
  setRankSoundMasterGain: (value) =>
    set({ rankSoundMasterGain: Math.max(0.2, Math.min(2.4, value)) }),
  setSRankDuckingDb: (value) =>
    set({ sRankDuckingDb: Math.max(-18, Math.min(0, value)) }),
  setCRankStaticLayerEnabled: (enabled) => set({ cRankStaticLayerEnabled: enabled }),
  updateRankAudioProfile: (rank, patch) =>
    set((state) => ({
      rankAudioProfiles: {
        ...state.rankAudioProfiles,
        [rank]: {
          ...state.rankAudioProfiles[rank],
          ...patch,
        },
      },
    })),
  resetAudioToDefault: () =>
    set({
      rankAudioProfiles: {
        S: { ...INITIAL_RANK_AUDIO_PROFILES.S },
        A: { ...INITIAL_RANK_AUDIO_PROFILES.A },
        B: { ...INITIAL_RANK_AUDIO_PROFILES.B },
        C: { ...INITIAL_RANK_AUDIO_PROFILES.C },
      },
      rankSoundMasterGain: 1,
      sRankDuckingDb: INITIAL_RANK_AUDIO_PROFILES.S.ducking,
      cRankStaticLayerEnabled: true,
      audioTuningRevision: Date.now(),
    }),
  saveAudioPreset: (name) =>
    set((state) => {
      const safeName = name.trim() || `Preset ${new Date().toLocaleTimeString()}`;
      const payload: StoredAudioPreset = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: safeName,
        createdAt: Date.now(),
        rankAudioProfiles: {
          S: { ...state.rankAudioProfiles.S },
          A: { ...state.rankAudioProfiles.A },
          B: { ...state.rankAudioProfiles.B },
          C: { ...state.rankAudioProfiles.C },
        },
        rankSoundMasterGain: state.rankSoundMasterGain,
        sRankDuckingDb: state.sRankDuckingDb,
        cRankStaticLayerEnabled: state.cRankStaticLayerEnabled,
      };
      const savedAudioPresets = [payload, ...state.savedAudioPresets];
      try {
        localStorage.setItem(AUDIO_PRESETS_STORAGE_KEY, JSON.stringify(savedAudioPresets));
      } catch {
        // no-op: storage can fail in strict privacy mode
      }
      return { savedAudioPresets };
    }),
  loadAudioPreset: (presetId) =>
    set((state) => {
      const preset = state.savedAudioPresets.find((item) => item.id === presetId);
      if (!preset) return {};
      return {
        rankAudioProfiles: {
          S: { ...preset.rankAudioProfiles.S },
          A: { ...preset.rankAudioProfiles.A },
          B: { ...preset.rankAudioProfiles.B },
          C: { ...preset.rankAudioProfiles.C },
        },
        rankSoundMasterGain: preset.rankSoundMasterGain,
        sRankDuckingDb: preset.sRankDuckingDb,
        cRankStaticLayerEnabled: preset.cRankStaticLayerEnabled,
        audioTuningRevision: Date.now(),
      };
    }),
  deleteAudioPreset: (presetId) =>
    set((state) => {
      const savedAudioPresets = state.savedAudioPresets.filter((item) => item.id !== presetId);
      try {
        localStorage.setItem(AUDIO_PRESETS_STORAGE_KEY, JSON.stringify(savedAudioPresets));
      } catch {
        // no-op
      }
      return { savedAudioPresets };
    }),
  archiveAchievements: (achievements) =>
    set((state) => {
      const targets = achievements ?? state.unlockedAchievements;
      if (!targets.length) return {};
      const nowIso = new Date().toISOString();
      const nextCollection = { ...state.globalCollection };
      for (const key of targets) {
        const prev = nextCollection[key] ?? { count: 0, firstUnlocked: "" };
        nextCollection[key] = {
          count: prev.count + 1,
          firstUnlocked: prev.firstUnlocked || nowIso,
        };
      }
      try {
        localStorage.setItem(
          ACHIEVEMENT_ARCHIVE_STORAGE_KEY,
          JSON.stringify(nextCollection)
        );
      } catch {
        // no-op
      }
      return {
        globalCollection: nextCollection,
        activeCombatBoosts: computeMergedBoosts({
          globalCollection: nextCollection,
          sRankStreak: state.sRankStreak,
          talentLevels: state.talentLevels,
        }),
      };
    }),
  setOverlayOpenState: (overlayOpenState) => set({ overlayOpenState }),
  markGallerySeen: () =>
    set((state) => ({
      gallerySeenTotal: Object.values(state.globalCollection).reduce(
        (sum, row) => sum + row.count,
        0
      ),
    })),
  recalculateCombatBoosts: () =>
    set((state) => ({
      activeCombatBoosts: computeMergedBoosts({
        globalCollection: state.globalCollection,
        sRankStreak: state.sRankStreak,
        talentLevels: state.talentLevels,
      }),
    })),

  learningCorrectByLf: normalizeCorrectMap({}),
  lfArchitectBadgeGranted: {},
  lastCombatLearningEvents: [],
  learningLeitnerByExerciseId: {},
  sourceMirrorSkillId: null,
  nexusMasterCertificateSealed: null,

  setSourceMirrorSkill: (id) => set({ sourceMirrorSkillId: id }),

  issueNexusMasterCertificate: () => {
    const s = get();
    if (!s.activeCombatIsSectorZero || s.activeLF !== 0 || s.gameState !== "VICTORY") return;
    void (async () => {
      try {
        const { sealNexusMasterDossier, getOrCreateDeviceKeyRaw } = await import(
          "../lib/cert/nexusMasterCertificate"
        );
        const plain = {
          v: 1 as const,
          kind: "NEXUS_MASTER" as const,
          issuedAt: new Date().toISOString(),
          combatRank: s.combatRank,
          timeGrade: s.timeGrade,
          activeLF: s.activeLF,
          sectorZero: true as const,
        };
        const key = await getOrCreateDeviceKeyRaw();
        const sealed = await sealNexusMasterDossier(plain, key);
        localStorage.setItem("nexus.masterCertificate.sealed.v1", sealed);
        persistEpilogueUnlocked();
        set({ nexusMasterCertificateSealed: sealed });
      } catch {
        // no-op
      }
    })();
  },

  recordCombatLearningAttempt: (payload) => {
    const { lf, exerciseId, title, problem, mcQuestion, selectedOptionId, wasCorrect } = payload;
    const now = Date.now();
    set((state) => {
      const log = [
        ...state.lastCombatLearningEvents,
        {
          exerciseId,
          title,
          problem,
          mcQuestion,
          selectedOptionId,
          wasCorrect,
        },
      ];
      const nextCard = applyLeitnerReview(state.learningLeitnerByExerciseId[exerciseId], wasCorrect, now);
      const learningLeitnerByExerciseId = { ...state.learningLeitnerByExerciseId, [exerciseId]: nextCard };

      const flush = (correctMap: Record<LearningField, string[]>, badges: Partial<Record<LearningField, boolean>>) => {
        persistLearningMastery({
          correctByLf: correctMap,
          badgeGranted: badges,
          leitner: learningLeitnerByExerciseId,
        });
      };

      if (!wasCorrect) {
        flush(state.learningCorrectByLf, state.lfArchitectBadgeGranted);
        return {
          lastCombatLearningEvents: log,
          learningLeitnerByExerciseId,
          learningMentorStreak: 0,
          learningMentorColdToken: state.learningMentorColdToken + 1,
          mission:
            state.mission.missionId === exerciseId
              ? { ...state.mission, status: "active" as const }
              : state.mission,
        };
      }

      flush(state.learningCorrectByLf, state.lfArchitectBadgeGranted);
      return {
        lastCombatLearningEvents: log,
        learningLeitnerByExerciseId,
        learningMentorStreak: state.learningMentorStreak + 1,
        learningMentorColdToken: state.learningMentorColdToken,
      };
    });
    queueMicrotask(() => {
      appendRetentionSnapshot(get().learningLeitnerByExerciseId);
    });
  },

  recordLearningExerciseMastery: (lf, exerciseId) => {
    set((state) => {
      const prevCorrect = state.learningCorrectByLf[lf] ?? [];
      if (prevCorrect.includes(exerciseId)) {
        persistLearningMastery({
          correctByLf: state.learningCorrectByLf,
          badgeGranted: state.lfArchitectBadgeGranted,
          leitner: state.learningLeitnerByExerciseId,
        });
        return {};
      }

      const nextCorrectLf = [...prevCorrect, exerciseId];
      const nextCorrectMap = { ...state.learningCorrectByLf, [lf]: nextCorrectLf };
      const curriculum = CURRICULUM_BY_LF[lf] ?? [];
      const need = new Set(curriculum.map((e) => e.id));
      const have = new Set(nextCorrectLf);
      const mastered = curriculum.length > 0 && [...need].every((id) => have.has(id));
      let nextBadges = state.lfArchitectBadgeGranted;
      if (mastered && !state.lfArchitectBadgeGranted[lf]) {
        nextBadges = { ...state.lfArchitectBadgeGranted, [lf]: true };
        queueMicrotask(() => {
          get().archiveAchievements(["ARCHITECT_BADGE"]);
        });
      }
      const masteryChecks = { ...nextBadges };
      const unlockedSectors = deriveUnlockedSectorsFromMastery(masteryChecks);
      persistLearningMastery({
        correctByLf: nextCorrectMap,
        badgeGranted: nextBadges,
        leitner: state.learningLeitnerByExerciseId,
      });
      return {
        learningCorrectByLf: nextCorrectMap,
        lfArchitectBadgeGranted: nextBadges,
        campaign: {
          masteryChecks,
          unlockedSectors,
        },
      };
    });
    queueMicrotask(() => {
      appendRetentionSnapshot(get().learningLeitnerByExerciseId);
    });
  },

  combatArchitectHistory: [],
  menuSystemMood: null,
  nexusFragments: 0,
  hardcoreDriftEnabled: false,
  impactFrameToken: 0,
  talentLevels: { ...DEFAULT_TALENT_LEVELS },

  setHardcoreDriftEnabled: (enabled) => {
    try {
      localStorage.setItem(HARDCORE_DRIFT_STORAGE_KEY, enabled ? "1" : "0");
    } catch {
      // no-op
    }
    set({ hardcoreDriftEnabled: enabled });
  },

  triggerImpactFrames: (variant = "standard") =>
    set((s) => ({
      impactFrameToken: s.impactFrameToken + 1,
      impactFrameVariant: variant,
    })),

  upgradeTalentPath: (path) => {
    const s = get();
    const cur = s.talentLevels[path];
    const cost = talentUpgradeCost(cur);
    if (s.nexusFragments < cost) return false;
    const nextLevels: TalentLevels = { ...s.talentLevels, [path]: cur + 1 };
    const nextFragments = s.nexusFragments - cost;
    set({
      nexusFragments: nextFragments,
      talentLevels: nextLevels,
    });
    persistNeuralAugmentsSnapshot(nextFragments, nextLevels);
    get().recalculateCombatBoosts();
    return true;
  },

  sectorAnomalies: {},
  sectorAnomalyEpoch: -1,
  sectorAnomalyReachFp: -1,
  activeCombatAnomaly: null,
  anomalyRngSalt: 0,
  anomalyDrawNonce: 0,
  dataTurbulenceStamina: 0,
  handAnomalyCosts: [],
  hasCompletedInitialization: false,
  isTutorialCombatRun: false,
  combatTutorialStep: 0,

  completeInitialization: () => {
    try {
      localStorage.setItem(HAS_COMPLETED_INITIALIZATION_KEY, "1");
    } catch {
      // no-op
    }
    set({
      hasCompletedInitialization: true,
      isTutorialCombatRun: false,
      combatTutorialStep: 0,
    });
  },

  beginNeuralTrainingCombat: () => {
    set({ isTutorialCombatRun: true, combatTutorialStep: 0 });
    get().initiateCombat(1, 72);
  },

  setExamPresentationMode: (enabled) => {
    try {
      localStorage.setItem("nexus.examPresentationMode.v1", enabled ? "1" : "0");
    } catch {
      // no-op
    }
    set({ examPresentationMode: enabled });
  },

  mergeLocalKnowledgeWithRegistry: async (registryFingerprint) => {
    const state = get();
    const allValid = new Set(
      (Object.keys(CURRICULUM_BY_LF) as LearningField[]).flatMap(
        (lf) => (CURRICULUM_BY_LF[lf] ?? []).map((e) => e.id)
      )
    );
    const leitner = { ...state.learningLeitnerByExerciseId };
    for (const id of Object.keys(leitner)) {
      if (!allValid.has(id)) delete leitner[id];
    }
    const correctByLf = { ...state.learningCorrectByLf };
    for (const lf of EMPTY_LEARNING_FIELDS()) {
      const curriculum = CURRICULUM_BY_LF[lf] ?? [];
      const v = new Set(curriculum.map((e) => e.id));
      correctByLf[lf] = (correctByLf[lf] ?? []).filter((id) => v.has(id));
    }
    const normalized = normalizeCorrectMap(correctByLf);
    persistLearningMastery({
      correctByLf: normalized,
      badgeGranted: state.lfArchitectBadgeGranted,
      leitner,
    });
    set({
      learningCorrectByLf: normalized,
      learningLeitnerByExerciseId: leitner,
    });
    persistRegistryFingerprint(registryFingerprint);
  },

  pushNexusCloudBackup: async () => {
    const sealed = get().nexusMasterCertificateSealed;
    if (!sealed) {
      return { ok: false, message: "Kein Master-Zertifikat im lokalen Speicher" };
    }
    const cfg = loadCloudSyncConfig();
    const r = await pushEncryptedNxcPayload(sealed.trim(), cfg);
    return { ok: r.ok, message: r.message };
  },

  regenerateSectorAnomalies: () => {
    const state = get();
    const epoch = anomalySeedEpoch();
    const history = state.combatArchitectHistory;
    const stabilities = computeAllSectorStabilities(history);
    const masteryChecks = state.campaign.masteryChecks as Partial<Record<`LF${number}`, boolean>>;
    const reachable: number[] = [];
    for (let lf = 1; lf <= 12; lf += 1) {
      if (isSectorReachable(lf, history, stabilities, masteryChecks)) reachable.push(lf);
    }
    const reachFp = mixSeed(0x51f15e9d, reachable);
    if (
      state.sectorAnomalyEpoch === epoch &&
      state.sectorAnomalyReachFp === reachFp &&
      Object.keys(state.sectorAnomalies).length > 0
    ) {
      return;
    }
    const rng = createSeededRandom(mixSeed(epoch, reachable));
    const n = countAnomaliesToSpawn(rng);
    const picked = pickSectorAnomalies(rng, reachable, n);
    set({
      sectorAnomalies: picked,
      sectorAnomalyEpoch: epoch,
      sectorAnomalyReachFp: reachFp,
    });
  },

  recomputeMenuSystemMood: () => {
    const h = get().combatArchitectHistory;
    const sorted = [...h].sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );
    const runs = sorted.slice(-20);
    if (runs.length === 0) {
      set({ menuSystemMood: null });
      return;
    }
    const accuracies = runs.map((r) => r.accuracyRate);
    const t = computePerformanceTrend(accuracies, 3);
    set({
      menuSystemMood: {
        direction: t.direction,
        delta: t.delta,
        runCount: runs.length,
        updatedAt: Date.now(),
      },
    });
  },

  appendCombatArchitectReportIfNew: () => {
    const s = get();
    if (s.isTutorialCombatRun) return false;
    const reportId = `vf-${s.victoryFinisherToken}-st-${s.startTime}`;
    if (s.combatArchitectHistory.some((e) => e.reportId === reportId)) {
      return false;
    }
    const placeByRank: Record<CombatRank, 1 | 2 | 3 | 4> = {
      S: 1,
      A: 2,
      B: 3,
      C: 4,
    };
    const stratumByRank: Record<CombatRank, string> = {
      S: "APEX-Σ",
      A: "HIGH-Λ",
      B: "MID-Κ",
      C: "BASE-Ω",
    };
    const elapsedSec =
      s.startTime > 0 ? Math.max(0, (Date.now() - s.startTime) / 1000) : 0;
    const rawBoss = s.combatBossRawDamageAttempted;
    const absShield = s.combatShieldDamageAbsorbedTotal;
    const effPct =
      rawBoss > 0 ? Math.max(0, Math.min(100, Math.round((absShield / rawBoss) * 100))) : 0;
    const persona = computeArchitectPersona({
      shieldMitigationEfficiencyPct: effPct,
      combatComboCount: s.combatComboCount,
      synapticFlow: s.synapticFlow,
      missedSkills: s.missedSkills,
      accuracyRate: s.accuracyRate,
      elapsedSec,
      combatRank: s.combatRank,
    });
    const entry: CombatArchitectReportEntry = {
      reportId,
      recordedAt: new Date().toISOString(),
      activeLF: s.activeLF,
      timeGrade: s.timeGrade,
      architectPlace: placeByRank[s.combatRank],
      architectStratum: stratumByRank[s.combatRank],
      combatRank: s.combatRank,
      elapsedSec,
      accuracyRate: s.accuracyRate,
      shieldMitigationAbsorbed: absShield,
      shieldMitigationEfficiencyPct: effPct,
      architectPersonaId: persona.id,
      architectPersonaTitle: persona.title,
      architectPersonaFlavor: persona.flavor,
      hardcoreDriftRun: s.hardcoreDriftEnabled,
    };
    persistArchitectPersonaProfile(persona, reportId);
    const next = [...s.combatArchitectHistory, entry];
    const baseFrag = computeFragmentGain(s.combatRank, s.accuracyRate, s.timeGrade);
    let fragMult =
      s.activeLF >= 1 && s.sectorAnomalies[s.activeLF] === "DATA_TURBULENCE" ? 1.5 : 1;
    const today = getUtcDateKey();
    const dailyDef = getDailyIncursionDefinition(today);
    const isRankedDailyAttempt =
      s.activeCombatIsDailyRanked &&
      s.activeLF === dailyDef.targetLf &&
      !s.isTutorialCombatRun;
    const alreadyClearedToday = s.dailyRankedClearDateUtc === today;

    let nextDailyClear = s.dailyRankedClearDateUtc;
    let nextStreak = s.dailyParticipationStreak;
    let nextPlayerBest = s.playerDailyBest;

    if (isRankedDailyAttempt && !alreadyClearedToday) {
      const dailyRewardMult = computeDailyRewardMultiplier(s.dailyParticipationStreak);
      fragMult *= dailyRewardMult;
      const prev = s.dailyRankedClearDateUtc;
      const yesterday = addUtcCalendarDays(today, -1);
      nextStreak = prev === yesterday ? s.dailyParticipationStreak + 1 : 1;
      nextDailyClear = today;
      const rankLetter = s.combatRank as DailyLeaderboardRow["combatRank"];
      const newRow: DailyLeaderboardRow = {
        id: "local-player",
        displayName: "DU // ARCHITEKT",
        score: computeDailyRunScore(elapsedSec, s.accuracyRate, rankLetter),
        elapsedSec,
        accuracy: s.accuracyRate,
        combatRank: rankLetter,
      };
      if (
        !nextPlayerBest ||
        nextPlayerBest.dateKey !== today ||
        newRow.score > nextPlayerBest.row.score
      ) {
        nextPlayerBest = { dateKey: today, row: newRow };
      }
    }

    let fragGain = Math.round(baseFrag * fragMult);
    if (s.hardcoreDriftEnabled) {
      fragGain *= 2;
    }
    const nextFragments = s.nexusFragments + fragGain;
    set({
      combatArchitectHistory: next,
      nexusFragments: nextFragments,
      dailyRankedClearDateUtc: nextDailyClear,
      dailyParticipationStreak: nextStreak,
      playerDailyBest: nextPlayerBest,
    });
    persistDailySlice({
      dailyRankedClearDateUtc: nextDailyClear,
      dailyParticipationStreak: nextStreak,
      playerDailyBest: nextPlayerBest,
    });
    try {
      localStorage.setItem(COMBAT_ARCHITECT_HISTORY_KEY, JSON.stringify(next));
    } catch {
      // no-op
    }
    persistNeuralAugmentsSnapshot(nextFragments, s.talentLevels);
    get().recomputeMenuSystemMood();
    if (s.activeLF === 0) {
      get().tryUnlockArchitectChroma("monochrome-glitch");
    }
    return true;
  },

  resetCombat: () => {
    clearCombatPhaseTransitionFinishTimer();
    const state = get();
    set({
      currentBossHP: state.maxBossHP,
      gameState: "IDLE",
      playerHP: state.maxPlayerHP,
      pendingDoubleHit: false,
      activeSkillVfx: null,
      currentCombatPhase: 1,
      isTransitioning: false,
      combatPhaseTransitionToken: 0,
      activeBossThemePath: null,
      cameraZoom: 1,
      cameraShake: 0,
      isCriticalPhase: false,
      lastBossDamage: 0,
      lastPreHitBossHP: 0,
      dataBleedFragments: 0,
      startTime: 0,
      totalDamageDealt: 0,
      missedSkills: 0,
      accuracyRate: 0,
      sRankStreak: 0,
      timeGrade: "C",
      combatRank: "C",
      unlockedAchievements: [],
      achievementBuffer: [],
      rankSoundPlayedForVictory: false,
      isFinisherActive: false,
      victoryFinisherToken: 0,
      victoryFinisherPhase: "idle",
      victoryFinisherComplete: false,
      isLootErupting: false,
      endlessDeepDiveActive: false,
      endlessFloor: 1,
      endlessAwaitingBossSpawn: false,
      combatIntroNonce: 0,
      impactFrameVariant: "standard",
      criticalHitToken: state.criticalHitToken,
      overlayOpenState: "NONE",
      killfeedActiveUntilMs: 0,
      hand: ["SKILL_01_OVERCLOCK", "SKILL_02_ENCRYPT", "SKILL_03_RECURSION"],
      deck: [
        "SKILL_01_OVERCLOCK",
        "SKILL_02_ENCRYPT",
        "SKILL_03_RECURSION",
        "SKILL_01_OVERCLOCK",
        "SKILL_02_ENCRYPT",
        "SKILL_03_RECURSION",
      ],
      discard: [],
      handRarities: ["COMMON", "COMMON", "COMMON"],
      identifiedSkillId: null,
      activeCombatAnomaly: null,
      anomalyRngSalt: 0,
      anomalyDrawNonce: 0,
      dataTurbulenceStamina: 0,
      handAnomalyCosts: [],
      playerShield: 0,
      shieldShatterToken: 0,
      sentinelAbsorbToken: 0,
      combatShieldDamageAbsorbedTotal: 0,
      combatBossRawDamageAttempted: 0,
      bossEvolutionTimeScale: 1,
      bossStrategyScanToken: 0,
      synapticFlow: 0,
      combatComboCount: 0,
      lastFlowSkillType: null,
      bossPulseFreezeUntilPerf: 0,
      bossNextPulseDueAtPerf: 0,
      skipShieldDecayNextPulse: false,
      isParrying: false,
      parryFeedbackToken: 0,
      synapticOverloadToken: 0,
      synapticOverloadActive: false,
      isSingularityActive: false,
      singularityEnteredToken: 0,
      isTutorialCombatRun: false,
      combatTutorialStep: 0,
      activeCombatIsDailyRanked: false,
      activeCombatIsDailySector: false,
      activeCombatIsSectorZero: false,
      sectorZeroMorphLf: 1,
      sectorZeroMorphSeed: 0,
      sectorZeroMorphToken: 0,
      impactFrameToken: 0,
      sourceMirrorSkillId: null,
      examLogicFlowToken: 0,
      learningMentorStreak: 0,
      learningMentorColdToken: 0,
      preferredLearningExerciseId: null,
      archiveWorkbenchSnippet: null,
      mission: { lf: null, missionId: null, status: "idle" },
    });
  },
}));

const _loadedUnlocks = loadArchitectChromaUnlocks();
const _loadedActive = loadArchitectChromaActive();
applyArchitectChromaToDocument(_loadedActive);
const _loadedReadability = loadReadabilityMode();
applyReadabilityToDocument(_loadedReadability);
useGameStore.setState({
  architectChromaUnlocks: _loadedUnlocks,
  architectChromaActive: _loadedActive,
  readabilityMode: _loadedReadability,
});

try {
  const raw = localStorage.getItem(AUDIO_PRESETS_STORAGE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw) as StoredAudioPreset[];
    if (Array.isArray(parsed)) {
      useGameStore.setState({ savedAudioPresets: parsed });
    }
  }
} catch {
  // no-op
}

try {
  const rawBp = localStorage.getItem(SKILL_BLUEPRINT_ARCHIVE_KEY);
  if (rawBp) {
    const parsed = JSON.parse(rawBp) as Partial<Record<string, SkillBlueprintEntry>>;
    const merged: Partial<Record<SkillId, SkillBlueprintEntry>> = {};
    for (const id of Object.keys(skillRegistry) as SkillId[]) {
      const row = parsed[id];
      if (
        row &&
        typeof row.count === "number" &&
        typeof row.firstUnlocked === "string"
      ) {
        merged[id] = {
          count: Math.max(0, Math.floor(row.count)),
          firstUnlocked: row.firstUnlocked,
        };
      }
    }
    useGameStore.setState({ skillBlueprintArchive: merged });
  }
} catch {
  // no-op
}

function isValidDailyLeaderboardRow(row: unknown): row is DailyLeaderboardRow {
  if (!row || typeof row !== "object") return false;
  const r = row as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.displayName === "string" &&
    typeof r.score === "number" &&
    Number.isFinite(r.score) &&
    typeof r.elapsedSec === "number" &&
    typeof r.accuracy === "number" &&
    ["S", "A", "B", "C"].includes(r.combatRank as string)
  );
}

function isValidPlayerDailyBestPayload(x: unknown): x is PlayerDailyBestPayload {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.dateKey === "string" && isValidDailyLeaderboardRow(o.row);
}

function isValidCombatArchitectEntry(
  row: unknown
): row is CombatArchitectReportEntry {
  if (!row || typeof row !== "object") return false;
  const r = row as Record<string, unknown>;
  const place = r.architectPlace;
  return (
    typeof r.reportId === "string" &&
    typeof r.recordedAt === "string" &&
    typeof r.activeLF === "number" &&
    r.activeLF >= 0 &&
    r.activeLF <= 12 &&
    ["S", "A", "B", "C"].includes(r.timeGrade as string) &&
    (place === 1 || place === 2 || place === 3 || place === 4) &&
    typeof r.architectStratum === "string" &&
    ["S", "A", "B", "C"].includes(r.combatRank as string) &&
    typeof r.elapsedSec === "number" &&
    typeof r.accuracyRate === "number" &&
    (r.shieldMitigationAbsorbed === undefined || typeof r.shieldMitigationAbsorbed === "number") &&
    (r.shieldMitigationEfficiencyPct === undefined ||
      typeof r.shieldMitigationEfficiencyPct === "number") &&
    (r.architectPersonaId === undefined || typeof r.architectPersonaId === "string") &&
    (r.architectPersonaTitle === undefined || typeof r.architectPersonaTitle === "string") &&
    (r.architectPersonaFlavor === undefined || typeof r.architectPersonaFlavor === "string") &&
    (r.hardcoreDriftRun === undefined || typeof r.hardcoreDriftRun === "boolean")
  );
}

try {
  const rawHist = localStorage.getItem(COMBAT_ARCHITECT_HISTORY_KEY);
  if (rawHist) {
    const parsed = JSON.parse(rawHist) as unknown;
    if (Array.isArray(parsed)) {
      const cleaned = parsed.filter(isValidCombatArchitectEntry);
      useGameStore.setState({ combatArchitectHistory: cleaned });
      useGameStore.getState().recomputeMenuSystemMood();
    }
  }
} catch {
  // no-op
}

try {
  const rawNeural = localStorage.getItem(NEXUS_NEURAL_AUGMENTS_KEY);
  if (rawNeural) {
    const parsed = JSON.parse(rawNeural) as { fragments?: unknown; talents?: unknown };
    let fragments = 0;
    const talents: TalentLevels = { ...DEFAULT_TALENT_LEVELS };
    if (typeof parsed.fragments === "number") {
      fragments = Math.max(0, Math.floor(parsed.fragments));
    }
    const t = parsed.talents;
    if (t && typeof t === "object" && !Array.isArray(t)) {
      const o = t as Record<string, unknown>;
      for (const k of ["overclock", "firewall", "throughput"] as const) {
        const v = o[k];
        if (typeof v === "number" && v >= 0) {
          talents[k] = Math.min(999, Math.floor(v));
        }
      }
    }
    useGameStore.setState({ nexusFragments: fragments, talentLevels: talents });
    useGameStore.getState().recalculateCombatBoosts();
  }
} catch {
  // no-op
}

try {
  const rawArchive = localStorage.getItem(ACHIEVEMENT_ARCHIVE_STORAGE_KEY);
  if (rawArchive) {
    const parsed = JSON.parse(rawArchive) as Partial<
      Record<AchievementType, GlobalCollectionEntry>
    >;
    const merged = buildEmptyCollection();
    for (const key of achievementOrder) {
      const row = parsed?.[key];
      if (row && typeof row.count === "number" && typeof row.firstUnlocked === "string") {
        merged[key] = {
          count: Math.max(0, Math.floor(row.count)),
          firstUnlocked: row.firstUnlocked,
        };
      }
    }
    const streak = useGameStore.getState().sRankStreak;
    const talents = useGameStore.getState().talentLevels;
    useGameStore.setState({
      globalCollection: merged,
      activeCombatBoosts: computeMergedBoosts({
        globalCollection: merged,
        sRankStreak: streak,
        talentLevels: talents,
      }),
    });
  }
} catch {
  // no-op
}

try {
  const rawLearning = localStorage.getItem(LEARNING_MASTERY_STORAGE_KEY);
  if (rawLearning) {
    const parsed = JSON.parse(rawLearning) as LearningMasteryPersisted;
    const correctByLf = normalizeCorrectMap(parsed?.correctByLf);
    const bg =
      parsed?.badgeGranted && typeof parsed.badgeGranted === "object" && !Array.isArray(parsed.badgeGranted)
        ? (parsed.badgeGranted as Partial<Record<LearningField, boolean>>)
        : {};
    useGameStore.setState({
      learningCorrectByLf: correctByLf,
      lfArchitectBadgeGranted: bg,
      learningLeitnerByExerciseId: normalizeLeitnerMap(
        parsed?.leitner as Record<string, unknown> | undefined
      ),
      campaign: {
        masteryChecks: bg,
        unlockedSectors: deriveUnlockedSectorsFromMastery(bg),
      },
    });
  }
} catch {
  // no-op
}

try {
  const sealedCert = localStorage.getItem("nexus.masterCertificate.sealed.v1");
  if (sealedCert && typeof sealedCert === "string") {
    useGameStore.setState({ nexusMasterCertificateSealed: sealedCert });
  }
} catch {
  // no-op
}

try {
  if (localStorage.getItem(HAS_COMPLETED_INITIALIZATION_KEY) === "1") {
    useGameStore.setState({ hasCompletedInitialization: true });
  }
} catch {
  // no-op
}

try {
  if (localStorage.getItem(FIRST_BOOT_COMPLETE_KEY) === "1") {
    useGameStore.setState({ isFirstBoot: false, tutorialStepIndex: 0 });
  }
} catch {
  // no-op
}

try {
  if (localStorage.getItem(TUTORIAL_ANIME_UNLOCK_KEY) === "1") {
    useGameStore.setState({ isTutorialAnimeUnlocked: true });
  }
} catch {
  // no-op
}

try {
  if (localStorage.getItem(HARDCORE_DRIFT_STORAGE_KEY) === "1") {
    useGameStore.setState({ hardcoreDriftEnabled: true });
  }
} catch {
  // no-op
}

try {
  if (localStorage.getItem("nexus.examPresentationMode.v1") === "1") {
    useGameStore.setState({ examPresentationMode: true });
  }
} catch {
  // no-op
}

try {
  const rawDaily = localStorage.getItem(DAILY_INCURSION_STORAGE_KEY);
  if (rawDaily) {
    const parsed = JSON.parse(rawDaily) as unknown;
    if (parsed && typeof parsed === "object") {
      const o = parsed as Record<string, unknown>;
      const clearRaw = o.dailyRankedClearDateUtc;
      const clear =
        clearRaw === null || clearRaw === undefined
          ? null
          : typeof clearRaw === "string"
            ? clearRaw
            : null;
      const streakRaw = o.dailyParticipationStreak;
      const streak =
        typeof streakRaw === "number" && Number.isFinite(streakRaw)
          ? Math.max(0, Math.floor(streakRaw))
          : 0;
      const bestRaw = o.playerDailyBest;
      useGameStore.setState({
        dailyRankedClearDateUtc: clear,
        dailyParticipationStreak: streak,
        playerDailyBest: isValidPlayerDailyBestPayload(bestRaw) ? bestRaw : null,
      });
    }
  }
} catch {
  // no-op
}
