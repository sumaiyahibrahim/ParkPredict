import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ParkingLot } from '../../types';
import { useApp } from '../../context/AppContext';
import { GeoService, RouteInfo } from '../../services/map/GeoService';
import { 
  Plus, 
  Minus, 
  Navigation, 
  Layers, 
  Maximize2, 
  Compass, 
  MapPin, 
  Zap, 
  Clock, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface RealMapViewProps {
  lots: ParkingLot[];
  selectedLot: ParkingLot | null;
  onSelectLot: (lot: ParkingLot) => void;
  destinationCoord: { lat: number; lng: number; label: string };
  onMapClickDestination: (lat: number, lng: number) => void;
  onSearchThisArea?: (centerLat: number, centerLng: number) => void;
  className?: string;
}

export const RealMapView: React.FC<RealMapViewProps> = ({
  lots,
  selectedLot,
  onSelectLot,
  destinationCoord,
  onMapClickDestination,
  onSearchThisArea,
  className = '',
}) => {
  const { preferences, openBookingModal, showToast } = useApp();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);

  const [mapLayerType, setMapLayerType] = useState<'streets' | 'satellite'>('streets');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [showSearchAreaBtn, setShowSearchAreaBtn] = useState<boolean>(false);
  const [lastPanCenter, setLastPanCenter] = useState<{ lat: number; lng: number }>(destinationCoord);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [destinationCoord.lat, destinationCoord.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // CartoDB Voyager tiles (Clean, modern Linear/Apple Maps aesthetic)
    // For Dark Mode, uses CartoDB Dark Matter
    const tileUrl = preferences.darkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Handle Map Clicks Anywhere to choose destination
    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClickDestination(e.latlng.lat, e.latlng.lng);
    });

    // Handle Pan/Move to show "Search this area"
    map.on('moveend', () => {
      const center = map.getCenter();
      const dist = GeoService.calculateDistanceKm(center.lat, center.lng, lastPanCenter.lat, lastPanCenter.lng);
      if (dist > 0.6) {
        setShowSearchAreaBtn(true);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer on Dark Mode or Layer Type Change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    let tileUrl = preferences.darkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    if (mapLayerType === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }

    // Remove existing tile layer and replace
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapInstanceRef.current?.removeLayer(layer);
      }
    });

    L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(mapInstanceRef.current);
  }, [preferences.darkMode, mapLayerType]);

  // Update Destination Marker when destinationCoord changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (destMarkerRef.current) {
      destMarkerRef.current.remove();
    }

    const destIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute -inset-2 bg-blue-500 rounded-full animate-ping opacity-75"></div>
          <div class="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-elevated flex items-center justify-center text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([destinationCoord.lat, destinationCoord.lng], { icon: destIcon })
      .addTo(mapInstanceRef.current)
      .bindTooltip(`📍 Destination: ${destinationCoord.label}`, {
        permanent: false,
        direction: 'top',
        className: 'bg-slate-900 text-white text-xs font-semibold px-2 py-1 rounded-xl shadow-lg border-0',
      });

    destMarkerRef.current = marker;
  }, [destinationCoord]);

  // Update Parking Lot Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    lots.forEach((lot) => {
      const isSelected = selectedLot?.id === lot.id;
      const availableSpots = Math.max(0, lot.totalCapacity - lot.currentOccupancy);
      const availPct = Math.round((availableSpots / lot.totalCapacity) * 100);

      let statusColor = '#10B981'; // Green
      let badgeClass = 'bg-emerald-500 text-white';
      if (availPct < 12) {
        statusColor = '#EF4444'; // Red
        badgeClass = 'bg-rose-500 text-white';
      } else if (availPct < 30) {
        statusColor = '#F59E0B'; // Amber
        badgeClass = 'bg-amber-500 text-white';
      }

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="flex flex-col items-center cursor-pointer transition-transform duration-200 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}">
            <!-- Top Price Pill -->
            <div class="px-2 py-0.5 rounded-full text-[10px] font-black shadow-md border border-white/40 ${isSelected ? 'bg-navy-800 text-white ring-2 ring-brandTeal' : 'bg-slate-900 text-white'} whitespace-nowrap mb-0.5">
              ₹${lot.hourlyRate}
            </div>
            <!-- Pin Body -->
            <div class="relative flex items-center justify-center">
              ${isSelected ? `<div class="absolute -inset-2 rounded-full opacity-40 animate-pulse" style="background-color: ${statusColor}"></div>` : ''}
              <div class="w-7 h-7 rounded-full shadow-elevated border-2 border-white flex items-center justify-center font-bold text-[10px] ${badgeClass}">
                ${availableSpots}
              </div>
            </div>
          </div>
        `,
        iconSize: [44, 48],
        iconAnchor: [22, 48],
      });

      const marker = L.marker([lot.coordinates.lat, lot.coordinates.lng], { icon: customIcon });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectLot(lot);
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [lots, selectedLot]);

  // Draw Route Polyline from Destination to Selected Parking Lot
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    if (selectedLot) {
      const route = GeoService.calculateRoute(
        destinationCoord.lat,
        destinationCoord.lng,
        selectedLot.coordinates.lat,
        selectedLot.coordinates.lng
      );
      setRouteInfo(route);

      const polyline = L.polyline(route.polyline, {
        color: '#0FAF9A',
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(mapInstanceRef.current);

      routeLayerRef.current = polyline;

      // Fit bounds softly to include both points
      const group = L.featureGroup([
        L.marker([destinationCoord.lat, destinationCoord.lng]),
        L.marker([selectedLot.coordinates.lat, selectedLot.coordinates.lng]),
      ]);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.2), { animate: true });
    } else {
      setRouteInfo(null);
    }
  }, [selectedLot, destinationCoord]);

  // Center Map on Destination when destination changes
  useEffect(() => {
    if (mapInstanceRef.current && !selectedLot) {
      mapInstanceRef.current.flyTo([destinationCoord.lat, destinationCoord.lng], 14, {
        duration: 1.2,
      });
      setLastPanCenter(destinationCoord);
    }
  }, [destinationCoord.lat, destinationCoord.lng]);

  // Map Control Actions
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        onMapClickDestination(latitude, longitude);
        mapInstanceRef.current?.flyTo([latitude, longitude], 15, { duration: 1.2 });
        showToast('Centered on your GPS location!', 'success');
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          showToast('Location access is off. You can still search for any location manually.', 'info');
        } else {
          showToast('Unable to retrieve GPS signal. Searching around last known point.', 'warning');
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSearchThisAreaClick = () => {
    if (!mapInstanceRef.current) return;
    const center = mapInstanceRef.current.getCenter();
    setLastPanCenter({ lat: center.lat, lng: center.lng });
    setShowSearchAreaBtn(false);
    if (onSearchThisArea) {
      onSearchThisArea(center.lat, center.lng);
    } else {
      onMapClickDestination(center.lat, center.lng);
    }
    showToast(`Updated parking search for current map area.`, 'info');
  };

  const handleToggleLayer = () => {
    setMapLayerType(mapLayerType === 'streets' ? 'satellite' : 'streets');
  };

  const handleFullscreen = () => {
    if (!mapContainerRef.current) return;
    if (!document.fullscreenElement) {
      mapContainerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className={`relative w-full h-full rounded-3xl overflow-hidden shadow-card border border-slate-200 dark:border-slate-800 ${className}`}>
      
      {/* Real Leaflet Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[440px] z-0" />

      {/* Top Floating "Search This Area" Button */}
      {showSearchAreaBtn && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-top-2">
          <button
            onClick={handleSearchThisAreaClick}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-elevated text-xs font-bold text-slate-800 dark:text-slate-100 hover:text-brandTeal hover:border-brandTeal transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-brandTeal animate-spin-slow" />
            <span>Search This Area</span>
          </button>
        </div>
      )}

      {/* Floating Map Controls Top-Right */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-elevated border border-slate-200 dark:border-slate-800 p-1 flex flex-col">
          <button
            onClick={handleZoomIn}
            className="p-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Zoom In"
            aria-label="Zoom in"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="w-full h-px bg-slate-100 dark:bg-slate-800" />
          <button
            onClick={handleZoomOut}
            className="p-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Locate Me Button */}
        <button
          onClick={handleLocateMe}
          disabled={isLocating}
          className="p-2.5 bg-white dark:bg-slate-900 rounded-2xl shadow-elevated border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          title="Use My Current Location"
          aria-label="Use current location"
        >
          <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
        </button>

        {/* Satellite / Street toggle */}
        <button
          onClick={handleToggleLayer}
          className="p-2.5 bg-white dark:bg-slate-900 rounded-2xl shadow-elevated border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Satellite / Streets Layer"
          aria-label="Toggle map layer"
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={handleFullscreen}
          className="p-2.5 bg-white dark:bg-slate-900 rounded-2xl shadow-elevated border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Fullscreen"
          aria-label="Toggle fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Legend Bottom-Left */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-elevated text-xs space-y-1 hidden sm:block">
        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between gap-3 text-[11px] mb-1">
          <span>Click anywhere to search</span>
          <span className="text-[9px] text-brandTeal uppercase">Simulated Live</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Available (&gt;30%)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Limited (10% - 30%)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Nearly Full (&lt;10%)</span>
        </div>
      </div>

      {/* Bottom Popup Card if lot is selected */}
      {selectedLot && (
        <div className="absolute bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-30 bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-elevated animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-brandTeal uppercase tracking-wider">
                  {selectedLot.area}
                </span>
                {selectedLot.amenities.includes('ev_charging') && (
                  <span className="flex items-center text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                    <Zap className="w-3 h-3 mr-0.5" /> EV Rapid
                  </span>
                )}
              </div>
              <h3 className="font-heading font-bold text-slate-900 dark:text-white text-base truncate">
                {selectedLot.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {selectedLot.address}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xl font-heading font-extrabold text-navy-800 dark:text-white">
                ₹{selectedLot.hourlyRate}<span className="text-xs font-normal text-slate-400">/hr</span>
              </div>
              <span className="text-[10px] text-slate-500 block">
                {routeInfo ? `${routeInfo.walkingMinutes} min walk` : `${selectedLot.walkingMinutesFromCenter} min walk`}
              </span>
            </div>
          </div>

          {/* Real Route & Travel Time Strip */}
          {routeInfo && (
            <div className="mt-3 p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/60 flex items-center justify-between text-xs text-teal-800 dark:text-teal-200">
              <span className="flex items-center gap-1 font-semibold">
                <Navigation className="w-3.5 h-3.5 text-brandTeal" />
                <span>{routeInfo.distanceKm} km away</span>
              </span>
              <span>~{routeInfo.drivingMinutes} min drive • {routeInfo.walkingMinutes} min walk</span>
            </div>
          )}

          {/* Action Row */}
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{Math.max(0, selectedLot.totalCapacity - selectedLot.currentOccupancy)} bays open</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${selectedLot.coordinates.lat},${selectedLot.coordinates.lng}`,
                    '_blank'
                  );
                }}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold"
                title="Open in Google Maps"
              >
                <Navigation className="w-4 h-4 text-blue-500" />
              </button>

              <button
                onClick={() => openBookingModal(selectedLot)}
                className="px-4 py-2 rounded-xl bg-brandTeal hover:bg-brandTeal-hover text-white text-xs font-bold transition-all shadow-glow-teal flex items-center gap-1.5"
              >
                <span>Reserve Bay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
