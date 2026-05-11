import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import tutorialContent from "../../lernfelder/lf05/tutorial_content.json";
import { useGameStore } from "../../store/useGameStore";
import { playNexusUiClickSound, playNexusUiGlitchSound } from "../../lib/audio/nexusUiAudio";

type SpotlightTarget = {
  id: "codex" | "terminal" | "map";
  label: string;
  text: string;
};

const SPOTLIGHTS: SpotlightTarget[] = [
  {
    id: "codex",
    label: "Codex Fokus",
    text: "Hier startest du Wissen in schnellen Karten Nutze Codex fuer klare Lernpfade",
  },
  {
    id: "map",
    label: "Map Fokus",
    text: "Die Map zeigt deinen Fortschritt Pro Sektor wartet eine neue Mission",
  },
  {
    id: "terminal",
    label: "Terminal Fokus",
    text: "Hier loest du Abfragen Schritt fuer Schritt Jede richtige Eingabe bringt Kontrolle",
  },
];

function normalizeSql(raw: string): string {
  return raw.replace(/\s+/g, " ").replace(/;/g, "").trim().toLowerCase();
}

export function NexusTutorial() {
  const tutorialStepIndex = useGameStore((s) => s.tutorialStepIndex);
  const isFirstBoot = useGameStore((s) => s.isFirstBoot);
  const isTutorialAnimeUnlocked = useGameStore((s) => s.isTutorialAnimeUnlocked);
  const advanceTutorialStep = useGameStore((s) => s.advanceTutorialStep);
  const completeFirstBoot = useGameStore((s) => s.completeFirstBoot);
  const unlockTutorialAnime = useGameStore((s) => s.unlockTutorialAnime);
  const [sqlInput, setSqlInput] = useState("");
  const [sqlState, setSqlState] = useState<"idle" | "ok" | "retry">("idle");
  const [targetRect, setTargetRect] = useState({ x: window.innerWidth * 0.5, y: window.innerHeight * 0.5, radius: 180 });
  const [showSuccessFx, setShowSuccessFx] = useState(false);
  const [showAnimeUnlockCard, setShowAnimeUnlockCard] = useState(false);
  const [showAnimeTrack, setShowAnimeTrack] = useState(false);

  const spotlight = SPOTLIGHTS[tutorialStepIndex] ?? SPOTLIGHTS[0];
  const tutorialData = tutorialContent as {
    steps: Array<{ title: string; body: string; example: string }>;
    anime_steps?: Array<{ title: string; body: string; example: string }>;
    anime_locked?: boolean;
    anime_unlock_card?: string;
    unlock_query: string;
  };
  const tutorialSteps = tutorialData.steps;
  const sqlUnlock = tutorialData.unlock_query;
  const animeSteps = tutorialData.anime_steps ?? [];
  const animeLocked = tutorialData.anime_locked ?? true;
  const animeUnlockCardText = tutorialData.anime_unlock_card ?? "Zugriff auf Anime Datenbank freigeschaltet";
  const activeTutorialSql = tutorialSteps[Math.min(tutorialStepIndex, tutorialSteps.length - 1)];
  const canFinish = tutorialStepIndex >= SPOTLIGHTS.length - 1;
  const activeAnimeSql = animeSteps[Math.min(tutorialStepIndex, Math.max(animeSteps.length - 1, 0))];

  useEffect(() => {
    const updateRect = () => {
      const target = document.querySelector<HTMLElement>(`[data-nx-tutorial="${spotlight.id}"]`);
      if (!target) {
        const fallbackRadius = spotlight.id === "terminal" ? 220 : spotlight.id === "map" ? 240 : 180;
        setTargetRect({
          x: window.innerWidth * 0.5,
          y: window.innerHeight * 0.5,
          radius: fallbackRadius,
        });
        return;
      }
      const rect = target.getBoundingClientRect();
      const radius = Math.max(120, Math.max(rect.width, rect.height) * 0.65 + 36);
      setTargetRect({
        x: rect.left + rect.width * 0.5,
        y: rect.top + rect.height * 0.5,
        radius,
      });
    };

    updateRect();
    const obs = new ResizeObserver(updateRect);
    obs.observe(document.body);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    const id = window.setInterval(updateRect, 360);
    return () => {
      obs.disconnect();
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
      window.clearInterval(id);
    };
  }, [spotlight.id]);

  const overlayBackground = useMemo(
    () =>
      `radial-gradient(circle ${targetRect.radius}px at ${targetRect.x}px ${targetRect.y}px, rgba(255,214,165,0.14) 0%, rgba(255,214,165,0.08) 38%, rgba(3,3,4,0.9) 72%, rgba(2,2,3,0.95) 100%)`,
    [targetRect]
  );

  if (!isFirstBoot) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        pointerEvents: "auto",
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          position: "absolute",
          inset: 0,
          background: overlayBackground,
        }}
      />

      <motion.div
        aria-hidden
        animate={{
          left: targetRect.x,
          top: targetRect.y,
          boxShadow: "0 0 0 1px rgba(255,214,165,0.8), 0 0 46px rgba(255,214,165,0.55)",
        }}
        transition={{ duration: 0.35 }}
        style={{
          position: "absolute",
          width: targetRect.radius * 2,
          height: targetRect.radius * 2,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          border: "1px solid rgba(255,214,165,0.8)",
          pointerEvents: "none",
        }}
      />

      <AnimatePresence mode="wait">
        <motion.section
          key={spotlight.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.24 }}
          style={{
            position: "absolute",
            left: "50%",
            bottom: "6%",
            transform: "translateX(-50%)",
            width: "min(920px, calc(100vw - 28px))",
            borderRadius: 16,
            border: "1px solid rgba(255,214,165,0.52)",
            background: "rgba(10, 10, 14, 0.94)",
            padding: "18px 20px",
          }}
        >
          <div style={{ color: "var(--nx-bone-90)", fontSize: 42, fontWeight: 100, letterSpacing: "0.08em" }}>
            Architect Awakening
          </div>
          <div style={{ color: "var(--nx-bone-90)", fontSize: 24, marginTop: 10 }}>{spotlight.label}</div>
          <div style={{ color: "var(--nx-bone-90)", fontSize: 24, marginTop: 8, lineHeight: 1.35 }}>
            {spotlight.text}
          </div>
          <div style={{ color: "var(--nx-bone-50)", fontSize: 24, marginTop: 8, lineHeight: 1.35 }}>
            {activeTutorialSql?.title} {activeTutorialSql?.body}
          </div>
          {showAnimeTrack && isTutorialAnimeUnlocked && activeAnimeSql ? (
            <div style={{ color: "var(--nx-bone-90)", fontSize: 24, marginTop: 8, lineHeight: 1.35 }}>
              {activeAnimeSql.title} {activeAnimeSql.body}
            </div>
          ) : null}
          <pre
            style={{
              margin: "10px 0 0",
              borderRadius: 8,
              border: "1px solid rgba(255,214,165,0.3)",
              background: "rgba(5,5,7,0.92)",
              color: "var(--nx-bone-90)",
              padding: "10px 12px",
              fontSize: 20,
              overflowX: "auto",
            }}
          >
            {showAnimeTrack && isTutorialAnimeUnlocked && activeAnimeSql
              ? activeAnimeSql.example
              : activeTutorialSql?.example}
          </pre>
          {animeLocked && !isTutorialAnimeUnlocked ? (
            <div
              style={{
                marginTop: 10,
                borderRadius: 8,
                border: "1px solid rgba(255,214,165,0.34)",
                background: "rgba(255,214,165,0.06)",
                color: "var(--nx-bone-90)",
                fontSize: 24,
                padding: "8px 10px",
              }}
            >
              Anime Track gesperrt wird nach Boot Query aktiv
            </div>
          ) : null}
          {isTutorialAnimeUnlocked ? (
            <button
              type="button"
              onClick={() => setShowAnimeTrack((v) => !v)}
              style={{
                marginTop: 10,
                borderRadius: 8,
                border: "1px solid rgba(255,214,165,0.52)",
                background: "rgba(255,214,165,0.1)",
                color: "var(--nx-bone-90)",
                fontSize: 24,
                padding: "8px 12px",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {showAnimeTrack ? "Star Wars Track" : "Anime Track"}
            </button>
          ) : null}

          {canFinish ? (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ color: "var(--nx-bone-90)", fontSize: 24 }}>Boot Query</div>
              <textarea
                value={sqlInput}
                onChange={(e) => {
                  setSqlInput(e.target.value);
                  setSqlState("idle");
                }}
                rows={3}
                spellCheck={false}
                style={{
                  width: "100%",
                  borderRadius: 8,
                  border: "1px solid rgba(255,214,165,0.35)",
                  background: "rgba(5,5,7,0.95)",
                  color: "var(--nx-bone-90)",
                  fontSize: 20,
                  padding: "10px 12px",
                }}
              />
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => {
                    const ok = normalizeSql(sqlInput) === normalizeSql(sqlUnlock);
                    if (!ok) {
                      setSqlState("retry");
                      return;
                    }
                    setSqlState("ok");
                    unlockTutorialAnime();
                    setShowSuccessFx(true);
                    setShowAnimeUnlockCard(true);
                    void playNexusUiGlitchSound();
                    void playNexusUiClickSound(true);
                    window.setTimeout(() => {
                      setShowSuccessFx(false);
                      completeFirstBoot();
                    }, 1450);
                  }}
                  style={{
                    borderRadius: 8,
                    border: "1px solid rgba(255,214,165,0.58)",
                    background: "rgba(255,214,165,0.1)",
                    color: "var(--nx-bone-90)",
                    fontSize: 24,
                    padding: "8px 12px",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Interface freischalten
                </button>
                <span style={{ color: "var(--nx-bone-50)", fontSize: 24 }}>
                  {sqlState === "ok"
                    ? "Boot erfolgreich"
                    : sqlState === "retry"
                      ? "Noch nicht korrekt"
                      : "Nutze SELECT Stern von star wars"}
                </span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => advanceTutorialStep()}
              style={{
                marginTop: 12,
                borderRadius: 8,
                border: "1px solid rgba(255,214,165,0.58)",
                background: "rgba(255,214,165,0.1)",
                color: "var(--nx-bone-90)",
                fontSize: 24,
                padding: "8px 12px",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Weiter
            </button>
          )}
        </motion.section>
      </AnimatePresence>
      <AnimatePresence>
        {showSuccessFx ? (
          <motion.div
            key="boot-success-fx"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "linear-gradient(120deg, rgba(255,214,165,0.06) 0%, rgba(255,214,165,0.6) 35%, rgba(255,214,165,0.08) 70%, rgba(255,214,165,0.5) 100%)",
              mixBlendMode: "screen",
            }}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {showAnimeUnlockCard ? (
          <motion.div
            key="anime-unlock-card"
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: "absolute",
              top: "8%",
              left: "50%",
              transform: "translateX(-50%)",
              borderRadius: 12,
              border: "1px solid rgba(255,214,165,0.58)",
              background: "rgba(10, 10, 14, 0.94)",
              color: "var(--nx-bone-90)",
              fontSize: 24,
              padding: "12px 16px",
              boxShadow: "0 0 36px rgba(255,214,165,0.35)",
            }}
          >
            {animeUnlockCardText}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default NexusTutorial;
