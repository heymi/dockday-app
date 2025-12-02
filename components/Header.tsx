import React from 'react';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';

interface HeaderProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentStep, totalSteps, onBack }) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm transition-all duration-300">
      <div className="px-4 h-14 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        
        <h1 className="font-semibold text-slate-800 text-base">
          {currentStep === totalSteps - 1 ? 'Confirm Booking' : 'Book Shore Leave'}
        </h1>

        <button className="p-2 -mr-2 rounded-full hover:bg-slate-100 text-slate-400">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-slate-100">
        <div 
          className="h-full bg-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default Header;
