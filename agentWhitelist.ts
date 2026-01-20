export type WhitelistedAgent = {
  agencyCompanyId: string;
  phone?: string;
  email?: string;
  notes?: string;
};

// Local static whitelist (MVP). Each agent is bound to a single agency company.
export const WHITELISTED_AGENTS: WhitelistedAgent[] = [
  { agencyCompanyId: 'agency-demo', phone: '13800138000', notes: 'Demo agent' },
  { agencyCompanyId: 'agency-demo', email: 'agent@example.com' },
];

export const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const normalizePhone = (value: string) =>
  value
    .trim()
    .replace(/[^\d+]/g, '')
    .replace(/^\+/, '')
    .replace(/^86/, '');

export const getWhitelistedAgentCompanyId = (method: 'phone' | 'email', value: string) => {
  if (method === 'email') {
    const email = normalizeEmail(value);
    const hit = WHITELISTED_AGENTS.find(a => a.email && normalizeEmail(a.email) === email);
    return hit?.agencyCompanyId || null;
  }
  const phone = normalizePhone(value);
  const hit = WHITELISTED_AGENTS.find(a => a.phone && normalizePhone(a.phone) === phone);
  return hit?.agencyCompanyId || null;
};

export const isWhitelistedAgent = (method: 'phone' | 'email', value: string) => {
  return Boolean(getWhitelistedAgentCompanyId(method, value));
};
