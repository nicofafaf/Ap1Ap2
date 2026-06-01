import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { FRACTAL_COMMAND_BG_MP4 } from "../../lib/ui/fractalConstants";
import { EdtechLazyVideo } from "../navigation/edtech/EdtechLazyVideo";
import "./nexusCinematic.css";

export type NexusCinematicVariant = "hero" | "compact" | "strip";

export type NexusCinematicShellProps = {
  variant?: NexusCinematicVariant;
  videoSrc?: string;
  videoPriority?: boolean;
  kicker?: string;
  title?: string;
  lead?: string;
  children?: ReactNode;
  className?: string;
};

/**
 * Gemeinsame Hero-/Cinematic-Fläche (Hub, Onboarding, Lernsession-Kopf)
 * Video + Verlauf + Typo wie im EdTech-Hub-Hero
 */
export function NexusCinematicShell({
  variant = "hero",
  videoSrc = FRACTAL_COMMAND_BG_MP4,
  videoPriority = false,
  kicker,
  title,
  lead,
  children,
  className = "",
}: NexusCinematicShellProps) {
  const reduceMotion = useReducedMotion();
  const showVideo = Boolean(videoSrc) && !reduceMotion;

  return (
    <motion.section
      className={`nx-cinematic nx-cinematic--${variant} ${className}`.trim()}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 30 }}
    >
      <div className="nx-cinematic-media" aria-hidden>
        {showVideo ? (
          <EdtechLazyVideo
            src={videoSrc!}
            mode="viewport"
            priority={videoPriority || variant === "hero"}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          />
        ) : (
          <span className="nx-cinematic-fallback" />
        )}
        <span className="nx-cinematic-overlay" />
      </div>
      <div className="nx-cinematic-content">
        {kicker ? <span className="nx-cinematic-kicker">{kicker}</span> : null}
        {title ? <h2 className="nx-cinematic-title">{title}</h2> : null}
        {lead ? <p className="nx-cinematic-lead">{lead}</p> : null}
        {children ? <div className="nx-cinematic-actions">{children}</div> : null}
      </div>
    </motion.section>
  );
}
