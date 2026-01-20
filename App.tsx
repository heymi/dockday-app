
import React, { useEffect, useState } from 'react';
import { BookingState, INITIAL_SERVICES, CITY_POINTS, PORTS } from './types';
import Header from './components/Header';
import BookingSummaryFooter from './components/BookingSummaryFooter';
import Step1_TripDetails from './views/Step1_TripDetails';
import Step2_Services from './views/Step2_Services';
import Step3_ServiceOrder from './views/Step3_ServiceOrder';
import Step3_Itinerary from './views/Step3_Itinerary';
import Step4_Review from './views/Step4_Review';
import Step5_Payment from './views/Step5_Payment';
import Step0_AgentVerify from './views/Step0_AgentVerify';
import Step1_ShiftDetails from './views/Step1_ShiftDetails';
import Step2_ShiftReview from './views/Step2_ShiftReview';
import Step3_ShiftSubmitted from './views/Step3_ShiftSubmitted';
import { Clock, ArrowRightCircle, ShieldCheck, Users, Car, Zap, Star, CheckCircle2, Sparkles, Repeat2 } from 'lucide-react';
import { AGENCY_COMPANIES, estimateShiftOrderQuote } from './shiftBilling';
import { createShiftOrder, loadAllShiftOrders, saveShiftOrderForAgent, saveShiftOrderGlobal, updateShiftOrder } from './shiftOrders';
import Step4_AgentOrders from './views/Step4_AgentOrders';
import AdminBilling from './views/AdminBilling';

const App: React.FC = () => {
  // --- State ---
  const defaultAgencyCompanyId = AGENCY_COMPANIES[0]?.id;
  const defaultBillingAccountId = AGENCY_COMPANIES[0]?.accounts[0]?.id;
  const [currentStep, setCurrentStep] = useState(0);
  const [adminMode, setAdminMode] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<BookingState>({
    step: 0,
    date: '',
    port: '',
    vesselName: '',
    mmsi: '',
    groupSize: 1,
    isSplitBill: true,
    selectedPackageId: undefined,
    paymentHoldMethod: 'preauth',
    services: INITIAL_SERVICES,
    itinerary: CITY_POINTS,
    crewName: '',
    passportNumber: '',
    notes: '',
    serviceOrder: INITIAL_SERVICES.filter(s => s.selected && s.type !== 'CORE').map(s => s.id),
    customLoungeDurationHours: 3,

    agentContactType: 'phone',
    agentContactValue: '',
    agentVerified: false,
    carCount: 1,
    transferType: undefined,
    transferDateTime: '',
    airportFlightNumber: '',
    portVesselName: '',
    portVesselNumber: '',
    crewNationalities: [],
    contactName: '',
    contactPhone: '',
    pickupPoint: '',
    pickupIdentifier: '',
    pickupTerminal: '',
    pickupGate: '',
    destination: '',
    destinationType: 'other',
    luggageNotes: '',
    specialRequests: '',
    needHotel: false,
    hotelName: '',
    hotelNights: 0,
    needMeal: false,
    mealPlan: 'standard',
    mealCount: 0,
    agencyCompanyId: defaultAgencyCompanyId,
    billingAccountId: defaultBillingAccountId,
    billingTermsAccepted: false,
  });
  const [showTimelineView, setShowTimelineView] = useState(false);
  const [entryChoice, setEntryChoice] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<string | null>('4h');
  const [hasStarted, setHasStarted] = useState(false);

  const isShiftPackage = bookingData.selectedPackageId === 'shift';
  const totalSteps = isShiftPackage ? 5 : 6;

  // --- Handlers ---
  const updateData = (fields: Partial<BookingState>) => {
    setBookingData(prev => ({ ...prev, ...fields }));
  };

  const backToPackageSelection = () => {
    setCurrentStep(0);
    setShowTimelineView(false);
    setEntryChoice(null);
    updateData({ selectedPackageId: undefined });
  };

  const resetShiftDraft = () => {
    setEditingOrderId(null);
    updateData({
      agentVerified: true,
      carCount: 1,
      groupSize: 1,
      transferType: undefined,
      transferDateTime: '',
      airportFlightNumber: '',
      portVesselName: '',
      portVesselNumber: '',
      crewNationalities: [],
      contactName: '',
      contactPhone: '',
      pickupPoint: '',
      pickupIdentifier: '',
      pickupTerminal: '',
      pickupGate: '',
      destination: '',
      destinationType: 'other',
      luggageNotes: '',
      specialRequests: '',
      needHotel: false,
      hotelName: '',
      hotelNights: 0,
      needMeal: false,
      mealPlan: 'standard',
      mealCount: 0,
      notes: '',
      billingTermsAccepted: false,
    });
    setCurrentStep(1);
    setShowTimelineView(false);
  };

  const startEditOrder = (order: any) => {
    if (order.status === 'in_service' || order.status === 'completed') return;
    setEditingOrderId(order.id);
    updateData({
      selectedPackageId: 'shift',
      agentVerified: true,
      agentContactType: order.agentContactType,
      agentContactValue: order.agentContactValue,
      agencyCompanyId: order.agencyCompanyId || defaultAgencyCompanyId,
      billingAccountId: order.billingAccountId || defaultBillingAccountId,
      groupSize: order.data.groupSize || 1,
      carCount: order.data.carCount || 1,
      transferType: order.data.transferType,
      transferDateTime: order.data.transferDateTime || '',
      airportFlightNumber: order.data.airportFlightNumber || '',
      portVesselName: order.data.portVesselName || '',
      portVesselNumber: order.data.portVesselNumber || '',
      crewNationalities: order.data.crewNationalities || [],
      pickupPoint: order.data.pickupPoint || '',
      pickupIdentifier: order.data.pickupIdentifier || '',
      pickupTerminal: order.data.pickupTerminal || '',
      pickupGate: order.data.pickupGate || '',
      destination: order.data.destination || '',
      destinationType: order.data.destinationType || (order.data.destination && PORTS.includes(order.data.destination) ? 'port' : 'other'),
      luggageNotes: order.data.luggageNotes || '',
      specialRequests: order.data.specialRequests || '',
      needHotel: Boolean(order.data.needHotel),
      hotelName: order.data.hotelName || '',
      hotelNights: order.data.hotelNights || 0,
      needMeal: Boolean(order.data.needMeal),
      mealPlan: order.data.mealPlan || (order.data.needMeal ? 'standard' : undefined),
      mealCount: order.data.mealCount || 0,
      notes: order.data.notes || '',
      billingTermsAccepted: false,
    });
    setCurrentStep(1);
  };

  const goToPayment = (split: boolean) => {
    setBookingData(prev => ({ ...prev, isSplitBill: split }));
    setCurrentStep(5);
  };

  const nextStep = () => {
    const lastIndex = totalSteps - 1;
    if (isShiftPackage && currentStep === 2) {
      const estimateQuote = estimateShiftOrderQuote({
        groupSize: bookingData.groupSize,
        carCount: bookingData.carCount,
        needHotel: bookingData.needHotel,
        hotelNights: bookingData.hotelNights,
        needMeal: bookingData.needMeal,
        mealPlan: bookingData.mealPlan,
        mealCount: bookingData.mealCount,
        transferType: bookingData.transferType,
      });
      const order = createShiftOrder(bookingData, { estimatedAmount: estimateQuote.total, estimateLines: estimateQuote.lines });
      if (order) {
        if (editingOrderId) {
          const existing = loadAllShiftOrders().find(o => o.id === editingOrderId);
          const next = {
            ...order,
            id: existing?.id || editingOrderId,
            createdAt: existing?.createdAt || order.createdAt,
            status: existing?.status || 'submitted',
          };
          updateShiftOrder(next);
          setEditingOrderId(null);
        } else {
          saveShiftOrderForAgent(order.agentKey, order);
          saveShiftOrderGlobal(order);
        }
      }
    }
    if (currentStep < lastIndex) setCurrentStep(c => c + 1);
    else if (!isShiftPackage) alert('Processing Authorization...');
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(c => c - 1);
    else if (entryChoice) backToPackageSelection();
  };

  // Scroll to top on step change to avoid carrying over previous scroll position
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [currentStep]);

  // --- Render Steps ---
  const renderStep = () => {
    if (isShiftPackage) {
      switch (currentStep) {
        case 0: return <Step0_AgentVerify data={bookingData} update={updateData} onNext={nextStep} />;
        case 1: return <Step1_ShiftDetails data={bookingData} update={updateData} onNext={nextStep} />;
        case 2: return <Step2_ShiftReview data={bookingData} update={updateData} onNext={nextStep} />;
        case 3: return <Step3_ShiftSubmitted data={bookingData} onDone={backToPackageSelection} onNew={resetShiftDraft} onViewOrders={() => setCurrentStep(4)} />;
        case 4: return <Step4_AgentOrders data={bookingData} onBack={() => setCurrentStep(3)} onNew={resetShiftDraft} onEdit={startEditOrder} />;
        default: return null;
      }
    }
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

  // Landing page (trust + CTA), then package selection, then main flow
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-100">
        <div
          className="relative min-h-screen flex flex-col items-center justify-end"
          style={{
            backgroundImage:
              'linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.28)), url(https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1400&q=75), url(https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1400&q=70)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.045),transparent_42%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.04),transparent_42%)] pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-10 text-white/85 text-sm">
            <div className="space-y-1">
              <div>Hi, Morgan 👋</div>
              <div className="flex items-center gap-2">
                <span role="img" aria-label="flag">🇨🇳</span>
                <span>China · NanJing</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/18 px-3 py-2 rounded-full backdrop-blur-sm border border-white/20 shadow-sm">
              <span className="text-lg">🌤️</span>
              <div className="leading-tight">
                <div className="text-white/80">Weather</div>
                <div className="font-semibold">26°C</div>
              </div>
            </div>
          </div>

          <div className="relative z-10 px-6 pb-28 w-full text-center space-y-3">
            <div className="text-[30px] font-bold leading-tight">Smooth shore leave, guaranteed</div>
            <p className="text-sm text-white/85 leading-relaxed max-w-md mx-auto">
              Insured transport with bilingual escort. We handle shore pass, prioritize your paid services, and return you before curfew.
            </p>
            <div className="flex justify-center gap-1 text-[10px] text-white/80">
              <span className="px-2 py-1 rounded-full bg-white/15 border border-white/20">Back on time</span>
              <span className="px-2 py-1 rounded-full bg-white/15 border border-white/20">Bring passport & seafarer book</span>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-5 px-6 z-20 space-y-2 text-center">
            <button
              onClick={() => setHasStarted(true)}
              className="w-full h-14 rounded-full font-semibold text-white bg-black/85 shadow-[0_18px_40px_rgba(0,0,0,0.45)] flex items-center justify-center gap-2 active:scale-95 transition"
            >
              Let’s Get Started
            </button>
            <div className="text-sm text-white/85">
              Already have an account? <button className="underline font-semibold">Login</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (adminMode) {
    return <AdminBilling onBack={() => setAdminMode(false)} />;
  }

  if (hasStarted && entryChoice === null) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
        <main className="max-w-md mx-auto p-4 pt-10 pb-24 space-y-5 animate-fadeIn">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-slate-900">Choose your package</h1>
            <p className="text-slate-600 text-sm">Pick a duration. Prices shown on the button below.</p>
            <button
              type="button"
              onClick={() => {
                const code = window.prompt('请输入后台口令');
                if (code === 'dockday') {
                  setAdminMode(true);
                } else if (code) {
                  window.alert('口令错误');
                }
              }}
              className="text-xs font-semibold text-slate-600 underline underline-offset-4"
            >
              后台结算（演示）
            </button>
          </div>

          <div className="grid gap-3">
            {[
              { id: '4h', title: '4-Hour Express', desc: 'Quick supply run & short city hop.', tone: 'blue', icon: <Zap size={22} />, tags: ['Fast', 'Essentials', 'Port-safe', 'Free shore pass'], priceLabel: '$39.9 / person' },
              { id: '8h', title: '8-Hour Full Service Deluxe', desc: 'Full-day explore with van + bilingual escort.', tone: 'indigo', icon: <Star size={22} className="text-[#C2A661] fill-[#C2A661]" />, tags: ['All-day', 'Van + Escort', 'Insurance', 'Free shore pass'], iconBorder: 'border-2 border-[#C2A661] bg-white', priceLabel: '$129.9 / person' },
              { id: 'trip', title: 'Point-to-Point Metered', desc: 'One-way pricing per trip, pay as you go.', tone: 'emerald', icon: <Car size={22} />, tags: ['From $15', 'Up to 30 km', 'Per trip'], priceLabel: '$15 / trip' },
              { id: 'shift', title: '换班（代理下单）', desc: '船代/代理为船员换班下单，月结平台垫付。', tone: 'slate', icon: <Repeat2 size={22} />, tags: ['白名单', '快速填单'], priceLabel: '验证代理' }
            ].map(card => {
              const active = selectedEntry === card.id;
              const toneBg = card.tone === 'blue'
                ? 'bg-blue-50 text-blue-600'
                : card.tone === 'emerald'
                ? 'bg-emerald-50 text-emerald-600'
                : card.tone === 'slate'
                ? 'bg-slate-100 text-slate-700'
                : 'bg-indigo-50 text-indigo-600';
              const toneRing = card.tone === 'blue' ? 'ring-blue-300 border-blue-300' : card.tone === 'emerald' ? 'ring-emerald-300 border-emerald-300' : 'ring-[#C2A661] border-[#C2A661]';
              const toneRingResolved = card.tone === 'slate' ? 'ring-slate-300 border-slate-300' : toneRing;
              const toneAccent = card.tone === 'blue' ? 'text-blue-500' : card.tone === 'emerald' ? 'text-emerald-600' : card.tone === 'slate' ? 'text-slate-700' : 'text-indigo-500';
              const tonePill = card.tone === 'emerald' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600';
              return (
                <button
                  key={card.id}
                  onClick={() => setSelectedEntry(card.id)}
                  className={`w-full bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition flex items-center justify-between text-left ${active ? `${toneRingResolved} ring-2` : 'border-slate-200'}`}
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
                          <span key={tag} className={`px-2 py-0.5 rounded-full ${card.id === 'trip' ? tonePill : 'bg-slate-100'}`}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 text-right whitespace-nowrap pl-3">
                    <ArrowRightCircle className={toneAccent} size={22} />
                    <span className="text-xs text-slate-500">{card.priceLabel}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="fixed bottom-4 left-0 right-0 px-4 max-w-md mx-auto">
            <button
              disabled={!selectedEntry}
              onClick={() => {
                if (!selectedEntry) return;
                setEntryChoice(selectedEntry);
                setCurrentStep(0);
                setShowTimelineView(false);
                updateData({ selectedPackageId: selectedEntry as '4h' | '8h' | 'trip' | 'shift' });
              }}
              className={`w-full h-14 rounded-xl font-semibold text-white shadow-lg transition-all active:scale-95 flex items-center justify-between px-4 ${
                selectedEntry ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              {selectedEntry ? (
                <>
                  <span className="text-sm">Continue</span>
                  <span className="text-lg font-bold">
                    {selectedEntry === '4h'
                      ? '$39.9 / person'
                      : selectedEntry === '8h'
                      ? '$129.9 / person'
                      : selectedEntry === 'trip'
                      ? '$15 / trip'
                      : 'Verify agent'}
                  </span>
                </>
              ) : (
                <span className="w-full text-center text-sm">Select a duration to continue</span>
              )}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
      <Header 
        currentStep={currentStep} 
        totalSteps={totalSteps} 
        onBack={prevStep}
      />

      <main className="max-w-md mx-auto p-4 pt-6 pb-28">
        {renderStep()}
      </main>

      {!showTimelineView && !isShiftPackage && (
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
