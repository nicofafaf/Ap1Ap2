import { describe, expect, it } from "vitest";
import {
  computeSealedFingerprintHex,
  openNexusMasterDossier,
  sealNexusMasterDossier,
  tryParseNexusSealedEnvelope,
} from "../../cert/nexusMasterCertificate";

async function sha256Hex(data: Uint8Array): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomKey32(): ArrayBuffer {
  const u = new Uint8Array(32);
  crypto.getRandomValues(u);
  return u.buffer;
}

describe("AES-GCM-256 — Nexus Master Dossier", () => {
  const plain = {
    v: 1 as const,
    kind: "NEXUS_MASTER" as const,
    issuedAt: new Date("2026-05-10T12:00:00.000Z").toISOString(),
    combatRank: "S",
    timeGrade: "A",
    activeLF: 7,
    sectorZero: true as const,
  };

  it("Verschlüsseln → Entschlüsseln liefert identisches Payload (byte-identisch zum JSON-Kanon)", async () => {
    const key = randomKey32();
    const sealed = await sealNexusMasterDossier(plain, key);
    const opened = await openNexusMasterDossier(sealed, key);
    expect(opened).toEqual(plain);

    const plainBytes = new TextEncoder().encode(JSON.stringify(plain));
    const roundtripBytes = new TextEncoder().encode(JSON.stringify(opened));
    const h1 = await sha256Hex(plainBytes);
    const h2 = await sha256Hex(roundtripBytes);
    expect(h2).toBe(h1);
  });

  it("SHA-256 über Klartext-JSON stimmt nach Entschlüsselung mit Hash über entschlüsselte Bytes überein", async () => {
    const key = randomKey32();
    const sealed = await sealNexusMasterDossier(plain, key);
    const before = await sha256Hex(new TextEncoder().encode(JSON.stringify(plain)));
    const opened = await openNexusMasterDossier(sealed, key);
    const after = await sha256Hex(new TextEncoder().encode(JSON.stringify(opened)));
    expect(after).toBe(before);
  });

  it("falscher Schlüssel: Entschlüsselung schlägt fehl (Integrität / AEAD)", async () => {
    const keyA = randomKey32();
    const keyB = randomKey32();
    const sealed = await sealNexusMasterDossier(plain, keyA);
    await expect(openNexusMasterDossier(sealed, keyB)).rejects.toThrow();
  });

  it("Umschlag-Validierung: tryParseNexusSealedEnvelope erkennt Format und IV-Länge", async () => {
    const key = randomKey32();
    const sealed = await sealNexusMasterDossier(plain, key);
    const parsed = tryParseNexusSealedEnvelope(sealed);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.ivBytes).toBe(12);
      expect(parsed.ciphertextBytes).toBeGreaterThanOrEqual(16);
      expect(parsed.envelope.algo).toBe("AES-GCM-256");
    }
  });

  it("Fingerprint des versiegelten Strings ist deterministisch bei gleichem String", async () => {
    const key = randomKey32();
    const a = await sealNexusMasterDossier(plain, key);
    const b = await sealNexusMasterDossier(plain, key);
    expect(a).not.toBe(b);
    const fa = await computeSealedFingerprintHex(a);
    const faAgain = await computeSealedFingerprintHex(a);
    const fb = await computeSealedFingerprintHex(b);
    expect(faAgain).toBe(fa);
    expect(fb).not.toBe(fa);
  });
});
