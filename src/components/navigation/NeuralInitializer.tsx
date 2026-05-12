import { motion } from "framer-motion";
import { useCallback, useEffect, useState, type CSSProperties } from "react";

export type NeuralInitializerProps = {
  onBeginTraining: () => void;
};

type InitPhase = "identity" | "neural" | "ready";

const STAGGER = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.11, delayChildren: 0.08 },
  },
};

const LINE = {
  hidden: { opacity: 0, x: -12 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 420, damping: 32 },
  },
};

export function NeuralInitializer({ onBeginTraining }: NeuralInitializerProps) {
  const [phase, setPhase] = useState<InitPhase>("identity");

  useEffect(() => {
    if (phase !== "identity") return;
    const t = window.setTimeout(() => setPhase("neural"), 1400);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "neural") return;
    const t = window.setTimeout(() => setPhase("ready"), 3600);
    return () => window.clearTimeout(t);
  }, [phase]);

  const onNeuralAck = useCallback(() => {
    setPhase("ready");
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20000,
        background:
          "radial-gradient(ellipse 70% 48% at 50% 18%, rgba(214,181,111,0.16), transparent 58%), linear-gradient(160deg, #121a14 0%, #0b100d 52%, #070a08 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        overflow: "hidden",
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

      <div
        style={{
          position: "relative",
          width: "min(280px, 58vw)",
          marginBottom: 28,
          pointerEvents: "none",
        }}
      >
        <svg viewBox="0 0 200 200" style={{ width: "100%", display: "block", pointerEvents: "none" }}>
          <defs>
            <radialGradient id="irisGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(251,247,239,0.96)" />
              <stop offset="55%" stopColor="rgba(214,181,111,0.46)" />
              <stop offset="100%" stopColor="rgba(18,26,20,0.88)" />
            </radialGradient>
            <clipPath id="eyeClip">
              <ellipse cx="100" cy="100" rx="88" ry="52" />
            </clipPath>
          </defs>
          <ellipse cx="100" cy="100" rx="92" ry="56" fill="rgba(251,247,239,0.08)" stroke="rgba(251,247,239,0.26)" strokeWidth="2" />
          <g clipPath="url(#eyeClip)">
            <circle cx="100" cy="100" r="46" fill="url(#irisGrad)" />
            <motion.ellipse
              cx="100"
              cy="100"
              rx="18"
              ry="18"
              fill="rgba(2,8,14,0.92)"
              animate={{ scale: phase === "identity" ? [1, 1.08, 1] : 1 }}
              transition={{ duration: 1.8, repeat: phase === "identity" ? Infinity : 0 }}
            />
            <motion.line
              x1="12"
              y1="100"
              x2="188"
              y2="100"
              stroke="rgba(214,181,111,0.55)"
              strokeWidth="1.5"
              initial={{ y1: 72, y2: 72 }}
              animate={{
                y1: phase === "identity" ? [72, 128, 72] : 100,
                y2: phase === "identity" ? [72, 128, 72] : 100,
              }}
              transition={{
                duration: 2.8,
                repeat: phase === "identity" ? Infinity : 0,
                ease: "easeInOut",
              }}
            />
          </g>
        </svg>
      </div>

      <motion.div
        variants={STAGGER}
        initial="hidden"
        animate="show"
        key={phase}
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(620px, calc(100vw - 48px))",
          borderRadius: 28,
          border: "1px solid rgba(251,247,239,0.18)",
          background: "rgba(251,247,239,0.94)",
          color: "var(--nx-learn-ink)",
          padding: "32px clamp(24px, 5vw, 44px) 36px",
          boxShadow: "0 34px 100px rgba(0,0,0,0.28)",
          pointerEvents: "auto",
        }}
      >
        <div style={eyebrowStyle}>
          {phase === "identity" && "Willkommen"}
          {phase === "neural" && "Kurz fokussieren"}
          {phase === "ready" && "Training bereit"}
        </div>

        {phase === "identity" && (
          <>
            <motion.p variants={LINE} style={terminalLine}>
              Wir bereiten einen ruhigen Lernraum vor
            </motion.p>
            <motion.p variants={LINE} style={terminalLine}>
              Große Schrift, klare Schritte, wenig Ablenkung
            </motion.p>
          </>
        )}

        {phase === "neural" && (
          <>
            <motion.p variants={LINE} style={terminalLine}>
              Starte mit einer geführten Aufgabe aus LF1
            </motion.p>
            <motion.p variants={LINE} style={terminalLine}>
              Du bekommst Formel, Tipp und Eingabefeld direkt zusammen
            </motion.p>
            <button type="button" onClick={onNeuralAck} style={ctaStyle}>
              Weiter
            </button>
          </>
        )}

        {phase === "ready" && (
          <>
            <motion.p variants={LINE} style={terminalLine}>
              Rechne die Antwort aus und prüfe sie sofort
            </motion.p>
            <motion.p variants={LINE} style={terminalLine}>
              Karten sind nur Hilfen, die Aufgabe bleibt im Mittelpunkt
            </motion.p>
            <button type="button" onClick={onBeginTraining} style={ctaStyle}>
              Training starten
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

const terminalLine: CSSProperties = {
  margin: "0 0 12px",
  fontFamily: "var(--nx-font-sans)",
  fontSize: "clamp(20px, 2.2vw, 24px)",
  lineHeight: 1.55,
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

const ctaStyle: CSSProperties = {
  marginTop: 18,
  width: "100%",
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

export default NeuralInitializer;
