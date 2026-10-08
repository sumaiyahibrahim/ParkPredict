export type CopilotAction =
  | 'activity'
  | 'extend'
  | 'predictions'
  | 'ev'
  | 'airport'
  | 'booking'
  | 'history'
  | 'find'
  | 'directions'
  | 'reservations'
  | 'profile';

type SensorContextBay = {
  bayId: string;
  state: 'Available' | 'Occupied' | 'Uncertain' | 'Stale';
  distanceCm: number | null;
  observedAt: string;
  sensorReady: boolean;
  deviceOnline: boolean;
};

export type CopilotPlace = {
  name: string;
  distanceKm: number;
  pricePerHour: number | null;
  free: boolean;
  availability: string;
  source: 'sensor' | 'sample' | 'mapped';
};

export type CopilotContext = {
  location: string;
  radiusKm: number;
  available: number;
  capacity: number;
  vehicle: string;
  ev: boolean;
  accessible: boolean;
  activeParking: boolean;
  savedSessions: number;
  savedBookings: number;
  mappedPlaces: number;
  selectedPlace?: string;
  places?: CopilotPlace[];
  sensorSummary?: {
    mode: 'demo' | 'live';
    available: number;
    occupied: number;
    uncertain?: number;
    stale?: number;
    total: number;
    reporting?: number;
    connected: boolean;
    bays?: SensorContextBay[];
  };
};

type CopilotAnswer = { text: string; action?: CopilotAction };

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9₹]+/g, ' ')
    .trim();
const money = (value: number | null) =>
  value == null ? 'price not listed' : value === 0 ? 'free' : `₹${value}/hr`;
const distance = (value: number) =>
  value < 1 ? `${Math.round(value * 1000)} m` : `${value.toFixed(1)} km`;
const includesAny = (value: string, phrases: string[]) =>
  phrases.some((phrase) => value.includes(phrase));

function referencedPlace(question: string, places: CopilotPlace[]) {
  const ordinal = question.match(/\b(first|1st|second|2nd|third|3rd|fourth|4th|fifth|5th)\b/)?.[1];
  const ordinalIndex: Record<string, number> = {
    first: 0,
    '1st': 0,
    second: 1,
    '2nd': 1,
    third: 2,
    '3rd': 2,
    fourth: 3,
    '4th': 3,
    fifth: 4,
    '5th': 4,
  };
  if (ordinal && places[ordinalIndex[ordinal]]) return places[ordinalIndex[ordinal]];
  return places.find((place) => {
    const words = normalize(place.name)
      .split(' ')
      .filter((word) => word.length > 3);
    return words.some((word) => question.includes(word));
  });
}

export function answerParkingQuestion(question: string, context: CopilotContext): CopilotAnswer {
  const q = normalize(question);
  const sensors = context.sensorSummary;
  const places = [...(context.places || [])].sort((a, b) => a.distanceKm - b.distanceKm);
  const place = referencedPlace(q, places);
  const requestedBay = q.match(/\ba\s?([1-4])\b/i)?.[1];
  const bayId = requestedBay ? `A${requestedBay}` : undefined;
  const bay = bayId ? sensors?.bays?.find((item) => item.bayId.toUpperCase() === bayId) : undefined;

  if (!q)
    return {
      text: 'Ask me where to park, which bay is free, what an option costs, how far it is, or how booking works.',
    };
  if (includesAny(q, ['hello', 'hi ', 'hey', 'good morning', 'good evening']) || q === 'hi')
    return {
      text: `Hi! I can see ${places.length} parking option${places.length === 1 ? '' : 's'} around ${context.location}. Ask me for the nearest, cheapest, free, or sensor-confirmed option.`,
    };
  if (includesAny(q, ['what can you do', 'help me', 'how can you help', 'your features']))
    return {
      text: 'I can compare visible parking options, explain live bay readings, identify free bays, answer price and distance questions, guide bookings, open directions, manage parking timers, and explain forecasts or sensor reliability.',
    };

  if (bayId) {
    if (!bay)
      return {
        text: `${bayId} has no current reading. For safety it remains unavailable until a fresh sensor update arrives.`,
      };
    if (includesAny(q, ['updated', 'last reading', 'when']))
      return {
        text: `${bayId} was updated at ${new Date(bay.observedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}. It is currently ${bay.state.toLowerCase()}.`,
      };
    if (includesAny(q, ['distance', 'reading', 'centimeter', 'cm']))
      return {
        text:
          bay.distanceCm == null
            ? `${bayId} has no valid ultrasonic reading, so it cannot be treated as available.`
            : `${bayId} measures ${bay.distanceCm.toFixed(1)} cm and is classified as ${bay.state.toLowerCase()}.`,
      };
    if (bay.state === 'Uncertain' || bay.state === 'Stale')
      return {
        text: `${bayId} is ${bay.state.toLowerCase()}, so it is excluded from the available count and cannot be selected.`,
      };
    return {
      text: `${bayId} is ${bay.state.toLowerCase()}. ${bay.state === 'Available' ? 'It can be selected while the reading remains fresh and online.' : 'Choose one of the green free bays instead.'}`,
    };
  }

  if (place) {
    if (includesAny(q, ['direction', 'navigate', 'route', 'how do i get', 'take me']))
      return {
        text: `${place.name} is ${distance(place.distanceKm)} away. I can open driving directions to it.`,
        action: 'directions',
      };
    if (includesAny(q, ['price', 'cost', 'rate', 'charge', 'free']))
      return { text: `${place.name} is ${money(place.pricePerHour)}. ${place.availability}` };
    if (includesAny(q, ['available', 'space', 'occupancy', 'full', 'empty']))
      return {
        text: `${place.name}: ${place.availability} ${place.source === 'sensor' ? 'This status comes from the four-bay sensor feed.' : place.source === 'sample' ? 'This is clearly labeled sample availability.' : 'The mapped listing does not provide verified live occupancy.'}`,
      };
    return {
      text: `${place.name} is ${distance(place.distanceKm)} away, ${money(place.pricePerHour)}, and currently shows: ${place.availability}`,
    };
  }

  if (includesAny(q, ['nearest', 'closest', 'near me', 'nearby', 'shortest walk'])) {
    const nearest = places[0];
    return nearest
      ? {
          text: `The closest visible option is ${nearest.name}, ${distance(nearest.distanceKm)} away. ${nearest.availability}`,
          action: 'directions',
        }
      : {
          text: 'No parking results are visible yet. Search a destination or tap the map first.',
          action: 'find',
        };
  }
  if (
    includesAny(q, [
      'how many parking',
      'number of parking',
      'how many options',
      'why 8',
      'why eight',
    ])
  )
    return {
      text: `${context.mappedPlaces} parking option${context.mappedPlaces === 1 ? ' is' : 's are'} currently visible within ${context.radiusKm < 1 ? `${Math.round(context.radiusKm * 1000)} m` : `${context.radiusKm} km`}. Sample options appear immediately; mapped OpenStreetMap listings are added when available.`,
    };
  if (includesAny(q, ['cheapest', 'lowest price', 'least expensive', 'budget'])) {
    const priced = places
      .filter((item) => item.pricePerHour != null)
      .sort((a, b) => Number(a.pricePerHour) - Number(b.pricePerHour));
    return priced[0]
      ? {
          text: `${priced[0].name} is the lowest-priced visible option at ${money(priced[0].pricePerHour)}, ${distance(priced[0].distanceKm)} away.`,
        }
      : {
          text: 'None of the current mapped listings provides a usable price. Missing map data should not be treated as free parking.',
        };
  }
  if (includesAny(q, ['free parking', 'free option', 'without payment'])) {
    const free = places.find((item) => item.free);
    return free
      ? {
          text: `${free.name} is marked as a free sample option and is ${distance(free.distanceKm)} away. Confirm signs and facility rules when you arrive.`,
        }
      : {
          text: 'No visible option is currently marked free. A missing price does not mean a facility is free.',
        };
  }
  if (includesAny(q, ['direction', 'navigate', 'route', 'take me'])) {
    const target = places.find((item) => item.name === context.selectedPlace) || places[0];
    return target
      ? {
          text: `I can open driving directions to ${target.name}, ${distance(target.distanceKm)} away.`,
          action: 'directions',
        }
      : { text: 'Select a parking result first, then ask me to open directions.', action: 'find' };
  }
  if (
    includesAny(q, [
      'where am i searching',
      'destination',
      'current location',
      'search area',
      'where is this',
    ])
  )
    return {
      text: `The current destination is ${context.location}, and the search radius is ${context.radiusKm < 1 ? `${Math.round(context.radiusKm * 1000)} metres` : `${context.radiusKm} kilometres`}.`,
      action: 'find',
    };
  if (includesAny(q, ['which bay', 'select a bay', 'where should i park', 'best bay'])) {
    const selectable =
      sensors?.bays
        ?.filter((item) => item.state === 'Available' && item.sensorReady && item.deviceOnline)
        .map((item) => item.bayId) || [];
    return {
      text: selectable.length
        ? `${selectable.join(' and ')} ${selectable.length === 1 ? 'is' : 'are'} currently free with fresh sensor readings. Choose the most convenient green bay when you reach the demo lot.`
        : 'No bay currently has a fresh, online Available reading. Please wait for an update or choose another facility.',
    };
  }
  if (
    includesAny(q, [
      'live',
      'sensor',
      'esp32',
      'ultrasonic',
      'occupancy',
      'reporting',
      'available spaces',
      'empty bays',
      'full',
    ])
  ) {
    if (!sensors?.total)
      return {
        text: 'No ultrasonic readings are available. OpenStreetMap provides locations but does not provide live bay occupancy.',
        action: 'find',
      };
    return {
      text: `${sensors.mode === 'demo' ? 'The demo feed' : 'The live ESP32 feed'} shows ${sensors.available} available and ${sensors.occupied} occupied bays. ${sensors.reporting ?? 0}/${sensors.total} sensors are reporting. Uncertain or stale bays are never counted as free.`,
    };
  }
  if (includesAny(q, ['fine', 'penalty', 'overstay', 'late leaving', 'time ended', 'extra charge']))
    return {
      text: 'The demo allows a 5-minute exit grace period. If the bay remains occupied after that, it shows an illustrative ₹20 overstay fee for each started 15-minute block. The bay stays unavailable until its sensor confirms the vehicle has left. No real payment is collected.',
      action: 'reservations',
    };
  if (
    includesAny(q, [
      'i am leaving',
      'end parking',
      'finish parking',
      'remove car',
      'vehicle still detected',
    ])
  )
    return {
      text: 'Selecting “I’m leaving” sends an exit request; it cannot free the bay. With a connected sensor, the session completes only after the bay reports Available continuously for five seconds. Stale or uncertain readings keep the bay unavailable.',
      action: 'reservations',
    };
  if (
    includesAny(q, [
      'book later',
      'future booking',
      'schedule',
      'tonight',
      'tomorrow',
      'birthday',
      '8 pm',
      '9 pm',
    ])
  )
    return {
      text: 'Choose an arrival date and time, duration, and a bay that has no overlapping reservation. Check-in opens 15 minutes early and closes 15 minutes after the scheduled start. The reserved end time stays fixed if you arrive late.',
      action: 'booking',
    };
  if (
    includesAny(q, ['no show', 'miss booking', 'late arrival', 'arrival grace', 'check in early'])
  )
    return {
      text: 'Check-in opens 15 minutes before arrival. If you do not enter the correct PIN within 15 minutes after the scheduled start, the reservation becomes a no-show and the reserved time slot is released.',
      action: 'reservations',
    };
  if (includesAny(q, ['book', 'reserve', 'reservation', 'ticket', 'pass', 'payment', 'pay']))
    return {
      text: `ParkPredict can preview scheduled reservations and prevent overlapping time slots on this device. ${context.savedBookings} open pass${context.savedBookings === 1 ? ' is' : 'es are'} saved locally. Production booking needs a shared operator database, server time, and payment backend.`,
      action: context.savedBookings ? 'reservations' : 'booking',
    };
  if (includesAny(q, ['find my car', 'locate my car', 'where did i park', 'parking timer']))
    return context.activeParking
      ? {
          text: 'You have an active parking timer. Open Parking History to see the saved facility and elapsed time. The app does not continuously track the vehicle with GPS.',
          action: 'activity',
        }
      : {
          text: 'There is no active parking timer. Start one from a parking result after you park.',
          action: 'activity',
        };
  if (includesAny(q, ['extend', 'more time', 'add time']))
    return context.activeParking
      ? {
          text: 'Your active timer can be extended by one hour. This changes the local timer only and does not extend a real facility booking.',
          action: 'extend',
        }
      : { text: 'There is no active timer to extend.', action: 'activity' };
  if (includesAny(q, ['history', 'previous parking', 'past parking', 'last parked']))
    return {
      text: `You have ${context.savedSessions} saved parking session${context.savedSessions === 1 ? '' : 's'} on this device.`,
      action: 'history',
    };
  if (includesAny(q, ['vehicle', 'my car', 'suv', 'two wheeler', 'bike', 'accessible']))
    return {
      text: `Your current vehicle profile is ${context.vehicle}${context.ev ? ' with EV charging requested' : ''}${context.accessible ? ' with accessible parking requested' : ''}. You can edit it before comparing or booking.`,
      action: 'profile',
    };
  if (includesAny(q, ['ev', 'electric', 'charger', 'charging']))
    return {
      text: 'I can prioritize facilities whose map data explicitly lists EV charging. Missing tags do not prove that charging is unavailable.',
      action: 'ev',
    };
  if (includesAny(q, ['forecast', 'prediction', 'busy later', 'future availability']))
    return {
      text: 'Forecasts estimate future demand from the project model and remain separate from current ultrasonic readings. Open Forecast to compare the selected time.',
      action: 'predictions',
    };
  if (includesAny(q, ['how does this work', 'what is parkpredict', 'explain the app', 'project']))
    return {
      text: 'ParkPredict finds parking around a destination, adds mapped OpenStreetMap listings, shows four-bay ultrasonic occupancy when the ESP32 feed is available, and provides sample forecasting, booking, directions, reminders, and parking-history flows.',
    };
  if (includesAny(q, ['thank', 'thanks', 'okay', 'got it']))
    return {
      text: 'You’re welcome. Ask me for the nearest option, a specific bay, prices, directions, or booking help whenever you need it.',
    };

  return {
    text: `I could not confidently connect that question to the current parking journey. I can help with the ${places.length} visible options around ${context.location}, bay availability, distance, pricing, directions, booking, forecasts, vehicle settings, or parking history. Try asking in your own words with the place or bay name.`,
  };
}
