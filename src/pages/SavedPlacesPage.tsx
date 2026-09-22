import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SavedPlace } from '../types';
import { MapPin, Home, Briefcase, Heart, Plus, Trash2, Compass, ArrowRight, X } from 'lucide-react';

export const SavedPlacesPage: React.FC = () => {
  const { savedPlaces, savePlace, deleteSavedPlace, navigate, setSelectedLot, parkingLots } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SavedPlace['category']>('favorite');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !address.trim()) return;

    savePlace({
      title,
      category,
      address,
      coordinates: { lat: 13.0827, lng: 80.2707 },
      notes,
    });

    setIsAddModalOpen(false);
    setTitle('');
    setAddress('');
    setNotes('');
  };

  const getCategoryIcon = (cat: SavedPlace['category']) => {
    if (cat === 'home') return <Home className="w-5 h-5 text-emerald-500" />;
    if (cat === 'work') return <Briefcase className="w-5 h-5 text-blue-500" />;
    return <Heart className="w-5 h-5 text-rose-500" />;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white">
            Saved Places & Favorites
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pin frequently visited destinations to instantly discover nearby parking and arrival forecasts.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-brandTeal hover:bg-brandTeal-hover text-white text-xs font-bold transition-all shadow-glow-teal flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Save New Place</span>
        </button>
      </div>

      {/* Places Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {savedPlaces.map((place) => (
          <div
            key={place.id}
            className="p-5 rounded-3xl bg-white dark:bg-[#111C2D] border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  {getCategoryIcon(place.category)}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                    {place.title}
                  </h3>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {place.category} destination
                  </span>
                </div>
              </div>

              <button
                onClick={() => deleteSavedPlace(place.id)}
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                title="Remove place"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400 mt-0.5" />
              <span className="truncate">{place.address}</span>
            </p>

            {place.notes && (
              <p className="text-[11px] text-slate-500 italic bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                "{place.notes}"
              </p>
            )}

            <button
              onClick={() => {
                navigate('find');
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brandTeal hover:text-white text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Find Parking Near This Place</span>
            </button>
          </div>
        ))}
      </div>

      {/* Add Place Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[#111C2D] rounded-3xl shadow-elevated border border-slate-200 dark:border-slate-800 overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                Save New Destination
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
                  Place Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Office, Gym, Weekend Mall"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandTeal"
                  required
                />
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandTeal"
                >
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="college">College / University</option>
                  <option value="favorite">Favorite Parking Lot</option>
                  <option value="custom">Other Custom Location</option>
                </select>
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Address / Area
                </label>
                <input
                  type="text"
                  placeholder="e.g. 100 Feet Road, Anna Nagar, Chennai"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandTeal"
                  required
                />
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Personal Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Park near Gate 2 for shortest walk"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandTeal"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-brandTeal hover:bg-brandTeal-hover text-white text-xs font-bold transition-all shadow-glow-teal"
                >
                  Save to My Places
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
