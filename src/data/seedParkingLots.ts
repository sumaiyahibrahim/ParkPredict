import { ParkingLot, ParkingReview } from '../types';

export const SEED_PARKING_LOTS: ParkingLot[] = [
  {
    id: 'lot-vr-mall',
    name: 'VR Mall Smart Deck',
    area: 'Anna Nagar West',
    address: '100 Feet Rd, Thirumangalam, Anna Nagar, Chennai 600040',
    landmark: 'Opposite Thirumangalam Metro Station',
    coordinates: {
      lat: 13.0850,
      lng: 80.1983,
    },
    totalCapacity: 850,
    currentOccupancy: 612, // 238 available (~28% available - limited)
    simulatedTrendOffset: 0.15,
    hourlyRate: 50,
    dailyRate: 350,
    type: 'mall_deck',
    amenities: [
      'ev_charging',
      'covered',
      'cctv',
      'security_guard',
      'valet',
      'accessible',
      'fast_tag_entry',
      'elevator',
      'restrooms',
      'car_wash'
    ],
    operatingHours: {
      open: '09:00',
      close: '23:30',
      is24x7: false,
    },
    heightLimitMeters: 2.2,
    allowedVehicles: ['sedan', 'suv', 'hatchback', 'ev'],
    rating: 4.8,
    reviewCount: 428,
    images: [
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80'
    ],
    isOpen: true,
    cancellationPolicy: 'Free cancellation up to 15 minutes before scheduled arrival.',
    entryGateDescription: 'Enter via Gate 2 on 100 Feet Road. Follow EV Charging signage for Level B1.',
    walkingMinutesFromCenter: 2,
  },
  {
    id: 'lot-anna-tower',
    name: 'Anna Nagar Tower Park Facility',
    area: 'Anna Nagar East',
    address: '3rd Main Rd, Tower Park Enclave, Anna Nagar, Chennai 600040',
    landmark: 'Adjacent to Dr. Visveswaraya Tower Park',
    coordinates: {
      lat: 13.0880,
      lng: 80.2120,
    },
    totalCapacity: 260,
    currentOccupancy: 110, // 150 available (~58% available - high)
    simulatedTrendOffset: -0.1,
    hourlyRate: 30,
    dailyRate: 200,
    type: 'covered_multilevel',
    amenities: [
      'covered',
      'cctv',
      'security_guard',
      'accessible',
      'fast_tag_entry',
      'elevator'
    ],
    operatingHours: {
      open: '05:30',
      close: '22:30',
      is24x7: false,
    },
    heightLimitMeters: 2.1,
    allowedVehicles: ['sedan', 'suv', 'hatchback', 'ev', 'motorcycle'],
    rating: 4.6,
    reviewCount: 184,
    images: [
      'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'
    ],
    isOpen: true,
    cancellationPolicy: 'Free cancellation anytime before arrival time.',
    entryGateDescription: 'Main ingress from 3rd Avenue. Automated number plate reader enabled.',
    walkingMinutesFromCenter: 4,
  },
  {
    id: 'lot-express-avenue',
    name: 'Express Avenue Central Hub',
    area: 'Royapettah',
    address: '2 Club House Road, Royapettah, Chennai 600002',
    landmark: 'Near Thousand Lights Mosque & Mount Road',
    coordinates: {
      lat: 13.0588,
      lng: 80.2642,
    },
    totalCapacity: 1200,
    currentOccupancy: 890, // 310 available (~25% available - limited)
    simulatedTrendOffset: 0.2,
    hourlyRate: 60,
    dailyRate: 400,
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
      open: '09:30',
      close: '23:00',
      is24x7: false,
    },
    heightLimitMeters: 2.3,
    allowedVehicles: ['sedan', 'suv', 'hatchback', 'ev'],
    rating: 4.7,
    reviewCount: 512,
    images: [
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'
    ],
    isOpen: true,
    cancellationPolicy: 'Free cancellation up to 30 minutes before arrival.',
    entryGateDescription: 'Use North Gate on Whites Road for direct basement ramps B1-B3.',
    walkingMinutesFromCenter: 1,
  },
  {
    id: 'lot-phoenix-velachery',
    name: 'Phoenix Marketcity Smart Deck',
    area: 'Velachery',
    address: '142 Velachery Main Road, Indira Gandhi Nagar, Chennai 600042',
    landmark: 'Opposite Grand Chola corridor / Velachery Station',
    coordinates: {
      lat: 12.9915,
      lng: 80.2170,
    },
    totalCapacity: 1450,
    currentOccupancy: 980, // 470 available (~32% available)
    simulatedTrendOffset: 0.1,
    hourlyRate: 60,
    dailyRate: 420,
    type: 'mall_deck',
    amenities: [
      'ev_charging',
      'covered',
      'cctv',
      'security_guard',
      'valet',
      'accessible',
      'fast_tag_entry',
      'elevator',
      'restrooms',
      'car_wash'
    ],
    operatingHours: {
      open: '10:00',
      close: '23:30',
      is24x7: false,
    },
    heightLimitMeters: 2.4,
    allowedVehicles: ['sedan', 'suv', 'hatchback', 'ev'],
    rating: 4.9,
    reviewCount: 680,
    images: [
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80'
    ],
    isOpen: true,
    cancellationPolicy: 'Free cancellation up to 20 minutes before booking.',
    entryGateDescription: 'Multi-lane automated entry on Velachery Bypass ramp. 16 DC fast chargers at Pillar P4.',
    walkingMinutesFromCenter: 2,
  },
  {
    id: 'lot-airport-t2',
    name: 'Chennai Airport T2 Multi-Level Car Park',
    area: 'Meenambakkam',
    address: 'GST Road, Meenambakkam Airport Complex, Chennai 600027',
    landmark: 'Terminal 2 International & Domestic Inter-link',
    coordinates: {
      lat: 12.9818,
      lng: 80.1643,
    },
    totalCapacity: 2100,
    currentOccupancy: 1350, // 750 available (~35% available)
    simulatedTrendOffset: 0.05,
    hourlyRate: 70,
    dailyRate: 500,
    type: 'covered_multilevel',
    amenities: [
      'ev_charging',
      'covered',
      'cctv',
      'security_guard',
      'accessible',
      'fast_tag_entry',
      'elevator',
      'restrooms'
    ],
    operatingHours: {
      open: '00:00',
      close: '23:59',
      is24x7: true,
    },
    heightLimitMeters: 2.5,
    allowedVehicles: ['sedan', 'suv', 'hatchback', 'ev'],
    rating: 4.8,
    reviewCount: 940,
    images: [
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'
    ],
    isOpen: true,
    cancellationPolicy: 'Free cancellation up to 1 hour before scheduled flight arrival window.',
    entryGateDescription: 'Dedicated elevated approach bridge from GST flyover. Direct passenger skywalk into T1 & T2.',
    walkingMinutesFromCenter: 3,
  },
  {
    id: 'lot-marina-promenade',
    name: 'Marina Beach Promenade Bay Parking',
    area: 'Marina Beach',
    address: 'Kamarajar Salai, Triplicane, Chennai 600005',
    landmark: 'Behind Gandhi Statue & Lighthouse Beach Walk',
    coordinates: {
      lat: 13.0475,
      lng: 80.2824,
    },
    totalCapacity: 340,
    currentOccupancy: 290, // 50 available (~14% available - limited/crowded)
    simulatedTrendOffset: 0.3,
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
      open: '05:00',
      close: '23:00',
      is24x7: false,
    },
    heightLimitMeters: 3.5,
    allowedVehicles: ['sedan', 'suv', 'hatchback', 'ev', 'motorcycle'],
    rating: 4.3,
    reviewCount: 220,
    images: [
      'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80'
    ],
    isOpen: true,
    cancellationPolicy: 'Free cancellation up to 10 minutes prior.',
    entryGateDescription: 'Entry from Kamarajar Salai sea-facing service lane.',
    walkingMinutesFromCenter: 1,
  },
  {
    id: 'lot-tnagar-smart',
    name: 'T. Nagar Ranganathan St Automated Garage',
    area: 'T. Nagar',
    address: '45 Usman Road, Prakasam St Junction, T. Nagar, Chennai 600017',
    landmark: 'Opposite Panagal Park / Ranganathan Street Entrance',
    coordinates: {
      lat: 13.0418,
      lng: 80.2337,
    },
    totalCapacity: 180,
    currentOccupancy: 165, // 15 available (~8% available - almost full)
    simulatedTrendOffset: 0.35,
    hourlyRate: 40,
    dailyRate: 280,
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
      open: '08:00',
      close: '22:30',
      is24x7: false,
    },
    heightLimitMeters: 2.0,
    allowedVehicles: ['sedan', 'hatchback', 'ev'],
    rating: 4.5,
    reviewCount: 310,
    images: [
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80'
    ],
    isOpen: true,
    cancellationPolicy: 'Free cancellation up to 15 minutes before arrival.',
    entryGateDescription: 'High-density automated mechanical pallet system. Drive onto turntable at Bay 1.',
    walkingMinutesFromCenter: 1,
  },
  {
    id: 'lot-omr-techpark',
    name: 'OMR IT Corridor Smart Tech Park',
    area: 'Kandanchavadi',
    address: 'Rajiv Gandhi Salai, Kandanchavadi, Chennai 600096',
    landmark: 'Near SP Infocity & Perungudi Toll Plaza',
    coordinates: {
      lat: 12.9654,
      lng: 80.2452,
    },
    totalCapacity: 650,
    currentOccupancy: 280, // 370 available (~56% available - high)
    simulatedTrendOffset: -0.05,
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
      open: '06:00',
      close: '23:00',
      is24x7: false,
    },
    heightLimitMeters: 2.3,
    allowedVehicles: ['sedan', 'suv', 'hatchback', 'ev', 'motorcycle'],
    rating: 4.7,
    reviewCount: 265,
    images: [
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80'
    ],
    isOpen: true,
    cancellationPolicy: 'Free cancellation up to 20 minutes before booking.',
    entryGateDescription: 'Enter via Service Road Gate 3. Direct access to EV fast chargers on Ground Floor.',
    walkingMinutesFromCenter: 2,
  }
];

export const SAMPLE_REVIEWS: Record<string, ParkingReview[]> = {
  'lot-vr-mall': [
    {
      id: 'rev-1',
      lotId: 'lot-vr-mall',
      userName: 'Karthik Ramanathan',
      userBadge: 'Frequent Commuter',
      rating: 5,
      date: '2 days ago',
      comment: 'The prediction told me spots would be tight by 5 PM, so I reserved at 4 PM. Drove straight in via FastTag, spot was held and the EV fast charger worked flawlessly.',
      ratingsBreakdown: {
        availabilityAccuracy: 5,
        cleanliness: 5,
        security: 5,
        easeOfParking: 5
      },
      verifiedTrip: true
    },
    {
      id: 'rev-2',
      lotId: 'lot-vr-mall',
      userName: 'Priya Sundaram',
      userBadge: 'EV Driver',
      rating: 5,
      date: '1 week ago',
      comment: 'Very clean multi-level deck. The app guided me right to Pillar 4B and finding my car later with the built-in locator saved me 15 minutes of wandering.',
      ratingsBreakdown: {
        availabilityAccuracy: 5,
        cleanliness: 5,
        security: 4,
        easeOfParking: 5
      },
      verifiedTrip: true
    }
  ],
  'lot-express-avenue': [
    {
      id: 'rev-3',
      lotId: 'lot-express-avenue',
      userName: 'Arun Venkatesh',
      userBadge: 'Weekend Shopper',
      rating: 4,
      date: 'Yesterday',
      comment: 'Great central location. Weekend rush was intense, but having a digital parking pass made entry instant without queuing for a paper token.',
      ratingsBreakdown: {
        availabilityAccuracy: 4,
        cleanliness: 5,
        security: 5,
        easeOfParking: 4
      },
      verifiedTrip: true
    }
  ]
};
