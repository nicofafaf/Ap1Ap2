import { useState } from "react";
import { normalizeLiveDuelRoomCode } from "../../lib/liveDuel/liveDuelRoomCode";
import { useNexusI18n } from "../../lib/i18n/I18nProvider";
import { useGameStore } from "../../store/useGameStore";
import { useLiveDuelStore } from "../../store/useLiveDuelStore";

export function LiveDuelJoinPanel({ presetCode }: { presetCode?: string }) {
  const { t } = useNexusI18n();
  const [code, setCode] = useState(presetCode ?? "");
  const [name, setName] = useState(() => useGameStore.getState().playerName ?? "");
  const joinRoom = useLiveDuelStore((s) => s.joinRoom);
  const isBusy = useLiveDuelStore((s) => s.isBusy);
  const syncMessage = useLiveDuelStore((s) => s.syncMessage);

  return (
    <div className="nx-live-duel-panel">
      <p className="nx-live-duel-hint">{t("liveDuel.join.lead")}</p>

      <div className="nx-live-duel-field">
        <label htmlFor="nx-duel-code">{t("liveDuel.join.code")}</label>
        <input
          id="nx-duel-code"
          value={code}
          onChange={(e) => setCode(normalizeLiveDuelRoomCode(e.target.value))}
          placeholder="ABC123"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="nx-live-duel-field">
        <label htmlFor="nx-duel-join-name">{t("liveDuel.join.name")}</label>
        <input
          id="nx-duel-join-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="nickname"
        />
      </div>

      {syncMessage ? (
        <p className="nx-live-duel-hint">{t(syncMessage, syncMessage)}</p>
      ) : null}

      <button
        type="button"
        className="nx-live-duel-cta"
        disabled={isBusy || code.length < 4}
        onClick={() => void joinRoom(code, name)}
      >
        {t("liveDuel.join.cta")}
      </button>
    </div>
  );
}
