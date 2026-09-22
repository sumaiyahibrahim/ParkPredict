import React from 'react';
import { Booking } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  QrCode, 
  MapPin, 
  Clock, 
  Calendar, 
  Car, 
  Navigation, 
  Share2, 
  PlayCircle, 
  Download, 
  CheckCircle2 
} from 'lucide-react';

interface DigitalParkingPassModalProps {
  booking: Booking;
  onClose: () => void;
}

export const DigitalParkingPassModal: React.FC<DigitalParkingPassModalProps> = ({
  booking,
  onClose,
}) => {
  const { startSessionFromBooking, showToast } = useApp();

  const handleShare = () => {
    navigator.clipboard.writeText(`ParkPredict Pass [${booking.bookingRef}] at ${booking.lotName}. Bay: ${booking.spotNumber}.`);
    showToast('Parking pass details copied to clipboard!', 'success');
  };

  const handleStartSession = () => {
    onClose();
    startSessionFromBooking(booking);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-[#111C2D] rounded-3xl shadow-elevated border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Pass Top Banner */}
        <div className="bg-gradient-to-r from-navy-800 to-navy-700 dark:from-[#0B1320] dark:to-[#131F32] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brandTeal/20 border border-brandTeal/40 flex items-center justify-center text-brandTeal">
              <CheckCircle2 className="w-5 h-5 text-brandTeal" />
            </div>
            <div>
              <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block">
                Confirmed Digital Pass
              </span>
              <h3 className="font-heading font-extrabold text-base text-white">
                {booking.bookingRef}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pass Boarding Body with Notches */}
        <div className="p-6 relative space-y-5 bg-slate-50/50 dark:bg-[#111C2D]">
          
          {/* Facility Info */}
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">
              Parking Facility
            </span>
            <h4 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
              {booking.lotName}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{booking.lotAddress}</span>
            </div>
          </div>

          {/* Key Ticket Details Grid */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Date & Time</span>
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-brandTeal" />
                <span>{booking.date}</span>
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">{booking.arrivalTime} ({booking.durationHours} hrs)</div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Reserved Bay</span>
              <div className="font-bold text-brandTeal text-sm">
                {booking.spotNumber || 'Bay 14'}
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">{booking.spotFloor || 'Level 1'}</div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Vehicle</span>
              <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                {booking.vehicle.plateNumber}
              </div>
              <div className="text-slate-500 text-[11px] truncate">{booking.vehicle.makeModel}</div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Prepaid Total</span>
              <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                ₹{booking.pricing.totalAmount}
              </div>
              <div className="text-slate-500 text-[11px]">FastTag Auto-Linked</div>
            </div>
          </div>

          {/* Dynamic QR Code Box */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-center text-center">
            {/* SVG Simulated Transit QR Code */}
            <div className="relative p-3 bg-white rounded-xl border border-slate-200 shadow-inner mb-2">
              <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
                {/* QR Finder Patterns */}
                <rect x="5" y="5" width="25" height="25" fill="#102A43" rx="4" />
                <rect x="9" y="9" width="17" height="17" fill="#FFFFFF" rx="2" />
                <rect x="13" y="13" width="9" height="9" fill="#102A43" />

                <rect x="70" y="5" width="25" height="25" fill="#102A43" rx="4" />
                <rect x="74" y="9" width="17" height="17" fill="#FFFFFF" rx="2" />
                <rect x="78" y="13" width="9" height="9" fill="#102A43" />

                <rect x="5" y="70" width="25" height="25" fill="#102A43" rx="4" />
                <rect x="9" y="74" width="17" height="17" fill="#FFFFFF" rx="2" />
                <rect x="13" y="78" width="9" height="9" fill="#102A43" />

                {/* Data Matrix Dots */}
                <rect x="35" y="15" width="8" height="8" fill="#0FAF9A" />
                <rect x="50" y="10" width="10" height="6" fill="#102A43" />
                <rect x="45" y="25" width="6" height="12" fill="#3B82F6" />
                <rect x="10" y="40" width="12" height="6" fill="#102A43" />
                <rect x="30" y="45" width="15" height="15" fill="#102A43" rx="3" />
                <circle cx="37" cy="52" r="4" fill="#0FAF9A" />
                <rect x="65" y="40" width="8" height="14" fill="#102A43" />
                <rect x="80" y="50" width="12" height="8" fill="#3B82F6" />
                <rect x="40" y="75" width="16" height="8" fill="#102A43" />
                <rect x="65" y="70" width="10" height="12" fill="#0FAF9A" />
                <rect x="82" y="75" width="8" height="15" fill="#102A43" />
              </svg>
              {/* Scan Beam Pulse */}
              <div className="absolute inset-x-3 top-3 h-0.5 bg-brandTeal shadow-glow-teal animate-bounce opacity-70" />
            </div>

            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Scan at Barrier Ingress / Automated Turntable
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              Code refreshes dynamically for security
            </span>
          </div>

          {/* Action Row */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                showToast(`Opening turn-by-turn navigation...`, 'info');
                window.open(`https://maps.google.com/?q=${booking.navigationCoordinates.lat},${booking.navigationCoordinates.lng}`, '_blank');
              }}
              className="flex-1 py-2.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-white dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Navigation className="w-4 h-4 text-blue-500" />
              <span>Directions</span>
            </button>

            <button
              onClick={handleShare}
              className="py-2.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-white dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>

        </div>

        {/* Start Parking Session Trigger */}
        <div className="p-4 bg-white dark:bg-[#111C2D] border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={handleStartSession}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-glow-teal flex items-center justify-center gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            <span>I Have Arrived • Start Parking Session</span>
          </button>
          <span className="text-[10px] text-slate-400 text-center">
            Starts real-time live timer, reminders, and easy 1-tap extension
          </span>
        </div>

      </div>
    </div>
  );
};
