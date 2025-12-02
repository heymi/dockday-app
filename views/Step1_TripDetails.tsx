import React, { useRef, useState } from 'react';
import { Calendar, Anchor, Ship, Info, Car, Languages, ShieldCheck, BadgeCheck, Shield, Wallet, Users, Wifi, Martini, Infinity, MessageSquare } from 'lucide-react';
import { BookingState, PORTS } from '../types';

interface Props {
  data: BookingState;
  update: (fields: Partial<BookingState>) => void;
}

const Step1_TripDetails: React.FC<Props> = ({ data, update }) => {
  const coreService = data.services.find(s => s.id === 'core-8h');
  const detailsRef = useRef<HTMLDivElement | null>(null);
  const [openDetail, setOpenDetail] = useState<number | null>(null);
  const coreFeatures = [
    { label: 'Private Business Van', icon: Car },
    { label: 'Bilingual Escort & Translation', icon: Languages },
    { label: 'Included Accident Insurance', icon: ShieldCheck },
    { label: 'Free Shore Pass Processing', icon: BadgeCheck },
    { label: 'Fast-Track Border Inspection', icon: Shield },
    { label: 'Transparent Pricing', icon: Wallet },
    { label: 'Group Split Payment', icon: Users },
    { label: 'In-Car High-Speed Wi-Fi', icon: Wifi },
    { label: 'Optional Lounge, Dining & Spa', icon: Martini },
    { label: 'Essential Daily Supplies Stop', icon: Infinity },
    { label: 'Border inspection available until 24:00, with smooth and delay-free processing', icon: ShieldCheck, fullWidth: true },
  ];

  const serviceDetails = [
    {
      title: 'Transportation',
      body: 'Vehicle type (van or sedan) is arranged based on group size. All vehicles are provided by licensed service partners with full insurance.'
    },
    {
      title: 'Translation',
      body: 'Bilingual escort offers basic English/Chinese interpretation for border inspection and simple arrangements. No personal errands or services beyond assigned duties.'
    },
    {
      title: '8-Hour Service',
      body: 'The 8-hour duration covers the entire trip from port pickup to return. • First 1 hour of overtime is free • More time requires purchasing the "Extra Hours" add-on'
    },
    {
      title: 'Insurance',
      body: 'DockDay provides PICC accident insurance covering accidental injury/death, emergency medical costs, and evacuation. Crew must email passport details directly to the insurer after booking. DockDay does not handle or store passport images. View full policy (PDF)'
    },
    {
      title: 'Medical Escort',
      body: 'Provides basic clinic translation only. For full medical visits, please book a separate medical service. Medical expenses are self-paid.'
    },
    {
      title: 'Return-to-Vessel',
      body: 'Crew must return to the port before 24:00 (midnight) per border regulations. Timing may adjust based on immigration and port conditions.'
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Let's start your shore leave</h2>
        <p className="text-slate-500 text-sm">See what's included, then fill in your arrival details to check availability.</p>
      </div>

      {/* Core Service Overview */}
      {coreService && (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl text-white p-5 shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Car size={100} />
          </div>
          <div className="relative z-10 space-y-2">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="bg-blue-500/20 text-blue-200 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider inline-flex w-fit">
                  Included Service
                </span>
              </div>
              <div className="text-right leading-tight">
                <div className="text-2xl font-bold text-white">${coreService.price}</div>
                <div className="text-[11px] text-white/80 font-medium">$99.75 / person</div>
              </div>
            </div>
            <h3 className="text-xl font-bold">{coreService.title}</h3>
            <p className="text-slate-200/90 text-sm leading-relaxed">
              {coreService.description}
              <button
                type="button"
                onClick={() => detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="ml-2 text-[11px] text-blue-200 underline underline-offset-4 decoration-white/40 hover:text-white transition-colors"
              >
                More details
              </button>
            </p>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {coreFeatures.map((item, i) => {
                const highlight = i < 6;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm shadow-sm ${item.fullWidth ? 'col-span-2' : ''} ${
                      highlight
                        ? 'bg-blue-500/15 border border-blue-200 text-white shadow-blue-900/20'
                        : 'bg-white/10 border border-white/10 text-white/90'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${highlight ? 'bg-blue-500/30' : 'bg-white/15'} text-white`}>
                      <item.icon size={18} />
                    </div>
                    <span className="leading-snug">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Date & Time */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Calendar size={16} className="text-blue-600" />
          Disembark Time
        </label>
        <input
          type="datetime-local"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          value={data.date}
          onChange={(e) => update({ date: e.target.value })}
        />
      </div>

      {/* Port Selection */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Anchor size={16} className="text-blue-600" />
          Select Port
        </label>
        <div className="relative">
          <select
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-slate-900 font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={data.port}
            onChange={(e) => update({ port: e.target.value })}
          >
            <option value="" disabled>Choose a port area...</option>
            {PORTS.map(port => (
              <option key={port} value={port}>{port}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>

      {/* MMSI */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Info size={16} className="text-blue-600" />
          MMSI <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="9-digit Maritime Mobile Service Identity"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          value={data.mmsi}
          onChange={(e) => update({ mmsi: e.target.value.replace(/[^0-9]/g, '') })}
        />
      </div>

      {/* Vessel Name */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Ship size={16} className="text-blue-600" />
            Vessel Name
          </label>
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">Optional</span>
        </div>
        <input
          type="text"
          placeholder="e.g., MSC Aurora"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          value={data.vesselName}
          onChange={(e) => update({ vesselName: e.target.value })}
        />
      </div>

      {/* Service Details */}
      <div ref={detailsRef} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-800">Service Details</h3>
          </div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">Tap to expand</span>
        </div>
        <div className="divide-y divide-slate-100">
          {serviceDetails.map((item, idx) => {
            const isOpen = openDetail === idx;
            return (
              <div key={item.title}>
                <button
                  type="button"
                  onClick={() => setOpenDetail(prev => (prev === idx ? null : idx))}
                  className="w-full py-3 flex items-center justify-between text-left"
                >
                  <span className="text-sm font-semibold text-slate-800">{item.title}</span>
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="pb-3 text-sm text-slate-600 leading-relaxed">
                    {item.body.split('•').map((line, i) => (
                      <p key={i} className="mt-1 first:mt-0">
                        {line.trim()}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default Step1_TripDetails;
