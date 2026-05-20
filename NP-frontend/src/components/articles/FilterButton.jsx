const FilterButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
      active
        ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
        : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-600'
    }`}
  >
    {label}
  </button>
);

export default FilterButton;
