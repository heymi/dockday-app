import React, { useMemo } from 'react';
import { Calendar, Anchor, Ship, Info, MapPin, ListChecks, CreditCard, StickyNote, Clock, Users, ChevronRight, X, ShieldCheck } from 'lucide-react';
import { BookingState } from '../types';

interface Props {
  data: BookingState;
  showTimeline: boolean;
  setShowTimeline: (val: boolean) => void;
}

const Step4_Review: React.FC<Props> = ({ data, showTimeline, setShowTimeline }) => {
  const isTripPackage = data.selectedPackageId === 'trip';
  const tripBaseRate = 15;
  const tripHoldAmount = 200;
  const selectedServices = data.services.filter(s => s.selected && (!isTripPackage || s.type !== 'CORE'));
  const selectedCities = data.itinerary.filter(c => c.selected);
  const servicesTotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const perPerson = data.isSplitBill && data.groupSize > 0 ? servicesTotal / data.groupSize : servicesTotal;

  const startDate = useMemo(() => {
    if (data.date) {
      const d = new Date(data.date);
      if (!Number.isNaN(d.getTime())) return d;
    }
    const today = new Date();
    today.setHours(9, 0, 0, 0);
    return today;
  }, [data.date]);

  const timelineItems = useMemo(() => {
    const serviceMap = new Map(data.services.map(s => [s.id, s]));
    const cityMap = new Map(data.itinerary.map(c => [c.id, c]));
    const order = data.serviceOrder || [];
    let cursor = new Date(startDate);

    const items = order.map(id => {
      if (id.startsWith('city-')) {
        const cityId = id.replace('city-', '');
        const city = cityMap.get(cityId);
        if (!city || !city.selected) return null;
        const duration = city.duration || 60;
        const start = new Date(cursor);
        const end = new Date(cursor.getTime() + duration * 60000);
        cursor = end;
        return {
          id,
          title: city.name,
          kind: 'City',
          duration,
          start,
          end
        };
      }
      const svc = serviceMap.get(id);
      if (!svc || !svc.selected) return null;
      const duration = svc.baseDurationMinutes || 60;
      const start = new Date(cursor);
      const end = new Date(cursor.getTime() + duration * 60000);
      cursor = end;
      return {
        id,
        title: svc.title,
        kind: 'Service',
        duration,
        start,
        end
      };
    }).filter(Boolean) as {
      id: string;
      title: string;
      kind: string;
      duration: number;
      start: Date;
      end: Date;
    }[];

    // Add return-to-port block (30 min)
    const endTime = items.length ? items[items.length - 1].end : startDate;
    const backToPortStart = new Date(endTime);
    const backToPortEnd = new Date(backToPortStart.getTime() + 30 * 60000);
    const timelineWithPort = [
      {
        id: 'port-pickup',
        title: 'Port pickup',
        kind: 'Transport',
        duration: 40,
        start: new Date(startDate),
        end: new Date(startDate.getTime() + 40 * 60000),
      },
      ...items,
      {
        id: 'port-return',
        title: 'Return to port',
        kind: 'Transport',
        duration: 30,
        start: backToPortStart,
        end: backToPortEnd,
      }
    ];
    return { items: timelineWithPort, endTime: backToPortEnd };
  }, [data.services, data.itinerary, data.serviceOrder, startDate]);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (showTimeline) {
    return (
      <div className="space-y-4 animate-fadeIn pb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">Port pickup</div>
            <div className="font-semibold text-slate-900 text-lg">{formatTime(startDate)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Back to ship</div>
            <div className="font-semibold text-slate-900 text-lg">{formatTime(timelineItems.endTime)}</div>
          </div>
          <button
            className="p-2 rounded-full hover:bg-slate-100"
            onClick={() => setShowTimeline(false)}
            aria-label="Back"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <div className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold">
            {timelineItems.items.reduce((acc, i) => acc + i.duration, 0)} min total
          </div>
          <div className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">
            {timelineItems.items.length} stops
          </div>
        </div>

        <div className="space-y-4">
          {timelineItems.items.length ? (
            timelineItems.items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="flex flex-col items-end w-20 text-xs text-slate-500 pt-1">
                  <div className="font-semibold text-slate-900">{formatTime(item.start)}</div>
                  <div className="text-slate-400">{formatTime(item.end)}</div>
                </div>
                <div className="relative flex-1 pl-4">
                  <div className="absolute left-1 top-0 bottom-0 w-px bg-gradient-to-b from-blue-200 via-slate-200 to-blue-200" />
                  <div className="relative bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                    <div className="absolute -left-2 top-4 w-4 h-4 rounded-full border-2 border-white bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.12)]" />
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                        {item.kind}
                      </span>
                      <span className="text-xs text-slate-500">{Math.round(item.duration)} min</span>
                    </div>
                    <div className="mt-1 font-semibold text-slate-900 leading-snug">{item.title}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-400 text-sm py-6">No services arranged.</div>
          )}
        </div>

        <div className="mt-4 space-y-3 text-sm text-slate-600 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="font-semibold text-slate-900">Important Notes</div>
          <ul className="list-disc pl-4 space-y-2">
            <li>Paid services go first; optional self-pay stops are added only if time remains.</li>
            <li>Please bring passport and seafarer book for disembarkation checks.</li>
            <li>Be back at port before curfew; schedule may adjust based on port/immigration conditions.</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-28">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Review & Confirm</h2>
        <p className="text-slate-500 text-sm">Double-check your details before payment.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100">
        <div className="p-4 flex items-start gap-3">
          <Calendar className="text-blue-600" size={18} />
          <div className="flex-1">
            <div className="text-sm text-slate-500">Disembark Time</div>
            <div className="font-semibold text-slate-900">{data.date ? new Date(data.date).toLocaleString() : 'Not set'}</div>
          </div>
        </div>
        <div className="p-4 flex items-start gap-3">
          <Anchor className="text-blue-600" size={18} />
          <div className="flex-1">
            <div className="text-sm text-slate-500">Port</div>
            <div className="font-semibold text-slate-900">{data.port || 'Not set'}</div>
          </div>
        </div>
        <div className="p-4 flex items-start gap-3">
          <Ship className="text-blue-600" size={18} />
          <div className="flex-1">
            <div className="text-sm text-slate-500">Vessel Name</div>
            <div className="font-semibold text-slate-900">{data.vesselName || 'Not provided'}</div>
          </div>
        </div>
        <div className="p-4 flex items-start gap-3">
          <Info className="text-blue-600" size={18} />
          <div className="flex-1">
            <div className="text-sm text-slate-500">MMSI</div>
            <div className="font-semibold text-slate-900">{data.mmsi || 'Not provided'}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ListChecks size={18} className="text-blue-600" />
          <h3 className="font-semibold text-slate-900 text-sm">Selected Services</h3>
        </div>
        <div className="space-y-2 text-sm">
          {selectedServices.length ? (
            selectedServices.map(s => (
              <div key={s.id} className="flex justify-between text-slate-700">
                <span className="truncate">{s.title}</span>
                <span className="font-semibold text-slate-900">${s.price.toFixed(2)}</span>
              </div>
            ))
          ) : (
            <div className="text-slate-400">No add-ons selected.</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-blue-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Service Timeline</h3>
          </div>
          <button
            className="text-xs text-blue-600 font-semibold flex items-center gap-1"
            onClick={() => setShowTimeline(true)}
          >
            View schedule <ChevronRight size={14} />
          </button>
        </div>
        {timelineItems.items.length ? (
          <div className="space-y-2 text-sm">
            {timelineItems.items.slice(0, 3).map(item => (
              <div key={item.id} className="flex justify-between text-slate-700">
                <span className="truncate max-w-[62%]">{item.title}</span>
                <span className="text-slate-500">{formatTime(item.start)}</span>
              </div>
            ))}
            {timelineItems.items.length > 3 && (
              <div className="text-xs text-slate-500">+ {timelineItems.items.length - 3} more</div>
            )}
          </div>
        ) : (
          <div className="text-slate-400 text-sm">No services arranged.</div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-blue-600" />
          <h3 className="font-semibold text-slate-900 text-sm">Plan Your Route</h3>
        </div>
        <div className="space-y-2 text-sm">
          {selectedCities.length ? (
            selectedCities.map(c => (
              <div key={c.id} className="flex justify-between text-slate-700">
                <span>{c.name}</span>
                <span className="text-slate-500 flex items-center gap-1"><Clock size={12} />{c.duration} min</span>
              </div>
            ))
          ) : (
            <div className="text-slate-400">No stops selected.</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2">
          <StickyNote size={18} className="text-blue-600" />
          <h3 className="font-semibold text-slate-900 text-sm">Special Requests / Notes</h3>
        </div>
        <p className="text-sm text-slate-700 whitespace-pre-line">{data.notes || 'None'}</p>
      </div>

      <div className={`rounded-2xl border shadow-sm p-4 space-y-2 ${isTripPackage ? 'bg-emerald-50/60 border-emerald-200' : 'bg-white border-slate-100'}`}>
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className={isTripPackage ? 'text-emerald-600' : 'text-blue-600'} />
          <h3 className="font-semibold text-slate-900 text-sm">Package & Settlement Rules</h3>
        </div>
        {isTripPackage ? (
          <div className="text-sm text-slate-700 space-y-2">
            <div className="font-semibold text-slate-900">Point-to-Point Metered</div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded-full bg-white text-emerald-700 border border-emerald-200 font-semibold">From $15 / trip</span>
              <span className="px-2 py-1 rounded-full bg-white text-emerald-700 border border-emerald-200 font-semibold">Up to 30 km each trip</span>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-white p-3 space-y-1">
              <div className="font-semibold text-slate-900 text-xs uppercase tracking-wide">Settlement Rules</div>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• $15 per one-way trip, each trip capped at 30 km.</li>
                <li>• Extra destinations are charged as new trips at the same rate.</li>
                <li>• $200 pre-authorization or offline deposit is required.</li>
                <li>• Final charges are settled after the service ends.</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-600">
            {data.selectedPackageId === '4h'
              ? '4-Hour Express'
              : data.selectedPackageId === '8h'
              ? '8-Hour Full Service Deluxe'
              : 'Package not selected'}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <CreditCard size={16} className="text-blue-600" />
            Payment Summary
          </div>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Users size={14} /> {data.groupSize} {data.groupSize > 1 ? 'people' : 'person'}
          </span>
        </div>
        <div className="space-y-2 text-sm">
          {selectedServices.map(s => (
            <div key={s.id} className="flex justify-between text-slate-700">
              <span className="truncate">{s.title}</span>
              <span className="font-semibold">${s.price.toFixed(2)}</span>
            </div>
          ))}
          {isTripPackage ? (
            <div className="border-t border-slate-100 pt-2 text-slate-600 space-y-1">
              <div className="flex justify-between text-slate-900 font-bold">
                <span>Transport fee</span>
                <span>From ${tripBaseRate}/trip</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Pre-authorization hold</span>
                <span className="font-semibold text-slate-900">${tripHoldAmount}</span>
              </div>
              <div className="text-xs text-slate-500">Final charge is settled after service completion.</div>
            </div>
          ) : (
            <>
              <div className="border-t border-slate-100 pt-2 flex justify-between text-slate-900 font-bold">
                <span>Total</span>
                <span>${servicesTotal.toFixed(2)}</span>
              </div>
              {data.isSplitBill && (
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Per person</span>
                  <span className="font-semibold text-slate-900">${perPerson.toFixed(2)}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step4_Review;
