import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  mentorIdleAnimationCandidates,
  mentorPickPortraitCandidates,
  mentorPortraitSlug,
  mentorWaifuUrl,
} from "../../data/nexusRegistry";

export type MentorPortraitVariant = "default" | "pick" | "idle";

type MentorPortraitProps = {
  mentorId: number;
  size: number;
  radius?: number;
  border?: string;
  boxShadow?: string;
  /** default: 64×64 Idle (Characters/…/V1.0) · pick: 128×128 Auswahl (Portraits/…) · idle: wie default */
  variant?: MentorPortraitVariant;
};

type LoadState = "loading" | "ready" | "error";

function candidateList(mentorId: number, variant: MentorPortraitVariant): readonly string[] {
  switch (variant) {
    case "pick":
      return mentorPickPortraitCandidates(mentorId);
    case "idle":
      return mentorIdleAnimationCandidates(mentorId);
    default:
      return [mentorWaifuUrl(mentorId)];
  }
}

/**
 * Mentor-Grafik: Anfang `variant="pick"` (128×128), sonst `idle`/`default` mit 64×64-Idle-Kette, Fallback Legacy-PNG
 */
export function MentorPortrait({
  mentorId,
  size,
  radius = 18,
  border = "1px solid rgba(214, 181, 111, 0.35)",
  boxShadow,
  variant = "idle",
}: MentorPortraitProps) {
  const candidates = useMemo(() => [...candidateList(mentorId, variant)], [mentorId, variant]);
  const reduceMotion = useReducedMotion();
  const [srcIndex, setSrcIndex] = useState(0);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  const src = candidates[Math.min(srcIndex, Math.max(0, candidates.length - 1))]!;

  useEffect(() => {
    setSrcIndex(0);
    setLoadState("loading");
  }, [mentorId, variant]);

  useEffect(() => {
    setLoadState("loading");
  }, [src]);

  const onError = useCallback(() => {
    setSrcIndex((i) => {
      const next = i + 1;
      if (next < candidates.length) return next;
      setLoadState("error");
      return i;
    });
  }, [candidates.length]);

  const onLoad = useCallback(() => {
    setLoadState("ready");
  }, []);

  const shell: CSSProperties = {
    width: size,
    height: size,
    borderRadius: radius,
    border,
    boxShadow,
    position: "relative",
    overflow: "hidden",
    flexShrink: 0,
    background: "rgba(8, 14, 18, 0.55)",
  };

  if (loadState === "error") {
    return (
      <div
        aria-hidden
        style={{
          ...shell,
          background:
            "linear-gradient(145deg, rgba(34, 211, 238, 0.38) 0%, rgba(214, 181, 111, 0.42) 48%, rgba(8, 14, 18, 0.92) 100%)",
          display: "grid",
          placeItems: "center",
          fontFamily: "var(--nx-font-mono, monospace)",
          fontSize: Math.max(12, Math.round(size * 0.22)),
          fontWeight: 800,
          color: "rgba(251, 247, 239, 0.92)",
        }}
      >
        {mentorPortraitSlug(mentorId)}
      </div>
    );
  }

  return (
    <div aria-hidden style={shell}>
      {loadState === "loading" ? (
        <motion.div
          initial={{ opacity: reduceMotion ? 0.65 : 0.45 }}
          animate={reduceMotion ? { opacity: 0.65 } : { opacity: [0.45, 0.85, 0.45] }}
          transition={reduceMotion ? { duration: 0 } : { duration: 1.15, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            background:
              "linear-gradient(110deg, rgba(22, 32, 28, 0.95) 0%, rgba(34, 211, 238, 0.12) 42%, rgba(214, 181, 111, 0.14) 58%, rgba(22, 32, 28, 0.95) 100%)",
            pointerEvents: "none",
          }}
        />
      ) : null}
      <img
        key={`${mentorId}-${variant}-${srcIndex}-${src}`}
        src={src}
        alt=""
        width={size}
        height={size}
        loading="eager"
        decoding="async"
        onLoad={onLoad}
        onError={onError}
        style={{
          display: "block",
          width: size,
          height: size,
          borderRadius: radius,
          objectFit: "cover",
          opacity: loadState === "ready" ? 1 : 0,
          transition: "opacity 0.22s ease-out",
          position: "relative",
          zIndex: 1,
        }}
      />
    </div>
  );
}
