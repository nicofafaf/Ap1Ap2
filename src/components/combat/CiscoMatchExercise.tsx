import { useMemo, useState } from "react";
import type { LearningMatchPair } from "../../lib/learning/learningExerciseTypes";
import { useNexusI18n } from "../../lib/i18n/I18nProvider";

export type CiscoMatchExerciseProps = {
  pairs: LearningMatchPair[];
  submitted: boolean;
  onSubmit: (ok: boolean, selectionKey: string) => void;
};

export function CiscoMatchExercise({ pairs, submitted, onSubmit }: CiscoMatchExerciseProps) {
  const { t } = useNexusI18n();
  const [picks, setPicks] = useState<Record<string, string>>({});

  const rightChoices = useMemo(() => {
    const rights = [...new Set(pairs.map((p) => p.right))];
    for (let i = rights.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [rights[i], rights[j]] = [rights[j], rights[i]];
    }
    return rights;
  }, [pairs]);

  const allPicked = pairs.every((p) => Boolean(picks[p.id]));
  const isCorrect =
    allPicked && pairs.every((p) => picks[p.id] === p.right);

  const handleCheck = () => {
    if (submitted || !allPicked) return;
    const key = pairs.map((p) => `${p.id}:${picks[p.id]}`).join(",");
    onSubmit(isCorrect, key);
  };

  return (
    <div
      role="group"
      aria-label={t("learningTerminal.ariaMatch", "Zuordnungsaufgabe")}
      style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}
    >
      {pairs.map((pair) => {
        const picked = picks[pair.id] ?? "";
        const ok = submitted && picked === pair.right;
        const miss = submitted && picked && picked !== pair.right;
        return (
          <label
            key={pair.id}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(140px, 42%)",
              gap: 12,
              alignItems: "center",
              padding: "12px 14px",
              borderRadius: 14,
              border: `1px solid ${
                ok ? "rgba(34, 197, 94, 0.45)" : miss ? "rgba(239, 68, 68, 0.4)" : "rgba(255,255,255,0.12)"
              }`,
              background: ok
                ? "rgba(34, 197, 94, 0.12)"
                : miss
                  ? "rgba(239, 68, 68, 0.1)"
                  : "rgba(10, 16, 20, 0.35)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--nx-font-sans, system-ui)",
                fontSize: "clamp(0.95rem, 2.4vw, 1.1rem)",
                fontWeight: 650,
                lineHeight: 1.4,
                color: "var(--nx-learn-ink, rgba(248,244,232,0.96))",
              }}
            >
              {pair.left}
            </span>
            <select
              value={picked}
              disabled={submitted}
              onChange={(e) =>
                setPicks((prev) => ({ ...prev, [pair.id]: e.target.value }))
              }
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(0,0,0,0.25)",
                color: "inherit",
                fontSize: "0.95rem",
              }}
            >
              <option value="">{t("learningTerminal.matchChoose", "— wählen —")}</option>
              {rightChoices.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        );
      })}
      {!submitted ? (
        <button
          type="button"
          onClick={handleCheck}
          disabled={!allPicked}
          style={{
            alignSelf: "flex-start",
            marginTop: 4,
            border: "none",
            borderRadius: 999,
            padding: "12px 20px",
            fontWeight: 800,
            fontSize: 16,
            cursor: allPicked ? "pointer" : "not-allowed",
            opacity: allPicked ? 1 : 0.5,
            background: "linear-gradient(135deg, #18251c 0%, #314832 100%)",
            color: "rgba(251,247,239,0.98)",
          }}
        >
          {t("learningTerminal.mcSubmitMulti", "Antwort prüfen")}
        </button>
      ) : null}
    </div>
  );
}
