import { IOccupancyProvider, OccupancySnapshot, OccupancyUpdateCallback } from './OccupancyProvider';
import { SEED_PARKING_LOTS } from '../../data/seedParkingLots';

/**
 * High-fidelity Diurnal Simulation for Parking Occupancy.
 * Generates realistic occupancy shifts based on time of day, day of week,
 * facility type (Mall vs Office vs Transit vs Park), and periodic flux.
 */
export class SimulatedOccupancyProvider implements IOccupancyProvider {
  private snapshots: Map<string, OccupancySnapshot> = new Map();
  private subscribers: Set<OccupancyUpdateCallback> = new Set();
  private intervalId: number | null = null;

  constructor() {
    this.initializeSnapshots();
    this.startLiveSimulation();
  }

  private initializeSnapshots(): void {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    SEED_PARKING_LOTS.forEach((lot) => {
      const baseRatio = this.calculateDiurnalBase(hour, lot.type, isWeekend, lot.simulatedTrendOffset);
      const occupied = Math.min(lot.totalCapacity, Math.max(10, Math.round(lot.totalCapacity * baseRatio)));
      const available = lot.totalCapacity - occupied;
      const percentage = Math.round((occupied / lot.totalCapacity) * 100);

      this.snapshots.set(lot.id, {
        lotId: lot.id,
        total: lot.totalCapacity,
        occupied,
        available,
        percentage,
        status: percentage >= 90 ? 'full' : percentage >= 70 ? 'limited' : 'available',
        timestamp: Date.now(),
      });
    });
  }

  private calculateDiurnalBase(hour: number, type: string, isWeekend: boolean, offset: number): number {
    let curve = 0.2; // default night base

    if (hour >= 6 && hour < 9) {
      // Morning rush
      curve = type === 'covered_multilevel' ? 0.45 : 0.3;
    } else if (hour >= 9 && hour < 12) {
      // Morning active
      curve = type === 'covered_multilevel' ? 0.75 : 0.55;
    } else if (hour >= 12 && hour < 15) {
      // Lunch peak
      curve = type === 'mall_deck' ? 0.82 : 0.78;
    } else if (hour >= 15 && hour < 17) {
      // Afternoon slight lull
      curve = 0.65;
    } else if (hour >= 17 && hour < 21.5) {
      // Evening rush
      curve = (type === 'mall_deck' || isWeekend) ? 0.90 : 0.84;
    } else if (hour >= 21.5 && hour < 23.5) {
      // Night wind-down
      curve = 0.45;
    } else {
      // Late night
      curve = 0.15;
    }

    // Apply specific facility baseline offset
    const adjusted = Math.min(0.96, Math.max(0.08, curve + offset));
    return adjusted;
  }

  private startLiveSimulation(): void {
    if (typeof window === 'undefined') return;

    // Simulate subtle organic ingress/egress updates every 12 seconds
    this.intervalId = window.setInterval(() => {
      const lotIds = Array.from(this.snapshots.keys());
      if (lotIds.length === 0) return;

      // Pick 1-2 lots randomly to simulate cars entering/leaving
      const countToUpdate = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < countToUpdate; i++) {
        const randomLotId = lotIds[Math.floor(Math.random() * lotIds.length)];
        const current = this.snapshots.get(randomLotId);
        if (!current) continue;

        // Delta: either +1, -1, or +2, -2
        const delta = (Math.random() > 0.48 ? 1 : -1) * (Math.random() > 0.7 ? 2 : 1);
        const newOccupied = Math.min(current.total - 3, Math.max(8, current.occupied + delta));
        const newAvailable = current.total - newOccupied;
        const newPercentage = Math.round((newOccupied / current.total) * 100);

        const updated: OccupancySnapshot = {
          ...current,
          occupied: newOccupied,
          available: newAvailable,
          percentage: newPercentage,
          status: newPercentage >= 90 ? 'full' : newPercentage >= 70 ? 'limited' : 'available',
          timestamp: Date.now(),
        };

        this.snapshots.set(randomLotId, updated);
        this.notifySubscribers(updated);
      }
    }, 12000);
  }

  private notifySubscribers(snapshot: OccupancySnapshot): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(snapshot);
      } catch (err) {
        console.error('Error in occupancy subscriber:', err);
      }
    });
  }

  public getSnapshot(lotId: string): OccupancySnapshot {
    const existing = this.snapshots.get(lotId);
    if (existing) return existing;

    const seed = SEED_PARKING_LOTS.find((l) => l.id === lotId);
    const total = seed ? seed.totalCapacity : 100;
    const occupied = seed ? seed.currentOccupancy : 50;
    const pct = Math.round((occupied / total) * 100);

    const fallback: OccupancySnapshot = {
      lotId,
      total,
      occupied,
      available: total - occupied,
      percentage: pct,
      status: pct >= 90 ? 'full' : pct >= 70 ? 'limited' : 'available',
      timestamp: Date.now(),
    };
    this.snapshots.set(lotId, fallback);
    return fallback;
  }

  public getAllSnapshots(): Map<string, OccupancySnapshot> {
    return new Map(this.snapshots);
  }

  public subscribe(callback: OccupancyUpdateCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  public getProviderType(): 'simulated' {
    return 'simulated';
  }

  public getHonestyLabel(): string {
    return 'Simulated availability (Demo)';
  }

  public cleanup(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.subscribers.clear();
  }
}

// Global singleton instance for simulated provider
export const simulatedOccupancyProvider = new SimulatedOccupancyProvider();
