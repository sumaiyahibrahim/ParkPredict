import React, { useState } from 'react';
import { ParkingLot } from '../../types';
import { useApp } from '../../context/AppContext';
import { SAMPLE_REVIEWS } from '../../data/seedParkingLots';
import { 
  X, 
  MapPin, 
  Clock, 
  IndianRupee, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  Navigation, 
  Share2, 
  Bookmark, 
  AlertTriangle, 
  Star, 
  Info,
  Car,
  ChevronRight
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface ParkingDetailModalProps {
  lot: ParkingLot;
  onClose: () => void;
}

export const ParkingDetailModal: React.FC<ParkingDetailModalProps> = ({ lot, onClose }) => {
  const { openBookingModal, openReportModal, showToast, savePlace } = useApp();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const reviews = SAMPLE_REVIEWS[lot.id] || [
    {
      id: 'rev-def-1',
      lotId: lot.id,
      userName: 'Verified Chennai Driver',
      userBadge: 'Smart Commuter',
      rating: 5,
      date: '3 days ago',
      comment: 'Super fast entry via automated FastTag. Spot was held as promised and prediction was spot on.',
      ratingsBreakdown: { availabilityAccuracy: 5, cleanliness: 5, security: 5, easeOfParking: 5 },
      verifiedTrip: true
    }
  ];

  const availableSpots = Math.max(0, lot.totalCapacity - lot.currentOccupancy);
  const availPct = Math.round((availableSpots / lot.totalCapacity) * 100);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${lot.name} on ParkPredict`,
        text: `Found real-time parking at ${lot.name} (${availableSpots} bays open, ₹${lot.hourlyRate}/hr).`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${lot.name} - ${lot.address}. Real-time parking on ParkPredict.`);
      showToast('Parking lot link copied to clipboard!', 'success');
    }
  };

  const handleSaveFavorite = () => {
    savePlace({
      title: lot.name,
      category: 'favorite',
      address: lot.address,
      coordinates: lot.coordinates,
      notes: `Saved facility in ${lot.area}`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#111C2D] rounded-3xl shadow-elevated border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header & Hero Image */}
        <div className="relative h-56 sm:h-64 w-full bg-slate-800 overflow-hidden flex-shrink-0">
          <img
            src={lot.images[activeImageIndex] || lot.images[0]}
            alt={lot.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Top Actions */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md border border-white/20">
              {lot.area}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
                title="Share Parking Details"
                aria-label="Share parking details"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleSaveFavorite}
                className="p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
                title="Save to Favorites"
                aria-label="Save to favorites"
              >
                <Bookmark className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
                title="Close"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Hero Bottom Banner */}
          <div className="absolute bottom-4 left-4 right-4 text-white z-10">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center text-amber-400 text-xs font-bold bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-sm">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                <span>{lot.rating}</span>
                <span className="text-white/70 ml-1">({lot.reviewCount} reviews)</span>
              </div>
              <span className="text-xs text-white/80 bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-sm">
                {lot.walkingMinutesFromCenter} min walk
              </span>
            </div>
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-white">
              {lot.name}
            </h2>
            <p className="text-xs text-slate-200 truncate mt-0.5">
              {lot.landmark} • {lot.address}
            </p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Real-time Availability & Pricing Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Availability Box */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Live Availability</span>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {availableSpots} open
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.max(10, availPct))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>{lot.currentOccupancy} parked</span>
                <span>{lot.totalCapacity} total capacity</span>
              </div>
            </div>

            {/* Pricing Box */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Standard Rates</span>
                <div className="text-2xl font-heading font-extrabold text-navy-800 dark:text-white">
                  ₹{lot.hourlyRate}
                  <span className="text-xs font-normal text-slate-400">/hr</span>
                </div>
                <span className="text-[11px] text-brandTeal font-medium">₹{lot.dailyRate} maximum daily cap</span>
              </div>
              <div className="text-right text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <div>FastTag Auto-Pay</div>
                <div className="text-emerald-600 dark:text-emerald-400 font-semibold">Zero Surge Fee</div>
              </div>
            </div>
          </div>

          {/* Key Facility Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 text-center">
              <Clock className="w-4 h-4 mx-auto text-slate-400 mb-1" />
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Hours</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {lot.operatingHours.is24x7 ? '24/7 Open' : `${lot.operatingHours.open} - ${lot.operatingHours.close}`}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 text-center">
              <ShieldCheck className="w-4 h-4 mx-auto text-teal-500 mb-1" />
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Security</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                CCTV + Guarded
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 text-center">
              <Car className="w-4 h-4 mx-auto text-blue-500 mb-1" />
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Max Height</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {lot.heightLimitMeters}m Clearance
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 text-center">
              <Zap className="w-4 h-4 mx-auto text-amber-500 mb-1" />
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">EV Power</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {lot.amenities.includes('ev_charging') ? 'DC Fast 60kW' : 'No Chargers'}
              </span>
            </div>
          </div>

          {/* Entry Gate Guidance */}
          <div className="bg-blue-50/80 dark:bg-blue-950/30 p-3.5 rounded-2xl border border-blue-100 dark:border-blue-900/40 flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
              <span className="font-bold">Entry Gate Instructions: </span>
              {lot.entryGateDescription}
            </div>
          </div>

          {/* Cancellation Policy Guarantee */}
          <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{lot.cancellationPolicy}</span>
            </div>
            <span className="text-[10px] text-slate-400">100% Refund</span>
          </div>

          {/* User Reviews */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-heading font-bold text-slate-900 dark:text-white text-sm">
                Verified Driver Reviews ({lot.reviewCount})
              </h4>
              <button
                onClick={() => openReportModal(lot)}
                className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Report Inaccurate Data
              </button>
            </div>

            <div className="space-y-3">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{rev.userName}</span>
                      {rev.userBadge && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {rev.userBadge}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 text-[10px]">{rev.date}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    "{rev.comment}"
                  </p>
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-1">
                    <span>Accuracy: ★ 5.0</span>
                    <span>Cleanliness: ★ 4.9</span>
                    <span>Security: ★ 5.0</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Bottom Fixed CTA */}
        <div className="p-4 bg-white dark:bg-[#111C2D] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-shrink-0">
          <div>
            <span className="text-xs text-slate-400 block">Total Rate</span>
            <div className="text-lg font-heading font-extrabold text-navy-800 dark:text-white">
              ₹{lot.hourlyRate}<span className="text-xs font-normal text-slate-400">/hr</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                showToast(`Launching navigation preview to ${lot.name}...`, 'info');
                window.open(`https://maps.google.com/?q=${lot.coordinates.lat},${lot.coordinates.lng}`, '_blank');
              }}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-500" />
              <span>Navigate</span>
            </button>

            <button
              onClick={() => {
                onClose();
                openBookingModal(lot);
              }}
              className="px-6 py-2.5 rounded-2xl bg-brandTeal hover:bg-brandTeal-hover text-white text-xs font-bold transition-all shadow-glow-teal flex items-center gap-2"
            >
              <span>Reserve Guaranteed Spot</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
