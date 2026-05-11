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
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (state !== "idle") setState("idle");
        }}
        rows={5}
        spellCheck={false}
        aria-label="Zahlenantwort zur Aufgabe"
        placeholder="Antwort hier eintragen"
        style={{
          width: "100%",
          minHeight: 100,
          borderRadius: 8,
          border: "1px solid rgba(232,233,240,0.28)",
          outline: "none",
          boxShadow: "inset 0 0 0 1px rgba(34,211,238,0.12)",
          background: "rgba(10,12,18,0.98)",
          color: "var(--nx-bone-90)",
          fontFamily: "var(--nx-font-mono, Geist Mono, monospace)",
          padding: "var(--nx-space-16)",
          resize: "vertical",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
            borderRadius: 8,
            border: "1px solid rgba(34,211,238,0.45)",
            background: "rgba(34,211,238,0.12)",
            color: "var(--nx-bone-90)",
            fontFamily: typography.fontSans,
            fontWeight: 600,
            fontSize: "max(13px,0.8rem)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            minHeight: 44,
            padding: "12px 18px",
            cursor: "pointer",
          }}
        >
          Mission prüfen
        </button>
        <span style={{ color: "var(--nx-bone-50)", fontFamily: typography.fontSans, fontSize: "max(12px,0.75rem)" }}>
          {state === "ok"
            ? "Mission erfüllt"
            : state === "retry"
              ? "Mission noch offen"
              : "Eingabe im Feld oben"}
        </span>
      </div>
    </div>
  );
}

