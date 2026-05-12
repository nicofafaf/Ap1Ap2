import { useMemo, useState } from "react";
import { typography } from "../../theme/typography";

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
          border: "1px solid var(--nx-learn-line)",
          outline: "none",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.65)",
          background: "rgba(255,255,255,0.74)",
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
            fontSize: "18px",
            letterSpacing: "0.01em",
            minHeight: 52,
            padding: "14px 24px",
            cursor: "pointer",
          }}
        >
          Antwort prüfen
        </button>
        <span style={{ color: "var(--nx-learn-muted)", fontFamily: typography.fontSans, fontSize: "16px", lineHeight: 1.4 }}>
          {state === "ok"
            ? "Richtig"
            : state === "retry"
              ? "Noch nicht, prüfe den Tipp"
              : "Trage nur die Zahl ein"}
        </span>
      </div>
    </div>
  );
}

