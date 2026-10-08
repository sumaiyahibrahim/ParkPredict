import type { GeocodingProvider, ParkingSearchProvider } from './providerContracts';

export type OSMPoint = { lat: number; lon: number; label: string };
export type OSMParkingPlace = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  tags: Record<string, string>;
  distance: number;
};
const CACHE_KEY = 'parkpredict_search_cache_v1';
let lastGeocodeAt = 0;
function cached<T>(key: string): T | null {
  try {
    const item = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')[key];
    return item && item.until > Date.now() ? (item.data as T) : null;
  } catch {
    return null;
  }
}
function saveCache(key: string, data: unknown, ttl: number) {
  try {
    const entries = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    entries[key] = { data, until: Date.now() + ttl };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch {
    /* Storage may be disabled or full; the provider remains usable. */
  }
}
async function timedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  ms = 18000,
  provider = 'Parking data provider',
) {
  const controller = new AbortController(),
    timer = window.setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError')
      throw new Error(`The ${provider} did not respond in time. Please retry shortly.`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
async function geocodeThrottle() {
  const delay = Math.max(0, 1100 - (Date.now() - lastGeocodeAt));
  if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
  lastGeocodeAt = Date.now();
}
function kmBetween(a: number, b: number, c: number, d: number) {
  const rad = Math.PI / 180,
    x = (c - a) * rad,
    y = (d - b) * rad,
    h = Math.sin(x / 2) ** 2 + Math.cos(a * rad) * Math.cos(c * rad) * Math.sin(y / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}
function fallbackName(tags: Record<string, string>) {
  if (tags.parking === 'multi-storey') return 'Multi-storey car park';
  if (tags.parking === 'underground') return 'Underground parking';
  if (tags.parking === 'surface') return 'Surface parking';
  return 'Parking area';
}

export const osmGeocodingProvider: GeocodingProvider = {
  async search(query) {
    const key = `geo:${query.toLowerCase().trim()}`,
      hit = cached<OSMPoint>(key);
    if (hit) return { label: hit.label, location: hit };
    await geocodeThrottle();
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '1');
    const response = await timedFetch(url, undefined, 15000, 'place search provider');
    if (!response.ok)
      throw new Error('Place search is temporarily unavailable. Please retry in a moment.');
    const data = await response.json();
    if (!data[0]) return null;
    const point: OSMPoint = {
      lat: Number(data[0].lat),
      lon: Number(data[0].lon),
      label: data[0].display_name.split(',').slice(0, 3).join(','),
    };
    saveCache(key, point, 86400000);
    return { label: point.label, location: point };
  },
  async reverse(location) {
    const key = `rev:${location.lat.toFixed(4)},${location.lon.toFixed(4)}`,
      hit = cached<string>(key);
    if (hit) return { label: hit };
    await geocodeThrottle();
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', String(location.lat));
    url.searchParams.set('lon', String(location.lon));
    url.searchParams.set('format', 'jsonv2');
    const response = await timedFetch(url, undefined, 15000, 'reverse geocoding provider');
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.display_name) return null;
    const label = data.display_name.split(',').slice(0, 3).join(',');
    saveCache(key, label, 86400000);
    return { label };
  },
};

export const overpassParkingProvider: ParkingSearchProvider<OSMParkingPlace> = {
  async nearby(location, radiusKm) {
    const key = `park:v2:${location.lat.toFixed(4)},${location.lon.toFixed(4)},${radiusKm}`;
    const cachedElements = cached<any[]>(key);
    let elements: any[] = cachedElements || [];
    const hadCache = cachedElements !== null;
    let retrievedAt = new Date();
    if (hadCache) {
      try {
        const item = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')[key];
        retrievedAt = new Date(Date.now() - Math.max(0, 300000 - (item.until - Date.now())));
      } catch {
        /* keep approximate request time */
      }
    } else {
      const query = `[out:json][timeout:6];(nwr["amenity"="parking"](around:${radiusKm * 1000},${location.lat},${location.lon});nwr["building"="parking"](around:${radiusKm * 1000},${location.lat},${location.lon});nwr["parking"~"^(surface|multi-storey|underground|rooftop)$"](around:${radiusKm * 1000},${location.lat},${location.lon}););out center tags;`;
      const endpoint =
        import.meta.env.VITE_OVERPASS_URL || 'https://overpass.private.coffee/api/interpreter';
      const response = await timedFetch(
        endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: `data=${encodeURIComponent(query)}`,
        },
        6000,
      );
      if (!response.ok)
        throw new Error(
          'Parking data is temporarily unavailable. Try again shortly or widen the search radius.',
        );
      elements = (await response.json()).elements || [];
      retrievedAt = new Date();
      saveCache(key, elements, 300000);
    }
    const places: OSMParkingPlace[] = elements
      .map((e: any) => {
        const lat = Number(e.lat ?? e.center?.lat),
          lon = Number(e.lon ?? e.center?.lon),
          tags = e.tags || {};
        return {
          id: `${e.type}/${e.id}`,
          name: tags.name || fallbackName(tags),
          lat,
          lon,
          tags,
          distance: kmBetween(location.lat, location.lon, lat, lon),
        };
      })
      .filter(
        (item: OSMParkingPlace) =>
          Number.isFinite(item.lat) && Number.isFinite(item.lon) && item.distance <= radiusKm,
      )
      .sort((a: OSMParkingPlace, b: OSMParkingPlace) => a.distance - b.distance);
    return { places, retrievedAt };
  },
};

export async function searchPlace(query: string) {
  const result = await osmGeocodingProvider.search(query);
  return result ? { ...result.location, label: result.label } : null;
}
export async function reversePlace(point: OSMPoint) {
  const result = await osmGeocodingProvider.reverse(point);
  return result ? { ...point, label: result.label } : point;
}
export async function searchNearbyParking(point: OSMPoint, radiusKm: number) {
  return overpassParkingProvider.nearby(point, radiusKm);
}
