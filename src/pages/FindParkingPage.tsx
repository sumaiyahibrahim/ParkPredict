import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ParkingLot } from '../types';
import { RecommendationEngine, ScoredParkingLot } from '../services/recommendation/RecommendationEngine';
import { MapLibreMapView } from '../components/map/MapLibreMapView';
import { ParkingCard } from '../components/parking/ParkingCard';
import { ParkingDetailModal } from '../components/parking/ParkingDetailModal';
import { FilterDrawer, FilterState } from '../components/parking/FilterDrawer';
import { defaultParkingProvider } from '../services/parking/ParkingProvider';
import { geocodingProvider } from '../services/map/GeocodingProvider';
import { GeoService } from '../services/map/GeoService';
import { 
  Search, 
  SlidersHorizontal, 
  MapPin, 
  Zap, 
  Clock, 
  IndianRupee, 
  RotateCcw,
  Navigation,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

// Popular Quick Destinations (Pondicherry & Chennai)
const QUICK_DESTINATIONS = [
  { label: '🌊 Rock Beach, Pondy', lat: 11.9345, lng: 79.8362, name: 'Rock Beach Promenade, Puducherry' },
  { label: '🏛️ White Town, Pondy', lat: 11.9338, lng: 79.8359, name: 'French Quarter / White Town, Puducherry' },
  { label: '🌸 Bharathi Park, Pondy', lat: 11.9328, lng: 79.8340, name: 'Bharathi Park, Puducherry' },
  { label: '🛍️ VR Mall, Chennai', lat: 13.0838, lng: 80.1983, name: 'VR Chennai Mall, Anna Nagar' },
  { label: '🏙️ Anna Nagar, Chennai', lat: 13.0850, lng: 80.2100, name: 'Anna Nagar 2nd Avenue, Chennai' },
  { label: '✈️ Chennai Airport', lat: 12.9941, lng: 80.1709, name: 'Chennai International Airport' },
];

export const FindParkingPage: React.FC = () => {
  const { selectedLot, setSelectedLot, preferences, showToast } = useApp();

  // Active Destination Coordinate (Defaults to Puducherry White Town / Rock Beach)
  const [destinationCoord, setDestinationCoord] = useState<{ lat: number; lng: number; label: string }>({
    lat: 11.9338,
    lng: 79.8359,
    label: 'White Town & Rock Beach, Puducherry',
  });

  // Current Dynamic Lots List
  const [loadedLots, setLoadedLots] = useState<ParkingLot[]>([]);
  const [isSearchingLots, setIsSearchingLots] = useState<boolean>(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterDrawer, setActiveFilterDrawer] = useState(false);
  const [detailedLot, setDetailedLot] = useState<ParkingLot | null>(null);

  // Arrival time simulation (+0 mins, +15 mins, +30 mins, +60 mins)
  const [arrivalOffsetMins, setArrivalOffsetMins] = useState<number>(15);

  const [filters, setFilters] = useState<FilterState>({
    maxDistanceKm: 12,
    maxPrice: 150,
    minAvailabilityPct: 0,
    requireEv: false,
    requireCovered: false,
    requireAccessible: false,
    requireSecurity: false,
    sortBy: 'recommended',
  });

  // Quick amenity preset pills
  const [quickFilter, setQuickFilter] = useState<'all' | 'ev' | 'cheap' | 'covered'>('all');

  // Load parking lots whenever destinationCoord changes
  useEffect(() => {
    let isCurrent = true;
    const fetchLots = async () => {
      setIsSearchingLots(true);
      try {
        const lots = await defaultParkingProvider.getParkingLotsAround(destinationCoord.lat, destinationCoord.lng, 10);
        if (isCurrent) {
          setLoadedLots(lots);
          // If previous selected lot is no longer in area, select the first nearby lot
          if (!lots.some((l) => l.id === selectedLot?.id)) {
            setSelectedLot(lots[0] || null);
          }
        }
      } catch (err) {
        console.error('Error fetching parking lots:', err);
      } finally {
        if (isCurrent) setIsSearchingLots(false);
      }
    };

    fetchLots();
    return () => {
      isCurrent = false;
    };
  }, [destinationCoord.lat, destinationCoord.lng]);

  // Handle Search Submission (Supports Natural Language & Geo Queries)
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // Check natural language intent
    const intent = GeoService.parseIntent(query);
    if (intent.requireEv) setQuickFilter('ev');
    if (intent.maxPrice) setFilters((prev) => ({ ...prev, maxPrice: intent.maxPrice! }));

    // Search locations via OpenStreetMap Nominatim Provider
    const places = await geocodingProvider.search(query);
    if (places.length > 0) {
      const topMatch = places[0];
      setDestinationCoord({
        lat: topMatch.lat,
        lng: topMatch.lng,
        label: topMatch.name,
      });
      showToast(`Destination updated to "${topMatch.name}". Showing nearby smart parking.`, 'success');
    } else {
      showToast(`Searching for facilities matching "${query}".`, 'info');
    }
  };

  // Handle Clicking Anywhere on MapLibre Map
  const handleMapClick = async (lat: number, lng: number) => {
    try {
      const geo = await geocodingProvider.reverse(lat, lng);
      setDestinationCoord({
        lat,
        lng,
        label: geo.name ? `${geo.name}, ${geo.city || ''}` : `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      });
      showToast(`Target set to ${geo.name || 'selected coordinate'}. Recalculating parking...`, 'info');
    } catch {
      setDestinationCoord({
        lat,
        lng,
        label: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      });
    }
  };

  // Handle "Search This Area" Map Button
  const handleSearchThisArea = async (lat: number, lng: number) => {
    await handleMapClick(lat, lng);
  };

  // Compute Current Arrival Time string (e.g., "16:45")
  const arrivalTimeString = useMemo(() => {
    const d = new Date(Date.now() + arrivalOffsetMins * 60 * 1000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }, [arrivalOffsetMins]);

  // Compute Scored & Filtered Lots
  const rankedLots: ScoredParkingLot[] = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Apply user preferences to ranking engine with arrival time
    const scored = RecommendationEngine.rankLots(
      loadedLots,
      preferences,
      todayStr,
      arrivalTimeString
    );

    // Filter by search query (text keyword search)
    let filtered = scored.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      if (q.includes('ev') || q.includes('charg')) {
        return item.lot.amenities.includes('ev_charging');
      }
      if (q.includes('cheap') || q.includes('budget')) {
        return item.lot.hourlyRate <= 40;
      }
      if (q.includes('covered')) {
        return item.lot.amenities.includes('covered') || item.lot.type === 'covered_multilevel';
      }

      return (
        item.lot.name.toLowerCase().includes(q) ||
        item.lot.area.toLowerCase().includes(q) ||
        item.lot.address.toLowerCase().includes(q) ||
        item.lot.landmark.toLowerCase().includes(q)
      );
    });

    // Filter by amenities
    if (filters.requireEv || quickFilter === 'ev') {
      filtered = filtered.filter((i) => i.lot.amenities.includes('ev_charging'));
    }
    if (filters.requireCovered || quickFilter === 'covered') {
      filtered = filtered.filter((i) => i.lot.amenities.includes('covered') || i.lot.type === 'covered_multilevel');
    }
    if (quickFilter === 'cheap') {
      filtered = filtered.filter((i) => i.lot.hourlyRate <= 40);
    }
    if (filters.requireAccessible) {
      filtered = filtered.filter((i) => i.lot.amenities.includes('accessible'));
    }
    if (filters.requireSecurity) {
      filtered = filtered.filter((i) => i.lot.amenities.includes('security_guard'));
    }

    // Filter by max price
    filtered = filtered.filter((i) => i.lot.hourlyRate <= filters.maxPrice);

    // Apply Sorting
    if (filters.sortBy === 'distance') {
      filtered.sort((a, b) => a.lot.walkingMinutesFromCenter - b.lot.walkingMinutesFromCenter);
    } else if (filters.sortBy === 'price') {
      filtered.sort((a, b) => a.lot.hourlyRate - b.lot.hourlyRate);
    } else if (filters.sortBy === 'availability') {
      filtered.sort((a, b) => b.currentAvailable - a.currentAvailable);
    } else {
      // AI Recommendation Score
      filtered.sort((a, b) => b.score - a.score);
    }

    // Flag top match
    if (filtered.length > 0) {
      filtered.forEach((item, index) => {
        item.isBestMatch = index === 0;
      });
    }

    return filtered;
  }, [loadedLots, preferences, searchQuery, filters, quickFilter, arrivalTimeString]);

  const handleResetFilters = () => {
    setFilters({
      maxDistanceKm: 12,
      maxPrice: 150,
      minAvailabilityPct: 0,
      requireEv: false,
      requireCovered: false,
      requireAccessible: false,
      requireSecurity: false,
      sortBy: 'recommended',
    });
    setQuickFilter('all');
    setSearchQuery('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      
      {/* Search Bar & Destination Quick Chips */}
      <div className="space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Main Search Input */}
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search destination anywhere (e.g. 'Rock Beach', 'White Town', 'Anna Nagar', 'Bengaluru')..."
              className="w-full bg-white dark:bg-[#111C2D] border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-20 py-3 text-xs sm:text-sm text-slate-900 dark:text-white shadow-subtle focus:outline-none focus:ring-2 focus:ring-brandTeal placeholder:text-slate-400 transition-colors"
            />
            <div className="absolute right-2.5 top-2 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-2 py-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Clear
                </button>
              )}
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-brandTeal hover:bg-teal-600 text-white text-xs font-bold transition-all shadow-glow-teal"
              >
                Find
              </button>
            </div>
          </div>

          {/* Quick Filter Buttons & Filter Drawer Trigger */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setQuickFilter(quickFilter === 'ev' ? 'all' : 'ev')}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border ${
                quickFilter === 'ev'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                  : 'bg-white dark:bg-[#111C2D] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              <span>EV Hubs</span>
            </button>

            <button
              type="button"
              onClick={() => setQuickFilter(quickFilter === 'cheap' ? 'all' : 'cheap')}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border ${
                quickFilter === 'cheap'
                  ? 'bg-brandTeal/10 border-brandTeal text-brandTeal dark:text-teal-300'
                  : 'bg-white dark:bg-[#111C2D] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <IndianRupee className="w-3.5 h-3.5 text-brandTeal" />
              <span>Under ₹40</span>
            </button>

            <button
              type="button"
              onClick={() => setQuickFilter(quickFilter === 'covered' ? 'all' : 'covered')}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border ${
                quickFilter === 'covered'
                  ? 'bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-300'
                  : 'bg-white dark:bg-[#111C2D] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>Covered</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterDrawer(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#111C2D] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 text-xs font-semibold shadow-subtle"
              title="All Filters"
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <span>Filters</span>
            </button>
          </div>
        </form>

        {/* Quick Destination Location Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-slate-400 dark:text-slate-500 font-semibold whitespace-nowrap flex items-center gap-1">
            <Navigation className="w-3 h-3 text-brandTeal" /> Quick Hubs:
          </span>
          {QUICK_DESTINATIONS.map((dest) => {
            const isActive = Math.abs(destinationCoord.lat - dest.lat) < 0.005 && Math.abs(destinationCoord.lng - dest.lng) < 0.005;
            return (
              <button
                key={dest.label}
                onClick={() => {
                  setDestinationCoord({ lat: dest.lat, lng: dest.lng, label: dest.name });
                  showToast(`Moved destination to ${dest.name}`, 'info');
                }}
                className={`px-3 py-1 rounded-xl whitespace-nowrap font-medium transition-all ${
                  isActive
                    ? 'bg-navy-800 text-white dark:bg-brandTeal dark:text-slate-950 font-bold shadow-subtle'
                    : 'bg-white dark:bg-[#111C2D] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-brandTeal/50'
                }`}
              >
                {dest.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Arrival Time Intelligence Header Strip */}
      <div className="bg-gradient-to-r from-teal-500/10 via-sky-500/5 to-transparent border border-teal-500/20 rounded-2xl p-3 sm:px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brandTeal/10 flex items-center justify-center text-brandTeal shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>Arrival Time Intelligence</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-teal-500/20 text-teal-700 dark:text-teal-300 font-semibold">
                Random Forest Model
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Predictions calculated for arrival at <span className="font-bold text-brandTeal">{arrivalTimeString}</span> ({arrivalOffsetMins === 0 ? 'Now' : `in +${arrivalOffsetMins} mins`})
            </p>
          </div>
        </div>

        {/* Arrival offset buttons */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs self-stretch sm:self-auto justify-center">
          {[
            { label: 'Now', offset: 0 },
            { label: '+15m', offset: 15 },
            { label: '+30m', offset: 30 },
            { label: '+1h', offset: 60 },
          ].map((item) => (
            <button
              key={item.offset}
              onClick={() => setArrivalOffsetMins(item.offset)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                arrivalOffsetMins === item.offset
                  ? 'bg-brandTeal text-white shadow-subtle'
                  : 'text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split-Screen Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Parking Cards Result List */}
        <div className="lg:col-span-6 xl:col-span-5 space-y-4">
          
          <div className="flex items-center justify-between px-1">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>{rankedLots.length} Smart Parking Facilities</span>
                <span className="text-slate-400 font-normal">•</span>
                <span className="text-brandTeal font-semibold">AI Ranked</span>
              </div>
              <span className="text-[11px] text-slate-400 truncate max-w-[280px]">
                Near: {destinationCoord.label}
              </span>
            </div>

            {(searchQuery || quickFilter !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-brandTeal hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>

          {isSearchingLots ? (
            /* Loading Skeleton */
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white dark:bg-[#111C2D] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse space-y-3">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-2/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2" />
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : rankedLots.length === 0 ? (
            /* Empty State */
            <div className="bg-white dark:bg-[#111C2D] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-card">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <h4 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                No facilities match filters in this area
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Click anywhere on the interactive map to inspect another block, or loosen your filter price limits.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-brandTeal text-white text-xs font-bold shadow-glow-teal"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            rankedLots.map((item) => (
              <ParkingCard
                key={item.lot.id}
                lot={item.lot}
                isSelected={selectedLot?.id === item.lot.id}
                onSelect={() => setSelectedLot(item.lot)}
                onViewDetails={() => setDetailedLot(item.lot)}
                isBestMatch={item.isBestMatch}
                recommendationExplanation={item.isBestMatch ? item.explanation : undefined}
                badges={item.badges}
                predictedAvailPct={100 - item.forecast.predictedOccupancyPct}
              />
            ))
          )}

        </div>

        {/* Right Side: MapLibre GL Interactive OpenStreetMap */}
        <div className="lg:col-span-6 xl:col-span-7 sticky top-24 h-[550px] lg:h-[calc(100vh-140px)]">
          <MapLibreMapView
            lots={rankedLots.map((r) => r.lot)}
            selectedLot={selectedLot}
            onSelectLot={(lot) => setSelectedLot(lot)}
            destinationCoord={destinationCoord}
            onMapClickDestination={handleMapClick}
            onSearchThisArea={handleSearchThisArea}
            className="h-full"
          />
        </div>

      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={activeFilterDrawer}
        onClose={() => setActiveFilterDrawer(false)}
        filters={filters}
        onChangeFilters={(newF) => setFilters(newF)}
        onReset={handleResetFilters}
      />

      {/* Detailed Lot Profile Modal */}
      {detailedLot && (
        <ParkingDetailModal
          lot={detailedLot}
          onClose={() => setDetailedLot(null)}
        />
      )}

    </div>
  );
};
