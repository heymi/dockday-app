import React from 'react';
import { CheckCircle2, ClipboardList, Home, RotateCcw } from 'lucide-react';
import { BookingState } from '../types';

interface Props {
  data: BookingState;
  onDone: () => void;
  onNew: () => void;
  onViewOrders: () => void;
}

const Step3_ShiftSubmitted: React.FC<Props> = ({ data, onDone, onNew, onViewOrders }) => {
  return (
    <div className="space-y-6 animate-fadeIn pb-28">
      <div className="text-center space-y-3">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
          <CheckCircle2 size={28} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">已提交</h2>
        <p className="text-slate-500 text-sm">换班订单已创建（本地演示）。</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2 text-sm">
        <div className="text-slate-500">Summary</div>
        <div className="flex justify-between">
          <span className="text-slate-600">人数</span>
          <span className="font-semibold text-slate-900">{data.groupSize || 1}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">车辆</span>
          <span className="font-semibold text-slate-900">{data.carCount || 1}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">接送</span>
          <span className="font-semibold text-slate-900">{data.transferType === 'airport' ? '接机' : '接船'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">用餐</span>
          <span className="font-semibold text-slate-900">
            {data.needMeal ? `${data.mealPlan === 'premium' ? 'Premium' : 'Standard'} · ${data.mealCount || data.groupSize || 1}` : 'No'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">酒店</span>
          <span className="font-semibold text-slate-900">{data.needHotel ? `${data.hotelName || 'Hotel'} · ${data.hotelNights || 1} 晚` : '无'}</span>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] z-40 pb-safe">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-2">
          <button
            onClick={onNew}
            className="flex-1 h-12 px-4 rounded-xl font-semibold text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 bg-blue-600 hover:bg-blue-700 shadow-blue-200"
          >
            <RotateCcw size={16} />
            再下一单
          </button>
          <button
            onClick={onViewOrders}
            className="h-12 px-4 rounded-xl font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-200 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <ClipboardList size={16} />
            查看订单
          </button>
          <button
            onClick={onDone}
            className="col-span-2 h-12 px-4 rounded-xl font-semibold text-slate-900 border border-slate-200 bg-white shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Home size={16} />
            返回
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step3_ShiftSubmitted;
