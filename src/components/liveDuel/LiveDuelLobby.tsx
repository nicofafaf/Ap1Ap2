import { useEffect } from "react";
import { buildLiveDuelJoinUrl, buildLiveDuelQrImageUrl } from "../../lib/liveDuel/liveDuelUrls";
import { getLiveDuelSyncMode, subscribeLiveDuelRoomUpdates } from "../../lib/liveDuel/liveDuelSync";
import { useNexusI18n } from "../../lib/i18n/I18nProvider";
import { useLiveDuelStore } from "../../store/useLiveDuelStore";

export function LiveDuelLobby() {
  const { t } = useNexusI18n();
  const room = useLiveDuelStore((s) => s.room);
  const localPlayerId = useLiveDuelStore((s) => s.localPlayerId);
  const refreshRoom = useLiveDuelStore((s) => s.refreshRoom);
  const startMatch = useLiveDuelStore((s) => s.startMatch);
  const resetToHub = useLiveDuelStore((s) => s.resetToHub);
  const syncMessage = useLiveDuelStore((s) => s.syncMessage);

  const isHost = room?.hostId === localPlayerId;
  const joinUrl = room ? buildLiveDuelJoinUrl(room.code) : "";

  useEffect(() => {
    if (!room?.code) return;
    const poll = window.setInterval(() => void refreshRoom(), 2000);
    const unsub = subscribeLiveDuelRoomUpdates(room.code, () => void refreshRoom());
    return () => {
      window.clearInterval(poll);
      unsub();
    };
  }, [room?.code, refreshRoom]);

  if (!room) return null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="nx-live-duel-panel">
      <p className="nx-live-duel-hint">
        {t("liveDuel.lobby.lead")} ·{" "}
        {getLiveDuelSyncMode() === "supabase"
          ? t("liveDuel.sync.supabaseShort")
          : t("liveDuel.sync.localShort")}
      </p>

      <div className="nx-live-duel-invite">
        <div>
          <div className="nx-live-duel-code">{room.code}</div>
          <button type="button" className="nx-live-duel-cta nx-live-duel-cta--ghost" onClick={() => void copyLink()}>
            {t("liveDuel.lobby.copyLink")}
          </button>
          <p className="nx-live-duel-hint" style={{ wordBreak: "break-all" }}>
            {joinUrl}
          </p>
        </div>
        <img
          className="nx-live-duel-qr"
          src={buildLiveDuelQrImageUrl(joinUrl)}
          width={160}
          height={160}
          alt={t("liveDuel.lobby.qrAlt")}
        />
      </div>

      <div className="nx-live-duel-players" role="list">
        {room.players.map((p) => (
          <div key={p.id} className="nx-live-duel-player" role="listitem">
            <span>
              {p.displayName}
              {p.isHost ? ` · ${t("liveDuel.lobby.host")}` : ""}
            </span>
            <span>{p.score} LP</span>
          </div>
        ))}
      </div>

      <p className="nx-live-duel-hint">
        {t("liveDuel.lobby.questions")
          .replace("{n}", String(room.questionQueue.length))
          .replace("{sec}", String(room.settings.secondsPerQuestion))}
      </p>

      {syncMessage ? (
        <p className="nx-live-duel-hint">{t(syncMessage, syncMessage)}</p>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", marginTop: "0.75rem" }}>
        {isHost ? (
          <button type="button" className="nx-live-duel-cta" onClick={() => void startMatch()}>
            {t("liveDuel.lobby.start")}
          </button>
        ) : (
          <span className="nx-live-duel-hint">{t("liveDuel.lobby.waitHost")}</span>
        )}
        <button type="button" className="nx-live-duel-cta nx-live-duel-cta--ghost" onClick={resetToHub}>
          {t("liveDuel.lobby.leave")}
        </button>
      </div>
    </div>
  );
}
