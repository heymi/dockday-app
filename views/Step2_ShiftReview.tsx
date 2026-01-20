import React, { useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Mail, Phone, Plane, Ship, Users, Car, Building2, MapPin, Briefcase, Globe } from 'lucide-react';
import { BookingState } from '../types';
import { availableCredit, estimateShiftOrderQuote, getAgencyCompany, getBillingAccount } from '../shiftBilling';

interface Props {
  data: BookingState;
  update: (fields: Partial<BookingState>) => void;
  onNext: () => void;
}

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      window.prompt('复制文本：', text);
      return true;
    } catch {
      return false;
    }
  }
};

const mask = (value: string, kind: 'phone' | 'email') => {
  const v = value.trim();
  if (!v) return '';
  if (kind === 'email') {
    const [user, domain] = v.split('@');
    if (!domain) return v;
    const safeUser = user.length <= 2 ? `${user[0] || '*'}*` : `${user.slice(0, 2)}***`;
    return `${safeUser}@${domain}`;
  }
  const digits = v.replace(/[^\d]/g, '');
  if (digits.length < 7) return v;
  return `${digits.slice(0, 3)}****${digits.slice(-4)}`;
};

const Step2_ShiftReview: React.FC<Props> = ({ data, update, onNext }) => {
  const [showEstimateDetail, setShowEstimateDetail] = useState(false);
  const agentLine = useMemo(() => {
    if (!data.agentContactType || !data.agentContactValue) return '未填写';
    return `${data.agentContactType === 'phone' ? '手机号' : '邮箱'} · ${mask(data.agentContactValue, data.agentContactType)}`;
  }, [data.agentContactType, data.agentContactValue]);

  const agencyCompany = useMemo(() => getAgencyCompany(data.agencyCompanyId), [data.agencyCompanyId]);
  const billingAccount = useMemo(() => getBillingAccount(data.agencyCompanyId, data.billingAccountId), [data.agencyCompanyId, data.billingAccountId]);
  const estimateQuote = useMemo(() => {
    return estimateShiftOrderQuote({
      groupSize: data.groupSize,
      carCount: data.carCount,
      needHotel: data.needHotel,
      hotelNights: data.hotelNights,
      needMeal: data.needMeal,
      mealPlan: data.mealPlan,
      mealCount: data.mealCount,
      transferType: data.transferType,
    });
  }, [data.groupSize, data.carCount, data.needHotel, data.hotelNights, data.needMeal, data.mealPlan, data.mealCount, data.transferType]);
  const estimatedAmount = estimateQuote.total;
  const available = availableCredit(billingAccount || undefined);
  const creditOk = estimatedAmount <= available;

  const dispatchText = useMemo(() => {
    const transferLabel = data.transferType === 'airport' ? '接机' : data.transferType === 'port' ? '接船' : '接送';
    const date = data.transferDateTime ? new Date(data.transferDateTime).toLocaleDateString() : '未填写';
    const port = data.destination || '未填写';
    const hotel = data.needHotel ? `${data.hotelName || '未填写'} · ${data.hotelNights || 1}晚` : '不需要';
    const meal = data.needMeal ? `${data.mealPlan === 'premium' ? '品质餐' : '标准餐'} · ${data.mealCount || data.groupSize || 1}人` : '不需要';
    const nationalities = data.crewNationalities && data.crewNationalities.length ? data.crewNationalities.join('、') : '未填写';
    const flight = data.transferType === 'airport' ? `落地日期：${date} · 航班号：${data.airportFlightNumber || '未填写'}` : '';
    const vessel = data.transferType === 'port' ? `码头：${port} · 船号：${data.portVesselNumber || '未填写'}` : '';
    return [
      '派单信息（换班）',
      `人数/车辆：${data.groupSize || 1}人 · ${data.carCount || 1}车`,
      `接送类型：${transferLabel}`,
      flight,
      vessel,
      `酒店：${hotel}`,
      `餐饮：${meal}`,
      `船员国籍：${nationalities}`,
      data.luggageNotes ? `行李/需求：${data.luggageNotes}` : '',
      data.specialRequests ? `备注：${data.specialRequests}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }, [data]);

  const pickupTitle = data.transferType === 'airport' ? '接机' : data.transferType === 'port' ? '接船' : '接送';
  const pickupIcon = data.transferType === 'airport' ? Plane : data.transferType === 'port' ? Ship : MapPin;

  const pickupDate = useMemo(() => {
    if (!data.transferDateTime) return '未填写';
    const d = new Date(data.transferDateTime);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString();
    return data.transferDateTime;
  }, [data.transferDateTime]);

  return (
    <div className="space-y-6 animate-fadeIn pb-28">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">确认信息</h2>
        <p className="text-slate-500 text-sm">确认换班订单信息后再提交。</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100">
        <div className="p-4 flex items-start gap-3">
          {data.agentContactType === 'email' ? (
            <Mail className="text-blue-600" size={18} />
          ) : (
            <Phone className="text-blue-600" size={18} />
          )}
          <div className="flex-1">
            <div className="text-sm text-slate-500">代理</div>
            <div className="font-semibold text-slate-900">{agentLine}</div>
            <div className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              <CheckCircle2 size={12} />
              白名单已验证
            </div>
          </div>
        </div>

        <div className="p-4 flex items-start gap-3">
          <Users className="text-blue-600" size={18} />
          <div className="flex-1">
            <div className="text-sm text-slate-500">人数 / 车辆</div>
            <div className="font-semibold text-slate-900">{data.groupSize || 1} 人 · {data.carCount || 1} 车</div>
            <div className="text-xs text-slate-500 mt-1">车辆数可根据现场情况调整。</div>
          </div>
        </div>

        <div className="p-4 flex items-start gap-3">
          <Globe className="text-blue-600" size={18} />
          <div className="flex-1">
            <div className="text-sm text-slate-500">船员国籍</div>
            <div className="font-semibold text-slate-900">
              {data.crewNationalities && data.crewNationalities.length ? data.crewNationalities.join('、') : '未填写'}
            </div>
          </div>
        </div>

        {data.transferType === 'airport' && (
          <div className="p-4 flex items-start gap-3">
            {React.createElement(pickupIcon, { size: 18, className: 'text-blue-600' })}
            <div className="flex-1">
              <div className="text-sm text-slate-500">{pickupTitle}</div>
              <div className="font-semibold text-slate-900">{pickupDate}</div>
              {data.airportFlightNumber ? (
                <div className="text-xs text-slate-500 mt-1">航班号：<span className="font-semibold text-slate-900">{data.airportFlightNumber}</span></div>
              ) : null}
            </div>
          </div>
        )}

        {data.transferType === 'port' && (
          <div className="p-4 flex items-start gap-3">
            <MapPin className="text-blue-600" size={18} />
            <div className="flex-1">
              <div className="text-sm text-slate-500">码头</div>
              <div className="font-semibold text-slate-900">{data.destination || '未填写'}</div>
            </div>
          </div>
        )}

        <div className="p-4 flex items-start gap-3">
          <CalendarClock className="text-blue-600" size={18} />
          <div className="flex-1">
            <div className="text-sm text-slate-500">行李 / 需求</div>
            <div className="font-semibold text-slate-900">{data.luggageNotes || '未填写'}</div>
            {data.specialRequests ? (
              <div className="text-xs text-slate-500 mt-1">其他：<span className="font-semibold text-slate-900">{data.specialRequests}</span></div>
            ) : null}
          </div>
        </div>

        <div className="p-4 flex items-start gap-3">
          <CalendarClock className="text-blue-600" size={18} />
          <div className="flex-1">
            <div className="text-sm text-slate-500">用餐</div>
            <div className="font-semibold text-slate-900">
              {data.needMeal ? `${data.mealPlan === 'premium' ? '升级' : '标准'} · ${data.mealCount || data.groupSize || 1} 人` : '无'}
            </div>
          </div>
        </div>

        <div className="p-4 flex items-start gap-3">
          <Building2 className="text-blue-600" size={18} />
          <div className="flex-1">
            <div className="text-sm text-slate-500">结算</div>
            <div className="font-semibold text-slate-900">{agencyCompany?.name || '未设置'}</div>
            <div className="text-xs text-slate-500 mt-1">
              {billingAccount?.name || '默认账户'} · 预估 USD {estimatedAmount} · 可用额度 USD {available}
            </div>
            <button
              type="button"
              onClick={() => setShowEstimateDetail(v => !v)}
              className="mt-2 text-xs font-semibold text-blue-600"
            >
              {showEstimateDetail ? '收起预估明细' : '查看预估明细'}
            </button>
            {showEstimateDetail && (
              <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 space-y-1">
                {estimateQuote.lines.map(line => (
                  <div key={line.key} className="flex justify-between gap-3">
                    <span className="truncate">{line.label}</span>
                    <span className="font-semibold shrink-0">USD {Math.round(line.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between gap-3 pt-2 mt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-900">合计</span>
                  <span className="font-bold text-slate-900">USD {estimateQuote.total}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="text-sm font-semibold text-slate-900">结算条款</div>
        <div className="text-xs text-slate-600 leading-relaxed">
          本订单由平台垫付，代理公司按月结算，遵循所选结算账户条款。
        </div>
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1"
            checked={Boolean(data.billingTermsAccepted)}
            onChange={(e) => update({ billingTermsAccepted: e.target.checked })}
          />
          <span>
            我确认本单为月结，费用由平台垫付。
            {!creditOk && (
              <span className="block mt-1 text-xs text-rose-600">当前预估超出可用额度。</span>
            )}
          </span>
        </label>
      </div>

      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-sm text-slate-600 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-semibold">
            <CalendarClock size={16} className="text-blue-600" />
            说明
          </div>
        <ul className="list-disc pl-4 space-y-1 text-xs">
          <li>接机按航班落地时间参考。</li>
          <li>接船按靠港/下船时间参考。</li>
          <li>住宿/用餐按需求填写，未填视为不需要。</li>
        </ul>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] z-40 pb-safe">
        <div className="max-w-md mx-auto">
          <button
            onClick={async () => {
              const ok = await copyText(dispatchText);
              if (!ok) return;
            }}
            className="w-full h-11 px-4 rounded-xl font-semibold text-slate-900 border border-slate-200 bg-white shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 mb-2"
          >
            复制派单文本
          </button>
          <button
            onClick={onNext}
            disabled={!data.billingTermsAccepted || !creditOk}
            className={`w-full h-12 px-4 rounded-xl font-semibold text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
              data.billingTermsAccepted && creditOk ? 'bg-slate-900 hover:bg-slate-800 shadow-slate-200' : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            提交
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step2_ShiftReview;
