import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import { cyanAccent, edtechCardPanel, goldAccent, sectionH2 } from "./edtechHubTokens";

export type SpotlightCard = {
  id: string;
  tag: string;
  title: string;
  body: string;
  steps?: string[];
  cta: string;
  accent: string;
  onClick: () => void;
};

export type EdtechSpotlightRowProps = {
  title: string;
  cards: SpotlightCard[];
};

export function EdtechSpotlightRow({ title, cards }: EdtechSpotlightRowProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section aria-labelledby="nx-edtech-spotlight">
      <h2 id="nx-edtech-spotlight" style={sectionH2}>
        {title}
      </h2>
      <div style={scrollerStyle}>
        {cards.map((card, index) => (
          <motion.button
            key={card.id}
            type="button"
            onClick={card.onClick}
            initial={reduceMotion ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06 }}
            whileHover={reduceMotion ? undefined : { y: -6, scale: 1.01 }}
            whileTap={reduceMotion ? undefined : { scale: 0.99 }}
            style={{ ...edtechCardPanel, ...cardStyle }}
          >
            <span style={{ ...tagStyle, borderColor: card.accent, color: card.accent }}>{card.tag}</span>
            <strong style={cardTitleStyle}>{card.title}</strong>
            <span style={cardBodyStyle}>{card.body}</span>
            {card.steps?.length ? (
              <ol style={stepsStyle}>
                {card.steps.map((step, i) => (
                  <li key={step} style={stepStyle}>
                    <span style={{ ...stepNumStyle, background: card.accent }}>{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            ) : null}
            <span style={{ ...ctaStyle, color: card.accent }}>{card.cta} →</span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

const scrollerStyle: CSSProperties = {
  display: "flex",
  gap: 16,
  overflowX: "auto",
  paddingBottom: 8,
  scrollSnapType: "x mandatory",
  WebkitOverflowScrolling: "touch",
};

const cardStyle: CSSProperties = {
  flex: "0 0 min(340px, 88vw)",
  scrollSnapAlign: "start",
  padding: "22px 22px 20px",
  textAlign: "left",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  gap: 10,
  minHeight: 220,
  background:
    "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(241,245,249,0.95) 100%)",
  border: "1px solid rgba(15,23,42,0.08)",
  boxShadow: "0 20px 48px rgba(15,23,42,0.1)",
};

const tagStyle: CSSProperties = {
  alignSelf: "flex-start",
  fontFamily: "var(--nx-font-mono)",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  padding: "5px 10px",
  borderRadius: 999,
  border: `1px solid ${goldAccent}`,
};

const cardTitleStyle: CSSProperties = {
  fontFamily: "var(--nx-font-sans)",
  fontSize: 22,
  fontWeight: 800,
  color: "#0f172a",
  lineHeight: 1.2,
};

const cardBodyStyle: CSSProperties = {
  fontFamily: "var(--nx-font-sans)",
  fontSize: 15,
  fontWeight: 550,
  color: "#64748b",
  lineHeight: 1.45,
  flex: "1 1 auto",
};

const stepsStyle: CSSProperties = {
  margin: "4px 0 0",
  padding: 0,
  listStyle: "none",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const stepStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontFamily: "var(--nx-font-sans)",
  fontSize: 14,
  fontWeight: 600,
  color: "#334155",
};

const stepNumStyle: CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 6,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "var(--nx-font-mono)",
  fontSize: 12,
  fontWeight: 800,
  color: "#0f172a",
  flexShrink: 0,
};

const ctaStyle: CSSProperties = {
  fontFamily: "var(--nx-font-sans)",
  fontSize: 15,
  fontWeight: 800,
  marginTop: 4,
};
