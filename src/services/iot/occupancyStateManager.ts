import type { SensorBay } from './types';

export function mergeBayReadings(previous: SensorBay[], updates: SensorBay[]): SensorBay[] {
  const byId = new Map(previous.map(bay => [`${bay.facilityId}:${bay.bayId}`, bay]));
  for (const bay of updates) byId.set(`${bay.facilityId}:${bay.bayId}`, bay);
  return [...byId.values()].sort((a, b) => a.facilityId.localeCompare(b.facilityId) || a.bayId.localeCompare(b.bayId));
}

export function markStaleBays(bays: SensorBay[], staleAfterMs = 12_000, now = Date.now()): SensorBay[] {
  return bays.map(bay => {
    const isStale = !bay.deviceOnline || now - Date.parse(bay.observedAt) > staleAfterMs;
    return isStale && bay.state !== 'Stale' ? { ...bay, state: 'Stale' } : bay;
  });
}
