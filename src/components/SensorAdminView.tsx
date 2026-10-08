import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BellRing,
  CheckCircle2,
  CircleAlert,
  Gauge,
  Radio,
  RotateCcw,
  Router,
  Save,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { SENSOR_BAYS, SENSOR_BAY_COUNT, SENSOR_DEVICE_ID } from '../services/iot/config';
import type { BayOperation, DemoBooking, ParkingIncident } from '../services/bookingOperations';
import type { SensorBay, SensorConnection, SensorMode } from '../services/iot/types';

type Props = {
  onBack: () => void;
  onSignOut: () => void;
  mode: SensorMode;
  connection: SensorConnection;
  bays: SensorBay[];
  facilityId: string;
  bookings: DemoBooking[];
  incidents: ParkingIncident[];
  operations: BayOperation[];
  onSimulateUnauthorized: (bookingId: string) => void;
  onAcknowledgeIncident: (incidentId: string) => void;
};
type Calibration = {
  facilityId: string;
  bayId: string;
  sensorId: string;
  emptyBaselineCm: number;
  occupiedThresholdCm: number;
  clearThresholdCm: number;
  minimumValidCm: number;
  maximumValidCm: number;
};
const formatTime = (value?: string) =>
  !value || Number.isNaN(Date.parse(value))
    ? 'No reading received'
    : new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'medium' });
const apiRoot = () =>
  import.meta.env.VITE_IOT_API_URL?.trim().replace(/\/$/, '') ||
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? `${location.protocol}//${location.hostname}:8000`
    : '');
const defaults = (facilityId: string): Calibration[] =>
  SENSOR_BAYS.map((bay) => ({ facilityId, ...bay }));

export function SensorAdminView({
  onBack,
  onSignOut,
  mode,
  connection,
  bays,
  facilityId,
  bookings,
  incidents,
  operations,
  onSimulateUnauthorized,
  onAcknowledgeIncident,
}: Props) {
  const root = apiRoot();
  const publicPreview = !root;
  const readings = bays.filter((bay) => bay.facilityId === facilityId);
  const [calibrations, setCalibrations] = useState<Calibration[]>(() => defaults(facilityId));
  const [message, setMessage] = useState('');
  const [workingBay, setWorkingBay] = useState('');
  const token = sessionStorage.getItem('parkpredict_admin_token') || '';
  const reporting = readings.filter(
    (bay) =>
      bay.sensorReady &&
      bay.deviceOnline &&
      (bay.state === 'Available' || bay.state === 'Occupied'),
  ).length;
  const uncertain = readings.filter((bay) => bay.state === 'Uncertain').length;
  const stale = readings.filter((bay) => bay.state === 'Stale').length;
  const activeBookings = bookings.filter(
    (booking) => booking.status === 'upcoming' && booking.lotId === facilityId,
  );
  const openIncidents = incidents.filter((incident) => incident.status === 'open');
  const lastReading = useMemo(
    () =>
      readings.reduce<string | undefined>(
        (latest, bay) =>
          !latest || Date.parse(bay.observedAt) > Date.parse(latest) ? bay.observedAt : latest,
        undefined,
      ),
    [readings],
  );

  useEffect(() => {
    if (!root || !token) return;
    fetch(`${root}/api/admin/calibration?facilityId=${encodeURIComponent(facilityId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            (await response.json().catch(() => null))?.detail || 'Calibration could not be loaded.',
          );
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data.calibrations)) setCalibrations(data.calibrations);
      })
      .catch((error) =>
        setMessage(error instanceof Error ? error.message : 'Calibration could not be loaded.'),
      );
  }, [facilityId, root, token]);

  const change = (bayId: string, field: keyof Calibration, value: string) => {
    const number = Number(value);
    setCalibrations((rows) =>
      rows.map((row) =>
        row.bayId === bayId ? { ...row, [field]: Number.isFinite(number) ? number : 0 } : row,
      ),
    );
    setMessage('');
  };
  const save = async (row: Calibration) => {
    if (publicPreview) {
      setMessage(
        'Preview updated in this browser only. Connect the local gateway to save calibration.',
      );
      return;
    }
    setWorkingBay(row.bayId);
    try {
      const response = await fetch(
        `${root}/api/admin/calibration/${encodeURIComponent(row.facilityId)}/${encodeURIComponent(row.bayId)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(row),
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.detail || 'Calibration could not be saved.');
      setCalibrations((rows) =>
        rows.map((item) => (item.bayId === row.bayId ? data.calibration : item)),
      );
      setMessage(`${row.bayId} calibration saved by the gateway.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Calibration could not be saved.');
    } finally {
      setWorkingBay('');
    }
  };
  const captureEmpty = async (row: Calibration) => {
    if (publicPreview) {
      setMessage('Empty capture requires the local gateway and a fresh sensor reading.');
      return;
    }
    setWorkingBay(row.bayId);
    try {
      const response = await fetch(
        `${root}/api/admin/calibration/${encodeURIComponent(row.facilityId)}/${encodeURIComponent(row.bayId)}/capture-empty`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.detail || 'Empty baseline could not be captured.');
      setCalibrations((rows) =>
        rows.map((item) => (item.bayId === row.bayId ? data.calibration : item)),
      );
      setMessage(`${row.bayId} empty baseline captured and saved.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Empty baseline could not be captured.');
    } finally {
      setWorkingBay('');
    }
  };

  return (
    <main className="admin-page sensor-admin-page">
      <div className="admin-toolbar">
        <div>
          <div className="eyebrow">PARKPREDICT · OPERATOR CONSOLE</div>
          <h1>Ultrasonic sensor management</h1>
          <p>Monitor the ESP32 gateway, four bay sensors, and saved calibration.</p>
        </div>
        <div className="sensor-admin-toolbar-actions">
          <span className="operator-session-badge">
            <ShieldCheck size={14} /> {publicPreview ? 'Demo admin preview' : 'Technician session'}
          </span>
          <button className="back-button" onClick={onBack}>
            <ArrowLeft size={15} /> Back to parking
          </button>
          <button className="back-button operator-logout" onClick={onSignOut}>
            {publicPreview ? 'Exit preview' : 'Sign out'}
          </button>
        </div>
      </div>
      <div className="sensor-admin-notice">
        <ShieldCheck size={19} />
        <div>
          <b>{publicPreview ? 'Public demonstration preview' : 'Protected technician controls'}</b>
          <p>
            {publicPreview
              ? 'This page demonstrates the operator interface. Calibration is saved only when the local FastAPI gateway is connected.'
              : 'Only authenticated parking technicians can change calibration. Driver accounts receive read-only bay status.'}
          </p>
        </div>
      </div>

      <section className="sensor-admin-card admin-gateway-overview">
        <div className="sensor-admin-card-title">
          <span>
            <Router size={18} />
          </span>
          <div>
            <h2>Gateway overview</h2>
            <p>Current status for {facilityId}.</p>
          </div>
        </div>
        <div className="admin-overview-grid">
          <div>
            <small>FACILITY</small>
            <b>{facilityId}</b>
          </div>
          <div>
            <small>DEVICE</small>
            <b>{readings[0]?.deviceId || SENSOR_DEVICE_ID}</b>
          </div>
          <div>
            <small>CONNECTION</small>
            <b>{mode === 'demo' ? 'Demo feed' : connection}</b>
          </div>
          <div>
            <small>LAST READING</small>
            <b>{formatTime(lastReading)}</b>
          </div>
          <div>
            <small>HEALTHY</small>
            <b>
              {reporting}/{SENSOR_BAY_COUNT}
            </b>
          </div>
          <div>
            <small>UNCERTAIN / STALE</small>
            <b>
              {uncertain} / {stale}
            </b>
          </div>
        </div>
      </section>

      <div className="sensor-admin-grid">
        <section className="sensor-admin-card">
          <div className="sensor-admin-card-title">
            <span>
              <Radio size={18} />
            </span>
            <div>
              <h2>Sensor-to-bay mapping</h2>
              <p>One ultrasonic sensor is assigned to each physical bay.</p>
            </div>
          </div>
          <div className="sensor-reader-mapping">
            {calibrations.map((row, index) => (
              <div className="sensor-reader-row" key={row.bayId}>
                <span className="sensor-admin-bay-id">Ultrasonic Sensor {index + 1}</span>
                <span aria-hidden="true">→</span>
                <b>{row.bayId}</b>
                <small>{row.sensorId}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="sensor-admin-card">
          <div className="sensor-admin-card-title">
            <span>
              <Gauge size={18} />
            </span>
            <div>
              <h2>Live readings</h2>
              <p>Unreliable readings remain unavailable to drivers.</p>
            </div>
          </div>
          <div className="sensor-admin-bay-readings">
            <div className="sensor-readings-heading">
              <b>Latest bay readings</b>
              <span>
                {reporting}/{SENSOR_BAY_COUNT} reporting
              </span>
            </div>
            {calibrations.map((config) => {
              const bay = readings.find((item) => item.bayId === config.bayId);
              const operation = operations.find((item) => item.bayId === config.bayId);
              const shownState = operation?.state || bay?.state || 'Unknown';
              return (
                <article className="sensor-reading-row" key={config.bayId}>
                  <span className={'reading-state-dot ' + shownState.toLowerCase()} />
                  <b>{config.bayId}</b>
                  <span className={'reading-state ' + shownState.toLowerCase()}>{shownState}</span>
                  <small>{bay?.sensorId || config.sensorId}</small>
                  <small>
                    {bay?.distanceCm == null
                      ? 'No valid distance'
                      : `${bay.distanceCm.toFixed(1)} cm`}
                  </small>
                  {bay?.sensorReady && bay.deviceOnline ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <CircleAlert size={15} />
                  )}
                  <span className="reading-vehicle">{formatTime(bay?.observedAt)}</span>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <section className="sensor-admin-card operations-panel">
        <div className="sensor-admin-card-title">
          <span>
            <BellRing size={18} />
          </span>
          <div>
            <h2>Reservations and conflict alerts</h2>
            <p>Reservation state is matched with the physical sensor reading for each bay.</p>
          </div>
          <strong
            className={
              openIncidents.length ? 'operator-alert-count active' : 'operator-alert-count'
            }
          >
            {openIncidents.length} open
          </strong>
        </div>
        <div className="operator-reservation-list">
          {activeBookings.length ? (
            activeBookings.map((booking) => {
              const bayId = (booking.bay || '').replace(/^Bay\s+/i, '');
              const incident = incidents.find((item) => item.bookingId === booking.id);
              return (
                <article
                  className={`operator-reservation ${incident ? 'has-conflict' : ''}`}
                  key={booking.id}
                >
                  <div>
                    <span className="operator-reservation-bay">{bayId || '—'}</span>
                    <div>
                      <b>{booking.reference}</b>
                      <small>
                        {booking.operationalStatus === 'reassigned'
                          ? `Reassigned from ${booking.originalBay}`
                          : booking.arrivalStatus === 'checked-in'
                            ? `${booking.operationalStatus === 'overstay' ? 'Overstay' : booking.operationalStatus === 'exit-requested' ? 'Exit requested' : 'Driver checked in'} · until ${new Date(booking.parkingEndsAt || booking.scheduledEnd).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                            : `Reserved · ${new Date(booking.scheduledStart).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`}
                      </small>
                    </div>
                  </div>
                  <span
                    className={`operation-status ${incident ? 'conflict' : booking.operationalStatus === 'overstay' ? 'conflict' : booking.arrivalStatus === 'checked-in' ? 'checked-in' : 'reserved'}`}
                  >
                    {incident
                      ? 'Conflict'
                      : booking.operationalStatus === 'overstay'
                        ? 'Overstay'
                        : booking.operationalStatus === 'exit-requested'
                          ? 'Exit pending'
                          : booking.arrivalStatus === 'checked-in'
                            ? 'Checked in'
                            : 'Reserved'}
                  </span>
                  {!incident && booking.arrivalStatus === 'pending' && (
                    <button
                      className="simulate-conflict-button"
                      onClick={() => onSimulateUnauthorized(booking.id)}
                    >
                      <TriangleAlert size={14} /> Simulate unauthorized parking
                    </button>
                  )}
                </article>
              );
            })
          ) : (
            <div className="operator-empty-state">
              Create a parking pass to see its reserved bay here.
            </div>
          )}
        </div>
        {incidents.length > 0 && (
          <div className="incident-log">
            <div className="incident-log-heading">
              <b>Incident log</b>
              <span>Price and booking duration are preserved</span>
            </div>
            {incidents.map((incident) => (
              <article className="incident-row" key={incident.id}>
                <TriangleAlert size={16} />
                <div>
                  <b>{incident.bayId} occupied before driver check-in</b>
                  <span>
                    {incident.reference} · moved to{' '}
                    {incident.replacementBayId || 'manual reassignment required'} ·{' '}
                    {new Date(incident.detectedAt).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <span className={`incident-state ${incident.status}`}>{incident.status}</span>
                {incident.status === 'open' && (
                  <button onClick={() => onAcknowledgeIncident(incident.id)}>Acknowledge</button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="sensor-admin-card calibration-panel">
        <div className="sensor-admin-card-title">
          <span>
            <Gauge size={18} />
          </span>
          <div>
            <h2>Per-bay calibration</h2>
            <p>
              Keep the bay empty before capturing a baseline. Occupied and clear thresholds are
              separate to prevent flicker.
            </p>
          </div>
        </div>
        <div className="calibration-grid">
          {calibrations.map((row) => (
            <article className="calibration-card" key={row.bayId}>
              <div className="calibration-card-head">
                <b>{row.bayId}</b>
                <small>{row.sensorId}</small>
              </div>
              <label>
                Empty baseline (cm)
                <input
                  type="number"
                  min="2"
                  max="400"
                  step="0.1"
                  value={row.emptyBaselineCm}
                  onChange={(event) => change(row.bayId, 'emptyBaselineCm', event.target.value)}
                />
              </label>
              <label>
                Occupied threshold (cm)
                <input
                  type="number"
                  min="2"
                  max="400"
                  step="0.1"
                  value={row.occupiedThresholdCm}
                  onChange={(event) => change(row.bayId, 'occupiedThresholdCm', event.target.value)}
                />
              </label>
              <label>
                Clear threshold (cm)
                <input
                  type="number"
                  min="2"
                  max="400"
                  step="0.1"
                  value={row.clearThresholdCm}
                  onChange={(event) => change(row.bayId, 'clearThresholdCm', event.target.value)}
                />
              </label>
              <div className="calibration-valid-range">
                <label>
                  Minimum
                  <input
                    type="number"
                    min="1"
                    max="400"
                    step="0.1"
                    value={row.minimumValidCm}
                    onChange={(event) => change(row.bayId, 'minimumValidCm', event.target.value)}
                  />
                </label>
                <label>
                  Maximum
                  <input
                    type="number"
                    min="2"
                    max="500"
                    step="0.1"
                    value={row.maximumValidCm}
                    onChange={(event) => change(row.bayId, 'maximumValidCm', event.target.value)}
                  />
                </label>
              </div>
              <div className="calibration-actions">
                <button
                  type="button"
                  onClick={() => void captureEmpty(row)}
                  disabled={Boolean(workingBay)}
                >
                  <RotateCcw size={14} /> Capture empty
                </button>
                <button type="button" onClick={() => void save(row)} disabled={Boolean(workingBay)}>
                  <Save size={14} /> Save
                </button>
              </div>
            </article>
          ))}
        </div>
        {message && (
          <p className="sensor-config-message" role="status">
            {message}
          </p>
        )}
      </section>
      <div className="sensor-admin-bottom">
        <span>
          <ShieldCheck size={15} /> Physical occupancy and reservation state are separate. A
          distance sensor cannot identify a vehicle or prove a booking.
        </span>
        <span>Device tokens and Wi-Fi credentials stay in backend and ESP32 secret files.</span>
      </div>
    </main>
  );
}
