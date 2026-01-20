import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Mail, Phone, ShieldCheck } from 'lucide-react';
import { BookingState } from '../types';
import { getWhitelistedAgentCompanyId, isWhitelistedAgent } from '../agentWhitelist';
import { getAgencyCompany } from '../shiftBilling';

interface Props {
  data: BookingState;
  update: (fields: Partial<BookingState>) => void;
  onNext: () => void;
}

const Step0_AgentVerify: React.FC<Props> = ({ data, update, onNext }) => {
  const [method, setMethod] = useState<'phone' | 'email'>(data.agentContactType || 'phone');
  const [value, setValue] = useState<string>(data.agentContactValue || '');
  const [error, setError] = useState<string | null>(null);

  const verified = Boolean(data.agentVerified);
  const helperText = useMemo(() => {
    if (method === 'phone') return '输入代理手机号，检查白名单。';
    return '输入代理邮箱，检查白名单。';
  }, [method]);

  const verify = () => {
    setError(null);
    const ok = isWhitelistedAgent(method, value);
    if (!ok) {
      update({ agentContactType: method, agentContactValue: value, agentVerified: false });
      setError('Not in whitelist. Please contact admin.');
      return;
    }
    const agencyCompanyId = getWhitelistedAgentCompanyId(method, value) || undefined;
    const defaultBillingAccountId = getAgencyCompany(agencyCompanyId)?.accounts[0]?.id;
    update({
      agentContactType: method,
      agentContactValue: value,
      agentVerified: true,
      agencyCompanyId,
      billingAccountId: defaultBillingAccountId,
      billingTermsAccepted: false,
    });
    onNext();
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-28">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold">
          <ShieldCheck size={14} />
          换班 · 代理下单
        </div>
        <h2 className="text-2xl font-bold text-slate-900">验证代理身份</h2>
        <p className="text-slate-500 text-sm">通过白名单后才能创建换班订单。</p>
      </div>

      <div className="bg-slate-100 p-1 rounded-xl flex font-medium text-sm relative">
        <button
          onClick={() => {
            setMethod('phone');
            setError(null);
          }}
          className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all z-10 ${
            method === 'phone' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Phone size={16} /> 手机号
        </button>
        <button
          onClick={() => {
            setMethod('email');
            setError(null);
          }}
          className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all z-10 ${
            method === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Mail size={16} /> 邮箱
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
        <label className="text-sm font-semibold text-slate-700">{method === 'phone' ? '手机号' : '邮箱'}</label>
        <input
          type={method === 'phone' ? 'tel' : 'email'}
          placeholder={method === 'phone' ? '例如 13800138000' : '例如 agent@company.com'}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
        />
        <p className="text-[11px] text-slate-400">{helperText}</p>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 p-3 text-xs">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {verified && !error && (
          <div className="flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 text-xs">
            <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
            <div className="leading-relaxed">已验证，可继续填写换班订单。</div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] z-40 pb-safe">
        <div className="max-w-md mx-auto">
          <button
            onClick={verify}
            disabled={!value.trim()}
            className={`w-full h-12 px-4 rounded-xl font-semibold text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
              value.trim() ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            继续
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step0_AgentVerify;
