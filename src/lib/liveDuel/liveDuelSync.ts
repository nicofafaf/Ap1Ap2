import { loadCloudSyncConfig } from "../security/cloudSync";
import type { LiveDuelRoom } from "./liveDuelTypes";

const ROOM_PREFIX = "nexus.liveDuel.room.v1:";
const REGISTRY_KEY = "nexus.liveDuel.registry.v1";
export const LIVE_DUEL_SUPABASE_TABLE = "nexus_live_duel_rooms";

const ROOM_TTL_MS = 24 * 60 * 60 * 1000;

export type LiveDuelSyncMode = "local" | "supabase";

type RoomRegistry = Record<string, { room: LiveDuelRoom; expiresAt: number }>;

function roomKey(code: string): string {
  return `${ROOM_PREFIX}${code}`;
}

function readRegistry(): RoomRegistry {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as RoomRegistry;
  } catch {
    return {};
  }
}

function writeRegistry(reg: RoomRegistry): void {
  try {
    const now = Date.now();
    const pruned: RoomRegistry = {};
    for (const [code, entry] of Object.entries(reg)) {
      if (entry.expiresAt > now) pruned[code] = entry;
    }
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(pruned));
  } catch {
    /* quota */
  }
}

function registerRoomInRegistry(room: LiveDuelRoom): void {
  const reg = readRegistry();
  reg[room.code] = { room, expiresAt: Date.now() + ROOM_TTL_MS };
  writeRegistry(reg);
}

function getSupabaseCredentials(): { url: string; key: string } | null {
  const envUrl = import.meta.env.VITE_LIVE_DUEL_SUPABASE_URL;
  const envKey = import.meta.env.VITE_LIVE_DUEL_SUPABASE_KEY;
  if (
    typeof envUrl === "string" &&
    envUrl.startsWith("https://") &&
    typeof envKey === "string" &&
    envKey.trim()
  ) {
    return { url: envUrl.replace(/\/$/, ""), key: envKey.trim() };
  }
  const cfg = loadCloudSyncConfig();
  if (cfg.mode === "supabase" && cfg.supabaseUrl.startsWith("https://") && cfg.supabaseKey.trim()) {
    return { url: cfg.supabaseUrl.replace(/\/$/, ""), key: cfg.supabaseKey.trim() };
  }
  return null;
}

export function getLiveDuelSyncMode(): LiveDuelSyncMode {
  return getSupabaseCredentials() ? "supabase" : "local";
}

export function saveLiveDuelRoomLocal(room: LiveDuelRoom): void {
  try {
    localStorage.setItem(roomKey(room.code), JSON.stringify(room));
    registerRoomInRegistry(room);
  } catch {
    /* quota */
  }
  try {
    const channel = new BroadcastChannel("nexus-live-duel");
    channel.postMessage({ type: "room-updated", code: room.code });
    channel.close();
  } catch {
    /* unsupported */
  }
}

export function loadLiveDuelRoomLocal(code: string): LiveDuelRoom | null {
  try {
    const raw = localStorage.getItem(roomKey(code));
    if (raw) return JSON.parse(raw) as LiveDuelRoom;
  } catch {
    /* parse */
  }
  const reg = readRegistry();
  const entry = reg[code];
  if (entry && entry.expiresAt > Date.now()) return entry.room;
  return null;
}

export async function upsertLiveDuelRoomRemote(room: LiveDuelRoom): Promise<{ ok: boolean; message: string }> {
  saveLiveDuelRoomLocal(room);

  const creds = getSupabaseCredentials();
  if (!creds) {
    return { ok: true, message: "local" };
  }

  const row = {
    code: room.code,
    payload: room,
    updated_at: new Date().toISOString(),
  };

  try {
    const res = await fetch(`${creds.url}/rest/v1/${LIVE_DUEL_SUPABASE_TABLE}?on_conflict=code`, {
      method: "POST",
      headers: {
        apikey: creds.key,
        Authorization: `Bearer ${creds.key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { ok: false, message: `Supabase ${res.status}${t ? `: ${t.slice(0, 80)}` : ""}` };
    }
    return { ok: true, message: "supabase" };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Netzwerkfehler" };
  }
}

export async function fetchLiveDuelRoomRemote(code: string): Promise<LiveDuelRoom | null> {
  const local = loadLiveDuelRoomLocal(code);
  const creds = getSupabaseCredentials();
  if (!creds) return local;

  try {
    const res = await fetch(
      `${creds.url}/rest/v1/${LIVE_DUEL_SUPABASE_TABLE}?code=eq.${encodeURIComponent(code)}&select=payload`,
      {
        headers: { apikey: creds.key, Authorization: `Bearer ${creds.key}` },
        signal: AbortSignal.timeout(12_000),
      }
    );
    if (!res.ok) return local;
    const rows = (await res.json()) as { payload?: LiveDuelRoom }[];
    const room = rows[0]?.payload ?? null;
    if (room) saveLiveDuelRoomLocal(room);
    return room ?? local;
  } catch {
    return local;
  }
}

export function subscribeLiveDuelRoomUpdates(
  code: string,
  onUpdate: () => void
): () => void {
  const onStorage = (ev: StorageEvent) => {
    if (ev.key === roomKey(code) || ev.key === REGISTRY_KEY) onUpdate();
  };
  window.addEventListener("storage", onStorage);

  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel("nexus-live-duel");
    channel.onmessage = (ev) => {
      const data = ev.data as { type?: string; code?: string };
      if (data?.type === "room-updated" && data.code === code) onUpdate();
    };
  } catch {
    /* unsupported */
  }

  return () => {
    window.removeEventListener("storage", onStorage);
    channel?.close();
  };
}
