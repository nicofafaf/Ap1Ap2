import { useEffect, useMemo } from "react";
import { getNexusEntryForLF, type LearningField } from "../../data/nexusRegistry";

function lfIndex(lf: LearningField): number {
  return Number.parseInt(lf.replace("LF", ""), 10);
}

function lfFromIndex(n: number): LearningField {
  const clamped = Math.min(12, Math.max(1, n));
  return `LF${clamped}` as LearningField;
}

const imageCache = new Set<string>();
const audioCache = new Set<string>();
const videoCache = new Set<string>();

const preloadImage = (src: string) => {
  if (!src || imageCache.has(src)) return;
  imageCache.add(src);
  const img = new Image();
  img.decoding = "async";
  img.loading = "eager";
  img.src = src;
};

const preloadAudio = (src: string) => {
  if (!src || audioCache.has(src)) return;
  audioCache.add(src);
  const audio = document.createElement("audio");
  audio.preload = "auto";
  audio.src = src;
};

const preloadVideo = (src: string) => {
  if (!src || videoCache.has(src)) return;
  videoCache.add(src);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.src = src;
};

export const useNexusAssetProvider = (currentLF: LearningField) => {
  const entry = useMemo(() => getNexusEntryForLF(currentLF), [currentLF]);

  useEffect(() => {
    const n = lfIndex(currentLF);
    const ring = new Set<LearningField>([lfFromIndex(n - 1), lfFromIndex(n), lfFromIndex(n + 1)]);
    for (const lf of ring) {
      const item = getNexusEntryForLF(lf);
      preloadVideo(item.bossVisual.primaryPath);
      item.bossVisual.fallbackPaths.forEach(preloadImage);
      preloadAudio(item.audio.trackPath);
      preloadAudio(item.phase2ThemePath);
      preloadImage(item.loot.itemPath);
    }
  }, [currentLF]);

  return entry;
};
