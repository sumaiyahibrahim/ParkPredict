import React from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { Footer } from './components/layout/Footer';
import { ToastContainer } from './components/common/ToastContainer';
import { CopilotDrawer } from './components/assistant/CopilotDrawer';
import { FindMyCarModal } from './components/car/FindMyCarModal';
import { BookingModal } from './components/booking/BookingModal';
import { DigitalParkingPassModal } from './components/pass/DigitalParkingPassModal';
import { ReportModal } from './components/common/ReportModal';
import { QuickOnboardingModal } from './components/onboarding/QuickOnboardingModal';
import { AuthModal } from './components/auth/AuthModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { FindParkingPage } from './pages/FindParkingPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { DashboardPage } from './pages/DashboardPage';
import { BookingsPage } from './pages/BookingsPage';
import { HistoryPage } from './pages/HistoryPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { SavedPlacesPage } from './pages/SavedPlacesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { RewardsPage } from './pages/RewardsPage';
import { SupportPage } from './pages/SupportPage';
import { PreferencesPage } from './pages/PreferencesPage';
import { AdminDashboard } from './pages/AdminDashboard';

export const App: React.FC = () => {
  const { 
    activeRoute, 
    isBookingModalOpen, 
    bookingTargetLot, 
    closeBookingModal, 
    activePassBooking, 
    closePassModal 
  } = useApp();

  const renderActiveRoute = () => {
    switch (activeRoute) {
      case 'landing':
        return <LandingPage />;
      case 'find':
        return <FindParkingPage />;
      case 'predictions':
        return <PredictionsPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'bookings':
        return <BookingsPage />;
      case 'history':
        return <HistoryPage />;
      case 'vehicles':
        return <VehiclesPage />;
      case 'saved':
        return <SavedPlacesPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'rewards':
        return <RewardsPage />;
      case 'support':
        return <SupportPage />;
      case 'preferences':
        return <PreferencesPage />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1320] text-slate-800 dark:text-slate-100 transition-colors">
      {/* Navigation Bar */}
      <Navbar />

      {/* Main Content View */}
      <main className="flex-1 pb-16 md:pb-0">
        {renderActiveRoute()}
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Floating Global Overlays & Modals */}
      <ToastContainer />
      <CopilotDrawer />
      <FindMyCarModal />
      <ReportModal />
      <QuickOnboardingModal />
      <AuthModal />

      {/* Booking Modal */}
      {isBookingModalOpen && bookingTargetLot && (
        <BookingModal
          lot={bookingTargetLot}
          onClose={closeBookingModal}
        />
      )}

      {/* Digital Parking Pass Modal */}
      {activePassBooking && (
        <DigitalParkingPassModal
          booking={activePassBooking}
          onClose={closePassModal}
        />
      )}
    </div>
  );
};

export default App;
