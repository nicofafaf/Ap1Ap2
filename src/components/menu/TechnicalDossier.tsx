import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { buildNeuralMentorReport } from "../../lib/math/learningAnalytics";
import { useShallow } from "zustand/react/shallow";
import { openCertVerifyHash } from "../../lib/security/certExporter";
import {
  loadCloudSyncConfig,
  saveCloudSyncConfig,
  type CloudSyncMode,
  type CloudSyncUserConfig,
} from "../../lib/security/cloudSync";
import { useGameStore } from "../../store/useGameStore";
import { ExamSlideshow } from "./ExamSlideshow";
import { useNexusI18n } from "../../lib/i18n/I18nProvider";
import type { NexusLocale } from "../../lib/i18n/translationEngine";
import {
  runNexusHealthCheck,
  type NexusHealthReport,
} from "../../lib/system/healthCheck";
import type { NestedMessages } from "../../lib/i18n/translationEngine";

type TechnicalDossierProps = {
  open: boolean;
  onClose: () => void;
};

function trimUiSentence(s: string) {
  return s.replace(/\s*\.\s*$/u, "").trim();
}

type Pillar = { title: string; body: string; pattern: string; detail: string };

function readDossierPillars(messages: NestedMessages): Pillar[] {
  const dossier = messages.dossier;
  if (!dossier || typeof dossier !== "object") return [];
  const raw = (dossier as Record<string, unknown>).pillars;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (p): p is Pillar =>
      Boolean(p) &&
      typeof p === "object" &&
      typeof (p as Pillar).title === "string" &&
      typeof (p as Pillar).body === "string"
  );
}

function SystemHealthSection({ examMode }: { examMode: boolean }) {
  const { t } = useNexusI18n();
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<NexusHealthReport | null>(null);

  const run = async () => {
    setBusy(true);
    try {
      setReport(await runNexusHealthCheck());
    } finally {
      setBusy(false);
    }
  };

  return (
    <ExamHint
      examMode={examMode}
      pattern="Health / Self-Test"
      detail="runNexusHealthCheck — Curriculum-Zählung je LF + AES-GCM Roundtrip"
    >
      <div
        style={{
          borderRadius: 12,
          border: "1px solid rgba(52, 211, 153, 0.35)",
          background: "rgba(6, 28, 22, 0.35)",
          padding: "14px 16px",
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: ".2em",
            color: "rgba(167, 243, 208, 0.88)",
            marginBottom: 8,
          }}
        >
          {t("dossier.healthKicker")}
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 12, lineHeight: 1.5, color: "rgba(203, 213, 225, 0.88)" }}>
          {t("dossier.healthBlurb")}
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void run()}
          style={{
            borderRadius: 8,
            border: "1px solid rgba(52, 211, 153, 0.45)",
            background: busy ? "rgba(30, 30, 30, 0.5)" : "rgba(6, 40, 28, 0.75)",
            color: "rgba(167, 243, 208, 0.96)",
            letterSpacing: ".12em",
            fontSize: 10,
            padding: "10px 14px",
            cursor: busy ? "wait" : "pointer",
          }}
        >
          {busy ? t("dossier.healthRunning") : t("dossier.healthRun")}
        </button>
        {report ? (
          <div style={{ marginTop: 14, fontSize: 12, color: "rgba(226, 232, 240, 0.9)" }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: report.ok ? "#6ee7b7" : "#fca5a5" }}>
              {report.ok ? t("dossier.healthOk") : t("dossier.healthFail")}
            </div>
            <div style={{ display: "grid", gap: 6, fontVariantNumeric: "tabular-nums" }}>
              {report.lfRows.map((row) => (
                <div key={row.lf} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ opacity: 0.85 }}>
                    {t("dossier.healthLf")} {row.lf.replace("LF", "")}
                  </span>
                  <span>
                    {t("dossier.healthExercises")}: {row.curriculumExercises}
                  </span>
                  <span>
                    {t("dossier.healthRegistry")}: {row.registryEntryPresent ? "OK" : "—"}
                  </span>
                </div>
              ))}
              <div style={{ marginTop: 6 }}>
                {t("dossier.healthAes")}: {report.aesRoundtripOk ? "OK" : report.aesError ?? "—"}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </ExamHint>
  );
}

function NeuralMentorSection({ examMode }: { examMode: boolean }) {
  const { t } = useNexusI18n();
  const { learningLeitnerByExerciseId, learningCorrectByLf } = useGameStore(
    useShallow((s) => ({
      learningLeitnerByExerciseId: s.learningLeitnerByExerciseId,
      learningCorrectByLf: s.learningCorrectByLf,
    }))
  );

  const report = useMemo(
    () => buildNeuralMentorReport(learningLeitnerByExerciseId, learningCorrectByLf),
    [learningLeitnerByExerciseId, learningCorrectByLf]
  );

  return (
    <ExamHint
      examMode={examMode}
      pattern="Facade + Heuristik"
      detail="buildNeuralMentorReport kapselt Leitner/Ebbinghaus — das Dossier zeigt nur die Coaching-Schicht"
    >
      <div
        style={{
          padding: "14px 16px",
          borderRadius: 12,
          border: "1px solid rgba(250, 204, 21, 0.35)",
          background: "linear-gradient(145deg, rgba(30, 24, 8, 0.55) 0%, rgba(12, 18, 28, 0.72) 100%)",
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: ".22em",
            color: "rgba(253, 224, 71, 0.88)",
            marginBottom: 8,
          }}
        >
          {t("dossier.mentorKicker")}
        </div>
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: ".04em",
            color: "rgba(254, 243, 199, 0.95)",
          }}
        >
          {trimUiSentence(report.headline)}
        </h3>
        <p
          style={{
            margin: "12px 0 0",
            fontSize: 13,
            lineHeight: 1.6,
            color: "rgba(253, 230, 138, 0.88)",
            fontStyle: "italic",
          }}
        >
          {trimUiSentence(report.coaching)}
        </p>
        <div
          style={{
            marginTop: 14,
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "rgba(15, 23, 42, 0.65)",
              border: "1px solid rgba(52, 211, 153, 0.35)",
            }}
          >
            <div style={{ fontSize: 9, letterSpacing: ".14em", color: "rgba(148, 163, 184, 0.9)" }}>
              {t("dossier.mentorReadiness")}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                fontVariantNumeric: "tabular-nums",
                color: "rgba(167, 243, 208, 0.96)",
              }}
            >
              {report.examReadyScore}
              <span style={{ fontSize: 12, opacity: 0.75 }}> / 100</span>
            </div>
          </div>
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "rgba(15, 23, 42, 0.55)",
              border: "1px solid rgba(34, 211, 238, 0.32)",
            }}
          >
            <div style={{ fontSize: 9, letterSpacing: ".14em", color: "rgba(148, 163, 184, 0.88)" }}>
              {t("dossier.mentorWeeks")}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                color: "rgba(186, 230, 253, 0.94)",
              }}
            >
              ~{report.estimatedWeeksToPruefung}
            </div>
          </div>
        </div>

        {report.focusAreas.length > 0 ? (
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: ".18em",
                color: "rgba(148, 163, 184, 0.85)",
                marginBottom: 8,
              }}
            >
              {t("dossier.mentorFocus")}
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, color: "rgba(226, 232, 240, 0.9)" }}>
              {report.focusAreas.map((f) => (
                <li key={f.lf} style={{ marginBottom: 6, fontSize: 13, lineHeight: 1.45 }}>
                  <strong style={{ color: "rgba(250, 204, 21, 0.92)" }}>{f.label}</strong>
                  {" — "}
                  {trimUiSentence(f.reason)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div style={{ marginTop: 14 }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: ".18em",
              color: "rgba(148, 163, 184, 0.85)",
              marginBottom: 8,
            }}
          >
            {t("dossier.mentorActions")}
          </div>
          <ol style={{ margin: 0, paddingLeft: 20, color: "rgba(203, 213, 225, 0.92)" }}>
            {report.actions.map((a, i) => (
              <li key={i} style={{ marginBottom: 8, fontSize: 13, lineHeight: 1.5 }}>
                {trimUiSentence(a)}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </ExamHint>
  );
}

function ExamHint({
  pattern,
  detail,
  examMode,
  children,
  style,
}: {
  pattern: string;
  detail: string;
  examMode: boolean;
  children: ReactNode;
  style?: CSSProperties;
}) {
  if (!examMode) return <>{children}</>;
  const title = `${pattern} — ${detail}`;
  return (
    <span title={title} style={{ ...style, cursor: "help", outline: "1px dashed rgba(34,211,238,0.28)" }}>
      {children}
    </span>
  );
}

function LivePerformanceSection({ examMode }: { examMode: boolean }) {
  const { t } = useNexusI18n();
  const [lcpMs, setLcpMs] = useState<number | null>(null);
  const [fidMs, setFidMs] = useState<number | null>(null);
  const [inpMs, setInpMs] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("web-vitals").then(({ onLCP, onINP }) => {
      onLCP((m) => {
        if (!cancelled) setLcpMs(Math.round(m.value));
      });
      onINP((m) => {
        if (!cancelled) setInpMs(Math.round(m.value));
      });
    });
    let po: PerformanceObserver | null = null;
    try {
      po = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          const pe = e as PerformanceEventTiming;
          if (typeof pe.processingStart === "number" && !cancelled) {
            setFidMs(Math.round(pe.processingStart - pe.startTime));
          }
        }
      });
      po.observe({ type: "first-input", buffered: true } as PerformanceObserverInit);
    } catch {
      po = null;
    }
    return () => {
      cancelled = true;
      po?.disconnect();
    };
  }, []);

  const cell = (label: string, value: string, hint: string, pattern: string, detail: string) => (
    <ExamHint
      examMode={examMode}
      pattern={pattern}
      detail={detail}
      style={{ display: "block", flex: "1 1 120px", minWidth: 100 }}
    >
      <div
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid rgba(51, 65, 85, 0.5)",
          background: "rgba(15, 23, 42, 0.35)",
        }}
      >
        <div
          style={{
            fontSize: 9,
            letterSpacing: ".18em",
            color: "rgba(148, 163, 184, 0.9)",
            marginBottom: 6,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            color: "rgba(186, 230, 253, 0.96)",
          }}
        >
          {value}
        </div>
        <div style={{ marginTop: 4, fontSize: 10, color: "rgba(148, 163, 184, 0.82)" }}>{hint}</div>
      </div>
    </ExamHint>
  );

  return (
    <ExamHint
      examMode={examMode}
      pattern="Observer + Callback-API"
      detail="web-vitals registriert Metriken asynchron; PerformanceObserver subscribed buffered first-input — entkoppelt vom Render-Zyklus (ähnlich Observer Pattern)"
    >
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          borderRadius: 12,
          border: "1px solid rgba(34, 211, 238, 0.28)",
          background: "rgba(8, 22, 32, 0.4)",
          padding: "14px 16px",
          marginBottom: 4,
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: ".2em",
            color: "rgba(103, 232, 249, 0.78)",
            marginBottom: 10,
          }}
        >
          {t("dossier.liveVitals")}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {cell(
            "LCP",
            lcpMs == null ? "—" : `${lcpMs} ms`,
            t("dossier.vitalsLcpHint"),
            "Performance Timeline API",
            "Browser liefert paint-relevante Entries; Auswertung dekorativ entkoppelt (passive Metrik)"
          )}
          {cell(
            "FID",
            fidMs == null ? "—" : `${fidMs} ms`,
            t("dossier.vitalsFidHint"),
            "PerformanceObserver",
            "Erstes Eingabe-Event: Messlatte für Input-Latenz ohne Store-Mutation"
          )}
          {cell(
            "INP",
            inpMs == null ? "—" : `${inpMs} ms`,
            t("dossier.vitalsInpHint"),
            "web-vitals library",
            "Kapselt INP-Berechnung — Strategy-ähnliche Kapselung der Messlogik"
          )}
        </div>
        <p
          style={{
            margin: "12px 0 0",
            fontSize: 11,
            lineHeight: 1.5,
            color: "rgba(148, 163, 184, 0.88)",
          }}
        >
          {t("dossier.vitalsFootnote")}
        </p>
      </motion.section>
    </ExamHint>
  );
}

function CloudBackupSection() {
  const { t } = useNexusI18n();
  const [cfg, setCfg] = useState<CloudSyncUserConfig>(() => loadCloudSyncConfig());
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pushNexusCloudBackup = useGameStore((s) => s.pushNexusCloudBackup);

  const persist = useCallback((next: CloudSyncUserConfig) => {
    setCfg(next);
    saveCloudSyncConfig(next);
  }, []);

  const onMode = (mode: CloudSyncMode) => {
    persist({ ...cfg, mode });
  };

  const send = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await pushNexusCloudBackup();
      setMsg(`${r.ok ? "OK" : "Fehler"}: ${r.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid rgba(167, 139, 250, 0.35)",
        background: "rgba(24, 12, 40, 0.42)",
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: ".2em",
          color: "rgba(216, 180, 254, 0.85)",
          marginBottom: 8,
        }}
      >
        {t("dossier.cloudTitle")}
      </div>
      <p style={{ margin: "0 0 12px", fontSize: 12, lineHeight: 1.5, color: "rgba(203, 213, 225, 0.88)" }}>
        {t("dossier.cloudBlurb")}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        {(["off", "webhook", "supabase"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onMode(m)}
            style={{
              borderRadius: 8,
              border:
                cfg.mode === m
                  ? "1px solid rgba(250, 204, 21, 0.55)"
                  : "1px solid rgba(51, 65, 85, 0.55)",
              background: cfg.mode === m ? "rgba(40, 32, 8, 0.75)" : "rgba(15, 23, 42, 0.45)",
              color: "rgba(226, 232, 240, 0.92)",
              letterSpacing: ".08em",
              fontSize: 10,
              padding: "8px 10px",
              cursor: "pointer",
            }}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>
      {cfg.mode === "webhook" ? (
        <label style={{ display: "block", marginBottom: 8, fontSize: 11, color: "rgba(186, 230, 253, 0.85)" }}>
          {t("dossier.cloudWebhook")}
          <input
            value={cfg.webhookUrl}
            onChange={(e) => persist({ ...cfg, webhookUrl: e.target.value })}
            placeholder="https://…"
            style={{
              display: "block",
              width: "100%",
              marginTop: 6,
              borderRadius: 8,
              border: "1px solid rgba(51, 65, 85, 0.65)",
              background: "rgba(15, 23, 42, 0.55)",
              color: "rgba(248, 250, 252, 0.95)",
              padding: "8px 10px",
              boxSizing: "border-box",
            }}
          />
        </label>
      ) : null}
      {cfg.mode === "supabase" ? (
        <>
          <label style={{ display: "block", marginBottom: 8, fontSize: 11, color: "rgba(186, 230, 253, 0.85)" }}>
            {t("dossier.cloudSupabaseUrl")}
            <input
              value={cfg.supabaseUrl}
              onChange={(e) => persist({ ...cfg, supabaseUrl: e.target.value })}
              placeholder="https://xxxx.supabase.co"
              style={{
                display: "block",
                width: "100%",
                marginTop: 6,
                borderRadius: 8,
                border: "1px solid rgba(51, 65, 85, 0.65)",
                background: "rgba(15, 23, 42, 0.55)",
                color: "rgba(248, 250, 252, 0.95)",
                padding: "8px 10px",
                boxSizing: "border-box",
              }}
            />
          </label>
          <label style={{ display: "block", marginBottom: 8, fontSize: 11, color: "rgba(186, 230, 253, 0.85)" }}>
            {t("dossier.cloudSupabaseKey")}
            <input
              value={cfg.supabaseKey}
              onChange={(e) => persist({ ...cfg, supabaseKey: e.target.value })}
              placeholder="eyJ…"
              autoComplete="off"
              style={{
                display: "block",
                width: "100%",
                marginTop: 6,
                borderRadius: 8,
                border: "1px solid rgba(51, 65, 85, 0.65)",
                background: "rgba(15, 23, 42, 0.55)",
                color: "rgba(248, 250, 252, 0.95)",
                padding: "8px 10px",
                boxSizing: "border-box",
              }}
            />
          </label>
          <label style={{ display: "block", marginBottom: 8, fontSize: 11, color: "rgba(186, 230, 253, 0.85)" }}>
            {t("dossier.cloudTable")}
            <input
              value={cfg.supabaseTable}
              onChange={(e) => persist({ ...cfg, supabaseTable: e.target.value })}
              style={{
                display: "block",
                width: "100%",
                marginTop: 6,
                borderRadius: 8,
                border: "1px solid rgba(51, 65, 85, 0.65)",
                background: "rgba(15, 23, 42, 0.55)",
                color: "rgba(248, 250, 252, 0.95)",
                padding: "8px 10px",
                boxSizing: "border-box",
              }}
            />
          </label>
        </>
      ) : null}
      <button
        type="button"
        disabled={busy || cfg.mode === "off"}
        onClick={() => void send()}
        style={{
          marginTop: 6,
          borderRadius: 8,
          border: "1px solid rgba(52, 211, 153, 0.45)",
          background: cfg.mode === "off" ? "rgba(30, 30, 30, 0.5)" : "rgba(6, 40, 28, 0.75)",
          color: "rgba(167, 243, 208, 0.96)",
          letterSpacing: ".12em",
          fontSize: 10,
          padding: "10px 14px",
          cursor: busy || cfg.mode === "off" ? "not-allowed" : "pointer",
        }}
      >
        {busy ? t("dossier.cloudSendBusy") : t("dossier.cloudSend")}
      </button>
      {msg ? (
        <div style={{ marginTop: 10, fontSize: 11, color: "rgba(186, 230, 253, 0.9)" }}>{msg}</div>
      ) : null}
    </div>
  );
}

export function TechnicalDossier({ open, onClose }: TechnicalDossierProps) {
  const { t, locale, setLocale, messages } = useNexusI18n();
  const [deckOpen, setDeckOpen] = useState(false);
  const pillars = useMemo(() => readDossierPillars(messages), [messages]);

  const { examPresentationMode, setExamPresentationMode } = useGameStore(
    useShallow((s) => ({
      examPresentationMode: s.examPresentationMode,
      setExamPresentationMode: s.setExamPresentationMode,
    }))
  );

  const setLang = (next: NexusLocale) => {
    setLocale(next);
  };

  return (
    <>
      <ExamSlideshow open={deckOpen} onClose={() => setDeckOpen(false)} />
      <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Technical Portfolio"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(2, 6, 14, 0.82)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(16px, 4vw, 32px)",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(720px, 100%)",
              maxHeight: "min(88vh, 820px)",
              overflow: "auto",
              borderRadius: 16,
              border: "1px solid rgba(34, 211, 238, 0.38)",
              background:
                "linear-gradient(165deg, rgba(8, 18, 28, 0.96) 0%, rgba(4, 10, 18, 0.98) 100%)",
              boxShadow:
                "0 0 48px rgba(34, 211, 238, 0.18), inset 0 0 60px rgba(15, 23, 42, 0.35)",
              padding: "clamp(20px, 3vw, 32px)",
              fontFamily: 'var(--nx-font-sans, "Inter", system-ui, sans-serif)',
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 18,
              }}
            >
              <ExamHint
                examMode={examPresentationMode}
                pattern="Composite View"
                detail="Dialog-Overlay kombiniert Titel, Schalter und Scroll-Region — Kompositionsmuster für modale Flächen"
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: ".24em",
                      color: "rgba(103, 232, 249, 0.78)",
                    }}
                  >
                    {t("dossier.portfolioKicker")}
                  </div>
                  <h2
                    style={{
                      margin: "10px 0 0",
                      fontSize: "clamp(22px, 4vw, 28px)",
                      fontWeight: 700,
                      letterSpacing: ".04em",
                      color: "rgba(248, 250, 252, 0.96)",
                    }}
                  >
                    {t("dossier.title")}
                  </h2>
                  <p
                    style={{
                      margin: "10px 0 0",
                      fontSize: 14,
                      lineHeight: 1.55,
                      color: "rgba(186, 230, 253, 0.82)",
                      maxWidth: 520,
                    }}
                  >
                    {t("dossier.subtitle")}
                  </p>
                </div>
              </ExamHint>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 10,
                    letterSpacing: ".12em",
                    color: "rgba(148, 163, 184, 0.9)",
                  }}
                >
                  <span>{t("dossier.language")}</span>
                  <button
                    type="button"
                    onClick={() => setLang("de")}
                    style={{
                      borderRadius: 8,
                      border:
                        locale === "de"
                          ? "1px solid rgba(250, 204, 21, 0.55)"
                          : "1px solid rgba(51, 65, 85, 0.55)",
                      background: locale === "de" ? "rgba(40, 32, 8, 0.75)" : "rgba(15, 23, 42, 0.45)",
                      color: "rgba(226, 232, 240, 0.95)",
                      padding: "6px 10px",
                      cursor: "pointer",
                    }}
                  >
                    {t("dossier.langDe")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang("en")}
                    style={{
                      borderRadius: 8,
                      border:
                        locale === "en"
                          ? "1px solid rgba(250, 204, 21, 0.55)"
                          : "1px solid rgba(51, 65, 85, 0.55)",
                      background: locale === "en" ? "rgba(40, 32, 8, 0.75)" : "rgba(15, 23, 42, 0.45)",
                      color: "rgba(226, 232, 240, 0.95)",
                      padding: "6px 10px",
                      cursor: "pointer",
                    }}
                  >
                    {t("dossier.langEn")}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setDeckOpen(true)}
                  style={{
                    borderRadius: 10,
                    border: "1px solid rgba(34, 211, 238, 0.45)",
                    background: "rgba(8, 44, 58, 0.75)",
                    color: "rgba(186, 230, 253, 0.96)",
                    letterSpacing: ".12em",
                    fontSize: 10,
                    padding: "10px 14px",
                    cursor: "pointer",
                  }}
                >
                  {t("dossier.openDeck")}
                </button>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    fontSize: 10,
                    letterSpacing: ".12em",
                    color: "rgba(250, 204, 21, 0.92)",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={examPresentationMode}
                    onChange={(e) => setExamPresentationMode(e.target.checked)}
                    style={{ accentColor: "#facc15" }}
                  />
                  {t("dossier.examMode")}
                </label>
                <ExamHint
                  examMode={examPresentationMode}
                  pattern="Command"
                  detail="onClose prop — explizites Kommando an den Eltern-Dialog; entkoppelt Button von Navigation"
                >
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      flexShrink: 0,
                      borderRadius: 10,
                      border: "1px solid rgba(148, 163, 184, 0.45)",
                      background: "rgba(15, 23, 42, 0.65)",
                      color: "rgba(226, 232, 240, 0.95)",
                      letterSpacing: ".12em",
                      fontSize: 10,
                      padding: "10px 14px",
                      cursor: "pointer",
                    }}
                  >
                    {t("dossier.close")}
                  </button>
                </ExamHint>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <LivePerformanceSection examMode={examPresentationMode} />
              <NeuralMentorSection examMode={examPresentationMode} />
              <SystemHealthSection examMode={examPresentationMode} />
              <ExamHint
                examMode={examPresentationMode}
                pattern="Strategy"
                detail="Verify-Route per Hash — gleiche Komponente, anderer Navigationszustand; austauschbare Prüf-Strategie"
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(51, 65, 85, 0.5)",
                    background: "rgba(15, 23, 42, 0.35)",
                  }}
                >
                  <span style={{ fontSize: 12, color: "rgba(203, 213, 225, 0.9)" }}>
                    {t("dossier.verifyKicker")}
                  </span>
                  <button
                    type="button"
                    onClick={() => openCertVerifyHash()}
                    style={{
                      borderRadius: 8,
                      border: "1px solid rgba(34, 211, 238, 0.45)",
                      background: "rgba(8, 44, 58, 0.75)",
                      color: "rgba(186, 230, 253, 0.96)",
                      letterSpacing: ".1em",
                      fontSize: 10,
                      padding: "8px 12px",
                      cursor: "pointer",
                    }}
                  >
                    {t("dossier.verifyButton")}
                  </button>
                </div>
              </ExamHint>

              <ExamHint
                examMode={examPresentationMode}
                pattern="Adapter"
                detail="CloudSync einheitliche pushEncryptedNxcPayload — Webhook und Supabase hinter derselben Fassade"
              >
                <CloudBackupSection />
              </ExamHint>

              {pillars.map((p, i) => (
                <ExamHint key={p.title} examMode={examPresentationMode} pattern={p.pattern} detail={p.detail}>
                  <motion.article
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 * i, duration: 0.35, ease: "easeOut" }}
                    style={{
                      borderRadius: 12,
                      border: "1px solid rgba(51, 65, 85, 0.55)",
                      background: "rgba(15, 23, 42, 0.42)",
                      padding: "14px 16px",
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 15,
                        fontWeight: 650,
                        letterSpacing: ".06em",
                        color: "rgba(224, 250, 255, 0.94)",
                      }}
                    >
                      {p.title}
                    </h3>
                    <p
                      style={{
                        margin: "10px 0 0",
                        fontSize: 13,
                        lineHeight: 1.55,
                        color: "rgba(203, 213, 225, 0.88)",
                      }}
                    >
                      {p.body}
                    </p>
                  </motion.article>
                </ExamHint>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
      </AnimatePresence>
    </>
  );
}

export default TechnicalDossier;
