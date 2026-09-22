import { ParkingLot, PredictionForecast, HourlyForecast, ConfidenceLevel, RecommendationAdvice } from '../../types';
import { simulatedOccupancyProvider } from '../occupancy/SimulatedOccupancyProvider';

/**
 * AI-powered Availability Prediction Engine.
 * Combines historical time-series diurnal profiles, current real-time velocity,
 * facility typology weights, and weekend footfall models.
 */
export class PredictionEngine {
  /**
   * Generates a comprehensive forecast for a specific parking lot at a given target date and time.
   */
  public static predict(lot: ParkingLot, targetDateStr: string, targetTimeStr: string): PredictionForecast {
    const [hoursStr, minutesStr] = targetTimeStr.split(':');
    const targetHour = parseInt(hoursStr, 10) + (parseInt(minutesStr || '0', 10) / 60);
    
    // Parse target date to get day of week
    const targetDate = new Date(targetDateStr);
    const dayOfWeek = isNaN(targetDate.getTime()) ? new Date().getDay() : targetDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Current live snapshot to compute live velocity
    const liveSnapshot = simulatedOccupancyProvider.getSnapshot(lot.id);
    const currentOccupancyPct = liveSnapshot.percentage;

    // Time difference between now and target
    const now = new Date();
    const nowHour = now.getHours() + now.getMinutes() / 60;
    const isToday = targetDate.toDateString() === now.toDateString();
    const hoursInFuture = isToday ? Math.max(0, targetHour - nowHour) : 24;

    // Base occupancy calculation from typology curves
    const baseOccupancyRatio = this.calculateDiurnalCurve(lot.type, targetHour, isWeekend, lot.simulatedTrendOffset);
    
    // Factor in real-time velocity if target is within 4 hours
    let blendedOccupancyRatio = baseOccupancyRatio;
    let realtimeWeight = 0.15;
    if (isToday && hoursInFuture <= 4) {
      realtimeWeight = Math.max(0.1, 0.45 - (hoursInFuture * 0.08));
      const liveRatio = currentOccupancyPct / 100;
      blendedOccupancyRatio = (baseOccupancyRatio * (1 - realtimeWeight)) + (liveRatio * realtimeWeight);
    }

    const predictedOccupancyPct = Math.min(96, Math.max(12, Math.round(blendedOccupancyRatio * 100)));
    const predictedAvailableSpots = Math.max(2, Math.round(lot.totalCapacity * (1 - (predictedOccupancyPct / 100))));

    // Calculate Confidence Score
    let confidenceScore = 95;
    if (!isToday) confidenceScore -= 8;
    if (hoursInFuture > 12) confidenceScore -= 5;
    if (isWeekend) confidenceScore -= 3;
    confidenceScore = Math.max(72, confidenceScore);

    const confidenceLevel: ConfidenceLevel = confidenceScore >= 88 ? 'high' : confidenceScore >= 78 ? 'medium' : 'low';

    // Formulate Recommendation Status & Advice
    let recommendation: RecommendationAdvice = 'optimal';
    let adviceHeadline = 'Excellent availability predicted';
    let adviceDetail = `Predicted ${predictedAvailableSpots} spots open (~${100 - predictedOccupancyPct}% free). Fast, stress-free arrival.`;

    if (predictedOccupancyPct >= 88) {
      recommendation = 'critical';
      adviceHeadline = 'Extremely high demand expected';
      adviceDetail = `Only ~${predictedAvailableSpots} spots expected. We strongly recommend reserving in advance or arriving 45 mins earlier.`;
    } else if (predictedOccupancyPct >= 75) {
      recommendation = 'crowded';
      adviceHeadline = 'Moderately busy peak period';
      adviceDetail = `Anticipated ${predictedAvailableSpots} open bays. FastTag recommended for swift barrier transit.`;
    } else if (predictedOccupancyPct >= 60) {
      recommendation = 'moderate';
      adviceHeadline = 'Steady parking availability';
      adviceDetail = `Plenty of spaces available across primary decks. Spot reservation optional but guaranteed.`;
    }

    // Generate 24-hour curve
    const hourlyCurve: HourlyForecast[] = this.generate24HourCurve(lot, isWeekend);

    // Identify best parking window
    const bestParkingWindow = isWeekend 
      ? 'Before 11:30 AM or between 2:30 PM – 4:00 PM'
      : 'Before 10:00 AM or between 3:00 PM – 5:00 PM';

    return {
      lotId: lot.id,
      targetTime: targetTimeStr,
      targetDate: targetDateStr,
      predictedOccupancyPct,
      predictedAvailableSpots,
      confidenceLevel,
      confidenceScore,
      recommendation,
      adviceHeadline,
      adviceDetail,
      factors: {
        historicalWeight: Math.round((1 - realtimeWeight) * 100),
        realtimeVelocity: Math.round(realtimeWeight * 100),
        dayOfWeekTrend: isWeekend ? 'Weekend Leisure & Retail Surge' : 'Weekday Commercial & Commute Curve',
        localEventsFactor: lot.type === 'mall_deck' ? 'Promotional & Cinema Schedule Active' : 'Normal Regional Traffic',
        weatherFactor: 'Favorable Weather Conditions',
      },
      hourlyCurve,
      bestParkingWindow,
    };
  }

  private static calculateDiurnalCurve(type: string, hour: number, isWeekend: boolean, offset: number): number {
    let ratio = 0.2;

    switch (type) {
      case 'mall_deck':
        if (hour < 10) ratio = 0.15;
        else if (hour < 13) ratio = isWeekend ? 0.65 : 0.45;
        else if (hour < 16) ratio = isWeekend ? 0.82 : 0.62;
        else if (hour < 20) ratio = isWeekend ? 0.94 : 0.86;
        else if (hour < 22) ratio = 0.72;
        else ratio = 0.25;
        break;

      case 'covered_multilevel':
      case 'automated_garage':
        if (hour < 7) ratio = 0.18;
        else if (hour < 10) ratio = isWeekend ? 0.35 : 0.76;
        else if (hour < 14) ratio = isWeekend ? 0.60 : 0.88;
        else if (hour < 17) ratio = isWeekend ? 0.70 : 0.78;
        else if (hour < 20) ratio = isWeekend ? 0.85 : 0.65;
        else ratio = 0.30;
        break;

      case 'open_bay':
        if (hour < 8) ratio = 0.10;
        else if (hour < 16) ratio = isWeekend ? 0.55 : 0.35;
        else if (hour < 21) ratio = isWeekend ? 0.92 : 0.75;
        else ratio = 0.20;
        break;

      default:
        ratio = 0.50;
        break;
    }

    return Math.min(0.96, Math.max(0.10, ratio + offset));
  }

  private static generate24HourCurve(lot: ParkingLot, isWeekend: boolean): HourlyForecast[] {
    const curve: HourlyForecast[] = [];
    const hours = [
      '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM',
      '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM',
      '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM'
    ];

    hours.forEach((hLabel, idx) => {
      const h24 = idx + 6;
      const ratio = this.calculateDiurnalCurve(lot.type, h24, isWeekend, lot.simulatedTrendOffset);
      const pct = Math.round(ratio * 100);
      const available = Math.max(1, Math.round(lot.totalCapacity * (1 - ratio)));

      curve.push({
        hour: hLabel,
        occupancyPct: pct,
        availableSpots: available,
        isPeak: pct >= 80,
      });
    });

    return curve;
  }
}
