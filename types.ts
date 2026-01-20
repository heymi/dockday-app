
export type Step = 'TRIP' | 'SERVICES' | 'ITINERARY' | 'CREW' | 'PAYMENT';

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  type: 'CORE' | 'ADDON';
  selected: boolean;
  image?: string;
  images?: string[];
  duration?: string;
  baseDurationMinutes?: number;
  shareType?: 'SPLITTABLE' | 'PER_PERSON';
  tags?: string[];
  variants?: ServiceVariant[];
  selectedVariantId?: string;
}

export interface ServiceVariant {
  id: string;
  title: string;
  subtitle?: string;
  price: number;
  duration?: string;
  detail?: string;
  shareType?: 'SPLITTABLE' | 'PER_PERSON';
}

export interface CityPoint {
  id: string;
  name: string;
  type: 'SHOPPING' | 'SIGHTSEEING' | 'FOOD' | 'ENTERTAINMENT';
  duration: number; // in minutes
  image: string;
  selected: boolean;
}

export interface BookingState {
  step: number;
  date: string;
  port: string;
  vesselName: string;
  mmsi: string;
  groupSize: number;
  isSplitBill: boolean;
  selectedPackageId?: '4h' | '8h' | 'trip' | 'shift';
  paymentHoldMethod?: 'preauth' | 'offline';
  services: ServiceItem[];
  itinerary: CityPoint[];
  crewName: string;
  passportNumber: string;
  notes: string;
  serviceOrder: string[];
  customLoungeDurationHours: number;

  // Shift-change / agent booking (local MVP)
  agentContactType?: 'phone' | 'email';
  agentContactValue?: string;
  agentVerified?: boolean;
  carCount?: number;
  transferType?: 'airport' | 'port';
  transferDateTime?: string; // ISO string or datetime-local value
  airportFlightNumber?: string;
  portVesselName?: string;
  portVesselNumber?: string;
  crewNationalities?: string[];
  contactName?: string;
  contactPhone?: string;
  pickupPoint?: string;
  pickupIdentifier?: string;
  pickupTerminal?: string;
  pickupGate?: string;
  destination?: string;
  destinationType?: 'hotel' | 'port' | 'other';
  luggageNotes?: string;
  specialRequests?: string;
  needHotel?: boolean;
  hotelName?: string;
  hotelNights?: number;
  needMeal?: boolean;
  mealPlan?: 'standard' | 'premium';
  mealCount?: number;
  agencyCompanyId?: string;
  billingAccountId?: string;
  billingTermsAccepted?: boolean;
}

export const PORTS = [
  "Xinshengwei Port Area",
  "Shanghai Wusongkou",
  "Tianjin International Cruise Port",
  "Qingdao Cruise Terminal"
];

export const INITIAL_SERVICES: ServiceItem[] = [
  {
    id: 'core-8h',
    title: '8-Hour Full Service',
    description: 'Private business van, bilingual escort, insurance coverage.',
    price: 399.00,
    type: 'CORE',
    selected: true,
    duration: '8h',
    baseDurationMinutes: 480,
    shareType: 'SPLITTABLE',
    image: 'https://picsum.photos/seed/core/320/200',
    images: [
      'https://picsum.photos/seed/core1/960/540',
      'https://picsum.photos/seed/core2/960/540',
      'https://picsum.photos/seed/core3/960/540',
    ]
  },
  {
    id: 'addon-ext',
    title: 'Service Extension (2 or 4 Hours)',
    description: 'Extend your shore leave by an additional 2 or 4 hours. Keep total duration before 23:00 to comply with port rules.',
    price: 150.00,
    type: 'ADDON',
    selected: false,
    duration: 'Entire journey',
    baseDurationMinutes: 0,
    shareType: 'SPLITTABLE',
    image: 'https://picsum.photos/seed/extension/320/200',
    images: [
      'https://picsum.photos/seed/extension1/960/540',
      'https://picsum.photos/seed/extension2/960/540'
    ],
    tags: ['Entire journey'],
    variants: [
      { id: 'ext-2h', title: 'Add 2 hours', subtitle: 'Extend your itinerary', price: 150, duration: '+2h', shareType: 'SPLITTABLE' },
      { id: 'ext-4h', title: 'Add 4 hours', subtitle: 'Late-night buffer', price: 250, duration: '+4h', shareType: 'SPLITTABLE' },
    ]
  },
  {
    id: 'addon-lounge',
    title: 'Private Music Lounge for Drinks',
    description: 'Private lounge with music, drinks, and snacks. Unlimited room time for the booked slot.',
    price: 99.00,
    type: 'ADDON',
    selected: false,
    duration: '3 hours',
    baseDurationMinutes: 180,
    shareType: 'SPLITTABLE',
    image: 'https://picsum.photos/seed/lounge/320/200',
    images: [
      'https://picsum.photos/seed/lounge1/960/540',
      'https://picsum.photos/seed/lounge2/960/540',
      'https://picsum.photos/seed/lounge3/960/540'
    ],
    variants: [
      { id: 'lounge-12', title: 'Corona 12-pack', subtitle: 'Corona (275ml) ×12', price: 99, shareType: 'SPLITTABLE' },
      { id: 'lounge-24', title: 'Corona 24-pack', subtitle: 'Corona (275ml) ×24', price: 150, shareType: 'SPLITTABLE' },
    ]
  },
  {
    id: 'addon-meal',
    title: 'Local Chinese Cuisine Meal',
    description: 'Mid/high-end dining with Huaiyang and local Nanjing dishes. $30 per person, per meal.',
    price: 30.00,
    type: 'ADDON',
    selected: false,
    duration: '1 hour',
    baseDurationMinutes: 60,
    shareType: 'PER_PERSON',
    image: 'https://picsum.photos/seed/meal/320/200',
    images: [
      'https://picsum.photos/seed/meal1/960/540',
      'https://picsum.photos/seed/meal2/960/540'
    ]
  },
  {
    id: 'addon-banquet',
    title: 'Signature Banquet Dining',
    description: 'Group dining at reputable restaurants with curated multi-course menus. Perfect for crew celebrations.',
    price: 35.00,
    type: 'ADDON',
    selected: false,
    duration: '1.5 hours',
    baseDurationMinutes: 90,
    shareType: 'PER_PERSON',
    image: 'https://picsum.photos/seed/banquet/320/200',
    images: [
      'https://picsum.photos/seed/banquet1/960/540',
      'https://picsum.photos/seed/banquet2/960/540'
    ],
    tags: ['Dining'],
    variants: [
      { id: 'banquet-standard', title: 'Standard Set', subtitle: 'Classic dishes, dessert, soft drinks', price: 35, shareType: 'PER_PERSON' },
      { id: 'banquet-premium', title: 'Premium Set', subtitle: 'Seafood focus, dessert, soft drinks', price: 55, shareType: 'PER_PERSON' },
    ]
  },
  {
    id: 'addon-spa',
    title: '80-Minute Essential Oil SPA',
    description: 'Full-body essential-oil massage with light meal; designed to relieve fatigue and promote deep relaxation.',
    price: 69.90,
    type: 'ADDON',
    selected: false,
    duration: '1-1.5 hours',
    baseDurationMinutes: 90,
    shareType: 'PER_PERSON',
    image: 'https://picsum.photos/seed/spa/320/200',
    images: [
      'https://picsum.photos/seed/spa1/960/540',
      'https://picsum.photos/seed/spa2/960/540'
    ]
  },
  {
    id: 'addon-museum',
    title: 'City Museum Guided Visit',
    description: 'Explore a curated local museum with a bilingual guide. Ticket included; great for first-time visitors.',
    price: 25.00,
    type: 'ADDON',
    selected: false,
    duration: '2 hours',
    baseDurationMinutes: 120,
    shareType: 'PER_PERSON',
    image: 'https://picsum.photos/seed/museum/320/200',
    images: [
      'https://picsum.photos/seed/museum1/960/540',
      'https://picsum.photos/seed/museum2/960/540'
    ],
    tags: ['Culture']
  }
];

export const CITY_POINTS: CityPoint[] = [
  { id: '1', name: 'Fuzimiao Temple', type: 'SIGHTSEEING', duration: 180, image: 'https://picsum.photos/300/200?random=10', selected: false },
  { id: '2', name: 'Ole Food Hall', type: 'FOOD', duration: 60, image: 'https://picsum.photos/300/200?random=11', selected: false },
  { id: '3', name: 'BHG Market Place', type: 'SHOPPING', duration: 60, image: 'https://picsum.photos/300/200?random=12', selected: false },
  { id: '4', name: 'Nanjing Xinbai', type: 'ENTERTAINMENT', duration: 120, image: 'https://picsum.photos/300/200?random=13', selected: false },
];
