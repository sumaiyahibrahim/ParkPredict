import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SavedCarLocation } from '../../types';
import { 
  X, 
  MapPin, 
  Compass, 
  Navigation, 
  Edit3, 
  Check, 
  Camera, 
  Sparkles, 
  ArrowUp,
  Footprints,
  Clock
} from 'lucide-react';

export const FindMyCarModal: React.FC = () => {
  const { 
    isFindMyCarOpen, 
    setFindMyCarOpen, 
    activeSession, 
    saveCarSpotLocation, 
    parkingLots, 
    showToast 
  } = useApp();

  const savedLoc = activeSession?.savedCarLocation;

  // Edit / Input states
  const [lotName, setLotName] = useState<string>(
    savedLoc?.lotName || activeSession?.lotName || 'VR Mall Smart Deck'
  );
  const [floorLevel, setFloorLevel] = useState<string>(
    savedLoc?.floorLevel || activeSession?.spotFloor || 'Level B1'
  );
  const [sectionPillar, setSectionPillar] = useState<string>(
    savedLoc?.sectionPillar || 'Pillar 4B (Blue Zone)'
  );
  const [spotNumber, setSpotNumber] = useState<string>(
    savedLoc?.spotNumber || activeSession?.spotNumber || 'Bay 14'
  );
  const [notes, setNotes] = useState<string>(
    savedLoc?.notes || 'Parked near Pillar 4B next to the glass express elevator'
  );
  const [isEditing, setIsEditing] = useState<boolean>(!savedLoc);

  if (!isFindMyCarOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const targetLot = parkingLots.find((l) => l.name === lotName) || parkingLots[0];

    const loc: SavedCarLocation = {
      lotId: targetLot.id,
      lotName,
      floorLevel,
      sectionPillar,
      spotNumber,
      notes,
      savedAt: new Date().toISOString(),
      lat: targetLot.coordinates.lat,
      lng: targetLot.coordinates.lng,
    };

    saveCarSpotLocation(loc);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-[#111C2D] rounded-3xl shadow-elevated border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block">
                Vehicle Memory
              </span>
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                Find My Car
              </h3>
            </div>
          </div>
          <button
            onClick={() => setFindMyCarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {!isEditing && savedLoc ? (
            /* Display Saved Location Mode */
            <div className="space-y-4">
              
              {/* Animated Compass Bearing Card */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 text-center relative overflow-hidden">
                <div className="w-14 h-14 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-glow-teal mb-3 animate-pulse-slow">
                  <ArrowUp className="w-7 h-7" />
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Head Straight • 120m Walk
                </div>
                <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400 mt-0.5">
                  Follow green elevator signs to Level {savedLoc.floorLevel}
                </div>
              </div>

              {/* Saved Spot Details */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Facility</span>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {savedLoc.lotName}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Floor</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{savedLoc.floorLevel}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Section</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{savedLoc.sectionPillar}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Bay Number</span>
                    <span className="font-bold text-brandTeal text-sm">{savedLoc.spotNumber}</span>
                  </div>
                </div>

                {savedLoc.notes && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Notes & Landmark</span>
                    <p className="text-slate-600 dark:text-slate-300 italic">
                      "{savedLoc.notes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Update Location</span>
                </button>

                <button
                  onClick={() => {
                    showToast('Opening walking navigation path...', 'info');
                    window.open(`https://maps.google.com/?q=${savedLoc.lat || 13.085},${savedLoc.lng || 80.198}`, '_blank');
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-brandTeal hover:bg-brandTeal-hover text-white text-xs font-bold transition-all shadow-glow-teal flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Open Compass</span>
                </button>
              </div>

            </div>
          ) : (
            /* Input / Edit Location Form */
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                  Parking Facility
                </label>
                <input
                  type="text"
                  value={lotName}
                  onChange={(e) => setLotName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandTeal"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                    Floor / Level
                  </label>
                  <input
                    type="text"
                    value={floorLevel}
                    onChange={(e) => setFloorLevel(e.target.value)}
                    placeholder="e.g. Basement 1, Floor 3"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandTeal"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                    Pillar / Zone
                  </label>
                  <input
                    type="text"
                    value={sectionPillar}
                    onChange={(e) => setSectionPillar(e.target.value)}
                    placeholder="e.g. Pillar 4B / Blue Zone"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandTeal"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                  Spot / Bay Number
                </label>
                <input
                  type="text"
                  value={spotNumber}
                  onChange={(e) => setSpotNumber(e.target.value)}
                  placeholder="e.g. Bay B-14"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandTeal"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                  Notes & Landmarks
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Near cinema elevator, orange painted post"
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandTeal"
                />
              </div>

              <div className="pt-2 flex gap-2">
                {savedLoc && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-brandTeal hover:bg-brandTeal-hover text-white font-bold shadow-glow-teal transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Location Pin</span>
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
