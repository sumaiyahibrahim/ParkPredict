import React, { useState, useRef, useMemo } from 'react';
import { ParkingLot } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  Plus, 
  Minus, 
  Navigation, 
  Zap, 
  Clock, 
  IndianRupee, 
  ArrowRight, 
  Eye, 
  Layers,
  MapPin
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface InteractiveMapViewProps {
  lots: ParkingLot[];
  selectedLot: ParkingLot | null;
  onSelectLot: (lot: ParkingLot) => void;
  className?: string;
}

export const InteractiveMapView: React.FC<InteractiveMapViewProps> = ({
  lots,
  selectedLot,
  onSelectLot,
  className = '',
}) => {
  const { openBookingModal } = useApp();

  // User simulated location: Anna Nagar Roundtana / Metro (13.0855, 80.2100)
  const userLocation = { lat: 13.0855, lng: 80.2100, label: 'Your Current Location' };

  // Map state
  const [zoom, setZoom] = useState<number>(1.2);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mapTheme, setMapTheme] = useState<'clean' | 'transit'>('clean');

  const containerRef = useRef<HTMLDivElement>(null);

  // Chennai Map Bounding Box
  // Lat: 12.95 to 13.12 (Span: 0.17)
  // Lng: 80.14 to 80.30 (Span: 0.16)
  const minLat = 12.95;
  const maxLat = 13.12;
  const minLng = 80.14;
  const maxLng = 80.30;

  // Convert geo coordinates to SVG coordinate system (0 to 1000 x 0 to 1000)
  const projectCoords = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 1000;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 1000; // Invert Y
    return { x, y };
  };

  const userSvgPos = useMemo(() => projectCoords(userLocation.lat, userLocation.lng), [userLocation]);
  const selectedSvgPos = useMemo(() => (selectedLot ? projectCoords(selectedLot.coordinates.lat, selectedLot.coordinates.lng) : null), [selectedLot]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.3, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.3, 0.8));

  const handleRecenter = () => {
    setZoom(1.2);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[420px] bg-[#EAF2F8] dark:bg-[#0E1726] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-card select-none cursor-grab active:cursor-grabbing ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* SVG Vector Canvas */}
      <svg
        className="w-full h-full"
        viewBox="0 0 1000 1000"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '500px 500px',
          transition: isDragging ? 'none' : 'transform 0.25s ease-out',
        }}
      >
        <defs>
          {/* Subtle Grid Pattern */}
          <pattern id="cityGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-300/40 dark:text-slate-800/60" />
          </pattern>

          {/* Bay of Bengal Ocean Gradient */}
          <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0.5" />
          </linearGradient>

          {/* User Pulse Glow */}
          <filter id="userGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#3B82F6" floodOpacity="0.8" />
          </filter>

          {/* Selected Route Gradient */}
          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#0FAF9A" />
          </linearGradient>
        </defs>

        {/* Background Grid */}
        <rect width="1000" height="1000" fill="url(#cityGrid)" />

        {/* Bay of Bengal Coastline (East Coast: X > 820) */}
        <path
          d="M 860 0 C 850 250, 890 550, 870 1000 L 1000 1000 L 1000 0 Z"
          fill="url(#oceanGrad)"
          className="transition-colors"
        />
        <text x="910" y="480" fill="#0284C7" fontSize="16" fontWeight="bold" letterSpacing="4" transform="rotate(90 910 480)" opacity="0.6">
          BAY OF BENGAL
        </text>

        {/* Cooum & Adyar River Paths */}
        <path
          d="M 0 320 Q 350 360, 520 420 T 870 410"
          fill="none"
          stroke="#93C5FD"
          strokeWidth="12"
          strokeLinecap="round"
          className="dark:stroke-blue-900/60"
        />
        <path
          d="M 0 680 Q 400 660, 600 700 T 870 720"
          fill="none"
          stroke="#93C5FD"
          strokeWidth="10"
          strokeLinecap="round"
          className="dark:stroke-blue-900/60"
        />

        {/* Major Road Arteries & Expressways */}
        {/* 1. Inner Ring Road / 100 Feet Road (North-South west) */}
        <path d="M 360 100 L 360 850" fill="none" stroke="#CBD5E1" strokeWidth="18" className="dark:stroke-slate-800" />
        <path d="M 360 100 L 360 850" fill="none" stroke="#FFFFFF" strokeWidth="10" className="dark:stroke-slate-700/80" />

        {/* 2. Anna Salai / Mount Road (Diagonal) */}
        <path d="M 850 380 Q 600 520, 200 850" fill="none" stroke="#CBD5E1" strokeWidth="22" className="dark:stroke-slate-800" />
        <path d="M 850 380 Q 600 520, 200 850" fill="none" stroke="#FFFFFF" strokeWidth="14" className="dark:stroke-slate-700/80" />

        {/* 3. OMR IT Expressway (South East) */}
        <path d="M 660 700 L 660 1000" fill="none" stroke="#CBD5E1" strokeWidth="18" className="dark:stroke-slate-800" />
        <path d="M 660 700 L 660 1000" fill="none" stroke="#FFFFFF" strokeWidth="10" className="dark:stroke-slate-700/80" />

        {/* 4. Poonamallee High Road (East-West North) */}
        <path d="M 50 300 L 850 300" fill="none" stroke="#CBD5E1" strokeWidth="16" className="dark:stroke-slate-800" />
        <path d="M 50 300 L 850 300" fill="none" stroke="#FFFFFF" strokeWidth="8" className="dark:stroke-slate-700/80" />

        {/* Regional Landmark Labels */}
        <text x="360" y="220" fill="#64748B" fontSize="13" fontWeight="600" textAnchor="middle">Anna Nagar</text>
        <text x="730" y="440" fill="#64748B" fontSize="13" fontWeight="600" textAnchor="middle">Royapettah / EA</text>
        <text x="580" y="580" fill="#64748B" fontSize="13" fontWeight="600" textAnchor="middle">T. Nagar</text>
        <text x="820" y="530" fill="#64748B" fontSize="13" fontWeight="600" textAnchor="middle">Marina Beach</text>
        <text x="500" y="820" fill="#64748B" fontSize="13" fontWeight="600" textAnchor="middle">Velachery</text>
        <text x="660" y="900" fill="#64748B" fontSize="13" fontWeight="600" textAnchor="middle">OMR IT Corridor</text>
        <text x="180" y="860" fill="#64748B" fontSize="13" fontWeight="600" textAnchor="middle">Airport (MAA)</text>

        {/* Animated Navigation Route Preview Line if a lot is selected */}
        {selectedSvgPos && (
          <g>
            <path
              d={`M ${userSvgPos.x} ${userSvgPos.y} Q ${(userSvgPos.x + selectedSvgPos.x) / 2 + 30} ${(userSvgPos.y + selectedSvgPos.y) / 2 - 20}, ${selectedSvgPos.x} ${selectedSvgPos.y}`}
              fill="none"
              stroke="url(#routeGrad)"
              strokeWidth="6"
              strokeDasharray="8 8"
              strokeLinecap="round"
              className="animate-pulse"
            />
            <circle cx={selectedSvgPos.x} cy={selectedSvgPos.y} r="32" fill="#0FAF9A" opacity="0.15" className="animate-ping" />
          </g>
        )}

        {/* User Location Pin */}
        <g transform={`translate(${userSvgPos.x}, ${userSvgPos.y})`}>
          <circle r="18" fill="#3B82F6" opacity="0.25" className="animate-ping" />
          <circle r="9" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="3" filter="url(#userGlow)" />
          <text y="-14" fill="#1D4ED8" fontSize="12" fontWeight="bold" textAnchor="middle" className="dark:fill-blue-300">
            You Are Here
          </text>
        </g>

        {/* Parking Lot Interactive Markers */}
        {lots.map((lot) => {
          const pos = projectCoords(lot.coordinates.lat, lot.coordinates.lng);
          const isSelected = selectedLot?.id === lot.id;
          const availableSpots = lot.totalCapacity - lot.currentOccupancy;
          const availPct = Math.round((availableSpots / lot.totalCapacity) * 100);

          let statusColor = '#10B981'; // Green: Available
          if (availPct < 12) statusColor = '#EF4444'; // Red: Full
          else if (availPct < 30) statusColor = '#F59E0B'; // Amber: Limited

          return (
            <g
              key={lot.id}
              transform={`translate(${pos.x}, ${pos.y})`}
              className="cursor-pointer transition-transform duration-200"
              onClick={(e) => {
                e.stopPropagation();
                onSelectLot(lot);
              }}
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px) ${isSelected ? 'scale(1.2)' : 'scale(1)'}`,
              }}
            >
              {/* Radar pulse for selected lot */}
              {isSelected && (
                <circle r="28" fill={statusColor} opacity="0.2" className="animate-pulse" />
              )}

              {/* Pin Base Shadow */}
              <ellipse cx="0" cy="18" rx="14" ry="4" fill="rgba(0, 0, 0, 0.25)" />

              {/* Marker Body */}
              <path
                d="M 0 16 C -14 0, -16 -8, -16 -18 C -16 -28, -9 -36, 0 -36 C 9 -36, 16 -28, 16 -18 C 16 -8, 14 0, 0 16 Z"
                fill={isSelected ? '#102A43' : '#FFFFFF'}
                stroke={isSelected ? statusColor : '#CBD5E1'}
                strokeWidth={isSelected ? '3.5' : '2'}
                className="transition-colors dark:fill-slate-900"
              />

              {/* Status Dot */}
              <circle cx="0" cy="-22" r="5" fill={statusColor} />

              {/* Price Tag Pill */}
              <rect
                x="-22"
                y="-52"
                width="44"
                height="16"
                rx="8"
                fill={isSelected ? statusColor : '#102A43'}
                className="shadow-sm"
              />
              <text
                x="0"
                y="-40"
                fill="#FFFFFF"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
              >
                ₹{lot.hourlyRate}/h
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Map Controls Top-Right */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-elevated border border-slate-200 dark:border-slate-800 p-1 flex flex-col">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Zoom In"
            aria-label="Zoom in on map"
          >
            <Plus className="w-5 h-5" />
          </button>
          <div className="w-full h-px bg-slate-100 dark:bg-slate-800" />
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Zoom Out"
            aria-label="Zoom out on map"
          >
            <Minus className="w-5 h-5" />
          </button>
        </div>

        {/* Recenter button */}
        <button
          onClick={handleRecenter}
          className="p-2.5 bg-white dark:bg-slate-900 rounded-2xl shadow-elevated border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Center on My Location"
          aria-label="Center on current location"
        >
          <Navigation className="w-5 h-5" />
        </button>

        {/* Layer Toggle */}
        <button
          onClick={() => setMapTheme(mapTheme === 'clean' ? 'transit' : 'clean')}
          className="p-2.5 bg-white dark:bg-slate-900 rounded-2xl shadow-elevated border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Transit Overlay"
          aria-label="Toggle map overlay layer"
        >
          <Layers className="w-5 h-5" />
        </button>
      </div>

      {/* Floating Legend Bottom-Left */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-elevated text-xs space-y-1.5 hidden sm:block">
        <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center justify-between gap-4">
          <span>Live Availability</span>
          <span className="text-[10px] text-brandTeal font-medium">Real-time Stream</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
          <span>Available (&gt;30% open)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
          <span>Limited (10% - 30%)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0" />
          <span>Nearly Full (&lt;10%)</span>
        </div>
      </div>

      {/* Bottom Popup Card if lot is selected */}
      {selectedLot && (
        <div className="absolute bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-20 bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-elevated animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-brandTeal dark:text-teal-400 uppercase tracking-wider">
                  {selectedLot.area}
                </span>
                {selectedLot.amenities.includes('ev_charging') && (
                  <span className="flex items-center text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                    <Zap className="w-3 h-3 mr-0.5" /> EV Hub
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
            <div className="text-right">
              <div className="text-lg font-heading font-extrabold text-navy-800 dark:text-white">
                ₹{selectedLot.hourlyRate}<span className="text-xs font-normal text-slate-400">/hr</span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                {selectedLot.walkingMinutesFromCenter} min walk
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {selectedLot.totalCapacity - selectedLot.currentOccupancy} bays open
              </span>
              <span className="text-slate-400">({selectedLot.totalCapacity} total)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openBookingModal(selectedLot)}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-brandTeal hover:bg-brandTeal-hover text-white text-xs font-bold transition-all shadow-glow-teal"
              >
                <span>Reserve</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
