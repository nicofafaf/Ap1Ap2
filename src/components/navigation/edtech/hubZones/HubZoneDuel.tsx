import { LiveDuelZone } from "../../../liveDuel/LiveDuelZone";

export type HubZoneDuelProps = {
  presetJoinCode?: string | null;
};

export function HubZoneDuel({ presetJoinCode }: HubZoneDuelProps) {
  return (
    <div className="nx-edtech-zone-panel">
      <LiveDuelZone presetJoinCode={presetJoinCode} />
    </div>
  );
}
