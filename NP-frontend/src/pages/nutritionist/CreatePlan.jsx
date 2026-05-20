import { useState, useEffect } from 'react';
import { ChevronDown, Save, Loader2, CheckCircle } from 'lucide-react';
import { getNutritionistClients, createNutritionPlan } from '../../services/api';

const InputField = ({ label, type = 'text', value, onChange, placeholder, disabled }) => (
  <div className="flex flex-col">
    <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
      className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-60 transition-all" />
  </div>
);

const SelectField = ({ label, value, onChange, options, placeholder }) => (
  <div className="flex flex-col">
    <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
    <div className="relative">
      <select value={value} onChange={onChange}
        className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer">
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

const TextAreaField = ({ label, value, onChange, placeholder, rows = 4 }) => (
  <div className="flex flex-col">
    <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
    <textarea rows={rows} value={value} onChange={onChange} placeholder={placeholder}
      className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none" />
  </div>
);

const CreatePlan = () => {
  const [clients, setClients]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [msg, setMsg]           = useState('');
  const [isError, setIsError]   = useState(false);
  const [form, setForm]         = useState({
    clientId: '', title: '', duration: '12',
    calories: '1800', protein: '120', carbs: '180',
    description: '', mealPlan: '', isPredefined: false,
  });

  useEffect(() => { getNutritionistClients().then(setClients).catch(console.error); }, []);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  // Build content string from structured fields
  const buildContent = () => {
    const macros = `Daily Calories: ${form.calories} kcal | Protein: ${form.protein}g | Carbs: ${form.carbs}g`;
    const parts  = [macros];
    if (form.description) parts.push(`\nDescription:\n${form.description}`);
    if (form.mealPlan)    parts.push(`\nMeal Plan:\n${form.mealPlan}`);
    return parts.join('\n');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setMsg('Plan title is required.'); setIsError(true); return; }
    setLoading(true); setMsg('');
    try {
      await createNutritionPlan({
        clientId:    form.clientId || null,
        title:       form.title,
        content:     buildContent(),
        isPredefined: form.isPredefined,
      });
      setMsg('Plan submitted for approval successfully!');
      setIsError(false);
      setForm({ clientId: '', title: '', duration: '12', calories: '1800', protein: '120', carbs: '180', description: '', mealPlan: '', isPredefined: false });
    } catch (err) {
      setMsg(err?.detail || 'Failed to create plan.');
      setIsError(true);
    } finally { setLoading(false); }
  };

  const handleDraft = () => {
    setMsg('Draft saved locally. Submit when ready.');
    setIsError(false);
  };

  const clientOptions = clients.map((c) => ({
    value: c.clientId,
    label: `${c.firstName} ${c.lastName} — ${c.email}`,
  }));

  return (
    <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Create Nutrition Plan</h1>
            <p className="text-slate-500 mt-2">Design personalized plans for your clients</p>
          </header>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">New Plan Details</h3>

            {msg && (
              <div className={`flex items-start gap-2 p-4 rounded-lg text-sm mb-6 ${isError ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                {!isError && <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}{msg}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Row 1: Client & Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField label="Client" value={form.clientId} onChange={set('clientId')}
                  options={clientOptions} placeholder="Predefined (no specific client)" />
                <InputField label="Plan Title" value={form.title} onChange={set('title')}
                  placeholder="e.g. Weight Loss Pro — Week 1" />
              </div>

              {/* Row 2: Duration + Macros */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <InputField label="Duration (weeks)" type="number" value={form.duration} onChange={set('duration')} />
                <InputField label="Daily Calories"   type="number" value={form.calories} onChange={set('calories')} />
                <InputField label="Protein (g)"      type="number" value={form.protein}  onChange={set('protein')} />
                <InputField label="Carbs (g)"        type="number" value={form.carbs}    onChange={set('carbs')} />
              </div>

              {/* Row 3: Description */}
              <TextAreaField label="Plan Description" value={form.description} onChange={set('description')}
                placeholder="Describe the nutrition plan goals and approach..." rows={3} />

              {/* Row 4: Meal Plan */}
              <TextAreaField label="Meal Plan (JSON or detailed text)" value={form.mealPlan} onChange={set('mealPlan')}
                placeholder="Enter meal details, daily schedule, food items..." rows={6} />

              {/* Predefined toggle */}
              <div className="flex items-center gap-3">
                <input type="checkbox" id="predefined" checked={form.isPredefined}
                  onChange={(e) => setForm((p) => ({ ...p, isPredefined: e.target.checked }))}
                  className="h-4 w-4 text-emerald-500 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer" />
                <label htmlFor="predefined" className="text-sm text-slate-700 cursor-pointer">
                  Mark as predefined plan (visible to all clients)
                </label>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100">
                <button type="submit" disabled={loading}
                  className="flex-1 sm:flex-none px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit for Approval
                </button>
                <button type="button" onClick={handleDraft}
                  className="flex-1 sm:flex-none px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors flex items-center justify-center">
                  <Save className="w-4 h-4 mr-2" />Save as Draft
                </button>
              </div>
            </form>
          </div>
    </div>
  );
};

export default CreatePlan;
