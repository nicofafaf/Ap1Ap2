import { useEffect, useState } from "react";
import { resolveLiveDuelQuestionAsync } from "../../lib/liveDuel/liveDuelQuestionResolve";
import { useNexusI18n } from "../../lib/i18n/I18nProvider";
import { useQuestionLocale } from "../../lib/i18n/useQuestionLocale";
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

  const { locale: questionLocale, autoTranslate } = useQuestionLocale();
  const ref = room?.questionQueue[room.questionIndex];
  const [resolved, setResolved] = useState<Awaited<ReturnType<typeof resolveLiveDuelQuestionAsync>>>(null);

  useEffect(() => {
    if (!ref) {
      setResolved(null);
      return;
    }
    let cancelled = false;
    void resolveLiveDuelQuestionAsync(ref, questionLocale, autoTranslate).then((q) => {
      if (!cancelled) setResolved(q);
    });
    return () => {
      cancelled = true;
    };
  }, [ref, questionLocale, autoTranslate]);

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

      {resolved.exhibitCode ? (
        <pre
          style={{
            maxWidth: "100%",
            overflowX: "auto",
            padding: "0.75rem 1rem",
            borderRadius: 12,
            marginBottom: 12,
            background: "rgba(15, 23, 42, 0.92)",
            color: "#e2e8f0",
            fontSize: "0.8rem",
            lineHeight: 1.45,
            whiteSpace: "pre",
          }}
        >
          {resolved.exhibitCode}
        </pre>
      ) : null}
      {resolved.imageSrc ? (
        <img
          src={resolved.imageSrc}
          alt={resolved.prompt.slice(0, 120)}
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
