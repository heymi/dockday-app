import React from 'react';
import { Calendar, Anchor, Ship, Info, MapPin, ListChecks, CreditCard, StickyNote, Clock, Users } from 'lucide-react';
import { BookingState } from '../types';

interface Props {
  data: BookingState;
}

const Step4_Review: React.FC<Props> = ({ data }) => {
  const selectedServices = data.services.filter(s => s.selected);
  const selectedCities = data.itinerary.filter(c => c.selected);
  const servicesTotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const perPerson = data.isSplitBill && data.groupSize > 0 ? servicesTotal / data.groupSize : servicesTotal;

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
        </div>
      </div>
    </div>
  );
};

export default Step4_Review;
