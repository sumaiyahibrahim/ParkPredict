import { mergeBayReadings } from './occupancyStateManager';
import { parseSensorMessage } from './sensorDataHandler';
import type { SensorBay, SensorConnection, SensorListener, SensorMode } from './types';

export class SensorConnectionManager {
  private socket: WebSocket | null = null;
  private retryTimer = 0;
  private pingTimer = 0;
  private retries = 0;
  private stopped = true;
  private bays: SensorBay[] = [];
  private connection: SensorConnection = 'connecting';
  constructor(private readonly listener: SensorListener) {}

  start(mode: SensorMode) {
    this.stopped = false;
    const configured = import.meta.env.VITE_IOT_WS_URL;
    const url =
      configured ||
      `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.hostname}:8000/ws/live`;
    this.connection = 'connecting';
    this.emit(mode);
    try {
      this.socket = new WebSocket(url);
    } catch {
      this.connection = 'error';
      this.emit(mode);
      return;
    }
    this.socket.onopen = () => {
      this.retries = 0;
      this.connection = 'connected';
      this.emit(mode);
      this.pingTimer = window.setInterval(() => {
        if (this.socket?.readyState === WebSocket.OPEN) this.socket.send('ping');
      }, 20_000);
    };
    this.socket.onmessage = (event) => {
      const message = parseSensorMessage(event.data);
      if (!message) return;
      if (message.type === 'snapshot') this.bays = mergeBayReadings([], message.bays);
      else if (message.type === 'bay_update')
        this.bays = mergeBayReadings(this.bays, [message.bay]);
      else if (message.type === 'device_status')
        this.bays = this.bays.map((bay) =>
          bay.deviceId === message.deviceId ? { ...bay, deviceOnline: message.connected } : bay,
        );
      this.emit(mode);
    };
    this.socket.onerror = () => {
      this.connection = 'error';
      this.emit(mode);
    };
    this.socket.onclose = () => {
      window.clearInterval(this.pingTimer);
      if (this.stopped) return;
      this.connection = 'disconnected';
      this.emit(mode);
      const delay = Math.min(15_000, 500 * 2 ** Math.min(this.retries++, 5));
      this.retryTimer = window.setTimeout(() => this.start(mode), delay);
    };
  }

  stop() {
    this.stopped = true;
    window.clearTimeout(this.retryTimer);
    window.clearInterval(this.pingTimer);
    const socket = this.socket;
    this.socket = null;
    if (socket && socket.readyState < WebSocket.CLOSING) socket.close();
  }
  private emit(mode: SensorMode) {
    this.listener({ mode, connection: this.connection, bays: this.bays });
  }
}
