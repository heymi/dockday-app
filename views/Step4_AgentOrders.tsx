import React, { useMemo } from 'react';
import { Building2, CalendarClock, Car, ChevronLeft, ClipboardList, Plane, Ship, Users } from 'lucide-react';
import { BookingState } from '../types';
import { getAgencyCompany } from '../shiftBilling';
import { getAgentKey, loadShiftOrdersForAgent, ShiftOrder } from '../shiftOrders';

interface Props {
  data: BookingState;
  onBack: () => void;
  onNew: () => void;
  onEdit: (order: ShiftOrder) => void;
}

const formatDateTime = (value?: string) => {
  if (!value) return 'Not set';
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return d.toLocaleString();
  return value;
};

const Step4_AgentOrders: React.FC<Props> = ({ data, onBack, onNew, onEdit }) => {
  const agentKey = useMemo(() => {
    if (!data.agentContactType || !data.agentContactValue) return null;
    return getAgentKey(data.agentContactType, data.agentContactValue);
  }, [data.agentContactType, data.agentContactValue]);

  const orders = useMemo(() => {
    if (!agentKey) return [];
    return loadShiftOrdersForAgent(agentKey);
  }, [agentKey]);

  const agencyCompany = useMemo(() => getAgencyCompany(data.agencyCompanyId), [data.agencyCompanyId]);
  const statusLabel = (status?: ShiftOrder['status']) => {
    if (status === 'in_service') return '服务中';
    if (status === 'completed') return '已完成';
    return '审核中';
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-28">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors"
          aria-label="Back"
        >
          <ChevronLeft size={20} />
        </button>
          <div className="text-center flex-1">
          <div className="text-xs text-slate-500">代理</div>
          <div className="font-semibold text-slate-900">我的订单</div>
        </div>
        <div className="w-8" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Building2 size={18} className="text-blue-600" />
          {agencyCompany?.name || 'Agency company'}
        </div>
        <div className="text-xs text-slate-500 mt-1">Only shift-change orders submitted on this device are shown.</div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <ClipboardList size={18} className="text-blue-600" />
          订单 ({orders.length})
        </div>

        {orders.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 text-center text-sm text-slate-500">
            暂无订单。
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const pickupIcon = order.data.transferType === 'airport' ? Plane : Ship;
              const pickupLabel = order.data.transferType === 'airport' ? '接机' : order.data.transferType === 'port' ? '接船' : '接送';
              const editable = !order.status || order.status === 'review';
              const statusText = statusLabel(order.status);
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-slate-500">订单</div>
                      <div className="font-semibold text-slate-900 truncate">{order.id}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        国籍：{order.data.crewNationalities && order.data.crewNationalities.length ? order.data.crewNationalities.join('、') : '-'}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-slate-500">创建时间</div>
                      <div className="text-sm font-semibold text-slate-900">
                        {formatDateTime(order.createdAt)}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">状态：{statusText}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Users size={12} /> 人数
                      </div>
                      <div className="font-bold text-slate-900">{order.data.groupSize}</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Car size={12} /> 车辆
                      </div>
                      <div className="font-bold text-slate-900">{order.data.carCount}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-sm">
                    {React.createElement(pickupIcon, { size: 18, className: 'text-blue-600 mt-0.5' })}
                    <div className="flex-1">
                      <div className="text-xs text-slate-500">{pickupLabel}</div>
                      <div className="font-semibold text-slate-900">{formatDateTime(order.data.transferDateTime)}</div>
                      {order.data.transferType === 'airport' && order.data.airportFlightNumber ? (
                        <div className="text-xs text-slate-500 mt-1">航班号：<span className="font-semibold text-slate-900">{order.data.airportFlightNumber}</span></div>
                      ) : null}
                      {order.data.transferType === 'port' && (order.data.portVesselName || order.data.portVesselNumber) ? (
                        <div className="text-xs text-slate-500 mt-1">
                          船名：<span className="font-semibold text-slate-900">{order.data.portVesselName || '-'}</span> · 船号：<span className="font-semibold text-slate-900">{order.data.portVesselNumber || '-'}</span>
                        </div>
                      ) : null}
                      {order.data.pickupPoint ? (
                        <div className="text-xs text-slate-500 mt-1">集合点：<span className="font-semibold text-slate-900">{order.data.pickupPoint}</span></div>
                      ) : null}
                      {order.data.destination ? (
                        <div className="text-xs text-slate-500 mt-1">目的地：<span className="font-semibold text-slate-900">{order.data.destination}</span></div>
                      ) : null}
                      {order.data.luggageNotes ? (
                        <div className="text-xs text-slate-500 mt-1">行李/需求：<span className="font-semibold text-slate-900">{order.data.luggageNotes}</span></div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-sm">
                    <CalendarClock size={18} className="text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs text-slate-500">酒店</div>
                      <div className="font-semibold text-slate-900">
                        {order.data.needHotel ? `${order.data.hotelName || '未填写'} · ${order.data.hotelNights || 1} 晚` : '不需要'}
                      </div>
                    </div>
                  </div>

                  {typeof order.estimatedAmount === 'number' && (
                    <div className="space-y-2">
                      <div className="text-xs text-slate-500">预估金额：USD {order.estimatedAmount}</div>
                      {order.estimateLines?.length ? (
                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 space-y-1">
                          {order.estimateLines.map(line => (
                            <div key={line.key} className="flex justify-between gap-3">
                              <span className="truncate">{line.label}</span>
                              <span className="font-semibold shrink-0">USD {Math.round(line.amount)}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onEdit(order)}
                    disabled={!editable}
                    className={`w-full h-10 rounded-xl text-sm font-semibold transition-all ${
                      editable ? 'bg-white border border-slate-200 text-slate-900 shadow-sm active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {editable ? '修改订单' : '服务中/已完成不可修改'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] z-40 pb-safe">
        <div className="max-w-md mx-auto">
          <button
            onClick={onNew}
            className="w-full h-12 px-4 rounded-xl font-semibold text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 bg-blue-600 hover:bg-blue-700 shadow-blue-200"
          >
            New booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step4_AgentOrders;
