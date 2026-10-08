import { predictAvailability, inferLotType } from './predictionEngine';
export type RecommendationCandidate = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distanceKm: number;
  capacity?: number;
  available?: number | null;
  hourlyRate?: number | null;
  amenities?: string[];
  tags?: Record<string, string>;
};
export type RankedRecommendation = RecommendationCandidate & {
  score: number;
  badges: string[];
  reasons: string[];
  forecast: ReturnType<typeof predictAvailability>;
  factors: {
    distance: number;
    availability: number;
    predictedAvailability: number;
    price: number;
    preferences: number;
  };
};
export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = Math.PI / 180,
    dLat = (b.lat - a.lat) * r,
    dLon = (b.lon - a.lon) * r,
    x =
      Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(x));
}
export function rankParkingLots(
  lots: RecommendationCandidate[],
  origin: { lat: number; lon: number },
  options: { needsEv?: boolean; needsAccessible?: boolean; target?: Date } = {},
) {
  const knownRates = lots
    .map((x) => x.hourlyRate)
    .filter((x): x is number => x != null && Number.isFinite(x));
  return lots
    .map((lot) => {
      const distanceKm = haversineKm(origin, { lat: lot.lat, lon: lot.lon });
      const forecast = predictAvailability({
        lotId: lot.id,
        lotType: inferLotType(lot.tags),
        capacity: lot.capacity || 20,
        currentAvailable: lot.available ?? null,
        target: options.target,
      });
      const distance = Math.round(25 * Math.exp(-distanceKm / 3));
      const availability =
        lot.available == null
          ? 0
          : Math.round(20 * Math.min(1, lot.available / Math.max(1, lot.capacity || 20)));
      const predictedAvailability = Math.round(25 * (1 - forecast.predictedOccupancyPct / 100));
      const price =
        lot.hourlyRate == null || !knownRates.length
          ? 0
          : Math.round(15 * (1 - lot.hourlyRate / Math.max(...knownRates, lot.hourlyRate)));
      const a = lot.amenities || [],
        preferences =
          (options.needsEv ? (a.some((x) => /charging|electric/i.test(x)) ? 8 : 0) : 8) +
          (options.needsAccessible ? (a.some((x) => /accessib|wheelchair/i.test(x)) ? 7 : 0) : 7);
      const score = distance + availability + predictedAvailability + price + preferences;
      const badges: string[] = [];
      if (lot.hourlyRate != null && knownRates.length && lot.hourlyRate <= 35)
        badges.push('Best Value');
      if (distanceKm < 1) badges.push('Closest Walk');
      if (a.some((x) => /charging|electric/i.test(x))) badges.push('EV Rapid Hub');
      if (score >= 90) badges.push('High Availability');
      const reasons = [
        `${distanceKm < 1 ? 'A short walk' : `${distanceKm.toFixed(1)} km away`}`,
        lot.available == null
          ? 'Live spaces not reported'
          : `${lot.available} spaces listed available`,
        forecast.adviceHeadline,
        lot.hourlyRate == null ? 'Price not listed' : `₹${lot.hourlyRate}/hr`,
      ];
      return {
        ...lot,
        distanceKm,
        score,
        badges,
        reasons,
        forecast,
        factors: { distance, availability, predictedAvailability, price, preferences },
      };
    })
    .sort((a, b) => b.score - a.score);
}
