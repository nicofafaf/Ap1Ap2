import { useState } from "react";
import { motion } from "framer-motion";

type VisualSqlProps = {
  title: string;
};

export function VisualSQL({ title }: VisualSqlProps) {
  const [active, setActive] = useState<"kunden" | "bestellungen" | "kundenid" | null>(null);

  const lineGlow =
    active === "kundenid" || active === "kunden" || active === "bestellungen"
      ? "drop-shadow(0 0 10px rgba(255,214,165,0.7))"
      : "none";

  return (
    <section
      style={{
        borderRadius: 28,
        border: "1px solid var(--nx-learn-line)",
        background: "rgba(251,247,239,0.92)",
        color: "var(--nx-learn-ink)",
        backdropFilter: "blur(14px) saturate(110%)",
        padding: 24,
      }}
    >
      <div style={{ color: "var(--nx-learn-ink)", fontSize: 48, fontWeight: 100, letterSpacing: "-0.04em" }}>{title}</div>
      <div style={{ color: "var(--nx-learn-muted)", fontSize: 24, marginTop: 8 }}>
        Primary Key verbindet Tabellen
      </div>
      <div
        style={{
          marginTop: 22,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
          alignItems: "stretch",
          gap: 14,
        }}
      >
        <button
          type="button"
          onClick={() => setActive("kunden")}
          style={{
            borderRadius: 22,
            border: "1px solid var(--nx-learn-line)",
            background: active === "kunden" ? "rgba(214,181,111,0.2)" : "rgba(255,255,255,0.56)",
            color: "var(--nx-learn-ink)",
            padding: 18,
            textAlign: "left",
            cursor: "pointer",
            fontSize: 24,
          }}
        >
          Kunden Tabelle
          <div style={{ fontSize: 20, color: "var(--nx-learn-muted)", marginTop: 8 }}>ID PK Name Stadt</div>
        </button>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <svg width="170" height="90" viewBox="0 0 170 90" role="img" aria-label="sql relation flow">
            <motion.line
              x1="16"
              y1="45"
              x2="154"
              y2="45"
              stroke="rgba(255,214,165,0.8)"
              strokeWidth="2"
              animate={{ opacity: active ? 1 : 0.4 }}
              transition={{ duration: 0.24 }}
              style={{ filter: lineGlow }}
            />
            <motion.circle
              cx="85"
              cy="45"
              r="6"
              fill="rgba(255,214,165,0.92)"
              animate={{ scale: active ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.6, repeat: active ? Infinity : 0, ease: "easeInOut" }}
            />
          </svg>
        </div>
        <button
          type="button"
          onClick={() => setActive("bestellungen")}
          style={{
            borderRadius: 22,
            border: "1px solid var(--nx-learn-line)",
            background: active === "bestellungen" ? "rgba(214,181,111,0.2)" : "rgba(255,255,255,0.56)",
            color: "var(--nx-learn-ink)",
            padding: 18,
            textAlign: "left",
            cursor: "pointer",
            fontSize: 24,
          }}
        >
          Bestellungen Tabelle
          <div style={{ fontSize: 20, color: "var(--nx-learn-muted)", marginTop: 8 }}>ID PK KundenID FK Betrag</div>
        </button>
      </div>
      <button
        type="button"
        onClick={() => setActive("kundenid")}
        style={{
          marginTop: 12,
          borderRadius: 999,
          border: "1px solid rgba(214,181,111,0.55)",
          background: "rgba(214,181,111,0.18)",
          color: "var(--nx-learn-ink)",
          fontSize: 20,
          textTransform: "uppercase",
          padding: "12px 18px",
          cursor: "pointer",
        }}
      >
        Schlüssel Verbindung aktivieren
      </button>
    </section>
  );
}

export default VisualSQL;
