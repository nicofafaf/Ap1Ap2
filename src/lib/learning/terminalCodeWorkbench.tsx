import { useCallback, useEffect, useMemo, useState } from "react";
import { typography } from "../../theme/typography";
import { useGameStore } from "../../store/useGameStore";

const SQL_KEYWORDS = [
  "select",
  "from",
  "where",
  "join",
  "inner",
  "left",
  "right",
  "full",
  "outer",
  "on",
  "group",
  "by",
  "having",
  "order",
  "limit",
  "and",
  "or",
  "as",
  "distinct",
];

function normalizeSqlLike(s: string): string {
  const compact = s
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ")
    .replace(/;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return compact
    .split(" ")
    .map((token) => {
      const bare = token.toLowerCase();
      return SQL_KEYWORDS.includes(bare) ? bare.toUpperCase() : bare;
    })
    .join(" ");
}

function normalizeCSharpLike(s: string): string {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export type TerminalCodeWorkbenchProps = {
  lang: "sql" | "csharp";
  reference: string;
  milestoneId?: string;
  onSuccess?: () => void;
  initialDraft?: string;
  initialToken?: number;
};

export function TerminalCodeWorkbench({
  lang,
  reference,
  milestoneId,
  onSuccess,
  initialDraft,
  initialToken,
}: TerminalCodeWorkbenchProps) {
  const [draft, setDraft] = useState("");
  const [checked, setChecked] = useState<"idle" | "ok" | "diff">("idle");
  const [goldGlitch, setGoldGlitch] = useState(false);
  const triggerBossHit = useGameStore((s) => s.triggerBossHit);
  const triggerImpactFrames = useGameStore((s) => s.triggerImpactFrames);

  useEffect(() => {
    if (!initialDraft) return;
    setDraft(initialDraft);
    setChecked("idle");
  }, [initialDraft, initialToken]);

  const norm = useMemo(
    () => (lang === "sql" ? normalizeSqlLike : normalizeCSharpLike),
    [lang]
  );

  const runCheck = useCallback(() => {
    const a = norm(draft);
    const b = norm(reference);
    const ok = a.length > 0 && a === b;
    setChecked(ok ? "ok" : "diff");
    if (!ok) return;
    triggerBossHit(18);
    triggerImpactFrames();
    onSuccess?.();
    setGoldGlitch(true);
    if (lang === "sql" && milestoneId) {
      window.dispatchEvent(
        new CustomEvent("nx:milestone-sql-success", {
          detail: { milestoneId },
        })
      );
    }
    window.setTimeout(() => setGoldGlitch(false), 360);
  }, [draft, norm, reference, triggerBossHit, triggerImpactFrames, lang, milestoneId, onSuccess]);

  const hint =
    checked === "ok"
      ? "Richtig, du hast den Schritt geschafft"
      : checked === "diff"
        ? "Noch nicht gleich, übernimm erst das Beispiel und lies es in Ruhe"
        : lang === "sql"
          ? "Du musst SQL noch nicht können, übernimm zuerst das Beispiel"
          : "Eingabe mit Musterlösung vergleichen";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div
        style={{
          fontFamily: typography.fontSans,
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--nx-learn-muted)",
          paddingBottom: "var(--nx-space-8)",
        }}
      >
        {lang === "sql" ? "Geführter Datenbank-Start" : "Geführte Code-Übung"}
      </div>
      {lang === "sql" ? (
        <section
          style={{
            marginBottom: "var(--nx-space-16)",
            borderRadius: 26,
            border: "1px solid var(--nx-learn-line)",
            background: "rgba(251,247,239,0.78)",
            padding: 18,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
              gap: 12,
            }}
          >
            {[
              ["1", "Tabelle wählen", "FROM Kunden bedeutet: Nimm die Tabelle Kunden"],
              ["2", "Filter setzen", "WHERE Stadt = Berlin bedeutet: Zeig nur Berlin"],
              ["3", "Ergebnis ansehen", "SELECT * bedeutet: Zeig alle Spalten"],
            ].map(([step, title, body]) => (
              <div
                key={step}
                style={{
                  borderRadius: 20,
                  border: "1px solid var(--nx-learn-line)",
                  background: "rgba(255,255,255,0.58)",
                  padding: 16,
                  color: "var(--nx-learn-ink)",
                }}
              >
                <div style={{ fontFamily: typography.fontMono, fontSize: 20, opacity: 0.58 }}>
                  Schritt {step}
                </div>
                <strong style={{ display: "block", marginTop: 8, fontSize: 24 }}>{title}</strong>
                <p style={{ margin: "8px 0 0", fontSize: 20, lineHeight: 1.45, color: "var(--nx-learn-muted)" }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setDraft(reference);
              setChecked("idle");
            }}
            style={{
              marginTop: 14,
              borderRadius: 999,
              border: "1px solid rgba(214,181,111,0.55)",
              background: "rgba(214,181,111,0.2)",
              color: "var(--nx-learn-ink)",
              fontFamily: typography.fontSans,
              fontSize: 22,
              fontWeight: 800,
              padding: "14px 20px",
              cursor: "pointer",
            }}
          >
            Beispiel übernehmen
          </button>
        </section>
      ) : null}
      <textarea
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setChecked("idle");
        }}
        rows={8}
        style={{
          width: "100%",
          resize: "vertical",
          minHeight: 180,
          margin: 0,
          padding: "var(--nx-space-16)",
          borderRadius: 22,
          border: goldGlitch
            ? "1px solid rgba(255, 214, 165, 0.6)"
            : "1px solid var(--nx-learn-line)",
          background: "rgba(251,247,239,0.92)",
          color: "var(--nx-learn-ink)",
          fontFamily: "var(--nx-font-mono, Geist Mono, monospace)",
          fontSize: 24,
          lineHeight: 1.45,
          outline: "none",
          boxShadow: goldGlitch
            ? "0 0 0 1px rgba(255, 214, 165, 0.45), 0 0 24px rgba(255, 214, 165, 0.18)"
            : "none",
          transition: "box-shadow 180ms ease, border-color 180ms ease",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: "var(--nx-space-16)", marginTop: "var(--nx-space-16)" }}>
        <button
          type="button"
          onClick={runCheck}
          style={{
            borderRadius: 999,
            border: "1px solid rgba(214,181,111,0.55)",
            background: "rgba(214,181,111,0.16)",
            color: "var(--nx-learn-ink)",
            fontFamily: typography.fontSans,
            fontWeight: 800,
            fontSize: 20,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            padding: "14px 20px",
            cursor: "pointer",
          }}
        >
          Abgleich starten
        </button>
        <span style={{ fontFamily: typography.fontSans, fontSize: 20, color: "var(--nx-learn-muted)" }}>
          {hint}
        </span>
      </div>
    </div>
  );
}
