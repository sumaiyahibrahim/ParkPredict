import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Vehicle, VehicleType } from '../types';
import { Car, Zap, Plus, Trash2, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const VehiclesPage: React.FC = () => {
  const { vehicles, addVehicle, deleteVehicle, updateVehicle, showToast } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [makeModel, setMakeModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [type, setType] = useState<VehicleType>('sedan');
  const [isEv, setIsEv] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber.trim() || !name.trim()) return;

    addVehicle({
      name,
      makeModel: makeModel || 'Private Vehicle',
      plateNumber: plateNumber.toUpperCase().trim(),
      type,
      isEv: isEv || type === 'ev',
      isDefault: vehicles.length === 0,
    });

    setIsAddModalOpen(false);
    setName('');
    setMakeModel('');
    setPlateNumber('');
    setIsEv(false);
  };

  const handleSetDefault = (veh: Vehicle) => {
    vehicles.forEach((v) => {
      updateVehicle({ ...v, isDefault: v.id === veh.id });
    });
    showToast(`${veh.name} set as primary vehicle for bookings.`, 'success');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white">
            My Vehicles Garage
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your registered vehicles for FastTag barrier clearance and automated spot sizing.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-brandTeal hover:bg-brandTeal-hover text-white text-xs font-bold transition-all shadow-glow-teal flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Vehicle</span>
        </button>
      </div>

      {/* Vehicle Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vehicles.map((veh) => (
          <div
            key={veh.id}
            className={`p-5 rounded-3xl bg-white dark:bg-[#111C2D] border transition-all shadow-card space-y-4 ${
              veh.isDefault
                ? 'border-brandTeal dark:border-brandTeal ring-1 ring-brandTeal/30'
                : 'border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                  {veh.isEv ? <Zap className="w-6 h-6 text-emerald-500" /> : <Car className="w-6 h-6 text-blue-500" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                      {veh.name}
                    </h3>
                    {veh.isDefault && (
                      <span className="text-[10px] bg-brandTeal/10 text-brandTeal px-2 py-0.5 rounded-full font-bold">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {veh.makeModel}
                  </p>
                </div>
              </div>

              {vehicles.length > 1 && (
                <button
                  onClick={() => deleteVehicle(veh.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                  title="Remove vehicle"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Plate Display */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">License Plate</span>
                <span className="text-sm font-mono font-bold tracking-wider text-slate-900 dark:text-white">
                  {veh.plateNumber}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Type</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">
                  {veh.type}
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> FastTag Synced
              </span>

              {!veh.isDefault && (
                <button
                  onClick={() => handleSetDefault(veh)}
                  className="text-brandTeal font-bold hover:underline"
                >
                  Set as Default
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Vehicle Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[#111C2D] rounded-3xl shadow-elevated border border-slate-200 dark:border-slate-800 overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                Register New Vehicle
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Vehicle Nickname
                </label>
                <input
                  type="text"
                  placeholder="e.g. City Commuter, Office EV"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandTeal"
                  required
                />
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Make & Model
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tata Nexon EV, Hyundai Creta"
                  value={makeModel}
                  onChange={(e) => setMakeModel(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandTeal"
                />
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Registration Plate Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. TN 09 BK 4521"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono uppercase font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandTeal"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Body Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandTeal"
                  >
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                    <option value="hatchback">Hatchback</option>
                    <option value="ev">Electric Vehicle (EV)</option>
                    <option value="motorcycle">Motorcycle</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isEv || type === 'ev'}
                      onChange={(e) => setIsEv(e.target.checked)}
                      className="accent-brandTeal w-4 h-4 rounded"
                    />
                    <span className="font-bold text-slate-700 dark:text-slate-300">Requires EV Charger</span>
                  </label>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-brandTeal hover:bg-brandTeal-hover text-white text-xs font-bold transition-all shadow-glow-teal"
                >
                  Save Vehicle to Garage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
