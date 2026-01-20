import React, { useMemo, useState } from 'react';
import { AlertCircle, Building2, CalendarClock, Car, Coffee, Globe, Plane, Ship, Users } from 'lucide-react';
import { BookingState, PORTS } from '../types';
import { getAgentKey, loadShiftOrdersForAgent, ShiftOrder } from '../shiftOrders';

interface Props {
  data: BookingState;
  update: (fields: Partial<BookingState>) => void;
  onNext: () => void;
}

const recommendedCars = (groupSize: number) => {
  const safeGroupSize = Number.isFinite(groupSize) ? groupSize : 1;
  return Math.max(1, Math.ceil(Math.max(1, safeGroupSize) / 6));
};

const Step1_ShiftDetails: React.FC<Props> = ({ data, update, onNext }) => {
  const [error, setError] = useState<string | null>(null);
  const [showOptional, setShowOptional] = useState(false);

  const groupSize = data.groupSize > 0 ? data.groupSize : 1;
  const carCount = data.carCount && data.carCount > 0 ? data.carCount : recommendedCars(groupSize);


  const historyOrders = useMemo(() => {
    if (!data.agentVerified || !data.agentContactType || !data.agentContactValue) return [];
    const agentKey = getAgentKey(data.agentContactType, data.agentContactValue);
    return loadShiftOrdersForAgent(agentKey).slice(0, 3);
  }, [data.agentVerified, data.agentContactType, data.agentContactValue]);

  const applyHistoryOrder = (order: ShiftOrder) => {
    const d = order.data || {};
    update({
      groupSize: d.groupSize || 1,
      carCount: d.carCount || 1,
      transferType: d.transferType,
      transferDateTime: d.transferDateTime,
      airportFlightNumber: d.transferType === 'airport' ? d.airportFlightNumber : '',
      portVesselName: d.transferType === 'port' ? d.portVesselName : '',
      portVesselNumber: d.transferType === 'port' ? d.portVesselNumber : '',
      crewNationalities: Array.isArray(d.crewNationalities) ? d.crewNationalities : [],
      pickupIdentifier: d.pickupIdentifier || '',
      pickupPoint: d.pickupPoint || '',
      pickupTerminal: d.pickupTerminal || '',
      pickupGate: d.pickupGate || '',
      destination: d.destination || '',
      destinationType: d.destinationType || (d.destination && PORTS.includes(d.destination) ? 'port' : 'other'),
      luggageNotes: d.luggageNotes || '',
      specialRequests: d.specialRequests || '',
      needHotel: !!d.needHotel,
      hotelName: d.needHotel ? d.hotelName || '' : '',
      hotelNights: d.needHotel ? d.hotelNights || 1 : 0,
      needMeal: !!d.needMeal,
      mealPlan: d.needMeal ? d.mealPlan : undefined,
      mealCount: d.needMeal ? d.mealCount || d.groupSize || 1 : 0,
      notes: d.notes || '',
    });
    if (error) setError(null);
  };

  const validate = () => {
    if (!data.agentVerified) return '请先完成代理验证。';
    if (!groupSize || groupSize < 1) return '请填写人数。';
    if (!carCount || carCount < 1) return '请填写车辆数。';
    if (!data.transferType) return '请选择接送类型（机场/港口）。';
    if (data.transferType === 'airport') {
      if (!data.transferDateTime) return '请选择落地日期。';
      if (!data.airportFlightNumber?.trim()) return '请填写航班号。';
    }
    if (data.transferType === 'port') {
      if (!data.destination?.trim()) return '请选择码头。';
      if (!data.portVesselNumber?.trim()) return '请填写船号（IMO/MMSI）。';
    }
    if (data.needHotel) {
      if (!data.hotelName?.trim()) return '请填写酒店名称。';
      if (!data.hotelNights || data.hotelNights < 1) return '请填写住宿晚数。';
    }
    if (data.needMeal) {
      if (!data.mealPlan) return '请选择餐饮档位。';
      if (!data.mealCount || data.mealCount < 1) return '请填写用餐人数。';
    }
    return null;
  };

  const onContinue = () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-28">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">换班下单</h2>
        <p className="text-slate-500 text-sm">填写必需信息，方便线下派单。</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">导入历史订单</div>
            <div className="text-xs text-slate-500">从历史订单一键填充，再按需修改。</div>
          </div>
        </div>
        {historyOrders.length === 0 ? (
          <div className="text-xs text-slate-500">
            {data.agentVerified ? '暂无历史订单可导入。' : '完成代理验证后可导入历史订单。'}
          </div>
        ) : (
          <div className="space-y-2">
            {historyOrders.map(order => {
              const transferLabel = order.data.transferType === 'airport' ? '接机' : order.data.transferType === 'port' ? '接船' : '接送';
              return (
                <div key={order.id} className="rounded-xl border border-slate-200 p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500">订单 {order.id}</div>
                    <div className="text-sm text-slate-900 font-semibold truncate">
                      {order.data.groupSize}人 · {order.data.carCount}车 · {transferLabel}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => applyHistoryOrder(order)}
                    className="h-9 px-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-sm active:scale-95 transition-all"
                  >
                    导入
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Users size={16} className="text-blue-600" /> 人数
          </label>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={groupSize}
            onChange={(e) => {
              const next = Number(e.target.value);
              update({ groupSize: Number.isFinite(next) ? Math.max(1, next) : 1 });
              if (error) setError(null);
            }}
          />
          <p className="text-[11px] text-slate-400">用于估算车辆与接送安排。</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Globe size={16} className="text-blue-600" /> 船员国籍（选填）
          </label>
          <input
            type="text"
            placeholder="如 菲律宾, 中国, 印度"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={(data.crewNationalities || []).join('、')}
            onChange={(e) => {
              const next = e.target.value
                .split(/[,，、]/)
                .map(v => v.trim())
                .filter(Boolean);
              update({ crewNationalities: next });
              if (error) setError(null);
            }}
          />
          <p className="text-[11px] text-slate-400">支持多国籍，用逗号分隔。</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Car size={16} className="text-blue-600" /> 车辆数
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              inputMode="numeric"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={carCount}
              onChange={(e) => {
                const next = Number(e.target.value);
                update({ carCount: Number.isFinite(next) ? Math.max(1, next) : 1 });
                if (error) setError(null);
              }}
            />
            <button
              type="button"
              onClick={() => {
                update({ carCount: recommendedCars(groupSize) });
                if (error) setError(null);
              }}
              className="px-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-sm active:scale-95 transition-all"
            >
              自动
            </button>
          </div>
          <p className="text-[11px] text-slate-400">按6人/辆估算，可调整。</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-semibold text-slate-700">接送类型</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                update({ transferType: 'airport', portVesselName: '', portVesselNumber: '' });
                if (error) setError(null);
              }}
              className={`rounded-2xl border p-3 text-left transition-all ${
                data.transferType === 'airport' ? 'border-blue-300 ring-2 ring-blue-200' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 text-slate-900 font-semibold">
                <Plane size={16} className="text-blue-600" />
                接机
              </div>
              <div className="text-xs text-slate-500 mt-1">落地后接机。</div>
            </button>
            <button
              type="button"
              onClick={() => {
                update({ transferType: 'port', airportFlightNumber: '' });
                if (error) setError(null);
              }}
              className={`rounded-2xl border p-3 text-left transition-all ${
                data.transferType === 'port' ? 'border-blue-300 ring-2 ring-blue-200' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 text-slate-900 font-semibold">
                <Ship size={16} className="text-blue-600" />
                接船
              </div>
              <div className="text-xs text-slate-500 mt-1">靠港/下船接人。</div>
            </button>
          </div>
        </div>


        {data.transferType === 'port' && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">选择码头</label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={data.destination || ''}
              onChange={(e) => {
                update({ destination: e.target.value });
                if (error) setError(null);
              }}
            >
              <option value="">请选择</option>
              {PORTS.map(port => (
                <option key={port} value={port}>{port}</option>
              ))}
            </select>
          </div>
        )}

        {data.transferType === 'airport' && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">落地日期</label>
            <input
              type="date"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={data.transferDateTime || ''}
              onChange={(e) => {
                update({ transferDateTime: e.target.value });
                if (error) setError(null);
              }}
            />
          </div>
        )}

        {data.transferType === 'airport' && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Plane size={16} className="text-blue-600" /> 航班号
            </label>
            <input
              type="text"
              placeholder="如 MU5123"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={data.airportFlightNumber || ''}
              onChange={(e) => {
                update({ airportFlightNumber: e.target.value });
                if (error) setError(null);
              }}
            />
            <p className="text-[11px] text-slate-400">用于匹配到达时间与航站楼接人。</p>
          </div>
        )}

        {data.transferType === 'port' && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Ship size={16} className="text-blue-600" /> 船号（IMO/MMSI）
            </label>
            <input
              type="text"
              placeholder="如 IMO 1234567 / MMSI 412345678"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={data.portVesselNumber || ''}
              onChange={(e) => {
                update({ portVesselNumber: e.target.value });
                if (error) setError(null);
              }}
            />
            <p className="text-[11px] text-slate-400">可填 IMO/MMSI/船编号等。</p>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">可选信息</div>
            <div className="text-xs text-slate-500">酒店、用餐、行李需求等可后补。</div>
          </div>
          <button
            type="button"
            onClick={() => setShowOptional(v => !v)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
          >
            {showOptional ? '收起' : '展开'}
          </button>
        </div>

        {showOptional && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">行李 / 需求</label>
              <textarea
                rows={2}
                placeholder="如 4大2小 / 轮椅 / 英文司机"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={data.luggageNotes || ''}
                onChange={(e) => update({ luggageNotes: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">其他要求</label>
              <textarea
                rows={2}
                placeholder="其他特殊要求"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={data.specialRequests || ''}
                onChange={(e) => update({ specialRequests: e.target.value })}
              />
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">酒店</div>
                  <div className="text-xs text-slate-500">如需住宿请补充酒店与晚数。</div>
                </div>
                <div className="bg-slate-100 p-1 rounded-xl flex font-medium text-sm relative">
                  <button
                    type="button"
                    onClick={() => {
                      update({ needHotel: false, hotelName: '', hotelNights: 0 });
                      if (error) setError(null);
                    }}
                    className={`px-3 py-2 rounded-lg transition-all ${!data.needHotel ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    不需要
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      update({ needHotel: true, hotelNights: data.hotelNights && data.hotelNights > 0 ? data.hotelNights : 1 });
                      if (error) setError(null);
                    }}
                    className={`px-3 py-2 rounded-lg transition-all ${data.needHotel ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    需要
                  </button>
                </div>
              </div>

              {data.needHotel && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Building2 size={16} className="text-blue-600" /> 酒店名称
                    </label>
                    <input
                      type="text"
                      placeholder="如 万豪 / 假日"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      value={data.hotelName || ''}
                      onChange={(e) => {
                        update({ hotelName: e.target.value });
                        if (error) setError(null);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">住宿晚数</label>
                    <input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      value={data.hotelNights && data.hotelNights > 0 ? data.hotelNights : 1}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        update({ hotelNights: Number.isFinite(next) ? Math.max(1, next) : 1 });
                        if (error) setError(null);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">用餐</div>
                  <div className="text-xs text-slate-500">需要团餐时再选择。</div>
                </div>
                <div className="bg-slate-100 p-1 rounded-xl flex font-medium text-sm relative">
                  <button
                    type="button"
                    onClick={() => {
                      update({ needMeal: false, mealPlan: undefined, mealCount: 0 });
                      if (error) setError(null);
                    }}
                    className={`px-3 py-2 rounded-lg transition-all ${!data.needMeal ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    不需要
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      update({
                        needMeal: true,
                        mealPlan: data.mealPlan || 'standard',
                        mealCount: data.mealCount && data.mealCount > 0 ? data.mealCount : groupSize,
                      });
                      if (error) setError(null);
                    }}
                    className={`px-3 py-2 rounded-lg transition-all ${data.needMeal ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    需要
                  </button>
                </div>
              </div>

              {data.needMeal && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Coffee size={16} className="text-blue-600" /> 用餐方案
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          update({ mealPlan: 'standard' });
                          if (error) setError(null);
                        }}
                        className={`rounded-2xl border p-3 text-left transition-all ${
                          data.mealPlan === 'standard' ? 'border-blue-300 ring-2 ring-blue-200' : 'border-slate-200'
                        }`}
                      >
                        <div className="text-slate-900 font-semibold">标准</div>
                        <div className="text-xs text-slate-500 mt-1">简餐/本地餐。</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          update({ mealPlan: 'premium' });
                          if (error) setError(null);
                        }}
                        className={`rounded-2xl border p-3 text-left transition-all ${
                          data.mealPlan === 'premium' ? 'border-blue-300 ring-2 ring-blue-200' : 'border-slate-200'
                        }`}
                      >
                        <div className="text-slate-900 font-semibold">升级</div>
                        <div className="text-xs text-slate-500 mt-1">更好餐厅/菜单。</div>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">用餐人数</label>
                    <input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      value={data.mealCount && data.mealCount > 0 ? data.mealCount : groupSize}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        update({ mealCount: Number.isFinite(next) ? Math.max(1, next) : 1 });
                        if (error) setError(null);
                      }}
                    />
                    <p className="text-[11px] text-slate-400">通常等于人数，可调整。</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 p-3 text-xs">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <div className="leading-relaxed">{error}</div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] z-40 pb-safe">
        <div className="max-w-md mx-auto">
          <button
            onClick={onContinue}
            className="w-full h-12 px-4 rounded-xl font-semibold text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 bg-blue-600 hover:bg-blue-700 shadow-blue-200"
          >
            下一步
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step1_ShiftDetails;
