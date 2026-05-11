import { AnimatePresence, motion } from "framer-motion";
import { SKILL_LOGIC_MIRROR } from "../../lib/combat/skillLogicMirror";
import { highlightCode } from "../../lib/learning/codeHighlight";
import { typography } from "../../theme/typography";
import type { SkillId } from "../../data/skillRegistry";
import { useMemo } from "react";

type SourceMirrorProps = {
  skillId: SkillId | null;
  onClose: () => void;
};

export function SourceMirror({ skillId, onClose }: SourceMirrorProps) {
  const payload = skillId ? SKILL_LOGIC_MIRROR[skillId] : null;
  const highlighted = useMemo(
    () => (payload ? highlightCode(payload.code, "javascript") : null),
    [payload]
  );

  return (
    <AnimatePresence>
      {skillId && payload && highlighted ? (
        <motion.div
          key="source-mirror"
          role="dialog"
          aria-modal="true"
          aria-label="Source Mirror"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 125000,
            background: "rgba(2,6,14,0.78)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(720px, calc(100vw - 32px))",
              maxHeight: "min(85vh, 760px)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              borderRadius: 14,
              border: "1px solid rgba(34,211,238,0.35)",
              background: "linear-gradient(165deg, rgba(8,18,28,0.96) 0%, rgba(4,10,18,0.98) 100%)",
              boxShadow: "0 28px 64px rgba(0,0,0,0.55), 0 0 48px rgba(34,211,238,0.12)",
            }}
          >
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid rgba(51,65,85,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: typography.fontSans,
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: typography.fgMuted,
                    marginBottom: 4,
                  }}
                >
                  Source Mirror
                </div>
                <div
                  style={{
                    fontFamily: typography.fontSans,
                    fontWeight: 700,
                    fontSize: 16,
                    color: typography.fg,
                  }}
                >
                  {payload.title}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                style={{
                  fontFamily: typography.fontSans,
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 8,
                  border: "1px solid rgba(148,163,184,0.4)",
                  background: "rgba(15,23,42,0.9)",
                  color: typography.fgMuted,
                  padding: "8px 14px",
                  cursor: "pointer",
                }}
              >
                Schließen
              </button>
            </div>
            <div style={{ padding: "14px 18px 18px", overflowY: "auto" }}>
              <p
                style={{
                  margin: "0 0 14px",
                  fontFamily: typography.fontSans,
                  fontSize: typography.bodySize,
                  lineHeight: 1.6,
                  color: typography.fg,
                }}
              >
                {payload.concepts}
              </p>
              <pre
                className="nx-code-block"
                style={{
                  margin: 0,
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: "rgba(2, 6, 23, 0.92)",
                  border: "1px solid rgba(51, 65, 85, 0.65)",
                  overflowX: "auto",
                  fontFamily: "var(--nx-font-mono, JetBrains Mono, monospace)",
                  fontSize: 12,
                  lineHeight: 1.45,
                }}
              >
                <code>{highlighted}</code>
              </pre>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default SourceMirror;
