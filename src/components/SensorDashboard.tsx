import { CircleAlert, Radio } from 'lucide-react';
import { SENSOR_BAY_COUNT } from '../services/iot/config';
import type { BayOperation } from '../services/bookingOperations';
import type { SensorBay, SensorConnection, SensorMode } from '../services/iot/types';

type Props = {
  mode: SensorMode;
  onModeChange: (mode: SensorMode) => void;
  connection: SensorConnection;
  bays: SensorBay[];
  facilityId: string;
  operations?: BayOperation[];
};
const time = (value: string) =>
  new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export function SensorDashboard({
  mode,
  onModeChange,
  connection,
  bays,
  facilityId,
  operations = [],
}: Props) {
  const visible = bays.filter((bay) => bay.facilityId === facilityId);
  const unavailableBayIds = new Set(operations.map((item) => item.bayId));
  const occupied = visible.filter(
    (bay) => bay.state === 'Occupied' && !unavailableBayIds.has(bay.bayId),
  ).length;
  const available = visible.filter(
    (bay) => bay.state === 'Available' && !unavailableBayIds.has(bay.bayId),
  ).length;
  const reporting = visible.filter(
    (bay) =>
      bay.sensorReady &&
      bay.deviceOnline &&
      (bay.state === 'Available' || bay.state === 'Occupied'),
  ).length;
  const unavailable = visible.filter(
    (bay) => bay.state === 'Uncertain' || bay.state === 'Stale',
  ).length;
  const latest = visible.reduce<string | null>(
    (value, bay) =>
      !value || Date.parse(bay.observedAt) > Date.parse(value) ? bay.observedAt : value,
    null,
  );
  const sourceLabel =
    mode === 'demo'
      ? 'Demo data'
      : connection === 'connected'
        ? 'Live data'
        : connection === 'connecting'
          ? 'Connecting'
          : 'Offline';

  return (
    <section className="sensor-dashboard" aria-label="Parking bay availability">
      <div className="sensor-dashboard-top">
        <div className="sensor-title">
          <span className="sensor-icon">
            <Radio size={16} />
          </span>
          <div>
            <b>Live bay status</b>
            <small>
              {sourceLabel}
              {latest ? ` · Updated ${time(latest)}` : ''}
            </small>
          </div>
        </div>
        <div className="sensor-mode-switch" role="group" aria-label="Availability data source">
          <button
            type="button"
            className={mode === 'demo' ? 'selected' : ''}
            onClick={() => onModeChange('demo')}
          >
            Demo
          </button>
          <button
            type="button"
            className={mode === 'live' ? 'selected' : ''}
            onClick={() => onModeChange('live')}
          >
            Live
          </button>
        </div>
      </div>

      <div className="sensor-summary">
        <div className="sensor-summary-primary">
          <strong>{available}</strong>
          <span>available</span>
        </div>
        <div className="sensor-summary-stats">
          <span>
            <b>{occupied}</b> occupied
          </span>
          <span>
            <b>
              {reporting}/{SENSOR_BAY_COUNT}
            </b>{' '}
            reporting
          </span>
          {unavailable > 0 && (
            <span>
              <b>{unavailable}</b> unavailable
            </span>
          )}
        </div>
      </div>

      {mode === 'live' && visible.length === 0 ? (
        <div className="sensor-empty-state">
          <CircleAlert size={16} />
          <span>No live readings yet. Bays remain unavailable until the ESP32 reports.</span>
        </div>
      ) : (
        <div className="sensor-bay-grid">
          {visible.map((bay) => {
            const operation = operations.find((item) => item.bayId === bay.bayId);
            const displayState = operation?.state || bay.state;
            return (
              <div
                className={`sensor-bay ${displayState.toLowerCase()}`}
                key={`${bay.facilityId}:${bay.bayId}`}
                title={operation ? `${operation.state} · ${operation.bookingReference}` : undefined}
              >
                <div className="sensor-bay-name">
                  <b>{bay.bayId}</b>
                  <span className="sensor-bay-dot" />
                </div>
                <strong>{displayState === 'Available' ? 'Free' : displayState}</strong>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
