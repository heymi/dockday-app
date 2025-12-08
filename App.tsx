
import React, { useState } from 'react';
import { BookingState, INITIAL_SERVICES, CITY_POINTS } from './types';
import Header from './components/Header';
import BookingSummaryFooter from './components/BookingSummaryFooter';
import Step1_TripDetails from './views/Step1_TripDetails';
import Step2_Services from './views/Step2_Services';
import Step3_ServiceOrder from './views/Step3_ServiceOrder';
import Step3_Itinerary from './views/Step3_Itinerary';
import Step4_Review from './views/Step4_Review';
import Step5_Payment from './views/Step5_Payment';
import { useEffect } from 'react';
import { Clock, ArrowRightCircle, ShieldCheck, Users, Car, Stars, Zap, Star } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [currentStep, setCurrentStep] = useState(0);
  const [bookingData, setBookingData] = useState<BookingState>({
    step: 0,
    date: '',
    port: '',
    vesselName: '',
    mmsi: '',
    groupSize: 1,
    isSplitBill: true,
    selectedPackageHours: undefined,
    services: INITIAL_SERVICES,
    itinerary: CITY_POINTS,
    crewName: '',
    passportNumber: '',
    notes: '',
    serviceOrder: INITIAL_SERVICES.filter(s => s.selected && s.type !== 'CORE').map(s => s.id),
    customLoungeDurationHours: 3
  });
  const [showTimelineView, setShowTimelineView] = useState(false);
  const [entryChoice, setEntryChoice] = useState<number | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<number | null>(4);

  // --- Handlers ---
  const updateData = (fields: Partial<BookingState>) => {
    setBookingData(prev => ({ ...prev, ...fields }));
  };

  const goToPayment = (split: boolean) => {
    setBookingData(prev => ({ ...prev, isSplitBill: split }));
    setCurrentStep(5);
  };

  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(c => c + 1);
    else alert('Processing Authorization...');
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(c => c - 1);
  };

  // Scroll to top on step change to avoid carrying over previous scroll position
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [currentStep]);

  // --- Render Steps ---
  const renderStep = () => {
    switch (currentStep) {
      case 0: return <Step1_TripDetails data={bookingData} update={updateData} />;
      case 1: return <Step2_Services data={bookingData} update={updateData} />;
      case 2: return <Step3_Itinerary data={bookingData} update={updateData} />;
      case 3: return <Step3_ServiceOrder data={bookingData} update={updateData} />;
      case 4: return <Step4_Review data={bookingData} showTimeline={showTimelineView} setShowTimeline={setShowTimelineView} />;
      case 5: return <Step5_Payment data={bookingData} update={updateData} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
      {entryChoice === null ? (
        <main className="max-w-md mx-auto p-4 pt-8 pb-20 space-y-6 animate-fadeIn">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold leading-tight">Choose Your Shore Leave</h1>
            <p className="text-slate-500 text-sm">Safe, insured transport with bilingual escort. Pick a base duration to start your booking.</p>
          </div>

          <div className="grid gap-3">
            {[
              { hours: 4, title: '4-Hour Express', desc: 'Quick supply run & short city hop.', tone: 'blue', icon: <Zap size={22} />, tags: ['Fast', 'Essentials', 'Port-safe', 'Free shore pass'] },
              { hours: 8, title: '8-Hour Full Service Deluxe', desc: 'Full-day explore with van + bilingual escort.', tone: 'indigo', icon: <Star size={22} className="text-[#C2A661] fill-[#C2A661]" />, tags: ['All-day', 'Van + Escort', 'Insurance', 'Free shore pass'], iconBorder: 'border-2 border-[#C2A661] bg-white' }
            ].map(card => {
              const active = selectedEntry === card.hours;
              const toneBg = card.tone === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600';
              const toneRing = card.tone === 'blue' ? 'ring-blue-300 border-blue-300' : 'ring-[#C2A661] border-[#C2A661]';
              return (
                <button
                  key={card.hours}
                  onClick={() => setSelectedEntry(card.hours)}
                  className={`w-full bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition flex items-center justify-between text-left ${active ? `${toneRing} ring-2` : 'border-slate-200'}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-12 h-12 rounded-xl ${toneBg} flex items-center justify-center ${card.iconBorder || ''}`}>
                      {card.icon}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="text-lg font-semibold">{card.title}</div>
                      <div className="text-sm text-slate-500">{card.desc}</div>
                      <div className="flex gap-1 flex-wrap text-[11px] text-slate-600">
                        {card.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-100">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 text-right whitespace-nowrap pl-3">
                    <ArrowRightCircle className={card.tone === 'blue' ? 'text-blue-500' : 'text-indigo-500'} size={22} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8" />
          <div className="fixed bottom-4 left-0 right-0 px-4 max-w-md mx-auto">
            <button
              disabled={!selectedEntry}
              onClick={() => {
                if (!selectedEntry) return;
                setEntryChoice(selectedEntry);
                updateData({ selectedPackageHours: selectedEntry });
              }}
              className={`w-full h-14 rounded-xl font-semibold text-white shadow-lg transition-all active:scale-95 flex items-center justify-between px-4 ${
                selectedEntry ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              {selectedEntry ? (
                <>
                  <span className="text-sm">Continue</span>
                  <span className="text-lg font-bold">
                    {selectedEntry === 4 ? '$39.9 / person' : '$129.9 / person'}
                  </span>
                </>
              ) : (
                <span className="w-full text-center text-sm">Select a duration to continue</span>
              )}
            </button>
          </div>
        </main>
      ) : (
        <>
          <Header 
            currentStep={currentStep} 
            totalSteps={6} 
            onBack={prevStep}
          />

          <main className="max-w-md mx-auto p-4 pt-6 pb-28">
            {renderStep()}
          </main>

          {!showTimelineView && (
            <BookingSummaryFooter 
              booking={bookingData} 
              onNext={nextStep} 
              isLastStep={currentStep === 5}
              choiceButtons={currentStep === 4 ? {
                left: { label: 'Split with Friends', onClick: () => goToPayment(true) },
                right: { label: 'Travel Solo', onClick: () => goToPayment(false) }
              } : undefined}
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;
