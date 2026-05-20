import { Check } from 'lucide-react';

const PlanOption = ({ title, subtitle, price, isSelected, onSelect, isPopular }) => (
  <div
    onClick={onSelect}
    className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between ${
      isSelected
        ? 'border-emerald-500 bg-emerald-50'
        : 'border-slate-200 bg-white hover:border-slate-300'
    }`}
  >
    <div>
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-bold text-slate-900">{title}</h3>
        {isPopular && (
          <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
            Popular
          </span>
        )}
      </div>
      <p className="text-sm text-slate-500">{subtitle}</p>
    </div>

    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-emerald-500' : 'bg-white border-2 border-slate-300'}`}>
      {isSelected && <Check className="w-4 h-4 text-white" />}
    </div>
  </div>
);

export default PlanOption;
