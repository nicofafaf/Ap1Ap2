import { useEffect, useState } from "react";
import { useNexusI18n } from "../../lib/i18n/I18nProvider";
import { useLiveDuelStore } from "../../store/useLiveDuelStore";
import { LiveDuelArena } from "./LiveDuelArena";
import { LiveDuelHostPanel } from "./LiveDuelHostPanel";
import { LiveDuelJoinPanel } from "./LiveDuelJoinPanel";
import { LiveDuelLobby } from "./LiveDuelLobby";
import { LiveDuelResults } from "./LiveDuelResults";
import "./liveDuelShell.css";

export type LiveDuelZoneProps = {
  presetJoinCode?: string | null;
};

export function LiveDuelZone({ presetJoinCode }: LiveDuelZoneProps) {
  const { t } = useNexusI18n();
  const view = useLiveDuelStore((s) => s.view);
  const room = useLiveDuelStore((s) => s.room);
  const [tab, setTab] = useState<"host" | "join">(presetJoinCode ? "join" : "host");

  useEffect(() => {
    if (!room) return;
    if (room.phase === "finished") {
      useLiveDuelStore.setState({ view: "results" });
      return;
    }
    if (room.phase === "question" || room.phase === "reveal") {
      useLiveDuelStore.setState({ view: "arena" });
    }
  }, [room?.phase, room?.questionIndex]);

  if (view === "lobby") return <LiveDuelLobby />;
  if (view === "arena") return <LiveDuelArena />;
  if (view === "results") return <LiveDuelResults />;

  return (
    <div className="nx-live-duel">
      <div className="nx-live-duel-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className={tab === "host" ? "nx-live-duel-tab nx-live-duel-tab--active" : "nx-live-duel-tab"}
          aria-selected={tab === "host"}
          onClick={() => setTab("host")}
        >
          {t("liveDuel.tabs.host")}
        </button>
        <button
          type="button"
          role="tab"
          className={tab === "join" ? "nx-live-duel-tab nx-live-duel-tab--active" : "nx-live-duel-tab"}
          aria-selected={tab === "join"}
          onClick={() => setTab("join")}
        >
          {t("liveDuel.tabs.join")}
        </button>
      </div>
      {tab === "host" ? <LiveDuelHostPanel /> : <LiveDuelJoinPanel presetCode={presetJoinCode ?? undefined} />}
    </div>
  );
}
