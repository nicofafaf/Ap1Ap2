import { create } from "zustand";
import { buildLiveDuelQuestionPool } from "../lib/liveDuel/liveDuelQuestionPool";
import { generateLiveDuelRoomCode, isValidLiveDuelRoomCode, normalizeLiveDuelRoomCode } from "../lib/liveDuel/liveDuelRoomCode";
import {
  fetchLiveDuelRoomRemote,
  getLiveDuelSyncMode,
  upsertLiveDuelRoomRemote,
} from "../lib/liveDuel/liveDuelSync";
import type {
  LiveDuelPlayer,
  LiveDuelRoom,
  LiveDuelRoomSettings,
} from "../lib/liveDuel/liveDuelTypes";
import { writeLiveDuelRoomToBrowserUrl } from "../lib/liveDuel/liveDuelUrls";
import { LIVE_DUEL_DEFAULT_SETTINGS } from "../lib/liveDuel/liveDuelTypes";

type LiveDuelView = "hub" | "lobby" | "arena" | "results";

type LiveDuelStore = {
  view: LiveDuelView;
  settings: LiveDuelRoomSettings;
  room: LiveDuelRoom | null;
  localPlayerId: string | null;
  syncMessage: string | null;
  isBusy: boolean;
  setSettings: (patch: Partial<LiveDuelRoomSettings>) => void;
  resetToHub: () => void;
  createRoom: (hostName: string, ctx?: Parameters<typeof buildLiveDuelQuestionPool>[2]) => Promise<boolean>;
  joinRoom: (code: string, playerName: string) => Promise<boolean>;
  refreshRoom: () => Promise<void>;
  startMatch: () => Promise<void>;
  submitAnswer: (correct: boolean, elapsedMs: number) => void;
  advanceAfterReveal: () => void;
};

function newPlayerId(): string {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function scoreDelta(
  correct: boolean,
  elapsedMs: number,
  secondsPerQuestion: number,
  scoring: LiveDuelRoom["settings"]["scoring"]
): number {
  if (!correct) return 0;
  if (scoring === "correct-only") return 800;
  const max = 1000;
  const ratio = Math.max(0, 1 - elapsedMs / (secondsPerQuestion * 1000));
  return Math.round(400 + ratio * max);
}

export const useLiveDuelStore = create<LiveDuelStore>((set, get) => ({
  view: "hub",
  settings: { ...LIVE_DUEL_DEFAULT_SETTINGS },
  room: null,
  localPlayerId: null,
  syncMessage: null,
  isBusy: false,

  setSettings: (patch) =>
    set((s) => ({ settings: { ...s.settings, ...patch } })),

  resetToHub: () =>
    set({
      view: "hub",
      room: null,
      localPlayerId: null,
      syncMessage: null,
      isBusy: false,
    }),

  createRoom: async (hostName, ctx) => {
    set({ isBusy: true, syncMessage: null });
    const settings = get().settings;
    const queue = await buildLiveDuelQuestionPool(settings.contentSourceId, settings.questionCount, ctx);
    if (queue.length === 0) {
      set({ isBusy: false, syncMessage: "liveDuel.error.noQuestions" });
      return false;
    }
    const hostId = newPlayerId();
    const code = generateLiveDuelRoomCode();
    const host: LiveDuelPlayer = {
      id: hostId,
      displayName: hostName.trim() || "Host",
      isHost: true,
      score: 0,
    };
    const room: LiveDuelRoom = {
      code,
      createdAt: Date.now(),
      hostId,
      phase: "lobby",
      settings,
      questionQueue: queue,
      questionIndex: 0,
      questionStartedAt: null,
      players: [host],
    };
    const sync = await upsertLiveDuelRoomRemote(room);
    writeLiveDuelRoomToBrowserUrl(code);
    set({
      room,
      localPlayerId: hostId,
      view: "lobby",
      isBusy: false,
      syncMessage: sync.ok
        ? getLiveDuelSyncMode() === "supabase"
          ? "liveDuel.sync.supabase"
          : "liveDuel.sync.local"
        : sync.message,
    });
    return true;
  },

  joinRoom: async (rawCode, playerName) => {
    const code = normalizeLiveDuelRoomCode(rawCode);
    if (!isValidLiveDuelRoomCode(code)) {
      set({ syncMessage: "liveDuel.error.invalidCode" });
      return false;
    }
    set({ isBusy: true, syncMessage: null });
    let room = await fetchLiveDuelRoomRemote(code);
    if (!room) {
      set({ isBusy: false, syncMessage: "liveDuel.error.roomNotFound" });
      return false;
    }
    const playerId = newPlayerId();
    const player: LiveDuelPlayer = {
      id: playerId,
      displayName: playerName.trim() || "Spieler",
      isHost: false,
      score: 0,
    };
    if (!room.players.some((p) => p.id === playerId)) {
      room = { ...room, players: [...room.players, player] };
      await upsertLiveDuelRoomRemote(room);
    }
    set({
      room,
      localPlayerId: playerId,
      view: "lobby",
      isBusy: false,
      syncMessage: getLiveDuelSyncMode() === "supabase" ? "liveDuel.sync.supabase" : "liveDuel.sync.local",
    });
    return true;
  },

  refreshRoom: async () => {
    const code = get().room?.code;
    if (!code) return;
    const room = await fetchLiveDuelRoomRemote(code);
    if (room) set({ room });
  },

  startMatch: async () => {
    const { room, localPlayerId } = get();
    if (!room || room.hostId !== localPlayerId) return;
    const next: LiveDuelRoom = {
      ...room,
      phase: "question",
      questionIndex: 0,
      questionStartedAt: Date.now(),
    };
    await upsertLiveDuelRoomRemote(next);
    set({ room: next, view: "arena" });
  },

  submitAnswer: (correct, elapsedMs) => {
    const { room, localPlayerId } = get();
    if (!room || !localPlayerId) return;
    const delta = scoreDelta(
      correct,
      elapsedMs,
      room.settings.secondsPerQuestion,
      room.settings.scoring
    );
    const players = room.players.map((p) =>
      p.id === localPlayerId
        ? { ...p, score: p.score + delta, lastAnswerCorrect: correct }
        : p
    );
    const next: LiveDuelRoom = { ...room, players, phase: "reveal" };
    set({ room: next });
    void upsertLiveDuelRoomRemote(next);
  },

  advanceAfterReveal: () => {
    const { room, localPlayerId } = get();
    if (!room || room.hostId !== localPlayerId) return;
    const nextIndex = room.questionIndex + 1;
    if (nextIndex >= room.questionQueue.length) {
      const finished: LiveDuelRoom = { ...room, phase: "finished", questionStartedAt: null };
      set({ room: finished, view: "results" });
      void upsertLiveDuelRoomRemote(finished);
      return;
    }
    const next: LiveDuelRoom = {
      ...room,
      phase: "question",
      questionIndex: nextIndex,
      questionStartedAt: Date.now(),
    };
    set({ room: next });
    void upsertLiveDuelRoomRemote(next);
  },
}));
