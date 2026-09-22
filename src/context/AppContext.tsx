import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  UserProfile, 
  Vehicle, 
  UserPreferences, 
  SavedPlace, 
  Booking, 
  ParkingSession, 
  AppNotification, 
  ParkingReport, 
  ParkingLot,
  SavedCarLocation 
} from '../types';
import { LocalStore } from '../services/storage/LocalStore';
import { SEED_PARKING_LOTS } from '../data/seedParkingLots';
import { SEED_PONDICHERRY_LOTS } from '../data/seedPondicherryLots';
import { simulatedOccupancyProvider } from '../services/occupancy/SimulatedOccupancyProvider';
import { useAuth } from './AuthContext';

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  user: UserProfile;
  vehicles: Vehicle[];
  preferences: UserPreferences;
  savedPlaces: SavedPlace[];
  bookings: Booking[];
  activeSession: ParkingSession | null;
  notifications: AppNotification[];
  reports: ParkingReport[];
  parkingLots: ParkingLot[];
  selectedLot: ParkingLot | null;
  activeRoute: string;
  isCopilotOpen: boolean;
  isFindMyCarOpen: boolean;
  isBookingModalOpen: boolean;
  bookingTargetLot: ParkingLot | null;
  activePassBooking: Booking | null;
  isReportModalOpen: boolean;
  reportTargetLot: ParkingLot | null;
  toasts: ToastState[];
  unreadNotificationCount: number;

  // Actions
  navigate: (route: string) => void;
  setSelectedLot: (lot: ParkingLot | null) => void;
  setCopilotOpen: (open: boolean) => void;
  setFindMyCarOpen: (open: boolean) => void;
  openBookingModal: (lot: ParkingLot) => void;
  closeBookingModal: () => void;
  openPassModal: (booking: Booking) => void;
  closePassModal: () => void;
  openReportModal: (lot?: ParkingLot) => void;
  closeReportModal: () => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;

  // Business logic mutations
  createBooking: (newBooking: Booking) => void;
  cancelBooking: (bookingId: string) => void;
  startSessionFromBooking: (booking: Booking) => void;
  extendActiveSession: (minutes: number, charge: number) => boolean;
  endActiveSession: () => void;
  saveCarSpotLocation: (location: SavedCarLocation) => void;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (vehicle: Vehicle) => void;
  deleteVehicle: (id: string) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  savePlace: (place: Omit<SavedPlace, 'id'>) => void;
  deleteSavedPlace: (id: string) => void;
  submitParkingReport: (report: Omit<ParkingReport, 'id' | 'reportedAt' | 'status'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  rebookParking: (pastBooking: Booking) => void;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const [userState, setUserState] = useState<UserProfile>(LocalStore.getUserProfile());
  const user = auth.user || userState;
  const [vehicles, setVehicles] = useState<Vehicle[]>(LocalStore.getVehicles());
  const [preferences, setPreferences] = useState<UserPreferences>(LocalStore.getPreferences());
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>(LocalStore.getSavedPlaces());
  const [bookings, setBookings] = useState<Booking[]>(LocalStore.getBookings());
  const [activeSession, setActiveSession] = useState<ParkingSession | null>(LocalStore.getActiveSession());
  const [notifications, setNotifications] = useState<AppNotification[]>(LocalStore.getNotifications());
  const [reports, setReports] = useState<ParkingReport[]>(LocalStore.getReports());
  
  // Navigation & Modals
  const [activeRoute, setActiveRoute] = useState<string>('landing');
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
  const [isCopilotOpen, setCopilotOpen] = useState<boolean>(false);
  const [isFindMyCarOpen, setFindMyCarOpen] = useState<boolean>(false);
  const [isBookingModalOpen, setBookingModalOpen] = useState<boolean>(false);
  const [bookingTargetLot, setBookingTargetLot] = useState<ParkingLot | null>(null);
  const [activePassBooking, setActivePassBooking] = useState<Booking | null>(null);
  const [isReportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [reportTargetLot, setReportTargetLot] = useState<ParkingLot | null>(null);
  const [toasts, setToasts] = useState<ToastState[]>([]);

  // Hydrate parking lots with simulated occupancy live provider
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>(() => {
    return [...SEED_PARKING_LOTS, ...SEED_PONDICHERRY_LOTS].map((lot) => {
      const snap = simulatedOccupancyProvider.getSnapshot(lot.id);
      return {
        ...lot,
        currentOccupancy: snap.occupied,
      };
    });
  });

  // Apply dark mode class to document element
  useEffect(() => {
    if (preferences.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences.darkMode]);

  // Subscribe to live simulated occupancy updates
  useEffect(() => {
    const unsubscribe = simulatedOccupancyProvider.subscribe((snap) => {
      setParkingLots((prevLots) =>
        prevLots.map((lot) =>
          lot.id === snap.lotId
            ? { ...lot, currentOccupancy: snap.occupied }
            : lot
        )
      );

      // If active session is in this lot or selected lot is this lot, notify softly if occupancy is high
      if (selectedLot && selectedLot.id === snap.lotId && snap.percentage >= 95) {
        showToast(`Occupancy update: ${selectedLot.name} is now nearly full (${snap.available} bays left).`, 'warning');
      }
    });

    return () => unsubscribe();
  }, [selectedLot]);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const navigate = (route: string) => {
    setActiveRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openBookingModal = (lot: ParkingLot) => {
    if (auth.isGuest || !auth.user) {
      auth.openAuthModal('signup');
      showToast('Please sign in or create an account to reserve a parking bay.', 'info');
      return;
    }
    setBookingTargetLot(lot);
    setBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setBookingModalOpen(false);
    setBookingTargetLot(null);
  };

  const openPassModal = (booking: Booking) => {
    setActivePassBooking(booking);
  };

  const closePassModal = () => {
    setActivePassBooking(null);
  };

  const openReportModal = (lot?: ParkingLot) => {
    setReportTargetLot(lot || null);
    setReportModalOpen(true);
  };

  const closeReportModal = () => {
    setReportModalOpen(false);
    setReportTargetLot(null);
  };

  const createBooking = (newBooking: Booking) => {
    const updated = [newBooking, ...bookings];
    setBookings(updated);
    LocalStore.saveBookings(updated);

    // Add notification
    const notif: AppNotification = {
      id: 'notif-' + Date.now(),
      title: 'Booking Confirmed!',
      message: `Guaranteed spot reserved at ${newBooking.lotName}. Pass code: ${newBooking.bookingRef}.`,
      category: 'bookings',
      timestamp: 'Just now',
      isRead: false,
      badgeType: 'success',
      actionUrl: '/bookings',
    };
    const updatedNotifs = [notif, ...notifications];
    setNotifications(updatedNotifs);
    LocalStore.saveNotifications(updatedNotifs);

    showToast(`Reservation confirmed for ${newBooking.lotName}!`, 'success');
    closeBookingModal();
    openPassModal(newBooking);
  };

  const cancelBooking = (bookingId: string) => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return;

    const updated = bookings.map((b) =>
      b.id === bookingId ? { ...b, status: 'cancelled' as const, cancelledAt: new Date().toISOString() } : b
    );
    setBookings(updated);
    LocalStore.saveBookings(updated);

    showToast(`Booking ${target.bookingRef} cancelled. Instant refund initiated.`, 'info');
  };

  const startSessionFromBooking = (booking: Booking) => {
    const now = new Date();
    const plannedEnd = new Date(now.getTime() + booking.durationHours * 60 * 60 * 1000);

    const session: ParkingSession = {
      id: 'ses-' + Date.now(),
      bookingId: booking.id,
      lotId: booking.lotId,
      lotName: booking.lotName,
      lotAddress: booking.lotAddress,
      vehiclePlate: booking.vehicle.plateNumber,
      spotFloor: booking.spotFloor || 'Level 1',
      spotNumber: booking.spotNumber || 'Bay 12',
      startTime: now.toISOString(),
      plannedEndTime: plannedEnd.toISOString(),
      status: 'active',
      baseCost: booking.pricing.totalAmount,
      accruedCost: booking.pricing.totalAmount,
      extensions: [],
    };

    setActiveSession(session);
    LocalStore.saveActiveSession(session);

    // Update booking status
    const updatedBookings = bookings.map((b) =>
      b.id === booking.id ? { ...b, status: 'active' as const } : b
    );
    setBookings(updatedBookings);
    LocalStore.saveBookings(updatedBookings);

    showToast(`Parking session started at ${session.lotName}. Timer is active!`, 'success');
    navigate('dashboard');
  };

  const extendActiveSession = (minutes: number, charge: number): boolean => {
    if (!activeSession) return false;

    const currentEnd = new Date(activeSession.plannedEndTime);
    const newEnd = new Date(currentEnd.getTime() + minutes * 60000);

    const updatedSession: ParkingSession = {
      ...activeSession,
      plannedEndTime: newEnd.toISOString(),
      accruedCost: activeSession.accruedCost + charge,
      status: 'extended',
      extensions: [
        ...activeSession.extensions,
        {
          extendedMinutes: minutes,
          additionalCharge: charge,
          timestamp: new Date().toISOString(),
          newEndTime: newEnd.toISOString(),
        },
      ],
    };

    setActiveSession(updatedSession);
    LocalStore.saveActiveSession(updatedSession);
    showToast(`Session extended by +${minutes} mins! New end time: ${newEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 'success');
    return true;
  };

  const endActiveSession = () => {
    if (!activeSession) return;

    const now = new Date();
    const completedSession: ParkingSession = {
      ...activeSession,
      actualEndTime: now.toISOString(),
      status: 'completed',
    };

    // Update linked booking
    const updatedBookings = bookings.map((b) =>
      b.id === activeSession.bookingId ? { ...b, status: 'completed' as const } : b
    );
    setBookings(updatedBookings);
    LocalStore.saveBookings(updatedBookings);

    // Award EcoPoints for completed trip
    const updatedUser = {
      ...user,
      ecoPoints: user.ecoPoints + 25,
      tripsCount: user.tripsCount + 1,
      hoursSaved: parseFloat((user.hoursSaved + 0.4).toFixed(1)),
    };
    setUserState(updatedUser);
    LocalStore.saveUserProfile(updatedUser);

    setActiveSession(null);
    LocalStore.saveActiveSession(null);

    showToast(`Parking session completed. ₹${completedSession.accruedCost} paid via auto-FastTag. +25 EcoPoints earned!`, 'success');
    navigate('history');
  };

  const saveCarSpotLocation = (location: SavedCarLocation) => {
    if (activeSession) {
      const updated = { ...activeSession, savedCarLocation: location };
      setActiveSession(updated);
      LocalStore.saveActiveSession(updated);
    }
    showToast(`Location saved: Floor ${location.floorLevel}, Section ${location.sectionPillar}, Spot ${location.spotNumber}.`, 'success');
    setFindMyCarOpen(false);
  };

  const addVehicle = (veh: Omit<Vehicle, 'id'>) => {
    const newVeh: Vehicle = {
      ...veh,
      id: 'veh-' + Date.now(),
    };
    const updated = [...vehicles, newVeh];
    setVehicles(updated);
    LocalStore.saveVehicles(updated);
    showToast(`Added vehicle ${newVeh.name} (${newVeh.plateNumber}).`, 'success');
  };

  const updateVehicle = (veh: Vehicle) => {
    const updated = vehicles.map((v) => (v.id === veh.id ? veh : v));
    setVehicles(updated);
    LocalStore.saveVehicles(updated);
    showToast(`Updated vehicle details.`, 'success');
  };

  const deleteVehicle = (id: string) => {
    if (vehicles.length <= 1) {
      showToast('You must keep at least one registered vehicle.', 'warning');
      return;
    }
    const updated = vehicles.filter((v) => v.id !== id);
    setVehicles(updated);
    LocalStore.saveVehicles(updated);
    showToast(`Vehicle removed.`, 'info');
  };

  const updatePreferences = (prefs: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...prefs };
    setPreferences(updated);
    LocalStore.savePreferences(updated);
    showToast('Preferences updated.', 'success');
  };

  const savePlace = (place: Omit<SavedPlace, 'id'>) => {
    if (auth.isGuest || !auth.user) {
      auth.openAuthModal('signup');
      showToast('Please sign in to bookmark saved places.', 'info');
      return;
    }
    const newPlace: SavedPlace = {
      ...place,
      id: 'sp-' + Date.now(),
    };
    const updated = [...savedPlaces, newPlace];
    setSavedPlaces(updated);
    LocalStore.saveSavedPlaces(updated);
    showToast(`Saved place "${newPlace.title}" added.`, 'success');
  };

  const deleteSavedPlace = (id: string) => {
    const updated = savedPlaces.filter((p) => p.id !== id);
    setSavedPlaces(updated);
    LocalStore.saveSavedPlaces(updated);
    showToast('Saved place removed.', 'info');
  };

  const submitParkingReport = (reportData: Omit<ParkingReport, 'id' | 'reportedAt' | 'status'>) => {
    const newReport: ParkingReport = {
      ...reportData,
      id: 'rep-' + Date.now(),
      reportedAt: new Date().toISOString(),
      status: 'received',
    };
    const updated = [newReport, ...reports];
    setReports(updated);
    LocalStore.saveReports(updated);
    closeReportModal();
    showToast('Thank you! Your parking report has been submitted to field staff.', 'success');
  };

  const markNotificationAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    setNotifications(updated);
    LocalStore.saveNotifications(updated);
  };

  const markAllNotificationsAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    LocalStore.saveNotifications(updated);
    showToast('All notifications marked as read.', 'info');
  };

  const rebookParking = (pastBooking: Booking) => {
    const lot = parkingLots.find((l) => l.id === pastBooking.lotId);
    if (lot) {
      openBookingModal(lot);
    } else {
      navigate('find');
    }
  };

  const toggleDarkMode = () => {
    const newMode = !preferences.darkMode;
    updatePreferences({ darkMode: newMode });
  };

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppContext.Provider
      value={{
        user,
        vehicles,
        preferences,
        savedPlaces,
        bookings,
        activeSession,
        notifications,
        reports,
        parkingLots,
        selectedLot,
        activeRoute,
        isCopilotOpen,
        isFindMyCarOpen,
        isBookingModalOpen,
        bookingTargetLot,
        activePassBooking,
        isReportModalOpen,
        reportTargetLot,
        toasts,
        unreadNotificationCount,
        navigate,
        setSelectedLot,
        setCopilotOpen,
        setFindMyCarOpen,
        openBookingModal,
        closeBookingModal,
        openPassModal,
        closePassModal,
        openReportModal,
        closeReportModal,
        showToast,
        removeToast,
        createBooking,
        cancelBooking,
        startSessionFromBooking,
        extendActiveSession,
        endActiveSession,
        saveCarSpotLocation,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        updatePreferences,
        savePlace,
        deleteSavedPlace,
        submitParkingReport,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        rebookParking,
        toggleDarkMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
