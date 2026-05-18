import { memo, useEffect, useMemo, useState } from "react";
import { formatCountdownHMS, getDailyIncursionDefinition, getUtcDateKey, secondsUntilNextUtcMidnight } from "../../../lib/dailyIncursion";
import { useNexusI18n } from "../../../lib/i18n/I18nProvider";

/** Isoliert — Timer triggert kein Re-Render der 12 Lernfeld-Karten. */
export const EdtechDailyCountdown = memo(function EdtechDailyCountdown() {
  const { t } = useNexusI18n();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const dateKey = useMemo(() => getUtcDateKey(), [tick]);
  const dailyLf = useMemo(() => getDailyIncursionDefinition(dateKey).targetLf, [dateKey]);
  const secToMidnight = useMemo(() => secondsUntilNextUtcMidnight(), [tick]);

  return (
    <span
      style={{
        fontFamily: "var(--nx-font-mono)",
        fontSize: 12,
        color: "#64748b",
        letterSpacing: ".06em",
      }}
    >
      {formatCountdownHMS(secToMidnight)} · {t("map.edtechDailyReset")}
      {" · "}
      {t("map.edtechDailyLead").replace("{lf}", String(dailyLf))}
    </span>
  );
});
