import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Booking, BookingStatus } from '../types';
import { 
  CalendarCheck2, 
  Clock, 
  MapPin, 
  Car, 
  QrCode, 
  Navigation, 
  XCircle, 
  Receipt, 
  ArrowRight, 
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const BookingsPage: React.FC = () => {
  const { 
    bookings, 
    cancelBooking, 
    openPassModal, 
    startSessionFromBooking, 
    rebookParking, 
    navigate 
  } = useApp();

  const [activeTab, setActiveTab] = useState<BookingStatus>('upcoming');

  const filteredBookings = bookings.filter((b) => b.status === activeTab);

  const tabCounts = {
    upcoming: bookings.filter((b) => b.status === 'upcoming').length,
    active: bookings.filter((b) => b.status === 'active').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white">
            My Reservations & Passes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your guaranteed spots, digital gate entry passes, and past parking sessions.
          </p>
        </div>

        <button
          onClick={() => navigate('find')}
          className="px-5 py-2.5 rounded-2xl bg-brandTeal hover:bg-brandTeal-hover text-white text-xs font-bold transition-all shadow-glow-teal flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>Book New Spot</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'upcoming', label: 'Upcoming', count: tabCounts.upcoming },
          { id: 'active', label: 'Active Sessions', count: tabCounts.active },
          { id: 'completed', label: 'Completed', count: tabCounts.completed },
          { id: 'cancelled', label: 'Cancelled', count: tabCounts.cancelled },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as BookingStatus)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-brandTeal/10 text-brandTeal dark:text-teal-300 border border-brandTeal/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.id
                  ? 'bg-brandTeal text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="bg-white dark:bg-[#111C2D] p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-card">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <CalendarCheck2 className="w-6 h-6" />
            </div>
            <h4 className="font-heading font-bold text-base text-slate-900 dark:text-white">
              No {activeTab} bookings found
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {activeTab === 'upcoming'
                ? "You don't have any upcoming parking reservations. Explore nearby lots to book ahead."
                : `There are currently no ${activeTab} records in your account.`}
            </p>
            {activeTab === 'upcoming' && (
              <button
                onClick={() => navigate('find')}
                className="px-5 py-2.5 rounded-xl bg-brandTeal text-white text-xs font-bold shadow-glow-teal"
              >
                Find & Reserve Spot
              </button>
            )}
          </div>
        ) : (
          filteredBookings.map((bk) => (
            <div
              key={bk.id}
              className="p-5 sm:p-6 bg-white dark:bg-[#111C2D] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4"
            >
              {/* Card Header: Lot, Code, Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-brandTeal flex-shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-slate-900 dark:text-white text-base">
                        {bk.lotName}
                      </span>
                      <Badge
                        variant={
                          bk.status === 'upcoming'
                            ? 'info'
                            : bk.status === 'active'
                            ? 'available'
                            : bk.status === 'completed'
                            ? 'neutral'
                            : 'full'
                        }
                        size="sm"
                      >
                        {bk.status.toUpperCase()}
                      </Badge>
                    </div>
                    <span className="text-xs text-slate-400 block font-mono">
                      Ref: {bk.bookingRef}
                    </span>
                  </div>
                </div>

                <div className="text-right sm:text-right">
                  <span className="text-base font-heading font-extrabold text-navy-800 dark:text-white">
                    ₹{bk.pricing.totalAmount}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Prepaid & Guaranteed</span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Date & Time</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{bk.date}</span>
                  <span className="text-slate-500 text-[11px]">{bk.arrivalTime} ({bk.durationHours} hrs)</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Assigned Bay</span>
                  <span className="font-bold text-brandTeal block text-sm">{bk.spotNumber || 'Bay 14'}</span>
                  <span className="text-slate-500 text-[11px]">{bk.spotFloor || 'Level 1'}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Vehicle</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{bk.vehicle.plateNumber}</span>
                  <span className="text-slate-500 text-[11px] truncate">{bk.vehicle.makeModel}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Location</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{bk.lotAddress}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">Free FastTag Ingress</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openPassModal(bk)}
                    className="px-4 py-2 rounded-xl bg-brandTeal hover:bg-brandTeal-hover text-white text-xs font-bold transition-all shadow-glow-teal flex items-center gap-1.5"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>View Digital Pass</span>
                  </button>

                  <button
                    onClick={() => {
                      window.open(`https://maps.google.com/?q=${bk.navigationCoordinates.lat},${bk.navigationCoordinates.lng}`, '_blank');
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                  >
                    <Navigation className="w-3.5 h-3.5 text-blue-500" />
                    <span>Navigate</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {bk.status === 'upcoming' && (
                    <>
                      <button
                        onClick={() => startSessionFromBooking(bk)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>I Arrived • Start Session</span>
                      </button>

                      <button
                        onClick={() => cancelBooking(bk.id)}
                        className="px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel Booking</span>
                      </button>
                    </>
                  )}

                  {bk.status === 'completed' && (
                    <button
                      onClick={() => rebookParking(bk)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-brandTeal" />
                      <span>Park Here Again</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
