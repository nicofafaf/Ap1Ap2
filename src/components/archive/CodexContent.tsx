import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LearningField } from "../../data/nexusRegistry";
import { CodeBlock } from "./CodeBlock";
import { useGameStore } from "../../store/useGameStore";
import { VisualSQL } from "./VisualSQL";

export type CodexReferenceItem =
  | {
      id: string;
      chapter: string;
      type: "note";
      title: string;
      body: string;
    }
  | {
      id: string;
      chapter: string;
      type: "sql" | "csharp";
      title: string;
      code: string;
    }
  | {
      id: string;
      chapter: string;
      type: "visual";
      title: string;
      visual: "sql-relations";
    };

type CodexContentProps = {
  lf: LearningField;
  chapter: string | null;
  items: CodexReferenceItem[];
};

export function CodexContent({ lf, chapter, items }: CodexContentProps) {
  const completeCodexCard = useGameStore((s) => s.completeCodexCard);
  const codexCompletedCards = useGameStore((s) => s.codexCompletedCards);
  const [glowId, setGlowId] = useState<string | null>(null);
  const [cardIndex, setCardIndex] = useState(0);

  const filtered = useMemo(
    () => (chapter ? items.filter((x) => x.chapter === chapter) : items),
    [items, chapter]
  );

  useEffect(() => {
    setCardIndex(0);
  }, [chapter, items]);

  const safeIndex = Math.min(cardIndex, Math.max(filtered.length - 1, 0));
  const activeCard = filtered[safeIndex] ?? null;

  const cycleCard = (step: number) => {
    if (filtered.length === 0) return;
    const next = (safeIndex + step + filtered.length) % filtered.length;
    const nextId = filtered[next]?.id ?? null;
    if (nextId) {
      setGlowId(nextId);
      window.setTimeout(() => setGlowId(null), 360);
    }
    setCardIndex(next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="button"
          onClick={() => cycleCard(-1)}
          style={{
            borderRadius: 8,
            border: "1px solid rgba(255,214,165,0.45)",
            background: "rgba(232,233,240,0.03)",
            color: "var(--nx-bone-90)",
            fontSize: 20,
            textTransform: "uppercase",
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          Vorherige Karte
        </button>
        <button
          type="button"
          onClick={() => cycleCard(1)}
          style={{
            borderRadius: 8,
            border: "1px solid rgba(255,214,165,0.45)",
            background: "rgba(232,233,240,0.03)",
            color: "var(--nx-bone-90)",
            fontSize: 20,
            textTransform: "uppercase",
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          Naechste Karte
        </button>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {activeCard ? (
          <motion.section
            key={activeCard.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) cycleCard(1);
              if (info.offset.x > 60) cycleCard(-1);
            }}
            initial={{ opacity: 0, x: 28 }}
            animate={{
              opacity: 1,
              x: 0,
              boxShadow:
                glowId === activeCard.id
                  ? "0 0 0 1px rgba(255,214,165,0.7), 0 0 28px rgba(255,214,165,0.45)"
                  : "0 10px 22px rgba(0,0,0,0.24)",
            }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.24 }}
            style={{
              borderRadius: 12,
              border: "1px solid rgba(255, 214, 165, 0.35)",
              background: "rgba(12, 13, 16, 0.56)",
              backdropFilter: "blur(14px) saturate(120%)",
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--nx-bone-90)", fontSize: 42 }}>
              <span aria-hidden>{activeCard.type === "note" ? "✦" : activeCard.type === "visual" ? "⬡" : "⌬"}</span>
              <span style={{ fontWeight: 100, letterSpacing: "0.08em" }}>{activeCard.title}</span>
            </div>
            {activeCard.type === "sql" || activeCard.type === "csharp" ? (
              <div style={{ marginTop: 12 }}>
                <CodeBlock lf={lf} title={activeCard.title} lang={activeCard.type} code={activeCard.code} />
              </div>
            ) : null}
            {activeCard.type === "visual" ? (
              <div style={{ marginTop: 12 }}>
                <VisualSQL title={activeCard.title} />
              </div>
            ) : null}
            {activeCard.type === "note" ? (
              <>
                <div
                  style={{
                    marginTop: 8,
                    color: "var(--nx-bone-90)",
                    fontSize: 20,
                    lineHeight: 1.5,
                    maxWidth: 860,
                  }}
                >
                  {"body" in activeCard ? activeCard.body : ""}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    completeCodexCard(activeCard.id);
                    setGlowId(activeCard.id);
                    window.setTimeout(() => setGlowId(null), 520);
                  }}
                  disabled={Boolean(codexCompletedCards[activeCard.id])}
                  style={{
                    marginTop: 10,
                    borderRadius: 8,
                    border: Boolean(codexCompletedCards[activeCard.id])
                      ? "1px solid rgba(255,214,165,0.65)"
                      : "1px solid rgba(255,214,165,0.4)",
                    background: Boolean(codexCompletedCards[activeCard.id])
                      ? "rgba(255,214,165,0.14)"
                      : "rgba(232,233,240,0.04)",
                    color: "var(--nx-bone-90)",
                    fontSize: 20,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "8px 14px",
                    cursor: Boolean(codexCompletedCards[activeCard.id]) ? "default" : "pointer",
                  }}
                >
                  {Boolean(codexCompletedCards[activeCard.id]) ? "Erledigt" : "Als erledigt markieren"}
                </button>
              </>
            ) : null}
            <div style={{ marginTop: 12, color: "var(--nx-bone-50)", fontSize: 20 }}>
              Karte {safeIndex + 1} von {filtered.length}
            </div>
          </motion.section>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ color: "var(--nx-bone-50)", fontSize: 20 }}
          >
            Kein Inhalt im Kapitel
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CodexContent;
