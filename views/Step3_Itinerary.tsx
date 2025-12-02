import React, { useMemo, useState } from 'react';
import { MapPin, Clock, Plus, Check } from 'lucide-react';
import { BookingState, CityPoint } from '../types';

interface Props {
  data: BookingState;
  update: (fields: Partial<BookingState>) => void;
}

const Step3_Itinerary: React.FC<Props> = ({ data, update }) => {
  const [activeCategory, setActiveCategory] = useState<'ALL' | CityPoint['type']>('ALL');

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

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
       <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Plan Your Route</h2>
        <p className="text-slate-500 text-sm">Select destinations to build your perfect day out.</p>
      </div>

      {/* Progress/Budget + Category Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 sticky top-[70px] z-30 space-y-3">
        <div>
          <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Time Budget</span>
              <span className="text-sm font-bold text-blue-600">{totalHours}h <span className="text-slate-400 font-normal">/ 8h used</span></span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                  className={`h-full rounded-full transition-all duration-500 ${totalHours > 8 ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min((totalDuration / (8 * 60)) * 100, 100)}%` }}
              />
          </div>
          {totalHours > 8 && (
              <p className="text-[10px] text-red-500 mt-1.5 font-medium text-right">You have exceeded the base 8h limit. Extra fees may apply.</p>
          )}
        </div>
        <div className="pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-2">
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
      </div>

      {/* Destination Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPoints.map((point) => (
            <div 
                key={point.id}
                onClick={() => togglePoint(point.id)}
                className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-md transition-all active:scale-95"
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
                <div className="absolute bottom-0 left-0 right-0 p-4 z-10 text-white">
                    <div className="flex justify-between items-end">
                        <div>
                            <span className="inline-block px-2 py-0.5 bg-white/20 backdrop-blur-md rounded text-[10px] font-bold uppercase tracking-wider mb-2">
                                {point.type}
                            </span>
                            <h3 className="text-lg font-bold leading-tight mb-1">{point.name}</h3>
                            <div className="flex items-center gap-1 text-xs text-white/80">
                                <Clock size={12} />
                                <span>~{point.duration} min</span>
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            point.selected ? 'bg-blue-500 text-white' : 'bg-white/20 backdrop-blur text-white hover:bg-white hover:text-slate-900'
                        }`}>
                            {point.selected ? <Check size={16} /> : <Plus size={16} />}
                        </div>
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default Step3_Itinerary;
