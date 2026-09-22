import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { NotificationCategory, AppNotification } from '../types';
import { 
  Bell, 
  CheckCheck, 
  CalendarCheck2, 
  Clock, 
  TrendingUp, 
  Gift, 
  Info, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    navigate 
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filtered = notifications.filter((n) => {
    if (selectedCategory === 'all') return true;
    return n.category === selectedCategory;
  });

  const getCategoryIcon = (cat: NotificationCategory) => {
    switch (cat) {
      case 'bookings':
        return <CalendarCheck2 className="w-5 h-5 text-brandTeal" />;
      case 'parking':
        return <Clock className="w-5 h-5 text-emerald-500" />;
      case 'predictions':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'offers':
        return <Gift className="w-5 h-5 text-purple-500" />;
      default:
        return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white">
            Notifications Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time alerts for booking reminders, active session timers, and prediction shifts.
          </p>
        </div>

        <button
          onClick={markAllNotificationsAsRead}
          className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <CheckCheck className="w-4 h-4 text-brandTeal" />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'all', label: 'All Notifications' },
          { id: 'bookings', label: 'Bookings' },
          { id: 'predictions', label: 'Predictions' },
          { id: 'offers', label: 'Rewards & Offers' },
          { id: 'system', label: 'System' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-brandTeal text-white shadow-glow-teal'
                : 'bg-white dark:bg-[#111C2D] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#111C2D] p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-2 shadow-card">
            <Bell className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
              No notifications in this category
            </h4>
            <p className="text-xs text-slate-400">
              You're all caught up on all parking events and reservation notices.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                markNotificationAsRead(item.id);
                if (item.actionUrl) {
                  navigate(item.actionUrl.replace('/', ''));
                }
              }}
              className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer shadow-card flex items-start gap-4 ${
                item.isRead
                  ? 'bg-white dark:bg-[#111C2D] border-slate-200/80 dark:border-slate-800/80 opacity-80'
                  : 'bg-white dark:bg-[#131F32] border-brandTeal/40 ring-1 ring-brandTeal/20'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                {getCategoryIcon(item.category)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white truncate">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.message}
                </p>
              </div>

              {!item.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-brandTeal flex-shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
};
