/** Data-Shard UI: sichtbare Satzzeichen entfernen (Nexus AAA Spec) */
const PUNCT_RE = /[.,;:!?·…'"„‚«»]/g;

export function shardLabel(text: string): string {
  return text.replace(PUNCT_RE, "").replace(/\s{2,}/g, " ").trim();
}
