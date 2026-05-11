import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "../../store/useGameStore";

type AudioPresetManagerProps = {
  onPresetLoaded?: () => void;
};

export function AudioPresetManager({ onPresetLoaded }: AudioPresetManagerProps) {
  const [presetName, setPresetName] = useState("");
  const state = useGameStore(
    useShallow((s) => ({
      savedAudioPresets: s.savedAudioPresets,
      resetAudioToDefault: s.resetAudioToDefault,
      saveAudioPreset: s.saveAudioPreset,
      loadAudioPreset: s.loadAudioPreset,
      deleteAudioPreset: s.deleteAudioPreset,
    }))
  );

  const sortedPresets = useMemo(
    () => [...state.savedAudioPresets].sort((a, b) => b.createdAt - a.createdAt),
    [state.savedAudioPresets]
  );

  return (
    <section style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
      <div style={{ fontSize: "10px", letterSpacing: ".12em" }}>AUDIO PRESET VAULT</div>

      <button
        onClick={state.resetAudioToDefault}
        style={{
          border: "1px solid rgba(248, 113, 113, 0.85)",
          boxShadow: "0 0 16px rgba(248,113,113,0.38)",
          background: "rgba(74, 16, 20, 0.78)",
        }}
      >
        RESET TO DEFAULTS
      </button>

      <label>
        PRESET NAME
        <input
          type="text"
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
          placeholder="e.g. Tournament Mix"
          style={{
            width: "100%",
            marginTop: 4,
            border: "1px solid rgba(34, 211, 238, 0.4)",
            borderRadius: 8,
            background: "rgba(6, 22, 31, 0.84)",
            color: "rgba(186, 230, 253, 0.98)",
            fontSize: 10,
            letterSpacing: ".06em",
            padding: "8px 10px",
            outline: "none",
          }}
        />
      </label>

      <button
        onClick={() => {
          state.saveAudioPreset(presetName);
          setPresetName("");
        }}
      >
        SAVE PRESET
      </button>

      <div style={{ display: "grid", gap: "6px", maxHeight: 190, overflowY: "auto" }}>
        {sortedPresets.length === 0 && (
          <div style={{ fontSize: 10, opacity: 0.7 }}>No presets saved yet</div>
        )}
        {sortedPresets.map((preset) => (
          <div
            key={preset.id}
            style={{
              border: "1px solid rgba(34, 211, 238, 0.22)",
              borderRadius: 8,
              padding: "8px 8px 7px",
              background: "rgba(7, 27, 39, 0.56)",
            }}
          >
            <div style={{ fontSize: 10, marginBottom: 6 }}>{preset.name}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => {
                  state.loadAudioPreset(preset.id);
                  onPresetLoaded?.();
                }}
                style={{ flex: 1 }}
              >
                LOAD
              </button>
              <button
                onClick={() => state.deleteAudioPreset(preset.id)}
                style={{
                  flex: 1,
                  borderColor: "rgba(251, 146, 60, 0.5)",
                  color: "rgba(253, 186, 116, 0.98)",
                }}
              >
                DELETE
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default AudioPresetManager;
