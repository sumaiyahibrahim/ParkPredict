import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { LocalStore } from '../../services/storage/LocalStore';
import { Sparkles, Car, Zap, Check, ArrowRight, ShieldCheck } from 'lucide-react';

export const QuickOnboardingModal: React.FC = () => {
  const { preferences, updatePreferences, showToast } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

  const [walkingPref, setWalkingPref] = useState<number>(preferences.maxWalkingDistanceMeters || 600);
  const [budgetPref, setBudgetPref] = useState<number>(preferences.maxHourlyBudget || 60);
  const [evPref, setEvPref] = useState<boolean>(preferences.requireEvCharging || false);
  const [coveredPref, setCoveredPref] = useState<boolean>(preferences.requireCovered ?? true);

  useEffect(() => {
    const done = LocalStore.isOnboardingCompleted();
    if (!done) {
      // Delay slightly for smooth page entrance
      const timer = setTimeout(() => setIsOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isOpen) return null;

  const handleFinish = () => {
    updatePreferences({
      maxWalkingDistanceMeters: walkingPref,
      maxHourlyBudget: budgetPref,
      requireEvCharging: evPref,
      requireCovered: coveredPref,
    });
    LocalStore.setOnboardingCompleted(true);
    setIsOpen(false);
    showToast('Personalized parking recommendations configured!', 'success');
  };

  const handleSkip = () => {
    LocalStore.setOnboardingCompleted(true);
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-[#111C2D] rounded-3xl shadow-elevated border border-slate-200 dark:border-slate-800 overflow-hidden p-6 sm:p-7 space-y-5">
        
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-brandTeal/10 text-brandTeal mx-auto flex items-center justify-center mb-2 shadow-glow-teal">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold text-brandTeal uppercase tracking-wider">
            Quick 20-Second Setup
          </span>
          <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white">
            Personalize Your Recommendations
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ParkPredict tunes its AI matching to your real driving habits.
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4 text-xs">
          {/* Max Walk */}
          <div>
            <div className="flex items-center justify-between mb-1.5 font-bold text-slate-700 dark:text-slate-300">
              <span>Comfortable Walking Distance</span>
              <span className="text-brandTeal">{walkingPref} meters (~{Math.round(walkingPref / 80)} mins)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[400, 600, 1000].map((dist) => (
                <button
                  key={dist}
                  type="button"
                  onClick={() => setWalkingPref(dist)}
                  className={`py-2 px-2 rounded-xl border text-center font-bold transition-all ${
                    walkingPref === dist
                      ? 'bg-brandTeal text-white border-brandTeal shadow-glow-teal'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {dist}m
                </button>
              ))}
            </div>
          </div>

          {/* Max Hourly Budget */}
          <div>
            <div className="flex items-center justify-between mb-1.5 font-bold text-slate-700 dark:text-slate-300">
              <span>Preferred Max Hourly Rate</span>
              <span className="text-brandTeal">₹{budgetPref}/hr</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[40, 60, 90].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBudgetPref(b)}
                  className={`py-2 px-2 rounded-xl border text-center font-bold transition-all ${
                    budgetPref === b
                      ? 'bg-brandTeal text-white border-brandTeal shadow-glow-teal'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  ₹{b}/hr
                </button>
              ))}
            </div>
          </div>

          {/* Preferences checkboxes */}
          <div className="space-y-2 pt-1">
            <label
              onClick={() => setCoveredPref(!coveredPref)}
              className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer select-none"
            >
              <span className="font-bold text-slate-800 dark:text-slate-200">Prefer Covered / Indoor Decks</span>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                  coveredPref ? 'bg-brandTeal border-brandTeal text-white' : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {coveredPref && <Check className="w-3.5 h-3.5" />}
              </div>
            </label>

            <label
              onClick={() => setEvPref(!evPref)}
              className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer select-none"
            >
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-500" />
                <span className="font-bold text-slate-800 dark:text-slate-200">I Drive an EV (Prioritize Chargers)</span>
              </div>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                  evPref ? 'bg-brandTeal border-brandTeal text-white' : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {evPref && <Check className="w-3.5 h-3.5" />}
              </div>
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-2 flex items-center justify-between gap-3">
          <button
            onClick={handleSkip}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold px-2 py-2"
          >
            Skip for now
          </button>
          <button
            onClick={handleFinish}
            className="flex-1 py-3 px-4 rounded-xl bg-brandTeal hover:bg-brandTeal-hover text-white text-xs font-bold transition-all shadow-glow-teal flex items-center justify-center gap-1.5"
          >
            <span>Save Preferences</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
