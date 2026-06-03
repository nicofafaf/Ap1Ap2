import { useNexusI18n } from "../../lib/i18n/I18nProvider";
import { useLiveDuelStore } from "../../store/useLiveDuelStore";

export function LiveDuelResults() {
  const { t } = useNexusI18n();
  const room = useLiveDuelStore((s) => s.room);
  const resetToHub = useLiveDuelStore((s) => s.resetToHub);

  if (!room) return null;

  const ranked = [...room.players].sort((a, b) => b.score - a.score);

  return (
    <div className="nx-live-duel-panel">
      <h3 style={{ margin: "0 0 0.75rem", fontWeight: 800 }}>{t("liveDuel.results.title")}</h3>
      <div className="nx-live-duel-players">
        {ranked.map((p, i) => (
          <div key={p.id} className="nx-live-duel-player">
            <span>
              #{i + 1} {p.displayName}
            </span>
            <span>{p.score}</span>
          </div>
        ))}
      </div>
      <p className="nx-live-duel-hint">{t("liveDuel.results.hint")}</p>
      <button type="button" className="nx-live-duel-cta" onClick={resetToHub}>
        {t("liveDuel.results.back")}
      </button>
    </div>
  );
}
