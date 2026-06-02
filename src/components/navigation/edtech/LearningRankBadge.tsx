import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type CSSProperties } from "react";
import {
  getLearningRankDef,
  learningRankImageSources,
  type LearningRankId,
} from "../../../data/learningRankRegistry";

export type LearningRankBadgeProps = {
  rankId: LearningRankId;
  size?: "sm" | "md" | "lg" | "hero";
  showLabel?: boolean;
  label?: string;
  sublabel?: string;
  locked?: boolean;
  className?: string;
  style?: CSSProperties;
};

const SIZE_PX: Record<NonNullable<LearningRankBadgeProps["size"]>, number> = {
  sm: 44,
  md: 72,
  lg: 108,
  hero: 148,
};

export function LearningRankBadge({
  rankId,
  size = "md",
  showLabel = false,
  label,
  sublabel,
  locked = false,
  className,
  style,
}: LearningRankBadgeProps) {
  const reduceMotion = useReducedMotion();
  const rank = getLearningRankDef(rankId);
  const sources = learningRankImageSources(rankId);
  const [imgSrc, setImgSrc] = useState(sources.webp ?? sources.png);
  useEffect(() => {
    setImgSrc(sources.webp ?? sources.png);
  }, [rankId, sources.png, sources.webp]);
  const px = SIZE_PX[size];
  const title = label ?? rank.id.replace(/_/g, " ");

  return (
    <div
      className={className ? `nx-learning-rank-badge ${className}` : "nx-learning-rank-badge"}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        opacity: locked ? 0.42 : 1,
        filter: locked ? "grayscale(0.85)" : undefined,
        ...style,
      }}
    >
      <motion.div
        initial={reduceMotion ? false : { scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 22 }}
        style={{
          width: px,
          height: px,
          borderRadius: "50%",
          padding: 4,
          background: `radial-gradient(circle at 35% 25%, ${rank.glow}, transparent 68%)`,
          boxShadow: locked ? undefined : `0 0 28px ${rank.glow}, 0 8px 24px rgba(15,23,42,0.35)`,
          border: `2px solid ${rank.accent}`,
        }}
      >
        <img
          src={imgSrc}
          alt=""
          width={px - 8}
          height={px - 8}
          loading="lazy"
          decoding="async"
          onError={() => {
            if (imgSrc !== sources.png) setImgSrc(sources.png);
          }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            borderRadius: "50%",
          }}
        />
      </motion.div>
      {showLabel ? (
        <div style={{ textAlign: "center", maxWidth: px + 80 }}>
          <div
            style={{
              fontFamily: "var(--nx-font-sans)",
              fontSize: size === "hero" ? 18 : size === "lg" ? 15 : 13,
              fontWeight: 800,
              color: rank.accent,
              letterSpacing: "0.04em",
              textTransform: "capitalize",
            }}
          >
            {title}
          </div>
          {sublabel ? (
            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                color: "var(--nx-learn-muted, #64748b)",
                lineHeight: 1.4,
              }}
            >
              {sublabel}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
