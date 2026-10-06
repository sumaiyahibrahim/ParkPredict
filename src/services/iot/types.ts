export type SensorMode = 'demo' | 'live';
export type BayState = 'Available' | 'Occupied' | 'Uncertain' | 'Stale';
export type SensorBay = {
  facilityId: string;
  deviceId: string;
  bayId: string;
  state: BayState;
  observedAt: string;
  vehicleLabel: string | null;
  sensorReady: boolean;
  deviceOnline: boolean;
  distanceCm?: number | null;
};
export type SensorConnection = 'demo' | 'connecting' | 'connected' | 'disconnected' | 'error';
export type SensorFeedState = { mode: SensorMode; connection: SensorConnection; bays: SensorBay[]; message?: string };
export type SensorListener = (state: SensorFeedState) => void;
