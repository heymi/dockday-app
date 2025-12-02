
import React, { useEffect } from 'react';
import { ShieldCheck, Lock, CreditCard, Users, ArrowRight, HelpCircle, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { BookingState } from '../types';

interface Props {
  data: BookingState;
  update: (fields: Partial<BookingState>) => void;
}

const Step5_Payment: React.FC<Props> = ({ data, update }) => {
    const corePrice = data.services.filter(s => s.selected).reduce((acc, curr) => acc + curr.price, 0);
    const total = corePrice;
    const maxGroupSize = 6; 
    const lowestPossible = total / maxGroupSize;
    const currentSplit = data.groupSize > 0 ? data.groupSize : 1;
    const currentPerPerson = data.isSplitBill ? total / currentSplit : total;
    const fiveSplit = total / 5;

  return (
    <div className="space-y-6 animate-fadeIn pb-32">
      
      {/* Header Section */}
      <div className="text-center space-y-2 mb-2">
        <h2 className="text-2xl font-bold text-slate-900">
            Confirm & Pay
        </h2>
        <p className="text-slate-500 text-sm">
            Choose how you would like to handle the payment.
        </p>
      </div>

      {/* Payment Method Toggle */}
      <div className="bg-slate-100 p-1 rounded-xl flex font-medium text-sm relative">
          <button 
            onClick={() => update({ isSplitBill: true })}
            className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all z-10 ${data.isSplitBill ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            aria-label="Travel with friends"
          >
            Travel with Friends
          </button>
          <button 
            onClick={() => update({ isSplitBill: false })}
            className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all z-10 ${!data.isSplitBill ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            aria-label="Travel solo"
          >
            Travel Solo
          </button>
      </div>

      {/* DYNAMIC PRICING VISUALIZATION (Only for Split Bill) */}
      {data.isSplitBill ? (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-slate-800">Full Van</span>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">1-5 pax</span>
          </div>

          {/* Price Tiers Visual for 1-5 ppl */}
          <div className="relative h-20 flex items-end justify-between px-2 pb-4 gap-2">
            {([1, 2, 3, 4, 5] as const).map(count => {
              const price = total / count;
              const height =
                count === 1 ? 40 :
                count === 2 ? 22 :
                count === 3 ? 18 :
                count === 4 ? 15 : 12;
              const isCurrent = currentSplit === count;
              const isFive = count === 5;
              const barColor = isFive
                ? 'bg-green-500'
                : isCurrent
                  ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                  : 'bg-slate-200';
              const textColor = isFive ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-slate-500';
              return (
                <div key={count} className="flex flex-col items-center gap-1 relative">
                  <div className="text-[10px] font-medium text-slate-500 mb-1">{count} pax</div>
                  <div className={`w-5 rounded-t-sm ${barColor}`} style={{ height }} />
                  <div className={`absolute bottom-0 text-xs font-bold ${textColor} transform translate-y-full pt-1`}>
                    ${price.toFixed(0)}
                  </div>
                  {/* removed group bubble */}
                </div>
              );
            })}
          </div>

          <div className="pt-6 flex gap-3 text-xs text-slate-500 leading-relaxed">
            <Users size={16} className="shrink-0 text-blue-500" />
            <p>Authorize your share now. Invite friends via link. The final charge happens only when you confirm the group.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm animate-fadeIn">
            <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                    <CheckCircle2 size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 text-sm">Simple One-Time Payment</h3>
                    <p className="text-xs text-slate-500 mt-0.5">You pay the total—perfect if you prefer to enjoy shore time solo with 1:1 VIP service.</p>
                </div>
            </div>
        </div>
      )}

      {/* AMOUNT CARD */}
      <div className={`rounded-2xl p-6 text-white text-center shadow-xl relative overflow-hidden transition-colors duration-300 ${data.isSplitBill ? 'bg-slate-900' : 'bg-blue-600 shadow-blue-200'}`}>
        {data.isSplitBill && (
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-green-400 to-blue-500"></div>
        )}
        
        <p className="text-white/60 text-xs font-medium uppercase tracking-wide mb-1">
            {data.isSplitBill ? 'Your Share (Pre-Auth Only)' : 'Total Amount'}
        </p>
        
        <div className="text-4xl font-bold mb-2 tracking-tight">
            USD {currentPerPerson.toFixed(2)}
        </div>

        {data.isSplitBill ? (
            <div className="mt-4 bg-white/10 backdrop-blur-md rounded-lg p-3 text-left border border-white/10">
                <div className="flex gap-2">
                    <AlertCircle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-white/90 leading-relaxed">
                        <span className="font-bold text-white">Funds held temporarily.</span> Amount adjusts down if more people join. Unused hold released instantly.
                    </p>
                </div>
            </div>
        ) : (
             <div className="inline-block bg-white/20 backdrop-blur rounded-full px-3 py-1 text-xs text-white/90">
                Full amount for {data.groupSize} people
            </div>
        )}
      </div>

      {/* HOW IT WORKS (Split Bill Only) */}
      {data.isSplitBill && (
          <div className="space-y-3 animate-fadeIn">
              <h3 className="font-semibold text-slate-900 text-sm">How Group Booking Works</h3>
              <div className="grid grid-cols-1 gap-3">
                  <div className="flex gap-3 items-center bg-white p-3 rounded-xl border border-slate-100">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">1</div>
                      <div className="text-xs text-slate-600">
                          <strong className="text-slate-900 block">Pre-Auth</strong> You hold your share.
                      </div>
                  </div>
                  <div className="flex gap-3 items-center bg-white p-3 rounded-xl border border-slate-100">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">2</div>
                      <div className="text-xs text-slate-600">
                          <strong className="text-slate-900 block">Invite</strong> Share link. Friends hold their share.
                      </div>
                  </div>
                   <div className="flex gap-3 items-center bg-white p-3 rounded-xl border border-slate-100">
                      <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs">3</div>
                      <div className="text-xs text-slate-600">
                          <strong className="text-slate-900 block">Finalize</strong> Charge actual amount based on headcount.
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* ORDER SUMMARY */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Booking Summary</h3>
        <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
                <span>Date</span>
                <span className="font-medium text-slate-900">{data.date ? new Date(data.date).toLocaleDateString() : 'Not selected'}</span>
            </div>
            <div className="flex justify-between text-slate-600">
                <span>Port</span>
                <span className="font-medium text-slate-900">{data.port || 'Not selected'}</span>
            </div>
            <div className="flex justify-between text-slate-600">
                <span>Vessel</span>
                <span className="font-medium text-slate-900">{data.vesselName || 'Not selected'}</span>
            </div>
            <div className="flex justify-between text-slate-600">
                <span>MMSI</span>
                <span className="font-medium text-slate-900">{data.mmsi || 'Not provided'}</span>
            </div>
            <div className="flex justify-between text-slate-600">
                <span>Services</span>
                <span className="font-medium text-slate-900">{data.services.filter(s => s.selected).length} items</span>
            </div>
        </div>
      </div>

      {/* PAYMENT FORM */}
      <div className="space-y-4">
        <label className="text-sm font-semibold text-slate-700 flex justify-between">
            Card Details
            <span className="flex items-center gap-1 text-xs text-green-600 font-normal">
                <Lock size={10} /> Secure SSL
            </span>
        </label>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 border-b border-slate-100 flex items-center gap-3">
                <CreditCard size={20} className="text-blue-500" />
                <input type="text" placeholder="Card number" className="w-full outline-none text-slate-900 placeholder:text-slate-300" />
            </div>
            <div className="flex">
                <div className="flex-1 p-3 border-r border-slate-100">
                    <input type="text" placeholder="MM / YY" className="w-full outline-none text-slate-900 placeholder:text-slate-300" />
                </div>
                <div className="flex-1 p-3">
                     <input type="text" placeholder="CVC" className="w-full outline-none text-slate-900 placeholder:text-slate-300" />
                </div>
            </div>
        </div>
      </div>

    </div>
  );
};

export default Step5_Payment;
