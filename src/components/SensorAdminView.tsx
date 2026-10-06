import { useState } from 'react';
import { ArrowLeft, CheckCircle2, CircleAlert, KeyRound, Radio, Router, ShieldCheck, Wifi } from 'lucide-react';
import { displayRfidVehicle } from '../services/iot/rfidTagIdentification';
import type { SensorBay, SensorConnection, SensorMode } from '../services/iot/types';

type Props = { onBack: () => void; onSignOut: () => void; mode: SensorMode; connection: SensorConnection; bays: SensorBay[]; facilityId: string };
const formatTime = (value: string) => Number.isNaN(Date.parse(value)) ? 'Time unavailable' : new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'medium' });

export function SensorAdminView({ onBack, onSignOut, mode, connection, bays, facilityId }: Props) {
  const publicPreview = !import.meta.env.VITE_IOT_API_URL?.trim() && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1';
  const [configuredFacility, setConfiguredFacility] = useState(facilityId);
  const [deviceName, setDeviceName] = useState('esp32-demo-01');
  const [readerBays, setReaderBays] = useState(['A1', 'A2', 'A3', 'A4', 'A5']);
  const [wifiName, setWifiName] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [deviceToken, setDeviceToken] = useState('');
  const [savedPreview, setSavedPreview] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const readings = bays.filter(bay => bay.facilityId === facilityId);
  const connected = connection === 'connected' || mode === 'demo';

  const submitPreview = (event: React.FormEvent) => {
    event.preventDefault();
    if (!configuredFacility.trim() || !deviceName.trim() || !wifiName.trim() || !wifiPassword || !deviceToken || readerBays.some(bay => !bay)) {
      setFormMessage('Complete the facility, gateway, Wi-Fi, token, and reader mappings.');
      return;
    }
    setSavedPreview(true);
    setFormMessage('Configuration preview is active in this page only. The gateway and ESP32 were not changed.');
  };

  return <main className="admin-page sensor-admin-page">
    <div className="admin-toolbar">
      <div><div className="eyebrow">PARKPREDICT · OPERATOR CONSOLE</div><h1>Sensor setup</h1><p>Manage the demo gateway and review its five monitored bays.</p></div>
      <div className="sensor-admin-toolbar-actions"><span className="operator-session-badge"><ShieldCheck size={14}/> {publicPreview ? 'Demo admin preview' : 'Technician session'}</span><button className="back-button" onClick={onBack}><ArrowLeft size={15}/> Back to parking</button><button className="back-button operator-logout" onClick={onSignOut}>{publicPreview ? 'Exit preview' : 'Sign out'}</button></div>
    </div>

    <div className="sensor-admin-notice"><ShieldCheck size={19}/><div><b>{publicPreview ? 'Public demonstration mode' : 'Technician-only configuration'}</b><p>{publicPreview ? 'This console is an interactive preview. Values stay in this browser and cannot register devices, change Wi-Fi, or update gateway secrets.' : 'Driver accounts can view bay readings but cannot open this setup screen. RFID tag IDs identify occupancy; they are not sign-in or booking credentials.'}</p></div></div>

    <div className="sensor-admin-grid">
      <form className="sensor-admin-card sensor-config-form" onSubmit={submitPreview}>
        <div className="sensor-admin-card-title"><span><Router size={18}/></span><div><h2>Gateway configuration</h2><p>Set up the values for your five-bay demo.</p></div></div>
        <label className="sensor-config-field">Facility ID<input value={configuredFacility} onChange={event => { setConfiguredFacility(event.target.value); setSavedPreview(false); }} placeholder="demo:white-town" /></label>
        <label className="sensor-config-field">Gateway name<input value={deviceName} onChange={event => { setDeviceName(event.target.value); setSavedPreview(false); }} placeholder="esp32-demo-01" /></label>
        <div className="sensor-admin-detail"><small>GATEWAY STATUS</small><b className={connected ? 'status-good' : 'status-waiting'}>{mode === 'demo' ? 'Demo feed' : connection === 'connected' ? 'Connected' : connection === 'connecting' ? 'Connecting' : 'Offline'}</b></div>
        <div className="sensor-config-section-title"><Wifi size={15}/> ESP32 Wi-Fi and device token</div>
        <label className="sensor-config-field">Wi-Fi network name<input autoComplete="off" required value={wifiName} onChange={event => setWifiName(event.target.value)} placeholder="Enter network SSID for setup preview" /></label>
        <label className="sensor-config-field">Wi-Fi password<input type="password" autoComplete="new-password" required value={wifiPassword} onChange={event => setWifiPassword(event.target.value)} placeholder="Only held in this page memory" /></label>
        <label className="sensor-config-field">Device token<input type="password" autoComplete="new-password" required value={deviceToken} onChange={event => setDeviceToken(event.target.value)} placeholder="Gateway device token" /></label>
        <div className="sensor-config-security"><KeyRound size={14}/> Credentials are not stored or sent from this demo form. Configure device secrets on the authorized gateway before connecting hardware.</div>
        <button className="sensor-config-submit" type="submit">{savedPreview ? 'Update temporary preview' : 'Preview configuration'}</button>
        {formMessage && <p className={'sensor-config-message ' + (savedPreview ? 'success' : '')} role="status">{formMessage}</p>}
      </form>

      <section className="sensor-admin-card">
        <div className="sensor-admin-card-title"><span><Radio size={18}/></span><div><h2>Reader-to-bay mapping</h2><p>Assign one reader to each marked parking bay.</p></div></div>
        <div className="sensor-reader-mapping">{readerBays.map((bayId, index) => <label className="sensor-reader-row" key={index}><span className="sensor-admin-bay-id">{'Reader ' + (index + 1)}</span><span aria-hidden="true">→</span><select aria-label={'Reader ' + (index + 1) + ' bay'} value={bayId} onChange={event => { const next = [...readerBays]; next[index] = event.target.value; setReaderBays(next); setSavedPreview(false); }}>{Array.from({ length: 5 }, (_, bayIndex) => 'A' + (bayIndex + 1)).map(option => <option key={option} value={option} disabled={readerBays.includes(option) && option !== bayId}>{option}</option>)}</select><small>{deviceName || 'Gateway'} · {bayId}</small></label>)}</div>
        <div className="sensor-admin-bay-readings"><div className="sensor-readings-heading"><b>Latest bay readings</b><span>{readings.filter(bay => bay.state === 'Available' || bay.state === 'Occupied').length}/5 reporting</span></div>{Array.from({ length: 5 }, (_, index) => {
          const bayId = 'A' + (index + 1);
          const bay = readings.find(item => item.bayId === bayId);
          const shownState = bay?.state || 'Unknown';
          const vehicle = bay?.state === 'Occupied' ? (bay.vehicleLabel ? displayRfidVehicle(bay.vehicleLabel) : 'Vehicle not identified') : null;
          return <article className="sensor-reading-row" key={bayId}><span className={'reading-state-dot ' + shownState.toLowerCase()}/><b>{bayId}</b><span className={'reading-state ' + shownState.toLowerCase()}>{shownState}</span><small>{bay?.deviceId || deviceName}</small><small>{bay ? formatTime(bay.observedAt) : 'No reading received'}</small>{bay ? <CheckCircle2 size={15}/> : <CircleAlert size={15}/>}<span className="reading-vehicle">{vehicle || (bay?.state === 'Stale' ? 'Last update is stale' : '')}</span></article>;
        })}</div>
      </section>
    </div>
    <div className="sensor-admin-bottom"><span><ShieldCheck size={15}/> Stale readings are not shown as available. Unknown tags can report a bay as occupied without identifying the vehicle.</span><span>Demo configuration resets when you leave this page. It does not provision the ESP32 or write credentials.</span></div>
  </main>;
}
