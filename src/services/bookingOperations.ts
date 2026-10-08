export type ArrivalMethod = 'booking-pin';
export type BookingOperationalStatus =
  | 'reserved'
  | 'checked-in'
  | 'exit-requested'
  | 'overstay'
  | 'verification-pending'
  | 'conflict'
  | 'reassigned'
  | 'completed'
  | 'no-show';

export type DemoBooking = {
  id: string;
  reference: string;
  facility: string;
  lotId?: string;
  bay?: string;
  originalBay?: string;
  vehicle: string;
  duration: number;
  total: number;
  createdAt: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: 'upcoming' | 'cancelled' | 'completed' | 'no-show';
  demo: true;
  pin: string;
  arrivalStatus: 'pending' | 'checked-in' | 'completed';
  arrivalMethod?: ArrivalMethod;
  checkedInAt?: string;
  parkingEndsAt?: string;
  exitRequestedAt?: string;
  completedAt?: string;
  noShowAt?: string;
  overstayStartedAt?: string;
  overstayFee?: number;
  completionReason?: 'sensor-cleared' | 'manual-no-sensor';
  operationalStatus: BookingOperationalStatus;
  conflictAt?: string;
  notificationMessage?: string;
  incidentId?: string;
};

export type ParkingIncident = {
  id: string;
  bookingId: string;
  reference: string;
  facility: string;
  bayId: string;
  replacementBayId?: string;
  detectedAt: string;
  status: 'open' | 'acknowledged';
  reason: 'reserved-bay-occupied-before-check-in';
  operatorNotified: true;
  bookingHolderNotified: true;
  originalDuration: number;
  originalPrice: number;
};

export type BayOperation = {
  bayId: string;
  state: 'Reserved' | 'Conflict';
  bookingReference: string;
};

const bookingPin = (reference: string) =>
  String(
    Math.abs([...reference].reduce((total, char) => total * 31 + char.charCodeAt(0), 17)) % 10000,
  ).padStart(4, '0');

export function normalizeBooking(value: Partial<DemoBooking>): DemoBooking | null {
  if (!value.id || !value.reference || !value.facility || !value.vehicle || !value.createdAt)
    return null;
  const originalBay = value.originalBay || value.bay;
  const duration = Number(value.duration) || 1;
  const scheduledStart = value.scheduledStart || value.createdAt;
  const scheduledEnd =
    value.scheduledEnd || new Date(Date.parse(scheduledStart) + duration * 3_600_000).toISOString();
  const checkedInAt = value.checkedInAt;
  const calculatedEnd = checkedInAt
    ? new Date(new Date(checkedInAt).getTime() + duration * 3_600_000).toISOString()
    : undefined;
  const parkingEndsAt = value.parkingEndsAt || calculatedEnd;
  const completed = value.status === 'completed' || value.arrivalStatus === 'completed';
  const noShow = value.status === 'no-show' || value.operationalStatus === 'no-show';
  return {
    id: value.id,
    reference: value.reference,
    facility: value.facility,
    lotId: value.lotId,
    bay: value.bay,
    originalBay,
    vehicle: value.vehicle,
    duration,
    total: Number(value.total) || 0,
    createdAt: value.createdAt,
    scheduledStart,
    scheduledEnd,
    status:
      value.status === 'cancelled'
        ? 'cancelled'
        : noShow
          ? 'no-show'
          : completed
            ? 'completed'
            : 'upcoming',
    demo: true,
    pin: value.pin || bookingPin(value.reference),
    arrivalStatus: completed
      ? 'completed'
      : value.arrivalStatus === 'checked-in'
        ? 'checked-in'
        : 'pending',
    arrivalMethod: value.arrivalMethod === 'booking-pin' ? 'booking-pin' : undefined,
    checkedInAt,
    parkingEndsAt,
    exitRequestedAt: value.exitRequestedAt,
    completedAt: value.completedAt,
    noShowAt: value.noShowAt,
    overstayStartedAt: value.overstayStartedAt,
    overstayFee: Number(value.overstayFee) || 0,
    completionReason: value.completionReason,
    operationalStatus: completed
      ? 'completed'
      : noShow
        ? 'no-show'
        : value.operationalStatus || 'reserved',
    conflictAt: value.conflictAt,
    notificationMessage: value.notificationMessage,
    incidentId: value.incidentId,
  };
}

export function readDemoBookings(): DemoBooking[] {
  try {
    const parsed = JSON.parse(localStorage.getItem('parkpredict_demo_bookings_v1') || '[]');
    if (!Array.isArray(parsed)) return [];
    const bookings = parsed
      .map(normalizeBooking)
      .filter((item): item is DemoBooking => Boolean(item));
    const active = bookings
      .filter((item) => item.arrivalStatus === 'checked-in')
      .sort(
        (a, b) =>
          Date.parse(b.checkedInAt || b.createdAt) - Date.parse(a.checkedInAt || a.createdAt),
      );
    const keepActiveId = active[0]?.id;
    return bookings.map((item) =>
      item.arrivalStatus === 'checked-in' && item.id !== keepActiveId
        ? {
            ...item,
            status: 'completed',
            arrivalStatus: 'completed',
            operationalStatus: 'completed',
            parkingEndsAt: item.parkingEndsAt || item.checkedInAt,
          }
        : item,
    );
  } catch {
    return [];
  }
}

export function readParkingIncidents(): ParkingIncident[] {
  try {
    const parsed = JSON.parse(localStorage.getItem('parkpredict_parking_incidents_v1') || '[]');
    return Array.isArray(parsed)
      ? (parsed.filter((item) => item?.id && item?.bookingId && item?.bayId) as ParkingIncident[])
      : [];
  } catch {
    return [];
  }
}

export function makeBookingPin(reference: string) {
  return bookingPin(reference);
}

export function bayIdFromLabel(label?: string) {
  return (label || '').replace(/^Bay\s+/i, '');
}

export function deriveBayOperations(
  bookings: DemoBooking[],
  incidents: ParkingIncident[],
  facilityId: string,
  now = Date.now(),
): BayOperation[] {
  const operations = new Map<string, BayOperation>();
  incidents
    .filter((item) => item.facility === facilityId)
    .forEach((item) => {
      operations.set(item.bayId, {
        bayId: item.bayId,
        state: 'Conflict',
        bookingReference: item.reference,
      });
    });
  bookings
    .filter(
      (item) =>
        item.status === 'upcoming' &&
        item.lotId === facilityId &&
        (item.arrivalStatus === 'checked-in' ||
          (item.arrivalStatus === 'pending' &&
            now >= Date.parse(item.scheduledStart) - 15 * 60_000 &&
            now <= Date.parse(item.scheduledEnd))),
    )
    .forEach((item) => {
      const bayId = bayIdFromLabel(item.bay);
      if (bayId && !operations.has(bayId))
        operations.set(bayId, { bayId, state: 'Reserved', bookingReference: item.reference });
    });
  return [...operations.values()];
}
