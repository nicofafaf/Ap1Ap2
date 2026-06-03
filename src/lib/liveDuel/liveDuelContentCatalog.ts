import { CCNA1_ITN_PACKS } from "../../cisco/ccna1-v7/examCatalog";
import type { CiscoPackId } from "../../cisco/types";
import { SOMMER2026_EXAM_PACKS, type Sommer2026PackId } from "../curriculum/sommer2026Exams";
import type { LiveDuelContentKind, LiveDuelContentSourceId } from "./liveDuelTypes";

export type LiveDuelCatalogEntry = {
  id: LiveDuelContentSourceId;
  kind: LiveDuelContentKind;
  labelKey: string;
  descriptionKey: string;
  lf?: number;
  ciscoPackId?: CiscoPackId;
  sommerPackId?: Sommer2026PackId;
  moduleRange?: [number, number];
};

export function getLiveDuelContentCatalog(): LiveDuelCatalogEntry[] {
  const lfEntries: LiveDuelCatalogEntry[] = [
    {
      id: "lf:all",
      kind: "lf",
      labelKey: "liveDuel.catalog.lfAll",
      descriptionKey: "liveDuel.catalog.lfAllDesc",
    },
    ...Array.from({ length: 12 }, (_, i) => {
      const lf = i + 1;
      return {
        id: `lf:${lf}` as LiveDuelContentSourceId,
        kind: "lf" as const,
        labelKey: "liveDuel.catalog.lfOne",
        descriptionKey: "liveDuel.catalog.lfOneDesc",
        lf,
      };
    }),
  ];

  const ccnaEntries: LiveDuelCatalogEntry[] = [
    {
      id: "ccna:all",
      kind: "ccna",
      labelKey: "liveDuel.catalog.ccnaAll",
      descriptionKey: "liveDuel.catalog.ccnaAllDesc",
    },
    ...CCNA1_ITN_PACKS.map((pack) => ({
      id: `ccna:${pack.id}` as LiveDuelContentSourceId,
      kind: "ccna" as const,
      labelKey: "liveDuel.catalog.ccnaPack",
      descriptionKey: "liveDuel.catalog.ccnaPackDesc",
      ciscoPackId: pack.id,
      moduleRange: pack.moduleRange,
    })),
  ];

  const sommerEntries: LiveDuelCatalogEntry[] = (
    Object.keys(SOMMER2026_EXAM_PACKS) as Sommer2026PackId[]
  ).map((packId) => ({
    id: `sommer2026:${packId}` as LiveDuelContentSourceId,
    kind: "sommer2026" as const,
    labelKey: "liveDuel.catalog.sommerPack",
    descriptionKey: "liveDuel.catalog.sommerPackDesc",
    sommerPackId: packId,
  }));

  return [
    ...lfEntries,
    ...ccnaEntries,
    ...sommerEntries,
    {
      id: "mixed:weakest",
      kind: "mixed",
      labelKey: "liveDuel.catalog.mixedWeakest",
      descriptionKey: "liveDuel.catalog.mixedWeakestDesc",
    },
  ];
}

export function catalogEntryLabelParams(entry: LiveDuelCatalogEntry): Record<string, string> {
  if (entry.lf != null) return { lf: String(entry.lf) };
  if (entry.moduleRange) {
    return { from: String(entry.moduleRange[0]), to: String(entry.moduleRange[1]) };
  }
  if (entry.sommerPackId) return { pack: entry.sommerPackId.toUpperCase() };
  return {};
}
