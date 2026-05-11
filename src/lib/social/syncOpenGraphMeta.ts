/**
 * Clientseitige Anreicherung von Social-Meta (nach Hydration).
 * Hinweis: Viele Crawler lesen nur das initiale HTML — Basis-Tags liegen in index.html;
 * hier werden Titel/Beschreibung aus lokaler Progression gesetzt (z. B. erneuter Share aus der App).
 */

const ARCHITECT_PERSONA_KEY = "nexus.architectPersonaProfile.v1";
const NEURAL_AUGMENTS_KEY = "nexus.neuralAugments.v1";

function setMeta(attr: "property" | "name", key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function readPersonaTitle(): string | null {
  try {
    const raw = localStorage.getItem(ARCHITECT_PERSONA_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as { title?: string };
    return typeof o.title === "string" && o.title.trim() ? o.title.trim() : null;
  } catch {
    return null;
  }
}

function readFragments(): number | null {
  try {
    const raw = localStorage.getItem(NEURAL_AUGMENTS_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as { fragments?: number };
    return typeof o.fragments === "number" && Number.isFinite(o.fragments)
      ? Math.max(0, Math.floor(o.fragments))
      : null;
  } catch {
    return null;
  }
}

export function syncOpenGraphMetaFromLocalState(siteName = "Nexus Path") {
  if (typeof document === "undefined") return;

  const persona = readPersonaTitle();
  const fr = readFragments();
  const mastery =
    fr != null ? `Nexus-Fragmente: ${fr}` : "Spaced-Repetition & IHK-Operator-Stack";

  const title = persona
    ? `${siteName} · ${persona}`
    : `${siteName} · Architect Progression`;

  const description = [persona ? `Persona: ${persona}` : null, mastery, "PWA · AES-GCM · Web Audio"]
    .filter(Boolean)
    .join(" — ");

  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const imageAbs = `${window.location.origin}${base}/og-nexus-share.svg`;

  document.title = title;
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("property", "og:image", imageAbs);
  setMeta("name", "twitter:title", title);
  setMeta("name", "twitter:description", description);
  setMeta("name", "twitter:image", imageAbs);
}
