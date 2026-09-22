import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ParkingLot } from '../types';
import { 
  ShieldCheck, 
  Cpu, 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  ToggleLeft, 
  ToggleRight, 
  Edit, 
  Users, 
  Layers, 
  Activity 
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const AdminDashboard: React.FC = () => {
  const { parkingLots, bookings, reports, showToast } = useApp();
  const [lots, setLots] = useState<ParkingLot[]>(parkingLots);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'lots' | 'analytics' | 'reports'>('overview');

  // Compute Admin KPIs
  const totalCapacity = lots.reduce((acc, l) => acc + l.totalCapacity, 0);
  const totalOccupied = lots.reduce((acc, l) => acc + l.currentOccupancy, 0);
  const systemOccupancyPct = Math.round((totalOccupied / totalCapacity) * 100);
  const totalRevenue = bookings.reduce((acc, b) => acc + b.pricing.totalAmount, 0) + 14850; // include seeded aggregate

  const handleToggleLotStatus = (lotId: string) => {
    setLots((prev) =>
      prev.map((l) => (l.id === lotId ? { ...l, isOpen: !l.isOpen } : l))
    );
    showToast('Facility operating status toggled.', 'info');
  };

  const handleUpdateRate = (lotId: string, delta: number) => {
    setLots((prev) =>
      prev.map((l) =>
        l.id === lotId ? { ...l, hourlyRate: Math.max(10, l.hourlyRate + delta) } : l
      )
    );
    showToast('Hourly rate updated and synced to driver apps.', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Operations & Facility Console
            </span>
            <span className="text-xs text-slate-400">Node: Greater Chennai Mobility Grid</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white">
            ParkPredict Admin & Telemetry Hub
          </h1>
        </div>

        {/* Telemetry Indicator */}
        <div className="flex items-center gap-2 p-2 bg-white dark:bg-[#111C2D] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-subtle text-xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Provider: SimulatedOccupancyProvider
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-[10px] text-brandTeal font-mono">MQTT Bridge Ready</span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111C2D] border border-slate-200/80 dark:border-slate-800 shadow-card space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>System Occupancy</span>
            <Activity className="w-4 h-4 text-brandTeal" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            {systemOccupancyPct}%
          </div>
          <span className="text-xs text-slate-500 block">
            {totalOccupied} occupied / {totalCapacity} bays
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#111C2D] border border-slate-200/80 dark:border-slate-800 shadow-card space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Smart Facilities</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            {lots.filter((l) => l.isOpen).length} / {lots.length}
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block">
            100% telemetry online
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#111C2D] border border-slate-200/80 dark:border-slate-800 shadow-card space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Prediction Accuracy</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            94.2%
          </div>
          <span className="text-xs text-slate-500 block">
            Mean absolute error: ±2.4 spots
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#111C2D] border border-slate-200/80 dark:border-slate-800 shadow-card space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>FastTag Revenue Today</span>
            <DollarSign className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-brandTeal">
            ₹{totalRevenue.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 block">
            Automated settlement via NPCI
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'overview', label: 'Facility Overview' },
          { id: 'analytics', label: 'AI Prediction Analytics' },
          { id: 'reports', label: `Driver Reports (${reports.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              selectedTab === tab.id
                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Facility Overview Table */}
      {selectedTab === 'overview' && (
        <div className="bg-white dark:bg-[#111C2D] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
              Managed Parking Facilities
            </h3>
            <span className="text-xs text-slate-500">Live Telemetry Synchronized</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-4">Facility Name</th>
                  <th className="p-4">Area</th>
                  <th className="p-4">Live Occupancy</th>
                  <th className="p-4">Hourly Rate</th>
                  <th className="p-4">Operational Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lots.map((lot) => {
                  const available = lot.totalCapacity - lot.currentOccupancy;
                  const pct = Math.round((lot.currentOccupancy / lot.totalCapacity) * 100);

                  return (
                    <tr key={lot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="p-4 font-bold text-slate-900 dark:text-white">
                        {lot.name}
                      </td>
                      <td className="p-4 text-slate-500">{lot.area}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{pct}%</span>
                          <span className="text-slate-400">({available} open)</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-brandTeal">
                        ₹{lot.hourlyRate}/hr
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            lot.isOpen
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${lot.isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {lot.isOpen ? 'OPEN' : 'CLOSED'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleUpdateRate(lot.id, 5)}
                          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200"
                          title="Increase hourly rate by ₹5"
                        >
                          +₹5
                        </button>
                        <button
                          onClick={() => handleUpdateRate(lot.id, -5)}
                          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200"
                          title="Decrease hourly rate by ₹5"
                        >
                          -₹5
                        </button>
                        <button
                          onClick={() => handleToggleLotStatus(lot.id)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-medium"
                        >
                          Toggle Gate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: AI Analytics */}
      {selectedTab === 'analytics' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111C2D] border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4">
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
              Model Performance: Actual vs Predicted Occupancy
            </h3>
            <p className="text-xs text-slate-500">
              Surrogate model demonstrates 94.2% accuracy against physical gate counters over 14-day rolling window.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Peak Prediction Lead Time</span>
                <div className="text-xl font-heading font-black text-slate-900 dark:text-white">45 minutes</div>
                <span className="text-[11px] text-emerald-600 font-semibold">Advance warning window</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">False Full Alerts</span>
                <div className="text-xl font-heading font-black text-slate-900 dark:text-white">&lt; 0.8%</div>
                <span className="text-[11px] text-emerald-600 font-semibold">Zero lost customer entries</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Load Balance Transfer</span>
                <div className="text-xl font-heading font-black text-brandTeal">28% shifted</div>
                <span className="text-[11px] text-slate-500">To secondary decks during peaks</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Driver Reports */}
      {selectedTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-white dark:bg-[#111C2D] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-2 shadow-card">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                No active incident reports
              </h4>
              <p className="text-xs text-slate-400">
                Driver verification reports and field tickets will appear here for staff resolution.
              </p>
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#111C2D] border border-slate-200/80 dark:border-slate-800 shadow-card space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{rep.lotName}</span>
                    <Badge variant="limited" size="sm">{rep.issueType.replace('_', ' ').toUpperCase()}</Badge>
                  </div>
                  <span className="text-slate-400 text-[10px]">{new Date(rep.reportedAt).toLocaleString()}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                  "{rep.description}"
                </p>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => showToast(`Report ${rep.id} marked as resolved.`, 'success')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};
