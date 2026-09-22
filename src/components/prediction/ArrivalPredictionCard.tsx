import React from 'react';
import { PredictionForecast, ParkingLot } from '../../types';
import { 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  Clock, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { useApp } from '../../context/AppContext';

interface ArrivalPredictionCardProps {
  forecast: PredictionForecast;
  lot: ParkingLot;
}

export const ArrivalPredictionCard: React.FC<ArrivalPredictionCardProps> = ({ forecast, lot }) => {
  const { openBookingModal } = useApp();

  const availablePct = 100 - forecast.predictedOccupancyPct;

  let statusBg = 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60';
  let statusText = 'text-emerald-700 dark:text-emerald-300';
  let statusBadgeVariant: 'available' | 'limited' | 'full' = 'available';

  if (forecast.recommendation === 'critical') {
    statusBg = 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60';
    statusText = 'text-rose-700 dark:text-rose-300';
    statusBadgeVariant = 'full';
  } else if (forecast.recommendation === 'crowded') {
    statusBg = 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60';
    statusText = 'text-amber-700 dark:text-amber-300';
    statusBadgeVariant = 'limited';
  }

  return (
    <div className="bg-white dark:bg-[#111C2D] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-card p-5 sm:p-7 space-y-6">
      
      {/* Top Banner: Forecast at arrival */}
      <div className={`p-5 rounded-2xl border ${statusBg} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Arrival Forecast • {forecast.targetTime}
            </span>
            <Badge variant={statusBadgeVariant} size="sm">
              {forecast.recommendation.toUpperCase()}
            </Badge>
          </div>
          <h3 className={`font-heading font-extrabold text-2xl sm:text-3xl ${statusText}`}>
            {availablePct}% Availability Expected
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            ~{forecast.predictedAvailableSpots} open spots out of {lot.totalCapacity} total bays.
          </p>
        </div>

        {/* Confidence Gauge */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-center flex-shrink-0">
          <div className="flex items-center gap-1.5 justify-center text-xs text-slate-500 dark:text-slate-400 mb-0.5">
            <ShieldCheck className="w-4 h-4 text-brandTeal" />
            <span className="font-semibold">AI Confidence</span>
          </div>
          <div className="text-xl font-heading font-black text-navy-800 dark:text-white">
            {forecast.confidenceScore}%
          </div>
          <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase">
            {forecast.confidenceLevel} Reliability
          </span>
        </div>
      </div>

      {/* Smart Arrival Advice Box */}
      <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/50 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-brandTeal flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-teal-900 dark:text-teal-200 mb-0.5">
            {forecast.adviceHeadline}
          </h4>
          <p className="text-xs text-teal-800/90 dark:text-teal-300/90 leading-relaxed">
            {forecast.adviceDetail}
          </p>
          <div className="mt-2 text-[11px] font-medium text-teal-700 dark:text-teal-400">
            🌟 <span className="font-bold">Best window to arrive:</span> {forecast.bestParkingWindow}
          </div>
        </div>
      </div>

      {/* "Why This Prediction?" - Explainable AI Factors */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
            Why this prediction?
          </h4>
          <span className="text-[10px] text-slate-400 font-medium">Random Forest Model (v2.4)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Time & Day Factor</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {forecast.factors.dayOfWeekTrend}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Live Ingress Velocity</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {forecast.factors.realtimeVelocity}% live weight blending
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Footfall Dynamics</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {forecast.factors.localEventsFactor}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Weather & Conditions</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {forecast.factors.weatherFactor}
            </span>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Want to guarantee your spot before demand rises?
        </div>
        <button
          onClick={() => openBookingModal(lot)}
          className="px-5 py-2.5 rounded-2xl bg-brandTeal hover:bg-brandTeal-hover text-white text-xs font-bold transition-all shadow-glow-teal flex items-center gap-2"
        >
          <span>Reserve This Window</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
