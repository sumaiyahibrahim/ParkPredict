import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Compass, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  MapPin, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Car, 
  Sparkles, 
  BarChart3, 
  Cpu, 
  Search, 
  Navigation, 
  Check 
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const LandingPage: React.FC = () => {
  const { navigate, parkingLots, openBookingModal } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('find');
  };

  const featuredLot = parkingLots[0]; // VR Mall
  const availableBays = featuredLot.totalCapacity - featuredLot.currentOccupancy;

  return (
    <div className="space-y-20 pb-20">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Glow Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[400px] bg-gradient-to-tr from-brandTeal/15 to-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            {/* Live Reliability Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy-800/5 dark:bg-white/5 border border-slate-200 dark:border-slate-800 backdrop-blur-sm text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Intelligent Parking Discovery & Predictions</span>
              <span className="text-slate-400">•</span>
              <span className="text-brandTeal">Puducherry & Chennai Corridor</span>
            </div>

            {/* Headline */}
            <h1 className="font-heading font-extrabold text-4xl sm:text-6xl lg:text-7xl text-navy-800 dark:text-white tracking-tight leading-[1.1]">
              Park Smart.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brandTeal to-blue-500">
                Travel Faster.
              </span>
            </h1>

            {/* Subhead */}
            <p className="font-sans text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              ParkPredict uses multi-factor machine learning and real-time velocity data to predict spot availability before you arrive, with guaranteed reservations and instant digital passes.
            </p>

            {/* Natural Search Bar */}
            <div className="max-w-xl mx-auto pt-2">
              <form
                onSubmit={handleHeroSearch}
                className="p-2 bg-white dark:bg-[#111C2D] rounded-3xl shadow-elevated border border-slate-200/80 dark:border-slate-800 flex items-center gap-2 transition-all hover:border-brandTeal/50"
              >
                <div className="pl-3 text-slate-400">
                  <Search className="w-5 h-5 text-brandTeal" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Try 'Rock Beach Pondy', 'White Town', 'VR Mall', or 'EV charging'..."
                  className="flex-1 bg-transparent py-2.5 px-2 text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-brandTeal hover:bg-brandTeal-hover text-white text-sm font-bold shadow-glow-teal transition-all flex items-center gap-2 flex-shrink-0"
                >
                  <span>Find Parking</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Secondary Quick Action Links */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 pt-2">
              <button
                onClick={() => navigate('predictions')}
                className="hover:text-brandTeal flex items-center gap-1.5 transition-colors"
              >
                <TrendingUp className="w-4 h-4 text-brandTeal" />
                <span>See Arrival Predictions</span>
              </button>
              <span>•</span>
              <button
                onClick={() => navigate('find')}
                className="hover:text-brandTeal flex items-center gap-1.5 transition-colors"
              >
                <Compass className="w-4 h-4 text-blue-500" />
                <span>Explore Live Map</span>
              </button>
              <span>•</span>
              <button
                onClick={() => navigate('dashboard')}
                className="hover:text-brandTeal flex items-center gap-1.5 transition-colors"
              >
                <Car className="w-4 h-4 text-emerald-500" />
                <span>Launch Mobility Dashboard</span>
              </button>
            </div>

          </div>

          {/* Interactive Live Hero Snapshot Card */}
          <div className="mt-14 max-w-4xl mx-auto rounded-3xl bg-white dark:bg-[#111C2D] border border-slate-200/80 dark:border-slate-800 shadow-elevated p-6 sm:p-8 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Simulated Live Occupancy • Anna Nagar Hub
                  </span>
                </div>
                <h3 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white">
                  {featuredLot.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {featuredLot.address} • {featuredLot.walkingMinutesFromCenter} min walk
                </p>
                
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Badge variant="teal" size="sm">
                    <Zap className="w-3 h-3 mr-0.5" /> 16 DC Fast Chargers
                  </Badge>
                  <Badge variant="available" size="sm">
                    {availableBays} bays open now
                  </Badge>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Predicted 68% open at 5:30 PM
                  </span>
                </div>
              </div>

              {/* Action Box */}
              <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
                <div className="text-right hidden sm:block">
                  <span className="text-xs text-slate-400 block">Rate</span>
                  <span className="text-xl font-heading font-extrabold text-navy-800 dark:text-white">
                    ₹{featuredLot.hourlyRate}<span className="text-xs font-normal text-slate-400">/hr</span>
                  </span>
                </div>

                <button
                  onClick={() => openBookingModal(featuredLot)}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-brandTeal hover:bg-brandTeal-hover text-white text-xs font-bold shadow-glow-teal transition-all flex items-center justify-center gap-2"
                >
                  <span>Reserve Bay Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Section 01: The Problem ("Parking shouldn't be a guessing game") */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-2 block">
            The Urban Mobility Problem
          </span>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-slate-900 dark:text-white">
            Parking shouldn't be a guessing game.
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
            Over 30% of downtown traffic congestion is caused solely by drivers circling blocks searching for parking spots that were already taken.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              title: 'Wasted Time & Fuel',
              desc: 'Average urban drivers waste 17 minutes per trip circling filled lots without future certainty.',
              icon: Clock,
              color: 'text-amber-500',
            },
            {
              title: 'Rapid Occupancy Shifts',
              desc: 'A lot with 40 spaces can become completely full within 8 minutes during peak shopping hours.',
              icon: TrendingUp,
              color: 'text-rose-500',
            },
            {
              title: 'Uncertain Future Capacity',
              desc: 'Traditional apps show what happened 15 minutes ago, not what will be available when you arrive.',
              icon: BarChart3,
              color: 'text-blue-500',
            },
            {
              title: 'Sudden Barrier Surprises',
              desc: 'Arriving at closed gates, unexpected height restrictions, or missing EV charging ports.',
              icon: ShieldCheck,
              color: 'text-purple-500',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white dark:bg-[#111C2D] border border-slate-200/80 dark:border-slate-800 shadow-card space-y-3"
              >
                <div className={`w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 02: The Solution ("Know before you go" - 6-Step Visual Journey) */}
      <section className="bg-slate-100/70 dark:bg-slate-900/40 py-20 border-y border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-brandTeal mb-2 block">
              Seamless Mobility Journey
            </span>
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-slate-900 dark:text-white">
              Know before you go.
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              ParkPredict transforms parking from reactive searching into effortless, intelligent planning.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Discover Nearby',
                desc: 'Universal natural language search finds verified decks, automated towers, and street bays in seconds.',
              },
              {
                step: '02',
                title: 'Predict Arrival',
                desc: 'AI forecasts exact availability percentage at your scheduled arrival time with 94% confidence.',
              },
              {
                step: '03',
                title: 'Compare & Rank',
                desc: 'Multi-criteria recommendation engine weighs walking distance, hourly price, and EV chargers.',
              },
              {
                step: '04',
                title: 'Reserve Guaranteed Bay',
                desc: 'Lock in your designated spot with free 15-minute cancellation and instant transparent billing.',
              },
              {
                step: '05',
                title: 'Navigate & Enter',
                desc: 'Turn-by-turn guidance and dynamic QR parking pass for seamless FastTag barrier clearance.',
              },
              {
                step: '06',
                title: 'Park & Manage',
                desc: 'Live countdown timer, 1-tap session extension, digital receipt, and built-in "Find My Car" locator.',
              },
            ].map((stepItem, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white dark:bg-[#111C2D] border border-slate-200/80 dark:border-slate-800 shadow-card space-y-3 relative group hover:border-brandTeal/40 transition-all"
              >
                <span className="font-heading font-black text-3xl text-slate-200 dark:text-slate-800 group-hover:text-brandTeal/30 transition-colors">
                  {stepItem.step}
                </span>
                <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
                  {stepItem.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {stepItem.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Section 03: AI Prediction Pipeline Breakdown */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-navy-900 text-white p-8 sm:p-12 relative overflow-hidden border border-slate-800">
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-brandTeal/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <span className="text-xs font-bold text-brandTeal uppercase tracking-wider">
                Machine Learning Architecture
              </span>
              <h2 className="font-heading font-extrabold text-3xl sm:text-4xl leading-tight">
                How ParkPredict forecasts availability.
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Rather than showing outdated sensor counts, our Random Forest surrogate model blends four distinct telemetry dimensions to compute reliable arrival-time probabilities:
              </p>

              <div className="space-y-3 pt-2 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-brandTeal/20 text-brandTeal flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span><strong>Historical Diurnal Curves:</strong> 18 months of Chennai weekday and weekend footfall cycles.</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-brandTeal/20 text-brandTeal flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span><strong>Real-time Ingress Velocity:</strong> Rate of barrier barrier entries in the past 30 minutes.</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-brandTeal/20 text-brandTeal flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span><strong>Event & Traffic Dynamics:</strong> Mall cinema timings, regional metro schedules, and weather conditions.</span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  onClick={() => navigate('predictions')}
                  className="px-6 py-3 rounded-2xl bg-brandTeal hover:bg-brandTeal-hover text-white text-xs font-bold transition-all shadow-glow-teal flex items-center gap-2"
                >
                  <span>Test AI Forecast Engine</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Pipeline Visual Box */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between text-xs pb-3 border-b border-white/10">
                <span className="font-bold text-teal-400">Prediction Pipeline</span>
                <span className="text-slate-400">Model Version 2.4</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <span>1. Historical Baseline Analysis</span>
                  <span className="font-bold text-teal-300">Weight: 45%</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <span>2. Real-Time Occupancy Velocity</span>
                  <span className="font-bold text-blue-300">Weight: 25%</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <span>3. Facility Typology & Day Curves</span>
                  <span className="font-bold text-indigo-300">Weight: 15%</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <span>4. Dynamic Traffic & Events Calibration</span>
                  <span className="font-bold text-amber-300">Weight: 15%</span>
                </div>
              </div>

              <div className="pt-2 text-center text-xs text-slate-400">
                Outputs: Predicted Occupancy % • Confidence Score • Best Arrival Time Advice
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Section 04: Smart City Impact */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-2 block">
            Urban Infrastructure
          </span>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-slate-900 dark:text-white">
            Better parking creates calmer cities.
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
            By guiding drivers directly to guaranteed spaces before they arrive, ParkPredict helps reduce unnecessary vehicle idling, improves traffic flow, and balances facility utilization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111C2D] border border-slate-200/80 dark:border-slate-800 shadow-card text-center space-y-2">
            <div className="text-3xl font-heading font-black text-brandTeal">Zero Circling</div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Reduced Unnecessary Miles</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Drivers navigate directly to allocated bays without circling congested arterial corridors.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#111C2D] border border-slate-200/80 dark:border-slate-800 shadow-card text-center space-y-2">
            <div className="text-3xl font-heading font-black text-blue-500">Balanced Load</div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Optimized Capacity</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recommends underutilized nearby facilities (like Tower Park) when primary mall decks are near capacity.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#111C2D] border border-slate-200/80 dark:border-slate-800 shadow-card text-center space-y-2">
            <div className="text-3xl font-heading font-black text-emerald-500">EV Prioritization</div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Clean Fleet Adoption</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direct telemetry matching EV drivers with open, operational high-speed charging hubs.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-navy-800 via-brandTeal-dark to-navy-900 text-white p-8 sm:p-12 text-center space-y-6 shadow-elevated">
          <h2 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight max-w-2xl mx-auto">
            Ready to know where you'll park before leaving?
          </h2>
          <p className="text-sm sm:text-base text-slate-200 max-w-xl mx-auto">
            Join thousands of smart drivers across Chennai who save an average of 15 minutes on every trip.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('find')}
              className="px-8 py-3.5 rounded-2xl bg-white text-navy-800 hover:bg-slate-100 text-sm font-bold shadow-elevated transition-all flex items-center gap-2"
            >
              <span>Explore Live Parking Now</span>
              <ArrowRight className="w-4 h-4 text-brandTeal" />
            </button>
            <button
              onClick={() => navigate('predictions')}
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 backdrop-blur-sm transition-all"
            >
              View Predictions Engine
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
