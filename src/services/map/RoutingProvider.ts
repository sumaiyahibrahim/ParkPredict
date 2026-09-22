export interface RouteResult {
  distanceKm: number;
  drivingMinutes: number;
  walkingMinutes: number;
  // GeoJSON [longitude, latitude] pairs suitable for MapLibre LineString layer
  coordinates: [number, number][];
  source: 'osrm' | 'great_circle_fallback';
}

export interface IRoutingProvider {
  getRoute(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number
  ): Promise<RouteResult>;
  getProviderName(): string;
}

/**
 * Calculates straight-line Haversine distance in kilometers.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

/**
 * Open-source OSRM (Open Source Routing Machine) Provider.
 * Queries public OSRM endpoint with zero tokens or billing dependencies.
 */
export class OsrmRoutingProvider implements IRoutingProvider {
  public getProviderName(): string {
    return 'OSRM (Open Source Routing Machine)';
  }

  public async getRoute(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number
  ): Promise<RouteResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      // OSRM expects coordinates in {longitude},{latitude} format
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OSRM error HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = parseFloat((route.distance / 1000).toFixed(2));
        const drivingMinutes = Math.max(1, Math.round(route.duration / 60));
        const walkingMinutes = Math.max(1, Math.round((distanceKm / 4.8) * 60));
        const coordinates: [number, number][] = route.geometry.coordinates;

        return {
          distanceKm,
          drivingMinutes,
          walkingMinutes,
          coordinates,
          source: 'osrm',
        };
      }
      throw new Error('OSRM returned no routes');
    } catch (err) {
      clearTimeout(timeoutId);
      // Graceful fallback to Great-Circle route generation
      return this.fallbackGreatCircleRoute(startLat, startLng, endLat, endLng);
    }
  }

  private fallbackGreatCircleRoute(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number
  ): RouteResult {
    const distKm = calculateHaversineDistanceKm(startLat, startLng, endLat, endLng);
    // Real-world road distance multiplier factor (~1.25x)
    const roadDistKm = parseFloat((distKm * 1.25).toFixed(2));
    const drivingMinutes = Math.max(1, Math.round((roadDistKm / 28) * 60));
    const walkingMinutes = Math.max(1, Math.round((roadDistKm / 4.8) * 60));

    // Interpolate 12 realistic path points with a slight natural road curve
    const steps = 12;
    const coordinates: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Slight sinusoidal curve perturbation for realistic aesthetic
      const curveOffset = Math.sin(t * Math.PI) * 0.0012;
      const lat = startLat + (endLat - startLat) * t + curveOffset;
      const lng = startLng + (endLng - startLng) * t - curveOffset * 0.6;
      coordinates.push([lng, lat]); // GeoJSON lng, lat
    }

    return {
      distanceKm: roadDistKm,
      drivingMinutes,
      walkingMinutes,
      coordinates,
      source: 'great_circle_fallback',
    };
  }
}

export const routingProvider = new OsrmRoutingProvider();
