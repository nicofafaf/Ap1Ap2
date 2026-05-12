import { motion } from "framer-motion";
import type { CSSProperties } from "react";

export type NeuralInitializerProps = {
  onBeginTraining: () => void;
  onOpenOverview: () => void;
  onBeginLearningField: (lf: number) => void;
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
  { lf: 5, ap: "AP1", title: "Datenbanken", focus: "SQL, SELECT, JOIN" },
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
}: NeuralInitializerProps) {
  const ap1Count = LEARNING_FIELDS.filter((item) => item.ap === "AP1").length;
  const ap2Count = LEARNING_FIELDS.length - ap1Count;

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
        padding: "clamp(18px, 4vw, 56px)",
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

      <motion.div
        variants={STAGGER}
        initial="hidden"
        animate="show"
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(1180px, 100%)",
          borderRadius: 36,
          border: "1px solid rgba(251,247,239,0.18)",
          background: "rgba(251,247,239,0.96)",
          color: "var(--nx-learn-ink)",
          padding: "clamp(26px, 4vw, 54px)",
          boxShadow: "0 34px 100px rgba(0,0,0,0.28)",
          pointerEvents: "auto",
        }}
      >
        <div style={heroGridStyle}>
          <motion.section variants={CARD}>
            <div style={eyebrowStyle}>LernenSchule</div>
            <h1 style={headlineStyle}>Deine ruhige Lernzentrale</h1>
            <p style={leadStyle}>
              Alles im Blick: AP1, AP2, alle 12 Lernfelder und ein geführter Start ohne
              Ablenkung
            </p>
            <div style={actionRowStyle}>
              <button type="button" onClick={onOpenOverview} style={ctaStyle}>
                Lernübersicht öffnen
              </button>
              <button type="button" onClick={onBeginTraining} style={secondaryCtaStyle}>
                Geführtes Beispiel starten
              </button>
            </div>
          </motion.section>

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
        </div>

        <motion.div variants={CARD} style={fieldGridStyle} aria-label="Alle Lernfelder">
          {LEARNING_FIELDS.map((field) => (
            <button
              key={field.lf}
              type="button"
              onClick={() => onBeginLearningField(field.lf)}
              style={fieldCardStyle}
            >
              <span style={fieldMetaStyle}>
                LF{field.lf} · {field.ap}
              </span>
              <strong>{field.title}</strong>
              <span>{field.focus}</span>
            </button>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

const heroGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
  gap: "clamp(24px, 4vw, 48px)",
  alignItems: "stretch",
};

const headlineStyle: CSSProperties = {
  margin: 0,
  maxWidth: 720,
  fontFamily: "var(--nx-font-sans)",
  fontSize: "clamp(46px, 6vw, 86px)",
  lineHeight: 0.95,
  letterSpacing: "-0.07em",
  color: "var(--nx-learn-ink)",
};

const leadStyle: CSSProperties = {
  margin: "22px 0 0",
  maxWidth: 640,
  fontFamily: "var(--nx-font-sans)",
  fontSize: "clamp(20px, 2.4vw, 27px)",
  lineHeight: 1.45,
  color: "var(--nx-learn-muted)",
};

const eyebrowStyle: CSSProperties = {
  marginBottom: 18,
  fontFamily: "var(--nx-font-sans)",
  fontSize: 14,
  fontWeight: 700,
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
  fontSize: 18,
  fontWeight: 800,
  padding: "16px 18px",
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
  gap: 14,
  padding: 18,
  borderRadius: 28,
  background: "rgba(22,32,25,0.06)",
  border: "1px solid var(--nx-learn-line)",
};

const statStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: 18,
  padding: "14px 16px",
  borderRadius: 20,
  background: "rgba(255,255,255,0.46)",
  color: "var(--nx-learn-muted)",
};

const fieldGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(210px, 100%), 1fr))",
  gap: 14,
  marginTop: 34,
};

const fieldCardStyle: CSSProperties = {
  minHeight: 132,
  textAlign: "left",
  border: "1px solid var(--nx-learn-line)",
  borderRadius: 24,
  background: "linear-gradient(160deg, rgba(255,255,255,0.62), rgba(238,229,213,0.62))",
  color: "var(--nx-learn-muted)",
  padding: 18,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  fontFamily: "var(--nx-font-sans)",
  fontSize: 15,
  lineHeight: 1.35,
  cursor: "pointer",
};

const fieldMetaStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(22,32,25,0.48)",
};

export default NeuralInitializer;
