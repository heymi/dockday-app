import React, { useMemo, useRef, useState } from 'react';
import { Share2, UserRound, Clock, Check, X, ChevronLeft, ChevronRight, ChevronRight as ChevronIcon, Plus } from 'lucide-react';
import { BookingState, ServiceItem, ServiceVariant } from '../types';

interface Props {
  data: BookingState;
  update: (fields: Partial<BookingState>) => void;
}

const shareLabel = (type?: ServiceItem['shareType']) => {
  if (type === 'PER_PERSON') return { text: 'Per Person', color: 'bg-amber-100 text-amber-700' };
  return { text: 'Splittable', color: 'bg-green-100 text-green-700' };
};

const Step2_Services: React.FC<Props> = ({ data, update }) => {
  const [detailService, setDetailService] = useState<ServiceItem | null>(null);
  const [pendingVariantId, setPendingVariantId] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const longPressTimers = useRef<Record<string, number>>({});

  const getVariantList = (service: ServiceItem): ServiceVariant[] => {
    if (service.variants && service.variants.length) return service.variants;
    return [
      {
        id: `${service.id}-single`,
        title: service.title,
        subtitle: service.duration,
        price: service.price,
        shareType: service.shareType
      }
    ];
  };

  const addonServices = useMemo(() => {
    return data.services.filter(s => s.type === 'ADDON');
  }, [data.services]);

  const getSelectedVariant = (service: ServiceItem) => {
    if (!service.selectedVariantId) return null;
    const list = getVariantList(service);
    return list.find(v => v.id === service.selectedVariantId) || null;
  };

  const openDetails = (service: ServiceItem) => {
    const variants = getVariantList(service);
    const defaultVariantId = service.selectedVariantId || variants[0]?.id || null;
    setDetailService(service);
    setPendingVariantId(defaultVariantId);
    setGalleryIndex(0);
  };

  const closeDetails = () => {
    setDetailService(null);
    setPendingVariantId(null);
  };

  const confirmVariantSelection = () => {
    if (!detailService || !pendingVariantId) return;
    const variants = getVariantList(detailService);
    const variant = variants.find(v => v.id === pendingVariantId);
    if (!variant) return;
    const updated = data.services.map(s => {
      if (s.id === detailService.id) {
        return {
          ...s,
          selected: true,
          selectedVariantId: variant.id,
          price: variant.price
        };
      }
      return s;
    });
    const order = [...data.serviceOrder];
    if (detailService.type !== 'CORE' && detailService.id !== 'addon-ext' && !order.includes(detailService.id)) {
      order.push(detailService.id);
    }
    update({ services: updated, serviceOrder: order });
    closeDetails();
  };

  const handlePrimaryAction = () => {
    if (!detailService) return;
    confirmVariantSelection();
  };

  const handleRemoveSelection = () => {
    if (!detailService) return;
    const updated = data.services.map(s => {
      if (s.id === detailService.id) {
        return { ...s, selected: false, selectedVariantId: undefined };
      }
      return s;
    });
    const order = data.serviceOrder.filter(id => id !== detailService.id);
    update({ services: updated, serviceOrder: order });
    closeDetails();
  };

  const removeServiceDirect = (service: ServiceItem) => {
    if (service.type === 'CORE') return;
    const updatedServices = data.services.map(s =>
      s.id === service.id ? { ...s, selected: false, selectedVariantId: undefined } : s
    );
    const order = data.serviceOrder.filter(id => id !== service.id);
    update({ services: updatedServices, serviceOrder: order });
  };

  const renderServiceCard = (service: ServiceItem) => {
    const share = shareLabel(service.shareType);
    const selectedVariant = getSelectedVariant(service);
    const displayPrice = selectedVariant ? selectedVariant.price : service.price;
    const hasVariants = !!service.variants?.length;
    const isSelected = service.selected;
    const priceColor = service.shareType === 'PER_PERSON' ? 'text-amber-600' : 'text-blue-800';
    const chipTexts = new Set<string>();
    const metaChips: { text: string; className: string }[] = [];
    const startLongPress = () => {
      if (longPressTimers.current[service.id]) clearTimeout(longPressTimers.current[service.id]);
      longPressTimers.current[service.id] = window.setTimeout(() => {
        removeServiceDirect(service);
      }, 600);
    };

    const clearLongPress = () => {
      if (longPressTimers.current[service.id]) {
        clearTimeout(longPressTimers.current[service.id]);
        delete longPressTimers.current[service.id];
      }
    };

    (service.tags || []).forEach(tag => {
      const key = tag.toLowerCase();
      if (!chipTexts.has(key) && key !== 'entire journey') {
        chipTexts.add(key);
        metaChips.push({ text: tag, className: 'bg-slate-100 text-slate-600' });
      }
    });

    // If no tags, add a default category placeholder
    if ((service.tags || []).length === 0) {
      metaChips.push({ text: 'General', className: 'bg-slate-100 text-slate-600' });
    }

    // Add duration as a small tag near category
    if (service.duration) {
      const key = `duration-${service.duration.toLowerCase()}`;
      if (!chipTexts.has(key)) {
        chipTexts.add(key);
        metaChips.push({ text: service.duration, className: 'bg-indigo-50 text-indigo-700' });
      }
    }

    const condensedChips = metaChips.slice(0, 2);

    const handleCardClick = () => {
      openDetails(service);
    };

    const clearTimer = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };

    const handleLongPress = () => {
      clearTimer();
      // Remove service selection on long press
      if (service.type === 'CORE') return;
      const updated = data.services.map(s =>
        s.id === service.id ? { ...s, selected: false, selectedVariantId: undefined } : s
      );
      const order = data.serviceOrder.filter(id => id !== service.id);
      update({ services: updated, serviceOrder: order });
    };

    return (
      <div
        key={service.id}
        className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all ${
          isSelected ? 'border-blue-600 shadow-blue-100' : 'border-slate-200 hover:border-blue-100'
        }`}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
        onMouseDown={startLongPress}
        onMouseUp={clearLongPress}
        onMouseLeave={clearLongPress}
        onTouchStart={startLongPress}
        onTouchEnd={clearLongPress}
      >
        <div className="flex gap-3 p-3">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
            {service.shareType && (
              <span
                className={`absolute top-1 left-1 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-sm ${
                  service.shareType === 'SPLITTABLE' ? 'bg-green-600/80' : 'bg-amber-500/80'
                }`}
              >
                {service.shareType === 'SPLITTABLE' ? 'Split' : 'Per P.'}
              </span>
            )}
            <img src={service.image} alt={service.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                {condensedChips.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {condensedChips.map(chip => (
                      <span
                        key={chip.text}
                        className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${chip.className}`}
                      >
                        {chip.text}
                      </span>
                    ))}
                  </div>
                )}
                <h3 className="text-sm font-bold text-slate-900 mt-1 truncate">{service.title}</h3>
                <p
                  className="text-xs text-slate-500"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: '1.4',
                    maxHeight: '2.8em',
                    wordBreak: 'break-word'
                  }}
                >
                  {service.description}
                </p>
              </div>
              <div className="text-right shrink-0 flex flex-col items-end gap-1">
                <div className={`text-lg font-bold ${priceColor}`}>${displayPrice.toFixed(2)}</div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDetails(service);
                  }}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 transition"
                  aria-label="View details"
                >
                  <ChevronIcon size={14} />
                </button>
              </div>
            </div>
            <div className="pt-1">
              <div className="flex items-center gap-1 text-[11px] text-slate-600 min-h-[16px]">
                {selectedVariant ? (
                  <>
                    <Check size={12} className="text-blue-600 shrink-0" />
                    <span className="truncate">
                      {selectedVariant.title}
                      {selectedVariant.subtitle ? ` — ${selectedVariant.subtitle}` : ''}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-400">Tap to choose</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-28">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Customize Experience</h2>
        <p className="text-slate-500 text-sm">Pick add-ons to enhance your shore leave. Group-friendly options are marked as splittable.</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-100 flex items-center gap-1">
            <Share2 size={12} /> Splittable: share cost with friends
          </span>
          <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1">
            <UserRound size={12} /> Per Person: pay individually
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {addonServices.map(renderServiceCard)}
      </div>

      {/* Detail Modal */}
      {detailService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm px-3 py-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[78vh] overflow-hidden animate-fadeIn my-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Service Details</h3>
              <button onClick={closeDetails} className="p-1 text-slate-500 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[68vh] sm:max-h-[72vh]">
              {(() => {
                const gallery = detailService.images?.length
                  ? detailService.images
                  : detailService.image
                  ? [detailService.image]
                  : [];
                const slides = gallery.slice(0, 3);
                const currentSrc = slides[slides.length ? galleryIndex % slides.length : 0];
                if (!gallery.length) return null;
                return (
                  <div
                    className="relative overflow-hidden"
                    onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
                    onTouchMove={(e) => {
                      if (touchStartX === null) return;
                      setTouchDeltaX(e.touches[0].clientX - touchStartX);
                    }}
                    onTouchEnd={() => {
                      if (touchStartX === null) return;
                      const threshold = 50;
                      if (touchDeltaX > threshold) {
                        setGalleryIndex((prev) => (prev - 1 + slides.length) % slides.length);
                      } else if (touchDeltaX < -threshold) {
                        setGalleryIndex((prev) => (prev + 1) % slides.length);
                      }
                      setTouchStartX(null);
                      setTouchDeltaX(0);
                    }}
                  >
                    <img src={currentSrc} alt={detailService.title} className="w-full h-52 object-cover select-none" />
                {slides.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setGalleryIndex((prev) => (prev - 1 + slides.length) % slides.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2"
                    >
                      <ChevronLeft size={18} />
                    </button>
                        <button
                          type="button"
                          onClick={() => setGalleryIndex((prev) => (prev + 1) % slides.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2"
                        >
                          <ChevronRight size={18} />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                          {slides.map((_, idx) => (
                            <span
                              key={idx}
                              className={`w-2 h-2 rounded-full ${idx === (galleryIndex % slides.length) ? 'bg-white' : 'bg-white/50'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">{detailService.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${shareLabel(detailService.shareType).color}`}>
                        {shareLabel(detailService.shareType).text}
                      </span>
                      {detailService.duration && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700">
                          {detailService.duration}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-slate-900">
                      ${pendingVariantId && detailService.variants?.find(v => v.id === pendingVariantId)?.price?.toFixed(2) || detailService.price.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-slate-800 mb-1">Description</h5>
                  <p className="text-sm text-slate-600 leading-relaxed">{detailService.description}</p>
                </div>

                {/* Specification list (applies to single-spec as well) */}
                {(() => {
                  const variants = getVariantList(detailService);
                  return (
                    <div className="space-y-2">
                      <h5 className="text-sm font-semibold text-slate-800">Select Specification</h5>
                      <div className="space-y-2">
                        {variants.map((variant: ServiceVariant) => {
                          const isActive = pendingVariantId === variant.id;
                          return (
                            <button
                              key={variant.id}
                              type="button"
                              onClick={() => setPendingVariantId(variant.id)}
                              className={`w-full text-left border rounded-2xl px-4 py-3 flex items-center justify-between transition-all ${
                                isActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-200'
                              }`}
                            >
                              <div>
                                <div className="text-sm font-semibold text-slate-900">{variant.title}</div>
                                {variant.subtitle && <div className="text-xs text-slate-500">{variant.subtitle}</div>}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">${variant.price.toFixed(2)}</span>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isActive ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                                  {isActive && <Check size={14} className="text-white" />}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 sticky bottom-0 bg-white flex gap-2">
              {detailService.selected && (
                <button
                  type="button"
                  onClick={handleRemoveSelection}
                  className="flex-1 h-12 rounded-xl font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300"
                >
                  Remove
                </button>
              )}
              <button
                type="button"
                onClick={handlePrimaryAction}
                disabled={!pendingVariantId}
                className="flex-[2] h-12 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all"
              >
                Confirm Selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2_Services;
