import { loadCloudSyncConfig } from "../security/cloudSync";
import type { LiveDuelRoom } from "./liveDuelTypes";

const SESSION_PREFIX = "nexus.liveDuel.room.v1:";
export const LIVE_DUEL_SUPABASE_TABLE = "nexus_live_duel_rooms";

export type LiveDuelSyncMode = "local" | "supabase";

export function getLiveDuelSyncMode(): LiveDuelSyncMode {
  const cfg = loadCloudSyncConfig();
  if (
    cfg.mode === "supabase" &&
    cfg.supabaseUrl.startsWith("https://") &&
    cfg.supabaseKey.trim()
  ) {
    return "supabase";
  }
  return "local";
}

function sessionKey(code: string): string {
  return `${SESSION_PREFIX}${code}`;
}

export function saveLiveDuelRoomLocal(room: LiveDuelRoom): void {
  try {
    sessionStorage.setItem(sessionKey(room.code), JSON.stringify(room));
  } catch {
    /* quota */
  }
}

export function loadLiveDuelRoomLocal(code: string): LiveDuelRoom | null {
  try {
    const raw = sessionStorage.getItem(sessionKey(code));
    if (!raw) return null;
    return JSON.parse(raw) as LiveDuelRoom;
  } catch {
    return null;
  }
}

export async function upsertLiveDuelRoomRemote(room: LiveDuelRoom): Promise<{ ok: boolean; message: string }> {
  const cfg = loadCloudSyncConfig();
  if (getLiveDuelSyncMode() !== "supabase") {
    saveLiveDuelRoomLocal(room);
    return { ok: true, message: "local" };
  }

  const base = cfg.supabaseUrl.replace(/\/$/, "");
  const key = cfg.supabaseKey.trim();
  const row = {
    code: room.code,
    payload: room,
    updated_at: new Date().toISOString(),
  };

  try {
    const res = await fetch(
      `${base}/rest/v1/${LIVE_DUEL_SUPABASE_TABLE}?on_conflict=code`,
      {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify(row),
        signal: AbortSignal.timeout(12_000),
      }
    );
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { ok: false, message: `Supabase ${res.status}${t ? `: ${t.slice(0, 80)}` : ""}` };
    }
    saveLiveDuelRoomLocal(room);
    return { ok: true, message: "supabase" };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Netzwerkfehler" };
  }
}

export async function fetchLiveDuelRoomRemote(code: string): Promise<LiveDuelRoom | null> {
  const local = loadLiveDuelRoomLocal(code);
  if (getLiveDuelSyncMode() !== "supabase") return local;

  const cfg = loadCloudSyncConfig();
  const base = cfg.supabaseUrl.replace(/\/$/, "");
  const key = cfg.supabaseKey.trim();

  try {
    const res = await fetch(
      `${base}/rest/v1/${LIVE_DUEL_SUPABASE_TABLE}?code=eq.${encodeURIComponent(code)}&select=payload`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
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
