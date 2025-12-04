
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
    services: INITIAL_SERVICES,
    itinerary: CITY_POINTS,
    crewName: '',
    passportNumber: '',
    notes: '',
    serviceOrder: INITIAL_SERVICES.filter(s => s.selected && s.type !== 'CORE').map(s => s.id),
    customLoungeDurationHours: 3
  });
  const [showTimelineView, setShowTimelineView] = useState(false);

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
    </div>
  );
};

export default App;
