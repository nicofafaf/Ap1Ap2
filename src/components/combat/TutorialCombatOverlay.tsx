import { AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useBossAudioEngine } from "../../lib/audio/bossAudioEngine";
import { TransmissionShard } from "./DialogueOverlay";

const MESSAGES: string[] = [
  "TRAINING / SENTINEL — Nutze CIPHER SHIELD (Verteidigungs-Karte) wenn der Puls droht",
  "ANGRIFF — Wähle SYSTEM OVERCLOCK um den Titanen zu fragmentieren",
  "SPEZIAL — Lege INFINITE RECURSION bevor du erneut angreifst um den nächsten Treffer zu verdoppeln",
];

export type TutorialCombatOverlayProps = {
  visible: boolean;
  step: number;
};

export function TutorialCombatOverlay({ visible, step }: TutorialCombatOverlayProps) {
  const { playDossierTeletypeTick, stopDossierTeletypeTick } = useBossAudioEngine();
  const [shown, setShown] = useState(0);
  const text = useMemo(() => MESSAGES[Math.min(step, MESSAGES.length - 1)] ?? "", [step]);

  useEffect(() => {
    setShown(0);
  }, [step, text]);

  useEffect(() => {
    if (!visible || !text) return;
    void playDossierTeletypeTick();
    const cap = window.setTimeout(() => stopDossierTeletypeTick(), 3200);
    return () => {
      window.clearTimeout(cap);
      stopDossierTeletypeTick();
    };
  }, [visible, text, step, playDossierTeletypeTick, stopDossierTeletypeTick]);

  useEffect(() => {
    if (!visible || shown >= text.length) return;
    const id = window.setTimeout(() => setShown((c) => c + 1), 32);
    return () => window.clearTimeout(id);
  }, [visible, shown, text.length]);

  return (
    <AnimatePresence>
      {visible ? (
        <TransmissionShard
          key="tutorial-dossier"
          origin="tr"
          style={{
            position: "fixed",
            top: 72,
            right: 20,
            zIndex: 160,
            width: "min(560px, calc(100vw - 36px))",
            pointerEvents: "none",
            padding: "14px 18px 16px",
          }}
        >
          <div
            style={{
              fontSize: "max(12px, 0.75rem)",
              letterSpacing: ".28em",
              color: "rgba(212, 212, 216, 0.92)",
              marginBottom: 8,
              fontFamily: "var(--nx-font-sans, Inter, system-ui, sans-serif)",
            }}
          >
            DOSSIER · TRAINING
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--nx-font-sans, Inter, system-ui, sans-serif)",
              fontSize: "clamp(16px, 2.5vw, 18px)",
              lineHeight: 1.55,
              color: "var(--nx-text-primary, #f4f4f5)",
              minHeight: 52,
            }}
          >
            {text.slice(0, shown)}
            <span style={{ opacity: 0.45 }}>▍</span>
          </p>
          <div
            style={{
              marginTop: 10,
              fontSize: "max(12px, 0.75rem)",
              letterSpacing: ".2em",
              color: "rgba(212, 212, 216, 0.88)",
              fontFamily: "var(--nx-font-sans, Inter, system-ui, sans-serif)",
            }}
          >
            SCHRITT {Math.min(step + 1, 3)} / 3
          </div>
        </TransmissionShard>
      ) : null}
    </AnimatePresence>
  );
}

export default TutorialCombatOverlay;
