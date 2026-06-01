import type { ReactNode } from "react";
import { NexusCinematicShell } from "../ui/NexusCinematicShell";
import "./nexusOnboarding.css";

export type NexusOnboardingLayoutProps = {
  children: ReactNode;
  heroKicker?: string;
  heroTitle?: string;
  heroLead?: string;
  videoSrc?: string;
  videoPriority?: boolean;
  /** Avatar-Schritt: volle Breite, schmaler Hero-Streifen oben */
  layout?: "split" | "wide";
};

export function NexusOnboardingLayout({
  children,
  heroKicker,
  heroTitle,
  heroLead,
  videoSrc,
  videoPriority = false,
  layout = "split",
}: NexusOnboardingLayoutProps) {
  const hasHero = Boolean(heroTitle || heroLead || heroKicker);

  if (layout === "wide") {
    return (
      <div className="nx-onboard-layout nx-onboard-layout--wide">
        {hasHero ? (
          <NexusCinematicShell
            variant="strip"
            kicker={heroKicker}
            title={heroTitle}
            lead={heroLead}
            videoSrc={videoSrc}
            videoPriority={videoPriority}
          />
        ) : null}
        <div className="nx-onboard-panel">{children}</div>
      </div>
    );
  }

  return (
    <div className="nx-onboard-layout nx-onboard-layout--split">
      {hasHero ? (
        <aside className="nx-onboard-hero-col" aria-hidden={false}>
          <NexusCinematicShell
            variant="compact"
            kicker={heroKicker}
            title={heroTitle}
            lead={heroLead}
            videoSrc={videoSrc}
            videoPriority={videoPriority}
          />
        </aside>
      ) : null}
      <div className="nx-onboard-panel">{children}</div>
    </div>
  );
}
