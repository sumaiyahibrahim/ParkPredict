/** Service boundaries for integrations that must remain replaceable and server-owned. */
export type Coordinates = { lat: number; lon: number };
export type ParkingListing = { id: string; name: string; location: Coordinates; source: string; amenities: string[] };
export type BayState = 'Available' | 'Occupied' | 'Uncertain' | 'Stale';
export type BayObservation = { facilityBayId: string; state: BayState; observedAt: string; sourceDeviceIds: string[]; vehicleLabel?: string | null };

export interface GeocodingProvider {
  search(query: string): Promise<{ label: string; location: Coordinates } | null>;
  reverse(location: Coordinates): Promise<{ label: string } | null>;
}
export interface ParkingSearchProvider<T = ParkingListing> {
  nearby(location: Coordinates, radiusKm: number): Promise<{ places: T[]; retrievedAt: Date }>;
}
export interface RoutingProvider {
  directions(from: Coordinates, to: Coordinates, mode: 'driving' | 'walking' | 'cycling'): Promise<{ url: string } | null>;
}
export interface SensorOccupancyProvider {
  observations(facilityId: string): Promise<BayObservation[]>;
}
export interface ReservationProvider {
  reserve(input: { facilityId: string; bayId: string; startUtc: string; endUtc: string; idempotencyKey: string }): Promise<{ reference: string; confirmed: boolean }>;
}
export interface SmsProvider {
  send(input: { phone: string; template: 'booking-confirmed' | 'ending-soon' | 'booking-changed'; bookingId: string }): Promise<{ accepted: boolean; providerMessageId?: string }>;
}
export interface ParkingAssistantProvider {
  answer(input: { question: string; currentLocation?: Coordinates; currentFacilityId?: string }): Promise<{ answer: string; sourceIds: string[]; observedAt?: string }>;
}

/** True integrations require server implementations; browser-only stubs never claim success. */
export const integrationReadiness = {
  maps: 'configured-by-public-development-provider',
  routing: 'setup-required',
  sensorGateway: 'setup-required',
  reservations: 'setup-required',
  sms: 'setup-required',
  assistant: 'setup-required',
} as const;
