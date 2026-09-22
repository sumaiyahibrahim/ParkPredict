import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Clock, 
  MapPin, 
  Car, 
  PlusCircle, 
  LogOut, 
  Compass, 
  ShieldCheck, 
  AlertTriangle,
  IndianRupee,
  CheckCircle2
} from 'lucide-react';

export const ActiveParkingWidget: React.FC = () => {
  const { 
    activeSession, 
    extendActiveSession, 
    endActiveSession, 
    setFindMyCarOpen, 
    showToast 
  } = useApp();

  const [timeLeftStr, setTimeLeftStr] = useState<string>('--:--:--');
  const [minutesLeft, setMinutesLeft] = useState<number>(60);
  const [isExtending, setIsExtending] = useState<boolean>(false);

  useEffect(() => {
    if (!activeSession) return;

    const updateTimer = () => {
      const now = Date.now();
      const end = new Date(activeSession.plannedEndTime).getTime();
      const diffMs = end - now;

      if (diffMs <= 0) {
        setTimeLeftStr('00:00:00');
        setMinutesLeft(0);
      } else {
        const totalSeconds = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        setTimeLeftStr(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
        setMinutesLeft(Math.floor(diffMs / 60000));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  if (!activeSession) return null;

  const handleExtend = (mins: number, fee: number) => {
    extendActiveSession(mins, fee);
    setIsExtending(false);
  };

  const isLowTime = minutesLeft <= 15;

  return (
    <div className="bg-gradient-to-br from-navy-900 via-navy-800 to-[#1B3B5A] text-white rounded-3xl p-6 sm:p-7 shadow-elevated border border-slate-700/80 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-brandTeal/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner: Status + Facility */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Active Parking Session
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                {activeSession.vehiclePlate}
              </span>
            </div>
            <h3 className="font-heading font-extrabold text-xl text-white">
              {activeSession.lotName}
            </h3>
          </div>
        </div>

        {/* Spot Tag */}
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15 text-left">
            <span className="text-[10px] text-slate-300 uppercase block font-semibold">Allocated Bay</span>
            <span className="text-sm font-bold text-teal-300">
              {activeSession.spotFloor} • {activeSession.spotNumber}
            </span>
          </div>
          
          <button
            onClick={() => setFindMyCarOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-brandTeal/20 hover:bg-brandTeal/30 border border-brandTeal/40 text-teal-300 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Locate parked vehicle"
          >
            <Compass className="w-4 h-4 text-brandTeal" />
            <span>Find My Car</span>
          </button>
        </div>
      </div>

      {/* Main Stats Grid: Countdown & Accrued Cost */}
      <div className="py-6 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
        
        {/* Countdown Timer */}
        <div className="sm:col-span-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
            <Clock className="w-4 h-4 text-teal-400" />
            <span>Time Remaining</span>
            {isLowTime && (
              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold animate-pulse">
                Expiring Soon
              </span>
            )}
          </span>

          <div className={`font-heading font-black text-4xl sm:text-5xl tracking-tight ${isLowTime ? 'text-rose-400' : 'text-white'}`}>
            {timeLeftStr}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-300 mt-2">
            <span>Started: {new Date(activeSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span>•</span>
            <span>Expires: {new Date(activeSession.plannedEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Accrued Cost */}
        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-right sm:text-left">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">
            Current Charges
          </span>
          <div className="text-2xl font-heading font-extrabold text-teal-300">
            ₹{activeSession.accruedCost}
          </div>
          <span className="text-[11px] text-slate-300 block mt-0.5">
            Auto-deducted via FastTag on exit
          </span>
        </div>

      </div>

      {/* Extension Panel (Expanded or Trigger) */}
      <div className="pt-4 border-t border-white/10">
        {!isExtending ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-300">
              Need extra time? You can extend seamlessly without returning to your vehicle.
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExtending(true)}
                className="px-4 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Extend Time</span>
              </button>

              <button
                onClick={endActiveSession}
                className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>End Session</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-300">Select Extension Duration:</span>
              <button
                onClick={() => setIsExtending(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleExtend(15, 15)}
                className="p-3 rounded-xl bg-white/10 hover:bg-brandTeal hover:text-white border border-white/10 text-center transition-all text-xs font-bold"
              >
                <div>+15 Minutes</div>
                <div className="text-[10px] text-teal-300 font-normal mt-0.5">₹15 added</div>
              </button>

              <button
                onClick={() => handleExtend(30, 25)}
                className="p-3 rounded-xl bg-white/10 hover:bg-brandTeal hover:text-white border border-white/10 text-center transition-all text-xs font-bold"
              >
                <div>+30 Minutes</div>
                <div className="text-[10px] text-teal-300 font-normal mt-0.5">₹25 added</div>
              </button>

              <button
                onClick={() => handleExtend(60, 45)}
                className="p-3 rounded-xl bg-white/10 hover:bg-brandTeal hover:text-white border border-white/10 text-center transition-all text-xs font-bold"
              >
                <div>+1 Hour</div>
                <div className="text-[10px] text-teal-300 font-normal mt-0.5">₹45 added</div>
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
