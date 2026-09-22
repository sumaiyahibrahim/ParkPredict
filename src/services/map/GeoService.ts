export interface GeoLocationResult {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  type: 'beach' | 'mall' | 'landmark' | 'transit' | 'hotel' | 'hospital' | 'area' | 'address';
}

export interface ParsedSearchIntent {
  cleanQuery: string;
  maxDistanceMeters?: number;
  maxPrice?: number;
  requireEv?: boolean;
  requireCovered?: boolean;
  durationHours?: number;
}

export interface RouteInfo {
  distanceKm: number;
  drivingMinutes: number;
  walkingMinutes: number;
  polyline: [number, number][];
}

// High-fidelity instant landmark database for immediate offline/low-latency responsiveness
const CURATED_LANDMARKS: GeoLocationResult[] = [
  // PUDUCHERRY / PONDICHERRY (First-class destination)
  {
    id: 'pondy-white-town',
    name: 'White Town (French Quarter)',
    displayName: 'White Town, Puducherry 605001',
    lat: 11.9338,
    lng: 79.8359,
    city: 'Puducherry',
    state: 'Puducherry',
    type: 'landmark',
  },
  {
    id: 'pondy-rock-beach',
    name: 'Rock Beach (Promenade)',
    displayName: 'Goubert Ave, White Town, Puducherry 605001',
    lat: 11.9317,
    lng: 79.8358,
    city: 'Puducherry',
    state: 'Puducherry',
    type: 'beach',
  },
  {
    id: 'pondy-bharathi-park',
    name: 'Bharathi Park & Aayi Mandapam',
    displayName: 'Rue Saint Gilles, White Town, Puducherry 605001',
    lat: 11.9329,
    lng: 79.8341,
    city: 'Puducherry',
    state: 'Puducherry',
    type: 'landmark',
  },
  {
    id: 'pondy-mission-st',
    name: 'Mission Street Shopping Corridor',
    displayName: 'Mission St, Heritage Town, Puducherry 605001',
    lat: 11.9360,
    lng: 79.8290,
    city: 'Puducherry',
    state: 'Puducherry',
    type: 'area',
  },
  {
    id: 'pondy-mg-road',
    name: 'MG Road Commercial Hub',
    displayName: 'Mahatma Gandhi Rd, Puducherry 605001',
    lat: 11.9345,
    lng: 79.8270,
    city: 'Puducherry',
    state: 'Puducherry',
    type: 'area',
  },
  {
    id: 'pondy-heritage-town',
    name: 'Heritage Town',
    displayName: 'Heritage Town, Puducherry 605001',
    lat: 11.9380,
    lng: 79.8295,
    city: 'Puducherry',
    state: 'Puducherry',
    type: 'area',
  },
  {
    id: 'pondy-railway-station',
    name: 'Puducherry Railway Station',
    displayName: 'Subbiah Salai, South Boulevard, Puducherry 605001',
    lat: 11.9285,
    lng: 79.8288,
    city: 'Puducherry',
    state: 'Puducherry',
    type: 'transit',
  },
  {
    id: 'pondy-bus-stand',
    name: 'New Bus Stand Puducherry',
    displayName: 'Maraimalai Adigal Salai, Orleanpet, Puducherry 605005',
    lat: 11.9310,
    lng: 79.8130,
    city: 'Puducherry',
    state: 'Puducherry',
    type: 'transit',
  },
  {
    id: 'pondy-auroville',
    name: 'Auroville Visitors Centre & Matrimandir',
    displayName: 'Auroville Main Road, Bommayapalayam, Puducherry 605101',
    lat: 12.0070,
    lng: 79.8105,
    city: 'Puducherry',
    state: 'Tamil Nadu / Puducherry',
    type: 'landmark',
  },
  {
    id: 'pondy-serenity-beach',
    name: 'Serenity Beach',
    displayName: 'Kottakuppam, Puducherry 605104',
    lat: 11.9680,
    lng: 79.8430,
    city: 'Puducherry',
    state: 'Puducherry',
    type: 'beach',
  },
  {
    id: 'pondy-paradise-beach',
    name: 'Paradise Beach (Chunnambar)',
    displayName: 'Chunnambar Boat House, Nonankuppam, Puducherry 605007',
    lat: 11.8820,
    lng: 79.8030,
    city: 'Puducherry',
    state: 'Puducherry',
    type: 'beach',
  },
  {
    id: 'pondy-lawspet',
    name: 'Lawspet Airport Area',
    displayName: 'Airport Road, Lawspet, Puducherry 605008',
    lat: 11.9665,
    lng: 79.8140,
    city: 'Puducherry',
    state: 'Puducherry',
    type: 'area',
  },

  // CHENNAI
  {
    id: 'chn-anna-nagar',
    name: 'Anna Nagar Tower Park',
    displayName: 'Anna Nagar, Chennai, Tamil Nadu 600040',
    lat: 13.0880,
    lng: 80.2120,
    city: 'Chennai',
    state: 'Tamil Nadu',
    type: 'landmark',
  },
  {
    id: 'chn-vr-mall',
    name: 'VR Mall Chennai',
    displayName: '100 Feet Rd, Thirumangalam, Anna Nagar, Chennai 600040',
    lat: 13.0850,
    lng: 80.1983,
    city: 'Chennai',
    state: 'Tamil Nadu',
    type: 'mall',
  },
  {
    id: 'chn-airport',
    name: 'Chennai International Airport (MAA)',
    displayName: 'GST Road, Meenambakkam, Chennai 600027',
    lat: 12.9818,
    lng: 80.1643,
    city: 'Chennai',
    state: 'Tamil Nadu',
    type: 'transit',
  },
  {
    id: 'chn-express-avenue',
    name: 'Express Avenue Mall',
    displayName: 'Club House Road, Royapettah, Chennai 600002',
    lat: 13.0588,
    lng: 80.2642,
    city: 'Chennai',
    state: 'Tamil Nadu',
    type: 'mall',
  },
  {
    id: 'chn-marina-beach',
    name: 'Marina Beach Promenade',
    displayName: 'Kamarajar Salai, Triplicane, Chennai 600005',
    lat: 13.0475,
    lng: 80.2824,
    city: 'Chennai',
    state: 'Tamil Nadu',
    type: 'beach',
  },
  {
    id: 'chn-phoenix-mall',
    name: 'Phoenix Marketcity',
    displayName: 'Velachery Main Road, Velachery, Chennai 600042',
    lat: 12.9915,
    lng: 80.2170,
    city: 'Chennai',
    state: 'Tamil Nadu',
    type: 'mall',
  },

  // BENGALURU
  {
    id: 'blr-mg-road',
    name: 'MG Road & Brigade Road',
    displayName: 'MG Road, Bengaluru, Karnataka 560001',
    lat: 12.9756,
    lng: 77.6066,
    city: 'Bengaluru',
    state: 'Karnataka',
    type: 'area',
  },
  {
    id: 'blr-koramangala',
    name: 'Koramangala 5th Block',
    displayName: 'Koramangala, Bengaluru, Karnataka 560095',
    lat: 12.9352,
    lng: 77.6245,
    city: 'Bengaluru',
    state: 'Karnataka',
    type: 'area',
  },
  {
    id: 'blr-indiranagar',
    name: '100 Feet Road, Indiranagar',
    displayName: 'Indiranagar, Bengaluru, Karnataka 560038',
    lat: 12.9784,
    lng: 77.6408,
    city: 'Bengaluru',
    state: 'Karnataka',
    type: 'area',
  },

  // HYDERABAD
  {
    id: 'hyd-hitech-city',
    name: 'HITEC City & Cyber Towers',
    displayName: 'Madhapur, HITEC City, Hyderabad, Telangana 500081',
    lat: 17.4435,
    lng: 78.3772,
    city: 'Hyderabad',
    state: 'Telangana',
    type: 'area',
  },

  // MUMBAI
  {
    id: 'mum-marine-drive',
    name: 'Marine Drive Promenade',
    displayName: 'Netaji Subhash Chandra Bose Road, Mumbai 400020',
    lat: 18.9438,
    lng: 72.8234,
    city: 'Mumbai',
    state: 'Maharashtra',
    type: 'beach',
  },

  // DELHI
  {
    id: 'del-connaught-place',
    name: 'Connaught Place Inner Circle',
    displayName: 'Connaught Place, New Delhi 110001',
    lat: 28.6315,
    lng: 77.2167,
    city: 'New Delhi',
    state: 'Delhi',
    type: 'area',
  }
];

export class GeoService {
  /**
   * Parses natural language parking intent from search query.
   * Example: "Cheap parking near Rock Beach for 3 hours"
   */
  public static parseIntent(rawQuery: string): ParsedSearchIntent {
    let clean = rawQuery.trim();
    let maxPrice: number | undefined = undefined;
    let maxDistanceMeters: number | undefined = undefined;
    let requireEv: boolean | undefined = undefined;
    let requireCovered: boolean | undefined = undefined;
    let durationHours: number | undefined = undefined;

    const lower = clean.toLowerCase();

    // Check cheap / budget
    if (lower.includes('cheap') || lower.includes('budget') || lower.includes('affordable')) {
      maxPrice = 40;
      clean = clean.replace(/cheap|budget|affordable/gi, '');
    }

    // Check EV
    if (lower.includes('ev') || lower.includes('electric') || lower.includes('charging')) {
      requireEv = true;
      clean = clean.replace(/with ev charging|ev charging|electric vehicle|ev/gi, '');
    }

    // Check covered
    if (lower.includes('covered') || lower.includes('indoor')) {
      requireCovered = true;
      clean = clean.replace(/covered|indoor/gi, '');
    }

    // Check distance preference like "within 500m" or "within 1km"
    const distMatch = lower.match(/within\s+(\d+)\s*(m|meter|km|kilometer)s?/i);
    if (distMatch) {
      const val = parseInt(distMatch[1], 10);
      const unit = distMatch[2].toLowerCase();
      maxDistanceMeters = unit.startsWith('k') ? val * 1000 : val;
      clean = clean.replace(distMatch[0], '');
    }

    // Check duration like "for 3 hours"
    const durMatch = lower.match(/for\s+(\d+)\s*(h|hr|hour)s?/i);
    if (durMatch) {
      durationHours = parseInt(durMatch[1], 10);
      clean = clean.replace(durMatch[0], '');
    }

    // Remove filler words
    clean = clean.replace(/\b(parking|near|at|around|find|best|closest)\b/gi, '').trim();

    return {
      cleanQuery: clean || rawQuery,
      maxPrice,
      maxDistanceMeters,
      requireEv,
      requireCovered,
      durationHours,
    };
  }

  /**
   * Search for locations anywhere in the world using Curated Cache + Nominatim OpenStreetMap API.
   */
  public static async searchLocations(query: string): Promise<GeoLocationResult[]> {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    // 1. Check instant curated matches
    const localMatches = CURATED_LANDMARKS.filter((l) =>
      l.name.toLowerCase().includes(trimmed) ||
      l.displayName.toLowerCase().includes(trimmed) ||
      (l.city && l.city.toLowerCase().includes(trimmed))
    );

    // 2. Query Nominatim if online and query is substantial
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: { 'Accept-Language': 'en' },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        const apiResults: GeoLocationResult[] = data.map((item: any) => ({
          id: 'nom-' + item.place_id,
          name: item.name || item.display_name.split(',')[0],
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          city: item.address?.city || item.address?.town || item.address?.state_district,
          state: item.address?.state,
          type: item.type === 'amenity' ? 'landmark' : 'area',
        }));

        // Deduplicate and combine
        const combined = [...localMatches];
        apiResults.forEach((ar) => {
          if (!combined.some((c) => Math.abs(c.lat - ar.lat) < 0.005 && Math.abs(c.lng - ar.lng) < 0.005)) {
            combined.push(ar);
          }
        });

        return combined;
      }
    } catch {
      // Offline fallback to local matches
    }

    return localMatches.length > 0 ? localMatches : [
      // Sensible fallback if no match found
      {
        id: 'fallback-' + Date.now(),
        name: query,
        displayName: `${query} (Coordinates Estimated)`,
        lat: 11.9338, // defaults to Pondicherry White Town
        lng: 79.8359,
        city: 'Puducherry',
        state: 'Puducherry',
        type: 'landmark',
      }
    ];
  }

  /**
   * Real Reverse-Geocoding: given (lat, lng), return human-readable address.
   */
  public static async reverseGeocode(lat: number, lng: number): Promise<{ name: string; address: string; city: string }> {
    // Check nearest curated landmark first (within 300m)
    for (const lm of CURATED_LANDMARKS) {
      const dist = this.calculateDistanceKm(lat, lng, lm.lat, lm.lng);
      if (dist < 0.35) {
        return {
          name: lm.name,
          address: lm.displayName,
          city: lm.city || 'Puducherry',
        };
      }
    }

    // Live reverse geocoding via Nominatim
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: { 'Accept-Language': 'en' },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (resp.ok) {
        const item = await resp.json();
        const road = item.address?.road || item.address?.suburb || item.address?.neighbourhood || 'Selected Location';
        const city = item.address?.city || item.address?.town || item.address?.state_district || 'Tamil Nadu / Puducherry';
        return {
          name: item.name || road,
          address: item.display_name || `${road}, ${city}`,
          city,
        };
      }
    } catch {
      // Fallback
    }

    return {
      name: `Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      address: `Coordinates: ${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E`,
      city: 'Local Area',
    };
  }

  /**
   * Calculate distance between coordinates using Haversine formula in Kilometers.
   */
  public static calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  }

  /**
   * Generates realistic driving and walking route polylines and times.
   */
  public static calculateRoute(startLat: number, startLng: number, endLat: number, endLng: number): RouteInfo {
    const distanceKm = this.calculateDistanceKm(startLat, startLng, endLat, endLng);
    
    // Driving speed avg in urban India: 22 km/h; Walking speed: 4.8 km/h
    const drivingMinutes = Math.max(2, Math.round((distanceKm / 22) * 60));
    const walkingMinutes = Math.max(1, Math.round((distanceKm / 4.8) * 60));

    // Generate smooth bezier route line between start and end
    const steps = 12;
    const polyline: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Slight dogleg curve to simulate real street turns
      const jitter = Math.sin(t * Math.PI) * 0.0015;
      const lat = startLat + (endLat - startLat) * t + jitter;
      const lng = startLng + (endLng - startLng) * t + (t > 0.5 ? -jitter : jitter);
      polyline.push([lat, lng]);
    }

    return {
      distanceKm,
      drivingMinutes,
      walkingMinutes,
      polyline,
    };
  }
}
