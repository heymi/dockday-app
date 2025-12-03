
import React from 'react';
import { ChevronRight, Users, ArrowRight, Lock } from 'lucide-react';
import { BookingState } from '../types';

interface FooterProps {
  booking: BookingState;
  onNext: () => void;
  isLastStep: boolean;
  choiceButtons?: {
    left: { label: string; onClick: () => void };
    right: { label: string; onClick: () => void };
  };
}

const BookingSummaryFooter: React.FC<FooterProps> = ({ booking, onNext, isLastStep, choiceButtons }) => {
  // Calculate Total
  const corePrice = booking.services.filter(s => s.selected).reduce((acc, curr) => acc + curr.price, 0);
  const totalPrice = corePrice;
  const promoGroupSize = 4;
  const lowAsPrice = totalPrice / promoGroupSize;
  
  // Calculate Per Person
  const effectiveGroupSize = booking.groupSize > 0 ? booking.groupSize : 1;
  const perPersonPrice = totalPrice / effectiveGroupSize;
  const displayedSplitPrice = Math.max(perPersonPrice, 120);

  // Determine Button Text
  let buttonText = 'Continue';
  if (isLastStep) {
    if (booking.isSplitBill) {
        buttonText = `Hold $${perPersonPrice.toFixed(0)} & Invite`;
    } else {
        buttonText = `Pay $${totalPrice.toFixed(0)}`;
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] z-40 pb-safe">
      <div className="max-w-md mx-auto">
        {choiceButtons ? (
          <div className="flex flex-col gap-2">
            <div className="text-xs text-slate-500 font-semibold">Choose how to pay</div>
            <button
              onClick={choiceButtons.left.onClick}
              className="w-full rounded-xl bg-blue-600 text-white px-4 py-3 flex items-center justify-between gap-3 shadow-lg active:scale-95 transition-all"
            >
              <div className="min-w-0 max-w-[62%] leading-tight">
                <div className="text-sm font-semibold truncate">{choiceButtons.left.label}</div>
                <div className="text-[11px] text-white/80 truncate">Split with group</div>
              </div>
              <div className="text-right shrink-0 leading-tight">
                <div className="text-base font-bold whitespace-nowrap">${displayedSplitPrice.toFixed(2)}</div>
                <div className="text-[11px] text-white/80">per person</div>
              </div>
            </button>
            <button
              onClick={choiceButtons.right.onClick}
              className="w-full rounded-xl bg-slate-900 text-white px-4 py-3 flex items-center justify-between gap-3 shadow-lg active:scale-95 transition-all"
            >
              <div className="min-w-0 max-w-[62%] leading-tight">
                <div className="text-sm font-semibold truncate">{choiceButtons.right.label}</div>
                <div className="text-[11px] text-white/80 truncate">Pay for everyone</div>
              </div>
              <div className="text-right shrink-0 leading-tight">
                <div className="text-base font-bold whitespace-nowrap">${totalPrice.toFixed(2)}</div>
                <div className="text-[11px] text-white/80">total</div>
              </div>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-0.5">
                {booking.isSplitBill ? (
                  <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                    Group Rate
                  </span>
                ) : (
                  <span>Group Price As Low As</span>
                )}
              </div>
              
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900">
                  ${booking.isSplitBill ? perPersonPrice.toFixed(2) : lowAsPrice.toFixed(2)}
                </span>
                {booking.isSplitBill && (
                  <span className="text-xs text-slate-400 font-medium">/ person</span>
                )}
              </div>
              {!booking.isSplitBill && (
                <span className="text-[10px] text-slate-400">Per person, assuming {promoGroupSize} guests</span>
              )}
              {booking.isSplitBill && (
                 <span className="text-[10px] text-slate-400">Total: ${totalPrice.toFixed(2)}</span>
              )}
            </div>

            <button
              onClick={onNext}
              className={`flex-1 h-12 px-4 rounded-xl font-semibold text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
                isLastStep 
                  ? 'bg-slate-900 hover:bg-slate-800 shadow-slate-200' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
              }`}
            >
              {isLastStep && <Lock size={16} className="opacity-70" />}
              <span className="text-sm">{buttonText}</span>
              {!isLastStep && <ArrowRight size={18} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingSummaryFooter;
