import React from 'react';
import { X, RotateCcw, SlidersHorizontal, Check } from 'lucide-react';

export interface FilterState {
  maxDistanceKm: number;
  maxPrice: number;
  minAvailabilityPct: number;
  requireEv: boolean;
  requireCovered: boolean;
  requireAccessible: boolean;
  requireSecurity: boolean;
  sortBy: 'recommended' | 'distance' | 'price' | 'availability';
}

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onChangeFilters: (filters: FilterState) => void;
  onReset: () => void;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onChangeFilters,
  onReset,
}) => {
  if (!isOpen) return null;

  const handleToggle = (key: keyof FilterState) => {
    onChangeFilters({
      ...filters,
      [key]: !filters[key],
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#111C2D] h-full shadow-elevated border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-250">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-brandTeal" />
            <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
              Filter & Sort
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 font-medium p-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Sort By */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2.5">
              Sort Results By
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'recommended', label: 'Recommended (AI)' },
                { id: 'distance', label: 'Nearest First' },
                { id: 'price', label: 'Lowest Price' },
                { id: 'availability', label: 'Most Available' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onChangeFilters({ ...filters, sortBy: opt.id as any })}
                  className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                    filters.sortBy === opt.id
                      ? 'bg-brandTeal/10 border-brandTeal text-brandTeal dark:text-teal-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Max Price Range */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Max Hourly Budget
              </label>
              <span className="text-sm font-extrabold text-brandTeal">
                ₹{filters.maxPrice}/hr
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={filters.maxPrice}
              onChange={(e) => onChangeFilters({ ...filters, maxPrice: parseInt(e.target.value, 10) })}
              className="w-full accent-brandTeal cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>₹20/hr</span>
              <span>₹60/hr</span>
              <span>₹100/hr</span>
            </div>
          </div>

          {/* Distance Radius */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Search Radius
              </label>
              <span className="text-sm font-extrabold text-navy-800 dark:text-white">
                {filters.maxDistanceKm} km
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              step="1"
              value={filters.maxDistanceKm}
              onChange={(e) => onChangeFilters({ ...filters, maxDistanceKm: parseInt(e.target.value, 10) })}
              className="w-full accent-brandTeal cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>1 km</span>
              <span>8 km</span>
              <span>15 km</span>
            </div>
          </div>

          {/* Amenities & Facility Requirements */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2.5">
              Specific Amenities
            </label>
            <div className="space-y-2">
              {[
                { key: 'requireEv', label: 'EV Fast Charging Stations', desc: 'CCS2 / Type 2 high speed' },
                { key: 'requireCovered', label: 'Covered / Indoor Parking', desc: 'Protected from weather' },
                { key: 'requireAccessible', label: 'Accessible (PWD) Spaces', desc: 'Step-free elevator access' },
                { key: 'requireSecurity', label: '24/7 Security & CCTV', desc: 'Physical security guard on site' },
              ].map((item) => {
                const isChecked = filters[item.key as keyof FilterState];
                return (
                  <label
                    key={item.key}
                    onClick={() => handleToggle(item.key as keyof FilterState)}
                    className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer select-none transition-colors"
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border mt-0.5 transition-colors ${
                        isChecked
                          ? 'bg-brandTeal border-brandTeal text-white'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                        {item.label}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.desc}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

        </div>

        {/* Drawer Bottom Apply */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-brandTeal hover:bg-brandTeal-hover text-white text-xs font-bold transition-all shadow-glow-teal"
          >
            Apply Filters
          </button>
        </div>

      </div>
    </div>
  );
};
