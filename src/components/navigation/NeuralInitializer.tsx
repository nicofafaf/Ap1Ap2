import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { useState } from "react";
import type { LearningField } from "../../data/nexusRegistry";
import { CURRICULUM_BY_LF } from "../../lib/learning/learningRegistry";
import { useNexusI18n } from "../../lib/i18n/I18nProvider";
import { useGameStore } from "../../store/useGameStore";

export type NeuralInitializerProps = {
  onBeginTraining: () => void;
  onOpenOverview: () => void;
  onBeginLearningField: (lf: number) => void;
  /** Wenn gesetzt: schließbare Variante über der Karte (zweiter Besuch) */
  onReturnToMap?: () => void;
};

const STAGGER = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.11, delayChildren: 0.08 },
  },
};

const CARD = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 260, damping: 26 },
  },
};

const LEARNING_FIELDS = [
  { lf: 1, ap: "AP1", title: "Wirtschaft & Recht", focus: "Kalkulation, Vertrag, Grundlagen" },
  { lf: 2, ap: "AP1", title: "IT-Systeme", focus: "Client, Server, DNS, DHCP" },
  { lf: 3, ap: "AP1", title: "Netzwerke", focus: "Subnetze, Dienste, Ports" },
  { lf: 4, ap: "AP1", title: "Hardware", focus: "Integration, Treiber, Tests" },
  { lf: 5, ap: "AP1", title: "Datenbanken", focus: "Listen verstehen, filtern, wiederfinden" },
  { lf: 6, ap: "AP1", title: "Skripte", focus: "Abläufe, Bedingungen, Schleifen" },
  { lf: 7, ap: "AP2", title: "OOP", focus: "Klassen, Objekte, Interfaces" },
  { lf: 8, ap: "AP2", title: "Datenmodelle", focus: "ERD, Schlüssel, Normalformen" },
  { lf: 9, ap: "AP2", title: "Schnittstellen", focus: "REST, HTTP, Statuscodes" },
  { lf: 10, ap: "AP2", title: "UX & Barrierefreiheit", focus: "Kontrast, Fokus, Formulare" },
  { lf: 11, ap: "AP2", title: "Security", focus: "CIA, Risiko, Maßnahmen" },
  { lf: 12, ap: "AP2", title: "Projekt", focus: "Scrum, Planung, Risiken" },
] as const;

export function NeuralInitializer({
  onBeginTraining,
  onOpenOverview,
  onBeginLearningField,
  onReturnToMap,
}: NeuralInitializerProps) {
  const { t } = useNexusI18n();
  const [fieldsExpanded, setFieldsExpanded] = useState(false);
  const ap1Count = LEARNING_FIELDS.filter((item) => item.ap === "AP1").length;
  const ap2Count = LEARNING_FIELDS.length - ap1Count;
  const learningCorrectByLf = useGameStore((s) => s.learningCorrectByLf);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20000,
        background:
          "radial-gradient(ellipse 70% 48% at 50% 18%, rgba(214,181,111,0.16), transparent 58%), linear-gradient(160deg, #121a14 0%, #0b100d 52%, #070a08 100%)",
        display: "grid",
        placeItems: "center",
        padding: "clamp(20px, 4vw, 64px)",
        overflow: "auto",
        pointerEvents: "auto",
      }}
    >
      <motion.div
        animate={{ opacity: [0.22, 0.3, 0.24] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 26%, rgba(251,247,239,0.09), transparent 28%), radial-gradient(circle at 18% 82%, rgba(73,112,87,0.18), transparent 34%)",
          pointerEvents: "none",
        }}
      />

      {onReturnToMap ? (
        <div
          style={{
            position: "fixed",
            top: "max(16px, env(safe-area-inset-top))",
            right: "max(16px, env(safe-area-inset-right))",
            zIndex: 20001,
            pointerEvents: "auto",
          }}
        >
          <motion.button
            type="button"
            onClick={onReturnToMap}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              borderRadius: 999,
              border: "1px solid rgba(251,247,239,0.35)",
              background: "rgba(8, 12, 10, 0.72)",
              color: "rgba(251,247,239,0.96)",
              letterSpacing: ".06em",
              fontSize: 20,
              fontWeight: 700,
              padding: "14px 20px",
              cursor: "pointer",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              boxShadow: "0 18px 48px rgba(0,0,0,0.35)",
            }}
          >
            {t("map.backToMap")}
          </motion.button>
        </div>
      ) : null}

      <motion.div
        variants={STAGGER}
        initial="hidden"
        animate="show"
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(1340px, 100%)",
          borderRadius: 40,
          border: "1px solid rgba(251,247,239,0.18)",
          background: "rgba(251,247,239,0.96)",
          color: "var(--nx-learn-ink)",
          padding: "clamp(30px, 4.6vw, 64px)",
          boxShadow: "0 34px 100px rgba(0,0,0,0.28)",
          pointerEvents: "auto",
        }}
      >
        <div style={heroGridStyle}>
          <motion.section variants={CARD}>
            <div style={eyebrowStyle}>{t("hub.eyebrow")}</div>
            <h1 style={hubHeadlineStyle}>{t("hub.headline")}</h1>
            <p style={leadStyle}>{t("hub.lead")}</p>
            <div style={actionRowStyle}>
              <button type="button" onClick={onOpenOverview} style={ctaStyle}>
                {t("hub.ctaMap")}
              </button>
              <button type="button" onClick={onBeginTraining} style={secondaryCtaStyle}>
                {t("hub.ctaDemo")}
              </button>
            </div>
          </motion.section>

          {fieldsExpanded ? (
            <motion.aside variants={CARD} style={statsPanelStyle} aria-label="Lernstatus Übersicht">
              <div style={statStyle}>
                <strong>{LEARNING_FIELDS.length}</strong>
                <span>Lernfelder</span>
              </div>
              <div style={statStyle}>
                <strong>{ap1Count}</strong>
                <span>AP1 Fokus</span>
              </div>
              <div style={statStyle}>
                <strong>{ap2Count}</strong>
                <span>AP2 Fokus</span>
              </div>
            </motion.aside>
          ) : (
            <motion.aside variants={CARD} style={statsOneLineAsideStyle} aria-hidden>
              <p style={statsOneLineTextStyle}>{t("hub.statsOneLine")}</p>
            </motion.aside>
          )}
        </div>

        {fieldsExpanded ? (
          <>
            <motion.button
              type="button"
              variants={CARD}
              onClick={() => setFieldsExpanded(false)}
              style={collapseListBtnStyle}
            >
              {t("hub.hideList")}
            </motion.button>
            <motion.div variants={CARD} style={fieldGridStyle} aria-label="Alle Lernfelder">
              {LEARNING_FIELDS.map((field) => {
                const lfKey = `LF${field.lf}` as LearningField;
                const total = CURRICULUM_BY_LF[lfKey]?.length ?? 0;
                const solved = new Set(learningCorrectByLf[lfKey] ?? []).size;

                return (
                  <button
                    key={field.lf}
                    type="button"
                    onClick={() => onBeginLearningField(field.lf)}
                    style={fieldCardStyle}
                  >
                    <span style={fieldVisualStyle} aria-hidden="true">
                      <video
                        src={`/assets/LF${field.lf}GIF.mp4`}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        style={fieldVideoStyle}
                      />
                    </span>
                    <span style={fieldMetaStyle}>
                      <span>Datenträger</span>
                      <b>
                        LF{field.lf} · {field.ap}
                      </b>
                    </span>
                    <strong>{field.title}</strong>
                    <span>{field.focus}</span>
                    <span style={fieldProgressStyle}>
                      Einsteiger · {solved}/{total} Übungen · Starten
                    </span>
                  </button>
                );
              })}
            </motion.div>
          </>
        ) : (
          <motion.button
            type="button"
            variants={CARD}
            onClick={() => setFieldsExpanded(true)}
            style={showListBtnStyle}
          >
            {t("hub.showList")}
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}

const heroGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
  gap: "clamp(28px, 4vw, 56px)",
  alignItems: "stretch",
};

const headlineStyle: CSSProperties = {
  margin: 0,
  maxWidth: 720,
  fontFamily: "var(--nx-font-sans)",
  fontSize: "clamp(48px, 6vw, 90px)",
  fontWeight: 100,
  lineHeight: 0.95,
  letterSpacing: "-0.07em",
  color: "var(--nx-learn-ink)",
};

const hubHeadlineStyle: CSSProperties = {
  ...headlineStyle,
  fontSize: "clamp(34px, 4.5vw, 56px)",
  lineHeight: 1.05,
  letterSpacing: "-0.05em",
};

const leadStyle: CSSProperties = {
  margin: "22px 0 0",
  maxWidth: 640,
  fontFamily: "var(--nx-font-sans)",
  fontSize: "clamp(24px, 2.5vw, 30px)",
  fontWeight: 400,
  lineHeight: 1.45,
  color: "var(--nx-learn-muted)",
};

const eyebrowStyle: CSSProperties = {
  marginBottom: 18,
  fontFamily: "var(--nx-font-mono)",
  fontSize: 20,
  fontWeight: 650,
  letterSpacing: ".08em",
  color: "rgba(22,32,25,0.58)",
  textTransform: "uppercase",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 14,
  marginTop: 30,
};

const ctaStyle: CSSProperties = {
  minWidth: 230,
  borderRadius: 999,
  border: "1px solid rgba(22,32,25,0.12)",
  background: "linear-gradient(135deg, #18251c 0%, #314832 100%)",
  color: "rgba(251,247,239,0.98)",
  letterSpacing: ".02em",
  fontSize: 22,
  fontWeight: 800,
  padding: "18px 22px",
  cursor: "pointer",
  pointerEvents: "auto",
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",
};

const secondaryCtaStyle: CSSProperties = {
  ...ctaStyle,
  background: "rgba(22,32,25,0.06)",
  color: "var(--nx-learn-ink)",
};

const statsPanelStyle: CSSProperties = {
  display: "grid",
  gap: 18,
  padding: 22,
  borderRadius: 32,
  background: "rgba(22,32,25,0.06)",
  border: "1px solid var(--nx-learn-line)",
};

const statsOneLineAsideStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px 22px",
  borderRadius: 32,
  background: "rgba(22,32,25,0.05)",
  border: "1px solid var(--nx-learn-line)",
  alignSelf: "stretch",
};

const statsOneLineTextStyle: CSSProperties = {
  margin: 0,
  fontFamily: "var(--nx-font-mono)",
  fontSize: "clamp(18px, 2vw, 22px)",
  fontWeight: 650,
  letterSpacing: ".04em",
  color: "var(--nx-learn-muted)",
  textAlign: "center",
};

const showListBtnStyle: CSSProperties = {
  marginTop: 36,
  width: "100%",
  maxWidth: 520,
  borderRadius: 999,
  border: "1px solid rgba(22,32,25,0.14)",
  background: "rgba(22,32,25,0.06)",
  color: "var(--nx-learn-ink)",
  letterSpacing: ".04em",
  fontSize: 22,
  fontWeight: 750,
  padding: "16px 22px",
  cursor: "pointer",
  pointerEvents: "auto",
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",
};

const collapseListBtnStyle: CSSProperties = {
  marginTop: 28,
  marginBottom: 0,
  alignSelf: "flex-start",
  borderRadius: 999,
  border: "1px solid rgba(22,32,25,0.12)",
  background: "transparent",
  color: "var(--nx-learn-muted)",
  letterSpacing: ".06em",
  fontSize: 18,
  fontWeight: 650,
  padding: "10px 18px",
  cursor: "pointer",
  pointerEvents: "auto",
  touchAction: "manipulation",
};

const statStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: 18,
  padding: "18px 20px",
  borderRadius: 24,
  background: "rgba(255,255,255,0.46)",
  color: "var(--nx-learn-muted)",
  fontFamily: "var(--nx-font-mono)",
  fontSize: 22,
  lineHeight: 1.2,
};

const fieldGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
  gap: 18,
  marginTop: 42,
};

const fieldCardStyle: CSSProperties = {
  minHeight: 196,
  position: "relative",
  overflow: "hidden",
  textAlign: "left",
  border: "1px solid var(--nx-learn-line)",
  borderRadius: 30,
  background:
    "linear-gradient(160deg, rgba(255,255,255,0.78), rgba(238,229,213,0.68)), radial-gradient(circle at 12% 10%, rgba(214,181,111,0.16), transparent 36%)",
  color: "var(--nx-learn-muted)",
  padding: 24,
  display: "flex",
  flexDirection: "column",
  gap: 14,
  fontFamily: "var(--nx-font-sans)",
  fontSize: 24,
  lineHeight: 1.32,
  cursor: "pointer",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 18px 50px rgba(22,32,25,0.08)",
};

const fieldVisualStyle: CSSProperties = {
  position: "relative",
  display: "block",
  width: "100%",
  aspectRatio: "16 / 9",
  marginBottom: 4,
  overflow: "hidden",
  borderRadius: 22,
  background:
    "radial-gradient(circle at 50% 42%, rgba(214,181,111,0.2), rgba(22,32,25,0.08) 58%, rgba(22,32,25,0.16))",
  boxShadow: "inset 0 0 0 1px rgba(22,32,25,0.08)",
  pointerEvents: "none",
};

const fieldVideoStyle: CSSProperties = {
  display: "block",
  width: "100%",
  height: "100%",
  objectFit: "contain",
  filter: "saturate(0.72) contrast(0.92) brightness(0.9)",
  mixBlendMode: "multiply",
  opacity: 0.84,
};

const fieldMetaStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  fontFamily: "var(--nx-font-mono)",
  fontSize: 20,
  fontWeight: 650,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "rgba(22,32,25,0.48)",
};

const fieldProgressStyle: CSSProperties = {
  marginTop: "auto",
  alignSelf: "flex-start",
  borderRadius: 999,
  border: "1px solid rgba(214,181,111,0.32)",
  background: "rgba(214,181,111,0.14)",
  color: "var(--nx-learn-ink)",
  fontFamily: "var(--nx-font-mono)",
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: "0.02em",
  padding: "10px 14px",
};

export default NeuralInitializer;
