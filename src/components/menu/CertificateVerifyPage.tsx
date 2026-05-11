import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import {
  CERT_VERIFY_HASH,
  closeCertVerifyHash,
  verifyNexusMasterSealed,
  type NexusCertVerifyOutcome,
} from "../../lib/security/certExporter";

function hashIsVerify(): boolean {
  const h = window.location.hash.replace(/^#/, "");
  return h === CERT_VERIFY_HASH;
}

export function CertificateVerifyPage() {
  const [open, setOpen] = useState(hashIsVerify);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<NexusCertVerifyOutcome | null>(null);
  const [decryptTry, setDecryptTry] = useState(false);

  useEffect(() => {
    const sync = () => setOpen(hashIsVerify());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const runVerify = useCallback(async () => {
    setBusy(true);
    setResult(null);
    try {
      const r = await verifyNexusMasterSealed(input, { attemptDecrypt: decryptTry });
      setResult(r);
    } finally {
      setBusy(false);
    }
  }, [input, decryptTry]);

  const handleClose = useCallback(() => {
    closeCertVerifyHash();
    setOpen(false);
    setResult(null);
  }, []);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Nexus Zertifikat Verify"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 400,
            background: "rgba(2, 8, 18, 0.88)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(14px, 3vw, 28px)",
          }}
        >
          <motion.div
            initial={{ scale: 0.96, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            style={{
              width: "min(640px, 100%)",
              maxHeight: "min(90vh, 860px)",
              overflow: "auto",
              borderRadius: 14,
              border: "1px solid rgba(34, 211, 238, 0.42)",
              background: "linear-gradient(168deg, rgba(8, 20, 32, 0.97) 0%, rgba(4, 12, 22, 0.98) 100%)",
              boxShadow: "0 0 48px rgba(34, 211, 238, 0.15)",
              padding: "22px 22px 20px",
              fontFamily: 'var(--nx-font-sans, "Inter", system-ui, sans-serif)',
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: ".22em",
                    color: "rgba(103, 232, 249, 0.78)",
                  }}
                >
                  AUSBILDER · VERIFY
                </div>
                <h2
                  style={{
                    margin: "8px 0 0",
                    fontSize: 20,
                    fontWeight: 700,
                    letterSpacing: ".04em",
                    color: "rgba(248, 250, 252, 0.96)",
                  }}
                >
                  Nexus Master — Authentizitäts-Check
                </h2>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: 13,
                    lineHeight: 1.55,
                    color: "rgba(186, 230, 253, 0.82)",
                    maxWidth: 480,
                  }}
                >
                  Strukturprüfung des versiegelten Strings (AES-GCM-Umschlag). Optional:
                  Entschlüsselung nur auf demselben Gerät wie bei der Ausstellung
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  borderRadius: 10,
                  border: "1px solid rgba(148, 163, 184, 0.45)",
                  background: "rgba(15, 23, 42, 0.65)",
                  color: "rgba(226, 232, 240, 0.95)",
                  letterSpacing: ".1em",
                  fontSize: 10,
                  padding: "9px 12px",
                  cursor: "pointer",
                }}
              >
                SCHLIESSEN
              </button>
            </div>

            <label
              style={{
                display: "block",
                fontSize: 11,
                letterSpacing: ".14em",
                color: "rgba(148, 163, 184, 0.95)",
                marginBottom: 8,
              }}
            >
              Versiegelter Export (.nxc Inhalt)
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Base64-Dossier hier einfügen…"
              style={{
                width: "100%",
                minHeight: 120,
                resize: "vertical",
                borderRadius: 10,
                border: "1px solid rgba(51, 65, 85, 0.65)",
                background: "rgba(15, 23, 42, 0.55)",
                color: "rgba(226, 232, 240, 0.95)",
                fontFamily: "var(--nx-font-mono, ui-monospace, monospace)",
                fontSize: 11,
                padding: 12,
                boxSizing: "border-box",
              }}
            />

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 12,
                cursor: "pointer",
                fontSize: 12,
                color: "rgba(203, 213, 225, 0.9)",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={decryptTry}
                onChange={(e) => setDecryptTry(e.target.checked)}
                style={{ accentColor: "#22d3ee" }}
              />
              Auf diesem Gerät entschlüsseln versuchen
            </label>

            <button
              type="button"
              disabled={busy || !input.trim()}
              onClick={() => void runVerify()}
              style={{
                marginTop: 14,
                width: "100%",
                borderRadius: 10,
                border: "1px solid rgba(34, 211, 238, 0.5)",
                background: busy ? "rgba(15, 23, 42, 0.5)" : "rgba(8, 44, 58, 0.85)",
                color: "rgba(186, 230, 253, 0.98)",
                letterSpacing: ".16em",
                fontSize: 11,
                padding: "12px 14px",
                cursor: busy || !input.trim() ? "wait" : "pointer",
              }}
            >
              {busy ? "PRÜFE…" : "PRÜFUNG STARTEN"}
            </button>

            {result ? (
              <div
                style={{
                  marginTop: 18,
                  padding: 14,
                  borderRadius: 10,
                  border: `1px solid ${
                    result.structureOk ? "rgba(52, 211, 153, 0.45)" : "rgba(248, 113, 113, 0.45)"
                  }`,
                  background: result.structureOk
                    ? "rgba(6, 40, 28, 0.35)"
                    : "rgba(60, 12, 20, 0.35)",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: result.structureOk
                      ? "rgba(167, 243, 208, 0.98)"
                      : "rgba(252, 165, 165, 0.96)",
                    marginBottom: 10,
                  }}
                >
                  {result.structureOk ? "Struktur: gültiger Nexus-Umschlag" : "Struktur: abgelehnt"}
                </div>
                {result.errors.length > 0 ? (
                  <ul style={{ margin: "0 0 10px 16px", padding: 0, color: "rgba(254, 202, 202, 0.92)" }}>
                    {result.errors.map((e) => (
                      <li key={e} style={{ marginBottom: 4 }}>
                        {e}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {result.fingerprintSha256 ? (
                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: "var(--nx-font-mono, monospace)",
                      wordBreak: "break-all",
                      color: "rgba(186, 230, 253, 0.85)",
                      marginBottom: 8,
                    }}
                  >
                    Fingerprint SHA-256: {result.fingerprintSha256}
                  </div>
                ) : null}
                {result.structureOk ? (
                  <div style={{ fontSize: 12, color: "rgba(203, 213, 225, 0.88)", lineHeight: 1.5 }}>
                    <div>Algorithmus: {result.algo}</div>
                    <div>IV: {result.ivBytes} Byte · Ciphertext: {result.ciphertextBytes} Byte</div>
                  </div>
                ) : null}
                {result.decryptedOnDevice ? (
                  <pre
                    style={{
                      marginTop: 12,
                      padding: 10,
                      borderRadius: 8,
                      background: "rgba(15, 23, 42, 0.65)",
                      fontSize: 10,
                      overflow: "auto",
                      color: "rgba(226, 232, 240, 0.92)",
                    }}
                  >
                    {JSON.stringify(result.decryptedOnDevice, null, 2)}
                  </pre>
                ) : null}
                {result.decryptError ? (
                  <div style={{ marginTop: 10, fontSize: 12, color: "rgba(253, 224, 71, 0.9)" }}>
                    Entschlüsselung: {result.decryptError}
                  </div>
                ) : null}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default CertificateVerifyPage;
