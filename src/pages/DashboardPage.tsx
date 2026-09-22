import React from 'react';
import { useApp } from '../context/AppContext';
import { ActiveParkingWidget } from '../components/session/ActiveParkingWidget';
import { ParkingCard } from '../components/parking/ParkingCard';
import { 
  Compass, 
  TrendingUp, 
  CalendarCheck2, 
  History, 
  Car, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  QrCode, 
  Navigation, 
  Clock, 
  ShieldCheck, 
  Zap,
  ChevronRight
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const DashboardPage: React.FC = () => {
  const { 
    user, 
    activeSession, 
    bookings, 
    parkingLots, 
    navigate, 
    openPassModal, 
    setSelectedLot, 
    setFindMyCarOpen, 
    setCopilotOpen,
    openBookingModal 
  } = useApp();

  const upcomingBooking = bookings.find((b) => b.status === 'upcoming');
  const recommendedLot = parkingLots[1]; // Anna Nagar Tower Park (budget/fast)
  const availableBays = recommendedLot.totalCapacity - recommendedLot.currentOccupancy;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Greeting & Situation Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-brandTeal uppercase tracking-wider">
              Chennai Central Corridor • Anna Nagar Node
            </span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-slate-900 dark:text-white">
            {getGreeting()}, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            {activeSession
              ? "You're currently parked. We're monitoring your meter and bay availability."
              : upcomingBooking
              ? `You have a guaranteed reservation starting at ${upcomingBooking.arrivalTime}.`
              : "All Chennai parking decks are currently operating with normal turnover."}
          </p>
        </div>

        {/* User Stats / EcoPoints Quick Pill */}
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-[#111C2D] border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-subtle flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
              ⚡
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">EcoPoints</span>
              <span className="text-base font-heading font-extrabold text-slate-900 dark:text-white">
                {user.ecoPoints} <span className="text-xs font-normal text-brandTeal">({user.loyaltyTier})</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ADAPTIVE STATE 1: If User is Currently Parked, Prioritize ActiveParkingWidget! */}
      {activeSession && (
        <section className="space-y-4">
          <ActiveParkingWidget />
        </section>
      )}

      {/* Upcoming Reservation Card (If Exists & No Active Session) */}
      {!activeSession && upcomingBooking && (
        <section className="bg-gradient-to-r from-teal-500/10 via-blue-500/10 to-teal-500/5 rounded-3xl border border-teal-500/30 p-6 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brandTeal text-white flex items-center justify-center flex-shrink-0 shadow-glow-teal">
              <CalendarCheck2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-brandTeal uppercase tracking-wider">
                  Upcoming Guaranteed Booking Today
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brandTeal/20 text-teal-800 dark:text-teal-200 font-bold">
                  {upcomingBooking.bookingRef}
                </span>
              </div>
              <h3 className="font-heading font-bold text-xl text-slate-900 dark:text-white">
                {upcomingBooking.lotName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scheduled arrival: <strong className="text-slate-700 dark:text-slate-200">{upcomingBooking.arrivalTime}</strong> ({upcomingBooking.durationHours} hrs) • Designated Bay: <strong className="text-brandTeal">{upcomingBooking.spotNumber}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => openPassModal(upcomingBooking)}
              className="flex-1 md:flex-none px-5 py-3 rounded-2xl bg-brandTeal hover:bg-brandTeal-hover text-white text-xs font-bold shadow-glow-teal transition-all flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span>View Digital Pass</span>
            </button>
            <button
              onClick={() => {
                window.open(`https://maps.google.com/?q=${upcomingBooking.navigationCoordinates.lat},${upcomingBooking.navigationCoordinates.lng}`, '_blank');
              }}
              className="flex-1 md:flex-none px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <Navigation className="w-4 h-4 text-blue-500" />
              <span>Directions</span>
            </button>
          </div>
        </section>
      )}

      {/* Primary Quick Actions Grid */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Quick Mobility Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[
            { label: 'Find Parking', icon: Compass, route: 'find', color: 'text-brandTeal', bg: 'hover:border-brandTeal' },
            { label: 'AI Predictions', icon: TrendingUp, route: 'predictions', color: 'text-blue-500', bg: 'hover:border-blue-500' },
            { label: 'Find My Car', icon: MapPin, action: () => setFindMyCarOpen(true), color: 'text-emerald-500', bg: 'hover:border-emerald-500' },
            { label: 'My Bookings', icon: CalendarCheck2, route: 'bookings', color: 'text-purple-500', bg: 'hover:border-purple-500' },
            { label: 'Ask Copilot', icon: Sparkles, action: () => setCopilotOpen(true), color: 'text-amber-500', bg: 'hover:border-amber-500' },
            { label: 'My Garage', icon: Car, route: 'vehicles', color: 'text-indigo-500', bg: 'hover:border-indigo-500' },
          ].map((act, idx) => {
            const Icon = act.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  if (act.route) navigate(act.route);
                  else if (act.action) act.action();
                }}
                className={`p-4 rounded-3xl bg-white dark:bg-[#111C2D] border border-slate-200/80 dark:border-slate-800 shadow-card text-left transition-all ${act.bg} group`}
              >
                <div className={`w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${act.color} mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-heading font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                  {act.label}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Instant Access</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recommended Parking Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brandTeal block">
              Contextual Match For Today
            </span>
            <h3 className="font-heading font-bold text-xl text-slate-900 dark:text-white">
              Recommended For Your Routine
            </h3>
          </div>
          <button
            onClick={() => navigate('find')}
            className="text-xs text-brandTeal hover:underline flex items-center gap-1 font-bold"
          >
            <span>View All Chennai Lots</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pick 1: Anna Tower */}
          <div className="bg-white dark:bg-[#111C2D] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-brandTeal bg-brandTeal/10 px-2 py-0.5 rounded-full">
                  Best Value Pick
                </span>
                <h4 className="font-heading font-bold text-lg text-slate-900 dark:text-white mt-1.5">
                  {recommendedLot.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {recommendedLot.area} • {recommendedLot.walkingMinutesFromCenter} min walk to Metro
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-heading font-extrabold text-navy-800 dark:text-white">
                  ₹{recommendedLot.hourlyRate}<span className="text-xs font-normal text-slate-400">/hr</span>
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {availableBays} bays open now
              </span>
              <span className="text-brandTeal font-medium">~58% predicted at 6 PM</span>
            </div>

            <button
              onClick={() => openBookingModal(recommendedLot)}
              className="w-full py-3 rounded-2xl bg-brandTeal hover:bg-brandTeal-hover text-white text-xs font-bold transition-all shadow-glow-teal flex items-center justify-center gap-1.5"
            >
              <span>Reserve at Anna Tower (Save ₹20/hr)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Pick 2: VR Mall */}
          <div className="bg-white dark:bg-[#111C2D] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  EV Hub Recommendation
                </span>
                <h4 className="font-heading font-bold text-lg text-slate-900 dark:text-white mt-1.5">
                  VR Mall Smart Deck
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Anna Nagar West • 16 DC Fast Chargers
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-heading font-extrabold text-navy-800 dark:text-white">
                  ₹50<span className="text-xs font-normal text-slate-400">/hr</span>
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <Zap className="w-4 h-4 text-emerald-500" />
                12 EV bays open on Level B1
              </span>
              <span className="text-amber-500 font-medium">Peak starts at 6:30 PM</span>
            </div>

            <button
              onClick={() => openBookingModal(parkingLots[0])}
              className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <span>Reserve VR Mall Spot</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
