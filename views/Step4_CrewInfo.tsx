
import React from 'react';
import { Camera, ShieldCheck, User, CreditCard, Lock, MessageSquare } from 'lucide-react';
import { BookingState } from '../types';

interface Props {
  data: BookingState;
  update: (fields: Partial<BookingState>) => void;
}

const Step4_CrewInfo: React.FC<Props> = ({ data, update }) => {
  return (
    <div className="space-y-6 animate-fadeIn pb-24">
       <div className="space-y-2">
        <div className="flex items-center gap-2">
             <h2 className="text-2xl font-bold text-slate-900">Crew Information</h2>
             <ShieldCheck size={24} className="text-green-500" />
        </div>
        <p className="text-slate-500 text-sm">Border control requires valid crew details for shore leave processing.</p>
      </div>

      {/* Security Banner */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
        <Lock size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
            Your data is encrypted and sent directly to the Immigration Authority. DockDay does not store passport images permanently.
        </p>
      </div>

      {/* Photo Upload - The "Main Event" */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 border-dashed text-center space-y-4 hover:bg-slate-50 transition-colors cursor-pointer group">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto group-hover:bg-blue-100 transition-colors">
            <Camera size={32} className="text-blue-600" />
        </div>
        <div>
            <h3 className="font-semibold text-slate-900">Upload Seafarer ID</h3>
            <p className="text-xs text-slate-400 mt-1">Clear face photo against plain background (Max 5MB)</p>
        </div>
        <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm">
            Choose File
        </button>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 ml-1">Legal Full Name</label>
            <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Enter your name as on passport"
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    value={data.crewName}
                    onChange={(e) => update({ crewName: e.target.value })}
                />
            </div>
        </div>

        <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 ml-1">Crew Certificate Number</label>
            <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="e.g. C12345678"
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    value={data.passportNumber}
                    onChange={(e) => update({ passportNumber: e.target.value })}
                />
            </div>
        </div>
      </div>

    </div>
  );
};

export default Step4_CrewInfo;
