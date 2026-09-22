import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ParkingLot, ParkingReport } from '../../types';
import { X, AlertTriangle, Check, ShieldAlert } from 'lucide-react';

export const ReportModal: React.FC = () => {
  const { isReportModalOpen, closeReportModal, reportTargetLot, parkingLots, submitParkingReport } = useApp();

  const [selectedLotId, setSelectedLotId] = useState<string>(
    reportTargetLot?.id || parkingLots[0]?.id || 'lot-vr-mall'
  );
  const [issueType, setIssueType] = useState<ParkingReport['issueType']>('inaccurate_availability');
  const [description, setDescription] = useState<string>('');

  if (!isReportModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lot = parkingLots.find((l) => l.id === selectedLotId) || parkingLots[0];

    submitParkingReport({
      lotId: lot.id,
      lotName: lot.name,
      issueType,
      description,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-[#111C2D] rounded-3xl shadow-elevated border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider block">
                Crowdsourced Quality
              </span>
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                Report Parking Issue
              </h3>
            </div>
          </div>
          <button
            onClick={closeReportModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
              Parking Facility
            </label>
            <select
              value={selectedLotId}
              onChange={(e) => setSelectedLotId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandTeal"
            >
              {parkingLots.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.area})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
              Issue Category
            </label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandTeal"
            >
              <option value="inaccurate_availability">Inaccurate Available Spots Count</option>
              <option value="lot_closed">Facility Temporarily Closed / Maintenance</option>
              <option value="wrong_price">Discrepancy in Posted Hourly Rate</option>
              <option value="ev_charger_fault">EV Charger Damaged or Offline</option>
              <option value="blocked_bay">Reserved Bay Blocked by Unauthorized Car</option>
              <option value="unsafe_condition">Safety Hazard / Poor Lighting</option>
            </select>
          </div>

          <div>
            <label className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
              Details & Context
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Please provide specifics (e.g. Charger #2 screen says offline, barrier was stuck at entry gate...)"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandTeal"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Submit Report to Ground Operations</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
