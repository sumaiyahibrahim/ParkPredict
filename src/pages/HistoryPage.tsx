import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Booking } from '../types';
import { 
  History, 
  Search, 
  Receipt, 
  RotateCcw, 
  Download, 
  Calendar, 
  Clock, 
  Car, 
  CheckCircle2, 
  X, 
  Printer, 
  Share2 
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const HistoryPage: React.FC = () => {
  const { bookings, rebookParking, showToast, navigate } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeReceiptBooking, setActiveReceiptBooking] = useState<Booking | null>(null);

  const completedTrips = bookings.filter((b) => b.status === 'completed');

  const filteredHistory = completedTrips.filter((trip) => {
    const q = searchTerm.toLowerCase();
    return (
      trip.lotName.toLowerCase().includes(q) ||
      trip.bookingRef.toLowerCase().includes(q) ||
      trip.vehicle.plateNumber.toLowerCase().includes(q) ||
      trip.date.includes(q)
    );
  });

  const handlePrintReceipt = () => {
    showToast('Preparing digital receipt PDF export...', 'info');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white">
            Trip History & Tax Invoices
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Access itemized digital receipts, automated FastTag tolls, and 1-click repeat rebooking.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by lot, plate, date..."
            className="w-full bg-white dark:bg-[#111C2D] border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandTeal"
          />
        </div>
      </div>

      {/* History Cards List */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="bg-white dark:bg-[#111C2D] p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-card">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <History className="w-6 h-6" />
            </div>
            <h4 className="font-heading font-bold text-base text-slate-900 dark:text-white">
              No parking history found
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Once you complete parking sessions, your itemized receipts, timestamps, and repeat booking shortcuts will appear here.
            </p>
            <button
              onClick={() => navigate('find')}
              className="px-5 py-2.5 rounded-xl bg-brandTeal text-white text-xs font-bold shadow-glow-teal"
            >
              Discover Parking Spots
            </button>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              className="p-5 bg-white dark:bg-[#111C2D] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-base text-slate-900 dark:text-white">
                    {item.lotName}
                  </span>
                  <Badge variant="available" size="sm">
                    PAID • FASTTAG
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.date}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.arrivalTime} ({item.durationHours} hrs)</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.vehicle.plateNumber}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-4 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                <div className="text-left md:text-right">
                  <span className="text-lg font-heading font-extrabold text-navy-800 dark:text-white block">
                    ₹{item.pricing.totalAmount}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Ref: {item.bookingRef}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveReceiptBooking(item)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Receipt className="w-3.5 h-3.5 text-slate-400" />
                    <span>Invoice</span>
                  </button>

                  <button
                    onClick={() => rebookParking(item)}
                    className="px-4 py-2 rounded-xl bg-brandTeal hover:bg-brandTeal-hover text-white text-xs font-bold transition-all shadow-glow-teal flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Park Here Again</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Itemized Digital Receipt Modal */}
      {activeReceiptBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[#111C2D] rounded-3xl shadow-elevated border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col p-6 sm:p-7 space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brandTeal/10 text-brandTeal flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Tax Invoice
                  </span>
                  <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                    {activeReceiptBooking.bookingRef}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setActiveReceiptBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="space-y-4 text-xs">
              <div className="text-center py-2 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Total Paid</span>
                <div className="text-3xl font-heading font-black text-brandTeal">
                  ₹{activeReceiptBooking.pricing.totalAmount}
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> FastTag Auto-Deduction Successful
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Facility</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{activeReceiptBooking.lotName}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Date & Time</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{activeReceiptBooking.date} • {activeReceiptBooking.arrivalTime}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Duration</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{activeReceiptBooking.durationHours} hours</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Allocated Bay</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{activeReceiptBooking.spotFloor} - {activeReceiptBooking.spotNumber}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Vehicle Plate</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{activeReceiptBooking.vehicle.plateNumber}</span>
                </div>
              </div>

              {/* Itemized breakdown */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>Base Parking Charge</span>
                  <span>₹{activeReceiptBooking.pricing.durationCharge}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>GST / Municipal Tax (5%)</span>
                  <span>₹{activeReceiptBooking.pricing.serviceTax}</span>
                </div>
                {activeReceiptBooking.pricing.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Promo Discount</span>
                    <span>-₹{activeReceiptBooking.pricing.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Net Charged</span>
                  <span>₹{activeReceiptBooking.pricing.totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Receipt Modal Buttons */}
            <div className="pt-2 flex gap-2">
              <button
                onClick={handlePrintReceipt}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>

              <button
                onClick={() => {
                  setActiveReceiptBooking(null);
                  rebookParking(activeReceiptBooking);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-brandTeal hover:bg-brandTeal-hover text-white text-xs font-bold transition-all shadow-glow-teal flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Park Here Again</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
