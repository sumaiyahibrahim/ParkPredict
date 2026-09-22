import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PredictionEngine } from '../services/prediction/PredictionEngine';
import { ForecastChart } from '../components/prediction/ForecastChart';
import { ArrivalPredictionCard } from '../components/prediction/ArrivalPredictionCard';
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  MapPin, 
  TrendingUp, 
  BarChart3, 
  Zap, 
  HelpCircle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const PredictionsPage: React.FC = () => {
  const { parkingLots, openBookingModal } = useApp();

  const [selectedLotId, setSelectedLotId] = useState<string>(parkingLots[0]?.id || 'lot-vr-mall');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('17:30');

  const activeLot = useMemo(() => {
    return parkingLots.find((l) => l.id === selectedLotId) || parkingLots[0];
  }, [parkingLots, selectedLotId]);

  const forecast = useMemo(() => {
    return PredictionEngine.predict(activeLot, selectedDate, selectedTime);
  }, [activeLot, selectedDate, selectedTime]);

  const availableSpots = activeLot.totalCapacity - activeLot.currentOccupancy;
  const currentAvailPct = Math.round((availableSpots / activeLot.totalCapacity) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-brandTeal uppercase tracking-wider bg-brandTeal/10 px-2.5 py-0.5 rounded-full border border-brandTeal/20">
              <Sparkles className="w-3.5 h-3.5" /> Flagship AI Engine
            </span>
            <span className="text-xs text-slate-400">Random Forest Surrogate v2.4</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-slate-900 dark:text-white">
            Parking Availability Forecast
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mt-1">
            Predicts exact parking capacity and peak turnover dynamics at your target destination so you never arrive at a full deck.
          </p>
        </div>

        <button
          onClick={() => openBookingModal(activeLot)}
          className="px-5 py-3 rounded-2xl bg-brandTeal hover:bg-brandTeal-hover text-white text-xs font-bold shadow-glow-teal transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <span>Reserve Predicted Spot</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Target Parameters Control Bar */}
      <div className="bg-white dark:bg-[#111C2D] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-card p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 1. Facility Selector */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-brandTeal" />
            <span>Target Parking Facility</span>
          </label>
          <select
            value={selectedLotId}
            onChange={(e) => setSelectedLotId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandTeal"
          >
            {parkingLots.map((lot) => (
              <option key={lot.id} value={lot.id}>
                {lot.name} ({lot.area})
              </option>
            ))}
          </select>
        </div>

        {/* 2. Target Date */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span>Target Arrival Date</span>
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandTeal"
          />
        </div>

        {/* 3. Target Arrival Time */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-teal-500" />
            <span>Scheduled Arrival Time</span>
          </label>
          <input
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandTeal"
          />
        </div>

      </div>

      {/* Main Prediction Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Arrival Prediction Card with Factors */}
        <div className="lg:col-span-6 space-y-6">
          <ArrivalPredictionCard
            forecast={forecast}
            lot={activeLot}
          />
        </div>

        {/* Right Column: 24-Hour Occupancy Forecast Curve */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white dark:bg-[#111C2D] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-card p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brandTeal block">
                  Diurnal Occupancy Trajectory
                </span>
                <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
                  24-Hour Forecast Curve
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-brandTeal" />
                <span>Expected Occupancy %</span>
              </div>
            </div>

            {/* Recharts Curve */}
            <ForecastChart
              hourlyCurve={forecast.hourlyCurve}
              targetHourLabel={selectedTime}
            />

            {/* Peak Hours Insight Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                <span>Identified Peak Intervals Today:</span>
                <span className="text-rose-500">12:30 PM – 2:00 PM • 6:00 PM – 8:30 PM</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                During red zones (&gt;80%), barrier wait times average 4.2 minutes and spot search times rise to 11 minutes. Reserving a digital pass grants priority barrier lane access.
              </p>
            </div>
          </div>

          {/* Current vs Predicted Comparison Pill */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#111C2D] border border-slate-200 dark:border-slate-800 shadow-card grid grid-cols-2 gap-4 text-center">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Available Right Now</span>
              <div className="text-xl font-heading font-black text-slate-800 dark:text-white">
                {currentAvailPct}% <span className="text-xs text-slate-400 font-normal">({availableSpots} spots)</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block mb-1">
                Predicted at {selectedTime}
              </span>
              <div className="text-xl font-heading font-black text-emerald-600 dark:text-emerald-300">
                {100 - forecast.predictedOccupancyPct}% <span className="text-xs opacity-75 font-normal">({forecast.predictedAvailableSpots} spots)</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
