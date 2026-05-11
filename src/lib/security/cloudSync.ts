/**
 * Optionales Cloud-Backup: nur bereits versiegelte .nxc-Payloads (Offline-First bleibt Default)
 * — Webhook (POST JSON) oder Supabase REST (PostgREST) ohne zusätzliche SDK-Abhängigkeit
 */

import { computeSealedFingerprintHex } from "../cert/nexusMasterCertificate";

const CONFIG_KEY = "nexus.cloudSync.config.v2";

export type CloudSyncMode = "off" | "webhook" | "supabase";

export type CloudSyncUserConfig = {
  mode: CloudSyncMode;
  webhookUrl: string;
  supabaseUrl: string;
  supabaseKey: string;
  /** Tabelle mit mindestens: sealed_payload (text), device_tag (text), updated_at (timestamptz) */
  supabaseTable: string;
};

const DEFAULT_CONFIG: CloudSyncUserConfig = {
  mode: "off",
  webhookUrl: "",
  supabaseUrl: "",
  supabaseKey: "",
  supabaseTable: "nexus_encrypted_backup",
};

export function loadCloudSyncConfig(): CloudSyncUserConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const o = JSON.parse(raw) as Partial<CloudSyncUserConfig>;
    return {
      mode: o.mode === "webhook" || o.mode === "supabase" ? o.mode : "off",
      webhookUrl: typeof o.webhookUrl === "string" ? o.webhookUrl : "",
      supabaseUrl: typeof o.supabaseUrl === "string" ? o.supabaseUrl : "",
      supabaseKey: typeof o.supabaseKey === "string" ? o.supabaseKey : "",
      supabaseTable:
        typeof o.supabaseTable === "string" && o.supabaseTable.trim()
          ? o.supabaseTable.trim()
          : DEFAULT_CONFIG.supabaseTable,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveCloudSyncConfig(cfg: CloudSyncUserConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  } catch {
    // no-op
  }
}

export type CloudPushResult = { ok: boolean; status?: number; message: string };

export async function pushEncryptedNxcPayload(
  sealedTrimmed: string,
  cfg: CloudSyncUserConfig
): Promise<CloudPushResult> {
  if (!sealedTrimmed) {
    return { ok: false, message: "Kein versiegelter Inhalt" };
  }
  if (cfg.mode === "off") {
    return { ok: false, message: "Cloud-Sync ist deaktiviert" };
  }

  const fingerprint = await computeSealedFingerprintHex(sealedTrimmed);
  const meta = {
    kind: "NEXUS_MASTER_SEALED" as const,
    fingerprintSha256: fingerprint,
    pushedAt: new Date().toISOString(),
    client: "nexus-pwa",
  };

  if (cfg.mode === "webhook") {
    const url = cfg.webhookUrl.trim();
    if (!url.startsWith("https://") && !url.startsWith("http://localhost")) {
      return { ok: false, message: "Webhook-URL muss https sein (oder localhost)" };
    }
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sealed: sealedTrimmed, meta }),
        signal: AbortSignal.timeout(18_000),
      });
      if (!res.ok) {
        return { ok: false, status: res.status, message: `Webhook HTTP ${res.status}` };
      }
      return { ok: true, status: res.status, message: "Webhook-Antwort OK" };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Netzwerkfehler" };
    }
  }

  const base = cfg.supabaseUrl.replace(/\/$/, "");
  const key = cfg.supabaseKey.trim();
  const table = cfg.supabaseTable.trim();
  if (!base.startsWith("https://")) {
    return { ok: false, message: "Supabase-URL muss https sein" };
  }
  if (!key || !table) {
    return { ok: false, message: "Supabase Key und Tabelle erforderlich" };
  }

  const row = {
    sealed_payload: sealedTrimmed,
    device_tag: fingerprint.slice(0, 24),
    updated_at: meta.pushedAt,
  };

  try {
    const res = await fetch(`${base}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(22_000),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return {
        ok: false,
        status: res.status,
        message: `Supabase ${res.status}${t ? `: ${t.slice(0, 120)}` : ""}`,
      };
    }
    return { ok: true, status: res.status, message: "Supabase-Zeile geschrieben" };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Netzwerkfehler" };
  }
}
