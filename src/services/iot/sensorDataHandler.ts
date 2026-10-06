import type { BayState, SensorBay } from './types';

const allowedStates = new Set<BayState>(['Available', 'Occupied', 'Uncertain', 'Stale']);

function normalizeBay(value: unknown): SensorBay | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.facilityId !== 'string' || typeof raw.bayId !== 'string' || typeof raw.deviceId !== 'string') return null;
  if (typeof raw.observedAt !== 'string' || Number.isNaN(Date.parse(raw.observedAt))) return null;
  const state = allowedStates.has(raw.state as BayState) ? raw.state as BayState : 'Uncertain';
  return {
    facilityId: raw.facilityId.slice(0, 80), deviceId: raw.deviceId.slice(0, 80), bayId: raw.bayId.slice(0, 40),
    state, observedAt: raw.observedAt,
    vehicleLabel: typeof raw.vehicleLabel === 'string' ? raw.vehicleLabel.slice(0, 40) : null,
    sensorReady: raw.sensorReady === true, deviceOnline: raw.deviceOnline === true,
    distanceCm: typeof raw.distanceCm === 'number' && Number.isFinite(raw.distanceCm) ? raw.distanceCm : null,
  };
}

export function parseSensorMessage(data: unknown): { type: 'snapshot'; bays: SensorBay[] } | { type: 'bay_update'; bay: SensorBay } | { type: 'device_status'; deviceId: string; connected: boolean } | null {
  let parsed: unknown;
  try { parsed = typeof data === 'string' ? JSON.parse(data) : data; } catch { return null; }
  if (!parsed || typeof parsed !== 'object') return null;
  const message = parsed as Record<string, unknown>;
  if (message.type === 'snapshot' && Array.isArray(message.bays)) {
    return { type: 'snapshot', bays: message.bays.map(normalizeBay).filter((bay): bay is SensorBay => Boolean(bay)) };
  }
  if (message.type === 'bay_update') {
    const bay = normalizeBay(message.bay);
    return bay ? { type: 'bay_update', bay } : null;
  }
  if (message.type === 'device_status' && typeof message.deviceId === 'string') {
    return { type: 'device_status', deviceId: message.deviceId.slice(0, 80), connected: message.connected === true };
  }
  return null;
}
