import { ParkingLot } from '../types';

export const SEED_PONDICHERRY_LOTS: ParkingLot[] = [
  {
    id: 'lot-pondy-white-town',
    name: 'White Town Promenade Smart Deck',
    area: 'White Town',
    address: 'Rue Dumas, Near French Consulate & Promenade, Puducherry 605001',
    landmark: 'Adjacent to Rock Beach Promenade & Alliance Française',
    coordinates: {
      lat: 11.9332,
      lng: 79.8355,
    },
    totalCapacity: 340,
    currentOccupancy: 228, // 112 available (~33% available)
    simulatedTrendOffset: 0.2,
    hourlyRate: 40,
    dailyRate: 280,
    type: 'covered_multilevel',
    amenities: [
      'ev_charging',
      'covered',
      'cctv',
      'security_guard',
      'valet',
      'accessible',
      'fast_tag_entry',
      'elevator',
      'restrooms'
    ],
    operatingHours: {
      open: '06:00',
      close: '23:30',
      is24x7: false,
    },
    heightLimitMeters: 2.2,
    allowedVehicles: ['sedan', 'suv', 'hatchback', 'ev', 'motorcycle'],
    rating: 4.8,
    reviewCount: 384,
    images: [
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'
    ],
    isOpen: true,
    cancellationPolicy: 'Free cancellation up to 15 minutes before arrival.',
    entryGateDescription: 'Main entrance on Rue Dumas. Follow green LED indicators for EV charging on Ground Floor.',
    walkingMinutesFromCenter: 2,
  },
  {
    id: 'lot-pondy-rock-beach',
    name: 'Rock Beach Oceanfront Bay',
    area: 'Beach Road',
    address: 'Goubert Avenue, Near Old Lighthouse, Puducherry 605001',
    landmark: 'Directly behind Gandhi Memorial & Promenade Beach Walk',
    coordinates: {
      lat: 11.9305,
      lng: 79.8356,
    },
    totalCapacity: 260,
    currentOccupancy: 232, // 28 available (~11% available - Limited/Crowded)
    simulatedTrendOffset: 0.35,
    hourlyRate: 30,
    dailyRate: 200,
    type: 'open_bay',
    amenities: [
      'cctv',
      'security_guard',
      'accessible',
      'fast_tag_entry'
    ],
    operatingHours: {
      open: '05:00',
      close: '23:00',
      is24x7: false,
    },
    heightLimitMeters: 3.2,
    allowedVehicles: ['sedan', 'suv', 'hatchback', 'ev', 'motorcycle'],
    rating: 4.6,
    reviewCount: 290,
    images: [
      'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80'
    ],
    isOpen: true,
    cancellationPolicy: 'Free cancellation up to 10 minutes prior.',
    entryGateDescription: 'Ingress via South Boulevard sea-facing road.',
    walkingMinutesFromCenter: 1,
  },
  {
    id: 'lot-pondy-bharathi-park',
    name: 'Bharathi Park Automated Mechanical Garage',
    area: 'Government Park Enclave',
    address: 'Rue Saint Gilles, Near Raj Nivas, Puducherry 605001',
    landmark: 'Opposite Aayi Mandapam & Governor Palace',
    coordinates: {
      lat: 11.9328,
      lng: 79.8338,
    },
    totalCapacity: 190,
    currentOccupancy: 85, // 105 available (~55% available - High)
    simulatedTrendOffset: -0.1,
    hourlyRate: 35,
    dailyRate: 240,
    type: 'automated_garage',
    amenities: [
      'covered',
      'cctv',
      'security_guard',
      'fast_tag_entry',
      'elevator',
      'accessible'
    ],
    operatingHours: {
      open: '06:00',
      close: '22:30',
      is24x7: false,
    },
    heightLimitMeters: 2.1,
    allowedVehicles: ['sedan', 'hatchback', 'ev'],
    rating: 4.7,
    reviewCount: 165,
    images: [
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'
    ],
    isOpen: true,
    cancellationPolicy: 'Free cancellation anytime before arrival time.',
    entryGateDescription: 'Automated mechanical pallet system. Drive onto bay turntable 1.',
    walkingMinutesFromCenter: 3,
  },
  {
    id: 'lot-pondy-mission-st',
    name: 'Mission Street Heritage Multi-Deck',
    area: 'Heritage Town',
    address: 'Mission Street, Near Cathedral & Shopping Corridor, Puducherry 605001',
    landmark: 'Corner of Rangapillai St & Mission St',
    coordinates: {
      lat: 11.9362,
      lng: 79.8288,
    },
    totalCapacity: 450,
    currentOccupancy: 310, // 140 available (~31% available)
    simulatedTrendOffset: 0.15,
    hourlyRate: 40,
    dailyRate: 260,
    type: 'covered_multilevel',
    amenities: [
      'ev_charging',
      'covered',
      'cctv',
      'security_guard',
      'valet',
      'accessible',
      'fast_tag_entry',
      'elevator',
      'restrooms'
    ],
    operatingHours: {
      open: '08:30',
      close: '23:00',
      is24x7: false,
    },
    heightLimitMeters: 2.3,
    allowedVehicles: ['sedan', 'suv', 'hatchback', 'ev', 'motorcycle'],
    rating: 4.8,
    reviewCount: 412,
    images: [
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80'
    ],
    isOpen: true,
    cancellationPolicy: 'Free cancellation up to 20 minutes before booking.',
    entryGateDescription: 'Multi-lane automated entry on Mission Street north ramp.',
    walkingMinutesFromCenter: 2,
  },
  {
    id: 'lot-pondy-auroville',
    name: 'Auroville Visitors Centre Eco-Parking',
    area: 'Auroville',
    address: 'Auroville Main Road, Near Matrimandir Plaza, Puducherry 605101',
    landmark: 'Directly at Auroville Welcome Centre & Solar Kitchen Bus Stop',
    coordinates: {
      lat: 12.0075,
      lng: 79.8112,
    },
    totalCapacity: 580,
    currentOccupancy: 210, // 370 available (~64% available - High)
    simulatedTrendOffset: -0.15,
    hourlyRate: 25,
    dailyRate: 150,
    type: 'open_bay',
    amenities: [
      'ev_charging',
      'cctv',
      'security_guard',
      'accessible',
      'restrooms',
      'fast_tag_entry'
    ],
    operatingHours: {
      open: '06:00',
      close: '20:00',
      is24x7: false,
    },
    heightLimitMeters: 3.5,
    allowedVehicles: ['sedan', 'suv', 'hatchback', 'ev', 'motorcycle'],
    rating: 4.9,
    reviewCount: 520,
    images: [
      'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80'
    ],
    isOpen: true,
    cancellationPolicy: 'Free cancellation anytime prior to trip.',
    entryGateDescription: 'Solar canopy shaded parking. 12 Type-2 chargers available at Section E.',
    walkingMinutesFromCenter: 1,
  },
  {
    id: 'lot-pondy-railway',
    name: 'Puducherry Railway Junction Smart Lot',
    area: 'South Boulevard',
    address: 'Station Road, Subbiah Salai, Puducherry 605001',
    landmark: 'Adjacent to Main Station Concourse & Prepaid Auto Stand',
    coordinates: {
      lat: 11.9288,
      lng: 79.8285,
    },
    totalCapacity: 280,
    currentOccupancy: 175, // 105 available (~38% available)
    simulatedTrendOffset: 0.05,
    hourlyRate: 30,
    dailyRate: 180,
    type: 'covered_multilevel',
    amenities: [
      'covered',
      'cctv',
      'security_guard',
      'accessible',
      'fast_tag_entry',
      'restrooms'
    ],
    operatingHours: {
      open: '00:00',
      close: '23:59',
      is24x7: true,
    },
    heightLimitMeters: 2.4,
    allowedVehicles: ['sedan', 'suv', 'hatchback', 'ev', 'motorcycle'],
    rating: 4.5,
    reviewCount: 240,
    images: [
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'
    ],
    isOpen: true,
    cancellationPolicy: 'Free cancellation up to 30 mins before arrival.',
    entryGateDescription: 'Direct access via Subbiah Salai passenger arrival road.',
    walkingMinutesFromCenter: 2,
  },
  {
    id: 'lot-pondy-serenity',
    name: 'Serenity Surf Beach Parking Deck',
    area: 'East Coast Road',
    address: 'Serenity Beach Road, Kottakuppam, Puducherry 605104',
    landmark: 'Opposite Serenity Surf School & Coastal Rocks',
    coordinates: {
      lat: 11.9685,
      lng: 79.8432,
    },
    totalCapacity: 210,
    currentOccupancy: 140, // 70 available (~33% available)
    simulatedTrendOffset: 0.25,
    hourlyRate: 25,
    dailyRate: 150,
    type: 'open_bay',
    amenities: [
      'cctv',
      'security_guard',
      'accessible',
      'restrooms'
    ],
    operatingHours: {
      open: '05:30',
      close: '21:30',
      is24x7: false,
    },
    heightLimitMeters: 3.5,
    allowedVehicles: ['sedan', 'suv', 'hatchback', 'ev', 'motorcycle'],
    rating: 4.6,
    reviewCount: 195,
    images: [
      'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80'
    ],
    isOpen: true,
    cancellationPolicy: 'Free cancellation up to 15 mins prior.',
    entryGateDescription: 'Main beachfront access gate off ECR coastal loop.',
    walkingMinutesFromCenter: 1,
  }
];
