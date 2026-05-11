import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type LfMilestone = {
  id: string;
  type: "workbench" | "mc";
  label: string;
};

type MilestoneStatus = "open" | "correct" | "mastered";

export type LfMilestoneTrackerProps = {
  lf: string;
  milestones: LfMilestone[];
  correctIds: readonly string[];
  selectedId?: string | null;
  onSelectMilestone: (id: string) => void;
};

const STORAGE_PREFIX = "nexus.lf.milestones.mastered";

function storageKey(lf: string): string {
  return `${STORAGE_PREFIX}.${lf}`;
}

function loadMastered(lf: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(lf));
    if (!raw) return new Set<string>();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set<string>();
    return new Set(arr.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set<string>();
  }
}

function persistMastered(lf: string, set: Set<string>): void {
  try {
    localStorage.setItem(storageKey(lf), JSON.stringify([...set]));
  } catch {
    // no-op
  }
}

export function LfMilestoneTracker({
  lf,
  milestones,
  correctIds,
  selectedId,
  onSelectMilestone,
}: LfMilestoneTrackerProps) {
  const [masteredIds, setMasteredIds] = useState<Set<string>>(() => loadMastered(lf));
  const [burstId, setBurstId] = useState<string | null>(null);

  useEffect(() => {
    setMasteredIds(loadMastered(lf));
  }, [lf]);

  useEffect(() => {
    const onSqlSuccess = (ev: Event) => {
      const detail = (ev as CustomEvent<{ milestoneId?: string }>).detail;
      const milestoneId = detail?.milestoneId;
      if (!milestoneId) return;
      if (!milestones.some((m) => m.id === milestoneId)) return;
      setMasteredIds((prev) => {
        const next = new Set(prev);
        next.add(milestoneId);
        persistMastered(lf, next);
        return next;
      });
      setBurstId(milestoneId);
      window.setTimeout(() => setBurstId(null), 520);
    };
    window.addEventListener("nx:milestone-sql-success", onSqlSuccess);
    return () => window.removeEventListener("nx:milestone-sql-success", onSqlSuccess);
  }, [lf, milestones]);

  const correctSet = useMemo(() => new Set(correctIds), [correctIds]);

  const statusFor = (id: string): MilestoneStatus => {
    if (masteredIds.has(id)) return "mastered";
    if (correctSet.has(id)) return "correct";
    return "open";
  };

  return (
    <nav aria-label={`Milestones ${lf}`} style={{ position: "relative", paddingLeft: 22 }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 6,
          top: 3,
          bottom: 3,
          width: 4,
          backgroundImage: "radial-gradient(circle, rgba(232,233,240,0.35) 1.1px, transparent 1.1px)",
          backgroundSize: "4px 10px",
          backgroundRepeat: "repeat-y",
          opacity: 0.72,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {milestones.map((m, idx) => {
          const status = statusFor(m.id);
          const isSelected = selectedId === m.id;
          const circleBase = {
            width: 14,
            height: 14,
            borderRadius: 999,
            flexShrink: 0,
            marginTop: 2,
          } as const;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMilestone(m.id)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                background: "transparent",
                border: "none",
                textAlign: "left",
                padding: 0,
                cursor: "pointer",
                position: "relative",
              }}
            >
              <div style={{ position: "relative" }}>
                {status === "open" ? (
                  <span
                    aria-hidden
                    style={{
                      ...circleBase,
                      border: "1px solid rgba(232, 233, 240, 0.2)",
                      background: "transparent",
                    }}
                  />
                ) : null}
                {status === "correct" ? (
                  <motion.span
                    aria-hidden
                    style={{
                      ...circleBase,
                      background: "rgba(232, 233, 240, 0.95)",
                    }}
                    animate={{
                      opacity: [0.56, 1, 0.56],
                      boxShadow: [
                        "0 0 0 rgba(232, 233, 240, 0.0)",
                        "0 0 12px rgba(232, 233, 240, 0.55)",
                        "0 0 0 rgba(232, 233, 240, 0.0)",
                      ],
                    }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                ) : null}
                {status === "mastered" ? (
                  <span
                    aria-hidden
                    style={{
                      ...circleBase,
                      background: "rgba(255, 214, 165, 0.98)",
                      boxShadow: "0 0 12px rgba(255, 214, 165, 0.52), 0 0 22px rgba(255, 214, 165, 0.28)",
                    }}
                  />
                ) : null}
                <AnimatePresence>
                  {burstId === m.id ? (
                    <motion.span
                      aria-hidden
                      initial={{ opacity: 1, scale: 0.4 }}
                      animate={{ opacity: 0, scale: 2.2 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      style={{
                        position: "absolute",
                        left: -8,
                        top: -8,
                        width: 30,
                        height: 30,
                        borderRadius: 999,
                        background:
                          "radial-gradient(circle, rgba(232,233,240,0.86) 0%, rgba(255,214,165,0.82) 38%, rgba(255,214,165,0.0) 72%)",
                        pointerEvents: "none",
                      }}
                    />
                  ) : null}
                </AnimatePresence>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--nx-bone-50)",
                    fontWeight: 100,
                  }}
                >
                  {m.type} {idx + 1}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    lineHeight: 1.35,
                    color: isSelected ? "var(--nx-bone-90)" : "var(--nx-bone-50)",
                    textDecoration: isSelected ? "underline" : "none",
                    textUnderlineOffset: 2,
                  }}
                >
                  {m.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default LfMilestoneTracker;
