import React from 'react';
import { useApp } from '../../context/AppContext';
import { Compass, TrendingUp, CalendarCheck2, LayoutDashboard, Sparkles, MapPin } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { activeRoute, navigate, activeSession, setCopilotOpen, setFindMyCarOpen } = useApp();

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'find', label: 'Find', icon: Compass },
    { id: 'predictions', label: 'Predict', icon: TrendingUp },
    { id: 'bookings', label: 'Bookings', icon: CalendarCheck2 },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0B1320]/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 pb-safe shadow-elevated">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeRoute === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 relative ${
                isActive
                  ? 'text-brandTeal dark:text-teal-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-brandTeal" />
              )}
            </button>
          );
        })}

        {/* Dynamic 5th Button: Find Car if active session exists, else AI Copilot */}
        {activeSession ? (
          <button
            onClick={() => setFindMyCarOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-emerald-600 dark:text-emerald-400 font-medium relative animate-pulse-slow"
          >
            <MapPin className="w-5 h-5 mb-0.5 text-emerald-500" />
            <span className="text-[10px] tracking-tight font-bold">My Car</span>
            <span className="absolute -top-1 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </button>
        ) : (
          <button
            onClick={() => setCopilotOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-teal-600 dark:text-teal-400 font-medium"
          >
            <Sparkles className="w-5 h-5 mb-0.5 text-brandTeal" />
            <span className="text-[10px] tracking-tight font-bold">Copilot</span>
          </button>
        )}
      </div>
    </div>
  );
};
