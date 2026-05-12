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
        borderRadius: 12,
        border: "1px solid rgba(255, 214, 165, 0.35)",
        background: "rgba(12, 13, 16, 0.56)",
        backdropFilter: "blur(14px) saturate(120%)",
        padding: "14px 16px",
      }}
    >
      <div style={{ color: "var(--nx-bone-90)", fontSize: 42, fontWeight: 100, letterSpacing: "0.08em" }}>{title}</div>
      <div style={{ color: "var(--nx-bone-90)", fontSize: 20, marginTop: 6 }}>
        Primary Key verbindet Tabellen
      </div>
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 180px 1fr", alignItems: "center" }}>
        <button
          type="button"
          onClick={() => setActive("kunden")}
          style={{
            borderRadius: 10,
            border: "1px solid rgba(255,214,165,0.45)",
            background: active === "kunden" ? "rgba(255,214,165,0.14)" : "rgba(232,233,240,0.03)",
            color: "var(--nx-bone-90)",
            padding: "12px",
            textAlign: "left",
            cursor: "pointer",
            fontSize: 20,
          }}
        >
          Kunden Tabelle
          <div style={{ fontSize: 20, color: "var(--nx-bone-50)", marginTop: 6 }}>ID PK Name Stadt</div>
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
            borderRadius: 10,
            border: "1px solid rgba(255,214,165,0.45)",
            background: active === "bestellungen" ? "rgba(255,214,165,0.14)" : "rgba(232,233,240,0.03)",
            color: "var(--nx-bone-90)",
            padding: "12px",
            textAlign: "left",
            cursor: "pointer",
            fontSize: 20,
          }}
        >
          Bestellungen Tabelle
          <div style={{ fontSize: 20, color: "var(--nx-bone-50)", marginTop: 6 }}>ID PK KundenID FK Betrag</div>
        </button>
      </div>
      <button
        type="button"
        onClick={() => setActive("kundenid")}
        style={{
          marginTop: 12,
          borderRadius: 8,
          border: "1px solid rgba(255,214,165,0.45)",
          background: "rgba(255,214,165,0.1)",
          color: "var(--nx-bone-90)",
          fontSize: 20,
          textTransform: "uppercase",
          padding: "8px 12px",
          cursor: "pointer",
        }}
      >
        Schlüssel Verbindung aktivieren
      </button>
    </section>
  );
}

export default VisualSQL;
