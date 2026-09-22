import React from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { ShieldCheck, Cpu, Zap, HeartHandshake } from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigate } = useApp();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-16 md:pb-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <Logo size="lg" showTagline={true} />
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              ParkPredict combines multi-factor predictive AI, live occupancy tracking, and guaranteed reservations to eliminate urban parking uncertainty before you leave your driveway.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Mobility Stream Active
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-400 border border-blue-800">
                <Cpu className="w-3.5 h-3.5" />
                IoT Telemetry Ready
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => navigate('find')} className="hover:text-brandTeal transition-colors">
                  Find Parking
                </button>
              </li>
              <li>
                <button onClick={() => navigate('predictions')} className="hover:text-brandTeal transition-colors">
                  Availability Forecasts
                </button>
              </li>
              <li>
                <button onClick={() => navigate('bookings')} className="hover:text-brandTeal transition-colors">
                  Digital Parking Passes
                </button>
              </li>
              <li>
                <button onClick={() => navigate('history')} className="hover:text-brandTeal transition-colors">
                  Parking History & Receipts
                </button>
              </li>
            </ul>
          </div>

          {/* Ecosystem & Smart City */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Ecosystem</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => navigate('vehicles')} className="hover:text-brandTeal transition-colors">
                  Vehicle Garage
                </button>
              </li>
              <li>
                <button onClick={() => navigate('rewards')} className="hover:text-brandTeal transition-colors">
                  EcoPoints & Rewards
                </button>
              </li>
              <li>
                <button onClick={() => navigate('admin')} className="hover:text-brandTeal transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  Admin & Operator
                </button>
              </li>
              <li>
                <button onClick={() => navigate('support')} className="hover:text-brandTeal transition-colors flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-emerald-400" />
                  Help & Support Center
                </button>
              </li>
            </ul>
          </div>

          {/* Technology & Trust */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Trust & Standards</h4>
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Simulated Diurnal AI Model with real-time velocity blending.</span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                <span>No surge pricing guarantee & 15-min arrival holding window.</span>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => navigate('preferences')}
                  className="text-xs text-brandTeal hover:underline"
                >
                  Privacy Controls & Data Usage
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ParkPredict Mobility Systems. Built for smart, congestion-free cities.</p>
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('support')} className="hover:text-slate-300 transition-colors">
              Community Incident Reports
            </button>
            <button onClick={() => navigate('preferences')} className="hover:text-slate-300 transition-colors">
              Terms & Fair Use
            </button>
            <span className="text-slate-600">Chennai Core Cluster</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
