import React, { useMemo, useState } from 'react';
import { MapPin, Clock, Plus, Check, Info } from 'lucide-react';
import { BookingState, CityPoint } from '../types';

interface Props {
  data: BookingState;
  update: (fields: Partial<BookingState>) => void;
}

const Step3_Itinerary: React.FC<Props> = ({ data, update }) => {
  const [activeCategory, setActiveCategory] = useState<'ALL' | CityPoint['type']>('ALL');
  const [detailPoint, setDetailPoint] = useState<CityPoint | null>(null);

  const togglePoint = (id: string) => {
    const newItinerary = data.itinerary.map(p => {
        if (p.id === id) return { ...p, selected: !p.selected };
        return p;
    });
    update({ itinerary: newItinerary });
  };

  const categories = useMemo(() => {
    const set = new Set<CityPoint['type']>();
    data.itinerary.forEach(p => set.add(p.type));
    return ['ALL', ...Array.from(set)];
  }, [data.itinerary]);

  const filteredPoints = activeCategory === 'ALL'
    ? data.itinerary
    : data.itinerary.filter(p => p.type === activeCategory);

  const selectedCount = data.itinerary.filter(p => p.selected).length;
  const totalDuration = data.itinerary.filter(p => p.selected).reduce((acc, curr) => acc + curr.duration, 0);
  const totalHours = Math.floor(totalDuration / 60);

  const detailMeta: Record<string, { description: string; rating: number; spend: string }> = {
    'route-1': {
      description: 'A riverside boardwalk where you can enjoy sea breeze, casual coffee, and snap photos at sunset. Nearby kiosks sell snacks and small souvenirs; expect relaxed pacing with room for a slow stroll before heading back to the shuttle.',
      rating: 4.5,
      spend: '¥50-¥120 / person'
    },
    'route-2': {
      description: 'Night-time lounge street packed with live music bars and dessert spots. Ideal for small groups to explore, taste local bites, and soak in neon-lit views. Crowds build after 7pm, so plan some buffer for queues.',
      rating: 4.2,
      spend: '¥80-¥180 / person'
    },
    'route-3': {
      description: 'Local wet market plus a compact mall with groceries, toiletries, and grab-and-go meals. Good for stocking up quick essentials; cashless payments widely accepted. Walking routes are short and easy.',
      rating: 4.0,
      spend: '¥40-¥150 / person'
    }
  };

  const getDetail = (p: CityPoint) => detailMeta[p.id] || {
    description: 'Popular local stop for quick sightseeing, light shopping, and snacks. Expect friendly vendors, walkable blocks, and plenty of photo spots. Great for stretching legs before heading to the next paid service.',
    rating: 4.0,
    spend: '¥60-¥160 / person'
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
       <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Plan Your Route</h2>
        <p className="text-slate-500 text-sm">Add optional self-pay stops; paid services will be prioritized.</p>
      </div>

      {/* Category Filters */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 sticky top-[70px] z-30">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {categories.map(cat => {
            const isActive = activeCategory === cat;
            const count = cat === 'ALL' ? data.itinerary.length : data.itinerary.filter(p => p.type === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat as typeof activeCategory)}
                className={`px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border transition-all ${
                  isActive ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-200'
                }`}
              >
                <span className="mr-1">{cat === 'ALL' ? 'All' : cat.toLowerCase()}</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-100 text-blue-800 rounded-2xl p-3 text-sm flex items-start gap-2">
        <Info size={16} className="mt-0.5 text-blue-500" />
        <div className="space-y-1">
          <p className="font-semibold text-sm">Paid services first</p>
          <p className="text-xs text-blue-700">These stops are optional and self-pay on-site; we arrange them only if time allows after completing paid services.</p>
        </div>
      </div>

      {/* Destination Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPoints.map((point) => (
            <div 
                key={point.id}
                onClick={() => setDetailPoint(point)}
                className="group relative h-52 rounded-2xl overflow-hidden shadow-md transition-all active:scale-95 bg-slate-900/5 cursor-pointer"
            >
                {/* Background Image */}
                <img src={point.image} alt={point.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                
                {/* Overlay */}
                <div className={`absolute inset-0 transition-opacity duration-300 ${point.selected ? 'bg-black/60' : 'bg-gradient-to-t from-black/80 via-black/20 to-transparent'}`} />

                {/* Selection Ring */}
                {point.selected && (
                    <div className="absolute inset-0 border-[3px] border-blue-500 rounded-2xl z-20 pointer-events-none"></div>
                )}

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 z-10 text-white space-y-2">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <span className="inline-block px-2 py-0.5 bg-white/20 backdrop-blur-md rounded text-[10px] font-bold uppercase tracking-wider">
                                {point.type}
                            </span>
                            <h3 className="text-lg font-bold leading-tight">{point.name}</h3>
                            <div className="flex items-center gap-1 text-xs text-white/80">
                                <Clock size={12} />
                                <span>~{point.duration} min · Optional self-pay</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button
                            type="button"
                          onClick={(e) => { e.stopPropagation(); setDetailPoint(point); }}
                          className="px-2.5 py-1 rounded-full bg-white/20 text-[11px] font-semibold backdrop-blur hover:bg-white/30 transition"
                          >
                            View details
                          </button>
                          <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); togglePoint(point.id); }}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border border-white/30 ${
                            point.selected ? 'bg-blue-500 text-white border-blue-400' : 'bg-white/20 backdrop-blur text-white hover:bg-white hover:text-slate-900'
                          }`}
                          >
                            {point.selected ? <Check size={16} /> : <Plus size={16} />}
                          </button>
                        </div>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* Detail Modal */}
      {detailPoint && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeInUp">
            <div className="relative h-48">
              <img src={detailPoint.image} alt={detailPoint.name} className="w-full h-full object-cover" />
              <button
                className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-2 shadow"
                onClick={() => setDetailPoint(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">{detailPoint.type}</span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Clock size={12} /> ~{detailPoint.duration} min
                </span>
              </div>
              <div className="flex items-start justify-between">
                <h3 className="text-xl font-bold text-slate-900 leading-tight max-w-[70%]">{detailPoint.name}</h3>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Rating</div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const rating = getDetail(detailPoint).rating;
                      const filled = i + 1 <= Math.round(rating);
                      return <span key={i} className={filled ? 'text-amber-500' : 'text-slate-300'}>★</span>;
                    })}
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {getDetail(detailPoint).description}
              </p>
              <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
                <span>Avg spend</span>
                <span className="text-blue-700">{getDetail(detailPoint).spend}</span>
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                  onClick={() => setDetailPoint(null)}
                >
                  Close
                </button>
                <button
                  className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow-sm"
                  onClick={() => { togglePoint(detailPoint.id); setDetailPoint(null); }}
                >
                  {detailPoint.selected ? 'Remove' : 'Add to route'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step3_Itinerary;
