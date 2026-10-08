import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import {
  Search,
  LocateFixed,
  SlidersHorizontal,
  MapPin,
  ChevronDown,
  X,
  Navigation,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  CircleAlert,
  CarFront,
  Menu,
  ArrowLeft,
  ArrowUpRight,
  KeyRound,
  ParkingCircle,
  CircleHelp,
  Settings2,
  Route,
  UserRound,
  Clock3,
  History,
  MapPinned,
  CircleParking,
  ChartNoAxesCombined,
  LogIn,
  TrendingUp,
  Bell,
  Radio,
  House,
} from 'lucide-react';
import {
  reversePlace,
  searchNearbyParking,
  searchPlace,
  type OSMPoint as Point,
  type OSMParkingPlace as Place,
} from './services/openStreetMap';
import { predictAvailability } from './services/predictionEngine';
import { rankParkingLots } from './services/recommendationEngine';
import {
  supabase,
  supabaseAuthConfigured,
  requestSignInCode,
  confirmSignInCode,
  signOutUser,
} from './services/auth';
import { answerParkingQuestion, type CopilotAction } from './services/parkingCopilotService';
import { useSensorFeed } from './services/iot/useSensorFeed';
import { SENSOR_BAY_COUNT } from './services/iot/config';
import { SensorDashboard } from './components/SensorDashboard';
import type { SensorBay } from './services/iot/types';
import { SensorAdminView } from './components/SensorAdminView';
import {
  bayIdFromLabel,
  deriveBayOperations,
  makeBookingPin,
  readDemoBookings,
  readParkingIncidents,
  type DemoBooking,
  type ParkingIncident,
} from './services/bookingOperations';

const DEFAULT: Point = { lat: 11.9346, lon: 79.8355, label: 'White Town, Puducherry' };
const DEMO_LOTS: Place[] = [
  {
    id: 'demo:white-town',
    name: 'White Town · Heritage Parking Demo',
    lat: 11.9346,
    lon: 79.8355,
    tags: {
      capacity: '4',
      amenity: 'parking',
      fee: 'yes',
      hourly_rate: '35',
      'addr:street': 'Rue Dumas',
    },
    distance: 0.1,
  },
  {
    id: 'demo:promenade',
    name: 'Promenade · Beachfront Demo Bay',
    lat: 11.935,
    lon: 79.8412,
    tags: {
      capacity: '18',
      amenity: 'parking',
      fee: 'yes',
      hourly_rate: '45',
      'addr:street': 'Beach Road',
    },
    distance: 0.6,
  },
  {
    id: 'demo:bharathi',
    name: 'Bharathi Park · Central Demo Lot',
    lat: 11.9335,
    lon: 79.8332,
    tags: {
      capacity: '18',
      amenity: 'parking',
      fee: 'yes',
      hourly_rate: '30',
      covered: 'yes',
      ev_charging: 'yes',
      wheelchair: 'yes',
      'addr:street': 'Subbiah Salai',
    },
    distance: 0.3,
  },
  {
    id: 'demo:mission',
    name: 'Mission Street · Heritage Demo Deck',
    lat: 11.9361,
    lon: 79.8326,
    tags: {
      capacity: '18',
      amenity: 'parking',
      fee: 'yes',
      hourly_rate: '40',
      covered: 'yes',
      'addr:street': 'Mission Street',
    },
    distance: 0.5,
  },
  {
    id: 'demo:station',
    name: 'Railway Junction · Demo Parking',
    lat: 11.9267,
    lon: 79.8342,
    tags: {
      capacity: '18',
      amenity: 'parking',
      fee: 'yes',
      hourly_rate: '25',
      ev_charging: 'yes',
      'addr:street': 'Railway Station Road',
    },
    distance: 1.0,
  },
  {
    id: 'demo:botanical',
    name: 'Botanical Garden · Demo Parking Bay',
    lat: 11.929,
    lon: 79.8303,
    tags: {
      capacity: '18',
      amenity: 'parking',
      fee: 'yes',
      hourly_rate: '20',
      'addr:street': 'Maraimalai Adigal Salai',
    },
    distance: 0.9,
  },
  {
    id: 'demo:serenity',
    name: 'Serenity Beach · Sample Parking Area',
    lat: 11.9872,
    lon: 79.8451,
    tags: {
      capacity: '18',
      amenity: 'parking',
      fee: 'yes',
      hourly_rate: '30',
      'addr:street': 'Kottakuppam',
    },
    distance: 6.0,
  },
  {
    id: 'demo:chunnambar',
    name: 'Chunnambar · Sample Visitor Parking',
    lat: 11.885,
    lon: 79.805,
    tags: {
      capacity: '18',
      amenity: 'parking',
      fee: 'yes',
      hourly_rate: '30',
      'addr:street': 'Cuddalore Main Road',
    },
    distance: 7.2,
  },
];
const DEMO_LOT = DEMO_LOTS[0];
function iotApiUrl(path: string) {
  const configured = import.meta.env.VITE_IOT_API_URL?.trim();
  const localHost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const root =
    configured ||
    (localHost
      ? `${location.protocol === 'https:' ? 'https://' : 'http://'}${location.hostname}:8000`
      : '');
  return root ? root.replace(/\/+$/, '') + path : null;
}
const distanceKm = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
  const rad = (v: number) => (v * Math.PI) / 180,
    dl = rad(b.lat - a.lat),
    dn = rad(b.lon - a.lon),
    h = Math.sin(dl / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dn / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};
const stableNumber = (value: string) =>
  Math.abs([...value].reduce((total, char) => (total * 31 + char.charCodeAt(0)) | 0, 7));
const demoSpaces = (id: string, base: number) => {
  const listedIndex = DEMO_LOTS.findIndex((p) => p.id === id);
  const offset = listedIndex >= 0 ? (listedIndex % 5) - 2 : (stableNumber(id) % 7) - 3;
  return Math.max(1, Math.min(18, base + offset));
};
const nearbyPreviewLots = (point: Point, radiusKm: number): Place[] => {
  const names = [
    'Closest Parking Area',
    'City Centre Parking',
    'Visitor Parking Lot',
    'Public Parking Zone',
    'Secure Parking Area',
  ];
  const limit = Math.min(Math.max(radiusKm * 0.78, 0.28), 0.9);
  const seed = stableNumber(`${point.lat.toFixed(4)}:${point.lon.toFixed(4)}`);
  return names
    .map((name, index) => {
      const distance = limit * (0.2 + index * 0.16);
      const angle = (((seed % 360) + index * 73) * Math.PI) / 180;
      const lat = point.lat + (Math.cos(angle) * distance) / 111;
      const lon =
        point.lon +
        (Math.sin(angle) * distance) / (111 * Math.max(0.2, Math.cos((point.lat * Math.PI) / 180)));
      return {
        id: `demo:nearby:${point.lat.toFixed(4)}:${point.lon.toFixed(4)}:${index}`,
        name,
        lat,
        lon,
        tags: {
          capacity: '18',
          amenity: 'parking',
          fee: index % 3 === 0 ? 'no' : 'yes',
          hourly_rate: String(20 + ((seed + index * 7) % 4) * 10),
          'addr:street': 'Near selected destination',
        },
        distance: distanceKm(point, { lat, lon }),
      };
    })
    .filter((place) => place.distance <= radiusKm);
};
type AssistantLine = {
  role: 'assistant' | 'user';
  text: string;
  source?: string;
  action?: CopilotAction;
  time?: string;
};
type ParkingSession = {
  id: string;
  facility: string;
  area: string;
  vehicle: string;
  startedAt: string;
  endedAt?: string;
  plannedEndAt?: string;
  demo: boolean;
};
type DriverProfile = {
  name: string;
  email: string;
  phone: string;
  alerts: boolean;
  localDemo?: boolean;
};
function readProfile(): DriverProfile | null {
  try {
    return JSON.parse(
      localStorage.getItem('parkpredict_driver_profile_v1') || 'null',
    ) as DriverProfile | null;
  } catch {
    return null;
  }
}
function readParkingSessions(): ParkingSession[] {
  try {
    return JSON.parse(
      localStorage.getItem('parkpredict_parking_sessions_v1') || '[]',
    ) as ParkingSession[];
  } catch {
    return [];
  }
}
const durationLabel = (hours: number) =>
  hours < 1 ? `${Math.round(hours * 60)} min` : `${hours} hr${hours === 1 ? '' : 's'}`;
const normalizeRegistration = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9 -]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 15);
const isRegistrationValid = (value: string) =>
  /^[A-Z0-9]{6,13}$/.test(value.replace(/[^A-Z0-9]/g, ''));
const countdownLabel = (endsAt: string | undefined, now: number) => {
  if (!endsAt) return '--:--';
  const seconds = Math.max(0, Math.ceil((Date.parse(endsAt) - now) / 1000));
  const hours = Math.floor(seconds / 3600),
    minutes = Math.floor((seconds % 3600) / 60),
    secs = seconds % 60;
  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};
const ARRIVAL_EARLY_MINUTES = 15,
  ARRIVAL_GRACE_MINUTES = 15,
  OVERSTAY_GRACE_MINUTES = 5,
  OVERSTAY_BLOCK_MINUTES = 15,
  OVERSTAY_FEE_PER_BLOCK = 20,
  BAY_TURNOVER_MINUTES = 5;
const nextBookingTime = () => {
  const date = new Date(Date.now() + 10 * 60_000);
  date.setSeconds(0, 0);
  date.setMinutes(Math.ceil(date.getMinutes() / 5) * 5);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};
const localDateTimeValue = (iso: string) => {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};
const windowsOverlap = (
  firstStart: number,
  firstEnd: number,
  secondStart: number,
  secondEnd: number,
) =>
  firstStart < secondEnd + BAY_TURNOVER_MINUTES * 60_000 &&
  secondStart < firstEnd + BAY_TURNOVER_MINUTES * 60_000;
const overstayFee = (endsAt: string | undefined, now: number) => {
  if (!endsAt) return 0;
  const billable = Math.max(0, now - Date.parse(endsAt) - OVERSTAY_GRACE_MINUTES * 60_000);
  return billable <= 0
    ? 0
    : Math.ceil(billable / (OVERSTAY_BLOCK_MINUTES * 60_000)) * OVERSTAY_FEE_PER_BLOCK;
};
const alertBeforeMs = (durationHours: number) => {
  const minutes = durationHours * 60;
  return (minutes <= 15 ? 2 : minutes <= 30 ? 5 : minutes <= 120 ? 10 : 15) * 60_000;
};
const elapsedLabel = (start: string, end: string | number = Date.now()) => {
  const minutes = Math.max(
    0,
    Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60000),
  );
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
};
const formatKm = (n: number) => (n < 1 ? `${Math.round(n * 1000)} m` : `${n.toFixed(1)} km`);
const amenity = (tags: Record<string, string>) =>
  [
    tags.fee === 'no' ? 'Free parking' : null,
    tags.access === 'yes' ? 'Public access' : null,
    tags.covered === 'yes' ? 'Covered' : null,
    tags.ev_charging === 'yes' ||
    tags.charging === 'yes' ||
    tags['amenity:charging_station'] ||
    tags['socket:type2']
      ? 'EV charging listed'
      : null,
    tags.wheelchair === 'yes' ? 'Accessible' : null,
    tags.charge ? `Listed charge: ${tags.charge}` : null,
    tags.capacity ? `${tags.capacity} spaces tagged` : null,
  ].filter(Boolean) as string[];
const copilotActionLabel = (action: CopilotAction) =>
  (
    ({
      directions: 'Open directions',
      find: 'Open parking search',
      booking: 'Preview booking',
      reservations: 'Open reservations',
      profile: 'Edit vehicle',
      predictions: 'Open forecast',
      activity: 'Open parking timer',
      history: 'Open history',
      extend: 'Extend timer',
      ev: 'Show EV options',
      airport: 'Search airport parking',
    }) satisfies Record<CopilotAction, string>
  )[action];

export default function App() {
  const sensorFeed = useSensorFeed();
  const [point, setPoint] = useState<Point>(DEFAULT),
    [query, setQuery] = useState('Puducherry, India'),
    [places, setPlaces] = useState<Place[]>([]),
    [selected, setSelected] = useState<string | null>(null),
    [radius, setRadius] = useState(0.5),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(''),
    [searched, setSearched] = useState(false),
    [retrievedAt, setRetrievedAt] = useState<Date | null>(null),
    [mapWarning, setMapWarning] = useState(''),
    [panel, setPanel] = useState<
      'home' | 'driver' | 'activity' | 'admin' | 'insights' | 'bookings' | 'auth'
    >(readProfile() ? 'home' : 'auth'),
    [assistant, setAssistant] = useState(false),
    [mobileResults, setMobileResults] = useState(false),
    [notice, setNotice] = useState(''),
    [demoBooking, setDemoBooking] = useState(false),
    [demoTicket, setDemoTicket] = useState(false),
    [demoDuration, setDemoDuration] = useState('2'),
    [demoStartAt, setDemoStartAt] = useState(nextBookingTime),
    [demoBayId, setDemoBayId] = useState(''),
    [vehicleSetup, setVehicleSetup] = useState(false),
    [vehicleType, setVehicleType] = useState(() => {
      try {
        return localStorage.getItem('parkpredict_vehicle_type_v1') || 'Car';
      } catch {
        return 'Car';
      }
    }),
    [vehicleRegistration, setVehicleRegistration] = useState(() => {
      try {
        return localStorage.getItem('parkpredict_vehicle_registration_v1') || '';
      } catch {
        return '';
      }
    }),
    [vehicleProfileError, setVehicleProfileError] = useState(''),
    [demoAvailable, setDemoAvailable] = useState(7),
    [demoUpdatedAt, setDemoUpdatedAt] = useState(() => new Date()),
    [assistantDraft, setAssistantDraft] = useState(''),
    [assistantBusy, setAssistantBusy] = useState(false),
    [assistantLines, setAssistantLines] = useState<AssistantLine[]>([
      {
        role: 'assistant',
        text: 'Hi! I can compare parking options, explain bay status, and help with directions, prices, passes, forecasts, or your parking session.',
        source: 'ParkPilot · live app context',
      },
    ]),
    [parkingSessions, setParkingSessions] = useState<ParkingSession[]>(readParkingSessions),
    [demoBookings, setDemoBookings] = useState<DemoBooking[]>(readDemoBookings),
    [clockNow, setClockNow] = useState(Date.now()),
    [bayLayoutPlace, setBayLayoutPlace] = useState<Place | null>(null),
    [profile, setProfile] = useState<DriverProfile | null>(readProfile),
    [accountOpen, setAccountOpen] = useState(false),
    [authRole, setAuthRole] = useState<'driver' | 'admin' | null>(null),
    [operatorToken, setOperatorToken] = useState(() => {
      try {
        return sessionStorage.getItem('parkpredict_admin_token') || '';
      } catch {
        return '';
      }
    }),
    [operatorUsername, setOperatorUsername] = useState(''),
    [operatorPassword, setOperatorPassword] = useState(''),
    [operatorLoginError, setOperatorLoginError] = useState(''),
    [operatorAuthOpen, setOperatorAuthOpen] = useState(false),
    [operatorBusy, setOperatorBusy] = useState(false),
    [accountName, setAccountName] = useState(''),
    [accountEmail, setAccountEmail] = useState(''),
    [accountPhone, setAccountPhone] = useState(() => {
      try {
        return localStorage.getItem('parkpredict_alert_phone_v1') || '';
      } catch {
        return '';
      }
    }),
    [accountAlerts, setAccountAlerts] = useState(true),
    [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email'),
    [authCode, setAuthCode] = useState(''),
    [authAwaitingCode, setAuthAwaitingCode] = useState(false),
    [authBusy, setAuthBusy] = useState(false),
    [authMessage, setAuthMessage] = useState(''),
    [currentLocation, setCurrentLocation] = useState<{
      lat: number;
      lon: number;
      accuracy: number;
    } | null>(null),
    [locating, setLocating] = useState(false);
  const [parkingIncidents, setParkingIncidents] = useState<ParkingIncident[]>(readParkingIncidents);
  const vehicleDisplay = vehicleRegistration
    ? `${vehicleType} · ${vehicleRegistration}`
    : vehicleType;
  const saveVehicleProfile = () => {
    const registration = normalizeRegistration(vehicleRegistration);
    setVehicleRegistration(registration);
    if (!isRegistrationValid(registration)) {
      setVehicleProfileError('Enter a valid registration number using 6–13 letters and numbers.');
      return;
    }
    setVehicleProfileError('');
    setVehicleSetup(false);
    setNotice('Vehicle profile saved.');
  };
  useEffect(() => {
    if (!places.some((p) => p.id.startsWith('demo:'))) return;
    const timer = window.setInterval(() => {
      setDemoAvailable((n) => Math.max(0, Math.min(18, n + (Math.random() < 0.5 ? -1 : 1))));
      setDemoUpdatedAt(new Date());
    }, 30000);
    return () => window.clearInterval(timer);
  }, [places]);
  useEffect(() => {
    try {
      localStorage.setItem('parkpredict_parking_sessions_v1', JSON.stringify(parkingSessions));
    } catch {
      /* Local history stays optional if storage is unavailable. */
    }
  }, [parkingSessions]);
  useEffect(() => {
    try {
      localStorage.setItem('parkpredict_demo_bookings_v1', JSON.stringify(demoBookings));
    } catch {
      /* Demo booking history is optional. */
    }
  }, [demoBookings]);
  useEffect(() => {
    try {
      localStorage.setItem('parkpredict_parking_incidents_v1', JSON.stringify(parkingIncidents));
    } catch {
      /* Demo incident history is optional. */
    }
  }, [parkingIncidents]);
  useEffect(() => {
    try {
      localStorage.setItem('parkpredict_alert_phone_v1', accountPhone);
    } catch {
      /* Optional local demo notification contact. */
    }
  }, [accountPhone]);
  useEffect(() => {
    try {
      if (profile?.localDemo)
        localStorage.setItem('parkpredict_driver_profile_v1', JSON.stringify(profile));
      else localStorage.removeItem('parkpredict_driver_profile_v1');
    } catch {
      /* Optional browser profile. */
    }
  }, [profile]);
  useEffect(() => {
    try {
      localStorage.setItem('parkpredict_vehicle_type_v1', vehicleType);
      localStorage.setItem('parkpredict_vehicle_registration_v1', vehicleRegistration);
      localStorage.removeItem('parkpredict_vehicle_ev_v1');
      localStorage.removeItem('parkpredict_vehicle_accessible_v1');
    } catch {
      /* Vehicle profile is optional until the driver creates a pass. */
    }
  }, [vehicleType, vehicleRegistration]);
  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const previous = previousDemoAvailability.current;
    if (
      profile?.alerts &&
      places.some((p) => p.id.startsWith('demo:')) &&
      previous <= 0 &&
      demoAvailable > 0
    ) {
      const message = 'Demo update: the sample White Town lot now shows spaces available.';
      setNotice(message);
      if ('Notification' in window && Notification.permission === 'granted')
        new Notification('ParkPredict sample availability', { body: message });
    }
    previousDemoAvailability.current = demoAvailable;
  }, [demoAvailable, profile, places]);
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (alive && user)
        setProfile({
          name: String(user.user_metadata.full_name || ''),
          email: user.email || '',
          phone: user.phone || String(user.user_metadata.phone || ''),
          alerts: true,
          localDemo: false,
        });
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (user)
        setProfile({
          name: String(user.user_metadata.full_name || ''),
          email: user.email || '',
          phone: user.phone || String(user.user_metadata.phone || ''),
          alerts: true,
          localDemo: false,
        });
      else setProfile(readProfile());
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);
  const mapEl = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    markerGroup = useRef<L.MarkerClusterGroup | null>(null),
    searchPointMarker = useRef<L.Marker | null>(null),
    locationMarker = useRef<L.Marker | null>(null),
    locationAccuracy = useRef<L.Circle | null>(null),
    radiusRef = useRef(radius),
    previousDemoAvailability = useRef(demoAvailable),
    searchRequest = useRef(0),
    bayClearSince = useRef<Record<string, number>>({});
  useEffect(() => {
    radiusRef.current = radius;
  }, [radius]);
  useEffect(() => {
    if (panel !== 'driver' || !mapEl.current || map.current) return;
    const m = L.map(mapEl.current, { zoomControl: false, attributionControl: true }).setView(
      [point.lat, point.lon],
      14,
    );
    m.attributionControl.setPrefix(false);
    const tileUrl =
      import.meta.env.VITE_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m);
    if (!window.matchMedia('(max-width: 650px)').matches)
      L.control.zoom({ position: 'bottomright' }).addTo(m);
    markerGroup.current = L.markerClusterGroup({
      chunkedLoading: true,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          className: 'parking-cluster-icon',
          html: `<button type="button" aria-label="Zoom to ${count} parking places">${count}</button>`,
          iconSize: [42, 42],
        });
      },
    });
    m.addLayer(markerGroup.current);
    map.current = m;
    m.on('tileerror', () =>
      setMapWarning(
        'Map tiles could not be loaded. Check the tile provider settings or connection.',
      ),
    );
    m.on('tileload', () => setMapWarning(''));
    m.on('click', (e) => {
      const p = {
        lat: e.latlng.lat,
        lon: e.latlng.lng,
        label: `Map point · ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`,
      };
      setPoint(p);
      setQuery('');
      setSelected(null);
      void runSearch(p, radiusRef.current, true);
    });
    return () => {
      m.remove();
      map.current = null;
      markerGroup.current = null;
      searchPointMarker.current = null;
      locationMarker.current = null;
      locationAccuracy.current = null;
    };
  }, [panel]);

  useEffect(() => {
    if (map.current) map.current.flyTo([point.lat, point.lon], 14, { duration: 0.8 });
  }, [point]);
  useEffect(() => {
    if (!map.current || !searched) return;
    const icon = L.divIcon({
      className: 'search-point-icon',
      html: '<span></span>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    if (searchPointMarker.current) {
      searchPointMarker.current.setLatLng([point.lat, point.lon]);
      searchPointMarker.current.setIcon(icon);
    } else
      searchPointMarker.current = L.marker([point.lat, point.lon], {
        icon,
        title: 'Search point',
        keyboard: false,
        interactive: false,
        zIndexOffset: 1000,
      }).addTo(map.current);
    searchPointMarker.current.getElement()?.setAttribute('aria-label', 'Search point');
    searchPointMarker.current.getElement()?.setAttribute('role', 'img');
  }, [point, searched, panel]);
  useEffect(() => {
    if (!map.current || !currentLocation) return;
    const latlng: L.LatLngExpression = [currentLocation.lat, currentLocation.lon];
    const icon = L.divIcon({
      className: 'user-location-icon',
      html: '<span class="user-location-pulse"></span><span class="user-location-dot"></span>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
    if (locationMarker.current) locationMarker.current.setLatLng(latlng).setIcon(icon);
    else
      locationMarker.current = L.marker(latlng, {
        icon,
        title: 'Your current location',
        zIndexOffset: 2000,
      }).addTo(map.current);
    locationMarker.current.bindTooltip('You are here', {
      direction: 'top',
      offset: [0, -13],
      className: 'user-location-tooltip',
    });
    locationMarker.current.getElement()?.setAttribute('aria-label', 'Your current location');
    if (locationAccuracy.current)
      locationAccuracy.current.setLatLng(latlng).setRadius(currentLocation.accuracy);
    else
      locationAccuracy.current = L.circle(latlng, {
        radius: currentLocation.accuracy,
        color: '#2878d0',
        weight: 1,
        fillColor: '#4b9bff',
        fillOpacity: 0.12,
        interactive: false,
      }).addTo(map.current);
  }, [currentLocation, panel]);
  useEffect(() => {
    markerGroup.current?.clearLayers();
    if (!map.current || !markerGroup.current) return;
    visiblePlaces.forEach((p) => {
      const sample = p.id.startsWith('demo:');
      const sensorSite = p.id === sensorFeed.facilityId;
      const count = sample && !sensorSite ? demoSpaces(p.id, demoAvailable) : 0;
      const bayReadings = sensorFeed.bays.filter((bay) => bay.facilityId === p.id);
      const currentReadings = bayReadings.filter(
        (bay) => bay.state === 'Available' || bay.state === 'Occupied',
      );
      const sensorFree = currentReadings.filter((bay) => bay.state === 'Available').length;
      const sensorOccupied = currentReadings.filter((bay) => bay.state === 'Occupied').length;
      const sensorKnown =
        currentReadings.length === SENSOR_BAY_COUNT &&
        currentReadings.every((bay) => bay.state === 'Available' || bay.state === 'Occupied');
      const status = sensorKnown
        ? sensorFree / currentReadings.length >= 0.6
          ? 'occupancy-open'
          : sensorFree > 0
            ? 'occupancy-busy'
            : 'occupancy-critical'
        : sample && !sensorSite
          ? count / 18 >= 0.6
            ? 'occupancy-open'
            : count / 18 >= 0.25
              ? 'occupancy-busy'
              : 'occupancy-critical'
          : 'occupancy-unknown';
      const html = `<div class="map-pin ${sample ? 'sample-map-pin' : ''} ${sensorKnown ? 'sensor-map-pin' : ''} ${selected === p.id ? 'active' : ''} ${status}"><span>${sensorKnown ? sensorFree : sample && !sensorSite ? count : '?'}</span></div>`;
      const icon = L.divIcon({
        className: 'park-marker',
        html,
        iconSize: [32, 38],
        iconAnchor: [16, 38],
      });
      const marker = L.marker([p.lat, p.lon], { icon });
      marker.on('click', () => {
        setSelected(p.id);
        map.current?.flyTo([p.lat, p.lon], 16);
      });
      markerGroup.current?.addLayer(marker);
      const sensorLabel = sensorKnown
        ? `, ${sensorFree} sensor-reported empty and ${sensorOccupied} occupied bays`
        : '';
      marker
        .getElement()
        ?.setAttribute(
          'aria-label',
          `${sample ? 'Sample lot · ' : ''}${p.name}, ${formatKm(p.distance)} away${sensorLabel}`,
        );
      marker.getElement()?.setAttribute('role', 'button');
    });
  }, [places, selected, demoAvailable, sensorFeed.bays, panel]);
  const runSearch = useCallback(async (p: Point, r: number, reverse = false) => {
    const requestId = ++searchRequest.current;
    setLoading(true);
    setError('');
    setSearched(true);
    setRetrievedAt(null);
    setSelected(null);
    setPoint(p);
    const localSamples =
      distanceKm(p, DEFAULT) <= 25
        ? DEMO_LOTS.map((lot) => ({ ...lot, distance: distanceKm(p, lot) })).filter(
            (lot) => lot.distance <= r,
          )
        : [];
    const instantOptions = nearbyPreviewLots(p, r);
    const immediate = [...localSamples, ...instantOptions].sort((a, b) => a.distance - b.distance);
    setPlaces(immediate);
    setSelected(window.matchMedia('(min-width: 651px)').matches ? immediate[0]?.id || null : null);
    setLoading(false);
    if (reverse)
      void reversePlace(p)
        .then((center) => {
          if (searchRequest.current === requestId) setPoint(center);
        })
        .catch(() => {});
    try {
      const { places: out, retrievedAt: retrieved } = await searchNearbyParking(p, r);
      if (searchRequest.current !== requestId) return;
      setRetrievedAt(retrieved);
      const combined = [...out, ...immediate].sort((a, b) => a.distance - b.distance);
      setPlaces(combined);
      setSelected((current) =>
        current && combined.some((place) => place.id === current)
          ? current
          : window.matchMedia('(min-width: 651px)').matches
            ? combined[0]?.id || null
            : null,
      );
    } catch {
      if (searchRequest.current === requestId) {
        setPlaces(immediate);
        setSelected(
          (current) =>
            current ||
            (window.matchMedia('(min-width: 651px)').matches ? immediate[0]?.id || null : null),
        );
      }
    } finally {
      if (searchRequest.current === requestId) setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (panel === 'driver' && !searched && !loading) void runSearch(point, radius);
  }, [panel, searched, loading, runSearch, point, radius]);
  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    const q = query.trim().toLowerCase();
    const normalized = (value: string) =>
      value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    const demoMatch = DEMO_LOTS.find(
      (lot) =>
        normalized(lot.name.split('·')[0].trim()).includes(q) ||
        q.includes(normalized(lot.name.split('·')[0].trim())) ||
        normalized(lot.tags['addr:street'] || '').includes(q) ||
        q.includes(normalized(lot.tags['addr:street'] || '~')),
    );
    const isPondicherry = /puducherry|pondicherry|pondy/.test(q);
    if (demoMatch || isPondicherry) {
      const lot = demoMatch || DEMO_LOT;
      setQuery('');
      await runSearch(
        { lat: lot.lat, lon: lot.lon, label: lot.name.split('·')[0].trim() + ', Puducherry' },
        radius,
      );
      return;
    }
    setLoading(true);
    setError('');
    setRetrievedAt(null);
    setSearched(true);
    try {
      const p = await searchPlace(query.trim());
      if (!p) {
        setPlaces([]);
        setError('We couldn’t find that place. Try a nearby landmark or full address.');
        setLoading(false);
        return;
      }
      setQuery('');
      await runSearch(p, radius);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Place lookup failed.');
    } finally {
      setLoading(false);
    }
  };
  const radiusChange = (n: number) => {
    setRadius(n);
    if (searched) void runSearch(point, n);
  };
  const useLocation = () => {
    if (!window.isSecureContext) {
      setError(
        'Phone location requires a secure HTTPS page. Open the published ParkPredict site, then allow location access.',
      );
      return;
    }
    if (!navigator.geolocation) {
      setError('Location is unavailable in this browser. Search for a destination instead.');
      return;
    }
    setLocating(true);
    setError('');
    const applyPosition = (pos: GeolocationPosition) => {
      setLocating(false);
      const nextLocation = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      };
      setCurrentLocation(nextLocation);
      const p = { lat: nextLocation.lat, lon: nextLocation.lon, label: 'Your current location' };
      setQuery('');
      void runSearch(p, radius, true);
    };
    const finalError = (err: GeolocationPositionError) => {
      setLocating(false);
      setError(
        err.code === err.PERMISSION_DENIED
          ? 'Location permission is blocked. Allow location for ParkPredict in your browser settings, then try again.'
          : err.code === err.TIMEOUT
            ? 'Location took too long. Turn on phone location and precise location, then try again.'
            : 'Your phone could not determine its location. Turn on location services or search for a destination.',
      );
    };
    navigator.geolocation.getCurrentPosition(
      applyPosition,
      (firstError) => {
        if (firstError.code === firstError.PERMISSION_DENIED) {
          finalError(firstError);
          return;
        }
        navigator.geolocation.getCurrentPosition(applyPosition, finalError, {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 300000,
        });
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };
  const currentParking = parkingSessions.find((s) => !s.endedAt);
  const startParking = (place: Place, durationHours = Number(demoDuration)) => {
    if (currentParking) {
      setNotice('You already have an active parking timer.');
      setPanel('activity');
      return;
    }
    const demo = place.id.startsWith('demo:');
    const startedAt = new Date();
    const session: ParkingSession = {
      id: `park-${Date.now()}`,
      facility: place.name,
      area: demo ? `${place.tags['addr:street'] || 'Puducherry'}, Puducherry` : point.label,
      vehicle: vehicleDisplay,
      startedAt: startedAt.toISOString(),
      plannedEndAt: new Date(startedAt.getTime() + durationHours * 3600000).toISOString(),
      demo,
    };
    setParkingSessions((sessions) => [session, ...sessions]);
    setNotice(
      demo
        ? 'Demo timer started. This is a sample session, not confirmation you parked at the location.'
        : 'Parking timer started. This is your self-reported parking location.',
    );
    setPanel('activity');
  };
  const endParking = (id: string) =>
    setParkingSessions((sessions) =>
      sessions.map((s) => (s.id === id ? { ...s, endedAt: new Date().toISOString() } : s)),
    );
  const extendParking = (id: string) =>
    setParkingSessions((sessions) =>
      sessions.map((s) =>
        s.id === id
          ? {
              ...s,
              plannedEndAt: new Date(
                Math.max(Date.now(), new Date(s.plannedEndAt || Date.now()).getTime()) + 3600000,
              ).toISOString(),
            }
          : s,
      ),
    );
  const completeBooking = (id: string, reason: 'sensor-cleared' | 'manual-no-sensor') => {
    const completedAt = new Date().toISOString();
    setDemoBookings((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'completed',
              arrivalStatus: 'completed',
              operationalStatus: 'completed',
              completedAt,
              completionReason: reason,
              overstayFee: overstayFee(item.parkingEndsAt, Date.now()),
            }
          : item,
      ),
    );
    setNotice(
      reason === 'sensor-cleared'
        ? 'Vehicle departure confirmed by the bay sensor. Parking is complete.'
        : 'Parking completed without bay-sensor verification.',
    );
  };
  const endBookingParking = (id: string) => {
    const booking = demoBookings.find((item) => item.id === id);
    if (!booking) return;
    const bay = sensorFeed.bays.find(
      (item) => item.facilityId === booking.lotId && item.bayId === bayIdFromLabel(booking.bay),
    );
    if (!bay) {
      completeBooking(id, 'manual-no-sensor');
      return;
    }
    if (bay.state === 'Available' && bay.sensorReady && bay.deviceOnline) {
      completeBooking(id, 'sensor-cleared');
      return;
    }
    const requestedAt = new Date().toISOString();
    setDemoBookings((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              exitRequestedAt: requestedAt,
              operationalStatus:
                bay.state === 'Occupied' ? 'exit-requested' : 'verification-pending',
            }
          : item,
      ),
    );
    setNotice(
      bay.state === 'Occupied'
        ? 'Vehicle still detected. Remove it from the bay to complete parking.'
        : 'The bay reading is unavailable. Parking remains active until the sensor confirms the bay is clear.',
    );
  };
  const extendBookingParking = (id: string) => {
    const booking = demoBookings.find((item) => item.id === id);
    if (!booking?.parkingEndsAt) return;
    const oldEnd = Date.parse(booking.parkingEndsAt);
    const newEnd = Math.max(Date.now(), oldEnd) + 15 * 60_000;
    const conflict = demoBookings.some(
      (item) =>
        item.id !== id &&
        item.lotId === booking.lotId &&
        item.bay === booking.bay &&
        item.status === 'upcoming' &&
        windowsOverlap(
          Date.parse(item.scheduledStart),
          Date.parse(item.scheduledEnd),
          oldEnd,
          newEnd,
        ),
    );
    if (conflict) {
      setNotice('This session cannot be extended because another reservation follows it.');
      return;
    }
    const addedHours = (newEnd - oldEnd) / 3_600_000;
    const hourlyRate = booking.duration > 0 ? booking.total / booking.duration : 0;
    setDemoBookings((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              duration: item.duration + addedHours,
              total: Math.round(item.total + hourlyRate * addedHours),
              parkingEndsAt: new Date(newEnd).toISOString(),
              scheduledEnd: new Date(newEnd).toISOString(),
              operationalStatus: 'checked-in',
              overstayStartedAt: undefined,
              overstayFee: 0,
            }
          : item,
      ),
    );
    setNotice('Parking extended by 15 minutes. The updated sample price is shown on the pass.');
  };
  const sendBrowserNotification = (title: string, body: string) => {
    if (!(profile?.alerts ?? accountAlerts) || !('Notification' in window)) return;
    if (Notification.permission === 'granted') new Notification(title, { body });
    else if (Notification.permission === 'default')
      void Notification.requestPermission().then((permission) => {
        if (permission === 'granted') new Notification(title, { body });
      });
  };
  const notifyDemoBooking = (reference: string, facility: string, scheduledStart: string) => {
    const time = new Date(scheduledStart).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const body = `Your booking ${reference} is reserved at ${facility} for ${time}. Open Parking passes to view the arrival PIN.`;
    setNotice(`Booking ${reference} reserved for ${time}.`);
    sendBrowserNotification('ParkPredict · Parking booking ready', body);
  };
  const flagBookingConflict = (bookingId: string) => {
    const booking = demoBookings.find((item) => item.id === bookingId);
    if (
      !booking ||
      booking.status !== 'upcoming' ||
      booking.arrivalStatus === 'checked-in' ||
      parkingIncidents.some((item) => item.bookingId === bookingId)
    )
      return;
    const originalBayId = bayIdFromLabel(booking.originalBay || booking.bay);
    const reservedByOthers = new Set(
      demoBookings
        .filter(
          (item) =>
            item.id !== booking.id &&
            item.status === 'upcoming' &&
            item.lotId === booking.lotId &&
            windowsOverlap(
              Date.parse(booking.scheduledStart),
              Date.parse(booking.scheduledEnd),
              Date.parse(item.scheduledStart),
              Date.parse(item.scheduledEnd),
            ),
        )
        .map((item) => bayIdFromLabel(item.bay)),
    );
    const candidates = sensorFeed.bays
      .filter(
        (bay) =>
          bay.facilityId === booking.lotId &&
          bay.state === 'Available' &&
          bay.sensorReady &&
          bay.deviceOnline &&
          bay.bayId !== originalBayId &&
          !reservedByOthers.has(bay.bayId),
      )
      .sort((a, b) => {
        const original = Number(originalBayId.replace(/\D/g, ''));
        const rank = (id: string) => {
          const value = Number(id.replace(/\D/g, ''));
          return value > original ? value - original : 100 + value;
        };
        return rank(a.bayId) - rank(b.bayId);
      });
    const replacementBayId = candidates[0]?.bayId;
    const now = new Date().toISOString();
    const incidentId = `INC-${Date.now().toString().slice(-8)}`;
    const message = replacementBayId
      ? `${originalBayId} was occupied before your check-in. Your booking has been moved to ${replacementBayId}; price and duration are unchanged.`
      : `${originalBayId} was occupied before your check-in. The operator has been alerted and will assign another bay.`;
    const incident: ParkingIncident = {
      id: incidentId,
      bookingId: booking.id,
      reference: booking.reference,
      facility: booking.lotId || sensorFeed.facilityId,
      bayId: originalBayId,
      replacementBayId,
      detectedAt: now,
      status: 'open',
      reason: 'reserved-bay-occupied-before-check-in',
      operatorNotified: true,
      bookingHolderNotified: true,
      originalDuration: booking.duration,
      originalPrice: booking.total,
    };
    setParkingIncidents((items) => [incident, ...items]);
    setDemoBookings((items) =>
      items.map((item) =>
        item.id === booking.id
          ? {
              ...item,
              bay: replacementBayId ? `Bay ${replacementBayId}` : item.bay,
              operationalStatus: replacementBayId ? 'reassigned' : 'conflict',
              conflictAt: now,
              incidentId,
              notificationMessage: message,
            }
          : item,
      ),
    );
    setNotice(message);
    sendBrowserNotification('ParkPredict · Bay reassigned', message);
  };
  const confirmBookingArrival = (bookingId: string, pin: string) => {
    const booking = demoBookings.find((item) => item.id === bookingId);
    if (!booking || booking.status !== 'upcoming') return false;
    if (pin.trim() !== booking.pin) {
      setNotice('Incorrect PIN. Check the four-digit PIN on this booking and try again.');
      return false;
    }
    const now = Date.now(),
      start = Date.parse(booking.scheduledStart);
    if (now < start - ARRIVAL_EARLY_MINUTES * 60_000) {
      setNotice(`Check-in opens ${ARRIVAL_EARLY_MINUTES} minutes before the reserved time.`);
      return false;
    }
    if (now > start + ARRIVAL_GRACE_MINUTES * 60_000) {
      setNotice('The arrival grace period has ended. This pass can no longer be checked in.');
      return false;
    }
    const activeBooking = demoBookings.find(
      (item) =>
        item.id !== bookingId && item.status === 'upcoming' && item.arrivalStatus === 'checked-in',
    );
    if (activeBooking) {
      setNotice(
        `You are already checked in at ${activeBooking.facility}. Complete that parking session before checking in elsewhere.`,
      );
      return false;
    }
    const checkedInAt = new Date(now).toISOString();
    const parkingEndsAt = booking.scheduledEnd;
    setDemoBookings((items) =>
      items.map((item) =>
        item.id === bookingId
          ? {
              ...item,
              arrivalStatus: 'checked-in',
              arrivalMethod: 'booking-pin',
              checkedInAt,
              parkingEndsAt,
              operationalStatus: 'checked-in',
              notificationMessage: undefined,
            }
          : item,
      ),
    );
    setNotice(
      `${bayIdFromLabel(booking.bay)} check-in confirmed. Parking is reserved until ${new Date(parkingEndsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`,
    );
    sendBrowserNotification(
      'ParkPredict · Parking started',
      `You are checked in at ${booking.facility}. Your reserved time ends at ${new Date(parkingEndsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`,
    );
    return true;
  };
  const createDemoBooking = () => {
    const phone = profile?.phone || accountPhone.trim();
    const start = Date.parse(demoStartAt),
      duration = Number(demoDuration),
      end = start + duration * 3_600_000;
    if (!isRegistrationValid(vehicleRegistration)) {
      setVehicleProfileError('Add a valid registration number before creating a pass.');
      setDemoBooking(false);
      setVehicleSetup(true);
      return;
    }
    if (!phone) {
      setNotice('Enter a phone number in the booking form to create the confirmation preview.');
      return;
    }
    if (!Number.isFinite(start) || start < Date.now() - 60_000) {
      setNotice('Choose a future arrival time.');
      return;
    }
    if (start > Date.now() + 30 * 24 * 3_600_000) {
      setNotice('Demo reservations can be scheduled up to 30 days ahead.');
      return;
    }
    const personalConflict = demoBookings.some(
      (item) =>
        item.status === 'upcoming' &&
        windowsOverlap(start, end, Date.parse(item.scheduledStart), Date.parse(item.scheduledEnd)),
    );
    if (personalConflict) {
      setNotice('This time overlaps another reservation on your account. Choose a different time.');
      return;
    }
    const lot = bookingLot;
    if (!selectedDemoBay || !bookingBayOptions.includes(selectedDemoBay)) {
      setNotice('That bay is not available for the selected time. Choose another bay.');
      return;
    }
    const total = Math.max(1, Math.round((Number(lot.tags.hourly_rate) || 40) * duration));
    const id = `PP-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now().toString().slice(-5)}`;
    const bay = 'Bay ' + selectedDemoBay;
    const facility = lot.name;
    const scheduledStart = new Date(start).toISOString(),
      scheduledEnd = new Date(end).toISOString();
    const booking: DemoBooking = {
      id,
      reference: id,
      facility,
      lotId: lot.id,
      bay,
      originalBay: bay,
      vehicle: vehicleDisplay,
      duration,
      total,
      createdAt: new Date().toISOString(),
      scheduledStart,
      scheduledEnd,
      status: 'upcoming',
      demo: true,
      pin: makeBookingPin(id),
      arrivalStatus: 'pending',
      operationalStatus: 'reserved',
    };
    setDemoBookings((items) => [booking, ...items]);
    setDemoTicket(true);
    notifyDemoBooking(id, facility, scheduledStart);
  };
  const askAssistant = (question = assistantDraft) => {
    const q = question.trim();
    if (!q || assistantBusy) return;
    setAssistantDraft('');
    setAssistantLines((lines) => [
      ...lines,
      { role: 'user', text: q, time: new Date().toISOString() },
    ]);
    setAssistantBusy(true);
    window.setTimeout(() => {
      const monitored = sensorFeed.bays.filter((bay) => bay.facilityId === sensorFeed.facilityId);
      const assistantPlaces = visiblePlaces.slice(0, 12).map((place) => {
        const readings = sensorFeed.bays.filter((bay) => bay.facilityId === place.id);
        const free = readings.filter((bay) => bay.state === 'Available').length;
        const known = readings.filter(
          (bay) => bay.state === 'Available' || bay.state === 'Occupied',
        ).length;
        const sample = place.id.startsWith('demo:');
        const rate = Number(place.tags.hourly_rate);
        return {
          name: place.name,
          distanceKm: place.distance,
          pricePerHour: Number.isFinite(rate) ? rate : null,
          free: place.tags.fee === 'no',
          availability:
            place.id === sensorFeed.facilityId && known
              ? `${free} of ${SENSOR_BAY_COUNT} bays available`
              : sample
                ? `${demoSpaces(place.id, demoAvailable)} of 18 sample spaces available`
                : 'Live occupancy not reported',
          source:
            place.id === sensorFeed.facilityId
              ? ('sensor' as const)
              : sample
                ? ('sample' as const)
                : ('mapped' as const),
        };
      });
      const response = answerParkingQuestion(q, {
        location: point.label,
        radiusKm: radius,
        available: demoAvailable,
        capacity: 18,
        vehicle: vehicleDisplay,
        ev: false,
        accessible: false,
        activeParking:
          Boolean(currentParking) ||
          demoBookings.some(
            (item) => item.status === 'upcoming' && item.arrivalStatus === 'checked-in',
          ),
        savedSessions: parkingSessions.length,
        savedBookings: demoBookings.filter((item) => item.status === 'upcoming').length,
        mappedPlaces: places.length,
        selectedPlace: places.find((place) => place.id === selected)?.name,
        places: assistantPlaces,
        sensorSummary: {
          mode: sensorFeed.mode,
          available: monitored.filter((bay) => bay.state === 'Available').length,
          occupied: monitored.filter((bay) => bay.state === 'Occupied').length,
          uncertain: monitored.filter((bay) => bay.state === 'Uncertain').length,
          stale: monitored.filter((bay) => bay.state === 'Stale').length,
          total: SENSOR_BAY_COUNT,
          reporting: monitored.filter(
            (bay) =>
              bay.sensorReady &&
              bay.deviceOnline &&
              (bay.state === 'Available' || bay.state === 'Occupied'),
          ).length,
          connected: sensorFeed.connection === 'connected' || sensorFeed.connection === 'demo',
          bays: monitored,
        },
      });
      setAssistantLines((lines) => [
        ...lines,
        {
          role: 'assistant',
          text: response.text,
          source: 'ParkPredict assistant · live app context',
          action: response.action,
          time: new Date().toISOString(),
        },
      ]);
      setAssistantBusy(false);
    }, 180);
  };
  const runCopilotAction = async (action?: CopilotAction) => {
    if (action === 'activity' || action === 'history') {
      setPanel('activity');
      setAssistant(false);
    } else if (action === 'predictions') {
      setPanel('insights');
      setAssistant(false);
    } else if (action === 'find') {
      setPanel('driver');
      setAssistant(false);
    } else if (action === 'directions') {
      const target = places.find((place) => place.id === selected) || places[0];
      if (target) openDirections(target);
      else setNotice('Choose a parking option first.');
    } else if (action === 'reservations') {
      setPanel('bookings');
      setAssistant(false);
    } else if (action === 'profile') {
      setVehicleSetup(true);
      setAssistant(false);
    } else if (action === 'extend') {
      if (currentParking) {
        extendParking(currentParking.id);
        setNotice('Self-reported parking timer extended by one hour.');
      } else setPanel('activity');
    } else if (action === 'ev') {
      setPanel('driver');
      setNotice(
        'EV charger data is not verified in this demo. Check the facility details before travelling.',
      );
      setAssistant(false);
    } else if (action === 'booking') {
      setDemoBooking(true);
      setAssistant(false);
    } else if (action === 'airport') {
      setPanel('home');
      setAssistant(false);
      setLoading(true);
      try {
        const place = await searchPlace('Puducherry Airport');
        if (place) {
          setQuery('');
          await runSearch(place, radius);
        } else setNotice('Puducherry Airport was not found. Try searching manually.');
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'Airport search failed.');
      } finally {
        setLoading(false);
      }
    }
  };
  const active = places.find((p) => p.id === selected);
  const bookingLot = active?.id.startsWith('demo:') ? active : DEMO_LOT;
  const bookingStartMs = Date.parse(demoStartAt),
    bookingDurationHours = Number(demoDuration),
    bookingEndMs = bookingStartMs + bookingDurationHours * 3_600_000;
  const bookedBayIds = new Set(
    demoBookings
      .filter(
        (item) =>
          item.status === 'upcoming' &&
          item.lotId === bookingLot.id &&
          windowsOverlap(
            bookingStartMs,
            bookingEndMs,
            Date.parse(item.scheduledStart),
            Date.parse(item.scheduledEnd),
          ),
      )
      .map((item) => (item.bay || '').replace(/^Bay /, '')),
  );
  const nearArrival = bookingStartMs <= Date.now() + 30 * 60_000;
  const bookingBayOptions =
    bookingLot.id === sensorFeed.facilityId
      ? sensorFeed.bays
          .filter(
            (bay) =>
              bay.facilityId === bookingLot.id &&
              bay.sensorReady &&
              bay.deviceOnline &&
              !bookedBayIds.has(bay.bayId) &&
              (!nearArrival || bay.state === 'Available'),
          )
          .map((bay) => bay.bayId)
      : Array.from(
          { length: Math.min(18, demoSpaces(bookingLot.id, demoAvailable)) },
          (_, index) => 'A-' + String(index + 1).padStart(2, '0'),
        ).filter((bay) => !bookedBayIds.has(bay));
  const selectedDemoBay = bookingBayOptions.includes(demoBayId)
    ? demoBayId
    : bookingBayOptions[0] || '';
  const bayOperations = deriveBayOperations(
    demoBookings,
    parkingIncidents,
    sensorFeed.facilityId,
    clockNow,
  );
  const visiblePlaces = places;
  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const next = {
      name: accountName.trim(),
      email: accountEmail.trim(),
      phone: accountPhone.trim(),
      alerts: accountAlerts,
      localDemo: true,
    };
    setProfile(next);
    setAccountOpen(false);
    setPanel('home');
    setNotice('Profile saved. Welcome to ParkPredict.');
    if (accountAlerts && 'Notification' in window && Notification.permission === 'default')
      void Notification.requestPermission();
  };
  const submitAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseAuthConfigured) {
      saveProfile(e);
      return;
    }
    setAuthBusy(true);
    setAuthMessage('');
    try {
      if (!authAwaitingCode) {
        await requestSignInCode({
          method: authMethod,
          email: accountEmail.trim(),
          phone: accountPhone.trim(),
          name: accountName.trim(),
        });
        setAuthAwaitingCode(true);
        setAuthMessage(
          `A one-time code was requested for your ${authMethod}. Check your inbox or phone.`,
        );
      } else {
        const user = await confirmSignInCode({
          method: authMethod,
          email: accountEmail.trim(),
          phone: accountPhone.trim(),
          token: authCode.trim(),
        });
        if (!user) throw new Error('Verification returned no user.');
        setProfile({
          name: String(user.user_metadata.full_name || accountName.trim()),
          email: user.email || accountEmail.trim(),
          phone: user.phone || accountPhone.trim(),
          alerts: accountAlerts,
          localDemo: false,
        });
        setAccountOpen(false);
        setAuthAwaitingCode(false);
        setAuthCode('');
        setPanel('home');
        setNotice('Signed in. Welcome to ParkPredict.');
      }
    } catch (error) {
      setAuthMessage(
        error instanceof Error
          ? error.message
          : 'Sign-in could not be completed. Check the provider setup and try again.',
      );
    } finally {
      setAuthBusy(false);
    }
  };
  useEffect(() => {
    if (!(profile?.alerts ?? accountAlerts) || !currentParking?.plannedEndAt) return;
    const remaining = new Date(currentParking.plannedEndAt).getTime() - clockNow;
    if (remaining > 0 && remaining <= 10 * 60_000) {
      const key = `parkpredict_expiry_notified_${currentParking.id}_${currentParking.plannedEndAt}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        const message = `Your ${currentParking.demo ? 'demo timer' : 'parking timer'} ends in about 10 minutes.`;
        setNotice(message);
        if ('Notification' in window && Notification.permission === 'granted')
          new Notification('ParkPredict · Parking ends soon', { body: message });
      }
    }
  }, [accountAlerts, profile, currentParking, clockNow]);
  useEffect(() => {
    const late = demoBookings.find(
      (item) =>
        item.status === 'upcoming' &&
        item.arrivalStatus === 'pending' &&
        clockNow > Date.parse(item.scheduledStart) + ARRIVAL_GRACE_MINUTES * 60_000,
    );
    if (!late) return;
    const noShowAt = new Date().toISOString();
    setDemoBookings((items) =>
      items.map((item) =>
        item.id === late.id
          ? { ...item, status: 'no-show', operationalStatus: 'no-show', noShowAt }
          : item,
      ),
    );
    const message = `Reservation ${late.reference} was released because the arrival grace period ended.`;
    setNotice(message);
    sendBrowserNotification('ParkPredict · Reservation released', message);
  }, [clockNow, demoBookings]);
  useEffect(() => {
    const expired = demoBookings.find(
      (item) =>
        item.status === 'upcoming' &&
        item.arrivalStatus === 'checked-in' &&
        item.parkingEndsAt &&
        Date.parse(item.parkingEndsAt) <= clockNow &&
        item.operationalStatus !== 'overstay',
    );
    if (!expired) return;
    const fee = overstayFee(expired.parkingEndsAt, clockNow);
    setDemoBookings((items) =>
      items.map((item) =>
        item.id === expired.id
          ? {
              ...item,
              operationalStatus: 'overstay',
              overstayStartedAt: item.overstayStartedAt || item.parkingEndsAt,
              overstayFee: fee,
            }
          : item,
      ),
    );
    const message = `Reserved time ended at ${expired.facility}. The bay remains occupied; move the vehicle or extend if available.`;
    setNotice(message);
    sendBrowserNotification('ParkPredict · Overstay detected', message);
  }, [clockNow, demoBookings]);
  useEffect(() => {
    const active = demoBookings.filter(
      (item) =>
        item.status === 'upcoming' && item.arrivalStatus === 'checked-in' && item.parkingEndsAt,
    );
    active.forEach((booking) => {
      const fee = overstayFee(booking.parkingEndsAt, clockNow);
      if (fee !== Number(booking.overstayFee || 0))
        setDemoBookings((items) =>
          items.map((item) => (item.id === booking.id ? { ...item, overstayFee: fee } : item)),
        );
      if (sensorFeed.mode !== 'live' || booking.lotId !== sensorFeed.facilityId) return;
      const bay = sensorFeed.bays.find(
        (item) => item.facilityId === booking.lotId && item.bayId === bayIdFromLabel(booking.bay),
      );
      if (bay?.state === 'Available' && bay.sensorReady && bay.deviceOnline) {
        const since = bayClearSince.current[booking.id] || clockNow;
        bayClearSince.current[booking.id] = since;
        if (clockNow - since >= 5_000) completeBooking(booking.id, 'sensor-cleared');
      } else {
        delete bayClearSince.current[booking.id];
        if (
          booking.exitRequestedAt &&
          booking.operationalStatus !== 'verification-pending' &&
          bay &&
          (bay.state === 'Stale' || bay.state === 'Uncertain' || !bay.deviceOnline)
        )
          setDemoBookings((items) =>
            items.map((item) =>
              item.id === booking.id
                ? { ...item, operationalStatus: 'verification-pending' }
                : item,
            ),
          );
      }
    });
  }, [clockNow, demoBookings, sensorFeed.mode, sensorFeed.bays]);
  useEffect(() => {
    const future = demoBookings.find(
      (item) =>
        item.status === 'upcoming' &&
        item.arrivalStatus === 'pending' &&
        Date.parse(item.scheduledStart) > clockNow &&
        Date.parse(item.scheduledStart) - clockNow <= 30 * 60_000,
    );
    if (!future) return;
    const key = `parkpredict_arrival_reminder_${future.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    const message = `Your reservation at ${future.facility} starts at ${new Date(future.scheduledStart).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}. Check-in opens ${ARRIVAL_EARLY_MINUTES} minutes before arrival.`;
    setNotice(message);
    sendBrowserNotification('ParkPredict · Reservation starts soon', message);
  }, [clockNow, demoBookings]);
  useEffect(() => {
    const blocked = demoBookings.find(
      (item) =>
        item.status === 'upcoming' &&
        item.arrivalStatus === 'pending' &&
        clockNow >= Date.parse(item.scheduledStart) - ARRIVAL_EARLY_MINUTES * 60_000 &&
        demoBookings.some(
          (active) =>
            active.id !== item.id &&
            active.status === 'upcoming' &&
            active.arrivalStatus === 'checked-in' &&
            active.lotId === item.lotId &&
            active.bay === item.bay,
        ),
    );
    if (blocked) flagBookingConflict(blocked.id);
  }, [clockNow, demoBookings]);
  useEffect(() => {
    const activeBooking = demoBookings.find(
      (item) =>
        item.status === 'upcoming' && item.arrivalStatus === 'checked-in' && item.parkingEndsAt,
    );
    if (!activeBooking?.parkingEndsAt) return;
    const remaining = Date.parse(activeBooking.parkingEndsAt) - clockNow;
    const warningAt = alertBeforeMs(activeBooking.duration);
    if (remaining <= 0 || remaining > warningAt) return;
    const key = `parkpredict_booking_warning_${activeBooking.id}_${activeBooking.parkingEndsAt}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    const minutes = Math.max(1, Math.ceil(remaining / 60_000));
    const message = `Your parking at ${activeBooking.facility} ends in about ${minutes} minute${minutes === 1 ? '' : 's'}.`;
    setNotice(message);
    sendBrowserNotification('ParkPredict · Parking ends soon', message);
  }, [clockNow, demoBookings]);
  const showAccount = () => {
    if (profile) {
      setAccountName(profile.name || '');
      setAccountEmail(profile.email || '');
      setAccountPhone(profile.phone || '');
      setAccountAlerts(profile.alerts ?? true);
      setAccountOpen(true);
      return;
    }
    setAuthRole(null);
    setAuthMessage('');
    setPanel('auth');
  };
  const loginOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    setOperatorBusy(true);
    setOperatorLoginError('');
    const url = iotApiUrl('/api/admin/login');
    if (!url) {
      setOperatorToken('public-demo-preview');
      setOperatorPassword('');
      setOperatorAuthOpen(false);
      setPanel('admin');
      setNotice(
        'Public admin preview opened. Changes stay in this browser and do not configure real hardware.',
      );
      setOperatorBusy(false);
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: operatorUsername.trim(), password: operatorPassword }),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(result.detail || 'Admin sign-in failed. Check the gateway settings.');
      if (typeof result.access_token !== 'string')
        throw new Error('Gateway returned no admin session.');
      setOperatorToken(result.access_token);
      sessionStorage.setItem('parkpredict_admin_token', result.access_token);
      setOperatorPassword('');
      setOperatorAuthOpen(false);
      setPanel('admin');
    } catch (error) {
      setOperatorLoginError(
        error instanceof DOMException && error.name === 'AbortError'
          ? 'The admin gateway did not respond within 8 seconds. Check its URL and availability.'
          : error instanceof Error
            ? error.message
            : 'Admin sign-in could not be completed.',
      );
    } finally {
      window.clearTimeout(timeout);
      setOperatorBusy(false);
    }
  };
  const showFindParking = () => {
    setMobileResults(false);
    if (window.matchMedia('(max-width: 650px)').matches) setSelected(null);
    setPanel('driver');
  };
  const openDirections = (place: Place) => {
    const url = new URL('https://www.google.com/maps/dir/');
    url.searchParams.set('api', '1');
    url.searchParams.set('destination', `${place.lat},${place.lon}`);
    url.searchParams.set('travelmode', 'driving');
    const route = url.toString();
    const routeTab = window.open(route, '_blank');
    if (routeTab) routeTab.opener = null;
    else window.location.assign(route);
  };
  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className="brand"
          onClick={() => {
            setPanel(operatorToken ? 'admin' : profile ? 'home' : 'auth');
            setAssistant(false);
          }}
          aria-label="ParkPredict home"
        >
          <span className="brand-mark">
            <ParkingCircle size={21} />
          </span>
          <span>
            parkpredict<span className="brand-dot">.</span>
          </span>
        </button>
        {panel !== 'auth' && (
          <nav className="top-nav" aria-label="Primary navigation">
            {operatorToken ? (
              <button className="admin-nav nav-active" onClick={() => setPanel('admin')}>
                <Settings2 size={16} />
                <span>Admin</span>
              </button>
            ) : (
              <>
                <button
                  className={panel === 'home' ? 'nav-active' : ''}
                  onClick={() => setPanel('home')}
                >
                  <House size={16} />
                  <span>Home</span>
                </button>
                <button
                  className={panel === 'driver' ? 'nav-active' : ''}
                  onClick={showFindParking}
                >
                  <Search size={16} />
                  <span>Find</span>
                </button>
                <button
                  className={panel === 'insights' ? 'nav-active' : ''}
                  onClick={() => setPanel('insights')}
                >
                  <ChartNoAxesCombined size={16} />
                  <span>Forecast</span>
                </button>
                <button
                  className={panel === 'activity' ? 'nav-active' : ''}
                  onClick={() => setPanel('activity')}
                >
                  <Clock3 size={16} />
                  <span>History</span>
                  {currentParking && <span className="nav-active-dot" />}
                </button>
                <button
                  className={panel === 'bookings' ? 'nav-active' : ''}
                  onClick={() => setPanel('bookings')}
                >
                  <ParkingCircle size={16} />
                  <span>Passes</span>
                </button>
              </>
            )}
          </nav>
        )}
        <div className="top-actions">
          {!operatorToken && (
            <button className="vehicle-chip" onClick={() => setVehicleSetup(true)}>
              <CarFront size={16} />
              <span>{vehicleRegistration || vehicleType}</span>
              <ChevronDown size={14} />
            </button>
          )}
          <button
            className="avatar"
            aria-label={
              operatorToken
                ? 'Admin account'
                : profile
                  ? `Account for ${profile.name}`
                  : 'Sign in as driver or admin'
            }
            onClick={operatorToken ? () => setPanel('admin') : showAccount}
          >
            {operatorToken ? 'A' : profile?.name?.[0]?.toUpperCase() || <UserRound size={16} />}
          </button>
        </div>
      </header>
      {panel === 'auth' ? (
        <AuthPage
          role={authRole}
          onRoleChange={setAuthRole}
          onBack={() => {
            setAuthRole(null);
            setPanel(profile ? 'home' : 'auth');
          }}
          driver={{
            name: accountName,
            email: accountEmail,
            phone: accountPhone,
            method: authMethod,
            awaitingCode: authAwaitingCode,
            code: authCode,
            busy: authBusy,
            message: authMessage,
            alerts: accountAlerts,
          }}
          onDriverChange={(key, value) => {
            if (key === 'name') setAccountName(value);
            else if (key === 'email') setAccountEmail(value);
            else if (key === 'phone') setAccountPhone(value);
            else if (key === 'code') setAuthCode(value);
          }}
          onDriverMethodChange={(method) => {
            setAuthMethod(method);
            setAuthAwaitingCode(false);
            setAuthMessage('');
          }}
          onDriverAlertsChange={setAccountAlerts}
          onDriverSubmit={submitAccount}
          admin={{
            username: operatorUsername,
            password: operatorPassword,
            busy: operatorBusy,
            error: operatorLoginError,
          }}
          onAdminChange={(key, value) =>
            key === 'username' ? setOperatorUsername(value) : setOperatorPassword(value)
          }
          onAdminSubmit={loginOperator}
        />
      ) : panel === 'home' ? (
        <HomeView
          sessions={parkingSessions.length}
          hasActiveSession={
            Boolean(currentParking) ||
            demoBookings.some(
              (item) => item.status === 'upcoming' && item.arrivalStatus === 'checked-in',
            )
          }
          sensorMode={sensorFeed.mode}
          sensorConnection={sensorFeed.connection}
          sensorBays={sensorFeed.bays.filter((bay) => bay.facilityId === sensorFeed.facilityId)}
          onFind={showFindParking}
          onPredict={() => setPanel('insights')}
          onBookings={() => setPanel('bookings')}
          onActivity={() => setPanel('activity')}
          onCopilot={() => {
            showFindParking();
            setAssistant(true);
          }}
        />
      ) : panel === 'bookings' ? (
        <BookingsView
          bookings={demoBookings}
          sessions={parkingSessions}
          now={clockNow}
          onCancel={(id) =>
            setDemoBookings((items) =>
              items.map((item) => (item.id === id ? { ...item, status: 'cancelled' } : item)),
            )
          }
          onBack={() => setPanel('home')}
          onFind={showFindParking}
          onActivity={() => setPanel('activity')}
          onBookDemo={() => {
            setSelected(null);
            setDemoTicket(false);
            setDemoStartAt(nextBookingTime());
            setDemoBooking(true);
          }}
          onViewPass={(id) => {
            setDemoBookings((items) => {
              const chosen = items.find((item) => item.id === id);
              return chosen ? [chosen, ...items.filter((item) => item.id !== id)] : items;
            });
            setDemoTicket(true);
            setDemoBooking(true);
          }}
          onNavigate={(id) => {
            const booking = demoBookings.find((item) => item.id === id);
            const lot = DEMO_LOTS.find((item) => item.id === booking?.lotId) || DEMO_LOT;
            openDirections(lot);
          }}
          onCheckIn={confirmBookingArrival}
          onEndBooking={endBookingParking}
          onExtendBooking={extendBookingParking}
        />
      ) : panel === 'admin' ? (
        operatorToken ? (
          <SensorAdminView
            onBack={showFindParking}
            onSignOut={() => {
              setOperatorToken('');
              sessionStorage.removeItem('parkpredict_admin_token');
              setPanel(profile ? 'home' : 'auth');
              setAuthRole(null);
              setNotice('Admin signed out.');
            }}
            mode={sensorFeed.mode}
            connection={sensorFeed.connection}
            bays={sensorFeed.bays}
            facilityId={sensorFeed.facilityId}
            bookings={demoBookings}
            incidents={parkingIncidents}
            operations={bayOperations}
            onSimulateUnauthorized={flagBookingConflict}
            onAcknowledgeIncident={(id) =>
              setParkingIncidents((items) =>
                items.map((item) => (item.id === id ? { ...item, status: 'acknowledged' } : item)),
              )
            }
          />
        ) : (
          <AdminAccessView onBack={showFindParking} onSignIn={() => setOperatorAuthOpen(true)} />
        )
      ) : panel === 'activity' ? (
        <ParkingActivityView
          sessions={parkingSessions}
          now={clockNow}
          onEnd={endParking}
          onExtend={extendParking}
          onFind={showFindParking}
        />
      ) : panel === 'insights' ? (
        <InsightsView
          places={places}
          origin={point}
          available={demoAvailable}
          sensorBays={sensorFeed.bays}
          sensorFacilityId={sensorFeed.facilityId}
          sensorMode={sensorFeed.mode}
          onBack={showFindParking}
          onSelect={(id) => {
            setSelected(id);
            showFindParking();
          }}
        />
      ) : (
        <main className="workspace">
          <aside className={`results-panel ${mobileResults ? 'mobile-open' : ''}`}>
            <div className="find-setup-panel">
              <div className="panel-heading find-mobile-actions">
                <button className="mobile-assistant-trigger" onClick={() => setAssistant(true)}>
                  <Sparkles size={14} /> ParkPilot
                </button>
                <button
                  className="mobile-close icon-button"
                  onClick={() => setMobileResults(false)}
                  aria-label="Close results"
                >
                  <X />
                </button>
              </div>
              <div className="search-controls">
                <form className="search-box" onSubmit={submit}>
                  <MapPin size={18} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search destination or landmark"
                    aria-label="Search a place or address"
                  />
                  <button type="submit" aria-label="Search" disabled={loading}>
                    <Search size={18} />
                  </button>
                </form>
                <div className="search-tools">
                  <button
                    className="location-action"
                    onClick={useLocation}
                    disabled={loading || locating}
                  >
                    {locating ? <span className="spinner" /> : <LocateFixed size={15} />}{' '}
                    {locating ? 'Locating…' : currentLocation ? 'Update location' : 'Use location'}
                  </button>
                  <label className="radius-control">
                    <SlidersHorizontal size={15} /> Radius{' '}
                    <select
                      value={radius}
                      onChange={(e) => radiusChange(Number(e.target.value))}
                      aria-label="Search radius"
                    >
                      <option value={0.5}>500 m</option>
                      <option value={1}>1 km</option>
                      <option value={2}>2 km</option>
                      <option value={5}>5 km</option>
                    </select>
                  </label>
                </div>
              </div>
              <button className="vehicle-inline" onClick={() => setVehicleSetup(true)}>
                <CarFront size={14} /> {vehicleDisplay}
              </button>
              <SensorDashboard
                mode={sensorFeed.mode}
                onModeChange={sensorFeed.setMode}
                connection={sensorFeed.connection}
                bays={sensorFeed.bays}
                facilityId={sensorFeed.facilityId}
                operations={bayOperations}
              />
            </div>
            <section className="parking-options-panel">
              <div className="parking-options-heading" aria-live="polite" aria-atomic="true">
                <h2>
                  {searched
                    ? `${places.length} nearby parking option${places.length === 1 ? '' : 's'}`
                    : 'Choose a destination'}
                </h2>
                {searched && retrievedAt && <span className="source-tag">OpenStreetMap</span>}
              </div>
              <div className="result-list">
                {loading && places.length === 0 && (
                  <div className="loading-state">
                    <span className="spinner" />
                    Finding nearby parking…
                  </div>
                )}
                {loading && places.length > 0 && (
                  <div className="loading-inline">
                    <span className="spinner" />
                    Checking mapped parking…
                  </div>
                )}
                {error && (
                  <div className="state-card error-card" role="status">
                    <CircleHelp size={19} />
                    <div>
                      <b>Search unavailable</b>
                      <p>{error}</p>
                      <button onClick={() => void runSearch(point, radius)}>Retry search</button>
                    </div>
                  </div>
                )}
                {!loading && !error && searched && places.length === 0 && (
                  <div className="state-card" role="status">
                    <MapPin size={19} />
                    <div>
                      <b>No mapped parking found</b>
                      <p>
                        OpenStreetMap has no parking listings within {radius} km of this
                        destination. Try a wider radius or another nearby place.
                      </p>
                      {radius < 20 && (
                        <button
                          onClick={() => radiusChange(radius < 5 ? 5 : radius < 10 ? 10 : 20)}
                        >
                          Search {radius < 5 ? 5 : radius < 10 ? 10 : 20} km instead{' '}
                          <ArrowUpRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {!loading && !error && places.length > 0 && visiblePlaces.length === 0 && (
                  <div className="state-card" role="status">
                    <SlidersHorizontal size={18} />
                    <div>
                      <b>No places match these filters</b>
                      <p>
                        Turn off the covered parking filter or search a wider area. Facility details
                        may be missing from mapped listings.
                      </p>
                    </div>
                  </div>
                )}
                {!loading && !searched && (
                  <div className="empty-intro">
                    <div className="intro-icon">
                      <Search size={21} />
                    </div>
                    <b>Where are you going?</b>
                    <p>
                      Search a destination or click anywhere on the map to see nearby mapped
                      parking.
                    </p>
                    <div className="hint-row">
                      <span>ADDRESS</span>
                      <span>LANDMARK</span>
                      <span>MAP POINT</span>
                    </div>
                  </div>
                )}
                {visiblePlaces.map((p) => (
                  <div className="place-result-wrap" key={p.id}>
                    <article
                      role="button"
                      tabIndex={0}
                      className={`place-card ${selected === p.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelected(p.id);
                        map.current?.flyTo([p.lat, p.lon], 16);
                        setMobileResults(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          setSelected(p.id);
                          map.current?.flyTo([p.lat, p.lon], 16);
                          setMobileResults(false);
                        }
                      }}
                    >
                      <div className="place-top">
                        <span className="place-symbol">
                          <ParkingCircle size={18} />
                        </span>
                        <span className="distance">{formatKm(p.distance)}</span>
                      </div>
                      <h2>{p.name}</h2>
                      <p className="address">
                        {p.tags['addr:street']
                          ? `${p.tags['addr:housenumber'] || ''} ${p.tags['addr:street']}`.trim()
                          : `${p.lat.toFixed(4)}, ${p.lon.toFixed(4)}`}
                      </p>
                      <div className="availability">
                        <span
                          className={
                            p.id.startsWith('demo:')
                              ? 'availability-dot demo-dot'
                              : 'availability-dot'
                          }
                        />
                        {p.id === sensorFeed.facilityId
                          ? sensorFeed.mode === 'demo'
                            ? `Sensor simulation · ${sensorFeed.bays.filter((bay) => bay.facilityId === p.id && bay.state === 'Available').length} of ${SENSOR_BAY_COUNT} bays empty`
                            : `${sensorFeed.bays.filter((bay) => bay.facilityId === p.id && (bay.state === 'Available' || bay.state === 'Occupied')).length === SENSOR_BAY_COUNT ? sensorFeed.bays.filter((bay) => bay.facilityId === p.id && bay.state === 'Available').length + ' of ' + SENSOR_BAY_COUNT + ' bays empty' : 'Live count unknown · ' + sensorFeed.bays.filter((bay) => bay.facilityId === p.id && (bay.state === 'Available' || bay.state === 'Occupied')).length + '/' + SENSOR_BAY_COUNT + ' reporting'}`
                          : p.id.startsWith('demo:')
                            ? `Example feed · ${demoSpaces(p.id, demoAvailable)} of 18 spaces · ₹${p.tags.hourly_rate}/hr sample rate`
                            : 'Live availability not reported'}
                      </div>
                      {sensorFeed.bays.some((bay) => bay.facilityId === p.id) && (
                        <div className="sensor-facility-summary">
                          <Radio size={13} />
                          <span>
                            {sensorFeed.mode === 'demo'
                              ? 'Simulated ultrasonic feed'
                              : 'Ultrasonic bay sensors'}
                            :{' '}
                            {
                              sensorFeed.bays.filter(
                                (bay) =>
                                  bay.facilityId === p.id &&
                                  (bay.state === 'Available' || bay.state === 'Occupied'),
                              ).length
                            }
                            /{SENSOR_BAY_COUNT} reporting ·{' '}
                            {
                              sensorFeed.bays.filter(
                                (bay) => bay.facilityId === p.id && bay.state === 'Available',
                              ).length
                            }{' '}
                            empty ·{' '}
                            {
                              sensorFeed.bays.filter(
                                (bay) => bay.facilityId === p.id && bay.state === 'Occupied',
                              ).length
                            }{' '}
                            occupied
                          </span>
                        </div>
                      )}
                      {p.id.startsWith('demo:') && p.id !== sensorFeed.facilityId && (
                        <>
                          <div className="occupancy-head">
                            <span>Bay occupancy</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDemoAvailable((n) =>
                                  Math.max(0, Math.min(18, n + (Math.random() < 0.5 ? -1 : 1))),
                                );
                                setDemoUpdatedAt(new Date());
                              }}
                            >
                              ↻ Refresh example
                            </button>
                          </div>
                          <div className="demo-bays">
                            {Array.from({ length: 8 }, (_, i) => (
                              <span
                                key={i}
                                className={
                                  i < Math.ceil((demoSpaces(p.id, demoAvailable) / 18) * 8)
                                    ? 'bay-free'
                                    : 'bay-busy'
                                }
                              >
                                A{i + 1} ·{' '}
                                {i < Math.ceil((demoSpaces(p.id, demoAvailable) / 18) * 8)
                                  ? 'Free'
                                  : 'Taken'}
                              </span>
                            ))}
                          </div>
                          <div className="feed-freshness">
                            <span className="live-dot" /> Example feed · updated{' '}
                            {demoUpdatedAt.toLocaleTimeString([], {
                              hour: 'numeric',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </div>
                        </>
                      )}
                      {amenity(p.tags).length > 0 && (
                        <div className="amenities">
                          {amenity(p.tags)
                            .slice(0, 3)
                            .map((a) => (
                              <span key={a}>{a}</span>
                            ))}
                        </div>
                      )}
                      {p.id.startsWith('demo:') && (
                        <div className="card-actions booking-card-action">
                          <button
                            className="book-space-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(p.id);
                              setDemoTicket(false);
                              setDemoStartAt(nextBookingTime());
                              setDemoBooking(true);
                            }}
                          >
                            <ParkingCircle size={14} /> Preview booking
                          </button>
                        </div>
                      )}
                      {selected === p.id && (
                        <div className="card-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDirections(p);
                            }}
                          >
                            <Route size={15} /> Drive
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              p.id.startsWith('demo:')
                                ? (setDemoTicket(false), setDemoBooking(true))
                                : setNotice(
                                    'Confirmed bookings require a connected parking operator.',
                                  );
                            }}
                          >
                            {p.id.startsWith('demo:') ? 'Preview booking' : 'Booking unavailable'}
                          </button>
                          {p.id.startsWith('demo:') && p.id !== sensorFeed.facilityId && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setBayLayoutPlace(p);
                              }}
                            >
                              <Radio size={14} /> View bay layout
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startParking(p);
                            }}
                          >
                            <Clock3 size={14} />
                            {currentParking ? 'Timer active' : 'Start parking timer'}
                          </button>
                        </div>
                      )}
                    </article>
                  </div>
                ))}
              </div>
            </section>
          </aside>
          <section className="map-area" aria-label="Interactive parking map">
            <div ref={mapEl} className="map-canvas" />
            <div className="map-label">
              <span className="live-dot" />
              Interactive map <span>·</span> Tap anywhere to search
            </div>
            {mapWarning && (
              <div className="map-warning" role="status">
                {mapWarning}
              </div>
            )}
            {active && (
              <div className="map-detail">
                <button
                  className="close-detail"
                  onClick={() => setSelected(null)}
                  aria-label="Close facility details"
                >
                  <X size={16} />
                </button>
                <div className="detail-kicker">
                  {active.id === sensorFeed.facilityId
                    ? 'FOUR BAY SENSOR DEMO'
                    : active.id.startsWith('demo:')
                      ? 'SAMPLE LOT'
                      : 'MAPPED PARKING'}{' '}
                  <span>{formatKm(active.distance)}</span>
                </div>
                <h3>{active.name}</h3>
                <p>
                  {active.id === sensorFeed.facilityId
                    ? sensorFeed.mode === 'demo'
                      ? `${sensorFeed.bays.filter((bay) => bay.facilityId === active.id && bay.state === 'Available').length} of ${SENSOR_BAY_COUNT} bays open · simulated ultrasonic readings`
                      : `${sensorFeed.bays.filter((bay) => bay.facilityId === active.id && (bay.state === 'Available' || bay.state === 'Occupied')).length === SENSOR_BAY_COUNT ? sensorFeed.bays.filter((bay) => bay.facilityId === active.id && bay.state === 'Available').length + ' of ' + SENSOR_BAY_COUNT + ' bays open' : 'Live count unknown · ' + sensorFeed.bays.filter((bay) => bay.facilityId === active.id && (bay.state === 'Available' || bay.state === 'Occupied')).length + '/' + SENSOR_BAY_COUNT + ' reporting'}`
                    : active.id.startsWith('demo:')
                      ? `Example occupancy · ${demoSpaces(active.id, demoAvailable)}/18 spaces shown available`
                      : 'Live availability not reported'}
                </p>
                <button className="detail-cta" onClick={() => openDirections(active)}>
                  <Navigation size={15} /> Get directions <ArrowUpRight size={14} />
                </button>
                {active.id.startsWith('demo:') && active.id !== sensorFeed.facilityId && (
                  <button className="detail-bay-layout" onClick={() => setBayLayoutPlace(active)}>
                    <Radio size={14} /> View bay layout
                  </button>
                )}
                {active.id.startsWith('demo:') && (
                  <button
                    className="detail-bay-layout detail-book"
                    onClick={() => {
                      setDemoTicket(false);
                      setDemoStartAt(nextBookingTime());
                      setDemoBooking(true);
                    }}
                  >
                    <ParkingCircle size={14} /> Preview booking
                  </button>
                )}
              </div>
            )}
            {currentLocation && (
              <div className="location-map-chip">
                <span />
                You are here · GPS accuracy about{' '}
                {Math.max(1, Math.round(currentLocation.accuracy))} m
              </div>
            )}
            <button className="show-results" onClick={() => setMobileResults(true)}>
              <Menu size={16} />
              <span className="show-results-label">
                {places.length ? `View ${places.length} places` : 'Search parking'}
              </span>
            </button>
            <div className="map-legend">
              <span>
                <i className="legend-pin" />
                Mapped listing
              </span>
              <span>
                <i className="legend-ring" />
                Search point
              </span>
              {currentLocation && (
                <span>
                  <i className="legend-user-location" />
                  You are here
                </span>
              )}
              <span>
                <i className="legend-open" />
                Sample spaces
              </span>
              <span>
                <i className="legend-unknown" />
                Availability unknown
              </span>
            </div>
          </section>
        </main>
      )}
      {panel === 'driver' && (
        <>
          <button
            className={`assistant-fab ${assistant ? 'is-open' : ''} ${mobileResults ? 'mobile-hidden' : ''}`}
            onClick={() => setAssistant(!assistant)}
            aria-label="Open ParkPilot parking assistant"
          >
            <Sparkles size={18} />
            <span>Ask ParkPilot</span>
          </button>
          {assistant && (
            <section className="assistant-panel" aria-label="ParkPilot parking assistant">
              <header>
                <div className="assistant-avatar">
                  <Sparkles size={16} />
                </div>
                <div>
                  <b>ParkPilot</b>
                  <small>Your parking assistant</small>
                </div>
                <button onClick={() => setAssistant(false)} aria-label="Close assistant">
                  <X size={17} />
                </button>
              </header>
              <div className="assistant-body">
                <div className="assistant-mode">
                  <span className="mode-demo" />
                  Uses current search, bay, vehicle, and session data
                </div>
                {assistantLines.map((line, i) => (
                  <div key={i} className={`chat-line ${line.role === 'user' ? 'chat-user' : ''}`}>
                    <div className="assistant-message">
                      <p>{line.text}</p>
                    </div>
                    {line.time && (
                      <small className="chat-time">
                        {new Date(line.time).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </small>
                    )}
                    {line.source && <small className="chat-source">{line.source}</small>}
                    {line.action && (
                      <button
                        className="chat-action"
                        onClick={() => void runCopilotAction(line.action)}
                      >
                        {copilotActionLabel(line.action)} <ArrowUpRight size={12} />
                      </button>
                    )}
                  </div>
                ))}
                {assistantBusy && (
                  <div className="assistant-message assistant-typing">ParkPilot is thinking…</div>
                )}
                <div className="suggested-questions">
                  <button onClick={() => void askAssistant('Which bay is free?')}>
                    Which bay is free?
                  </button>
                  <button onClick={() => void askAssistant('What is the nearest parking?')}>
                    Find the nearest
                  </button>
                  <button onClick={() => void askAssistant('What is the cheapest option?')}>
                    Compare prices
                  </button>
                </div>
              </div>
              <form
                className="assistant-input"
                onSubmit={(e) => {
                  e.preventDefault();
                  void askAssistant();
                }}
              >
                <input
                  value={assistantDraft}
                  onChange={(e) => setAssistantDraft(e.target.value)}
                  placeholder="Ask ParkPilot…"
                  aria-label="Ask ParkPilot"
                />
                <button
                  aria-label="Send question"
                  disabled={assistantBusy || !assistantDraft.trim()}
                >
                  <ArrowUpRight size={17} />
                </button>
              </form>
              <div className="assistant-foot">Answers use your current ParkPredict data</div>
            </section>
          )}
        </>
      )}
      {accountOpen && (
        <div className="demo-modal-backdrop" onClick={() => setAccountOpen(false)}>
          <form
            className="demo-modal account-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-title"
            onClick={(e) => e.stopPropagation()}
            onSubmit={
              profile
                ? (e) => {
                    e.preventDefault();
                  }
                : submitAccount
            }
          >
            <button
              type="button"
              className="demo-modal-close"
              onClick={() => setAccountOpen(false)}
              aria-label="Close account"
            >
              <X size={18} />
            </button>
            <span className="demo-badge">
              {profile ? 'DRIVER ACCOUNT' : 'SIGN IN · CREATE ACCOUNT'}
            </span>
            <h2 id="account-title">{profile ? profile.name : 'Your ParkPredict account'}</h2>
            {profile ? (
              <>
                <p>
                  {profile.email}
                  <br />
                  {profile.phone}
                </p>
                <div className="account-status">
                  <ShieldCheck size={16} />
                  {profile.localDemo
                    ? 'Device-only demo profile · not verified'
                    : 'Supabase authenticated session'}
                </div>
                <label className="vehicle-option">
                  <input
                    type="checkbox"
                    checked={accountAlerts}
                    onChange={(e) => {
                      const value = e.target.checked;
                      setAccountAlerts(value);
                      setProfile((current) => (current ? { ...current, alerts: value } : null));
                    }}
                  />{' '}
                  Enable in-browser session reminders
                </label>
                <div className="demo-disclaimer">
                  SMS parking alerts are not connected. This browser can show session reminders only
                  while the app is open; SMS needs a verified sender and backend.
                </div>
                <button
                  type="button"
                  className="demo-confirm"
                  onClick={async () => {
                    try {
                      await signOutUser();
                      setProfile(null);
                      setAccountOpen(false);
                      setPanel('auth');
                      setAuthRole(null);
                      setNotice('Signed out.');
                    } catch (e) {
                      setNotice(e instanceof Error ? e.message : 'Could not sign out.');
                    }
                  }}
                >
                  <LogIn size={15} /> Sign out
                </button>
              </>
            ) : (
              <>
                <p>
                  Use a one-time code for verified sign-in when Supabase is configured. Otherwise,
                  create a local project-demo profile on this device.
                </p>
                <div className="auth-method-switch">
                  <button
                    type="button"
                    className={authMethod === 'email' ? 'selected' : ''}
                    onClick={() => {
                      setAuthMethod('email');
                      setAuthAwaitingCode(false);
                      setAuthMessage('');
                    }}
                  >
                    Email code
                  </button>
                  <button
                    type="button"
                    className={authMethod === 'phone' ? 'selected' : ''}
                    onClick={() => {
                      setAuthMethod('phone');
                      setAuthAwaitingCode(false);
                      setAuthMessage('');
                    }}
                  >
                    Phone code
                  </button>
                </div>
                <label className="duration-label">
                  Name
                  <input
                    autoComplete="name"
                    required
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Your name"
                  />
                </label>
                <label className="duration-label">
                  Email
                  <input
                    type="email"
                    autoComplete="email"
                    required={authMethod === 'email'}
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </label>
                <label className="duration-label">
                  Phone number
                  <input
                    type="tel"
                    autoComplete="tel"
                    required={authMethod === 'phone'}
                    value={accountPhone}
                    onChange={(e) => setAccountPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </label>
                {authAwaitingCode && (
                  <label className="duration-label">
                    One-time code
                    <input
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      value={authCode}
                      onChange={(e) => setAuthCode(e.target.value)}
                      placeholder="Enter the code"
                    />
                  </label>
                )}
                <label className="vehicle-option">
                  <input
                    type="checkbox"
                    checked={accountAlerts}
                    onChange={(e) => {
                      const value = e.target.checked;
                      setAccountAlerts(value);
                      setProfile((current) => (current ? { ...current, alerts: value } : null));
                    }}
                  />{' '}
                  Enable in-browser parking reminders
                </label>
                {authMessage && (
                  <div className="account-status" role="status">
                    {authMessage}
                  </div>
                )}
                <div className="demo-disclaimer">
                  {supabaseAuthConfigured
                    ? 'Email or phone verification is handled by your Supabase project.'
                    : 'Demo mode: this saves your contact details only on this device; no password, verification, secure account, or SMS is provided.'}{' '}
                  In-browser reminders can appear while this page is open. Session and availability
                  SMS require a separate messaging backend.
                </div>
                <button className="demo-confirm" disabled={authBusy}>
                  {authBusy
                    ? 'Please wait…'
                    : supabaseAuthConfigured
                      ? authAwaitingCode
                        ? 'Verify and sign in'
                        : 'Send one-time code'
                      : 'Save device demo profile'}
                </button>
              </>
            )}
          </form>
        </div>
      )}
      {operatorAuthOpen && (
        <div
          className="demo-modal-backdrop"
          onClick={() => {
            setOperatorAuthOpen(false);
            setOperatorPassword('');
            setOperatorLoginError('');
          }}
        >
          <form
            className="demo-modal operator-login-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="operator-login-title"
            onClick={(e) => e.stopPropagation()}
            onSubmit={loginOperator}
          >
            <button
              type="button"
              className="demo-modal-close"
              onClick={() => {
                setOperatorAuthOpen(false);
                setOperatorPassword('');
                setOperatorLoginError('');
              }}
              aria-label="Close technician sign in"
            >
              <X size={18} />
            </button>
            <span className="demo-badge">AUTHORIZED TECHNICIAN</span>
            <h2 id="operator-login-title">Sensor setup sign in</h2>
            <p>
              Use the gateway technician credentials. Driver accounts cannot open device
              configuration.
            </p>
            <label className="duration-label">
              Technician username
              <input
                autoComplete="username"
                required
                value={operatorUsername}
                onChange={(e) => setOperatorUsername(e.target.value)}
                placeholder="Configured on the gateway"
              />
            </label>
            <label className="duration-label">
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={operatorPassword}
                onChange={(e) => setOperatorPassword(e.target.value)}
                placeholder="Technician password"
              />
            </label>
            {operatorLoginError && (
              <div className="account-status" role="alert">
                {operatorLoginError}
              </div>
            )}
            <div className="demo-disclaimer">
              Admin credentials are checked by the FastAPI gateway. Calibration changes are saved by
              the local gateway. The public site remains a preview when no gateway is hosted.
            </div>
            <button className="demo-confirm" disabled={operatorBusy}>
              {operatorBusy ? 'Checking gateway…' : 'Sign in to Sensor Setup'}
            </button>
          </form>
        </div>
      )}
      {bayLayoutPlace && (
        <DemoBayLayoutModal
          place={bayLayoutPlace}
          available={demoAvailable}
          updatedAt={demoUpdatedAt}
          onClose={() => setBayLayoutPlace(null)}
          onDirections={() => openDirections(bayLayoutPlace)}
        />
      )}
      {vehicleSetup && (
        <div
          className="demo-modal-backdrop"
          onClick={() => {
            setVehicleSetup(false);
            setVehicleProfileError('');
          }}
        >
          <section
            className="demo-modal vehicle-profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vehicle-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="demo-modal-close"
              onClick={() => {
                setVehicleSetup(false);
                setVehicleProfileError('');
              }}
              aria-label="Close vehicle profile"
            >
              <X size={18} />
            </button>
            <span className="demo-badge">YOUR VEHICLE</span>
            <h2 id="vehicle-title">Vehicle profile</h2>
            <p>
              Used on parking passes so the operator can match a booking to the correct vehicle.
            </p>
            <div className="vehicle-profile-purpose">
              <CarFront size={19} />
              <span>
                <b>One saved vehicle</b>
                <small>You can update it before creating a pass.</small>
              </span>
            </div>
            <label className="duration-label">
              Vehicle type
              <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                <option>Car</option>
                <option>Two-wheeler</option>
                <option>SUV</option>
                <option>Van</option>
              </select>
            </label>
            <label className="duration-label">
              Registration number
              <input
                value={vehicleRegistration}
                onChange={(e) => {
                  setVehicleRegistration(normalizeRegistration(e.target.value));
                  setVehicleProfileError('');
                }}
                placeholder="TN 09 BK 4521"
                autoComplete="off"
                aria-describedby="vehicle-registration-help"
              />
            </label>
            <small id="vehicle-registration-help" className="vehicle-registration-help">
              Required for parking passes. Use the number shown on the vehicle registration plate.
            </small>
            {vehicleProfileError && (
              <div className="vehicle-profile-error" role="alert">
                {vehicleProfileError}
              </div>
            )}
            <button type="button" className="demo-confirm" onClick={saveVehicleProfile}>
              Save vehicle
            </button>
            <div className="demo-disclaimer">
              Ultrasonic bay sensors detect physical occupancy only. They do not read or verify this
              registration number.
            </div>
          </section>
        </div>
      )}
      {demoBooking && (
        <div className="demo-modal-backdrop" onClick={() => setDemoBooking(false)}>
          <section
            className="demo-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="demo-modal-close"
              onClick={() => setDemoBooking(false)}
              aria-label="Close demo booking"
            >
              <X size={18} />
            </button>
            {demoTicket ? (
              <>
                <div className="ticket-mark">✓</div>
                <span className="demo-badge">PASS PREVIEW · SAMPLE DATA</span>
                <h2 id="demo-title">Your parking pass preview</h2>
                <p>{demoBookings[0]?.facility || DEMO_LOT.name} · Puducherry</p>
                <div className="ticket-reference">
                  {demoBookings[0]?.reference || 'PP-CHN-8842'}{' '}
                  <span>Booking reference for support and verification</span>
                </div>
                <div className="ticket-details">
                  <div>
                    <small>RESERVED TIME</small>
                    <b>
                      {new Date(demoBookings[0]?.scheduledStart || Date.now()).toLocaleString([], {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </b>
                    <span>{durationLabel(demoBookings[0]?.duration ?? Number(demoDuration))}</span>
                  </div>
                  <div>
                    <small>ASSIGNED BAY</small>
                    <b>{demoBookings[0]?.bay || 'Bay A-14'} · sample</b>
                    <span>Level 1 · illustrative</span>
                  </div>
                  <div>
                    <small>VEHICLE</small>
                    <b>{demoBookings[0]?.vehicle || vehicleDisplay}</b>
                    <span>Vehicle profile</span>
                  </div>
                  <div>
                    <small>PAYMENT</small>
                    <b>Not charged</b>
                    <span>Payment provider not connected</span>
                  </div>
                </div>
                <div className="pass-pin-card">
                  <KeyRound size={20} />
                  <span>
                    <small>ARRIVAL PIN</small>
                    <strong>{demoBookings[0]?.pin || '0000'}</strong>
                    <em>
                      Enter this PIN during the arrival window. The reservation ends at its
                      scheduled time.
                    </em>
                  </span>
                </div>
                <div className="demo-notification-preview" role="status">
                  <Bell size={16} />
                  <span>
                    <b>Confirmation notification created</b>
                    <small>
                      Confirmation preview addressed to{' '}
                      {profile?.phone || accountPhone || 'the saved number'}. App/browser alert is
                      local; SMS provider is not configured, so no text message was delivered.
                    </small>
                  </span>
                </div>
                <div className="demo-disclaimer">
                  This reservation is stored in this browser. Check-in opens 15 minutes early; a
                  15-minute late-arrival grace period applies.
                </div>
                <button
                  className="demo-confirm"
                  onClick={() => {
                    setDemoBooking(false);
                    setPanel('bookings');
                  }}
                >
                  <ParkingCircle size={15} />
                  Open reservations
                </button>
              </>
            ) : (
              <>
                <span className="demo-badge">SAMPLE BOOKING</span>
                <h2 id="demo-title">Try a demo booking</h2>
                <p>
                  Reserve a bay at {active?.id.startsWith('demo:') ? active.name : DEMO_LOT.name}{' '}
                  for a specific arrival time.
                </p>
                <div className="booking-time-grid">
                  <label className="duration-label">
                    Arrival date and time
                    <input
                      type="datetime-local"
                      value={demoStartAt}
                      min={localDateTimeValue(new Date().toISOString())}
                      max={localDateTimeValue(
                        new Date(Date.now() + 30 * 24 * 3_600_000).toISOString(),
                      )}
                      onChange={(event) => {
                        setDemoStartAt(event.target.value);
                        setDemoBayId('');
                      }}
                    />
                  </label>
                  <label className="duration-label">
                    Parking duration
                    <select
                      value={demoDuration}
                      onChange={(event) => {
                        setDemoDuration(event.target.value);
                        setDemoBayId('');
                      }}
                    >
                      {[1 / 6, 0.25, 0.5, 1, 2, 3, 4, 6, 8].map((hours) => (
                        <option key={hours} value={hours}>
                          {durationLabel(hours)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="duration-label">
                  Available bay for this time
                  <select
                    required
                    value={selectedDemoBay}
                    disabled={!bookingBayOptions.length}
                    onChange={(event) => setDemoBayId(event.target.value)}
                  >
                    {bookingBayOptions.length ? (
                      bookingBayOptions.map((bay) => (
                        <option key={bay} value={bay}>
                          {bay}
                          {bookingLot.id === sensorFeed.facilityId
                            ? nearArrival
                              ? ' · currently sensor-reported open'
                              : ' · available for selected time'
                            : ' · sample bay preview'}
                        </option>
                      ))
                    ) : (
                      <option value="">No bay currently available</option>
                    )}
                  </select>
                </label>
                <div className="booking-vehicle-card">
                  <span>
                    <CarFront size={17} />
                    <small>VEHICLE</small>
                    <strong>{vehicleDisplay}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setDemoBooking(false);
                      setVehicleSetup(true);
                    }}
                  >
                    Edit
                  </button>
                </div>
                <label className="duration-label">
                  Phone for confirmation
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={profile?.phone || accountPhone}
                    disabled={Boolean(profile?.phone)}
                    onChange={(e) => setAccountPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </label>
                <div className="demo-booking-summary">
                  <b>Arrival</b>
                  <span>
                    {Number.isFinite(bookingStartMs)
                      ? new Date(bookingStartMs).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : 'Choose a valid time'}
                  </span>
                  <b>Vehicle</b>
                  <span>{vehicleDisplay}</span>
                  <b>Contact for alert</b>
                  <span>
                    {profile?.phone ||
                      accountPhone ||
                      'Add a phone in your profile for the demo message preview'}
                  </span>
                  <b>Selected bay</b>
                  <span>
                    {selectedDemoBay
                      ? 'Bay ' +
                        selectedDemoBay +
                        ' · ' +
                        (bookingLot.id === sensorFeed.facilityId
                          ? 'sensor-reported open'
                          : 'sample bay preview')
                      : 'No bay currently available'}
                  </span>
                  <b>Sample price</b>
                  <span>
                    ₹
                    {Math.max(
                      1,
                      Math.round(
                        (Number(bookingLot.tags.hourly_rate) || 40) * bookingDurationHours,
                      ),
                    )}{' '}
                    · overstay ₹{OVERSTAY_FEE_PER_BLOCK} per {OVERSTAY_BLOCK_MINUTES} min after{' '}
                    {OVERSTAY_GRACE_MINUTES}-min grace
                  </span>
                  <b>Alert</b>
                  <span>
                    Confirmation preview for{' '}
                    {profile?.phone || accountPhone || 'no phone number saved'}
                  </span>
                </div>
                <div className="demo-disclaimer">
                  This browser demo reserves the selected time locally. Check-in opens 15 minutes
                  early and closes 15 minutes after the scheduled start. Prices and overstay fees
                  are illustrative; no payment is collected.
                </div>
                <button
                  className="demo-confirm"
                  onClick={createDemoBooking}
                  disabled={!selectedDemoBay}
                >
                  Reserve sample bay
                </button>
              </>
            )}
          </section>
        </div>
      )}
      {notice && (
        <div className="toast" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

type AuthPageProps = {
  role: 'driver' | 'admin' | null;
  onRoleChange: (role: 'driver' | 'admin' | null) => void;
  onBack: () => void;
  driver: {
    name: string;
    email: string;
    phone: string;
    method: 'email' | 'phone';
    awaitingCode: boolean;
    code: string;
    busy: boolean;
    message: string;
    alerts: boolean;
  };
  onDriverChange: (key: 'name' | 'email' | 'phone' | 'code', value: string) => void;
  onDriverMethodChange: (method: 'email' | 'phone') => void;
  onDriverAlertsChange: (enabled: boolean) => void;
  onDriverSubmit: (event: React.FormEvent) => void;
  admin: { username: string; password: string; busy: boolean; error: string };
  onAdminChange: (key: 'username' | 'password', value: string) => void;
  onAdminSubmit: (event: React.FormEvent) => void;
};
function AuthPage({
  role,
  onRoleChange,
  onBack,
  driver,
  onDriverChange,
  onDriverMethodChange,
  onDriverAlertsChange,
  onDriverSubmit,
  admin,
  onAdminChange,
  onAdminSubmit,
}: AuthPageProps) {
  if (role === 'admin' && !iotApiUrl('/api/admin/login'))
    return (
      <main className="auth-page">
        <div className="auth-page-heading">
          <div>
            <span className="eyebrow">PARKPREDICT ACCESS</span>
            <h1>Demo admin preview</h1>
            <p>Open the sensor-management console on this public project demo.</p>
          </div>
          <button className="back-button" onClick={onBack}>
            <ArrowLeft size={15} /> Back to account types
          </button>
        </div>
        <div className="auth-page-card">
          <form className="auth-role-form" onSubmit={onAdminSubmit}>
            <span className="demo-badge">PUBLIC DEMONSTRATION</span>
            <h2>Parking admin console</h2>
            <p>
              No password is required for this public preview. You can inspect the gateway form,
              sensor-to-bay mapping, and sensor readings.
            </p>
            <div className="demo-disclaimer">
              Preview changes remain in this browser and cannot register ESP32 devices, change Wi-Fi
              settings, or update gateway secrets. A deployed IoT gateway is required for real
              administrator access.
            </div>
            <button className="demo-confirm" disabled={admin.busy}>
              {admin.busy ? 'Opening preview…' : 'Open demo admin preview'}
            </button>
            <button type="button" className="auth-back-role" onClick={() => onRoleChange(null)}>
              Choose a different account type
            </button>
          </form>
        </div>
      </main>
    );
  return (
    <main className="auth-page">
      <div className="auth-page-heading">
        <div>
          <span className="eyebrow">PARKPREDICT ACCESS</span>
          <h1>Sign in to continue</h1>
          <p>Choose the account type that matches how you use ParkPredict.</p>
        </div>
        {role && (
          <button className="back-button" onClick={onBack}>
            <ArrowLeft size={15} /> Back to account types
          </button>
        )}
      </div>
      <div className="auth-page-card">
        <div className="auth-role-switch" role="tablist" aria-label="Account type">
          <button
            type="button"
            role="tab"
            aria-selected={role === null}
            className={role === null ? 'selected' : ''}
            onClick={() => onRoleChange(null)}
          >
            Choose role
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === 'driver'}
            className={role === 'driver' ? 'selected' : ''}
            onClick={() => onRoleChange('driver')}
          >
            <CarFront size={15} /> Driver
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === 'admin'}
            className={role === 'admin' ? 'selected' : ''}
            onClick={() => onRoleChange('admin')}
          >
            <ShieldCheck size={15} /> Admin
          </button>
        </div>
        {role === null ? (
          <div className="auth-role-options">
            <button className="auth-role-card" onClick={() => onRoleChange('driver')}>
              <span className="auth-role-icon">
                <CarFront size={21} />
              </span>
              <b>Driver</b>
              <span>
                Search parking, view bay status, manage your profile and parking activity.
              </span>
              <strong>
                Driver sign in <ArrowUpRight size={14} />
              </strong>
            </button>
            <button className="auth-role-card" onClick={() => onRoleChange('admin')}>
              <span className="auth-role-icon admin">
                <ShieldCheck size={21} />
              </span>
              <b>Parking admin</b>
              <span>Manage the demo gateway, sensor-to-bay mapping, and sensor setup.</span>
              <strong>
                Admin sign in <ArrowUpRight size={14} />
              </strong>
            </button>
          </div>
        ) : role === 'driver' ? (
          <form className="auth-role-form" onSubmit={onDriverSubmit}>
            <span className="demo-badge">DRIVER ACCOUNT</span>
            <h2>Welcome, driver</h2>
            <p>Use a one-time verification code when secure sign-in is configured.</p>
            <div className="auth-method-switch">
              <button
                type="button"
                className={driver.method === 'email' ? 'selected' : ''}
                onClick={() => onDriverMethodChange('email')}
              >
                Email
              </button>
              <button
                type="button"
                className={driver.method === 'phone' ? 'selected' : ''}
                onClick={() => onDriverMethodChange('phone')}
              >
                Phone
              </button>
            </div>
            <label className="duration-label">
              Name
              <input
                autoComplete="name"
                required
                value={driver.name}
                onChange={(e) => onDriverChange('name', e.target.value)}
                placeholder="Your name"
              />
            </label>
            <label className="duration-label">
              Email
              <input
                type="email"
                autoComplete="email"
                required={driver.method === 'email'}
                value={driver.email}
                onChange={(e) => onDriverChange('email', e.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <label className="duration-label">
              Phone number
              <input
                type="tel"
                autoComplete="tel"
                required={driver.method === 'phone'}
                value={driver.phone}
                onChange={(e) => onDriverChange('phone', e.target.value)}
                placeholder="+91 98765 43210"
              />
            </label>
            {driver.awaitingCode && (
              <label className="duration-label">
                One-time code
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={driver.code}
                  onChange={(e) => onDriverChange('code', e.target.value)}
                  placeholder="Enter the code"
                />
              </label>
            )}
            <label className="vehicle-option">
              <input
                type="checkbox"
                checked={driver.alerts}
                onChange={(e) => onDriverAlertsChange(e.target.checked)}
              />{' '}
              Enable in-browser parking reminders
            </label>
            {driver.message && (
              <div className="account-status" role="status">
                {driver.message}
              </div>
            )}
            <div className="demo-disclaimer">
              {supabaseAuthConfigured
                ? 'Your Supabase project verifies the one-time code.'
                : 'Demo access only: profile details stay in this browser. No password or verified account is created.'}
            </div>
            <button className="demo-confirm" disabled={driver.busy}>
              {driver.busy
                ? 'Please wait…'
                : supabaseAuthConfigured
                  ? driver.awaitingCode
                    ? 'Verify and sign in'
                    : 'Send one-time code'
                  : 'Continue as demo driver'}
            </button>
            <button type="button" className="auth-back-role" onClick={() => onRoleChange(null)}>
              Choose a different account type
            </button>
          </form>
        ) : (
          <form className="auth-role-form" onSubmit={onAdminSubmit}>
            <span className="demo-badge">AUTHORIZED ADMIN</span>
            <h2>Parking admin sign in</h2>
            <p>Admin credentials are verified by the ParkPredict IoT gateway.</p>
            <label className="duration-label">
              Admin username
              <input
                autoComplete="username"
                required
                value={admin.username}
                onChange={(e) => onAdminChange('username', e.target.value)}
                placeholder="Configured on the gateway"
              />
            </label>
            <label className="duration-label">
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={admin.password}
                onChange={(e) => onAdminChange('password', e.target.value)}
                placeholder="Admin password"
              />
            </label>
            {admin.error && (
              <div className="account-status" role="alert">
                {admin.error}
              </div>
            )}
            <div className="demo-disclaimer">
              Admin access opens the sensor-management console. Credentials must be configured on
              the backend; this form does not create or save them.
            </div>
            <button className="demo-confirm" disabled={admin.busy}>
              {admin.busy ? 'Verifying…' : 'Sign in as admin'}
            </button>
            <button type="button" className="auth-back-role" onClick={() => onRoleChange(null)}>
              Choose a different account type
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

function AdminAccessView({ onBack, onSignIn }: { onBack: () => void; onSignIn: () => void }) {
  return (
    <main className="admin-page sensor-admin-page admin-access-page">
      <div className="admin-toolbar">
        <div>
          <div className="eyebrow">PARKPREDICT · RESTRICTED AREA</div>
          <h1>Technician access</h1>
          <p>Sensor setup is available to an authorized parking operator only.</p>
        </div>
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={15} /> Back to parking
        </button>
      </div>
      <section className="admin-access-card">
        <span className="admin-access-icon">
          <ShieldCheck size={25} />
        </span>
        <h2>Driver access stays read-only</h2>
        <p>
          Sign in with the gateway technician account to register the demo ESP32, map its readers to
          bays, and preview its configuration. Drivers can continue viewing the bay status in Find
          Parking.
        </p>
        <button className="sensor-config-submit" onClick={onSignIn}>
          <KeyRound size={15} /> Technician sign in
        </button>
        <small>
          Credentials are verified by the IoT gateway. Admin configuration remains temporary in this
          demo.
        </small>
      </section>
    </main>
  );
}

function HomeView({
  sessions,
  hasActiveSession,
  sensorMode,
  sensorConnection,
  sensorBays,
  onFind,
  onPredict,
  onBookings,
  onActivity,
  onCopilot,
}: {
  sessions: number;
  hasActiveSession: boolean;
  sensorMode: 'demo' | 'live';
  sensorConnection: 'demo' | 'connecting' | 'connected' | 'disconnected' | 'error';
  sensorBays: SensorBay[];
  onFind: () => void;
  onPredict: () => void;
  onBookings: () => void;
  onActivity: () => void;
  onCopilot: () => void;
}) {
  const available = sensorBays.filter((bay) => bay.state === 'Available').length;
  const occupied = sensorBays.filter((bay) => bay.state === 'Occupied').length;
  const known = available + occupied;
  const previewBays =
    known > 0
      ? sensorBays.slice(0, SENSOR_BAY_COUNT)
      : [
          { bayId: 'A1', state: 'Available' as const },
          { bayId: 'A2', state: 'Occupied' as const },
          { bayId: 'A3', state: 'Available' as const },
          { bayId: 'A4', state: 'Occupied' as const },
        ];
  const previewAvailable = known > 0 ? available : 2;
  const previewOccupied = known > 0 ? occupied : 2;
  const feedLabel =
    known === 0
      ? 'DEMO PREVIEW'
      : sensorMode === 'demo'
        ? 'DEMO FEED'
        : sensorConnection === 'connected'
          ? 'ESP32 CONNECTED'
          : sensorConnection === 'connecting'
            ? 'CONNECTING'
            : 'LIVE FEED OFFLINE';
  const stateLabel = (state: SensorBay['state']) =>
    state === 'Available'
      ? 'Free'
      : state === 'Occupied'
        ? 'Occupied'
        : state === 'Stale'
          ? 'Stale'
          : 'Unknown';
  const features = [
    {
      icon: <MapPin size={19} />,
      number: '01',
      title: 'Find nearby parking',
      copy: 'Search a place and compare mapped facilities by distance.',
      action: onFind,
      label: 'Explore the map',
    },
    {
      icon: <Radio size={19} />,
      number: '02',
      title: 'Check bay readings',
      copy: 'View bay states from the sample feed or connected ESP32 gateway.',
      action: onFind,
      label: 'Open sensor demo',
    },
    {
      icon: <ChartNoAxesCombined size={19} />,
      number: '03',
      title: 'Review a forecast',
      copy: 'See an estimated occupancy pattern, clearly separated from live readings.',
      action: onPredict,
      label: 'View forecast',
    },
    {
      icon: <ParkingCircle size={19} />,
      number: '04',
      title: 'Preview a booking',
      copy: 'Walk through a sample pass and keep reservations in one place.',
      action: onBookings,
      label: 'Open reservations',
    },
    {
      icon: <Clock3 size={19} />,
      number: '05',
      title: 'Track your parking',
      copy: 'Start a parking timer and revisit saved parking sessions.',
      action: onActivity,
      label: 'Open history',
    },
    {
      icon: <Sparkles size={19} />,
      number: '06',
      title: 'Ask the copilot',
      copy: 'Get help with search, sensor status, forecasts, and booking steps.',
      action: onCopilot,
      label: 'Ask a question',
    },
  ];
  return (
    <main className="home-page landing-page project-home">
      <section className="project-hero">
        <div className="project-hero-copy">
          <span className="project-kicker">
            <i /> PARKPREDICT <span> / </span> SMART PARKING
          </span>
          <h1>
            Know your parking options <em>before you arrive.</em>
          </h1>
          <p>
            Search a destination, compare nearby mapped parking, and check bay readings when a
            sensor feed is available.
          </p>
          <div className="project-hero-actions">
            <button className="project-primary" onClick={onFind}>
              <MapPin size={17} /> Find parking <ArrowUpRight size={15} />
            </button>
            <button className="project-secondary" onClick={onPredict}>
              Explore forecasts <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
        <aside className="project-snapshot" aria-label="Parking sensor demo snapshot">
          <div className="snapshot-heading">
            <div>
              <span className="snapshot-overline">PARKING AVAILABILITY</span>
              <h2>White Town Smart Deck</h2>
            </div>
            <span className={'snapshot-source ' + (sensorMode === 'demo' ? 'sample' : '')}>
              <i />
              {feedLabel}
            </span>
          </div>
          <div className="snapshot-counts">
            <div>
              <span>Available now</span>
              <b>{previewAvailable}</b>
            </div>
            <div>
              <span>Occupied</span>
              <b>{previewOccupied}</b>
            </div>
            <div>
              <span>Sensors reporting</span>
              <b>{(known === 0 ? SENSOR_BAY_COUNT : known) + '/' + SENSOR_BAY_COUNT}</b>
            </div>
          </div>
          <div className="snapshot-bays">
            {previewBays.map((bay) => (
              <div
                className={'snapshot-bay state-' + bay.state.toLowerCase()}
                key={'home-preview:' + bay.bayId}
              >
                <span className="snapshot-bay-light" />
                <b>{bay.bayId}</b>
                <small>{stateLabel(bay.state)}</small>
              </div>
            ))}
          </div>
          <div className="snapshot-caption">
            <span>
              {known === 0
                ? 'Demo sensor snapshot'
                : sensorMode === 'demo'
                  ? 'Ultrasonic demo feed'
                  : 'ESP32 gateway feed'}
            </span>
            <button onClick={onFind}>
              Open parking map <ArrowUpRight size={13} />
            </button>
          </div>
        </aside>
        <div className="project-hero-bottom">
          <span>SEARCH</span>
          <i />
          <span>COMPARE</span>
          <i />
          <span>PLAN</span>
        </div>
      </section>
      <section className="project-section project-capabilities" id="project-capabilities">
        <div className="project-section-heading">
          <div>
            <span className="project-section-kicker">WHAT YOU CAN DO</span>
            <h2>One clear flow from search to parking.</h2>
          </div>
          <p>
            Built around mapped places, a four-bay ultrasonic sensor demo, and practical driver
            tools.
          </p>
        </div>
        <div className="project-feature-grid">
          {features.map((feature) => (
            <article className="project-feature-card" key={feature.number}>
              <span className="project-feature-number">{feature.number}</span>
              <span className="project-feature-icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.copy}</p>
              <button onClick={feature.action}>
                {feature.label}
                <ArrowUpRight size={14} />
              </button>
            </article>
          ))}
        </div>
      </section>
      <section className="project-flow" id="project-flow">
        <div className="project-flow-intro">
          <span className="project-section-kicker">HOW PARKPREDICT WORKS</span>
          <h2>From destination to a confident next step.</h2>
          <p>
            Live bay occupancy appears only for a facility whose sensor data is connected and
            reporting.
          </p>
          <button onClick={onFind}>
            Start a search <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="project-flow-steps">
          <article>
            <span>01</span>
            <div>
              <b>Choose a destination</b>
              <small>Search by place name or use your current location.</small>
            </div>
            <MapPin size={18} />
          </article>
          <article>
            <span>02</span>
            <div>
              <b>Compare nearby facilities</b>
              <small>See mapped listings, distance, and any reported bay readings.</small>
            </div>
            <Radio size={18} />
          </article>
          <article>
            <span>03</span>
            <div>
              <b>Plan your visit</b>
              <small>
                Open directions, review an estimate, or preview the sample booking flow.
              </small>
            </div>
            <Navigation size={18} />
          </article>
        </div>
      </section>
      <section className="project-data-note">
        <ShieldCheck size={19} />
        <div>
          <b>Clear data, clear expectations</b>
          <p>
            OpenStreetMap provides the mapped streets and parking listings. The connected demo lot
            can show sensor-reported bay states; other listings may not provide live occupancy.
            Forecasts and booking passes are project previews.
          </p>
        </div>
      </section>
      <footer className="project-footer">
        <div className="project-footer-main">
          <div className="project-footer-brand">
            <button
              className="project-footer-logo"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <span className="brand-mark">
                <ParkingCircle size={20} />
              </span>
              <span>
                ParkPredict<span className="brand-dot">.</span>
              </span>
            </button>
            <p>Smart parking discovery and bay-status demonstration.</p>
            <span>
              <MapPin size={14} /> Puducherry, India
            </span>
          </div>
          <div className="project-footer-links">
            <b>DISCOVER</b>
            <button onClick={onFind}>Find parking</button>
            <button onClick={onPredict}>Availability forecast</button>
            <button onClick={onCopilot}>Parking copilot</button>
          </div>
          <div className="project-footer-links">
            <b>YOUR PARKING</b>
            <button onClick={onBookings}>Reservations</button>
            <button onClick={onActivity}>Parking history</button>
            <span>
              {hasActiveSession
                ? 'Parking timer is active'
                : sessions + ' saved session' + (sessions === 1 ? '' : 's')}
            </span>
          </div>
          <div className="project-footer-note">
            <span className="project-section-kicker">ABOUT THIS DEMO</span>
            <p>
              Mapped parking discovery with a sample ESP32 sensor feed, occupancy forecast, and
              booking preview.
            </p>
            <span>
              <ShieldCheck size={14} /> Sensor readings are labeled demo or live.
            </span>
          </div>
        </div>
        <div className="project-footer-bottom">
          <span>ParkPredict · Smart parking project</span>
          <span>Map data © OpenStreetMap contributors</span>
        </div>
      </footer>
    </main>
  );
}
function BookingsView({
  bookings,
  sessions,
  now,
  onCancel,
  onBack,
  onFind,
  onActivity,
  onBookDemo,
  onViewPass,
  onNavigate,
  onCheckIn,
  onEndBooking,
  onExtendBooking,
}: {
  bookings: DemoBooking[];
  sessions: ParkingSession[];
  now: number;
  onCancel: (id: string) => void;
  onBack: () => void;
  onFind: () => void;
  onActivity: () => void;
  onBookDemo: () => void;
  onViewPass: (id: string) => void;
  onNavigate: (id: string) => void;
  onCheckIn: (id: string, pin: string) => boolean;
  onEndBooking: (id: string) => void;
  onExtendBooking: (id: string) => void;
}) {
  const [tab, setTab] = useState<'upcoming' | 'active' | 'completed' | 'cancelled'>('upcoming');
  const [pins, setPins] = useState<Record<string, string>>({});
  const upcoming = bookings.filter((b) => b.status === 'upcoming' && b.arrivalStatus === 'pending');
  const activeBookings = bookings.filter(
    (b) => b.status === 'upcoming' && b.arrivalStatus === 'checked-in',
  );
  const completedBookings = bookings.filter(
    (b) => b.status === 'completed' || b.arrivalStatus === 'completed',
  );
  const cancelled = bookings.filter((b) => b.status === 'cancelled' || b.status === 'no-show');
  const activeSessions = sessions.filter((s) => !s.endedAt),
    completedSessions = sessions.filter((s) => Boolean(s.endedAt));
  const count =
    tab === 'upcoming'
      ? upcoming.length
      : tab === 'active'
        ? activeBookings.length + activeSessions.length
        : tab === 'completed'
          ? completedBookings.length + completedSessions.length
          : cancelled.length;
  const passList =
    tab === 'upcoming'
      ? upcoming
      : tab === 'active'
        ? activeBookings
        : tab === 'completed'
          ? completedBookings
          : cancelled;
  const sessionList =
    tab === 'active' ? activeSessions : tab === 'completed' ? completedSessions : [];
  const verifyPin = (bookingId: string) => {
    const value = pins[bookingId] || '';
    if (onCheckIn(bookingId, value)) {
      setPins((values) => ({ ...values, [bookingId]: '' }));
      setTab('active');
    }
  };
  return (
    <main className="bookings-page">
      <div className="bookings-toolbar">
        <div>
          <div className="eyebrow">PARKING</div>
          <h1>Parking passes</h1>
          <p>Manage scheduled arrivals, active parking and completed stays.</p>
        </div>
        <div className="booking-toolbar-actions">
          <button className="back-button" onClick={onBack}>
            ← Home
          </button>
          <button className="outline-button" onClick={onBookDemo}>
            Create pass <ArrowUpRight size={14} />
          </button>
          <button className="home-primary" onClick={onFind}>
            Find parking <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
      <div className="bookings-note">
        <ShieldCheck size={15} />
        <span>
          Check-in opens {ARRIVAL_EARLY_MINUTES} minutes before arrival. A bay stays occupied until
          its sensor confirms the vehicle has left.
        </span>
      </div>
      <div className="booking-policy-strip">
        <span>
          <b>{ARRIVAL_GRACE_MINUTES} min</b> arrival grace
        </span>
        <span>
          <b>{OVERSTAY_GRACE_MINUTES} min</b> exit grace
        </span>
        <span>
          <b>₹{OVERSTAY_FEE_PER_BLOCK}</b> each extra {OVERSTAY_BLOCK_MINUTES} min
        </span>
      </div>
      <div className="booking-tabs">
        <button className={tab === 'upcoming' ? 'selected' : ''} onClick={() => setTab('upcoming')}>
          Upcoming <span>{upcoming.length}</span>
        </button>
        <button className={tab === 'active' ? 'selected' : ''} onClick={() => setTab('active')}>
          Active <span>{activeBookings.length + activeSessions.length}</span>
        </button>
        <button
          className={tab === 'completed' ? 'selected' : ''}
          onClick={() => setTab('completed')}
        >
          Completed <span>{completedBookings.length + completedSessions.length}</span>
        </button>
        <button
          className={tab === 'cancelled' ? 'selected' : ''}
          onClick={() => setTab('cancelled')}
        >
          Closed <span>{cancelled.length}</span>
        </button>
      </div>
      {passList.map((b) => {
        const isActive = b.status === 'upcoming' && b.arrivalStatus === 'checked-in';
        const isCompleted = b.status === 'completed' || b.arrivalStatus === 'completed';
        const start = Date.parse(b.scheduledStart),
          end = Date.parse(b.parkingEndsAt || b.scheduledEnd);
        const checkInOpen =
          now >= start - ARRIVAL_EARLY_MINUTES * 60_000 &&
          now <= start + ARRIVAL_GRACE_MINUTES * 60_000;
        const early = now < start - ARRIVAL_EARLY_MINUTES * 60_000;
        const fee = isActive ? overstayFee(b.parkingEndsAt, now) : Number(b.overstayFee || 0);
        const overtimeMinutes = Math.max(0, Math.ceil((now - end) / 60_000));
        const statusLabel =
          b.status === 'no-show'
            ? 'NO SHOW'
            : b.status === 'cancelled'
              ? 'CANCELLED'
              : isCompleted
                ? 'COMPLETED'
                : b.operationalStatus === 'overstay'
                  ? 'OVERSTAY'
                  : b.operationalStatus === 'exit-requested'
                    ? 'WAITING FOR VEHICLE EXIT'
                    : b.operationalStatus === 'verification-pending'
                      ? 'SENSOR VERIFICATION'
                      : isActive
                        ? 'PARKING ACTIVE'
                        : b.operationalStatus === 'reassigned'
                          ? 'BAY REASSIGNED'
                          : b.operationalStatus === 'conflict'
                            ? 'OPERATOR ASSISTANCE'
                            : 'RESERVED';
        return (
          <article className={`booking-card operation-${b.operationalStatus}`} key={b.id}>
            <div className="booking-card-head">
              <span
                className={`booking-operation-badge ${isActive ? 'checked-in' : isCompleted ? 'completed' : b.operationalStatus}`}
              >
                {statusLabel}
              </span>
              <span>
                {new Date(b.scheduledStart).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            {b.notificationMessage && (
              <div className="booking-conflict-notice" role="alert">
                <CircleAlert size={18} />
                <div>
                  <b>Reserved bay occupied</b>
                  <span>{b.notificationMessage}</span>
                </div>
              </div>
            )}
            {b.operationalStatus === 'overstay' && (
              <div className="booking-overstay-notice" role="alert">
                <CircleAlert size={18} />
                <div>
                  <b>Reserved time has ended</b>
                  <span>
                    The bay remains occupied. Current illustrative overstay fee: ₹{fee}. Remove the
                    vehicle or extend if the next time slot is free.
                  </span>
                </div>
              </div>
            )}
            {(b.operationalStatus === 'exit-requested' ||
              b.operationalStatus === 'verification-pending') && (
              <div className="booking-exit-notice">
                <Radio size={17} />
                <div>
                  <b>
                    {b.operationalStatus === 'exit-requested'
                      ? 'Vehicle still detected'
                      : 'Waiting for a reliable sensor reading'}
                  </b>
                  <span>
                    The booking will complete only after the bay sensor reports it clear for five
                    seconds.
                  </span>
                </div>
              </div>
            )}
            <h2>{b.facility}</h2>
            <p>
              {DEMO_LOTS.find((lot) => lot.id === b.lotId)?.tags['addr:street'] || 'Puducherry'},
              Puducherry
            </p>
            {isActive && (
              <div
                className={`booking-countdown ${now > end ? 'countdown-overstay' : ''}`}
                role="timer"
                aria-live="polite"
              >
                <span>
                  <small>{now > end ? 'TIME OVER' : 'TIME REMAINING'}</small>
                  <strong>
                    {now > end ? `+${overtimeMinutes} min` : countdownLabel(b.parkingEndsAt, now)}
                  </strong>
                </span>
                <span>
                  <small>{now > end ? 'CURRENT EXTRA FEE' : 'PARKING ENDS'}</small>
                  <b>
                    {now > end
                      ? `₹${fee}`
                      : new Date(end).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                  </b>
                </span>
              </div>
            )}
            <div className="booking-facts booking-facts-four">
              <span>
                <small>RESERVED TIME</small>
                <b>
                  {new Date(b.scheduledStart).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </b>
              </span>
              <span>
                <small>DURATION</small>
                <b>{durationLabel(b.duration)}</b>
              </span>
              <span>
                <small>
                  {b.originalBay && b.originalBay !== b.bay ? 'NEW BAY' : 'ASSIGNED BAY'}
                </small>
                <b>{b.bay || 'Not assigned'}</b>
                {b.originalBay && b.originalBay !== b.bay && <em>Previously {b.originalBay}</em>}
              </span>
              <span>
                <small>{fee ? 'TOTAL + OVERSTAY' : 'SAMPLE PRICE'}</small>
                <b>
                  ₹{b.total + fee}
                  {fee ? ` · ₹${fee} extra` : ''}
                </b>
              </span>
            </div>
            <div className="booking-reference">
              Booking reference <b>{b.reference}</b>
              {b.arrivalStatus === 'pending' && b.status === 'upcoming' && (
                <span>
                  Arrival PIN <strong>{b.pin}</strong>
                </span>
              )}
              <span>{b.vehicle}</span>
              {isCompleted && b.completionReason && (
                <span>
                  {b.completionReason === 'sensor-cleared'
                    ? 'Departure verified by bay sensor'
                    : 'Completed without connected sensor verification'}
                </span>
              )}
            </div>
            {b.status === 'upcoming' && b.arrivalStatus === 'pending' && (
              <section className="arrival-verification">
                <div>
                  <KeyRound size={17} />
                  <span>
                    <b>
                      {early
                        ? 'Check-in is not open yet'
                        : checkInOpen
                          ? 'Check in with your PIN'
                          : 'Arrival window closed'}
                    </b>
                    <small>
                      {early
                        ? `Available from ${new Date(start - ARRIVAL_EARLY_MINUTES * 60_000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`
                        : checkInOpen
                          ? 'Enter the four-digit PIN. Your reserved end time does not change if you arrive late.'
                          : `The ${ARRIVAL_GRACE_MINUTES}-minute arrival grace period has ended.`}
                    </small>
                  </span>
                </div>
                <div className="booking-pin-entry">
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={4}
                    value={pins[b.id] || ''}
                    onChange={(event) =>
                      setPins((values) => ({
                        ...values,
                        [b.id]: event.target.value.replace(/\D/g, '').slice(0, 4),
                      }))
                    }
                    placeholder="4-digit PIN"
                    aria-label={`Four-digit PIN for booking ${b.reference}`}
                    disabled={!checkInOpen}
                  />
                  <button
                    onClick={() => verifyPin(b.id)}
                    disabled={!checkInOpen || (pins[b.id] || '').length !== 4}
                  >
                    Check in
                  </button>
                </div>
              </section>
            )}
            {isActive && (
              <div className="checked-in-confirmation">
                <CheckCircle2 size={17} />
                <span>
                  <b>Arrival confirmed with booking PIN</b>
                  <small>
                    {b.exitRequestedAt
                      ? 'Exit requested; sensor confirmation is pending.'
                      : `Checked in ${b.checkedInAt ? new Date(b.checkedInAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'now'}. The bay sensor remains authoritative for departure.`}
                  </small>
                </span>
              </div>
            )}
            <div className="booking-actions">
              <button className="outline-button" onClick={() => onViewPass(b.id)}>
                <ParkingCircle size={14} /> Pass
              </button>
              <button className="outline-button" onClick={() => onNavigate(b.id)}>
                <Navigation size={14} /> Directions
              </button>
              {isActive && (
                <button
                  className="outline-button extend-booking-button"
                  onClick={() => onExtendBooking(b.id)}
                >
                  +15 min
                </button>
              )}
              {isActive && (
                <button className="end-booking-button" onClick={() => onEndBooking(b.id)}>
                  I’m leaving
                </button>
              )}
              {b.status === 'upcoming' && b.arrivalStatus === 'pending' && (
                <button className="cancel-booking" onClick={() => onCancel(b.id)}>
                  Cancel
                </button>
              )}
            </div>
          </article>
        );
      })}
      {sessionList.map((session) => (
        <article className="booking-card session-booking-card" key={session.id}>
          <div className="booking-card-head">
            <span className={session.demo ? 'demo-badge' : 'session-badge'}>
              {session.endedAt
                ? 'COMPLETED TIMER'
                : session.demo
                  ? 'SAMPLE TIMER'
                  : 'SELF-REPORTED TIMER'}
            </span>
            <span>
              {new Date(session.startedAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <h2>{session.facility}</h2>
          <p>{session.area}</p>
          <div className="booking-facts">
            <span>
              <small>VEHICLE</small>
              <b>{session.vehicle}</b>
            </span>
            <span>
              <small>STARTED</small>
              <b>
                {new Date(session.startedAt).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </b>
            </span>
            <span>
              <small>DURATION</small>
              <b>
                {session.endedAt
                  ? elapsedLabel(session.startedAt, session.endedAt)
                  : elapsedLabel(session.startedAt)}
              </b>
            </span>
          </div>
          <div className="booking-actions">
            <button className="outline-button" onClick={onActivity}>
              <Clock3 size={14} /> Manage timer
            </button>
          </div>
        </article>
      ))}
      {!count && (
        <div className="booking-empty">
          <span className="home-quick-icon">
            <ParkingCircle size={21} />
          </span>
          <h2>
            {tab === 'upcoming'
              ? 'No upcoming passes'
              : tab === 'active'
                ? 'No active parking'
                : tab === 'completed'
                  ? 'No completed parking'
                  : 'No closed passes'}
          </h2>
          <p>
            {tab === 'upcoming'
              ? 'Create a reservation for now or a future arrival time.'
              : tab === 'active'
                ? 'Check in during the arrival window to start a parking session.'
                : 'Parking records saved on this device will appear here.'}
          </p>
          <button
            className="home-primary"
            onClick={tab === 'active' || tab === 'completed' ? onActivity : onFind}
          >
            {tab === 'active' || tab === 'completed' ? 'Open parking history' : 'Find parking'}{' '}
            <ArrowUpRight size={14} />
          </button>
        </div>
      )}
    </main>
  );
}
function InsightsView({
  places,
  origin,
  available,
  sensorBays,
  sensorFacilityId,
  sensorMode,
  onBack,
  onSelect,
}: {
  places: Place[];
  origin: Point;
  available: number;
  sensorBays: ReturnType<typeof useSensorFeed>['bays'];
  sensorFacilityId: string;
  sensorMode: 'demo' | 'live';
  onBack: () => void;
  onSelect: (id: string) => void;
}) {
  const predictionPlaces = places.length
    ? places
    : DEMO_LOTS.map((p) => ({ ...p, distance: distanceKm(origin, p) }));
  const toLocalInput = (date: Date) => {
    const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 16);
  };
  const [targetValue, setTargetValue] = useState(() =>
    toLocalInput(new Date(Date.now() + 60 * 60000)),
  );
  const [lotId, setLotId] = useState(
    () =>
      predictionPlaces.find((p) => p.id.startsWith('demo:'))?.id ||
      predictionPlaces[0]?.id ||
      DEMO_LOT.id,
  );
  const target = new Date(targetValue);
  const ranked = rankParkingLots(
    predictionPlaces.map((p) => {
      const readings = sensorBays.filter((bay) => bay.facilityId === p.id);
      const expectedBays = p.id === sensorFacilityId ? SENSOR_BAY_COUNT : 0;
      const readingsReliable =
        expectedBays > 0
          ? readings.length === expectedBays &&
            readings.every((bay) => bay.state === 'Available' || bay.state === 'Occupied')
          : readings.length > 0 &&
            readings.every((bay) => bay.state === 'Available' || bay.state === 'Occupied');
      const sensorFree = readingsReliable
        ? readings.filter((bay) => bay.state === 'Available').length
        : null;
      return {
        id: p.id,
        name: p.name,
        lat: p.lat,
        lon: p.lon,
        distanceKm: p.distance,
        capacity: expectedBays || Number(p.tags.capacity) || (p.id.startsWith('demo:') ? 18 : 20),
        available: readings.length
          ? readingsReliable
            ? sensorFree
            : null
          : p.id.startsWith('demo:')
            ? demoSpaces(p.id, available)
            : null,
        hourlyRate: p.id.startsWith('demo:') ? Number(p.tags.hourly_rate) || 35 : null,
        amenities: amenity(p.tags),
        tags: p.tags,
      };
    }),
    origin,
    { needsEv: false, needsAccessible: false, target },
  );
  const selectedLot =
    ranked.find((lot) => lot.id === lotId) ||
    ranked.find((lot) => lot.id.startsWith('demo:')) ||
    ranked[0];
  const currentSensorBays = sensorBays.filter((bay) => bay.facilityId === selectedLot?.id);
  const sensorCoverage = currentSensorBays.filter(
    (bay) => bay.state === 'Available' || bay.state === 'Occupied',
  ).length;
  const currentSensorFree = currentSensorBays.filter((bay) => bay.state === 'Available').length;
  const forecast =
    selectedLot?.forecast ||
    predictAvailability({ lotId: 'sample', capacity: 18, currentAvailable: available, target });
  const dateLabel = target.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const weekend = target.getDay() === 0 || target.getDay() === 6;
  return (
    <main className="insights-page">
      <div className="insights-toolbar">
        <div>
          <div className="eyebrow">PARKING INTELLIGENCE · LIVE + ESTIMATE</div>
          <h1>Live availability &amp; forecast</h1>
          <p>
            Use current bay readings to see what is open now, then compare a time-of-day estimate
            before you leave.
          </p>
        </div>
        <button className="back-button" onClick={onBack}>
          ← Find parking
        </button>
      </div>
      <div className="insights-note">
        <TrendingUp size={17} />
        <span>
          The graph is a time-of-day estimate. It is not a trained model or a guarantee; it uses
          current bay readings only when all four configured ultrasonic bays report.
        </span>
      </div>
      <section className="forecast-panel">
        <div className="prediction-controls">
          <label>
            Parking area
            <select value={selectedLot?.id || ''} onChange={(e) => setLotId(e.target.value)}>
              {ranked.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.name}
                  {lot.id === sensorFacilityId
                    ? ' · sensor lot'
                    : lot.id.startsWith('demo:')
                      ? ' · sample area'
                      : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            Arrival date &amp; time
            <input
              type="datetime-local"
              min={toLocalInput(new Date())}
              value={targetValue}
              onChange={(e) => {
                if (e.target.value) setTargetValue(e.target.value);
              }}
            />
          </label>
          <span className="prediction-location">
            <MapPin size={15} />
            {origin.label || 'Puducherry'} · India Standard Time
          </span>
        </div>
        <div
          className={`forecast-current ${selectedLot?.id === sensorFacilityId ? 'sensor-current' : 'sample-current'}`}
        >
          <span className="current-status-dot" />
          <div>
            <b>
              {selectedLot?.id === sensorFacilityId
                ? sensorCoverage === SENSOR_BAY_COUNT
                  ? `${currentSensorFree} of ${SENSOR_BAY_COUNT} bays open now`
                  : `Live count unknown · ${sensorCoverage}/${SENSOR_BAY_COUNT} bays reporting`
                : selectedLot?.id.startsWith('demo:')
                  ? `${demoSpaces(selectedLot.id, available)} example spaces open now`
                  : 'Live availability not reported'}
            </b>
            <span>
              {selectedLot?.id === sensorFacilityId
                ? sensorMode === 'demo'
                  ? 'Simulated ultrasonic readings · demo only'
                  : 'ESP32 sensor feed · updates when bay messages arrive'
                : selectedLot?.id.startsWith('demo:')
                  ? 'Illustrative demo data · not connected hardware'
                  : 'OpenStreetMap listing · occupancy is not included'}
            </span>
          </div>
        </div>
        <div className="forecast-panel-head">
          <div>
            <span className="demo-badge">
              {selectedLot?.id.startsWith('demo:')
                ? 'PLANNING ESTIMATE · SAMPLE DATA'
                : 'HISTORICAL PATTERN'}
            </span>
            <h2>{forecast.adviceHeadline}</h2>
            <p>
              {selectedLot?.name || 'No parking listings in this search'} · arrival{' '}
              {target.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
          <div className="forecast-confidence">
            <b>Indicative</b>
            <span>unvalidated estimate</span>
          </div>
        </div>
        <div className="forecast-stats">
          <article>
            <b>{forecast.predictedOccupancyPct}%</b>
            <span>predicted occupancy</span>
          </article>
          <article>
            <b>{forecast.predictedAvailableSpots}</b>
            <span>predicted spaces at arrival</span>
          </article>
          <article>
            <b>{forecast.bestParkingWindow}</b>
            <span>best forecast window · local time</span>
          </article>
        </div>
        <div
          className="forecast-chart"
          role="img"
          aria-label="24 hour predicted parking occupancy chart"
        >
          {forecast.hourlyCurve.map((hour, i) => (
            <div
              className="forecast-bar-col"
              key={hour.time}
              title={
                new Date(hour.time).toLocaleTimeString([], { hour: 'numeric' }) +
                ': ' +
                hour.occupancyPct +
                '% predicted occupancy; ' +
                hour.availableSpots +
                ' available'
              }
            >
              <span
                className={
                  hour.occupancyPct > 88
                    ? 'bar-critical'
                    : hour.occupancyPct > 75
                      ? 'bar-crowded'
                      : hour.occupancyPct >= 60
                        ? 'bar-moderate'
                        : 'bar-optimal'
                }
                style={{ height: hour.occupancyPct + '%' }}
              />
              <small>
                {i % 3 === 0 ? new Date(hour.time).toLocaleTimeString([], { hour: 'numeric' }) : ''}
              </small>
            </div>
          ))}
        </div>
        <div className="forecast-legend">
          <span>
            <i className="legend-optimal" />
            Under 60%
          </span>
          <span>
            <i className="legend-moderate" />
            60–75%
          </span>
          <span>
            <i className="legend-crowded" />
            75–88%
          </span>
          <span>
            <i className="legend-critical" />
            Over 88%
          </span>
        </div>
        <p className="forecast-method">
          {forecast.adviceDetail} This curve follows{' '}
          {selectedLot?.id.startsWith('demo:')
            ? 'the selected Puducherry sample lot’s'
            : 'the selected lot’s'}{' '}
          daily demand pattern and adjusts for {weekend ? 'weekend' : 'weekday'} and arrival time.
          Confidence falls farther from the current observation. Weather and event calendars are
          unavailable, so no occasion adjustment is claimed.
        </p>
      </section>
      <section className="recommendation-panel">
        <div className="recommendation-title">
          <div>
            <div className="eyebrow">100-POINT SCORING MODEL · {dateLabel}</div>
            <h2>Recommended parking</h2>
          </div>
          <span>{ranked.length} options</span>
        </div>
        {ranked.length ? (
          ranked.map((lot, i) => (
            <article className="ranked-lot" key={lot.id}>
              <span className="rank-number">{String(i + 1).padStart(2, '0')}</span>
              <div className="ranked-lot-main">
                <b>{lot.name}</b>
                <span>{lot.reasons.join(' · ')}</span>
                <div className="rank-badges">
                  {lot.badges.map((b) => (
                    <i key={b}>{b}</i>
                  ))}
                </div>
              </div>
              <div className="rank-score">
                <b>{lot.score}</b>
                <span>score</span>
              </div>
              <button className="outline-button" onClick={() => onSelect(lot.id)}>
                View lot
              </button>
            </article>
          ))
        ) : (
          <div className="history-empty">
            No places available to rank yet. Puducherry sample areas are shown once search is
            started.
          </div>
        )}
        <div className="score-breakdown">
          <span>Distance 25</span>
          <span>Current spaces 20</span>
          <span>Forecast 25</span>
          <span>Price 15</span>
          <span>Preferences 15</span>
        </div>
        <p className="forecast-method">
          Unknown live capacity, price, or amenities score as unavailable. Sample prices and counts
          are illustrative. Ranking helps compare listings; it cannot promise a space.
        </p>
      </section>
    </main>
  );
}
type SampleBay = { id: string; free: boolean };
function ParkingScene({ place, spots }: { place: Place; spots: SampleBay[] }) {
  const index = Math.max(
    0,
    DEMO_LOTS.findIndex((item) => item.id === place.id),
  );
  const themes = [
    {
      sky: '#d8b58d',
      haze: '#ebd8bd',
      facade: '#c7ad8b',
      roof: '#6e675e',
      road: '#343a39',
      mark: '#ead8a1',
      sign: '#805b36',
    },
    {
      sky: '#9ec5dd',
      haze: '#d9e6e8',
      facade: '#dad7cc',
      roof: '#647b83',
      road: '#3d4546',
      mark: '#e9df9b',
      sign: '#4b7978',
    },
    {
      sky: '#9bb79e',
      haze: '#d7ddc8',
      facade: '#e5d7b6',
      roof: '#54745d',
      road: '#3b403c',
      mark: '#eddfa0',
      sign: '#477257',
    },
    {
      sky: '#d2a37d',
      haze: '#e5c8a2',
      facade: '#d4c5ad',
      roof: '#5d5b53',
      road: '#333a39',
      mark: '#e8d98f',
      sign: '#8c593b',
    },
    {
      sky: '#a9bed2',
      haze: '#d5dce2',
      facade: '#bfc6c4',
      roof: '#535c5e',
      road: '#353a3e',
      mark: '#eddf9d',
      sign: '#45657c',
    },
    {
      sky: '#b7c8a0',
      haze: '#e3dfc1',
      facade: '#d9c7a6',
      roof: '#63735c',
      road: '#383c37',
      mark: '#efdf9a',
      sign: '#647548',
    },
    {
      sky: '#91b7c4',
      haze: '#d9e4dc',
      facade: '#d9c8af',
      roof: '#54717a',
      road: '#394243',
      mark: '#f3df9b',
      sign: '#438296',
    },
    {
      sky: '#d49c76',
      haze: '#e9c9a1',
      facade: '#e1d1b7',
      roof: '#686055',
      road: '#353b3b',
      mark: '#ecd893',
      sign: '#91633b',
    },
  ];
  const theme = themes[index % themes.length],
    uid = `scene-${index}`,
    target = spots.find((spot) => spot.free)?.id;
  const cars = ['#d8ddd7', '#67858a', '#b47d5d', '#858c91', '#d1bd80'];
  return (
    <svg
      viewBox="0 0 760 360"
      role="img"
      aria-label={`Illustrated sample parking layout for ${place.name}; not a live sensor view`}
    >
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={theme.sky} />
          <stop offset="1" stopColor={theme.haze} />
        </linearGradient>
        <linearGradient id={`${uid}-road`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={theme.road} />
          <stop offset="1" stopColor="#202624" />
        </linearGradient>
        <linearGradient id={`${uid}-car`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#f5f7f3" />
          <stop offset=".42" stopColor={theme.facade} />
          <stop offset="1" stopColor="#59615c" />
        </linearGradient>
        <pattern id={`${uid}-windows`} width="58" height="35" patternUnits="userSpaceOnUse">
          <rect x="7" y="6" width="34" height="18" rx="2" fill="#345457" opacity=".72" />
          <path d="M24 6v18M7 15h34" stroke="#d6ded3" strokeOpacity=".3" />
        </pattern>
        <filter id={`${uid}-shadow`} x="-.3" y="-.3" width="1.6" height="1.8">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id={`${uid}-grain`}>
          <feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="2" />
          <feColorMatrix values=".2 0 0 0 .2 .2 0 0 0 .2 .2 0 0 0 .2 0 0 0 .08 0" />
        </filter>
      </defs>
      <rect width="760" height="360" fill={`url(#${uid}-sky)`} />
      <circle cx={100 + ((index * 73) % 570)} cy="58" r="27" fill="#fff5d9" opacity=".32" />
      <path d={`M0 117 L760 ${96 + (index % 3) * 11} L760 206 L0 222Z`} fill={theme.facade} />
      <path d={`M0 117 L760 ${96 + (index % 3) * 11} L760 130 L0 151Z`} fill={theme.roof} />
      <path
        d={`M${20 + (index % 4) * 6} 145 L740 122 L740 194 L20 213Z`}
        fill={`url(#${uid}-windows)`}
        opacity=".88"
      />
      <path d="M0 201L760 181V360H0Z" fill={`url(#${uid}-road)`} />
      <path d="M0 206L760 186" stroke="#fff" strokeOpacity=".24" strokeWidth="3" />
      <path d="M0 225L760 206" stroke="#f9f4e4" strokeOpacity=".16" strokeWidth="2" />
      <path d="M0 277L760 251" stroke="#d3d8d0" strokeOpacity=".22" strokeWidth="2" />
      <path d="M0 330L760 303" stroke="#141b19" strokeOpacity=".7" strokeWidth="5" />
      {Array.from({ length: SENSOR_BAY_COUNT }, (_, i) => {
        const x = 42 + i * 142 + (index % 3) * 9,
          y = 198 + i * 3;
        const chosen = spots.findIndex((spot) => spot.id === target) === i;
        return (
          <g key={spots[i]?.id || i}>
            <path
              d={`M${x} ${y} l111 -4 l31 143 l-140 8Z`}
              fill={chosen ? '#49d78a' : '#a7b2aa'}
              fillOpacity={chosen ? '.25' : '.035'}
              stroke={chosen ? '#73ffac' : theme.mark}
              strokeOpacity={chosen ? '.98' : '.82'}
              strokeWidth={chosen ? 4 : 2}
              strokeDasharray={chosen ? 'none' : '10 5'}
            />
            {spots[i] && !spots[i].free && (
              <g transform={`translate(${x + 41},${y + 33}) rotate(${-3 + (index % 5)} 32 52)`}>
                <ellipse
                  cx="37"
                  cy="103"
                  rx="39"
                  ry="12"
                  fill="#111716"
                  opacity=".72"
                  filter={`url(#${uid}-shadow)`}
                />
                <path
                  d="M9 31 Q12 19 25 15 L48 12 Q58 14 66 30 L74 42 L77 78 Q74 89 65 91 L12 91 Q4 87 4 77 L5 47Z"
                  fill={cars[(i + index) % cars.length]}
                  stroke="#e0e5de"
                  strokeOpacity=".7"
                  strokeWidth="2"
                />
                <path
                  d="M18 31 Q22 21 30 20 L47 18 Q55 20 61 32 L65 42 L14 44Z"
                  fill="#597078"
                  stroke="#d8e1dd"
                  strokeOpacity=".52"
                />
                <path
                  d="M14 49L66 47M14 70L68 68"
                  stroke="#f1f2e8"
                  strokeOpacity=".4"
                  strokeWidth="2"
                />
                <rect x="1" y="46" width="7" height="13" rx="3" fill="#fae6af" />
                <rect x="73" y="44" width="7" height="13" rx="3" fill="#f0d7a6" />
                <ellipse cx="13" cy="78" rx="7" ry="12" fill="#171b1b" />
                <ellipse cx="67" cy="77" rx="7" ry="12" fill="#171b1b" />
              </g>
            )}
            <rect
              x={x + 39}
              y={y + 116}
              width="72"
              height="23"
              rx="5"
              fill={chosen ? '#c8ffdb' : '#0a1413dd'}
              stroke={chosen ? '#74f7a4' : '#ffffff26'}
            />
            <text
              x={x + 75}
              y={y + 132}
              fill={chosen ? '#135333' : '#f3f5f1'}
              textAnchor="middle"
              fontFamily="monospace"
              fontSize="12"
              fontWeight="800"
            >
              {spots[i]?.id || `A${i + 1}`} · {spots[i]?.free ? 'FREE' : 'TAKEN'}
            </text>
            {chosen && (
              <path
                d={`M24 339 C60 325 96 319 ${x + 68} ${y + 143}`}
                fill="none"
                stroke="#85ffad"
                strokeWidth="5"
                strokeDasharray="8 7"
              />
            )}
          </g>
        );
      })}
      <rect
        width="760"
        height="360"
        filter={`url(#${uid}-grain)`}
        opacity=".22"
        pointerEvents="none"
      />
      <rect x="525" y="28" width="202" height="31" rx="4" fill={theme.sign} opacity=".92" />
      <text
        x="626"
        y="48"
        fill="#fffaf0"
        fontFamily="monospace"
        fontWeight="800"
        fontSize="12"
        textAnchor="middle"
      >
        {place.tags['addr:street'] || 'PUDUCHERRY'} · LOT {String(index + 1).padStart(2, '0')}
      </text>
      <text x="20" y="346" fill="#d3ddd5" fontFamily="monospace" fontSize="11" letterSpacing=".6">
        ILLUSTRATIVE PARKING BAY LAYOUT
      </text>
    </svg>
  );
}
function DemoBayLayoutModal({
  place,
  available,
  updatedAt,
  onClose,
  onDirections,
}: {
  place: Place;
  available: number;
  updatedAt: Date;
  onClose: () => void;
  onDirections: () => void;
}) {
  const lotAvailable = demoSpaces(place.id, available);
  const spots = Array.from({ length: SENSOR_BAY_COUNT }, (_, i) => ({
    id: `A${i + 1}`,
    free: lotAvailable > 0 && i < Math.ceil((lotAvailable / 18) * 8),
  }));
  return (
    <div className="demo-modal-backdrop bay-layout-backdrop" onClick={onClose}>
      <section
        className="bay-layout-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bay-layout-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="bay-layout-modal-head">
          <div>
            <span className="demo-badge">SAMPLE BAY LAYOUT</span>
            <h2 id="bay-layout-title">Parking bay overview</h2>
            <p>
              {place.name} · illustration updated{' '}
              {updatedAt.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </p>
          </div>
          <button className="demo-modal-close" onClick={onClose} aria-label="Close bay layout">
            <X size={18} />
          </button>
        </header>
        <div className="bay-layout-stage">
          <ParkingScene place={place} spots={spots} />
          <div className="bay-layout-status">BAY SENSOR PREVIEW</div>
          <div className="bay-layout-time">
            {updatedAt.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}{' '}
            · LOT{' '}
            {String(
              Math.max(
                0,
                DEMO_LOTS.findIndex((p) => p.id === place.id),
              ) + 1,
            ).padStart(2, '0')}
          </div>
          <div className="bay-layout-suggestion">
            {spots.find((s) => s.free)?.id
              ? `${spots.find((s) => s.free)?.id} · SAMPLE OPEN BAY`
              : 'NO SAMPLE SPACE AVAILABLE'}
          </div>
        </div>
        <div className="bay-layout-summary">
          <div>
            <b>{lotAvailable} / 18</b>
            <span>example spaces shown open</span>
          </div>
          <div>
            <b>{spots.find((s) => s.free)?.id || '—'}</b>
            <span>suggested bay · sample data</span>
          </div>
          <div>
            <b>Not measured</b>
            <span>detection accuracy</span>
          </div>
        </div>
        <div className="bay-layout-disclaimer">
          Illustration and changing sample counts only. This is not a live sensor reading. Confirm
          signs and availability on site.
        </div>
        <div className="bay-layout-actions">
          <button className="outline-button" onClick={onClose}>
            Back to lot
          </button>
          <button className="demo-confirm" onClick={onDirections}>
            <Navigation size={15} /> Directions to lot entrance <ArrowUpRight size={14} />
          </button>
        </div>
      </section>
    </div>
  );
}
type ParkingActivityProps = {
  sessions: ParkingSession[];
  now: number;
  onEnd: (id: string) => void;
  onExtend: (id: string) => void;
  onFind: () => void;
};
function ParkingActivityView({ sessions, now, onEnd, onExtend, onFind }: ParkingActivityProps) {
  const active = sessions.find((s) => !s.endedAt),
    completed = sessions.filter((s) => s.endedAt);

  return (
    <main className="activity-page">
      <div className="activity-toolbar">
        <div>
          <div className="eyebrow">PARKING ACTIVITY</div>
          <h1>Parking history</h1>
          <p>Review active timers and completed parking sessions.</p>
        </div>
        <button className="back-button" onClick={onFind}>
          ← Find parking
        </button>
      </div>
      <div className="activity-notice">
        <ShieldCheck size={17} />
        <span>
          Timers are saved in this browser. They record your session but do not reserve a parking
          space.
        </span>
      </div>
      {active ? (
        <section className="active-parking-card">
          <div className="active-parking-head">
            <span className="active-pulse" />
            ACTIVE PARKING TIMER{' '}
            <span className={active.demo ? 'demo-badge' : 'session-badge'}>
              {active.demo ? 'PREVIEW TIMER' : 'YOUR TIMER'}
            </span>
          </div>
          <h2>{active.facility}</h2>
          <p>
            <MapPinned size={15} /> {active.area}
          </p>
          <div className="active-parking-stats">
            <div>
              <small>PARKING FOR</small>
              <b>{elapsedLabel(active.startedAt, now)}</b>
            </div>
            <div>
              <small>VEHICLE</small>
              <b>{active.vehicle}</b>
            </div>
            <div>
              <small>STARTED</small>
              <b>
                {new Date(active.startedAt).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </b>
            </div>
          </div>
          {active.plannedEndAt && (
            <p className="planned-end">
              Planned end ·{' '}
              {new Date(active.plannedEndAt).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
              })}{' '}
              · {Math.max(0, Math.ceil((new Date(active.plannedEndAt).getTime() - now) / 60000))}{' '}
              min left
            </p>
          )}
          <div className="session-actions">
            <button className="extend-button" onClick={() => onExtend(active.id)}>
              Extend 1 hour
            </button>
            <button className="end-parking-button" onClick={() => onEnd(active.id)}>
              End parking
            </button>
          </div>
          {active.demo && (
            <div className="demo-disclaimer">
              Preview timer only. It does not confirm an on-site parking session.
            </div>
          )}
        </section>
      ) : (
        <section className="no-active-parking">
          <div className="activity-icon">
            <CircleParking size={22} />
          </div>
          <div>
            <h2>No active parking</h2>
            <p>Start a parking timer after you park to record the location and duration.</p>
            <button className="outline-button" onClick={onFind}>
              Find parking
            </button>
          </div>
        </section>
      )}
      <section className="history-section">
        <div className="history-section-head">
          <div>
            <div className="eyebrow">COMPLETED</div>
            <h2>Past sessions</h2>
          </div>
          <span>
            {completed.length} {completed.length === 1 ? 'session' : 'sessions'}
          </span>
        </div>
        {completed.length ? (
          completed.map((s) => (
            <article className="history-session" key={s.id}>
              <span className="history-marker">
                <History size={16} />
              </span>
              <div className="history-session-main">
                <b>{s.facility}</b>
                <span>
                  {s.area} · {s.vehicle}
                </span>
                <small>
                  {new Date(s.startedAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  ·{' '}
                  {new Date(s.startedAt).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}{' '}
                  –{' '}
                  {new Date(s.endedAt!).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </small>
              </div>
              <strong>{elapsedLabel(s.startedAt, s.endedAt)}</strong>
            </article>
          ))
        ) : (
          <div className="history-empty">
            <History size={19} />
            <b>No completed sessions</b>
            <span>Completed parking timers will appear here.</span>
          </div>
        )}
      </section>
      <div className="activity-notice receipt-note">
        <History size={16} />
        <span>Payment receipts are unavailable because payments are not connected.</span>
      </div>
      <p className="activity-storage-note">
        Saved in this browser · Clearing site data removes this history.
      </p>
    </main>
  );
}
