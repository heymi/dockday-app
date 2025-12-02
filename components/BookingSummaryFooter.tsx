
import React from 'react';
import { ChevronRight, Users, ArrowRight, Lock } from 'lucide-react';
import { BookingState } from '../types';

interface FooterProps {
  booking: BookingState;
  onNext: () => void;
  isLastStep: boolean;
}

const BookingSummaryFooter: React.FC<FooterProps> = ({ booking, onNext, isLastStep }) => {
  // Calculate Total
  const corePrice = booking.services.filter(s => s.selected).reduce((acc, curr) => acc + curr.price, 0);
  const totalPrice = corePrice;
  const promoGroupSize = 4;
  const lowAsPrice = totalPrice / promoGroupSize;
  
  // Calculate Per Person
  const effectiveGroupSize = booking.groupSize > 0 ? booking.groupSize : 1;
  const perPersonPrice = totalPrice / effectiveGroupSize;

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
      <div className="max-w-md mx-auto flex items-center justify-between gap-4">
        
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
    </div>
  );
};

export default BookingSummaryFooter;
