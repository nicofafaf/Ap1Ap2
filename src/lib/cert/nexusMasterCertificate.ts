/**
 * Nexus Master Certificate — AES-GCM über Geräteschlüssel (lokal), Ausgabe als Base64-Dossier
 */

const DEVICE_KEY_STORAGE = "nexus.masterCert.deviceKey.v1";

function u8ToB64(u8: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < u8.length; i += 1) bin += String.fromCharCode(u8[i]!);
  return btoa(bin);
}

function b64ToU8(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

export async function getOrCreateDeviceKeyRaw(): Promise<ArrayBuffer> {
  let b64 = localStorage.getItem(DEVICE_KEY_STORAGE);
  if (!b64) {
    const buf = new Uint8Array(32);
    crypto.getRandomValues(buf);
    b64 = u8ToB64(buf);
    localStorage.setItem(DEVICE_KEY_STORAGE, b64);
  }
  return b64ToU8(b64).buffer.slice(0) as ArrayBuffer;
}

export type NexusMasterCertPlain = {
  v: 1;
  kind: "NEXUS_MASTER";
  issuedAt: string;
  combatRank: string;
  timeGrade: string;
  activeLF: number;
  sectorZero: true;
};

export type NexusSealedEnvelope = {
  algo: string;
  iv: string;
  ciphertext: string;
};

export async function sealNexusMasterDossier(
  plain: NexusMasterCertPlain,
  deviceKeyRaw: ArrayBuffer
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    deviceKeyRaw as BufferSource,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder().encode(JSON.stringify(plain));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    enc as BufferSource
  );
  const envelope = {
    algo: "AES-GCM-256",
    iv: u8ToB64(iv),
    ciphertext: u8ToB64(new Uint8Array(ct)),
  };
  return u8ToB64(new TextEncoder().encode(JSON.stringify(envelope)));
}

export function tryParseNexusSealedEnvelope(
  sealedB64: string
):
  | { ok: true; envelope: NexusSealedEnvelope; ivBytes: number; ciphertextBytes: number }
  | { ok: false; error: string } {
  const t = sealedB64.trim();
  if (!t) return { ok: false, error: "Leerer String" };
  let inner: string;
  try {
    inner = new TextDecoder().decode(b64ToU8(t));
  } catch {
    return { ok: false, error: "Äußeres Base64 nicht dekodierbar" };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(inner);
  } catch {
    return { ok: false, error: "Inneres JSON nicht lesbar" };
  }
  if (!parsed || typeof parsed !== "object") return { ok: false, error: "Umschlag kein Objekt" };
  const o = parsed as Record<string, unknown>;
  const algo = o.algo;
  const iv = o.iv;
  const ciphertext = o.ciphertext;
  if (algo !== "AES-GCM-256") {
    return { ok: false, error: `Unerwarteter Algorithmus: ${String(algo)}` };
  }
  if (typeof iv !== "string" || typeof ciphertext !== "string") {
    return { ok: false, error: "iv/ciphertext fehlen oder sind kein String" };
  }
  let ivLen = 0;
  let ctLen = 0;
  try {
    ivLen = b64ToU8(iv).length;
    ctLen = b64ToU8(ciphertext).length;
  } catch {
    return { ok: false, error: "iv oder ciphertext ist kein gültiges Base64" };
  }
  if (ivLen !== 12) return { ok: false, error: `IV muss 12 Byte sein (ist ${ivLen})` };
  if (ctLen < 16) return { ok: false, error: "Ciphertext zu kurz für GCM" };
  return {
    ok: true,
    envelope: { algo, iv, ciphertext },
    ivBytes: ivLen,
    ciphertextBytes: ctLen,
  };
}

export async function computeSealedFingerprintHex(sealedB64: string): Promise<string> {
  const enc = new TextEncoder().encode(sealedB64.trim());
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function openNexusMasterDossier(
  sealedB64: string,
  deviceKeyRaw: ArrayBuffer
): Promise<NexusMasterCertPlain> {
  const parsed = tryParseNexusSealedEnvelope(sealedB64);
  if (!parsed.ok) throw new Error(parsed.error);
  const { envelope } = parsed;
  const key = await crypto.subtle.importKey(
    "raw",
    deviceKeyRaw as BufferSource,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  const iv = b64ToU8(envelope.iv);
  const ct = b64ToU8(envelope.ciphertext);
  const dec = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    ct as BufferSource
  );
  const json = new TextDecoder().decode(dec);
  return JSON.parse(json) as NexusMasterCertPlain;
}
