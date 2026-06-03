import { useEffect, useMemo, useState } from "react";
import { resolveLiveDuelQuestion } from "../../lib/liveDuel/liveDuelQuestionResolve";
import { useNexusI18n } from "../../lib/i18n/I18nProvider";
import { useLiveDuelStore } from "../../store/useLiveDuelStore";

export function LiveDuelArena() {
  const { t } = useNexusI18n();
  const room = useLiveDuelStore((s) => s.room);
  const localPlayerId = useLiveDuelStore((s) => s.localPlayerId);
  const submitAnswer = useLiveDuelStore((s) => s.submitAnswer);
  const advanceAfterReveal = useLiveDuelStore((s) => s.advanceAfterReveal);
  const refreshRoom = useLiveDuelStore((s) => s.refreshRoom);
  const [answered, setAnswered] = useState(false);
  const [secLeft, setSecLeft] = useState(room?.settings.secondsPerQuestion ?? 20);

  const ref = room?.questionQueue[room.questionIndex];
  const resolved = useMemo(
    () => (ref ? resolveLiveDuelQuestion(ref) : null),
    [ref]
  );

  const isHost = room?.hostId === localPlayerId;

  useEffect(() => {
    if (!room?.code) return;
    const poll = window.setInterval(() => void refreshRoom(), 1500);
    return () => window.clearInterval(poll);
  }, [room?.code, refreshRoom]);

  useEffect(() => {
    if (!room || room.phase !== "question") return;
    setAnswered(false);
    const started = room.questionStartedAt ?? Date.now();
    const tick = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - started) / 1000);
      setSecLeft(Math.max(0, room.settings.secondsPerQuestion - elapsed));
    }, 250);
    return () => window.clearInterval(tick);
  }, [room?.questionIndex, room?.phase, room?.settings.secondsPerQuestion, room?.questionStartedAt]);

  if (!room || !ref || !resolved) {
    return <p className="nx-live-duel-hint">{t("liveDuel.arena.loading")}</p>;
  }

  const onPick = (optionId: string) => {
    if (answered || room.phase !== "question") return;
    const opt = resolved.options.find((o) => o.id === optionId);
    const correct = Boolean(opt?.correct);
    const elapsedMs = Date.now() - (room.questionStartedAt ?? Date.now());
    setAnswered(true);
    submitAnswer(correct, elapsedMs);
  };

  return (
    <div className="nx-live-duel-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="nx-live-duel-hint">
          {t("liveDuel.arena.progress")
            .replace("{cur}", String(room.questionIndex + 1))
            .replace("{total}", String(room.questionQueue.length))}
        </span>
        <span className="nx-live-duel-timer">{secLeft}s</span>
      </div>

      {resolved.imageSrc ? (
        <img
          src={resolved.imageSrc}
          alt=""
          style={{ maxWidth: "100%", borderRadius: 12, marginBottom: 12 }}
        />
      ) : null}

      <p className="nx-live-duel-arena-q">{resolved.prompt}</p>

      <div className="nx-live-duel-options">
        {resolved.options.map((o) => (
          <button
            key={o.id}
            type="button"
            className="nx-live-duel-option"
            disabled={answered || room.phase !== "question"}
            onClick={() => onPick(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>

      {room.phase === "reveal" ? (
        <div style={{ marginTop: "1rem" }}>
          <p className="nx-live-duel-hint">{t("liveDuel.arena.reveal")}</p>
          {isHost ? (
            <button
              type="button"
              className="nx-live-duel-cta"
              style={{ marginTop: 8 }}
              onClick={advanceAfterReveal}
            >
              {t("liveDuel.arena.next")}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="nx-live-duel-players" style={{ marginTop: "1.25rem" }}>
        {[...room.players]
          .sort((a, b) => b.score - a.score)
          .map((p) => (
            <div key={p.id} className="nx-live-duel-player">
              <span>{p.displayName}</span>
              <span>{p.score}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
