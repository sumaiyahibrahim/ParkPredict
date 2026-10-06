import { useEffect, useMemo, useState } from 'react';
import { SensorConnectionManager } from './sensorConnectionManager';
import { markStaleBays } from './occupancyStateManager';
import type { BayState, SensorBay, SensorFeedState, SensorMode } from './types';

const facilityId = import.meta.env.VITE_IOT_FACILITY_ID || 'demo:white-town';
function makeDemoBays(): SensorBay[] {
  const now = new Date().toISOString();
  return Array.from({ length: 5 }, (_, index) => {
    const occupied = index === 1 || index === 4;
    return { facilityId, deviceId: 'demo-esp32', bayId: `A${index + 1}`, state: occupied ? 'Occupied' : 'Available', observedAt: now, vehicleLabel: occupied ? `Toy Car 0${index === 1 ? 1 : 2}` : null, sensorReady: true, deviceOnline: true };
  });
}

export function useSensorFeed() {
  const [mode, setModeState] = useState<SensorMode>(() => {
    try { return localStorage.getItem('parkpredict_sensor_mode') === 'live' ? 'live' : 'demo'; } catch { return 'demo'; }
  });
  const [state, setState] = useState<SensorFeedState>(() => ({ mode: 'demo', connection: 'demo', bays: makeDemoBays() }));
  const [tick, setTick] = useState(0);
  const setMode = (next: SensorMode) => { setModeState(next); try { localStorage.setItem('parkpredict_sensor_mode', next); } catch { /* Preference is optional. */ } };

  useEffect(() => {
    const freshnessTimer = window.setInterval(() => setTick(value => value + 1), 2000);
    return () => window.clearInterval(freshnessTimer);
  }, []);

  useEffect(() => {
    if (mode === 'demo') {
      setState({ mode, connection: 'demo', bays: makeDemoBays() });
      return;
    }
    const manager = new SensorConnectionManager(setState);
    manager.start(mode);
    return () => manager.stop();
  }, [mode]);

  const demoBays = useMemo(() => {
    if (mode !== 'demo') return state.bays;
    const states = ['Available', 'Occupied', 'Available', 'Available', 'Occupied'] as const;
    const movingIndex = Math.floor(tick / 2) % states.length;
    return state.bays.map((bay, index) => {
      const occupied = index === 1 || index === 4 || (index === movingIndex && tick % 2 === 1);
      const state: BayState = occupied ? 'Occupied' : 'Available';
      return { ...bay, state, vehicleLabel: occupied ? `Toy Car 0${index === 4 ? 2 : 1}` : null, observedAt: new Date().toISOString() };
    });
  }, [mode, state.bays, tick]);
  const bays = useMemo(() => markStaleBays(mode === 'demo' ? demoBays : state.bays), [mode, demoBays, state.bays, tick]);
  return { mode, setMode, connection: mode === 'demo' ? 'demo' : state.connection, bays, facilityId } as const;
}
