import { Activity, CarFront, CircleAlert, Radio, Wifi, WifiOff } from 'lucide-react';
import { displayRfidVehicle } from '../services/iot/rfidTagIdentification';
import type { SensorBay, SensorConnection, SensorMode } from '../services/iot/types';

type Props = { mode: SensorMode; onModeChange: (mode: SensorMode) => void; connection: SensorConnection; bays: SensorBay[]; facilityId: string };
const time = (value: string) => new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });

export function SensorDashboard({ mode, onModeChange, connection, bays, facilityId }: Props) {
  const visible = bays.filter(bay => bay.facilityId === facilityId);
  const occupied = visible.filter(bay => bay.state === 'Occupied').length;
  const available = visible.filter(bay => bay.state === 'Available').length;
  const known = visible.filter(bay => bay.state === 'Available' || bay.state === 'Occupied').length;
  const unknown = Math.max(0, 5 - known);
  const connected = connection === 'connected' || connection === 'demo';
  return <section className="sensor-dashboard" aria-label="IoT parking sensor status">
    <div className="sensor-dashboard-top">
      <div className="sensor-title"><span className="sensor-icon"><Radio size={15}/></span><div><b>RFID bay readers</b><small>{mode === 'demo' ? 'Simulated RFID demo' : 'ESP32 live connection'}</small></div></div>
      <div className="sensor-mode-switch" role="group" aria-label="Sensor data mode">
        <button type="button" className={mode === 'demo' ? 'selected' : ''} onClick={() => onModeChange('demo')}>Demo</button>
        <button type="button" className={mode === 'live' ? 'selected' : ''} onClick={() => onModeChange('live')}>Live</button>
      </div>
    </div>
    <div className={`sensor-connection ${connected ? 'online' : 'offline'}`}>
      {connected ? <Wifi size={13}/> : <WifiOff size={13}/>}
      <span>{mode === 'demo' ? 'Sample readings · not hardware' : connection === 'connected' ? 'Gateway connected' : connection === 'connecting' ? 'Connecting to IoT gateway…' : 'Gateway unavailable · retrying'}</span>
      {visible.length > 0 && <b>{known}/5 reporting · {available} empty · {occupied} occupied{unknown ? ` · ${unknown} unknown` : ''}</b>}
    </div>
    {mode === 'live' && visible.length === 0 ? <div className="sensor-empty-state"><CircleAlert size={14}/><span>No readings for this facility. Start the gateway and ESP32; live status stays unknown until data arrives.</span></div> :
      <div className="sensor-bay-grid">{visible.map(bay => <div className={`sensor-bay ${bay.state.toLowerCase()}`} key={`${bay.facilityId}:${bay.bayId}`}>
        <span className="sensor-bay-dot"/><b>{bay.bayId}</b><span>{bay.state === 'Available' ? 'Empty' : bay.state}</span>
        {bay.vehicleLabel ? <small><CarFront size={11}/>{displayRfidVehicle(bay.vehicleLabel)}</small> : bay.state === 'Occupied' ? <small>Vehicle not identified</small> : null}
        <small className="sensor-bay-device" title={bay.deviceId}>{bay.deviceId}</small>
        <small className="sensor-bay-time"><Activity size={10}/>{time(bay.observedAt)}</small>
      </div>)}</div>}

    {mode === 'live' && <p className="sensor-disclaimer">Only tag IDs added to the gateway allowlist receive a vehicle label; RFID is not a booking credential.</p>}
  </section>;
}
