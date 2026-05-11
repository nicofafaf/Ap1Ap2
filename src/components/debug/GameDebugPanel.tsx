import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "../../store/useGameStore";
import { nexusPresets, type NexusPresetId } from "../../data/nexusPresets";
import { type CombatRank } from "../../data/rankSoundConfig";
import { useBossAudioEngine } from "../../lib/audio/bossAudioEngine";
import AudioPresetManager from "./AudioPresetManager";

export function GameDebugPanel() {
  const { playRankSound } = useBossAudioEngine();
  const [previewRank, setPreviewRank] = useState<CombatRank | null>(null);
  const [waveToken, setWaveToken] = useState(0);
  const [masterGainFlashOn, setMasterGainFlashOn] = useState(false);
  const state = useGameStore(
    useShallow((s) => ({
      currentBossHP: s.currentBossHP,
      maxBossHP: s.maxBossHP,
      gameState: s.gameState,
      activeLF: s.activeLF,
      activePreset: s.activePreset,
      particleDensity: s.particleDensity,
      chromaticIntensity: s.chromaticIntensity,
      vignetteStrength: s.vignetteStrength,
      timeScaleOverride: s.timeScaleOverride,
      audioBufferCount: s.audioBufferCount,
      activeAudioTrackPath: s.activeAudioTrackPath,
      bossPlaybackRate: s.bossPlaybackRate,
      rankAudioProfiles: s.rankAudioProfiles,
      rankSoundMasterGain: s.rankSoundMasterGain,
      sRankDuckingDb: s.sRankDuckingDb,
      cRankStaticLayerEnabled: s.cRankStaticLayerEnabled,
      initiateCombat: s.initiateCombat,
      triggerBossHit: s.triggerBossHit,
      declareVictory: s.declareVictory,
      toggleLowHP: s.toggleLowHP,
      setChromaticIntensity: s.setChromaticIntensity,
      setVignetteStrength: s.setVignetteStrength,
      setTimeScaleOverride: s.setTimeScaleOverride,
      applyPreset: s.applyPreset,
      setRankSoundMasterGain: s.setRankSoundMasterGain,
      setSRankDuckingDb: s.setSRankDuckingDb,
      setCRankStaticLayerEnabled: s.setCRankStaticLayerEnabled,
      updateRankAudioProfile: s.updateRankAudioProfile,
    }))
  );

  const hpPct = useMemo(
    () =>
      state.maxBossHP > 0
        ? Math.round((state.currentBossHP / state.maxBossHP) * 100)
        : 0,
    [state.currentBossHP, state.maxBossHP]
  );

  if (!import.meta.env.DEV) return null;

  const rankPreviewBars = Array.from({ length: 24 }, (_, idx) => {
    const noise = Math.abs(Math.sin((idx + 1) * 1.37 + waveToken * 0.72));
    const amp = 12 + Math.round(noise * 36);
    return <span key={`${idx}-${waveToken}`} style={{ height: `${amp}%` }} />;
  });

  const triggerRankTest = (rank: CombatRank) => {
    setPreviewRank(rank);
    setWaveToken((n) => n + 1);
    void playRankSound(rank);
    window.setTimeout(() => {
      setPreviewRank((current) => (current === rank ? null : current));
    }, 980);
  };

  return (
    <aside
      style={{
        position: "absolute",
        top: "14px",
        right: "14px",
        zIndex: 80,
        width: "320px",
        borderRadius: "14px",
        padding: "12px",
        backdropFilter: "blur(14px)",
        background: "rgba(2, 18, 29, 0.52)",
        border: "1px solid rgba(34, 211, 238, 0.36)",
        boxShadow: "0 0 28px rgba(34, 211, 238, 0.22)",
        fontFamily:
          '"JetBrains Mono","Inter",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace',
        color: "rgba(186, 230, 253, 0.96)",
      }}
    >
      <p style={{ margin: 0, fontSize: "11px", letterSpacing: "0.2em" }}>
        NEXUS DEBUG PANEL
      </p>
      <p style={{ margin: "6px 0 0", fontSize: "11px" }}>
        LF {state.activeLF} | {state.gameState} | BOSS HP {hpPct}%
      </p>

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px" }}>
        <button onClick={() => state.initiateCombat(state.activeLF, 100)}>
          SPAWN_BOSS
        </button>
        <button onClick={() => state.triggerBossHit(12)}>TRIGGER_HIT</button>
        <button onClick={state.declareVictory}>DECLARE_VICTORY</button>
        <button onClick={state.toggleLowHP}>TOGGLE_LOW_HP</button>
      </div>

      <div style={{ marginTop: "10px", display: "grid", gap: "6px" }}>
        <div style={{ fontSize: "10px", letterSpacing: ".12em" }}>PRESETS</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "6px",
          }}
        >
          {(Object.keys(nexusPresets) as NexusPresetId[]).map((presetId) => {
            const active = state.activePreset === presetId;
            return (
              <motion.button
                key={presetId}
                layout
                transition={{ duration: 0.25, ease: "easeOut" }}
                onClick={() => state.applyPreset(presetId)}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  background: active
                    ? "rgba(12, 52, 70, 0.9)"
                    : "rgba(8, 30, 44, 0.72)",
                }}
              >
                {active && (
                  <motion.span
                    layoutId="preset-active-pill"
                    transition={{ duration: 0.32, ease: "easeInOut" }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      border: "1px solid rgba(34, 211, 238, 0.86)",
                      boxShadow: "0 0 16px rgba(34,211,238,.32) inset",
                      borderRadius: "8px",
                    }}
                  />
                )}
                <span style={{ position: "relative", zIndex: 1 }}>{presetId}</span>
              </motion.button>
            );
          })}
        </div>
        <div style={{ fontSize: "10px", opacity: 0.92 }}>
          {nexusPresets[state.activePreset].description}
        </div>
      </div>

      <div style={{ marginTop: "10px", display: "grid", gap: "8px" }}>
        <label>
          Chromatic {state.chromaticIntensity.toFixed(2)}
          <input
            type="range"
            min={0}
            max={2}
            step={0.01}
            value={state.chromaticIntensity}
            onChange={(e) => state.setChromaticIntensity(Number(e.target.value))}
          />
        </label>
        <label>
          Vignette {state.vignetteStrength.toFixed(2)}
          <input
            type="range"
            min={0.35}
            max={2}
            step={0.01}
            value={state.vignetteStrength}
            onChange={(e) => state.setVignetteStrength(Number(e.target.value))}
          />
        </label>
        <label>
          TimeScale {state.timeScaleOverride.toFixed(2)}
          <input
            type="range"
            min={0.5}
            max={1.25}
            step={0.01}
            value={state.timeScaleOverride}
            onChange={(e) => state.setTimeScaleOverride(Number(e.target.value))}
          />
        </label>
      </div>

      <div style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
        <div style={{ fontSize: "10px", letterSpacing: ".12em" }}>RANK AUDIO TUNING</div>
        <label className={masterGainFlashOn ? "master-gain-flash" : ""}>
          Master Gain {state.rankSoundMasterGain.toFixed(2)}
          <input
            type="range"
            min={0.2}
            max={2.4}
            step={0.01}
            value={state.rankSoundMasterGain}
            onChange={(e) => state.setRankSoundMasterGain(Number(e.target.value))}
          />
        </label>
        <label>
          S-Rank Ducking {state.sRankDuckingDb.toFixed(1)} dB
          <input
            type="range"
            min={-18}
            max={0}
            step={0.1}
            value={state.sRankDuckingDb}
            onChange={(e) => state.setSRankDuckingDb(Number(e.target.value))}
          />
        </label>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            fontSize: 10,
          }}
        >
          C Static Layer
          <input
            type="checkbox"
            checked={state.cRankStaticLayerEnabled}
            onChange={(e) => state.setCRankStaticLayerEnabled(e.target.checked)}
          />
        </label>
      </div>

      <div style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
        {(Object.keys(state.rankAudioProfiles) as CombatRank[]).map((rank) => (
          <div
            key={rank}
            style={{
              border: "1px solid rgba(34, 211, 238, 0.24)",
              borderRadius: 8,
              padding: 8,
              background: "rgba(7, 27, 39, 0.56)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <div style={{ fontSize: 10 }}>
                Rank {rank} - {state.rankAudioProfiles[rank].label}
              </div>
              <button onClick={() => triggerRankTest(rank)}>TEST_PLAY</button>
            </div>
            <label>
              Gain {state.rankAudioProfiles[rank].gain.toFixed(2)}
              <input
                type="range"
                min={0.3}
                max={2}
                step={0.01}
                value={state.rankAudioProfiles[rank].gain}
                onChange={(e) =>
                  state.updateRankAudioProfile(rank, { gain: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Playback {state.rankAudioProfiles[rank].playbackRate.toFixed(2)}
              <input
                type="range"
                min={0.6}
                max={1.4}
                step={0.01}
                value={state.rankAudioProfiles[rank].playbackRate}
                onChange={(e) =>
                  state.updateRankAudioProfile(rank, { playbackRate: Number(e.target.value) })
                }
              />
            </label>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "10px" }}>
        <div style={{ fontSize: 10, opacity: 0.9 }}>
          Wave Preview {previewRank ? `- Rank ${previewRank}` : "- idle"}
        </div>
        <div className="rank-wave-grid">{rankPreviewBars}</div>
      </div>

      <AudioPresetManager
        onPresetLoaded={() => {
          setMasterGainFlashOn(false);
          window.setTimeout(() => setMasterGainFlashOn(true), 0);
          window.setTimeout(() => setMasterGainFlashOn(false), 640);
        }}
      />

      <div style={{ marginTop: "10px", fontSize: "10px", opacity: 0.9 }}>
        <div>Preset: {state.activePreset} | Particles: {state.particleDensity}</div>
        <div>Audio Buffer: {state.audioBufferCount}</div>
        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          Active Track: {state.activeAudioTrackPath ?? "none"}
        </div>
        <div>Video Rate: {state.bossPlaybackRate.toFixed(2)}</div>
      </div>

      <style>{`
        aside button {
          background: rgba(8, 30, 44, 0.72);
          color: rgba(165, 243, 252, 0.98);
          border: 1px solid rgba(34, 211, 238, 0.42);
          border-radius: 8px;
          font-size: 10px;
          letter-spacing: .08em;
          padding: 7px 8px;
          cursor: pointer;
        }
        aside button:hover {
          box-shadow: 0 0 14px rgba(34,211,238,.32);
        }
        aside input[type="range"] {
          width: 100%;
          margin-top: 4px;
          accent-color: #22d3ee;
        }
        aside label {
          display: block;
          font-size: 10px;
        }
        aside input[type="checkbox"] {
          accent-color: #22d3ee;
        }
        aside .rank-wave-grid {
          margin-top: 6px;
          height: 48px;
          border: 1px solid rgba(34, 211, 238, 0.22);
          border-radius: 8px;
          display: grid;
          grid-template-columns: repeat(24, minmax(0, 1fr));
          align-items: end;
          gap: 2px;
          padding: 4px;
          background: rgba(5, 17, 26, 0.72);
        }
        aside .rank-wave-grid span {
          border-radius: 2px;
          background: linear-gradient(180deg, rgba(34, 211, 238, 0.95), rgba(59, 130, 246, 0.35));
          animation: waveFade .95s ease-out;
        }
        @keyframes waveFade {
          from { opacity: .95; transform: scaleY(1.06); }
          to { opacity: .42; transform: scaleY(.92); }
        }
        aside .master-gain-flash {
          animation: masterGainPulse .55s ease-out;
          border-radius: 8px;
          box-shadow: 0 0 0 rgba(34, 211, 238, 0);
        }
        @keyframes masterGainPulse {
          0% { box-shadow: 0 0 0 rgba(34, 211, 238, 0); background: rgba(17, 94, 89, 0); }
          45% { box-shadow: 0 0 16px rgba(34, 211, 238, 0.48); background: rgba(8, 70, 90, 0.28); }
          100% { box-shadow: 0 0 0 rgba(34, 211, 238, 0); background: rgba(17, 94, 89, 0); }
        }
      `}</style>
    </aside>
  );
}

export default GameDebugPanel;
