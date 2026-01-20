import { ShiftOrder } from './shiftOrders';

export type ReceiptAttachment = {
  name: string;
  size: number;
  type: string;
  lastModified: number;
};

export type MoneyLine = {
  key: string;
  label: string;
  amount: number;
  attachments: ReceiptAttachment[]; // demo stores metadata only
};

export type ActualDetails = {
  carSeat?: string;
  carKilometer?: string;
  carHours?: string;
  hotelName?: string;
  hotelRoomType?: string;
  hotelNights?: string;
  hotelRackRate?: string;
  hotelRackAttachments?: ReceiptAttachment[];
  mealRestaurant?: string;
  mealCount?: string;
  mealPrice?: string;
  mealAttachments?: ReceiptAttachment[];
  insuranceAttachments?: ReceiptAttachment[];
};

export type OrderActualCost = {
  orderId: string;
  updatedAt: string;
  lines: MoneyLine[];
  total: number;
  notes?: string;
  details?: ActualDetails;
};

export type MonthlyStatementStatus = 'draft' | 'confirmed' | 'invoiced' | 'paid';

export type MonthlyStatement = {
  id: string;
  agencyCompanyId: string;
  period: string; // YYYY-MM
  createdAt: string;
  updatedAt: string;
  status: MonthlyStatementStatus;
  orderIds: string[];
  totals: {
    estimated: number;
    actual: number;
  };
  notes?: string;
};

const actualKey = (orderId: string) => `dockday.shiftOrderActual.v1.${orderId}`;
const statementKey = (agencyCompanyId: string, period: string) => `dockday.monthlyStatement.v1.${agencyCompanyId}.${period}`;

export const loadOrderActual = (orderId: string): OrderActualCost | null => {
  try {
    const raw = localStorage.getItem(actualKey(orderId));
    if (!raw) return null;
    return JSON.parse(raw) as OrderActualCost;
  } catch {
    return null;
  }
};

export const saveOrderActual = (orderId: string, input: { lines: MoneyLine[]; notes?: string; details?: ActualDetails }): OrderActualCost => {
  const lines = (input.lines || [])
    .map(l => ({
      ...l,
      amount: Number(l.amount) || 0,
      attachments: Array.isArray(l.attachments) ? l.attachments : [],
    }))
    .filter(l => l.amount !== 0);
  const total = Math.max(0, Math.round(lines.reduce((sum, l) => sum + l.amount, 0)));
  const record: OrderActualCost = {
    orderId,
    updatedAt: new Date().toISOString(),
    lines,
    total,
    notes: input.notes,
    details: input.details,
  };
  localStorage.setItem(actualKey(orderId), JSON.stringify(record));
  return record;
};

export const loadMonthlyStatement = (agencyCompanyId: string, period: string): MonthlyStatement | null => {
  try {
    const raw = localStorage.getItem(statementKey(agencyCompanyId, period));
    if (!raw) return null;
    return JSON.parse(raw) as MonthlyStatement;
  } catch {
    return null;
  }
};

export const saveMonthlyStatement = (statement: MonthlyStatement) => {
  const next: MonthlyStatement = { ...statement, updatedAt: new Date().toISOString() };
  localStorage.setItem(statementKey(statement.agencyCompanyId, statement.period), JSON.stringify(next));
  return next;
};

export const createMonthlyStatement = (input: { agencyCompanyId: string; period: string; orders: ShiftOrder[] }) => {
  const id = `ST-${Date.now().toString(36).toUpperCase()}`;
  const estimated = input.orders.reduce((sum, o) => sum + (o.estimatedAmount || 0), 0);
  const actual = input.orders.reduce((sum, o) => {
    const a = loadOrderActual(o.id);
    return sum + (a?.total || 0);
  }, 0);
  const now = new Date().toISOString();
  const statement: MonthlyStatement = {
    id,
    agencyCompanyId: input.agencyCompanyId,
    period: input.period,
    createdAt: now,
    updatedAt: now,
    status: 'draft',
    orderIds: input.orders.map(o => o.id),
    totals: { estimated: Math.round(estimated), actual: Math.round(actual) },
  };
  return saveMonthlyStatement(statement);
};
