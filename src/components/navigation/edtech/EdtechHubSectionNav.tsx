import { useEffect, useState, type RefObject } from "react";
import { useReducedMotion } from "framer-motion";
import { useNexusI18n } from "../../../lib/i18n/I18nProvider";
import "./edtechHubArena.css";

export const EDTECH_HUB_SECTION_IDS = [
  "nx-edtech-continue",
  "nx-ccna-hub",
  "nx-edtech-exams",
  "nx-edtech-rank",
  "nx-edtech-all-fields",
  "nx-edtech-insights",
] as const;

export type EdtechHubSectionId = (typeof EDTECH_HUB_SECTION_IDS)[number];

export function scrollEdtechHubSection(sectionId: EdtechHubSectionId, reduceMotion: boolean) {
  document.getElementById(sectionId)?.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });
}

export type EdtechHubSectionNavProps = {
  scrollParentRef?: RefObject<HTMLElement | null>;
  onScrollTop?: () => void;
};

export function EdtechHubSectionNav({ scrollParentRef, onScrollTop }: EdtechHubSectionNavProps) {
  const { t } = useNexusI18n();
  const reduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<EdtechHubSectionId>(EDTECH_HUB_SECTION_IDS[0]);

  const items: { id: EdtechHubSectionId; label: string }[] = [
    { id: "nx-edtech-continue", label: t("hub.edtech.sectionNav.continue", "Weiter") },
    { id: "nx-ccna-hub", label: t("hub.edtech.sectionNav.ccna", "CCNA") },
    { id: "nx-edtech-exams", label: t("hub.edtech.sectionNav.exams", "Prüfung") },
    { id: "nx-edtech-rank", label: t("hub.edtech.sectionNav.rank", "Rang") },
    { id: "nx-edtech-all-fields", label: t("hub.edtech.sectionNav.courses", "Kurse") },
    { id: "nx-edtech-insights", label: t("hub.edtech.sectionNav.insights", "Mehr") },
  ];

  useEffect(() => {
    const root = scrollParentRef?.current ?? null;
    const sections = EDTECH_HUB_SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target.id as EdtechHubSectionId | undefined;
        if (top && EDTECH_HUB_SECTION_IDS.includes(top)) setActiveId(top);
      },
      {
        root,
        rootMargin: "-12% 0px -55% 0px",
        threshold: [0, 0.12, 0.35, 0.6],
      }
    );

    for (const el of sections) observer.observe(el!);
    return () => observer.disconnect();
  }, [scrollParentRef]);

  return (
    <nav className="nx-edtech-hub-nav" aria-label={t("hub.edtech.sectionNav.aria", "Abschnitte")}>
      {onScrollTop ? (
        <button type="button" className="nx-edtech-hub-nav-top" onClick={onScrollTop}>
          ↑
        </button>
      ) : null}
      <div className="nx-edtech-hub-nav-scroll">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              activeId === item.id
                ? "nx-edtech-hub-nav-pill nx-edtech-hub-nav-pill--active"
                : "nx-edtech-hub-nav-pill"
            }
            aria-current={activeId === item.id ? "true" : undefined}
            onClick={() => scrollEdtechHubSection(item.id, Boolean(reduceMotion))}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
