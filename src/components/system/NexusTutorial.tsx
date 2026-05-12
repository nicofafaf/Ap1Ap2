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
    label: "Codex",
    text: "Hier startest du mit kurzen Karten statt Textwüsten — ein Tipp pro Karte, dann weiter",
  },
  {
    id: "map",
    label: "Sektoren-Karte",
    text: "So siehst du, welche Lernfelder als Nächstes dran sind — später klickst du einen Sektor für die Mission",
  },
  {
    id: "terminal",
    label: "SQL-Terminal",
    text: "Hier tippst du echte Abfragen wie in der Prüfung — wir führen dich in drei Mini-Schritten an SELECT, FROM und WHERE",
  },
];

function normalizeSql(raw: string): string {
  return raw.replace(/\s+/g, " ").replace(/;/g, "").trim().toLowerCase();
}

export function NexusTutorial() {
  const tutorialStepIndex = useGameStore((s) => s.tutorialStepIndex);
  const isFirstBoot = useGameStore((s) => s.isFirstBoot);
  const hasCompletedInitialization = useGameStore((s) => s.hasCompletedInitialization);
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
  const stepHuman = tutorialStepIndex + 1;
  const stepTotal = SPOTLIGHTS.length;

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

  if (!isFirstBoot || !hasCompletedInitialization) return null;

  const cardTypography = {
    title: { fontSize: "clamp(1.35rem, 3.6vw, 1.85rem)", fontWeight: 600, letterSpacing: "0.04em", lineHeight: 1.25 },
    subtitle: { fontSize: "clamp(0.95rem, 2.4vw, 1.05rem)", fontWeight: 500, opacity: 0.92, lineHeight: 1.45 },
    body: { fontSize: "clamp(0.95rem, 2.5vw, 1.1rem)", lineHeight: 1.55 },
    hint: { fontSize: "clamp(0.85rem, 2.1vw, 0.95rem)", lineHeight: 1.45, color: "var(--nx-bone-50)" },
    code: { fontSize: "clamp(0.8rem, 2vw, 0.95rem)", lineHeight: 1.45 },
  } as const;

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
        <motion.div
          key={spotlight.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.24 }}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            paddingLeft: "max(12px, env(safe-area-inset-left, 0px))",
            paddingRight: "max(12px, env(safe-area-inset-right, 0px))",
            paddingBottom: "max(14px, env(safe-area-inset-bottom, 0px))",
            paddingTop: "min(22vh, 160px)",
            pointerEvents: "none",
            boxSizing: "border-box",
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="nx-tutorial-title"
            style={{
              pointerEvents: "auto",
              width: "min(680px, 100%)",
              maxHeight: "min(78dvh, 720px)",
              overflowX: "hidden",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              borderRadius: 16,
              border: "1px solid rgba(255,214,165,0.52)",
              background: "rgba(10, 10, 14, 0.94)",
              padding: "clamp(14px, 3vw, 22px) clamp(16px, 3.5vw, 24px)",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.45)",
            }}
          >
            <div
              id="nx-tutorial-title"
              style={{ color: "var(--nx-bone-90)", ...cardTypography.title }}
            >
              Architect Awakening
            </div>
            <div style={{ ...cardTypography.hint, marginTop: 8 }}>
              Kurzes Onboarding · Schritt {stepHuman} von {stepTotal}
            </div>
            <div style={{ ...cardTypography.subtitle, color: "var(--nx-bone-90)", marginTop: 12 }}>{spotlight.label}</div>
            <div style={{ ...cardTypography.body, color: "var(--nx-bone-90)", marginTop: 8 }}>{spotlight.text}</div>

            <div
              style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: "1px solid rgba(255,214,165,0.2)",
              }}
            >
              <div style={{ ...cardTypography.subtitle, color: "var(--nx-bone-90)", fontWeight: 600 }}>
                {activeTutorialSql?.title}
              </div>
              <div style={{ color: "var(--nx-bone-50)", marginTop: 6, ...cardTypography.body }}>{activeTutorialSql?.body}</div>
            </div>

            {showAnimeTrack && isTutorialAnimeUnlocked && activeAnimeSql ? (
              <div style={{ color: "var(--nx-bone-90)", marginTop: 10, ...cardTypography.body }}>
                <strong style={{ fontWeight: 600 }}>{activeAnimeSql.title}</strong>
                <span style={{ color: "var(--nx-bone-50)" }}> — {activeAnimeSql.body}</span>
              </div>
            ) : null}

            <pre
              style={{
                margin: "12px 0 0",
                borderRadius: 8,
                border: "1px solid rgba(255,214,165,0.3)",
                background: "rgba(5,5,7,0.92)",
                color: "var(--nx-bone-90)",
                padding: "10px 12px",
                ...cardTypography.code,
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {showAnimeTrack && isTutorialAnimeUnlocked && activeAnimeSql
                ? activeAnimeSql.example
                : activeTutorialSql?.example}
            </pre>

            {animeLocked && !isTutorialAnimeUnlocked ? (
              <div
                style={{
                  marginTop: 12,
                  borderRadius: 8,
                  border: "1px solid rgba(255,214,165,0.34)",
                  background: "rgba(255,214,165,0.06)",
                  color: "var(--nx-bone-90)",
                  ...cardTypography.body,
                  padding: "10px 12px",
                }}
              >
                Anime-Track ist noch gesperrt — freischalten mit der Boot-Query unten
              </div>
            ) : null}

            {isTutorialAnimeUnlocked ? (
              <button
                type="button"
                onClick={() => setShowAnimeTrack((v) => !v)}
                style={{
                  marginTop: 12,
                  borderRadius: 8,
                  border: "1px solid rgba(255,214,165,0.52)",
                  background: "rgba(255,214,165,0.1)",
                  color: "var(--nx-bone-90)",
                  fontSize: "clamp(0.85rem, 2.2vw, 0.95rem)",
                  padding: "10px 14px",
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                }}
              >
                {showAnimeTrack ? "Zu Star-Wars-Beispielen wechseln" : "Anime-Beispiele anzeigen"}
              </button>
            ) : null}

            {canFinish ? (
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ ...cardTypography.subtitle, color: "var(--nx-bone-90)", fontWeight: 600 }}>Boot-Query</div>
                <div style={{ ...cardTypography.hint, marginTop: -4 }}>
                  Tippe exakt dieselbe Zeile wie im Star-Wars-Block: <strong style={{ color: "var(--nx-bone-90)" }}>{sqlUnlock}</strong>
                </div>
                <textarea
                  value={sqlInput}
                  onChange={(e) => {
                    setSqlInput(e.target.value);
                    setSqlState("idle");
                  }}
                  rows={3}
                  spellCheck={false}
                  aria-label="Boot-Query eingeben"
                  placeholder={sqlUnlock}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    borderRadius: 8,
                    border: "1px solid rgba(255,214,165,0.35)",
                    background: "rgba(5,5,7,0.95)",
                    color: "var(--nx-bone-90)",
                    fontSize: "clamp(0.85rem, 2.2vw, 1rem)",
                    padding: "10px 12px",
                    resize: "vertical",
                    minHeight: "4.5rem",
                  }}
                />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
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
                      background: "rgba(255,214,165,0.14)",
                      color: "var(--nx-bone-90)",
                      fontSize: "clamp(0.88rem, 2.3vw, 1rem)",
                      fontWeight: 600,
                      padding: "10px 16px",
                      letterSpacing: "0.05em",
                      cursor: "pointer",
                    }}
                  >
                    Interface freischalten
                  </button>
                  <span style={{ ...cardTypography.hint, flex: "1 1 200px" }}>
                    {sqlState === "ok"
                      ? "Boot erfolgreich"
                      : sqlState === "retry"
                        ? "Noch nicht korrekt — vergleiche Groß- und Kleinschreibung mit dem Beispiel"
                        : "Tipp: kopieren geht auch per Rechtsklick aus dem Beispiel oben"}
                  </span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => advanceTutorialStep()}
                style={{
                  marginTop: 16,
                  borderRadius: 8,
                  border: "1px solid rgba(255,214,165,0.58)",
                  background: "rgba(255,214,165,0.14)",
                  color: "var(--nx-bone-90)",
                  fontSize: "clamp(0.9rem, 2.4vw, 1.05rem)",
                  fontWeight: 600,
                  padding: "10px 18px",
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                }}
              >
                Weiter
              </button>
            )}
          </section>
        </motion.div>
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
              top: "max(8%, env(safe-area-inset-top, 0px))",
              left: "50%",
              transform: "translateX(-50%)",
              maxWidth: "min(520px, calc(100vw - 32px))",
              borderRadius: 12,
              border: "1px solid rgba(255,214,165,0.58)",
              background: "rgba(10, 10, 14, 0.94)",
              color: "var(--nx-bone-90)",
              fontSize: "clamp(0.95rem, 2.5vw, 1.1rem)",
              lineHeight: 1.45,
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
