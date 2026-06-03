const CACHE_KEY = "nexus.contentTranslate.cache.v1";
const MAX_CHARS = 480;

type CacheMap = Record<string, string>;

function readCache(): CacheMap {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CacheMap;
  } catch {
    return {};
  }
}

function writeCache(map: CacheMap): void {
  try {
    const keys = Object.keys(map);
    if (keys.length > 800) {
      for (const k of keys.slice(0, keys.length - 600)) delete map[k];
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
}

function cacheKey(from: string, to: string, text: string): string {
  return `${from}>${to}:${text.slice(0, 120)}`;
}

/**
 * On-demand Übersetzung (MyMemory, kostenlos, rate-limited).
 * Ergebnisse werden lokal gecacht — gleicher Text nur einmal abgefragt.
 */
export async function translateContentText(
  text: string,
  from: "de" | "en",
  to: "de" | "en"
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed || from === to) return text;

  const key = cacheKey(from, to, trimmed);
  const cache = readCache();
  if (cache[key]) return cache[key];

  const chunk = trimmed.length > MAX_CHARS ? `${trimmed.slice(0, MAX_CHARS)}…` : trimmed;

  try {
    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", chunk);
    url.searchParams.set("langpair", `${from}|${to}`);
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(14_000) });
    if (!res.ok) return text;
    const data = (await res.json()) as {
      responseStatus?: number;
      responseData?: { translatedText?: string };
    };
    const out = data.responseData?.translatedText?.trim();
    if (!out || out.toUpperCase() === chunk.toUpperCase()) return text;
    cache[key] = out;
    writeCache(cache);
    return trimmed.length > MAX_CHARS ? `${out}…` : out;
  } catch {
    return text;
  }
}
