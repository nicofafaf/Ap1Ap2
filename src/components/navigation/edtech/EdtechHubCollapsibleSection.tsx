import { useEffect, useId, useState, type ReactNode } from "react";
import { useNexusI18n } from "../../../lib/i18n/I18nProvider";
import "./edtechHubArena.css";

export type EdtechHubCollapsibleSectionProps = {
  id?: string;
  title: string;
  lead?: string;
  children: ReactNode;
};

export function EdtechHubCollapsibleSection({
  id,
  title,
  lead,
  children,
}: EdtechHubCollapsibleSectionProps) {
  const panelId = useId();
  const { t } = useNexusI18n();
  const [expanded, setExpanded] = useState(false);
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const sync = () => {
      const wide = mq.matches;
      setDesktop(wide);
      if (wide) setExpanded(true);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const showPanel = expanded || desktop;
  const toggleLabel = expanded
    ? t("hub.edtech.insights.collapse", "Weniger anzeigen")
    : t("hub.edtech.insights.expand", "Einblicke & Tools anzeigen");

  return (
    <section id={id} className="nx-edtech-hub-section nx-edtech-hub-collapsible">
      <button
        type="button"
        className={
          desktop
            ? "nx-edtech-hub-collapsible-trigger nx-edtech-hub-collapsible-trigger--desktop-hidden"
            : "nx-edtech-hub-collapsible-trigger"
        }
        aria-expanded={showPanel}
        aria-controls={panelId}
        onClick={() => setExpanded((v) => !v)}
      >
        <span>
          <span className="nx-edtech-hub-collapsible-title">{title}</span>
          {lead ? <span className="nx-edtech-hub-collapsible-lead">{lead}</span> : null}
        </span>
        <span className="nx-edtech-hub-collapsible-chevron" aria-hidden>
          {expanded ? "−" : "+"}
        </span>
        <span className="nx-edtech-hub-sr-only">{toggleLabel}</span>
      </button>
      {desktop ? (
        <header className="nx-edtech-hub-section-head" style={{ padding: "1rem 1.15rem 0" }}>
          <span className="nx-edtech-hub-section-kicker">{t("hub.edtech.insights.kicker", "Analyse")}</span>
          <h2 className="nx-edtech-hub-section-title">{title}</h2>
          {lead ? <p className="nx-edtech-hub-section-lead">{lead}</p> : null}
        </header>
      ) : null}
      {showPanel ? (
        <div
          id={panelId}
          className={
            desktop
              ? "nx-edtech-hub-collapsible-panel nx-edtech-hub-collapsible-panel--desktop-open"
              : "nx-edtech-hub-collapsible-panel"
          }
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}
