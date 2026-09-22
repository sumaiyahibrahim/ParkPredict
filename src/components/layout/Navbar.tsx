import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';
import { 
  Compass, 
  TrendingUp, 
  CalendarCheck2, 
  History, 
  Sparkles, 
  Bell, 
  Moon, 
  Sun, 
  Car, 
  MapPin, 
  Settings, 
  ShieldAlert, 
  Gift, 
  Menu, 
  X, 
  Clock, 
  LifeBuoy,
  LogIn,
  LogOut,
  UserPlus
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeRoute,
    navigate,
    activeSession,
    preferences,
    toggleDarkMode,
    unreadNotificationCount,
    setCopilotOpen,
    setFindMyCarOpen,
  } = useApp();

  const {
    user: authUser,
    isGuest,
    openAuthModal,
    logout,
  } = useAuth();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { id: 'find', label: 'Find Parking', icon: Compass },
    { id: 'predictions', label: 'Predictions', icon: TrendingUp },
    { id: 'bookings', label: 'Bookings', icon: CalendarCheck2 },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-[#0B1320]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => navigate('landing')}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brandTeal rounded-xl text-left"
              aria-label="ParkPredict Home"
            >
              <Logo size="md" showTagline={false} />
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = activeRoute === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => navigate(link.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-navy-800/5 dark:bg-slate-800 text-brandTeal dark:text-teal-400 font-semibold shadow-subtle'
                        : 'text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brandTeal' : 'text-slate-400'}`} />
                    {link.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Center-Right: Active Session Live Pill (If Parked) */}
          <div className="hidden lg:flex items-center">
            {activeSession && activeSession.status === 'active' && (
              <button
                onClick={() => navigate('dashboard')}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20 transition-all shadow-glow-teal animate-pulse-slow"
                title="Click to manage active parking session"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>Currently Parked • {activeSession.lotName}</span>
                <Clock className="w-3.5 h-3.5 opacity-70" />
              </button>
            )}
          </div>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* AI Assistant Copilot Button */}
            <button
              onClick={() => setCopilotOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-500/10 to-blue-500/10 border border-teal-500/20 text-navy-800 dark:text-teal-300 hover:border-teal-500/40 text-xs sm:text-sm font-semibold transition-all hover:shadow-glow-teal"
              title="Open ParkPredict AI Copilot"
            >
              <Sparkles className="w-4 h-4 text-brandTeal animate-pulse" />
              <span className="hidden sm:inline">Ask Copilot</span>
            </button>

            {/* Notifications Bell */}
            <button
              onClick={() => navigate('notifications')}
              className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={preferences.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {preferences.darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Profile Dropdown Menu or Guest Login */}
            {isGuest || !authUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-brandTeal hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-brandTeal hover:bg-teal-600 text-white shadow-glow-teal transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brandTeal transition-colors"
                  aria-label="User profile menu"
                  aria-expanded={isProfileOpen}
                >
                  <div className="w-8 h-8 rounded-lg bg-navy-800 dark:bg-brandTeal/30 flex items-center justify-center text-white font-bold text-xs shadow-subtle overflow-hidden">
                    {authUser.avatarUrl ? (
                      <img src={authUser.avatarUrl} alt={authUser.name} className="w-full h-full object-cover" />
                    ) : (
                      authUser.name.charAt(0)
                    )}
                  </div>
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                      {authUser.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                      {authUser.loyaltyTier}
                    </span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200 dark:border-slate-700/80 shadow-elevated py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">{authUser.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{authUser.email}</p>
                      <div className="mt-2 flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                        <span className="text-slate-600 dark:text-slate-300">EcoPoints:</span>
                        <span className="font-bold text-brandTeal">{authUser.ecoPoints} pts</span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => { navigate('dashboard'); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        <Compass className="w-4 h-4 text-slate-400" />
                        Dashboard
                      </button>
                      <button
                        onClick={() => { setFindMyCarOpen(true); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        <MapPin className="w-4 h-4 text-emerald-500" />
                        Find My Car
                      </button>
                      <button
                        onClick={() => { navigate('vehicles'); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        <Car className="w-4 h-4 text-blue-500" />
                        My Vehicles Garage
                      </button>
                      <button
                        onClick={() => { navigate('saved'); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        <MapPin className="w-4 h-4 text-amber-500" />
                        Saved Places
                      </button>
                      <button
                        onClick={() => { navigate('rewards'); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        <Gift className="w-4 h-4 text-purple-500" />
                        EcoRewards & Perks
                      </button>
                    </div>

                    <div className="py-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => { navigate('admin'); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        <ShieldAlert className="w-4 h-4 text-indigo-500" />
                        Admin & Operator Portal
                      </button>
                      <button
                        onClick={() => { navigate('preferences'); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        Preferences & Privacy
                      </button>
                      <button
                        onClick={() => { navigate('support'); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        <LifeBuoy className="w-4 h-4 text-slate-400" />
                        Support Center
                      </button>
                    </div>

                    <div className="py-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => { logout(); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 py-3 space-y-1 animate-in fade-in slide-in-from-top-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeRoute === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => { navigate(link.id); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? 'bg-brandTeal/10 text-brandTeal dark:text-teal-300 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5 text-brandTeal" />
                  {link.label}
                </button>
              );
            })}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex gap-2 px-2">
              <button
                onClick={() => { setFindMyCarOpen(true); setIsMobileMenuOpen(false); }}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <MapPin className="w-4 h-4 text-emerald-500" />
                Find My Car
              </button>
              <button
                onClick={() => { navigate('admin'); setIsMobileMenuOpen(false); }}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <ShieldAlert className="w-4 h-4 text-indigo-500" />
                Admin Portal
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
