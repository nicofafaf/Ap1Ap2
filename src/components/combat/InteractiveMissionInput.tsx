import { useMemo, useState } from "react";
import { typography } from "../../theme/typography";

function normalizeGeneric(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().toLowerCase();
}

type InteractiveMissionInputProps = {
  expected: string;
  onSuccess: () => void;
};

export function InteractiveMissionInput({ expected, onSuccess }: InteractiveMissionInputProps) {
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "ok" | "retry">("idle");
  const expectedNorm = useMemo(() => normalizeGeneric(expected), [expected]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (state !== "idle") setState("idle");
        }}
        rows={6}
        spellCheck={false}
        style={{
          width: "100%",
          minHeight: 120,
          borderRadius: 6,
          border: "1px solid rgba(232,233,240,0.12)",
          background: "rgba(8,9,12,0.95)",
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
            const ok = normalizeGeneric(value) === expectedNorm && expectedNorm.length > 0;
            setState(ok ? "ok" : "retry");
            if (ok) onSuccess();
          }}
          style={{
            borderRadius: 4,
            border: "1px solid rgba(232,233,240,0.2)",
            background: "rgba(232,233,240,0.06)",
            color: "var(--nx-bone-90)",
            fontFamily: typography.fontSans,
            fontWeight: 600,
            fontSize: "max(12px,0.75rem)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "10px 16px",
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

