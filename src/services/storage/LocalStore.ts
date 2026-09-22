import { 
  UserProfile, 
  Vehicle, 
  UserPreferences, 
  SavedPlace, 
  Booking, 
  ParkingSession, 
  AppNotification, 
  ParkingReport 
} from '../../types';

const STORAGE_KEYS = {
  USER_PROFILE: 'pp_user_profile',
  VEHICLES: 'pp_vehicles',
  USER_PREFERENCES: 'pp_preferences',
  SAVED_PLACES: 'pp_saved_places',
  BOOKINGS: 'pp_bookings',
  ACTIVE_SESSION: 'pp_active_session',
  NOTIFICATIONS: 'pp_notifications',
  REPORTS: 'pp_reports',
  ONBOARDING_COMPLETED: 'pp_onboarding_done',
};

const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'usr-aravind-01',
  name: 'Aravind Swaminathan',
  email: 'aravind.s@parkpredict.io',
  phone: '+91 98401 23456',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  loyaltyTier: 'Gold',
  ecoPoints: 380,
  tripsCount: 24,
  hoursSaved: 12.8,
};

const DEFAULT_VEHICLES: Vehicle[] = [
  {
    id: 'veh-1',
    name: 'Primary Nexon EV',
    makeModel: 'Tata Nexon EV Max',
    plateNumber: 'TN 09 BK 4521',
    type: 'ev',
    isEv: true,
    isDefault: true,
    dimensions: '4.0m × 1.8m',
  },
  {
    id: 'veh-2',
    name: 'Family Sedan',
    makeModel: 'Honda City ZX i-VTEC',
    plateNumber: 'TN 02 AX 9812',
    type: 'sedan',
    isEv: false,
    isDefault: false,
    dimensions: '4.5m × 1.7m',
  }
];

const DEFAULT_PREFERENCES: UserPreferences = {
  maxWalkingDistanceMeters: 600,
  maxHourlyBudget: 60,
  requireCovered: true,
  requireEvCharging: true,
  requireAccessible: false,
  defaultVehicleId: 'veh-1',
  notifyReservationReminder: true,
  notifySessionEnding: true,
  notifyPredictionShifts: true,
  notifyPromotions: false,
  darkMode: false,
};

const DEFAULT_SAVED_PLACES: SavedPlace[] = [
  {
    id: 'sp-home',
    title: 'Home',
    category: 'home',
    address: '14, 2nd Avenue, Anna Nagar East, Chennai 600102',
    coordinates: { lat: 13.0878, lng: 80.2135 },
    notes: 'Primary residential parking bay',
  },
  {
    id: 'sp-work',
    title: 'Work / Tech Park',
    category: 'work',
    address: 'RMZ Millenia Business Park, MGR Main Rd, Kandanchavadi, Chennai 600096',
    coordinates: { lat: 12.9660, lng: 80.2450 },
    notes: 'Tower 2 Basement EV slots',
  },
  {
    id: 'sp-vr-mall',
    title: 'VR Mall Chennai',
    category: 'favorite',
    address: '100 Feet Rd, Thirumangalam, Anna Nagar, Chennai 600040',
    coordinates: { lat: 13.0850, lng: 80.1983 },
    notes: 'Frequent weekend cinema & dining',
  }
];

const DEFAULT_BOOKINGS: Booking[] = [
  {
    id: 'bk-sample-01',
    bookingRef: 'PP-CHN-8842',
    lotId: 'lot-anna-tower',
    lotName: 'Anna Nagar Tower Park Facility',
    lotAddress: '3rd Main Rd, Tower Park Enclave, Anna Nagar, Chennai',
    userId: 'usr-aravind-01',
    vehicle: DEFAULT_VEHICLES[0],
    date: new Date().toISOString().split('T')[0],
    arrivalTime: '18:00',
    durationHours: 2,
    expectedEndTime: '20:00',
    spotFloor: 'Level 1',
    spotNumber: 'Bay A-14',
    pricing: {
      baseRate: 30,
      durationHours: 2,
      durationCharge: 60,
      serviceTax: 5,
      discountAmount: 15,
      totalAmount: 50,
    },
    promoCode: 'PARKSMART',
    status: 'upcoming',
    qrCodeData: 'PP-AUTH-8842-ANNA-TOWER-A14',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    navigationCoordinates: { lat: 13.0880, lng: 80.2120 },
  },
  {
    id: 'bk-sample-02',
    bookingRef: 'PP-CHN-7210',
    lotId: 'lot-vr-mall',
    lotName: 'VR Mall Smart Deck',
    lotAddress: '100 Feet Rd, Thirumangalam, Anna Nagar, Chennai',
    userId: 'usr-aravind-01',
    vehicle: DEFAULT_VEHICLES[0],
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    arrivalTime: '14:30',
    durationHours: 3,
    expectedEndTime: '17:30',
    spotFloor: 'Basement 1',
    spotNumber: 'EV Bay E-04',
    pricing: {
      baseRate: 50,
      durationHours: 3,
      durationCharge: 150,
      serviceTax: 12,
      discountAmount: 0,
      totalAmount: 162,
    },
    status: 'completed',
    qrCodeData: 'PP-AUTH-7210-VRMALL-E04',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    navigationCoordinates: { lat: 13.0850, lng: 80.1983 },
  },
  {
    id: 'bk-sample-03',
    bookingRef: 'PP-CHN-6190',
    lotId: 'lot-express-avenue',
    lotName: 'Express Avenue Central Hub',
    lotAddress: '2 Club House Road, Royapettah, Chennai',
    userId: 'usr-aravind-01',
    vehicle: DEFAULT_VEHICLES[1],
    date: new Date(Date.now() - 86400000 * 6).toISOString().split('T')[0],
    arrivalTime: '11:00',
    durationHours: 2,
    expectedEndTime: '13:00',
    spotFloor: 'Level 2',
    spotNumber: 'Bay C-22',
    pricing: {
      baseRate: 60,
      durationHours: 2,
      durationCharge: 120,
      serviceTax: 10,
      discountAmount: 20,
      totalAmount: 110,
    },
    promoCode: 'WEEKEND50',
    status: 'completed',
    qrCodeData: 'PP-AUTH-6190-EA-C22',
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    navigationCoordinates: { lat: 13.0588, lng: 80.2642 },
  }
];

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Upcoming Reservation Today',
    message: 'Your guaranteed bay at Anna Nagar Tower Park starts at 6:00 PM. High arrival availability confirmed.',
    category: 'bookings',
    timestamp: '25 min ago',
    isRead: false,
    badgeType: 'info',
    actionUrl: '/bookings',
  },
  {
    id: 'notif-2',
    title: 'Off-Peak Reward Unlocked',
    message: 'You earned 50 EcoPoints for EV charging during non-rush hours. Check your rewards balance.',
    category: 'offers',
    timestamp: '2 hours ago',
    isRead: false,
    badgeType: 'success',
    actionUrl: '/rewards',
  },
  {
    id: 'notif-3',
    title: 'Weekend Prediction Shift',
    message: 'Heavy footfall anticipated at Phoenix Marketcity after 5:00 PM due to shopping festival. Reserve early.',
    category: 'predictions',
    timestamp: 'Yesterday',
    isRead: true,
    badgeType: 'warning',
    actionUrl: '/predictions',
  }
];

export class LocalStore {
  public static getItem<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  }

  public static setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage write error:', e);
    }
  }

  public static getUserProfile(): UserProfile {
    return this.getItem(STORAGE_KEYS.USER_PROFILE, DEFAULT_USER_PROFILE);
  }

  public static saveUserProfile(profile: UserProfile): void {
    this.setItem(STORAGE_KEYS.USER_PROFILE, profile);
  }

  public static getVehicles(): Vehicle[] {
    return this.getItem(STORAGE_KEYS.VEHICLES, DEFAULT_VEHICLES);
  }

  public static saveVehicles(vehicles: Vehicle[]): void {
    this.setItem(STORAGE_KEYS.VEHICLES, vehicles);
  }

  public static getPreferences(): UserPreferences {
    return this.getItem(STORAGE_KEYS.USER_PREFERENCES, DEFAULT_PREFERENCES);
  }

  public static savePreferences(prefs: UserPreferences): void {
    this.setItem(STORAGE_KEYS.USER_PREFERENCES, prefs);
  }

  public static getSavedPlaces(): SavedPlace[] {
    return this.getItem(STORAGE_KEYS.SAVED_PLACES, DEFAULT_SAVED_PLACES);
  }

  public static saveSavedPlaces(places: SavedPlace[]): void {
    this.setItem(STORAGE_KEYS.SAVED_PLACES, places);
  }

  public static getBookings(): Booking[] {
    return this.getItem(STORAGE_KEYS.BOOKINGS, DEFAULT_BOOKINGS);
  }

  public static saveBookings(bookings: Booking[]): void {
    this.setItem(STORAGE_KEYS.BOOKINGS, bookings);
  }

  public static getActiveSession(): ParkingSession | null {
    return this.getItem<ParkingSession | null>(STORAGE_KEYS.ACTIVE_SESSION, null);
  }

  public static saveActiveSession(session: ParkingSession | null): void {
    this.setItem(STORAGE_KEYS.ACTIVE_SESSION, session);
  }

  public static getNotifications(): AppNotification[] {
    return this.getItem(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
  }

  public static saveNotifications(notifs: AppNotification[]): void {
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }

  public static getReports(): ParkingReport[] {
    return this.getItem(STORAGE_KEYS.REPORTS, []);
  }

  public static saveReports(reports: ParkingReport[]): void {
    this.setItem(STORAGE_KEYS.REPORTS, reports);
  }

  public static isOnboardingCompleted(): boolean {
    return this.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED, false);
  }

  public static setOnboardingCompleted(completed: boolean): void {
    this.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed);
  }
}
