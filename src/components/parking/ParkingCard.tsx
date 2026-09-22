import React from 'react';
import { ParkingLot } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  MapPin, 
  Clock, 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight, 
  Sparkles, 
  Star,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface ParkingCardProps {
  lot: ParkingLot;
  isSelected: boolean;
  onSelect: () => void;
  onViewDetails: () => void;
  isBestMatch?: boolean;
  recommendationExplanation?: string;
  badges?: string[];
  predictedAvailPct?: number;
}

export const ParkingCard: React.FC<ParkingCardProps> = ({
  lot,
  isSelected,
  onSelect,
  onViewDetails,
  isBestMatch = false,
  recommendationExplanation,
  badges = [],
  predictedAvailPct = 65,
}) => {
  const { openBookingModal } = useApp();

  const availableSpots = Math.max(0, lot.totalCapacity - lot.currentOccupancy);
  const availPct = Math.round((availableSpots / lot.totalCapacity) * 100);

  let statusVariant: 'available' | 'limited' | 'full' = 'available';
  if (availPct < 12) statusVariant = 'full';
  else if (availPct < 30) statusVariant = 'limited';

  return (
    <div
      onClick={onSelect}
      className={`group relative rounded-3xl border transition-all duration-200 cursor-pointer overflow-hidden ${
        isSelected
          ? 'bg-white dark:bg-[#131F32] border-brandTeal dark:border-brandTeal shadow-card ring-2 ring-brandTeal/20'
          : 'bg-white dark:bg-[#111C2D] border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-subtle hover:shadow-card'
      }`}
    >
      {/* Top Best Match Banner */}
      {isBestMatch && (
        <div className="bg-gradient-to-r from-teal-500/15 via-blue-500/10 to-teal-500/10 px-4 py-2 border-b border-teal-500/20 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 dark:text-teal-300">
            <Sparkles className="w-3.5 h-3.5 text-brandTeal animate-pulse" />
            <span>Recommended For You</span>
          </div>
          <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full">
            AI Top Pick
          </span>
        </div>
      )}

      <div className="p-4 sm:p-5">
        {/* Header: Area, Rating, Price */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {lot.area}
              </span>
              <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{lot.rating}</span>
                <span className="text-slate-400 font-normal">({lot.reviewCount})</span>
              </div>
            </div>
            <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-brandTeal transition-colors">
              {lot.name}
            </h3>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="text-xl font-heading font-extrabold text-navy-800 dark:text-white">
              ₹{lot.hourlyRate}
              <span className="text-xs font-normal text-slate-400">/hr</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
              ₹{lot.dailyRate}/day max
            </span>
          </div>
        </div>

        {/* Human Recommendation Justification */}
        {recommendationExplanation && (
          <p className="text-xs text-teal-700 dark:text-teal-300/90 bg-teal-50 dark:bg-teal-950/40 p-2.5 rounded-xl border border-teal-200/60 dark:border-teal-900/60 mb-3 leading-relaxed">
            💡 {recommendationExplanation}
          </p>
        )}

        {/* Address / Landmark */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3 truncate">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
          <span className="truncate">{lot.address}</span>
        </div>

        {/* Live Availability & Prediction Meter */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-3 mb-3 border border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
              <span className={`w-2 h-2 rounded-full ${availPct < 12 ? 'bg-rose-500' : availPct < 30 ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
              <span>{availableSpots} spots available now</span>
            </div>
            <span className="text-slate-400 text-[11px]">{availPct}% free</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                availPct < 12 ? 'bg-rose-500' : availPct < 30 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(8, availPct))}%` }}
            />
          </div>

          {/* Predicted Availability Pill */}
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200/50 dark:border-slate-800/60">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-brandTeal" />
              <span>Predicted at Arrival:</span>
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              ~{predictedAvailPct}% availability
            </span>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {lot.amenities.includes('ev_charging') && (
            <span className="inline-flex items-center text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 px-2 py-0.5 rounded-md font-medium border border-emerald-200 dark:border-emerald-800/70">
              <Zap className="w-3 h-3 mr-0.5" /> EV Charging
            </span>
          )}
          {lot.amenities.includes('covered') && (
            <span className="inline-flex items-center text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium">
              Covered Deck
            </span>
          )}
          {lot.amenities.includes('security_guard') && (
            <span className="inline-flex items-center text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 px-2 py-0.5 rounded-md font-medium border border-blue-200 dark:border-blue-800/70">
              <ShieldCheck className="w-3 h-3 mr-0.5" /> 24/7 Guarded
            </span>
          )}
          <span className="inline-flex items-center text-[10px] text-slate-500 dark:text-slate-400 px-1.5 py-0.5">
            <Clock className="w-3 h-3 mr-1" /> {lot.walkingMinutesFromCenter} min walk
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
            className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            View Details
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              openBookingModal(lot);
            }}
            className="flex-1 py-2 px-3 rounded-xl bg-brandTeal hover:bg-brandTeal-hover text-white text-xs font-bold transition-all shadow-glow-teal flex items-center justify-center gap-1.5"
          >
            <span>Reserve</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
