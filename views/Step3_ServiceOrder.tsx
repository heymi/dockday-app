import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GripVertical, AlertTriangle, Music2, Clock, Check, MapPin, Trash2, MessageSquare } from 'lucide-react';
import { BookingState, ServiceItem, CityPoint } from '../types';

interface Props {
  data: BookingState;
  update: (fields: Partial<BookingState>) => void;
}

const LOUNGE_PRESETS = [
  { label: '3 hours', hours: 3 },
  { label: '4 hours', hours: 4 },
  { label: '5 hours', hours: 5 },
  { label: 'Full trip', hours: 8 },
];
const WARNING_THRESHOLD_MIN = 420; // 7 hours
const BASE_AVAILABLE_MIN = 8 * 60 - 90; // 8h - 1.5h transit

type CombinedItem = {
  kind: 'SERVICE' | 'CITY';
  id: string;
  title: string;
  subtitle?: string;
  durationMinutes: number;
  price: number;
  icon: React.ReactNode;
};

const Step3_ServiceOrder: React.FC<Props> = ({ data, update }) => {
  const [dragId, setDragId] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<{ id: string; x: number; y: number } | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [overTrash, setOverTrash] = useState(false);
  const trashRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const selectedServices = useMemo(
    () => data.services.filter(s => s.selected && s.type !== 'CORE' && s.id !== 'addon-ext'),
    [data.services]
  );
  const selectedCities = useMemo(() => data.itinerary.filter(p => p.selected), [data.itinerary]);
  const serviceExtensionHours = useMemo(() => {
    const ext = data.services.find(s => s.id === 'addon-ext' && s.selected && s.selectedVariantId);
    if (!ext || !ext.variants) return 0;
    const v = ext.variants.find(va => va.id === ext.selectedVariantId);
    if (!v) return 0;
    if (v.id === 'ext-2h') return 2;
    if (v.id === 'ext-4h') return 4;
    return 0;
  }, [data.services]);

  const combinedItems = useMemo(() => {
    const serviceItems = selectedServices.map(s => ({
      kind: 'SERVICE' as const,
      id: s.id,
      title: s.title,
      subtitle: s.description,
      durationMinutes: s.id === 'addon-lounge' ? data.customLoungeDurationHours * 60 : (s.baseDurationMinutes || 0),
      price: s.price,
      icon: s.id === 'addon-lounge' ? <Music2 size={16} /> : <GripVertical size={16} />
    }));
    const cityItems = selectedCities.map(c => ({
      kind: 'CITY' as const,
      id: `city-${c.id}`,
      title: c.name,
      subtitle: c.type,
      durationMinutes: c.duration,
      price: 0,
      icon: <MapPin size={16} />
    }));
    return [...serviceItems, ...cityItems];
  }, [selectedServices, selectedCities, data.customLoungeDurationHours]);

  const smartOrder = useCallback((items: CombinedItem[]) => {
    const priority = (item: CombinedItem) => {
      if (item.kind === 'SERVICE') {
        const id = item.id;
        if (id.includes('meal') || id.includes('banquet')) return 1; // 吃饭最先
        if (id.includes('spa')) return 3; // 按摩/SPA
        if (id.includes('lounge')) return 5; // 喝酒最后
      } else if (item.kind === 'CITY') {
        const typeText = item.subtitle?.toLowerCase() || '';
        if (typeText.includes('food')) return 1;
        if (typeText.includes('shopping') || typeText.includes('entertainment')) return 2; // 商场/娱乐归入购物段
      }
      // 购物默认在吃饭后，SPA 前
      return 4; // 其它在 SPA 之后、喝酒之前
    };
    return [...items].sort((a, b) => priority(a) - priority(b)).map(i => i.id);
  }, []);

  // sync serviceOrder to include all items (services + cities)
  useEffect(() => {
    const ids = combinedItems.map(item => item.id);
    const order = data.serviceOrder.filter(id => ids.includes(id));
    ids.forEach(id => {
      if (!order.includes(id)) order.push(id);
    });
    if (order.length === 0 || order.join(',') !== data.serviceOrder.join(',')) {
      update({ serviceOrder: order.length ? order : smartOrder(combinedItems) });
    }
  }, [combinedItems, data.serviceOrder, smartOrder, update]);

  const orderedItems = useMemo(() => {
    const map = new Map(combinedItems.map(item => [item.id, item]));
    const list = data.serviceOrder
      .map(id => map.get(id))
      .filter(Boolean) as typeof combinedItems;
    // append any missing
    combinedItems.forEach(item => {
      if (!list.find(x => x.id === item.id)) list.push(item);
    });
    return list;
  }, [combinedItems, data.serviceOrder]);

  const loungeDuration = data.customLoungeDurationHours || 3;

  const computeTotalMinutes = () => {
    return orderedItems.reduce((acc, item) => acc + (item.durationMinutes || 0), 0);
  };

  const totalMinutes = computeTotalMinutes();
  const availableMinutes = BASE_AVAILABLE_MIN + serviceExtensionHours * 60;
  const usageRatio = Math.min(totalMinutes / Math.max(availableMinutes, 1), 1.2);
  const usageColor =
    usageRatio >= 0.95 ? 'bg-red-500' : usageRatio >= 0.85 ? 'bg-amber-400' : 'bg-green-500';
  const usageLabel =
    usageRatio >= 0.95 ? 'Critical 😱' : usageRatio >= 0.85 ? 'Tight 😬' : 'Plenty 🙂';

  const handleDragStart = (id: string) => {
    setDragId(id);
    setDragging(true);
    setOverTrash(false);
  };
  const handleDragOver = (id: string) => setDragOverId(id);
  const handleDrop = (id: string) => {
    if (!dragId || dragId === id) return;
    if (overTrash) {
      const item = orderedItems.find(i => i.id === dragId);
      if (item) removeItem(item);
      setDragging(false);
      setOverTrash(false);
      setDragId(null);
      setDragOverId(null);
      return;
    }
    const newOrder = [...orderedItems.map(item => item.id)];
    const from = newOrder.indexOf(dragId);
    const to = newOrder.indexOf(id);
    if (from === -1 || to === -1) return;
    newOrder.splice(from, 1);
    newOrder.splice(to, 0, dragId);
    update({ serviceOrder: newOrder });
    setDragId(null);
    setDragOverId(null);
    setDragging(false);
    setOverTrash(false);
  };

  const handleLoungeChange = (val: number) => {
    update({ customLoungeDurationHours: val });
  };

  const removeItem = (item: CombinedItem) => {
    if (item.kind === 'CITY') {
      const updatedItinerary = data.itinerary.map(c =>
        `city-${c.id}` === item.id ? { ...c, selected: false } : c
      );
      const order = data.serviceOrder.filter(id => id !== item.id);
      update({ itinerary: updatedItinerary, serviceOrder: order });
      return;
    }
    // SERVICE
    if (item.price > 0) {
      const ok = window.confirm('Delete this paid service?');
      if (!ok) return;
    }
    const updatedServices = data.services.map(s =>
      s.id === item.id ? { ...s, selected: false, selectedVariantId: undefined } : s
    );
    const order = data.serviceOrder.filter(id => id !== item.id);
    update({ services: updatedServices, serviceOrder: order });
  };

  useEffect(() => {
    if (data.customLoungeDurationHours >= 8) {
      const hasOthers = orderedItems.some(item => item.id !== 'addon-lounge');
      if (hasOthers) {
        const ok = window.confirm('已选择包间全程，需移除其他服务项目。确认继续吗？');
        if (ok) {
          const updatedServices = data.services.map(s =>
            s.id !== 'addon-lounge' ? { ...s, selected: false, selectedVariantId: undefined } : s
          );
          const updatedItinerary = data.itinerary.map(c => ({ ...c, selected: false }));
          update({
            services: updatedServices,
            itinerary: updatedItinerary,
            serviceOrder: ['addon-lounge']
          });
        } else {
          update({ customLoungeDurationHours: 5 });
        }
      }
    }
  }, [data.customLoungeDurationHours, orderedItems, data.services, data.itinerary, update]);

  const handleTouchStart = (id: string, clientX: number, clientY: number) => {
    setTouchStart({ id, x: clientX, y: clientY });
    setDragId(id);
    setDragOverId(id);
    setDragging(true);
  };

  const handleTouchMove = (clientX: number, clientY: number) => {
    if (!touchStart) return;
    const deltaX = touchStart.x - clientX;
    const deltaY = Math.abs(touchStart.y - clientY);

    // swipe to delete (with confirm for paid services)
    if (deltaX > 60 && deltaX > deltaY) {
      const item = orderedItems.find(i => i.id === touchStart.id);
      if (item) {
        if (item.kind === 'SERVICE' && item.price > 0) {
          const ok = window.confirm('Delete this paid service?');
          if (!ok) {
            setTouchStart(null);
            setDragId(null);
            setDragging(false);
            setOverTrash(false);
            return;
          }
        }
        removeItem(item);
      }
      setTouchStart(null);
      setDragId(null);
      setDragging(false);
      setOverTrash(false);
      return;
    }

    // reorder: find nearest item by Y
    let nearestId: string | null = null;
    let nearestDist = Number.MAX_VALUE;
    Object.entries(itemRefs.current).forEach(([id, el]) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const dist = Math.abs(centerY - clientY);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestId = id;
      }
    });
    if (nearestId) setDragOverId(nearestId);

    // check trash hit for touch
    if (trashRef.current) {
      const rect = trashRef.current.getBoundingClientRect();
      const within =
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom;
      setOverTrash(within);
    }
  };

  const handleTouchEnd = () => {
    if (overTrash && dragId) {
      const item = orderedItems.find(i => i.id === dragId);
      if (item) removeItem(item);
      setOverTrash(false);
      setDragId(null);
      setDragOverId(null);
      setDragging(false);
      setTouchStart(null);
      return;
    }

    if (dragId && dragOverId && dragId !== dragOverId) {
      handleDrop(dragOverId);
    } else {
      setDragId(null);
      setDragOverId(null);
      setDragging(false);
      setOverTrash(false);
    }
    setTouchStart(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Plan Service Order</h2>
        <p className="text-slate-500 text-sm">Drag to reorder services. Lounge duration can be adjusted (up to 6 hours).</p>
        <button
          type="button"
          onClick={() => update({ serviceOrder: smartOrder(combinedItems) })}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
        >
          Smart Sort
        </button>
        <div className="bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Available time</span>
            <div className="text-right">
              <div className="text-base font-bold text-blue-700">{(availableMinutes / 60).toFixed(1)} h</div>
              <div className="text-[11px] text-slate-400">
                8h - 1.5h transit {serviceExtensionHours > 0 ? `+ ${serviceExtensionHours}h extension` : ''}
              </div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[11px] text-slate-500 mb-1">
              <span>Current: {(totalMinutes / 60).toFixed(1)}h</span>
              <span className="font-semibold text-slate-700">{usageLabel}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${usageColor}`}
                style={{ width: `${Math.min(usageRatio * 100, 120)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {usageRatio >= 0.95 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle size={18} className="mt-0.5" />
          <p className="text-xs leading-relaxed">
            Current schedule is too tight. Remove or shorten services to avoid extra overtime fees.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {orderedItems.map((item, idx) => (
          <div
            key={item.id}
            draggable
            ref={(el) => { itemRefs.current[item.id] = el; }}
            onDragStart={() => handleDragStart(item.id)}
            onDragOver={(e) => {
              e.preventDefault();
              handleDragOver(item.id);
            }}
            onDrop={() => handleDrop(item.id)}
            onDragEnd={() => {
              if (overTrash && dragId) {
                const target = orderedItems.find(i => i.id === dragId);
                if (target) removeItem(target);
              }
              setDragId(null);
              setDragging(false);
              setOverTrash(false);
            }}
            onTouchStart={(e) => handleTouchStart(item.id, e.touches[0].clientX, e.touches[0].clientY)}
            onTouchMove={(e) => {
              e.preventDefault();
              handleTouchMove(e.touches[0].clientX, e.touches[0].clientY);
            }}
            onTouchEnd={handleTouchEnd}
            className={`bg-white border rounded-2xl p-3 flex items-start gap-3 shadow-sm cursor-grab active:cursor-grabbing transition-all ${
              dragId === item.id
                ? 'border-blue-400 shadow-blue-100 ring-2 ring-blue-100'
                : dragOverId === item.id
                  ? 'border-blue-200 bg-blue-50/30'
                  : 'border-slate-200'
            }`}
            onDragEnter={(e) => {
              e.preventDefault();
              handleDragOver(item.id);
            }}
            style={dragging ? { touchAction: 'none' } : undefined}
          >
            <div className="flex flex-col items-center gap-2 pt-1 text-slate-400 min-w-[28px]">
              <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center">
                {idx + 1}
              </div>
              <GripVertical size={18} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 text-sm">{item.title}</h3>
                  {item.durationMinutes ? (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {`${Math.round((item.durationMinutes / 60) * 10) / 10}h`}
                    </span>
                  ) : null}
                </div>
                {item.price > 0 && <span className="text-sm font-bold text-slate-900">${item.price.toFixed(2)}</span>}
              </div>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.subtitle}</p>

              {item.id === 'addon-lounge' && (
                <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Music2 size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Lounge duration</span>
                      <span>{loungeDuration} hours</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {LOUNGE_PRESETS.map(preset => {
                        const active = loungeDuration === preset.hours;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleLoungeChange(preset.hours); }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            className={`px-3 py-1 rounded-xl text-sm font-semibold border transition ${
                              active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-200'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Full trip = straight from port to lounge, return directly.</div>
              </div>
            </div>
          )}
            </div>
          </div>
        ))}
      </div>

      {/* Special Requests / Notes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-blue-600" />
          <h3 className="font-semibold text-slate-900 text-sm">Special Requests / Notes</h3>
        </div>
        <textarea
          placeholder="Share allergies, dietary needs, pickup notes, or other special requests..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all min-h-[90px] resize-none text-sm leading-relaxed"
          value={data.notes}
          onChange={(e) => update({ notes: e.target.value })}
        />
      </div>
      {dragging && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
          <div
            ref={trashRef}
            className={`w-14 h-14 rounded-full border-2 flex items-center justify-center shadow-lg transition-all ${
              overTrash ? 'bg-red-100 border-red-400 text-red-600 scale-110' : 'bg-white border-slate-300 text-slate-500'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setOverTrash(true);
            }}
            onDragLeave={() => setOverTrash(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOverTrash(true);
              if (dragId) {
                const item = orderedItems.find(i => i.id === dragId);
                if (item) removeItem(item);
              }
              setDragging(false);
              setDragId(null);
              setDragOverId(null);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              setOverTrash(true);
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              setOverTrash(true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              if (dragId) {
                const item = orderedItems.find(i => i.id === dragId);
                if (item) removeItem(item);
              }
              setDragging(false);
              setOverTrash(false);
              setDragId(null);
              setDragOverId(null);
            }}
          >
            <Trash2 size={24} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Step3_ServiceOrder;
