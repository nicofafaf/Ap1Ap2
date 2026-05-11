/**
 * KINETIC_VICTORY_ASCENSION — Timings & Events (Fractal Collapse, Flashbang-Helligkeit, Finisher)
 */

export const VICTORY_IMPLODE_MS = 420;
export const VICTORY_FREEZE_MS = 200;
/** Sicht-Dauer der Canvas-Shards (html2canvas) — unverändert grob */
export const VICTORY_SHATTER_PHYSICS_MS = 2800;

/** Flashbang: filter brightness ~500 % — Faktor × Basis-(--nx-bg)-Helligkeit (Ziel ≈ 5.0) */
export const VICTORY_ENERGY_BRIGHTNESS_MULT = 10;
/** Chromatic_Shift: Peak-Hold bevor die Szene in helles Ascension-Level fällt */
export const VICTORY_ENERGY_HOLD_MS = 1500;
export const VICTORY_ENERGY_RELEASE_MS = 1800;

export const NX_VICTORY_ENERGY_WAVE = "nx-victory-energy-wave";

export type VictoryEnergyWaveDetail = {
  brightnessMult: number;
  holdMs: number;
  releaseMs: number;
};

export function dispatchVictoryEnergyWave(
  detail: Partial<VictoryEnergyWaveDetail> = {}
): void {
  window.dispatchEvent(
    new CustomEvent<VictoryEnergyWaveDetail>(NX_VICTORY_ENERGY_WAVE, {
      detail: {
        brightnessMult: detail.brightnessMult ?? VICTORY_ENERGY_BRIGHTNESS_MULT,
        holdMs: detail.holdMs ?? VICTORY_ENERGY_HOLD_MS,
        releaseMs: detail.releaseMs ?? VICTORY_ENERGY_RELEASE_MS,
      },
    })
  );
}

/** Framer-Shard-Burst: Anzahl Glas-Splitter */
export const VICTORY_FRAMER_SHARD_COUNT = 18;
