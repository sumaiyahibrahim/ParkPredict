export type ParkingLotType = 'mall_deck' | 'covered_multilevel' | 'open_bay' | 'automated_garage';
export type AdviceLevel = 'optimal' | 'moderate' | 'crowded' | 'critical';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type HourlyForecast = {
  time: string;
  occupancyPct: number;
  availableSpots: number;
  confidenceScore: number;
};
export type Forecast = {
  lotId: string;
  targetTime: string;
  targetDate: string;
  predictedOccupancyPct: number;
  predictedAvailableSpots: number;
  confidenceLevel: ConfidenceLevel;
  confidenceScore: number;
  recommendation: AdviceLevel;
  adviceHeadline: string;
  adviceDetail: string;
  factors: {
    historicalWeight: number;
    realtimeVelocity: number;
    dayOfWeekTrend: string;
    localEventsFactor: string;
    weatherFactor: string;
  };
  hourlyCurve: HourlyForecast[];
  bestParkingWindow: string;
};

const CURVES: Record<ParkingLotType, number[]> = {
  mall_deck: [
    18, 14, 12, 10, 10, 13, 24, 38, 52, 64, 72, 78, 82, 80, 76, 73, 76, 82, 88, 91, 85, 68, 46, 29,
  ],
  covered_multilevel: [
    20, 17, 14, 12, 12, 15, 28, 44, 58, 68, 73, 76, 79, 78, 74, 72, 76, 82, 86, 84, 72, 55, 39, 27,
  ],
  open_bay: [
    14, 10, 8, 7, 8, 14, 29, 48, 63, 71, 74, 76, 73, 67, 63, 68, 78, 85, 82, 70, 54, 39, 28, 19,
  ],
  automated_garage: [
    26, 22, 18, 16, 17, 22, 35, 50, 62, 70, 75, 78, 80, 79, 76, 75, 79, 84, 87, 83, 70, 56, 43, 33,
  ],
};
export function inferLotType(tags: Record<string, string> = {}): ParkingLotType {
  const parking = tags.parking || '';
  if (/multi-storey|underground/i.test(parking)) return 'covered_multilevel';
  if (/garage/i.test(parking)) return 'automated_garage';
  if (/multi-storey|underground|building/i.test(tags.building || '')) return 'mall_deck';
  return 'open_bay';
}
function bounded(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function advice(pct: number): AdviceLevel {
  return pct < 60 ? 'optimal' : pct <= 75 ? 'moderate' : pct <= 88 ? 'crowded' : 'critical';
}
export function predictAvailability(input: {
  lotId: string;
  lotType?: ParkingLotType;
  capacity: number;
  currentAvailable?: number | null;
  target?: Date;
  trendOffset?: number;
}): Forecast {
  const now = new Date(),
    target = input.target || new Date(now.getTime() + 60 * 60_000);
  const type = input.lotType || 'open_bay',
    hour = target.getHours(),
    weekday = target.getDay(),
    weekend = weekday === 0 || weekday === 6;
  const capacity = Math.max(1, input.capacity || 20),
    curve = CURVES[type];
  const base =
    curve[hour] + (weekend ? (type === 'mall_deck' ? 8 : -5) : 0) + (input.trendOffset || 0);
  const horizonHours = Math.max(0, (target.getTime() - now.getTime()) / 3_600_000);
  const velocityWeight = bounded(0.42 * Math.exp(-horizonHours / 4), 0.04, 0.42);
  const currentPct =
    input.currentAvailable == null
      ? null
      : (1 - bounded(input.currentAvailable, 0, capacity) / capacity) * 100;
  const occupancy = bounded(
    currentPct === null ? base : base * (1 - velocityWeight) + currentPct * velocityWeight,
    0,
    100,
  );
  const confidenceScore = Math.round(
    bounded(92 - horizonHours * 4.5 - (currentPct === null ? 14 : 0) - (weekend ? 3 : 0), 24, 95),
  );
  const recommendation = advice(occupancy),
    predictedAvailableSpots = Math.round(capacity * (1 - occupancy / 100));
  const hourlyCurve = Array.from({ length: 24 }, (_, i) => {
    const t = new Date(target);
    t.setHours(hour + i, 0, 0, 0);
    const pct = bounded(
      curve[t.getHours()] +
        (t.getDay() === 0 || t.getDay() === 6 ? (type === 'mall_deck' ? 8 : -5) : 0) +
        (input.trendOffset || 0),
      0,
      100,
    );
    return {
      time: t.toISOString(),
      occupancyPct: Math.round(pct),
      availableSpots: Math.round(capacity * (1 - pct / 100)),
      confidenceScore: Math.round(bounded(confidenceScore - i * 2.3, 20, 95)),
    };
  });
  const window = hourlyCurve
    .filter((x) => x.occupancyPct < 60)
    .sort((a, b) => a.occupancyPct - b.occupancyPct)[0];
  const adviceHeadline = {
    optimal: 'Good time to park',
    moderate: 'Some spaces may remain',
    crowded: 'Parking may be busy',
    critical: 'Very limited availability',
  }[recommendation];
  const lotLabel = type.replace(/_/g, ' ');
  return {
    lotId: input.lotId,
    targetTime: target.toISOString(),
    targetDate: target.toISOString().slice(0, 10),
    predictedOccupancyPct: Math.round(occupancy),
    predictedAvailableSpots,
    confidenceLevel: confidenceScore >= 75 ? 'high' : confidenceScore >= 50 ? 'medium' : 'low',
    confidenceScore,
    recommendation,
    adviceHeadline,
    adviceDetail:
      currentPct === null
        ? `Heuristic ${lotLabel} time-of-day pattern only; no reliable current occupancy reading is available.`
        : `Uses the latest available count for ${lotLabel} as its current input, blended with a hand-written time-of-day curve. This is not a model trained on historical sensor records.`,
    factors: {
      historicalWeight: Number((1 - velocityWeight).toFixed(2)),
      realtimeVelocity: Number(velocityWeight.toFixed(2)),
      dayOfWeekTrend: weekend ? 'Weekend adjustment' : 'Weekday curve',
      localEventsFactor: 'Not connected',
      weatherFactor: 'Not connected',
    },
    hourlyCurve,
    bestParkingWindow: window
      ? new Date(window.time).toLocaleTimeString([], { hour: 'numeric' })
      : 'No low-occupancy window forecast',
  };
}
