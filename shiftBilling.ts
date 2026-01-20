export type Currency = 'USD';

export type BillingAccount = {
  id: string;
  name: string;
  currency: Currency;
  creditLimit: number; // total line of credit
  usedAmount: number; // current outstanding / used
  termDays: number; // e.g. 30 for monthly settlement
};

export type AgencyCompany = {
  id: string;
  name: string;
  accounts: BillingAccount[];
};

// Local static list (MVP). Replace with API later.
export const AGENCY_COMPANIES: AgencyCompany[] = [
  {
    id: 'agency-demo',
    name: 'Demo Agency Co., Ltd.',
    accounts: [
      { id: 'acct-usd-30', name: 'Monthly Settlement (T+30)', currency: 'USD', creditLimit: 20000, usedAmount: 3500, termDays: 30 },
    ],
  },
];

export const getAgencyCompany = (companyId?: string) =>
  AGENCY_COMPANIES.find(c => c.id === companyId);

export const getBillingAccount = (companyId?: string, accountId?: string) => {
  const company = getAgencyCompany(companyId);
  return company?.accounts.find(a => a.id === accountId);
};

export const availableCredit = (account?: BillingAccount) => {
  if (!account) return 0;
  return Math.max(0, account.creditLimit - account.usedAmount);
};

export type ShiftEstimateLine = { key: string; label: string; amount: number };
export type ShiftEstimateQuote = { currency: Currency; total: number; lines: ShiftEstimateLine[] };

// Simple local estimator (MVP): used for credit pre-check only.
export const estimateShiftOrderQuote = (input: {
  groupSize?: number;
  carCount?: number;
  needHotel?: boolean;
  hotelNights?: number;
  needMeal?: boolean;
  mealPlan?: 'standard' | 'premium';
  mealCount?: number;
  transferType?: 'airport' | 'port';
}): ShiftEstimateQuote => {
  const carCount = input.carCount && input.carCount > 0 ? input.carCount : 1;
  const hotelNights = input.needHotel ? Math.max(1, input.hotelNights || 1) : 0;
  const mealCount = input.needMeal ? Math.max(1, input.mealCount || (input.groupSize || 1)) : 0;

  const baseServiceFee = 80; // admin / handling per order
  const perCarFee = 120; // transfer/dispatch estimate per car
  const pickupFee = input.transferType ? 60 : 0; // pickup coordination estimate
  const hotelPerNightEstimate = 140; // hotel budget estimate per night
  const mealPerPerson = input.mealPlan === 'premium' ? 45 : 25; // meal estimate per person

  const carAmount = baseServiceFee + perCarFee * carCount;

  const lines: ShiftEstimateLine[] = [
    { key: 'car', label: `用车+调度(含服务) ×${carCount}`, amount: carAmount },
    { key: 'pickup', label: '接送协调', amount: pickupFee },
  ];
  if (hotelNights > 0) lines.push({ key: 'hotel', label: `酒店预算 · ${hotelNights}晚`, amount: hotelPerNightEstimate * hotelNights });
  if (mealCount > 0) lines.push({ key: 'meal', label: `用餐预算 · ${mealCount}人`, amount: mealPerPerson * mealCount });

  const total = Math.max(0, Math.round(lines.reduce((sum, l) => sum + l.amount, 0)));
  return { currency: 'USD', total, lines: lines.filter(l => l.amount > 0) };
};

export const estimateShiftOrderAmount = (input: Parameters<typeof estimateShiftOrderQuote>[0]) =>
  estimateShiftOrderQuote(input).total;
