import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Settings, 
  ShieldCheck, 
  Bell, 
  Moon, 
  Sun, 
  Car, 
  Zap, 
  Check, 
  Eye, 
  Lock, 
  Sliders 
} from 'lucide-react';

export const PreferencesPage: React.FC = () => {
  const { preferences, updatePreferences, toggleDarkMode, showToast } = useApp();

  const handleToggle = (key: keyof typeof preferences) => {
    updatePreferences({ [key]: !preferences[key] });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white">
          Preferences & Privacy Controls
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize how ParkPredict ranks parking facilities and safeguards your mobility telemetry.
        </p>
      </div>

      {/* Mobility Matching Preferences */}
      <div className="bg-white dark:bg-[#111C2D] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-card space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Sliders className="w-5 h-5 text-brandTeal" />
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
            AI Recommendation Filters
          </h3>
        </div>

        <div className="space-y-5 text-xs">
          {/* Max Walk Distance */}
          <div>
            <div className="flex items-center justify-between mb-2 font-bold text-slate-700 dark:text-slate-200">
              <span>Maximum Desired Walking Distance</span>
              <span className="text-brandTeal">{preferences.maxWalkingDistanceMeters}m (~{Math.round(preferences.maxWalkingDistanceMeters / 80)} mins walk)</span>
            </div>
            <input
              type="range"
              min="200"
              max="1500"
              step="100"
              value={preferences.maxWalkingDistanceMeters}
              onChange={(e) => updatePreferences({ maxWalkingDistanceMeters: parseInt(e.target.value, 10) })}
              className="w-full accent-brandTeal cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>200m (Close)</span>
              <span>800m (Moderate)</span>
              <span>1.5km (Wide)</span>
            </div>
          </div>

          {/* Max Budget */}
          <div>
            <div className="flex items-center justify-between mb-2 font-bold text-slate-700 dark:text-slate-200">
              <span>Maximum Target Hourly Rate</span>
              <span className="text-brandTeal">₹{preferences.maxHourlyBudget}/hr</span>
            </div>
            <input
              type="range"
              min="20"
              max="120"
              step="5"
              value={preferences.maxHourlyBudget}
              onChange={(e) => updatePreferences({ maxHourlyBudget: parseInt(e.target.value, 10) })}
              className="w-full accent-brandTeal cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>₹20/hr</span>
              <span>₹60/hr</span>
              <span>₹120/hr</span>
            </div>
          </div>

          {/* Feature Checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <label
              onClick={() => handleToggle('requireCovered')}
              className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer select-none"
            >
              <span className="font-bold text-slate-800 dark:text-slate-200">Covered Parking Only</span>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${preferences.requireCovered ? 'bg-brandTeal border-brandTeal text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                {preferences.requireCovered && <Check className="w-3.5 h-3.5" />}
              </div>
            </label>

            <label
              onClick={() => handleToggle('requireEvCharging')}
              className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer select-none"
            >
              <span className="font-bold text-slate-800 dark:text-slate-200">Prioritize EV Charging</span>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${preferences.requireEvCharging ? 'bg-brandTeal border-brandTeal text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                {preferences.requireEvCharging && <Check className="w-3.5 h-3.5" />}
              </div>
            </label>

            <label
              onClick={() => handleToggle('requireAccessible')}
              className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer select-none"
            >
              <span className="font-bold text-slate-800 dark:text-slate-200">Accessible (PWD) Bay</span>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${preferences.requireAccessible ? 'bg-brandTeal border-brandTeal text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                {preferences.requireAccessible && <Check className="w-3.5 h-3.5" />}
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white dark:bg-[#111C2D] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Bell className="w-5 h-5 text-blue-500" />
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
            Smart Alerts & Reminders
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          {[
            { key: 'notifyReservationReminder', label: 'Reservation Starting Soon', desc: 'Alert 30 mins before scheduled entry with live traffic update' },
            { key: 'notifySessionEnding', label: 'Session Expiry Warning', desc: 'Alert 15 mins before active parking meter expires' },
            { key: 'notifyPredictionShifts', label: 'High Demand & Prediction Shifts', desc: 'Notify when saved favorite locations begin filling up' },
            { key: 'notifyPromotions', label: 'EcoRewards & Off-Peak Perks', desc: 'Occasional reward voucher announcements' },
          ].map((item) => {
            const isChecked = preferences[item.key as keyof typeof preferences] as boolean;
            return (
              <div
                key={item.key}
                onClick={() => handleToggle(item.key as any)}
                className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
              >
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">{item.label}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</span>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${isChecked ? 'bg-brandTeal border-brandTeal text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                  {isChecked && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Theme & Appearance */}
      <div className="bg-white dark:bg-[#111C2D] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {preferences.darkMode ? <Moon className="w-5 h-5 text-amber-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                Display Theme
              </h3>
              <p className="text-xs text-slate-500">
                Current theme: {preferences.darkMode ? 'Mobility Dark Slate' : 'Clean Daylight Mode'}
              </p>
            </div>
          </div>

          <button
            onClick={toggleDarkMode}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            Switch to {preferences.darkMode ? 'Light' : 'Dark'} Mode
          </button>
        </div>
      </div>

      {/* Privacy & Telemetry Statement */}
      <div className="p-6 rounded-3xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-heading font-bold text-sm">
          <Lock className="w-4 h-4 text-emerald-500" />
          <span>Privacy by Design & Data Transparency</span>
        </div>
        <p className="leading-relaxed">
          ParkPredict processes real-time sensor streams and telemetry strictly for parking recommendation and barrier verification. We do not sell driver location histories or share your daily itineraries with third-party advertising networks.
        </p>
        <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
          <span>• End-to-End Encryption</span>
          <span>• FastTag Tokenization</span>
          <span>• Instant Data Deletion on Request</span>
        </div>
      </div>

    </div>
  );
};
