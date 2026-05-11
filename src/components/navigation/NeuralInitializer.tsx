import { motion } from "framer-motion";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { useBossAudioEngine } from "../../lib/audio/bossAudioEngine";

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

const FLICKER = {
  opacity: [0.55, 1, 0.72, 1, 0.85],
  transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" as const },
};

export function NeuralInitializer({ onBeginTraining }: NeuralInitializerProps) {
  const [phase, setPhase] = useState<InitPhase>("identity");
  const { playDossierTeletypeTick, stopDossierTeletypeTick } = useBossAudioEngine();

  useEffect(() => {
    void playDossierTeletypeTick();
    const t = window.setTimeout(() => stopDossierTeletypeTick(), 2800);
    return () => {
      window.clearTimeout(t);
      stopDossierTeletypeTick();
    };
  }, [phase, playDossierTeletypeTick, stopDossierTeletypeTick]);

  useEffect(() => {
    if (phase !== "identity") return;
    const t = window.setTimeout(() => setPhase("neural"), 5200);
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
        background: "radial-gradient(ellipse 65% 50% at 50% 42%, rgba(34,211,238,0.12), #020617)",
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
        animate={{ opacity: [0.04, 0.09, 0.05] }}
        transition={{ duration: 3.2, repeat: Infinity }}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34,211,238,0.03) 2px, rgba(34,211,238,0.03) 4px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          width: "min(420px, 90vw)",
          marginBottom: 28,
          pointerEvents: "none",
        }}
      >
        <svg viewBox="0 0 200 200" style={{ width: "100%", display: "block", pointerEvents: "none" }}>
          <defs>
            <radialGradient id="irisGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(34,211,238,0.95)" />
              <stop offset="55%" stopColor="rgba(8,145,178,0.55)" />
              <stop offset="100%" stopColor="rgba(2,12,20,0.9)" />
            </radialGradient>
            <clipPath id="eyeClip">
              <ellipse cx="100" cy="100" rx="88" ry="52" />
            </clipPath>
          </defs>
          <ellipse cx="100" cy="100" rx="92" ry="56" fill="rgba(6,20,32,0.92)" stroke="rgba(34,211,238,0.45)" strokeWidth="2" />
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
              stroke="rgba(103,232,249,0.85)"
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
          width: "min(520px, 94vw)",
          borderRadius: 12,
          border: "1px solid rgba(34,211,238,0.28)",
          background: "linear-gradient(168deg, rgba(5,14,22,0.94) 0%, rgba(4,11,18,0.98) 100%)",
          padding: "18px 20px 22px",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03), 0 0 32px rgba(0,255,255,0.08)",
          pointerEvents: "auto",
        }}
      >
        <motion.div
          animate={FLICKER}
          style={{
            fontSize: 9,
            letterSpacing: ".32em",
            color: "rgba(103, 232, 249, 0.72)",
            marginBottom: 12,
          }}
        >
          {phase === "identity" && "SYSTEM · IDENTITÄTSPRÜFUNG"}
          {phase === "neural" && "SYSTEM · NEURAL LINK"}
          {phase === "ready" && "SYSTEM · TRAINING"}
        </motion.div>

        {phase === "identity" && (
          <>
            <motion.p variants={LINE} style={terminalLine}>
              NEXUS KERNEL v9 · Erstkontakt erkannt
            </motion.p>
            <motion.p variants={LINE} style={terminalLine}>
              Neue Architektur-Signatur wird zugelassen
            </motion.p>
            <motion.p variants={LINE} style={terminalLine}>
              Retina-Mapping · biometrische Stabilität OK
            </motion.p>
            <motion.p variants={LINE} style={{ ...terminalLine, color: "rgba(167,139,250,0.92)" }}>
              Du wirst als Architekt registriert
            </motion.p>
          </>
        )}

        {phase === "neural" && (
          <>
            <motion.p variants={LINE} style={terminalLine}>
              Synapsen-Handshake · Latenz 12 ms
            </motion.p>
            <motion.p variants={LINE} style={terminalLine}>
              Cipher-Kanal wird aufgebaut
            </motion.p>
            <motion.p variants={LINE} style={terminalLine}>
              Bereit für geführten Trainingskampf in LF1
            </motion.p>
            <button type="button" onClick={onNeuralAck} style={ctaStyle}>
              NEURAL LINK BESTÄTIGEN
            </button>
          </>
        )}

        {phase === "ready" && (
          <>
            <motion.p variants={LINE} style={terminalLine}>
              Trainings-Titan: reduzierte Aggression
            </motion.p>
            <motion.p variants={LINE} style={terminalLine}>
              Folge den Dossier-Hinweisen während des Kampfes
            </motion.p>
            <button
              type="button"
              onClick={onBeginTraining}
              style={{
                ...ctaStyle,
                borderColor: "rgba(167,139,250,0.55)",
                background: "rgba(46,16,80,0.45)",
              }}
            >
              TRAINING STARTEN
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

const terminalLine: CSSProperties = {
  margin: "0 0 10px",
  fontFamily: '"JetBrains Mono",ui-monospace,monospace',
  fontSize: 12,
  lineHeight: 1.5,
  color: "rgba(186, 230, 253, 0.92)",
};

const ctaStyle: CSSProperties = {
  marginTop: 14,
  width: "100%",
  borderRadius: 10,
  border: "1px solid rgba(34,211,238,0.5)",
  background: "rgba(7,25,36,0.75)",
  color: "rgba(186,230,253,0.97)",
  letterSpacing: ".18em",
  fontSize: 10,
  padding: "12px 14px",
  cursor: "pointer",
  pointerEvents: "auto",
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",
};

export default NeuralInitializer;
