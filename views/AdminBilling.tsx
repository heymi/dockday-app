import React, { useEffect, useMemo, useState } from 'react';
import { AGENCY_COMPANIES, getAgencyCompany } from '../shiftBilling';
import { loadAllShiftOrders, ShiftOrder, updateShiftOrder } from '../shiftOrders';
import { createMonthlyStatement, loadMonthlyStatement, loadOrderActual, ReceiptAttachment, saveMonthlyStatement, saveOrderActual } from '../billingSettlement';
import { ArrowLeft, ClipboardList, Copy, CreditCard, Eye, FileText, Plus, Printer, Save, Trash2, Wand2 } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const toMonth = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const formatBookedSummary = (order: ShiftOrder) => {
  const people = order.data?.groupSize ?? 1;
  const cars = order.data?.carCount ?? 1;
  const transferType = order.data?.transferType;
  const transferLabel = transferType === 'airport' ? '接机' : transferType === 'port' ? '接船' : '接送';
  const time = order.data?.transferDateTime ? new Date(order.data.transferDateTime).toLocaleString() : '待定';
  const pickupPoint = order.data?.pickupPoint?.trim() || '';
  const pickupTerminal = order.data?.pickupTerminal?.trim() || '';
  const pickupGate = order.data?.pickupGate?.trim() || '';
  const flightNumber = order.data?.airportFlightNumber?.trim() || '';
  const vesselName = order.data?.portVesselName?.trim() || '';
  const vesselNumber = order.data?.portVesselNumber?.trim() || '';
  const hotel = order.data?.needHotel ? `${order.data?.hotelName || '未填写'} · ${order.data?.hotelNights || 1}晚` : '不需要';
  const meal = order.data?.needMeal
    ? `${order.data?.mealPlan === 'premium' ? '品质餐' : '标准餐'} · ${order.data?.mealCount || people}人`
    : '不需要';
  const crewNationalities = order.data?.crewNationalities?.length ? order.data.crewNationalities.join('、') : '';
  const pickupIdentifier = order.data?.pickupIdentifier?.trim() || '';
  const contact = pickupIdentifier || '未填写';
  const destination = order.data?.destination?.trim() || '';
  const luggage = order.data?.luggageNotes?.trim() || '';
  const notes = order.data?.notes?.trim() || '';
  const pickupDetailParts = [];
  pickupDetailParts.push(`集合点：${pickupPoint || '未填写'}`);
  if (transferType === 'airport') {
    pickupDetailParts.push(`航站楼：${pickupTerminal || '未填写'}`);
    pickupDetailParts.push(`到达口：${pickupGate || '未填写'}`);
    pickupDetailParts.push(`航班号：${flightNumber || '未填写'}`);
  }
  if (transferType === 'port') {
    pickupDetailParts.push(`船名：${vesselName || '未填写'}`);
    pickupDetailParts.push(`船号：${vesselNumber || '未填写'}`);
  }
  return {
    top: `${people}人 · ${cars}车`,
    mid: `${transferLabel} · ${time}`,
    bottom: pickupDetailParts.join(' · '),
    contact,
    pickupIdentifier,
    destination,
    luggage,
    notes,
    hotel,
    meal,
    crewNationalities,
    transferLabel,
    transferType,
    time,
    pickupPoint,
    pickupTerminal,
    pickupGate,
    flightNumber,
    vesselName,
    vesselNumber,
  };
};

const buildDispatchText = (order: ShiftOrder) => {
  const booked = formatBookedSummary(order);
  const header = `派单信息 · ${order.id}`;
  const createdAt = `创建时间：${new Date(order.createdAt).toLocaleString()}`;
  const agencyCompanyId = order.agencyCompanyId ? `代理公司ID：${order.agencyCompanyId}` : '';
  const billing = `结算方式：月结（平台垫付）`;
  return [
    header,
    createdAt,
    agencyCompanyId,
    billing,
    '',
    '【预订信息】',
    `人数/车辆：${booked.top}`,
    `接送类型：${booked.transferLabel}`,
    `接送时间：${booked.time}`,
    `集合点：${booked.pickupPoint || '未填写'}`,
    booked.transferType === 'airport' ? `航站楼：${booked.pickupTerminal || '未填写'}` : '',
    booked.transferType === 'airport' ? `到达口：${booked.pickupGate || '未填写'}` : '',
    booked.transferType === 'airport' ? `航班号：${booked.flightNumber || '未填写'}` : '',
    booked.transferType === 'port' ? `船名：${booked.vesselName || '未填写'}` : '',
    booked.transferType === 'port' ? `船号：${booked.vesselNumber || '未填写'}` : '',
    booked.destination ? `目的地：${booked.destination}` : '',
    `酒店：${booked.hotel}`,
    `餐饮：${booked.meal}`,
    booked.crewNationalities ? `船员国籍：${booked.crewNationalities}` : '',
    `接驳识别：${booked.pickupIdentifier || '未填写'}`,
    booked.luggage ? `行李/需求：${booked.luggage}` : '',
    booked.notes ? `备注：${booked.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n');
};

const buildDispatchPayload = (order: ShiftOrder) => {
  const booked = formatBookedSummary(order);
  return {
    订单号: order.id,
    创建时间: new Date(order.createdAt).toLocaleString(),
    代理公司ID: order.agencyCompanyId || '',
    结算方式: '月结（平台垫付）',
    预订信息: {
      人数车辆: booked.top,
      接送类型: booked.transferLabel,
      接送时间: booked.time,
      集合点: booked.pickupPoint || '未填写',
      航站楼: booked.transferType === 'airport' ? booked.pickupTerminal || '未填写' : '',
      到达口: booked.transferType === 'airport' ? booked.pickupGate || '未填写' : '',
      航班号: booked.transferType === 'airport' ? booked.flightNumber || '未填写' : '',
      船名: booked.transferType === 'port' ? booked.vesselName || '未填写' : '',
      船号: booked.transferType === 'port' ? booked.vesselNumber || '未填写' : '',
      目的地: booked.destination || '未填写',
      酒店: booked.hotel,
      餐饮: booked.meal,
      船员国籍: booked.crewNationalities || '未填写',
      接驳识别: booked.pickupIdentifier || '未填写',
      行李需求: booked.luggage || '',
      备注: booked.notes || '',
    },
  };
};

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

const AdminBilling: React.FC<Props> = ({ onBack }) => {
  const [agencyCompanyId, setAgencyCompanyId] = useState<string>(AGENCY_COMPANIES[0]?.id || '');
  const [period, setPeriod] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lineDraft, setLineDraft] = useState<{ label: string; amount: string }>({ label: '', amount: '' });
  const [lineDraftFiles, setLineDraftFiles] = useState<ReceiptAttachment[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const company = useMemo(() => getAgencyCompany(agencyCompanyId), [agencyCompanyId]);

  const orders = useMemo(() => {
    void refreshKey;
    const all = loadAllShiftOrders();
    return all
      .filter(o => o.agencyCompanyId === agencyCompanyId)
      .filter(o => toMonth(o.createdAt) === period)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [agencyCompanyId, period, refreshKey]);

  useEffect(() => {
    const first = orders[0];
    if (!first) return;
    if (loadOrderActual(first.id)) return;
    const now = Date.now();
    const mockAttachment = (label: string): ReceiptAttachment => ({
      name: `${label}-mock.png`,
      size: 18234,
      type: 'image/png',
      lastModified: now,
    });
    const rawLines = first.estimateLines?.length
      ? first.estimateLines
      : [{ key: 'total', label: '合计', amount: first.estimatedAmount || 0 }];
    const normalizedLines = normalizeEstimateLines(rawLines);
    const lines = normalizedLines.map(line => ({
      key: line.key,
      label: line.label,
      amount: Number(line.amount) || 0,
      attachments: [mockAttachment(line.key || 'receipt')],
    }));
    const details = {
      carSeat: '7座',
      carKilometer: '35km',
      carHours: '2小时',
      hotelName: '示例酒店',
      hotelRoomType: '标准大床房',
      hotelNights: '1',
      hotelRackRate: '120',
      hotelRackAttachments: [mockAttachment('hotel')],
      mealRestaurant: '示例餐厅',
      mealCount: String(first.data?.mealCount || first.data?.groupSize || 2),
      mealPrice: '25/人',
      mealAttachments: [mockAttachment('meal')],
    };
    saveOrderActual(first.id, { lines, details });
    setRefreshKey(k => k + 1);
  }, [orders, refreshKey]);

  useEffect(() => {
    if (orders.length === 0) {
      if (selectedOrderId) setSelectedOrderId(null);
      if (detailOpen) setDetailOpen(false);
      return;
    }
    if (!selectedOrderId || !orders.some(o => o.id === selectedOrderId)) {
      setSelectedOrderId(orders[0].id);
      setDetailOpen(false);
    }
  }, [orders, selectedOrderId, detailOpen]);

  const statement = useMemo(() => {
    if (!agencyCompanyId || !period) return null;
    void refreshKey;
    return loadMonthlyStatement(agencyCompanyId, period);
  }, [agencyCompanyId, period, refreshKey]);

  const allOrdersById = useMemo(() => {
    void refreshKey;
    const all = loadAllShiftOrders();
    const map = new Map<string, ShiftOrder>();
    all.forEach(o => map.set(o.id, o));
    return map;
  }, [refreshKey]);

  const totals = useMemo(() => {
    void refreshKey;
    const estimated = orders.reduce((sum, o) => sum + (o.estimatedAmount || 0), 0);
    const actual = orders.reduce((sum, o) => sum + (loadOrderActual(o.id)?.total || 0), 0);
    const missingActual = orders.filter(o => !loadOrderActual(o.id)).length;
    const missingReceipts = orders.filter(o => {
      const actualCost = loadOrderActual(o.id);
      if (!actualCost?.lines?.length) return false;
      return !validateReceipts(actualCost.lines);
    }).length;
    return { estimated: Math.round(estimated), actual: Math.round(actual), missingActual, missingReceipts };
  }, [orders, refreshKey]);
  const canFinalizeStatement = totals.missingActual === 0 && totals.missingReceipts === 0;
  const statementStatus = statement?.status || 'draft';
  const canConfirmStatement = canFinalizeStatement && statementStatus === 'draft';
  const canInvoiceStatement = canFinalizeStatement && statementStatus === 'confirmed';
  const canMarkPaid = canFinalizeStatement && statementStatus === 'invoiced';

  const normalizeEstimateLines = (lines: { key: string; label: string; amount: number }[]) => {
    const normalized: { key: string; label: string; amount: number }[] = [];
    const serviceLine = lines.find(l => l.label === 'Service handling');
    const vehicleLine = lines.find(l => l.label.startsWith('Vehicles'));
    if (serviceLine || vehicleLine) {
      const amount = (serviceLine?.amount || 0) + (vehicleLine?.amount || 0);
      const vehicleLabel = vehicleLine?.label || 'Vehicles ×1';
      const countMatch = vehicleLabel.match(/Vehicles\\s*×\\s*(\\d+)/i);
      const count = countMatch ? countMatch[1] : '';
      normalized.push({
        key: 'car',
        label: `用车+调度(含服务)${count ? ` ×${count}` : ''}`,
        amount,
      });
    }
    lines.forEach(line => {
      if (line.label === 'Service handling') return;
      if (line.label.startsWith('Vehicles')) return;
      if (line.label === 'Pickup coordination') {
        normalized.push({ ...line, label: '接送协调' });
        return;
      }
      if (line.label.startsWith('Hotel nights')) {
        normalized.push({ ...line, label: line.label.replace('Hotel nights', '酒店 ·') });
        return;
      }
      if (line.label.startsWith('Meals')) {
        normalized.push({ ...line, label: line.label.replace('Meals', '餐饮 ·') });
        return;
      }
      if (line.label.startsWith('酒店预算')) {
        normalized.push({ ...line, label: line.label.replace('酒店预算', '酒店') });
        return;
      }
      if (line.label.startsWith('用餐预算')) {
        normalized.push({ ...line, label: line.label.replace('用餐预算', '餐饮') });
        return;
      }
      normalized.push(line);
    });
    return normalized;
  };

  const normalizeActualLabel = (label: string) => {
    if (label.startsWith('Hotel nights')) return label.replace('Hotel nights', '酒店 ·');
    if (label.startsWith('Meals')) return label.replace('Meals', '餐饮 ·');
    if (label.startsWith('酒店预算')) return label.replace('酒店预算', '酒店');
    if (label.startsWith('用餐预算')) return label.replace('用餐预算', '餐饮');
    return label;
  };

  const saveActualFromEstimate = (order: ShiftOrder) => {
    const rawLines = order.estimateLines?.length
      ? order.estimateLines
      : [{ key: 'total', label: '合计', amount: order.estimatedAmount || 0 }];
    const normalizedLines = normalizeEstimateLines(rawLines);
    const lines = normalizedLines.map(l => ({
      key: l.key,
      label: l.label,
      amount: Number(l.amount) || 0,
      attachments: [] as ReceiptAttachment[],
    }));
    saveOrderActual(order.id, { lines });
    setRefreshKey(k => k + 1);
  };

  const updateActualLine = (orderId: string, key: string, label: string, amount: number) => {
    const existing = loadOrderActual(orderId);
    const lines = existing?.lines ? [...existing.lines] : [];
    const idx = lines.findIndex(l => l.key === key);
    if (idx >= 0) lines[idx] = { ...lines[idx], key, label, amount };
    else lines.push({ key, label, amount, attachments: [] });
    saveOrderActual(orderId, { lines, notes: existing?.notes, details: existing?.details });
    setRefreshKey(k => k + 1);
  };

  const toReceiptAttachments = (files: FileList | null): ReceiptAttachment[] => {
    if (!files) return [];
    return Array.from(files).map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
      lastModified: f.lastModified,
    }));
  };

  const updateLineAttachments = (orderId: string, key: string, attachments: ReceiptAttachment[]) => {
    const existing = loadOrderActual(orderId);
    const lines = existing?.lines ? [...existing.lines] : [];
    const idx = lines.findIndex(l => l.key === key);
    if (idx >= 0) lines[idx] = { ...lines[idx], attachments };
    else lines.push({ key, label: key, amount: 0, attachments });
    saveOrderActual(orderId, { lines, notes: existing?.notes, details: existing?.details });
    setRefreshKey(k => k + 1);
  };

  const removeActualLine = (orderId: string, key: string) => {
    const existing = loadOrderActual(orderId);
    const lines = (existing?.lines || []).filter(l => l.key !== key);
    saveOrderActual(orderId, { lines, notes: existing?.notes, details: existing?.details });
    setRefreshKey(k => k + 1);
  };

  function validateReceipts(lines: { amount: number; attachments?: ReceiptAttachment[] }[]) {
    const chargeLines = lines.filter(l => (Number(l.amount) || 0) !== 0);
    const missing = chargeLines.filter(l => !(l.attachments && l.attachments.length));
    return missing.length === 0;
  }

  const updateDetails = (orderId: string, details: any) => {
    const existing = loadOrderActual(orderId);
    const lines = existing?.lines || [];
    saveOrderActual(orderId, { lines, notes: existing?.notes, details });
    setRefreshKey(k => k + 1);
  };

  const previewOrders = useMemo(() => {
    void refreshKey;
    if (statement?.orderIds?.length) {
      return statement.orderIds.map(id => allOrdersById.get(id)).filter(Boolean) as ShiftOrder[];
    }
    return orders;
  }, [statement, allOrdersById, orders, refreshKey]);

  const previewTotals = useMemo(() => {
    void refreshKey;
    const estimated = previewOrders.reduce((sum, o) => sum + (o.estimatedAmount || 0), 0);
    const actual = previewOrders.reduce((sum, o) => sum + (loadOrderActual(o.id)?.total || 0), 0);
    return { estimated: Math.round(estimated), actual: Math.round(actual) };
  }, [previewOrders, refreshKey]);

  const receiptCountForOrder = (orderId: string) => {
    const actual = loadOrderActual(orderId);
    if (!actual?.lines?.length) return 0;
    return actual.lines.reduce((sum, l) => sum + (l.attachments?.length || 0), 0);
  };

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return orders.find(o => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  const generateStatement = () => {
    if (!agencyCompanyId || !period) return;
    createMonthlyStatement({ agencyCompanyId, period, orders });
    setRefreshKey(k => k + 1);
  };

  const setStatementStatus = (status: 'draft' | 'confirmed' | 'invoiced' | 'paid') => {
    if (!statement) return;
    saveMonthlyStatement({ ...statement, status });
    setRefreshKey(k => k + 1);
  };

  const statusLabel = (status: string) => {
    if (status === 'draft') return '草稿';
    if (status === 'confirmed') return '已确认';
    if (status === 'invoiced') return '已开票';
    if (status === 'paid') return '已收款';
    return status;
  };

  const orderStatus = (actual: ReturnType<typeof loadOrderActual> | null, receiptsOk: boolean) => {
    if (!actual) return { label: '待录入费用', tone: 'amber' };
    if (!receiptsOk) return { label: '待补票据', tone: 'rose' };
    if (statement?.status === 'paid') return { label: '已结算', tone: 'emerald' };
    if (statement?.status === 'invoiced') return { label: '已开票', tone: 'blue' };
    if (statement?.status === 'confirmed') return { label: '已确认', tone: 'blue' };
    return { label: '待结算', tone: 'slate' };
  };

  const serviceStatusLabel = (status?: ShiftOrder['status']) => {
    if (status === 'in_service') return '服务中';
    if (status === 'completed') return '已完成';
    return '审核中';
  };

  const orderStatusClass = (tone: string) => {
    if (tone === 'emerald') return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
    if (tone === 'blue') return 'bg-blue-50 text-blue-700 border border-blue-100';
    if (tone === 'amber') return 'bg-amber-50 text-amber-700 border border-amber-100';
    if (tone === 'rose') return 'bg-rose-50 text-rose-700 border border-rose-100';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
        <div className="px-6 h-14 flex items-center justify-between max-w-6xl mx-auto">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-slate-800 text-base flex items-center gap-2">
            <CreditCard size={16} className="text-blue-600" />
            后台 · 换班结算（演示）
          </h1>
          <div className="w-8" />
        </div>
      </div>

      <main className="max-w-6xl mx-auto p-6 pt-8 pb-16 space-y-6">
        {copyHint && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-800">
            {copyHint}
          </div>
        )}

        {showPreview && (
          <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm">
            <div className="absolute inset-x-0 top-10 bottom-10 px-4">
              <div className="max-w-md mx-auto h-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500">账单预览</div>
                    <div className="font-semibold text-slate-900">{company?.name || '代理公司'}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      账期 {period} · {statement ? `对账单 ${statement.id} · ${statusLabel(statement.status)}` : '未生成对账单（预览草稿）'}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="h-9 px-3 rounded-xl bg-slate-900 text-white text-sm font-semibold shadow-sm active:scale-95 transition-all"
                  >
                    关闭
                  </button>
                </div>

                <div className="p-4 overflow-auto space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                      <div className="text-xs text-slate-500">预估总额</div>
                      <div className="font-bold text-slate-900">USD {previewTotals.estimated}</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                      <div className="text-xs text-slate-500">实际总额</div>
                      <div className="font-bold text-slate-900">USD {previewTotals.actual}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-slate-900">订单明细</div>
                    <div className="space-y-2">
                      {previewOrders.map(o => {
                        const actual = loadOrderActual(o.id);
                        const receiptCount = receiptCountForOrder(o.id);
                        const actualTotal = actual?.total ?? 0;
                        const est = o.estimatedAmount || 0;
                        const booked = formatBookedSummary(o);
                        return (
                          <div key={o.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-xs text-slate-500">订单</div>
                                <div className="font-semibold text-slate-900 truncate">{o.id}</div>
                                <div className="text-[11px] text-slate-500 mt-0.5">{new Date(o.createdAt).toLocaleString()}</div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-xs text-slate-500">实际</div>
                                <div className="font-bold text-slate-900">USD {actualTotal}</div>
                                <div className="text-[11px] text-slate-500">预估 USD {est}</div>
                              </div>
                            </div>
                            <div className="mt-2 text-[11px] text-slate-500">
                              票据数：<span className="font-semibold text-slate-900">{receiptCount}</span>
                              {!actual ? <span className="ml-2 text-rose-600 font-semibold">缺少实际费用</span> : null}
                            </div>
                            <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-700 space-y-1">
                              <div className="font-semibold text-slate-900">{booked.top}</div>
                              <div className="text-slate-600">{booked.mid}</div>
                              <div className="text-slate-600">{booked.bottom}</div>
                              <div className="text-slate-600">接驳识别：{booked.pickupIdentifier || '未填写'}</div>
                              <div className="text-slate-600">酒店：{booked.hotel}</div>
                              <div className="text-slate-600">餐饮：{booked.meal}</div>
                              {booked.crewNationalities ? <div className="text-slate-600">船员国籍：{booked.crewNationalities}</div> : null}
                              {booked.destination ? <div className="text-slate-600">目的地：{booked.destination}</div> : null}
                              {booked.luggage ? <div className="text-slate-600">行李/需求：{booked.luggage}</div> : null}
                              {booked.notes ? (
                                <div className="pt-1 mt-2 border-t border-slate-200 text-slate-600">
                                  备注：<span className="text-slate-900 font-semibold">{booked.notes}</span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 h-11 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Printer size={16} />
                    打印
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="flex-1 h-11 rounded-xl bg-blue-600 text-white font-semibold shadow-sm active:scale-95 transition-all"
                  >
                    完成
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="lg:w-80 flex-shrink-0 space-y-3">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
              <div className="text-sm font-semibold text-slate-900">筛选</div>
              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-semibold">代理公司</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-slate-900 font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={agencyCompanyId}
                  onChange={(e) => setAgencyCompanyId(e.target.value)}
                >
                  {AGENCY_COMPANIES.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-semibold">结算月份</label>
                <input
                  type="month"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <ClipboardList size={18} className="text-blue-600" />
                  月度汇总
                </div>
                {statement ? (
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                    {statusLabel(statement.status)}
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                    未生成对账单
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <div className="text-xs text-slate-500">预估总额</div>
                  <div className="font-bold text-slate-900">USD {totals.estimated}</div>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <div className="text-xs text-slate-500">实际总额</div>
                  <div className="font-bold text-slate-900">USD {totals.actual}</div>
                </div>
              </div>

              <div className="text-xs text-slate-500">
                订单数：{orders.length} · 缺少实际费用：{totals.missingActual} · 缺少票据：{totals.missingReceipts}
              </div>

              <div className="flex gap-2">
                {!statement ? (
                  <button
                    onClick={generateStatement}
                    className="flex-1 h-11 rounded-xl bg-slate-900 text-white font-semibold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <FileText size={16} />
                    生成对账单
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setStatementStatus('confirmed')}
                      className={`flex-1 h-11 rounded-xl text-white font-semibold shadow-sm transition-all ${
                        canConfirmStatement ? 'bg-slate-900 active:scale-95' : 'bg-slate-300 cursor-not-allowed'
                      }`}
                      disabled={!canConfirmStatement}
                    >
                      标记已确认
                    </button>
                    <button
                      onClick={() => setStatementStatus('invoiced')}
                      className={`flex-1 h-11 rounded-xl text-white font-semibold shadow-sm transition-all ${
                        canInvoiceStatement ? 'bg-slate-900 active:scale-95' : 'bg-slate-300 cursor-not-allowed'
                      }`}
                      disabled={!canInvoiceStatement}
                    >
                      标记已开票
                    </button>
                    <button
                      onClick={() => setStatementStatus('paid')}
                      className={`flex-1 h-11 rounded-xl text-white font-semibold shadow-sm transition-all ${
                        canMarkPaid ? 'bg-blue-600 active:scale-95' : 'bg-slate-300 cursor-not-allowed'
                      }`}
                      disabled={!canMarkPaid}
                    >
                      标记已收款
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowPreview(true)}
                className="w-full h-11 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Eye size={16} />
                预览账单
              </button>

              {company?.accounts[0] && (
                <div className="text-[11px] text-slate-400">
                  默认账户：{company.accounts[0].name} · 账期 T+{company.accounts[0].termDays} · 授信 USD {company.accounts[0].creditLimit}
                </div>
              )}
              {!canFinalizeStatement && (
                <div className="text-[11px] text-rose-600">
                  请先补齐全部实际费用与票据，再进行确认/开票/收款标记。
                </div>
              )}
              {statement && statementStatus === 'confirmed' && (
                <div className="text-[11px] text-slate-500">
                  已确认账单，等待代理开票或回款。
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">{period} 订单</div>
                <div className="text-xs text-slate-500">代理公司：{company?.name || agencyCompanyId}</div>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 text-center text-sm text-slate-500">
                该公司/月份暂无订单（演示版从本机 localStorage 读取）。
              </div>
            ) : (
              <div className="space-y-2">
                {orders.map(order => {
                  const actual = loadOrderActual(order.id);
                  const estimateTotal = order.estimatedAmount || 0;
                  const actualTotal = actual?.total ?? 0;
                  const booked = formatBookedSummary(order);
                  const receiptsOk = actual ? validateReceipts(actual.lines || []) : false;
                  const status = orderStatus(actual, receiptsOk);

                    return (
                      <button
                        key={order.id}
                        type="button"
                      onClick={() => {
                        setSelectedOrderId(order.id);
                        setDetailOpen(true);
                      }}
                      className="w-full text-left rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:border-blue-200 transition-all"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs text-slate-500">订单</div>
                          <div className="font-semibold text-slate-900 truncate">{order.id}</div>
                          <div className="text-[11px] text-slate-400 mt-1">{new Date(order.createdAt).toLocaleString()}</div>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${orderStatusClass(status.tone)}`}>
                          {status.label}
                        </span>
                      </div>
                        <div className="mt-2 text-xs text-slate-600 flex flex-wrap gap-2">
                          <span>{booked.top}</span>
                          <span>·</span>
                          <span>{booked.mid}</span>
                          <span>·</span>
                          <span>{booked.pickupIdentifier || '未填写'}</span>
                          <span>·</span>
                          <span>服务状态：{serviceStatusLabel(order.status)}</span>
                        </div>
                      <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                        <span>预估 USD {estimateTotal}</span>
                        <span>·</span>
                        <span>实际 USD {actualTotal}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {detailOpen && selectedOrder ? (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setDetailOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 w-full sm:w-1/2 max-w-none bg-white border-l border-slate-200 shadow-xl z-50 overflow-y-auto">
            {(() => {
              const order = selectedOrder;
              const actual = loadOrderActual(order.id);
              const expanded = expandedOrderId === order.id;
              const estimateTotal = order.estimatedAmount || 0;
              const actualTotal = actual?.total ?? 0;
              const booked = formatBookedSummary(order);
              const rawLines = order.estimateLines?.length
                ? order.estimateLines
                : [{ key: 'total', label: '合计', amount: estimateTotal }];
              const normalizedLines = normalizeEstimateLines(rawLines);
              const defaultLines = normalizedLines.map(l => ({
                key: l.key,
                label: l.label,
                amount: Number(l.amount) || 0,
                attachments: [] as ReceiptAttachment[],
              }));
              const lines = (actual?.lines?.length ? actual.lines : defaultLines).map(line => ({
                ...line,
                label: normalizeActualLabel(line.label),
              }));
              const receiptsOk = validateReceipts(lines);
              const receiptCount = receiptCountForOrder(order.id);
              const status = orderStatus(actual, receiptsOk);
              const details = actual?.details || {};
              const serviceStatus = order.status || 'review';
              const driver = order.driver || {};
              const canEditDriver = serviceStatus !== 'completed';
              const driverValid = Boolean(driver.name?.trim() && driver.phone?.trim() && driver.plate?.trim() && driver.seats?.trim());
              const canRecordActual = serviceStatus === 'completed';

              return (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-slate-500">订单详情</div>
                      <div className="font-semibold text-slate-900 truncate">{order.id}</div>
                      <div className="text-[11px] text-slate-400 mt-1">{new Date(order.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${orderStatusClass(status.tone)}`}>
                        {status.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDetailOpen(false)}
                        className="h-8 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                      >
                        关闭
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-700">审核与派车</div>
                      <span className="text-slate-500">状态：{serviceStatusLabel(serviceStatus)}</span>
                    </div>
                    {order.audit?.approvedAt ? (
                      <div className="text-[11px] text-slate-500">
                        审核人：{order.audit.approvedBy || '系统管理员'} · 时间：{new Date(order.audit.approvedAt).toLocaleString()}
                      </div>
                    ) : null}
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="司机姓名（必填）"
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                        value={driver.name || ''}
                        onChange={(e) => {
                          updateShiftOrder({ ...order, driver: { ...driver, name: e.target.value } });
                          setRefreshKey(k => k + 1);
                        }}
                        disabled={!canEditDriver}
                      />
                      <input
                        type="text"
                        placeholder="联系方式（必填）"
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                        value={driver.phone || ''}
                        onChange={(e) => {
                          updateShiftOrder({ ...order, driver: { ...driver, phone: e.target.value } });
                          setRefreshKey(k => k + 1);
                        }}
                        disabled={!canEditDriver}
                      />
                      <input
                        type="text"
                        placeholder="车牌号（必填）"
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                        value={driver.plate || ''}
                        onChange={(e) => {
                          updateShiftOrder({ ...order, driver: { ...driver, plate: e.target.value } });
                          setRefreshKey(k => k + 1);
                        }}
                        disabled={!canEditDriver}
                      />
                      <input
                        type="text"
                        placeholder="座位数（必填）"
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                        value={driver.seats || ''}
                        onChange={(e) => {
                          updateShiftOrder({ ...order, driver: { ...driver, seats: e.target.value } });
                          setRefreshKey(k => k + 1);
                        }}
                        disabled={!canEditDriver}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="车型/车辆备注（选填）"
                      className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                      value={driver.vehicleType || ''}
                      onChange={(e) => {
                        updateShiftOrder({ ...order, driver: { ...driver, vehicleType: e.target.value } });
                        setRefreshKey(k => k + 1);
                      }}
                      disabled={!canEditDriver}
                    />
                    {serviceStatus === 'review' ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!driverValid) return;
                          updateShiftOrder({
                            ...order,
                            status: 'in_service',
                            audit: { approvedBy: '系统管理员', approvedAt: new Date().toISOString() },
                          });
                          setRefreshKey(k => k + 1);
                        }}
                        className={`w-full h-9 rounded-lg text-xs font-semibold transition-all ${
                          driverValid ? 'bg-slate-900 text-white active:scale-95' : 'bg-slate-300 text-white cursor-not-allowed'
                        }`}
                        disabled={!driverValid}
                      >
                        审核通过并进入服务中
                      </button>
                    ) : null}
                    {serviceStatus === 'in_service' ? (
                      <button
                        type="button"
                        onClick={() => {
                          updateShiftOrder({ ...order, status: 'completed' });
                          setRefreshKey(k => k + 1);
                        }}
                        className="w-full h-9 rounded-lg text-xs font-semibold bg-blue-600 text-white active:scale-95"
                      >
                        标记服务完成
                      </button>
                    ) : null}
                    {serviceStatus === 'completed' ? (
                      <div className="text-[11px] text-slate-500">已完成，允许录入实际费用。</div>
                    ) : null}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 text-xs">
                    <div className="font-semibold text-slate-700">保险（可随时上传）</div>
                    <input
                      type="file"
                      multiple
                      className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-900 file:shadow-sm"
                      onChange={(e) => {
                        const attachments = toReceiptAttachments(e.target.files);
                        updateShiftOrder({ ...order, insuranceAttachments: attachments });
                        setRefreshKey(k => k + 1);
                      }}
                    />
                    <div className="text-[11px] text-slate-500">可上传多份保单，未购买可留空。</div>
                    {order.insuranceAttachments?.length ? (
                      <div className="text-[11px] text-slate-500">
                        {order.insuranceAttachments.map(a => a.name).join(', ')}
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-700">预订信息</div>
                      <span className="text-[11px] text-slate-500">票据数：{receiptCount}</span>
                    </div>
                    <div className="text-slate-700">{booked.top}</div>
                    <div className="text-slate-600">{booked.mid}</div>
                    <div className="text-slate-600">{booked.bottom}</div>
                    <div className="text-slate-600">接驳识别：{booked.pickupIdentifier || '未填写'}</div>
                    <div className="text-slate-600">酒店：{booked.hotel}</div>
                    <div className="text-slate-600">餐饮：{booked.meal}</div>
                    {booked.crewNationalities ? <div className="text-slate-600">船员国籍：{booked.crewNationalities}</div> : null}
                    {booked.destination ? <div className="text-slate-600">目的地：{booked.destination}</div> : null}
                    {booked.luggage ? <div className="text-slate-600">行李/需求：{booked.luggage}</div> : null}
                    {booked.notes ? <div className="text-slate-600">备注：{booked.notes}</div> : null}
                  </div>

                  <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                    <span>预估 USD {estimateTotal}</span>
                    <span>·</span>
                    <span>实际 USD {actualTotal}</span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                    {!actual ? <span className="text-rose-600 font-semibold">缺少实际费用</span> : null}
                    {actual && !receiptsOk ? <span className="text-rose-600 font-semibold">票据未补齐</span> : null}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setExpandedOrderId(expanded ? null : order.id)}
                      className={`flex-1 h-10 rounded-xl border font-semibold shadow-sm transition-all ${
                        canRecordActual ? 'border-slate-200 bg-white text-slate-900 active:scale-95' : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                      disabled={!canRecordActual}
                    >
                      {canRecordActual ? (expanded ? '收起实际录入' : '录入实际') : '服务完成后可录入实际'}
                    </button>
                    <button
                      onClick={() => saveActualFromEstimate(order)}
                      className={`h-10 px-3 rounded-xl font-semibold shadow-sm transition-all flex items-center gap-2 ${
                        canRecordActual ? 'bg-slate-900 text-white active:scale-95' : 'bg-slate-300 text-white cursor-not-allowed'
                      }`}
                      title="复制预估费用为实际费用（再按需调整）"
                      disabled={!canRecordActual}
                    >
                      <Wand2 size={16} />
                    </button>
                    <button
                      onClick={async () => {
                        const ok = await copyText(buildDispatchText(order));
                        setCopyHint(ok ? '已复制订单信息。' : '复制失败。');
                        setTimeout(() => setCopyHint(null), 1800);
                      }}
                      className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold shadow-sm active:scale-95 transition-all flex items-center gap-2"
                    >
                      <Copy size={16} />
                      复制订单信息
                    </button>
                    <button
                      onClick={async () => {
                        const payload = buildDispatchPayload(order);
                        const ok = await copyText(JSON.stringify(payload, null, 2));
                        setCopyHint(ok ? '已复制中文模板。' : '复制失败。');
                        setTimeout(() => setCopyHint(null), 1800);
                      }}
                      className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold shadow-sm active:scale-95 transition-all flex items-center gap-2"
                    >
                      <Copy size={16} />
                      中文模板
                    </button>
                  </div>

                  {expanded && canRecordActual && (
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-800">实际录入</div>
                        <div className="text-[11px] text-slate-500">先记录执行事实，再录费用与票据。</div>
                      </div>

                      <div className="rounded-xl bg-white border border-slate-200 p-3 space-y-3">
                        <div className="text-xs font-semibold text-slate-700">步骤 1/2 · 执行事实</div>
                        <div className="text-[11px] text-slate-500">用于对外沟通与复盘，不等于费用，未使用可留空。</div>

                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-3">
                          <div className="text-[11px] text-slate-500 font-semibold">用车</div>
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              placeholder="座位数"
                              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                              value={details.carSeat || ''}
                              onChange={(e) => updateDetails(order.id, { ...details, carSeat: e.target.value })}
                            />
                            <input
                              type="text"
                              placeholder="公里数"
                              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                              value={details.carKilometer || ''}
                              onChange={(e) => updateDetails(order.id, { ...details, carKilometer: e.target.value })}
                            />
                            <input
                              type="text"
                              placeholder="时长"
                              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                              value={details.carHours || ''}
                              onChange={(e) => updateDetails(order.id, { ...details, carHours: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-3">
                          <div className="text-[11px] text-slate-500 font-semibold">酒店</div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="酒店名称"
                              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                              value={details.hotelName || ''}
                              onChange={(e) => updateDetails(order.id, { ...details, hotelName: e.target.value })}
                            />
                            <input
                              type="text"
                              placeholder="房型"
                              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                              value={details.hotelRoomType || ''}
                              onChange={(e) => updateDetails(order.id, { ...details, hotelRoomType: e.target.value })}
                            />
                            <input
                              type="text"
                              placeholder="晚数"
                              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                              value={details.hotelNights || ''}
                              onChange={(e) => updateDetails(order.id, { ...details, hotelNights: e.target.value })}
                            />
                            <input
                              type="text"
                              placeholder="当日门市价"
                              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                              value={details.hotelRackRate || ''}
                              onChange={(e) => updateDetails(order.id, { ...details, hotelRackRate: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <input
                              type="file"
                              multiple
                              className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-900 file:shadow-sm"
                              onChange={(e) => {
                                const attachments = toReceiptAttachments(e.target.files);
                                updateDetails(order.id, { ...details, hotelRackAttachments: attachments });
                              }}
                            />
                            <div className="text-[11px] text-slate-500">上传门市价截图/凭证，未入住可留空。</div>
                            {details.hotelRackAttachments?.length ? (
                              <div className="text-[11px] text-slate-500">
                                {details.hotelRackAttachments.map(a => a.name).join(', ')}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-3">
                          <div className="text-[11px] text-slate-500 font-semibold">餐饮</div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="餐厅名称"
                              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                              value={details.mealRestaurant || ''}
                              onChange={(e) => updateDetails(order.id, { ...details, mealRestaurant: e.target.value })}
                            />
                            <input
                              type="text"
                              placeholder="用餐人数"
                              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                              value={details.mealCount || ''}
                              onChange={(e) => updateDetails(order.id, { ...details, mealCount: e.target.value })}
                            />
                            <input
                              type="text"
                              placeholder="人均/总价"
                              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                              value={details.mealPrice || ''}
                              onChange={(e) => updateDetails(order.id, { ...details, mealPrice: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <input
                              type="file"
                              multiple
                              className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-900 file:shadow-sm"
                              onChange={(e) => {
                                const attachments = toReceiptAttachments(e.target.files);
                                updateDetails(order.id, { ...details, mealAttachments: attachments });
                              }}
                            />
                            <div className="text-[11px] text-slate-500">上传餐饮票据/截图，未用餐可留空。</div>
                            {details.mealAttachments?.length ? (
                              <div className="text-[11px] text-slate-500">
                                {details.mealAttachments.map(a => a.name).join(', ')}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2">
                          <div className="text-[11px] text-slate-500 font-semibold">保险（选填）</div>
                          <input
                            type="file"
                            multiple
                            className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-900 file:shadow-sm"
                            onChange={(e) => {
                              const attachments = toReceiptAttachments(e.target.files);
                              updateDetails(order.id, { ...details, insuranceAttachments: attachments });
                            }}
                          />
                          <div className="text-[11px] text-slate-500">上传保单/投保证明，未购买可留空。</div>
                          {details.insuranceAttachments?.length ? (
                            <div className="text-[11px] text-slate-500">
                              {details.insuranceAttachments.map(a => a.name).join(', ')}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="rounded-xl bg-white border border-slate-200 p-3 space-y-3">
                        <div className="text-xs font-semibold text-slate-700">步骤 2/2 · 费用与票据</div>
                        <div className="text-[11px] text-slate-500">
                          每条非零费用必须上传票据（演示版仅保存文件元数据）。
                        </div>

                        <div className="space-y-2">
                          {lines.map(line => (
                            <div key={line.key} className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs text-slate-600 truncate">{line.label}</div>
                                </div>
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  className="w-28 bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                  value={Number(line.amount) || 0}
                                  onChange={(e) => {
                                    updateActualLine(order.id, line.key, line.label, Number(e.target.value));
                                    setValidationError(null);
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeActualLine(order.id, line.key)}
                                  className="p-2 rounded-xl hover:bg-slate-200/70 text-slate-600"
                                  aria-label="移除费用项"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <input
                                type="file"
                                multiple
                                className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-900 file:shadow-sm"
                                onChange={(e) => {
                                  updateLineAttachments(order.id, line.key, toReceiptAttachments(e.target.files));
                                  setValidationError(null);
                                }}
                              />
                              {line.attachments?.length ? (
                                <div className="text-[11px] text-slate-500">
                                  {line.attachments.map(a => a.name).join(', ')}
                                </div>
                              ) : (
                                <div className="text-[11px] text-rose-600">必须上传票据。</div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 space-y-2">
                          <div className="text-xs font-semibold text-slate-700">新增额外收费项目</div>
                          <input
                            type="text"
                            placeholder="项目名称（例如：过路费/额外停靠/小费）"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            value={lineDraft.label}
                            onChange={(e) => setLineDraft(d => ({ ...d, label: e.target.value }))}
                          />
                          <div className="flex gap-2">
                            <input
                              type="number"
                              inputMode="numeric"
                              placeholder="金额"
                              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                              value={lineDraft.amount}
                              onChange={(e) => setLineDraft(d => ({ ...d, amount: e.target.value }))}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const label = lineDraft.label.trim();
                                const amount = Number(lineDraft.amount);
                                if (!label || !Number.isFinite(amount) || amount === 0) {
                                  setValidationError('额外收费项目需要填写名称和非零金额。');
                                  return;
                                }
                                if (!lineDraftFiles.length) {
                                  setValidationError('额外收费项目必须上传票据。');
                                  return;
                                }
                                const key = `extra-${Date.now().toString(36)}`;
                                const existing = loadOrderActual(order.id);
                                const nextLines = [...(existing?.lines || lines), { key, label, amount, attachments: lineDraftFiles }];
                                saveOrderActual(order.id, { lines: nextLines, notes: existing?.notes });
                                setLineDraft({ label: '', amount: '' });
                                setLineDraftFiles([]);
                                setValidationError(null);
                                setRefreshKey(k => k + 1);
                              }}
                              className="h-12 px-3 rounded-xl bg-slate-900 text-white font-semibold shadow-sm active:scale-95 transition-all flex items-center gap-2"
                            >
                              <Plus size={16} />
                              添加
                            </button>
                          </div>
                          <input
                            type="file"
                            multiple
                            className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white file:shadow-sm"
                            onChange={(e) => setLineDraftFiles(toReceiptAttachments(e.target.files))}
                          />
                          {lineDraftFiles.length ? (
                            <div className="text-[11px] text-slate-500">{lineDraftFiles.map(a => a.name).join(', ')}</div>
                          ) : (
                            <div className="text-[11px] text-rose-600">额外收费项目必须上传票据。</div>
                          )}
                        </div>
                      </div>

                      {validationError && (
                        <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-700">
                          {validationError}
                        </div>
                      )}

                      <button
                        onClick={() => {
                          if (!validateReceipts(lines)) {
                            setValidationError('请为每条非零费用上传票据后再保存。');
                            return;
                          }
                          saveOrderActual(order.id, { lines, details, notes: actual?.notes });
                          setRefreshKey(k => k + 1);
                        }}
                        className={`w-full h-10 rounded-xl text-white font-semibold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 ${
                          receiptsOk ? 'bg-blue-600' : 'bg-slate-300 cursor-not-allowed'
                        }`}
                        disabled={!receiptsOk}
                      >
                        <Save size={16} />
                        保存实际录入
                      </button>
                      <div className="text-[11px] text-slate-500">
                        实际费用代表服务完成后的真实成本（酒店/用车/用餐票据等），月度对账单汇总实际总额。
                      </div>
                    </div>
                  )}
                  {expanded && !canRecordActual && (
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
                      当前为“{serviceStatusLabel(serviceStatus)}”状态，服务完成后才可录入实际费用与票据。
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default AdminBilling;
