import { useMemo, useState } from "react";
import { catalogEntryLabelParams, getLiveDuelContentCatalog } from "../../lib/liveDuel/liveDuelContentCatalog";
import type { LiveDuelContentSourceId } from "../../lib/liveDuel/liveDuelTypes";
import {
  LIVE_DUEL_QUESTION_COUNT_MAX,
  LIVE_DUEL_QUESTION_COUNT_MIN,
  LIVE_DUEL_SECONDS_MAX,
  LIVE_DUEL_SECONDS_MIN,
} from "../../lib/liveDuel/liveDuelTypes";
import { useNexusI18n } from "../../lib/i18n/I18nProvider";
import { useGameStore } from "../../store/useGameStore";
import { useLiveDuelStore } from "../../store/useLiveDuelStore";

export function LiveDuelHostPanel() {
  const { t } = useNexusI18n();
  const [hostName, setHostName] = useState(() => useGameStore.getState().playerName ?? "");
  const settings = useLiveDuelStore((s) => s.settings);
  const setSettings = useLiveDuelStore((s) => s.setSettings);
  const createRoom = useLiveDuelStore((s) => s.createRoom);
  const isBusy = useLiveDuelStore((s) => s.isBusy);
  const syncMessage = useLiveDuelStore((s) => s.syncMessage);
  const catalog = useMemo(() => getLiveDuelContentCatalog(), []);
  const leitner = useGameStore((s) => s.learningLeitnerByExerciseId);
  const learningCorrectByLf = useGameStore((s) => s.learningCorrectByLf);

  return (
    <div className="nx-live-duel-panel">
      <p className="nx-live-duel-hint">{t("liveDuel.host.lead")}</p>

      <div className="nx-live-duel-field">
        <label htmlFor="nx-duel-host-name">{t("liveDuel.host.name")}</label>
        <input
          id="nx-duel-host-name"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
          autoComplete="nickname"
        />
      </div>

      <div className="nx-live-duel-field">
        <label htmlFor="nx-duel-source">{t("liveDuel.host.content")}</label>
        <select
          id="nx-duel-source"
          value={settings.contentSourceId}
          onChange={(e) =>
            setSettings({ contentSourceId: e.target.value as LiveDuelContentSourceId })
          }
        >
          {catalog.map((entry) => {
            let label = t(entry.labelKey, entry.id);
            for (const [k, v] of Object.entries(catalogEntryLabelParams(entry))) {
              label = label.replace(`{${k}}`, v);
            }
            return (
              <option key={entry.id} value={entry.id}>
                {label}
              </option>
            );
          })}
        </select>
      </div>

      <div className="nx-live-duel-grid-2">
        <div className="nx-live-duel-field">
          <label htmlFor="nx-duel-count">{t("liveDuel.host.questionCount")}</label>
          <input
            id="nx-duel-count"
            type="number"
            min={LIVE_DUEL_QUESTION_COUNT_MIN}
            max={LIVE_DUEL_QUESTION_COUNT_MAX}
            value={settings.questionCount}
            onChange={(e) =>
              setSettings({
                questionCount: Math.min(
                  LIVE_DUEL_QUESTION_COUNT_MAX,
                  Math.max(LIVE_DUEL_QUESTION_COUNT_MIN, Number(e.target.value) || 10)
                ),
              })
            }
          />
        </div>
        <div className="nx-live-duel-field">
          <label htmlFor="nx-duel-seconds">{t("liveDuel.host.seconds")}</label>
          <input
            id="nx-duel-seconds"
            type="number"
            min={LIVE_DUEL_SECONDS_MIN}
            max={LIVE_DUEL_SECONDS_MAX}
            value={settings.secondsPerQuestion}
            onChange={(e) =>
              setSettings({
                secondsPerQuestion: Math.min(
                  LIVE_DUEL_SECONDS_MAX,
                  Math.max(LIVE_DUEL_SECONDS_MIN, Number(e.target.value) || 20)
                ),
              })
            }
          />
        </div>
      </div>

      <div className="nx-live-duel-field">
        <label htmlFor="nx-duel-scoring">{t("liveDuel.host.scoring")}</label>
        <select
          id="nx-duel-scoring"
          value={settings.scoring}
          onChange={(e) =>
            setSettings({ scoring: e.target.value as "speed" | "correct-only" })
          }
        >
          <option value="speed">{t("liveDuel.host.scoringSpeed")}</option>
          <option value="correct-only">{t("liveDuel.host.scoringCorrect")}</option>
        </select>
      </div>

      {syncMessage ? (
        <p className="nx-live-duel-hint">{t(syncMessage, syncMessage)}</p>
      ) : null}

      <button
        type="button"
        className="nx-live-duel-cta"
        disabled={isBusy}
        onClick={() =>
          void createRoom(hostName, { leitner, learningCorrectByLf })
        }
      >
        {t("liveDuel.host.create")}
      </button>
    </div>
  );
}
