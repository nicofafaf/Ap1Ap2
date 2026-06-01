/**
 * Medien-URLs für den Service-Worker (`nexus-precache-manifest.json`).
 *
 * Nur leichte Shell-Assets beim Install — Boss-Videos (je mehrere MB) werden
 * on-demand gecacht, damit der erste Besuch nicht blockiert.
 */
export function collectNexusPrecacheUrls(): string[] {
  return [];
}
