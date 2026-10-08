export type UltrasonicBayConfig = {
  bayId: string;
  sensorId: string;
  emptyBaselineCm: number;
  occupiedThresholdCm: number;
  clearThresholdCm: number;
  minimumValidCm: number;
  maximumValidCm: number;
};

export const SENSOR_FACILITY_ID = import.meta.env.VITE_IOT_FACILITY_ID || 'demo:white-town';
export const SENSOR_DEVICE_ID = 'esp32-demo-01';

export const SENSOR_BAYS: readonly UltrasonicBayConfig[] = [
  {
    bayId: 'A1',
    sensorId: 'ultrasonic-a1',
    emptyBaselineCm: 20,
    occupiedThresholdCm: 12,
    clearThresholdCm: 15,
    minimumValidCm: 2,
    maximumValidCm: 60,
  },
  {
    bayId: 'A2',
    sensorId: 'ultrasonic-a2',
    emptyBaselineCm: 20,
    occupiedThresholdCm: 12,
    clearThresholdCm: 15,
    minimumValidCm: 2,
    maximumValidCm: 60,
  },
  {
    bayId: 'A3',
    sensorId: 'ultrasonic-a3',
    emptyBaselineCm: 21,
    occupiedThresholdCm: 12,
    clearThresholdCm: 15,
    minimumValidCm: 2,
    maximumValidCm: 60,
  },
  {
    bayId: 'A4',
    sensorId: 'ultrasonic-a4',
    emptyBaselineCm: 20,
    occupiedThresholdCm: 12,
    clearThresholdCm: 15,
    minimumValidCm: 2,
    maximumValidCm: 60,
  },
] as const;

export const SENSOR_BAY_IDS = SENSOR_BAYS.map((bay) => bay.bayId);
export const SENSOR_BAY_COUNT = SENSOR_BAYS.length;
