import { BookingState } from './types';
import { normalizeEmail, normalizePhone } from './agentWhitelist';

export type ShiftOrder = {
  id: string;
  createdAt: string;
  agentKey: string;
  agentContactType: 'phone' | 'email';
  agentContactValue: string;
  agencyCompanyId?: string;
  billingAccountId?: string;
  estimatedAmount?: number;
  estimateLines?: { key: string; label: string; amount: number }[];
  status?: 'review' | 'in_service' | 'completed';
  driver?: {
    name?: string;
    phone?: string;
    plate?: string;
    seats?: string;
    vehicleType?: string;
  };
  insuranceAttachments?: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  }[];
  audit?: {
    approvedBy?: string;
    approvedAt?: string;
  };
  data: {
    groupSize: number;
    carCount: number;
    transferType?: 'airport' | 'port';
    transferDateTime?: string;
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
    notes?: string;
  };
};

const storageKeyForAgent = (agentKey: string) => `dockday.shiftOrders.v1.${agentKey}`;
const globalStorageKey = 'dockday.shiftOrders.all.v1';

export const getAgentKey = (method: 'phone' | 'email', value: string) => {
  const normalized = method === 'email' ? normalizeEmail(value) : normalizePhone(value);
  return `${method}:${normalized}`;
};

export const loadShiftOrdersForAgent = (agentKey: string): ShiftOrder[] => {
  try {
    const raw = localStorage.getItem(storageKeyForAgent(agentKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ShiftOrder[];
  } catch {
    return [];
  }
};

export const saveShiftOrderForAgent = (agentKey: string, order: ShiftOrder) => {
  const existing = loadShiftOrdersForAgent(agentKey);
  const next = [order, ...existing].slice(0, 50);
  localStorage.setItem(storageKeyForAgent(agentKey), JSON.stringify(next));
};

export const loadAllShiftOrders = (): ShiftOrder[] => {
  try {
    const raw = localStorage.getItem(globalStorageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ShiftOrder[];
  } catch {
    return [];
  }
};

export const saveShiftOrderGlobal = (order: ShiftOrder) => {
  const existing = loadAllShiftOrders();
  const withoutDup = existing.filter(o => o.id !== order.id);
  const next = [order, ...withoutDup].slice(0, 500);
  localStorage.setItem(globalStorageKey, JSON.stringify(next));
};

export const createShiftOrder = (
  booking: BookingState,
  input?: { estimatedAmount?: number; estimateLines?: { key: string; label: string; amount: number }[] }
): ShiftOrder | null => {
  if (!booking.agentVerified || !booking.agentContactType || !booking.agentContactValue) return null;
  const agentKey = getAgentKey(booking.agentContactType, booking.agentContactValue);
  const id = `SO-${Date.now().toString(36).toUpperCase()}`;

  return {
    id,
    createdAt: new Date().toISOString(),
    agentKey,
    agentContactType: booking.agentContactType,
    agentContactValue: booking.agentContactValue,
    agencyCompanyId: booking.agencyCompanyId,
    billingAccountId: booking.billingAccountId,
    estimatedAmount: input?.estimatedAmount,
    estimateLines: input?.estimateLines,
    status: 'review',
    data: {
      groupSize: booking.groupSize || 1,
      carCount: booking.carCount || 1,
      transferType: booking.transferType,
      transferDateTime: booking.transferDateTime,
      airportFlightNumber: booking.airportFlightNumber,
      portVesselName: booking.portVesselName,
      portVesselNumber: booking.portVesselNumber,
      crewNationalities: booking.crewNationalities,
      contactName: booking.contactName,
      contactPhone: booking.contactPhone,
      pickupPoint: booking.pickupPoint,
      pickupIdentifier: booking.pickupIdentifier,
      pickupTerminal: booking.pickupTerminal,
      pickupGate: booking.pickupGate,
      destination: booking.destination,
      destinationType: booking.destinationType,
      luggageNotes: booking.luggageNotes,
      specialRequests: booking.specialRequests,
      needHotel: booking.needHotel,
      hotelName: booking.hotelName,
      hotelNights: booking.hotelNights,
      needMeal: booking.needMeal,
      mealPlan: booking.mealPlan,
      mealCount: booking.mealCount,
      notes: booking.notes,
    },
  };
};

export const updateShiftOrderForAgent = (agentKey: string, order: ShiftOrder) => {
  const existing = loadShiftOrdersForAgent(agentKey);
  const withoutDup = existing.filter(o => o.id !== order.id);
  const next = [order, ...withoutDup].slice(0, 50);
  localStorage.setItem(storageKeyForAgent(agentKey), JSON.stringify(next));
};

export const updateShiftOrderGlobal = (order: ShiftOrder) => {
  const existing = loadAllShiftOrders();
  const withoutDup = existing.filter(o => o.id !== order.id);
  const next = [order, ...withoutDup].slice(0, 500);
  localStorage.setItem(globalStorageKey, JSON.stringify(next));
};

export const updateShiftOrder = (order: ShiftOrder) => {
  updateShiftOrderForAgent(order.agentKey, order);
  updateShiftOrderGlobal(order);
};
