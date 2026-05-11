/** Boss nimmt Schaden → globale Fractal-Atmosphäre (Helligkeit, Partikel, Shake) */
export const NX_FRACTAL_BOSS_DAMAGE = "nx-fractal-boss-damage";

export type FractalBossDamageDetail = {
  lastDamage: number;
  /** 0–1 relativ zu maxBossHP */
  intensity: number;
};

export function computeFractalBossHitIntensity(
  lastDamage: number,
  maxBossHp: number
): number {
  if (maxBossHp <= 0 || lastDamage <= 0) return 0;
  return Math.min(1, Math.max(0, lastDamage / maxBossHp));
}

export function dispatchFractalBossDamageBurst(
  lastDamage: number,
  maxBossHp: number
): void {
  const intensity = computeFractalBossHitIntensity(lastDamage, maxBossHp);
  window.dispatchEvent(
    new CustomEvent<FractalBossDamageDetail>(NX_FRACTAL_BOSS_DAMAGE, {
      detail: { lastDamage, intensity },
    })
  );
}
