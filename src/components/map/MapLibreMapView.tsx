import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map, Marker, Popup } from 'maplibre-gl';
import { ParkingLot } from '../../types';
import { useApp } from '../../context/AppContext';
import { mapProvider } from '../../services/map/MapProvider';
import { routingProvider, RouteResult, calculateHaversineDistanceKm } from '../../services/map/RoutingProvider';
import { 
  Plus, 
  Minus, 
  Navigation, 
  Layers, 
  Maximize2, 
  MapPin, 
  Zap, 
  Clock, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Info
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface MapLibreMapViewProps {
  lots: ParkingLot[];
  selectedLot: ParkingLot | null;
  onSelectLot: (lot: ParkingLot) => void;
  destinationCoord: { lat: number; lng: number; label: string };
  onMapClickDestination: (lat: number, lng: number) => void;
  onSearchThisArea?: (centerLat: number, centerLng: number) => void;
  className?: string;
}

export const MapLibreMapView: React.FC<MapLibreMapViewProps> = ({
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
  const mapInstanceRef = useRef<Map | null>(null);
  const destinationMarkerRef = useRef<Marker | null>(null);
  const parkingMarkersRef = useRef<Marker[]>([]);
  const activePopupRef = useRef<Popup | null>(null);

  const [mapStyleVariant, setMapStyleVariant] = useState<'voyager' | 'osm'>('voyager');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [showSearchAreaBtn, setShowSearchAreaBtn] = useState<boolean>(false);
  const [lastPanCenter, setLastPanCenter] = useState<{ lat: number; lng: number }>(destinationCoord);
  const [routeInfo, setRouteInfo] = useState<RouteResult | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);

  // Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialStyle = mapProvider.getStyle(preferences.darkMode, mapStyleVariant);

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: initialStyle,
      center: [destinationCoord.lng, destinationCoord.lat],
      zoom: 14.2,
      attributionControl: false,
    });

    map.on('load', () => {
      setIsMapLoaded(true);

      // Initialize route GeoJSON source and layer
      if (!map.getSource('route-source')) {
        map.addSource('route-source', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [],
            },
          },
        });

        map.addLayer({
          id: 'route-line-bg',
          type: 'line',
          source: 'route-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#0F766E',
            'line-width': 7,
            'line-opacity': 0.4,
          },
        });

        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#0FAF9A',
            'line-width': 4.5,
            'line-dasharray': [2, 1],
          },
        });
      }
    });

    // Handle clicking anywhere on the map to choose destination
    map.on('click', (e) => {
      // If clicking directly on a marker, ignore map canvas click
      const originalEvent = e.originalEvent;
      if (originalEvent && (originalEvent.target as HTMLElement).closest('.parking-marker-node')) {
        return;
      }
      onMapClickDestination(e.lngLat.lat, e.lngLat.lng);
    });

    // Handle Pan/Move to detect if "Search This Area" should show
    map.on('moveend', () => {
      const center = map.getCenter();
      const dist = calculateHaversineDistanceKm(center.lat, center.lng, lastPanCenter.lat, lastPanCenter.lng);
      if (dist > 0.6) {
        setShowSearchAreaBtn(true);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      setIsMapLoaded(false);
    };
  }, []);

  // Update map style when dark mode or style variant changes
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapLoaded) return;
    const newStyle = mapProvider.getStyle(preferences.darkMode, mapStyleVariant);
    mapInstanceRef.current.setStyle(newStyle);

    // Re-add route layers after style change
    mapInstanceRef.current.once('styledata', () => {
      const map = mapInstanceRef.current;
      if (!map) return;
      if (!map.getSource('route-source')) {
        map.addSource('route-source', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: routeInfo ? routeInfo.coordinates : [],
            },
          },
        });

        map.addLayer({
          id: 'route-line-bg',
          type: 'line',
          source: 'route-source',
          paint: {
            'line-color': '#0F766E',
            'line-width': 7,
            'line-opacity': 0.4,
          },
        });

        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route-source',
          paint: {
            'line-color': '#0FAF9A',
            'line-width': 4.5,
            'line-dasharray': [2, 1],
          },
        });
      }
    });
  }, [preferences.darkMode, mapStyleVariant]);

  // Update Destination Marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
    }

    const el = document.createElement('div');
    el.className = 'destination-pin-marker cursor-pointer flex items-center justify-center';
    el.innerHTML = `
      <div class="relative flex items-center justify-center">
        <div class="absolute -inset-2.5 bg-blue-500 rounded-full animate-ping opacity-60"></div>
        <div class="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-elevated flex items-center justify-center text-white">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      </div>
    `;

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([destinationCoord.lng, destinationCoord.lat])
      .addTo(mapInstanceRef.current);

    destinationMarkerRef.current = marker;
  }, [destinationCoord.lat, destinationCoord.lng]);

  // Update Parking Lot Markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear old markers
    parkingMarkersRef.current.forEach((m) => m.remove());
    parkingMarkersRef.current = [];

    lots.forEach((lot) => {
      const isSelected = selectedLot?.id === lot.id;
      const availableSpots = Math.max(0, lot.totalCapacity - lot.currentOccupancy);
      const availPct = Math.round((availableSpots / lot.totalCapacity) * 100);

      let statusBg = 'bg-emerald-500';
      let statusBorder = 'border-emerald-400';
      if (availPct < 12) {
        statusBg = 'bg-rose-500';
        statusBorder = 'border-rose-400';
      } else if (availPct < 30) {
        statusBg = 'bg-amber-500';
        statusBorder = 'border-amber-400';
      }

      const el = document.createElement('div');
      el.className = `parking-marker-node flex flex-col items-center cursor-pointer transition-all duration-200 ${
        isSelected ? 'scale-125 z-40' : 'hover:scale-110 z-20'
      }`;

      el.innerHTML = `
        <div class="px-2 py-0.5 rounded-full text-[10px] font-black shadow-md border ${
          isSelected
            ? 'bg-slate-900 text-white border-brandTeal ring-2 ring-brandTeal'
            : 'bg-slate-900/90 text-white border-white/40'
        } whitespace-nowrap mb-0.5 pointer-events-none">
          ₹${lot.hourlyRate}
        </div>
        <div class="relative flex items-center justify-center pointer-events-none">
          ${isSelected ? `<div class="absolute -inset-2 rounded-full opacity-50 animate-pulse ${statusBg}"></div>` : ''}
          <div class="w-7 h-7 rounded-full shadow-elevated border-2 border-white flex items-center justify-center font-bold text-[10px] text-white ${statusBg}">
            ${availableSpots}
          </div>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectLot(lot);

        // Open custom HTML MapLibre popup
        if (activePopupRef.current) {
          activePopupRef.current.remove();
        }

        const popupNode = document.createElement('div');
        popupNode.className = 'w-64 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-elevated text-xs font-sans';
        popupNode.innerHTML = `
          <div class="relative h-24 w-full overflow-hidden bg-slate-800">
            <img src="${lot.images[0] || 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=400&q=80'}" class="w-full h-full object-cover" alt="${lot.name}"/>
            <div class="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-white font-black text-[10px]">
              ₹${lot.hourlyRate}/hr
            </div>
          </div>
          <div class="p-3 space-y-2">
            <div>
              <h4 class="font-heading font-extrabold text-xs text-slate-900 dark:text-white leading-tight">${lot.name}</h4>
              <p class="text-[10px] text-slate-500 dark:text-slate-400 truncate">${lot.address}</p>
            </div>
            <div class="flex items-center justify-between text-[11px] bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg">
              <span class="text-slate-600 dark:text-slate-300">Open Bays:</span>
              <span class="font-bold text-emerald-600 dark:text-emerald-400">${availableSpots} / ${lot.totalCapacity}</span>
            </div>
            <div class="text-[9px] text-slate-400 text-center italic">
              Simulated availability • Demo occupancy
            </div>
            <button id="popup-reserve-btn-${lot.id}" class="w-full py-1.5 rounded-xl bg-brandTeal hover:bg-teal-600 text-white font-bold text-xs shadow-subtle transition-all">
              Reserve Bay
            </button>
          </div>
        `;

        const reserveBtn = popupNode.querySelector(`#popup-reserve-btn-${lot.id}`);
        if (reserveBtn) {
          reserveBtn.addEventListener('click', () => {
            openBookingModal(lot);
          });
        }

        const popup = new maplibregl.Popup({
          offset: [0, -28],
          closeButton: false,
          className: 'custom-maplibre-popup',
        })
          .setDOMContent(popupNode)
          .setLngLat([lot.coordinates.lng, lot.coordinates.lat])
          .addTo(mapInstanceRef.current!);

        activePopupRef.current = popup;
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lot.coordinates.lng, lot.coordinates.lat])
        .addTo(mapInstanceRef.current);

      parkingMarkersRef.current.push(marker);
    });
  }, [lots, selectedLot]);

  // Update Route Polyline with Real OSRM Routing
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapLoaded) return;

    let isCurrent = true;

    const fetchAndRenderRoute = async () => {
      if (!selectedLot) {
        setRouteInfo(null);
        const source = mapInstanceRef.current?.getSource('route-source') as maplibregl.GeoJSONSource | undefined;
        if (source) {
          source.setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [],
            },
          });
        }
        return;
      }

      try {
        const route = await routingProvider.getRoute(
          destinationCoord.lat,
          destinationCoord.lng,
          selectedLot.coordinates.lat,
          selectedLot.coordinates.lng
        );

        if (!isCurrent) return;
        setRouteInfo(route);

        const source = mapInstanceRef.current?.getSource('route-source') as maplibregl.GeoJSONSource | undefined;
        if (source) {
          source.setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: route.coordinates,
            },
          });
        }

        // Fit bounds to show both destination and parking lot
        const bounds = new maplibregl.LngLatBounds();
        bounds.extend([destinationCoord.lng, destinationCoord.lat]);
        bounds.extend([selectedLot.coordinates.lng, selectedLot.coordinates.lat]);
        route.coordinates.forEach((coord) => bounds.extend(coord));

        mapInstanceRef.current?.fitBounds(bounds, {
          padding: 80,
          maxZoom: 16,
          duration: 1000,
        });
      } catch (err) {
        console.warn('Routing preview error:', err);
      }
    };

    fetchAndRenderRoute();

    return () => {
      isCurrent = false;
    };
  }, [selectedLot, destinationCoord.lat, destinationCoord.lng, isMapLoaded]);

  // Fly to destination when coordinates change without selected lot
  useEffect(() => {
    if (mapInstanceRef.current && !selectedLot) {
      mapInstanceRef.current.flyTo({
        center: [destinationCoord.lng, destinationCoord.lat],
        zoom: 14.2,
        duration: 1200,
      });
      setLastPanCenter(destinationCoord);
    }
  }, [destinationCoord.lat, destinationCoord.lng]);

  // Map Controls
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
        mapInstanceRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 15,
          duration: 1200,
        });
        showToast('Centered on your GPS location!', 'success');
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          showToast('Location permission denied. You can still search or click anywhere on the map.', 'info');
        } else {
          showToast('Unable to retrieve GPS signal. Searching around default hub.', 'warning');
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
    showToast('Updated parking search for current map area.', 'info');
  };

  const handleToggleStyle = () => {
    setMapStyleVariant((prev) => (prev === 'voyager' ? 'osm' : 'voyager'));
    showToast(
      mapStyleVariant === 'voyager'
        ? 'Switched to Standard OpenStreetMap Tiles'
        : 'Switched to CARTO Voyager OSM GL Style',
      'info'
    );
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
      
      {/* Real MapLibre GL Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[440px] z-0" />

      {/* Floating Route Preview Pill (Real OSRM Route Data) */}
      {selectedLot && routeInfo && (
        <div className="absolute top-4 left-4 z-20 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-elevated text-xs font-semibold">
            <div className="w-2.5 h-2.5 rounded-full bg-brandTeal animate-pulse" />
            <span className="text-slate-800 dark:text-slate-200 font-bold">
              {routeInfo.distanceKm} km
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-brandTeal" />
              {routeInfo.drivingMinutes} mins driving
            </span>
            <span className="text-[10px] text-teal-600 dark:text-teal-400 uppercase tracking-wider font-bold">
              OSRM
            </span>
          </div>
        </div>
      )}

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

        {/* Tile Style Switcher (Carto Voyager GL vs OpenStreetMap Direct) */}
        <button
          onClick={handleToggleStyle}
          className="p-2.5 bg-white dark:bg-slate-900 rounded-2xl shadow-elevated border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Switch Map Style (OSRM / Carto Voyager)"
          aria-label="Toggle map style"
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

      {/* Floating Bottom Status & Honesty Legend */}
      <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 shadow-elevated text-xs space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="font-bold text-slate-800 dark:text-slate-100 text-[11px] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brandTeal animate-pulse" />
            Click anywhere on map to set destination
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">
            Demo Occupancy
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 pt-0.5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Open &gt;30%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Limited</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Nearly Full</span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span className="text-slate-400 dark:text-slate-500 truncate">
            MapLibre GL &bull; OpenStreetMap &bull; OSRM
          </span>
        </div>
      </div>

    </div>
  );
};
