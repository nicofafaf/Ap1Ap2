import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import {
  persistRegistryFingerprint,
  runBootIntegritySuite,
  type BootIntegrityReport,
} from "../../lib/system/maintenanceBot";
import { useGameStore } from "../../store/useGameStore";

export function MaintenanceOverlay() {
  const [report, setReport] = useState<BootIntegrityReport | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [merging, setMerging] = useState(false);
  const mergeLocalKnowledgeWithRegistry = useGameStore((s) => s.mergeLocalKnowledgeWithRegistry);

  useEffect(() => {
    let cancelled = false;
    void runBootIntegritySuite().then((r) => {
      if (!cancelled) setReport(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleMerge = useCallback(async () => {
    if (!report) return;
    setMerging(true);
    try {
      await mergeLocalKnowledgeWithRegistry(report.registryFingerprint);
    } finally {
      setMerging(false);
      setDismissed(true);
    }
  }, [mergeLocalKnowledgeWithRegistry, report]);

  const show =
    !dismissed &&
    report &&
    (report.registryDrift || report.lines.some((l) => !l.ok && l.id !== "learning-registry"));

  if (!show || !report) return null;

  const integrityWarn = report.lines.some((l) => !l.ok);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.35 }}
        style={{
          position: "fixed",
          left: "clamp(12px, 2vw, 24px)",
          right: "clamp(12px, 2vw, 24px)",
          bottom: "clamp(12px, 2vh, 24px)",
          zIndex: 150,
          maxWidth: 520,
          margin: "0 auto",
          borderRadius: 14,
          border: "1px solid rgba(34, 211, 238, 0.4)",
          background: "rgba(4, 12, 22, 0.94)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
          padding: "14px 16px",
          fontFamily: 'var(--nx-font-sans, "Inter", system-ui, sans-serif)',
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: ".22em",
            color: "rgba(103, 232, 249, 0.78)",
            marginBottom: 6,
          }}
        >
          NEXUS MAINTENANCE
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(248, 250, 252, 0.96)" }}>
          {report.registryDrift
            ? "Neue Lerninhalte in der Registry"
            : "System-Integritäts-Hinweis"}
        </div>
        <p
          style={{
            margin: "8px 0 10px",
            fontSize: 12,
            lineHeight: 1.5,
            color: "rgba(186, 230, 253, 0.85)",
          }}
        >
          {report.registryDrift
            ? "Lokales Wissen (localStorage) kann mit dem aktuellen Curriculum zusammengeführt werden — veraltete Übungs-IDs werden entfernt, gültige Leitner-Einträge bleiben"
            : "Eine oder mehrere Boot-Prüfungen sind fehlgeschlagen — Offline-Bundle oder Netz prüfen"}
        </p>
        <ul
          style={{
            margin: "0 0 12px 16px",
            padding: 0,
            fontSize: 11,
            color: "rgba(148, 163, 184, 0.92)",
            lineHeight: 1.45,
          }}
        >
          {report.lines.map((l) => (
            <li key={l.id} style={{ marginBottom: 4 }}>
              <span style={{ color: l.ok ? "rgba(52, 211, 153, 0.9)" : "rgba(248, 113, 113, 0.92)" }}>
                {l.ok ? "OK" : "!"}
              </span>{" "}
              {l.id}: {l.detail}
            </li>
          ))}
        </ul>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {report.registryDrift ? (
            <button
              type="button"
              disabled={merging}
              onClick={() => void handleMerge()}
              style={{
                borderRadius: 10,
                border: "1px solid rgba(52, 211, 153, 0.45)",
                background: "rgba(6, 40, 28, 0.75)",
                color: "rgba(167, 243, 208, 0.96)",
                letterSpacing: ".1em",
                fontSize: 10,
                padding: "9px 12px",
                cursor: merging ? "wait" : "pointer",
              }}
            >
              {merging ? "MERGE…" : "WISSEN ZUSAMMENFÜHREN"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              persistRegistryFingerprint(report.registryFingerprint);
              setDismissed(true);
            }}
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
            {integrityWarn ? "HINWEIS SPEICHERN" : "BASELINE SETZEN"}
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            style={{
              borderRadius: 10,
              border: "1px solid rgba(34, 211, 238, 0.35)",
              background: "rgba(8, 44, 58, 0.75)",
              color: "rgba(186, 230, 253, 0.96)",
              letterSpacing: ".1em",
              fontSize: 10,
              padding: "9px 12px",
              cursor: "pointer",
            }}
          >
            SCHLIESSEN
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default MaintenanceOverlay;
