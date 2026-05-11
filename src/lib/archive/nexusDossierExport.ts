/** Versiegeltes Nexus-Dossier: AES-GCM, Schlüssel via PBKDF2 (Passphrase + Salt) */

const EXPORT_VERSION = 1;
const PBKDF2_ITERATIONS = 210_000;
/** Öffentliche Export-Passphrase — im Dossier-Header dokumentiert */
export const NEXUS_DOSSIER_EXPORT_PASSPHRASE = "NEXUS-HALL-ARCHIVE";

function bytesToB64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 1) s += String.fromCharCode(bytes[i]!);
  return btoa(s);
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

export type NexusDossierPayload = {
  exportedAt: string;
  combatArchitectHistory: unknown;
  globalCollection: unknown;
  nexusFragments: number;
  talentLevels: unknown;
  menuSystemMood: unknown;
  sectorAnomalies: unknown;
};

export async function sealNexusDossierJson(
  payload: NexusDossierPayload,
  passphrase: string = NEXUS_DOSSIER_EXPORT_PASSPHRASE
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
  const plain = enc.encode(JSON.stringify(payload));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain)
  );
  return JSON.stringify({
    v: EXPORT_VERSION,
    alg: "PBKDF2-SHA256-AES-GCM",
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToB64(salt),
    iv: bytesToB64(iv),
    ciphertext: bytesToB64(ciphertext),
    hint: "Passphrase: NEXUS-HALL-ARCHIVE (oder eigenes Secret beim Entpacken)",
  });
}

export function downloadTextFile(filename: string, contents: string, mime = "application/json") {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Nur für Tests / externe Tools: entschlüsseln */
export async function openNexusDossierJson(
  sealedJson: string,
  passphrase: string = NEXUS_DOSSIER_EXPORT_PASSPHRASE
): Promise<NexusDossierPayload> {
  const outer = JSON.parse(sealedJson) as {
    v: number;
    salt: string;
    iv: string;
    ciphertext: string;
    iterations: number;
  };
  const salt = b64ToBytes(outer.salt);
  const iv = b64ToBytes(outer.iv);
  const rawCipher = b64ToBytes(outer.ciphertext);
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: outer.iterations ?? PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    rawCipher
  );
  return JSON.parse(new TextDecoder().decode(plain)) as NexusDossierPayload;
}
