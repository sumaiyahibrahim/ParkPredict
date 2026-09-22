export interface OccupancySnapshot {
  lotId: string;
  total: number;
  occupied: number;
  available: number;
  percentage: number;
  status: 'available' | 'limited' | 'full';
  timestamp: number;
}

export type OccupancyUpdateCallback = (snapshot: OccupancySnapshot) => void;

/**
 * Clean architectural abstraction for ParkPredict occupancy ingestion.
 *
 * Current: SimulatedOccupancyProvider (clearly labelled simulated/demo availability)
 * Future: FutureIoTOccupancyProvider (MQTT / WebSocket gateway from ultrasonic/ANPR gate sensors)
 */
export interface IOccupancyProvider {
  getSnapshot(lotId: string): OccupancySnapshot;
  getAllSnapshots(): Map<string, OccupancySnapshot>;
  subscribe(callback: OccupancyUpdateCallback): () => void;
  getProviderType(): 'simulated' | 'real_iot' | 'rest_backend';
  getHonestyLabel(): string;
}

/**
 * Future IoT Sensor Provider stub.
 * Ready to receive real MQTT or WebSocket payload streams from gate barrier sensors.
 */
export class FutureIoTOccupancyProvider implements IOccupancyProvider {
  private brokerUrl: string;

  constructor(brokerUrl: string = 'wss://iot.parkpredict.io/mqtt') {
    this.brokerUrl = brokerUrl;
  }

  public getSnapshot(lotId: string): OccupancySnapshot {
    // Placeholder returning uninitialized state until connected to live MQTT broker
    return {
      lotId,
      total: 100,
      occupied: 0,
      available: 100,
      percentage: 0,
      status: 'available',
      timestamp: Date.now(),
    };
  }

  public getAllSnapshots(): Map<string, OccupancySnapshot> {
    return new Map();
  }

  public subscribe(_callback: OccupancyUpdateCallback): () => void {
    // In production: this.mqttClient.on('message', ...)
    return () => {};
  }

  public getProviderType(): 'real_iot' {
    return 'real_iot';
  }

  public getHonestyLabel(): string {
    return 'Live IoT Sensor Data';
  }
}
