import { useNexusI18n } from "../../../../lib/i18n/I18nProvider";
import { goldAccent, cyanAccent } from "../edtechHubTokens";

export function EdtechHubStatStrip({
  nexusFragments,
  coveragePct,
  totalCorrect,
  totalCurriculum,
  dailyParticipationStreak,
  unlockedSectors,
}: {
  nexusFragments: number;
  coveragePct: number;
  totalCorrect: number;
  totalCurriculum: number;
  dailyParticipationStreak: number;
  unlockedSectors: number;
}) {
  const { t } = useNexusI18n();
  const chips = [
    { label: t("hub.edtech.statFragments"), value: String(nexusFragments), accent: goldAccent },
    {
      label: t("hub.edtech.statCoverage"),
      value: `${coveragePct}%`,
      sub: `${totalCorrect}/${totalCurriculum}`,
      accent: cyanAccent,
    },
    {
      label: t("hub.edtech.statStreak"),
      value: String(dailyParticipationStreak),
      accent: "rgba(139, 92, 246, 0.95)",
    },
    { label: t("hub.edtech.statSectors"), value: String(unlockedSectors), accent: cyanAccent },
    { label: t("hub.edtech.feed.livePulse"), value: "●", sub: t("hub.edtech.feed.liveSub"), accent: goldAccent },
  ];

  return (
    <div className="nx-edtech-hub-stats" role="group" aria-label={t("hub.edtech.statsAria")}>
      {chips.map((chip) => (
        <div key={chip.label} className="nx-edtech-stat-chip">
          <div className="nx-edtech-stat-chip-value" style={{ color: chip.accent }}>
            {chip.value}
          </div>
          <div className="nx-edtech-stat-chip-label">{chip.label}</div>
          {chip.sub ? <div className="nx-edtech-stat-chip-sub">{chip.sub}</div> : null}
        </div>
      ))}
    </div>
  );
}
