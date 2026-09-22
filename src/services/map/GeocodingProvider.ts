export interface GeocodingResult {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  type?: string;
  source: 'nominatim' | 'curated_cache' | 'coordinate_fallback';
}

export interface IGeocodingProvider {
  search(query: string): Promise<GeocodingResult[]>;
  reverse(lat: number, lng: number): Promise<GeocodingResult>;
  getProviderName(): string;
}

// In-memory cache to respect Nominatim rate limit (1 req/sec) and give instant responsiveness
const searchCache = new Map<string, GeocodingResult[]>();
const reverseCache = new Map<string, GeocodingResult>();

// Curated landmarks for instant offline fallback
const CURATED_LANDMARKS: GeocodingResult[] = [
  // PUDUCHERRY / PONDICHERRY
  {
    id: 'pondy-white-town',
    name: 'White Town (French Quarter)',
    displayName: 'Rue Romain Rolland, White Town, Puducherry, 605001',
    lat: 11.9338,
    lng: 79.8359,
    city: 'Puducherry',
    state: 'Puducherry',
    type: 'landmark',
    source: 'curated_cache',
  },
  {
    id: 'pondy-rock-beach',
    name: 'Rock Beach (Promenade)',
    displayName: 'Goubert Avenue, Promenade Beach, Puducherry, 605001',
    lat: 11.9345,
    lng: 79.8362,
    city: 'Puducherry',
    state: 'Puducherry',
    type: 'beach',
    source: 'curated_cache',
  },
  {
    id: 'pondy-bharathi-park',
    name: 'Bharathi Park & Aayi Mandapam',
    displayName: 'Rue Saint Gilles, White Town, Puducherry, 605001',
    lat: 11.9328,
    lng: 79.8340,
    city: 'Puducherry',
    state: 'Puducherry',
    type: 'landmark',
    source: 'curated_cache',
  },
  {
    id: 'pondy-mission-st',
    name: 'Mission Street Shopping Corridor',
    displayName: 'Mission Street, Heritage Town, Puducherry, 605001',
    lat: 11.9360,
    lng: 79.8290,
    city: 'Puducherry',
    state: 'Puducherry',
    type: 'area',
    source: 'curated_cache',
  },
  {
    id: 'pondy-mg-road',
    name: 'MG Road Commercial District',
    displayName: 'Mahatma Gandhi Road, Puducherry, 605001',
    lat: 11.9345,
    lng: 79.8270,
    city: 'Puducherry',
    state: 'Puducherry',
    type: 'area',
    source: 'curated_cache',
  },
  {
    id: 'pondy-auroville',
    name: 'Auroville Visitor Centre',
    displayName: 'Auroville Main Road, Bommayapalayam, Puducherry, 605101',
    lat: 12.0069,
    lng: 79.8106,
    city: 'Auroville',
    state: 'Tamil Nadu',
    type: 'landmark',
    source: 'curated_cache',
  },
  {
    id: 'pondy-serenity-beach',
    name: 'Serenity Beach',
    displayName: 'East Coast Road, Kottakuppam, Puducherry, 605104',
    lat: 11.9680,
    lng: 79.8420,
    city: 'Puducherry',
    state: 'Puducherry',
    type: 'beach',
    source: 'curated_cache',
  },
  {
    id: 'pondy-railway-station',
    name: 'Puducherry Railway Station',
    displayName: 'Subbiah Salai, South Boulevard, Puducherry, 605001',
    lat: 11.9285,
    lng: 79.8288,
    city: 'Puducherry',
    state: 'Puducherry',
    type: 'transit',
    source: 'curated_cache',
  },

  // CHENNAI
  {
    id: 'chn-vr-mall',
    name: 'VR Chennai Mall',
    displayName: '100 Feet Road, Thirumangalam, Anna Nagar, Chennai, Tamil Nadu 600040',
    lat: 13.0838,
    lng: 80.1983,
    city: 'Chennai',
    state: 'Tamil Nadu',
    type: 'mall',
    source: 'curated_cache',
  },
  {
    id: 'chn-anna-nagar',
    name: 'Anna Nagar 2nd Avenue',
    displayName: '2nd Avenue, Anna Nagar East, Chennai, Tamil Nadu 600102',
    lat: 13.0850,
    lng: 80.2100,
    city: 'Chennai',
    state: 'Tamil Nadu',
    type: 'area',
    source: 'curated_cache',
  },
  {
    id: 'chn-airport',
    name: 'Chennai International Airport (MAA)',
    displayName: 'GST Road, Meenambakkam, Chennai, Tamil Nadu 600027',
    lat: 12.9941,
    lng: 80.1709,
    city: 'Chennai',
    state: 'Tamil Nadu',
    type: 'transit',
    source: 'curated_cache',
  },

  // BENGALURU
  {
    id: 'blr-mg-road',
    name: 'MG Road & Brigade Road',
    displayName: 'MG Road, Ashok Nagar, Bengaluru, Karnataka 560001',
    lat: 12.9756,
    lng: 77.6066,
    city: 'Bengaluru',
    state: 'Karnataka',
    type: 'area',
    source: 'curated_cache',
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
    source: 'curated_cache',
  },

  // HYDERABAD
  {
    id: 'hyd-hitech-city',
    name: 'HITEC City Cyber Towers',
    displayName: 'Madhapur, HITEC City, Hyderabad, Telangana 500081',
    lat: 17.4435,
    lng: 78.3772,
    city: 'Hyderabad',
    state: 'Telangana',
    type: 'area',
    source: 'curated_cache',
  },

  // MUMBAI
  {
    id: 'mum-marine-drive',
    name: 'Marine Drive Promenade',
    displayName: 'Netaji Subhash Chandra Bose Road, Churchgate, Mumbai, Maharashtra 400020',
    lat: 18.9438,
    lng: 72.8234,
    city: 'Mumbai',
    state: 'Maharashtra',
    type: 'beach',
    source: 'curated_cache',
  },

  // DELHI
  {
    id: 'del-connaught-place',
    name: 'Connaught Place',
    displayName: 'Inner Circle, Connaught Place, New Delhi, Delhi 110001',
    lat: 28.6315,
    lng: 77.2167,
    city: 'New Delhi',
    state: 'Delhi',
    type: 'area',
    source: 'curated_cache',
  }
];

/**
 * OpenStreetMap Nominatim Geocoding Provider.
 * Free, open-source geocoding with caching and graceful fallbacks.
 */
export class NominatimGeocodingProvider implements IGeocodingProvider {
  private lastRequestTime = 0;

  public getProviderName(): string {
    return 'OpenStreetMap Nominatim';
  }

  /**
   * Search locations worldwide by place name or address query.
   */
  public async search(query: string): Promise<GeocodingResult[]> {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    // 1. Check local cache
    if (searchCache.has(trimmed)) {
      return searchCache.get(trimmed)!;
    }

    // 2. Check instant curated matches
    const curatedMatches = CURATED_LANDMARKS.filter((item) =>
      item.name.toLowerCase().includes(trimmed) ||
      item.displayName.toLowerCase().includes(trimmed) ||
      (item.city && item.city.toLowerCase().includes(trimmed))
    );

    if (curatedMatches.length > 0) {
      searchCache.set(trimmed, curatedMatches);
      return curatedMatches;
    }

    // 3. Throttle Nominatim API requests (at least 600ms between calls)
    const now = Date.now();
    if (now - this.lastRequestTime < 600) {
      await new Promise((resolve) => setTimeout(resolve, 600 - (now - this.lastRequestTime)));
    }
    this.lastRequestTime = Date.now();

    // 4. Fetch from OpenStreetMap Nominatim
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim error HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        return curatedMatches;
      }

      const results: GeocodingResult[] = data.map((item: any) => ({
        id: `nom-${item.place_id}`,
        name: item.name || item.display_name.split(',')[0],
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        city: item.address?.city || item.address?.town || item.address?.state_district,
        state: item.address?.state,
        type: item.type || 'address',
        source: 'nominatim' as const,
      }));

      searchCache.set(trimmed, results);
      return results;
    } catch (err) {
      console.warn('Nominatim forward search fallback to curated cache:', err);
      return curatedMatches;
    }
  }

  /**
   * Reverse geocode clicked coordinates to a human-readable street/place name.
   */
  public async reverse(lat: number, lng: number): Promise<GeocodingResult> {
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (reverseCache.has(cacheKey)) {
      return reverseCache.get(cacheKey)!;
    }

    // 1. Check if very close (< 250m) to any curated location
    for (const curated of CURATED_LANDMARKS) {
      const dLat = Math.abs(curated.lat - lat);
      const dLng = Math.abs(curated.lng - lng);
      if (dLat < 0.0025 && dLng < 0.0025) {
        reverseCache.set(cacheKey, curated);
        return curated;
      }
    }

    // 2. Throttle API call
    const now = Date.now();
    if (now - this.lastRequestTime < 600) {
      await new Promise((resolve) => setTimeout(resolve, 600 - (now - this.lastRequestTime)));
    }
    this.lastRequestTime = Date.now();

    // 3. Query OpenStreetMap Nominatim reverse geocode
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=17`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim reverse error HTTP ${response.status}`);
      }

      const data = await response.json();
      const name = data.name || data.address?.road || data.address?.suburb || 'Selected Location';
      const result: GeocodingResult = {
        id: `nom-rev-${lat.toFixed(4)}-${lng.toFixed(4)}`,
        name,
        displayName: data.display_name || `${name}, ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        lat,
        lng,
        city: data.address?.city || data.address?.town || data.address?.state_district,
        state: data.address?.state,
        type: data.type || 'point',
        source: 'nominatim',
      };

      reverseCache.set(cacheKey, result);
      return result;
    } catch (err) {
      console.warn('Nominatim reverse geocode fallback to coordinate representation:', err);
      // Graceful fallback
      const fallbackResult: GeocodingResult = {
        id: `fallback-${lat.toFixed(4)}-${lng.toFixed(4)}`,
        name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        displayName: `Coordinates: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
        lat,
        lng,
        source: 'coordinate_fallback',
      };
      return fallbackResult;
    }
  }
}

export const geocodingProvider = new NominatimGeocodingProvider();
