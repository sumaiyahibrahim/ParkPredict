export type VehicleType = 'sedan' | 'suv' | 'hatchback' | 'ev' | 'motorcycle';
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid';

export interface Vehicle {
  id: string;
  name: string;
  makeModel: string;
  plateNumber: string;
  type: VehicleType;
  isEv: boolean;
  isDefault: boolean;
  dimensions?: string;
}

export type Amenity = 
  | 'ev_charging'
  | 'accessible'
  | 'covered'
  | 'cctv'
  | 'security_guard'
  | 'valet'
  | 'car_wash'
  | 'restrooms'
  | 'fast_tag_entry'
  | 'elevator';

export interface OperatingHours {
  open: string;
  close: string;
  is24x7: boolean;
}

export interface ParkingLot {
  id: string;
  name: string;
  area: string;
  address: string;
  landmark: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  totalCapacity: number;
  currentOccupancy: number; // calculated available = total - occupancy
  simulatedTrendOffset: number;
  hourlyRate: number;
  dailyRate: number;
  type: 'covered_multilevel' | 'open_bay' | 'automated_garage' | 'mall_deck';
  amenities: Amenity[];
  operatingHours: OperatingHours;
  heightLimitMeters: number;
  allowedVehicles: VehicleType[];
  rating: number;
  reviewCount: number;
  images: string[];
  isOpen: boolean;
  cancellationPolicy: string;
  entryGateDescription: string;
  walkingMinutesFromCenter: number;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type RecommendationAdvice = 'optimal' | 'moderate' | 'crowded' | 'critical';

export interface HourlyForecast {
  hour: string;
  occupancyPct: number;
  availableSpots: number;
  isPeak: boolean;
}

export interface PredictionFactors {
  historicalWeight: number; // e.g. 45%
  realtimeVelocity: number; // e.g. 25%
  dayOfWeekTrend: string;   // e.g. "Typical Weekend Surge"
  localEventsFactor: string;// e.g. "High Shopping Footfall"
  weatherFactor: string;    // e.g. "Clear conditions, normal traffic"
}

export interface PredictionForecast {
  lotId: string;
  targetTime: string;
  targetDate: string;
  predictedOccupancyPct: number;
  predictedAvailableSpots: number;
  confidenceLevel: ConfidenceLevel;
  confidenceScore: number; // 0 - 100
  recommendation: RecommendationAdvice;
  adviceHeadline: string;
  adviceDetail: string;
  factors: PredictionFactors;
  hourlyCurve: HourlyForecast[];
  bestParkingWindow: string;
}

export type BookingStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

export interface BookingPricing {
  baseRate: number;
  durationHours: number;
  durationCharge: number;
  serviceTax: number;
  discountAmount: number;
  totalAmount: number;
}

export interface Booking {
  id: string;
  bookingRef: string;
  lotId: string;
  lotName: string;
  lotAddress: string;
  userId: string;
  vehicle: Vehicle;
  date: string;
  arrivalTime: string;
  durationHours: number;
  expectedEndTime: string;
  spotFloor?: string;
  spotNumber?: string;
  pricing: BookingPricing;
  promoCode?: string;
  status: BookingStatus;
  qrCodeData: string;
  createdAt: string;
  cancelledAt?: string;
  navigationCoordinates: {
    lat: number;
    lng: number;
  };
}

export interface SavedCarLocation {
  lotId: string;
  lotName: string;
  floorLevel: string;
  sectionPillar: string;
  spotNumber: string;
  notes?: string;
  savedAt: string;
  lat?: number;
  lng?: number;
}

export interface SessionExtension {
  extendedMinutes: number;
  additionalCharge: number;
  timestamp: string;
  newEndTime: string;
}

export interface ParkingSession {
  id: string;
  bookingId: string;
  lotId: string;
  lotName: string;
  lotAddress: string;
  vehiclePlate: string;
  spotFloor: string;
  spotNumber: string;
  startTime: string; // ISO string
  plannedEndTime: string; // ISO string
  actualEndTime?: string;
  status: 'active' | 'extended' | 'completed' | 'expired';
  baseCost: number;
  accruedCost: number;
  extensions: SessionExtension[];
  savedCarLocation?: SavedCarLocation;
}

export interface SavedPlace {
  id: string;
  title: string;
  category: 'home' | 'work' | 'college' | 'favorite' | 'custom';
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  notes?: string;
}

export interface UserPreferences {
  maxWalkingDistanceMeters: number; // e.g. 500m, 1000m
  maxHourlyBudget: number;           // e.g. ₹80
  requireCovered: boolean;
  requireEvCharging: boolean;
  requireAccessible: boolean;
  defaultVehicleId: string;
  notifyReservationReminder: boolean;
  notifySessionEnding: boolean;
  notifyPredictionShifts: boolean;
  notifyPromotions: boolean;
  darkMode: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  loyaltyTier: 'Silver' | 'Gold' | 'Green Champion';
  ecoPoints: number;
  tripsCount: number;
  hoursSaved: number;
}

export type NotificationCategory = 'bookings' | 'parking' | 'predictions' | 'offers' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  badgeType?: 'info' | 'success' | 'warning' | 'alert';
}

export interface ParkingReport {
  id: string;
  lotId: string;
  lotName: string;
  issueType: 'inaccurate_availability' | 'lot_closed' | 'wrong_price' | 'ev_charger_fault' | 'blocked_bay' | 'unsafe_condition';
  description: string;
  reportedAt: string;
  status: 'received' | 'investigating' | 'resolved';
}

export interface ParkingReview {
  id: string;
  lotId: string;
  userName: string;
  userBadge?: string;
  rating: number; // 1 - 5
  date: string;
  comment: string;
  ratingsBreakdown: {
    availabilityAccuracy: number;
    cleanliness: number;
    security: number;
    easeOfParking: number;
  };
  verifiedTrip: boolean;
}
