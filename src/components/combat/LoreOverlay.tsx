import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LearningField } from "../../data/nexusRegistry";
import { typography } from "../../theme/typography";
import { dialogueCornerForIndex, TransmissionShard } from "./DialogueOverlay";

type LoreOverlayProps = {
  currentLF: LearningField;
  lore: string;
  visible?: boolean;
  /** Überschreibt die erste Zeile (zB Sektor Ø) */
  protocolHeading?: string;
};

function splitLoreParagraphs(text: string): string[] {
  const byNl = text
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (byNl.length > 1) return byNl;
  const bySentence = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (bySentence.length > 1) return bySentence;
  const byComma = text
    .split(/,\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (byComma.length > 2) return byComma;
  return [text.trim()];
}

export function LoreOverlay({
  currentLF,
  lore,
  visible = true,
  protocolHeading,
}: LoreOverlayProps) {
  const paragraphs = useMemo(() => splitLoreParagraphs(lore), [lore]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [focusIdx, setFocusIdx] = useState(0);

  useEffect(() => {
    setFocusIdx(0);
  }, [lore, visible]);

  useEffect(() => {
    if (!visible || paragraphs.length < 2) return;
    const root = scrollRef.current;
    if (!root) return;
    const els = root.querySelectorAll<HTMLElement>("[data-lore-p]");
    const ratios = new Map<number, number>();
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const idx = Number((e.target as HTMLElement).dataset.index);
          ratios.set(idx, e.intersectionRatio);
        }
        let best = 0;
        let bestRatio = 0;
        ratios.forEach((r, i) => {
          if (r > bestRatio) {
            bestRatio = r;
            best = i;
          }
        });
        if (bestRatio > 0.22) setFocusIdx(best);
      },
      { root, threshold: [0.2, 0.35, 0.55, 0.75], rootMargin: "-10% 0px -10% 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [visible, paragraphs, lore]);

  useEffect(() => {
    if (!visible || paragraphs.length < 2) return;
    const root = scrollRef.current;
    const el = root?.querySelector<HTMLElement>(`[data-lore-p][data-index="${focusIdx}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusIdx, visible, paragraphs.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        padding: "12px 14px 16px",
        pointerEvents: "none",
      }}
    >
      <TransmissionShard
        origin="bl"
        delay={0}
        style={{ marginBottom: 10, maxWidth: "min(92vw, 520px)", padding: "10px 14px" }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: typography.fontSans,
            fontSize: "max(12px, 0.75rem)",
            fontWeight: 650,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--nx-text-muted, #d4d4d8)",
          }}
        >
          {protocolHeading ?? `${currentLF} Titanen-Protokoll`}
        </p>
      </TransmissionShard>
      <div
        ref={scrollRef}
        style={{
          maxHeight: "min(32vh, 260px)",
          overflowY: paragraphs.length > 1 ? "auto" : "visible",
          scrollSnapType: paragraphs.length > 1 ? "y proximity" : undefined,
          paddingRight: paragraphs.length > 1 ? 6 : 0,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {paragraphs.map((p, i) => (
          <TransmissionShard
            key={`${i}-${p.slice(0, 12)}`}
            origin={dialogueCornerForIndex(i)}
            delay={0.04 * i}
            style={{
              scrollSnapAlign: "start",
              padding: "12px 14px",
              maxWidth: i % 2 === 0 ? "min(92vw, 560px)" : "min(88vw, 480px)",
              marginLeft: i % 2 === 0 ? 0 : "auto",
            }}
          >
            <p
              data-lore-p
              data-index={i}
              className="nx-text-stable"
              style={{
                margin: 0,
                fontFamily: typography.fontSans,
                fontSize: typography.bodySize,
                lineHeight: typography.bodyLineHeight,
                color: "var(--nx-text-primary, #f4f4f5)",
                outline: "none",
              }}
            >
              {p}
            </p>
          </TransmissionShard>
        ))}
      </div>
    </motion.div>
  );
}

export default LoreOverlay;
