/**
 * Export des Nexus-Master-Zertifikats (.nxc + optionales PDF) — rein clientseitig
 */

import {
  computeSealedFingerprintHex,
  getOrCreateDeviceKeyRaw,
  openNexusMasterDossier,
  tryParseNexusSealedEnvelope,
  type NexusMasterCertPlain,
} from "../cert/nexusMasterCertificate";

export type NexusCertVerifyOutcome = {
  structureOk: boolean;
  errors: string[];
  algo?: string;
  ivBytes?: number;
  ciphertextBytes?: number;
  fingerprintSha256?: string;
  decryptedOnDevice?: NexusMasterCertPlain;
  decryptError?: string;
};

export async function verifyNexusMasterSealed(
  sealedB64: string,
  options?: { attemptDecrypt?: boolean }
): Promise<NexusCertVerifyOutcome> {
  const trimmed = sealedB64.trim();
  const fingerprintSha256 = await computeSealedFingerprintHex(trimmed);
  const parsed = tryParseNexusSealedEnvelope(trimmed);

  if (!parsed.ok) {
    return {
      structureOk: false,
      errors: [parsed.error],
      fingerprintSha256,
    };
  }

  const out: NexusCertVerifyOutcome = {
    structureOk: true,
    errors: [],
    algo: parsed.envelope.algo,
    ivBytes: parsed.ivBytes,
    ciphertextBytes: parsed.ciphertextBytes,
    fingerprintSha256,
  };

  if (options?.attemptDecrypt) {
    try {
      const key = await getOrCreateDeviceKeyRaw();
      out.decryptedOnDevice = await openNexusMasterDossier(trimmed, key);
    } catch (e) {
      out.decryptError = e instanceof Error ? e.message : "Entschlüsselung fehlgeschlagen";
    }
  }

  return out;
}

export function downloadMasterCertNxc(sealed: string, basename = "nexus-master"): void {
  const blob = new Blob([sealed.trim()], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${basename}-${Date.now()}.nxc`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadMasterCertPdfDossier(sealed: string): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const trimmed = sealed.trim();
  const fp = await computeSealedFingerprintHex(trimmed);
  let plain: NexusMasterCertPlain | null = null;
  try {
    const key = await getOrCreateDeviceKeyRaw();
    plain = await openNexusMasterDossier(trimmed, key);
  } catch {
    plain = null;
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Nexus Master Architekt — Dossier", pageW / 2, y, { align: "center" });
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Versiegelung: AES-GCM-256 (geraetegebunden)", 14, y);
  y += 6;
  doc.text(`SHA-256 Fingerprint (Export-String): ${fp}`, 14, y);
  y += 8;

  if (plain) {
    doc.setFont("helvetica", "bold");
    doc.text("Klartext (nur auf Ausstellungsgerat lesbar)", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(JSON.stringify(plain, null, 2), pageW - 28);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 4;
  } else {
    doc.setFont("helvetica", "italic");
    const w = doc.splitTextToSize(
      "Klartext nicht lesbar — anderer Browser oder Schlussel. Strukturprufung uber Verify-Check moglich",
      pageW - 28
    );
    doc.text(w, 14, y);
    y += w.length * 5 + 4;
  }

  doc.setFont("helvetica", "bold");
  doc.text("Versiegelter Block (Auszug)", 14, y);
  y += 6;
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  const excerpt =
    trimmed.length > 420 ? `${trimmed.slice(0, 420)}\n[... ${trimmed.length - 420} Zeichen ...]` : trimmed;
  const exLines = doc.splitTextToSize(excerpt, pageW - 28);
  doc.text(exLines, 14, y);

  doc.save(`nexus-master-dossier-${Date.now()}.pdf`);
}

export const CERT_VERIFY_HASH = "cert-verify";

export function openCertVerifyHash(): void {
  window.location.hash = CERT_VERIFY_HASH;
}

export function closeCertVerifyHash(): void {
  if (window.location.hash === `#${CERT_VERIFY_HASH}`) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}
