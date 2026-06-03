import { useNexusI18n } from "../../../../lib/i18n/I18nProvider";
import { goldAccent, cyanAccent } from "../edtechHubTokens";

type PlatformStats = {
  totalExercises: number;
  learningFieldCount: number;
  practiceToolCount: number;
  examTrackCount: number;
};

export function EdtechHubPlatformStats({ stats }: { stats: PlatformStats }) {
  const { t } = useNexusI18n();
  const items: { value: string; label: string; sub: string; accent: "cyan" | "gold" | "violet" }[] = [
    {
      value: String(stats.totalExercises),
      label: t("hub.edtech.platformExercises"),
      sub: t("hub.edtech.platformExercisesSub"),
      accent: "cyan",
    },
    {
      value: String(stats.learningFieldCount),
      label: t("hub.edtech.platformFields"),
      sub: t("hub.edtech.platformFieldsSub"),
      accent: "gold",
    },
    {
      value: `${stats.practiceToolCount}+`,
      label: t("hub.edtech.platformTools"),
      sub: t("hub.edtech.platformToolsSub"),
      accent: "violet",
    },
    {
      value: String(stats.examTrackCount),
      label: t("hub.edtech.platformExams"),
      sub: t("hub.edtech.platformExamsSub"),
      accent: "gold",
    },
  ];

  const color = (accent: string) =>
    accent === "gold" ? goldAccent : accent === "cyan" ? cyanAccent : "rgba(139, 92, 246, 0.95)";

  return (
    <div className="nx-edtech-hero-stats" role="group" aria-label={t("hub.edtech.platformTitle")}>
      {items.map((item) => (
        <div key={item.label} className="nx-edtech-hero-stat">
          <div className="nx-edtech-hero-stat-value" style={{ color: color(item.accent) }}>
            {item.value}
          </div>
          <div className="nx-edtech-hero-stat-label">{item.label}</div>
          <div className="nx-edtech-hero-stat-sub">{item.sub}</div>
        </div>
      ))}
    </div>
  );
}
