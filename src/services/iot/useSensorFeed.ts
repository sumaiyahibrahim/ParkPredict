import { useEffect, useMemo, useState } from 'react';
import { SENSOR_BAYS, SENSOR_FACILITY_ID } from './config';
import { SensorConnectionManager } from './sensorConnectionManager';
import { markStaleBays } from './occupancyStateManager';
import type { SensorBay, SensorFeedState, SensorMode } from './types';

const demoDistances: Record<string, number> = { A1: 20, A2: 7, A3: 21, A4: 6 };

function makeDemoBays(): SensorBay[] {
  const now = new Date().toISOString();
  return SENSOR_BAYS.map((config) => ({
    facilityId: SENSOR_FACILITY_ID,
    deviceId: 'demo-esp32',
    sensorId: config.sensorId,
    bayId: config.bayId,
    state: config.bayId === 'A2' || config.bayId === 'A4' ? 'Occupied' : 'Available',
    observedAt: now,
    sensorReady: true,
    deviceOnline: true,
    distanceCm: demoDistances[config.bayId],
  }));
}

export function useSensorFeed() {
  const [mode, setModeState] = useState<SensorMode>(() => {
    try {
      return localStorage.getItem('parkpredict_sensor_mode') === 'live' ? 'live' : 'demo';
    } catch {
      return 'demo';
    }
  });
  const [state, setState] = useState<SensorFeedState>(() => ({
    mode: 'demo',
    connection: 'demo',
    bays: makeDemoBays(),
  }));
  const [freshnessTick, setFreshnessTick] = useState(0);
  const setMode = (next: SensorMode) => {
    setModeState(next);
    try {
      localStorage.setItem('parkpredict_sensor_mode', next);
    } catch {
      /* Preference is optional. */
    }
  };

  useEffect(() => {
    const timer = window.setInterval(() => setFreshnessTick((value) => value + 1), 2_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (mode === 'demo') {
      setState({
        mode,
        connection: 'demo',
        bays: makeDemoBays(),
        message: 'Simulated ultrasonic feed',
      });
      return;
    }
    const manager = new SensorConnectionManager(setState);
    manager.start(mode);
    return () => manager.stop();
  }, [mode]);

  const bays = useMemo(
    () => (mode === 'demo' ? state.bays : markStaleBays(state.bays)),
    [mode, state.bays, freshnessTick],
  );

  return {
    mode,
    setMode,
    connection: mode === 'demo' ? 'demo' : state.connection,
    bays,
    facilityId: SENSOR_FACILITY_ID,
  } as const;
}
