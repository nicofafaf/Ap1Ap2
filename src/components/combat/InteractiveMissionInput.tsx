import { useMemo, useState } from "react";
import { typography } from "../../theme/typography";
import { useNexusI18n } from "../../lib/i18n/I18nProvider";

function normalizeGeneric(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().toLowerCase();
}

function missionAnswersMatch(input: string, expected: string): boolean {
  const e = normalizeGeneric(expected);
  const u = normalizeGeneric(input).replace(/%/g, "");
  if (e === u) return true;
  const ne = Number.parseFloat(e.replace(",", "."));
  const nu = Number.parseFloat(u.replace(",", "."));
  if (Number.isFinite(ne) && Number.isFinite(nu)) {
    return Math.abs(ne - nu) < 0.11;
  }
  return false;
}

type InteractiveMissionInputProps = {
  expected: string;
  onSuccess: () => void;
};

export function InteractiveMissionInput({ expected, onSuccess }: InteractiveMissionInputProps) {
  const { t } = useNexusI18n();
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "ok" | "retry">("idle");
  const expectedNorm = useMemo(() => normalizeGeneric(expected), [expected]);
  const numericExpected = useMemo(() => {
    const n = Number.parseFloat(expected.replace(",", ".").trim());
    return Number.isFinite(n) ? n : null;
  }, [expected]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (state !== "idle") setState("idle");
        }}
        rows={2}
        spellCheck={false}
        aria-label="Zahlenantwort zur Aufgabe"
        placeholder="z B 26,9"
        style={{
          width: "100%",
          minHeight: 72,
          borderRadius: 18,
          border:
            state === "ok"
              ? "2px solid rgba(52, 211, 153, 0.65)"
              : state === "retry"
                ? "2px solid rgba(248, 113, 113, 0.55)"
                : "1px solid var(--nx-learn-line)",
          outline: "none",
          boxShadow:
            state === "ok"
              ? "inset 0 1px 0 rgba(255,255,255,0.65), 0 0 0 3px rgba(52, 211, 153, 0.2)"
              : state === "retry"
                ? "inset 0 1px 0 rgba(255,255,255,0.5), 0 0 0 3px rgba(248, 113, 113, 0.18)"
                : "inset 0 1px 0 rgba(255,255,255,0.65)",
          background:
            state === "ok"
              ? "rgba(236, 253, 245, 0.88)"
              : state === "retry"
                ? "rgba(254, 242, 242, 0.9)"
                : "rgba(255,255,255,0.74)",
          color: "var(--nx-learn-ink)",
          fontFamily: typography.fontSans,
          fontSize: "clamp(22px, 3vw, 28px)",
          fontWeight: 700,
          lineHeight: 1.35,
          padding: "var(--nx-space-16)",
          resize: "vertical",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => {
            const ok =
              expectedNorm.length > 0 &&
              (numericExpected != null
                ? missionAnswersMatch(value, expected)
                : normalizeGeneric(value) === expectedNorm);
            setState(ok ? "ok" : "retry");
            if (ok) onSuccess();
          }}
          style={{
            borderRadius: 999,
            border: "1px solid rgba(22,32,25,0.14)",
            background: "linear-gradient(135deg, #18251c 0%, #314832 100%)",
            color: "rgba(251,247,239,0.98)",
            fontFamily: typography.fontSans,
            fontWeight: 800,
            fontSize: "22px",
            letterSpacing: "0.01em",
            minHeight: 52,
            padding: "14px 24px",
            cursor: "pointer",
          }}
        >
          Antwort prüfen
        </button>
      </div>
      <div
        role="status"
        aria-live="polite"
        style={{
          padding: "14px 18px",
          borderRadius: 16,
          fontFamily: typography.fontSans,
          fontSize: "clamp(20px, 2.4vw, 24px)",
          fontWeight: 800,
          lineHeight: 1.4,
          letterSpacing: "0.02em",
          border:
            state === "ok"
              ? "1px solid rgba(52, 211, 153, 0.55)"
              : state === "retry"
                ? "1px solid rgba(248, 113, 113, 0.5)"
                : "1px solid rgba(232, 233, 240, 0.14)",
          background:
            state === "ok"
              ? "rgba(6, 78, 59, 0.42)"
              : state === "retry"
                ? "rgba(127, 29, 29, 0.38)"
                : "rgba(8, 10, 12, 0.35)",
          color:
            state === "ok"
              ? "rgba(209, 250, 229, 0.98)"
              : state === "retry"
                ? "rgba(254, 226, 226, 0.96)"
                : "var(--nx-learn-muted)",
        }}
      >
        {state === "ok"
          ? t("learningTerminal.feedbackNumericOk", "Treffer — Antwort stimmt")
          : state === "retry"
            ? t("learningTerminal.feedbackNumericRetry", "Noch nicht — Zahl oder Format prüfen")
            : t("learningTerminal.feedbackNumericIdle", "Trage nur die Zahl ein")}
      </div>
    </div>
  );
}

