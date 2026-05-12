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

const SQL_THEME_PRESETS: Record<
  "starwars" | "anime" | "bodybuilding",
  { title: string; preview: string; starter: string }
> = {
  starwars: {
    title: "Star Wars",
    preview:
      "CREATE TABLE jedi id INT PRIMARY KEY name VARCHAR(120) rang VARCHAR(60)\nCREATE TABLE mission id INT PRIMARY KEY jedi_id INT planet VARCHAR(120)",
    starter: "SELECT name rang FROM jedi WHERE rang = 'Master'",
  },
  anime: {
    title: "Anime",
    preview:
      "CREATE TABLE anime_charaktere id INT AUTO_INCREMENT PRIMARY KEY name VARCHAR(100) serie VARCHAR(100) kraft_level INT rolle VARCHAR(50)\nINSERT INTO anime_charaktere name serie kraft_level rolle VALUES Son Goku Dragon Ball 9001 Protagonist",
    starter: "SELECT name serie kraft_level FROM anime_charaktere WHERE kraft_level > 8000",
  },
  bodybuilding: {
    title: "Bodybuilding",
    preview:
      "CREATE TABLE exercises id INT AUTO_INCREMENT PRIMARY KEY name VARCHAR(100) muskelgruppe VARCHAR(50) equipment VARCHAR(50) schwierigkeit INT\nINSERT INTO exercises name muskelgruppe equipment schwierigkeit VALUES Kniebeugen Beine Langhantel 9",
    starter: "SELECT name muskelgruppe schwierigkeit FROM exercises WHERE schwierigkeit >= 8",
  },
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
  const [sqlTheme, setSqlTheme] = useState<"starwars" | "anime" | "bodybuilding">("starwars");
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
      ? "Abgleich deckungsgleich"
      : checked === "diff"
        ? "Abgleich noch nicht deckungsgleich"
        : "Eingabe normalisieren und mit Musterlösung vergleichen";

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
        {lang === "sql" ? "SQL Arbeitsfläche" : "C Sharp Arbeitsfläche"}
      </div>
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
      {lang === "sql" ? (
        <section
          style={{
            marginTop: "var(--nx-space-12)",
            borderRadius: 26,
            border: "1px solid var(--nx-learn-line)",
            background: "rgba(251,247,239,0.76)",
            padding: 18,
          }}
        >
          <div
            style={{
              color: "var(--nx-learn-ink)",
              fontFamily: "var(--nx-font-mono)",
              fontSize: 20,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Themen Switcher
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            {(Object.keys(SQL_THEME_PRESETS) as Array<"starwars" | "anime" | "bodybuilding">).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSqlTheme(key)}
                style={{
                  borderRadius: 999,
                  border:
                    sqlTheme === key
                      ? "1px solid rgba(255,214,165,0.68)"
                      : "1px solid var(--nx-learn-line)",
                  background: sqlTheme === key ? "rgba(214,181,111,0.2)" : "rgba(255,255,255,0.5)",
                  color: "var(--nx-learn-ink)",
                  fontFamily: "var(--nx-font-mono)",
                  fontSize: 20,
                  textTransform: "uppercase",
                  padding: "10px 16px",
                  cursor: "pointer",
                }}
              >
                {SQL_THEME_PRESETS[key].title}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 18, color: "var(--nx-learn-muted)", fontSize: 22 }}>Tabellen Vorschau</div>
          <pre
            style={{
              margin: "8px 0 0",
              minHeight: 146,
              padding: 16,
              borderRadius: 20,
              border: "1px solid var(--nx-learn-line)",
              background: "rgba(22,32,25,0.06)",
              color: "var(--nx-learn-ink)",
              overflowX: "auto",
              fontFamily: "var(--nx-font-mono, Geist Mono, monospace)",
              fontSize: 20,
              lineHeight: 1.35,
              whiteSpace: "pre-wrap",
            }}
          >
            {SQL_THEME_PRESETS[sqlTheme].preview}
          </pre>
          <button
            type="button"
            onClick={() => {
              setDraft(SQL_THEME_PRESETS[sqlTheme].starter);
              setChecked("idle");
            }}
            style={{
              marginTop: 8,
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
            Starter Query laden
          </button>
        </section>
      ) : null}
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
