import { useNexusI18n } from "../../../lib/i18n/I18nProvider";
import type { EdtechHubZoneId } from "./edtechHubZones";
import "./edtechZoneShell.css";

export type EdtechHubZoneNavProps = {
  active: EdtechHubZoneId;
  onChange: (zone: EdtechHubZoneId) => void;
};

const ZONE_I18N: Record<EdtechHubZoneId, { label: string; desc: string }> = {
  home: { label: "hub.edtech.zones.home", desc: "hub.edtech.zones.homeLead" },
  ccna: { label: "hub.edtech.zones.ccna", desc: "hub.edtech.zones.ccnaLead" },
  exams: { label: "hub.edtech.zones.exams", desc: "hub.edtech.zones.examsLead" },
  courses: { label: "hub.edtech.zones.courses", desc: "hub.edtech.zones.coursesLead" },
  progress: { label: "hub.edtech.zones.progress", desc: "hub.edtech.zones.progressLead" },
};

export function EdtechHubZoneNav({ active, onChange }: EdtechHubZoneNavProps) {
  const { t } = useNexusI18n();
  const zones = Object.keys(ZONE_I18N) as EdtechHubZoneId[];

  return (
    <nav className="nx-edtech-zone-nav" aria-label={t("hub.edtech.zones.navAria", "Lernbereiche")}>
      {zones.map((zone) => (
        <button
          key={zone}
          type="button"
          className={active === zone ? "nx-edtech-zone-tab nx-edtech-zone-tab--active" : "nx-edtech-zone-tab"}
          aria-current={active === zone ? "page" : undefined}
          onClick={() => onChange(zone)}
        >
          {t(ZONE_I18N[zone].label, zone)}
        </button>
      ))}
    </nav>
  );
}

export function EdtechHubZoneIntro({
  zone,
}: {
  zone: EdtechHubZoneId;
}) {
  const { t } = useNexusI18n();
  const meta = ZONE_I18N[zone];
  return (
    <header className="nx-edtech-zone-intro">
      <span className="nx-edtech-zone-intro-kicker">{t("hub.edtech.zones.kicker", "Bereich")}</span>
      <h2 className="nx-edtech-zone-intro-title">{t(meta.label, zone)}</h2>
      <p className="nx-edtech-zone-intro-lead">{t(meta.desc, "")}</p>
    </header>
  );
}
