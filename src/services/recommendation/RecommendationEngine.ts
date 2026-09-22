import { ParkingLot, UserPreferences, PredictionForecast } from '../../types';
import { PredictionEngine } from '../prediction/PredictionEngine';
import { simulatedOccupancyProvider } from '../occupancy/SimulatedOccupancyProvider';

export interface ScoredParkingLot {
  lot: ParkingLot;
  score: number;
  isBestMatch: boolean;
  explanation: string;
  badges: string[];
  currentAvailable: number;
  currentAvailablePct: number;
  forecast: PredictionForecast;
}

export class RecommendationEngine {
  public static rankLots(
    lots: ParkingLot[],
    userPreferences: UserPreferences,
    targetDateStr: string = new Date().toISOString().split('T')[0],
    targetTimeStr: string = '17:00',
    originCoords: { lat: number; lng: number } = { lat: 13.0827, lng: 80.2000 } // Default Chennai Anna Nagar
  ): ScoredParkingLot[] {
    const scoredList: ScoredParkingLot[] = lots.map((lot) => {
      const liveSnapshot = simulatedOccupancyProvider.getSnapshot(lot.id);
      const currentAvailablePct = Math.max(0, 100 - liveSnapshot.percentage);
      const forecast = PredictionEngine.predict(lot, targetDateStr, targetTimeStr);
      const predictedAvailablePct = Math.max(0, 100 - forecast.predictedOccupancyPct);

      // Distance calculation in km
      const distanceKm = this.calculateDistanceKm(originCoords.lat, originCoords.lng, lot.coordinates.lat, lot.coordinates.lng);
      const walkingMins = Math.round(distanceKm * 12); // ~5 km/h walk pace

      // 1. Distance score (max 25 pts)
      const distanceScore = Math.max(0, 25 - (distanceKm * 5));

      // 2. Current Availability score (max 20 pts)
      const currentAvailScore = (currentAvailablePct / 100) * 20;

      // 3. Predicted Availability score (max 25 pts)
      const predictedAvailScore = (predictedAvailablePct / 100) * 25;

      // 4. Price score (max 15 pts)
      const priceRatio = Math.max(0, (120 - lot.hourlyRate) / 120);
      const priceScore = priceRatio * 15;

      // 5. User Preferences match (max 15 pts)
      let prefScore = 0;
      if (userPreferences.requireEvCharging && lot.amenities.includes('ev_charging')) prefScore += 5;
      else if (!userPreferences.requireEvCharging) prefScore += 5;

      if (userPreferences.requireCovered && (lot.type === 'covered_multilevel' || lot.type === 'mall_deck' || lot.type === 'automated_garage')) prefScore += 5;
      else if (!userPreferences.requireCovered) prefScore += 5;

      if (lot.hourlyRate <= userPreferences.maxHourlyBudget) prefScore += 5;

      const totalScore = Math.min(100, Math.round(distanceScore + currentAvailScore + predictedAvailScore + priceScore + prefScore));

      // Formulate dynamic badges
      const badges: string[] = [];
      if (lot.hourlyRate <= 35) badges.push('Best Value');
      if (distanceKm < 1.0) badges.push('Closest Walk');
      if (lot.amenities.includes('ev_charging')) badges.push('EV Rapid Hub');
      if (forecast.confidenceScore >= 90 && predictedAvailablePct > 50) badges.push('High Availability Guaranteed');

      // Formulate human-centered explanation
      const explanation = `Only ${walkingMins} min walk away, ₹${lot.hourlyRate}/hr, and predicted to have ${predictedAvailablePct}% availability when you arrive at ${targetTimeStr}.`;

      return {
        lot,
        score: totalScore,
        isBestMatch: false,
        explanation,
        badges,
        currentAvailable: liveSnapshot.available,
        currentAvailablePct,
        forecast,
      };
    });

    // Sort descending by score
    scoredList.sort((a, b) => b.score - a.score);

    // Flag best match
    if (scoredList.length > 0) {
      scoredList[0].isBestMatch = true;
    }

    return scoredList;
  }

  private static calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
