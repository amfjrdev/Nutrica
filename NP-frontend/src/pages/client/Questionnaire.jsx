import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Target, Heart, CheckCircle, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { updateQuestionnaire } from '../../services/api';

// --- Progress Bar ---
const ProgressBar = ({ current, total }) => (
  <div className="mb-8">
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm font-medium text-slate-600">Step {current} of {total}</span>
      <span className="text-sm font-medium text-emerald-600">{Math.round((current / total) * 100)}%</span>
    </div>
    <div className="w-full bg-slate-100 rounded-full h-2">
      <div
        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
        style={{ width: `${(current / total) * 100}%` }}
      />
    </div>
  </div>
);

// --- Field Components ---
const Field = ({ label, type = 'text', value, onChange, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
    />
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
    >
      <option value="">Select...</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

const TextArea = ({ label, value, onChange, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={3}
      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
    />
  </div>
);

// --- Step Configs ---
const STEPS = [
  { icon: User,   title: 'Personal Info',  subtitle: 'Tell us about yourself' },
  { icon: Target, title: 'Your Goals',     subtitle: 'What do you want to achieve?' },
  { icon: Heart,  title: 'Health Details', subtitle: 'Help us personalize your plan' },
  { icon: CheckCircle, title: 'Review',    subtitle: 'Confirm your information' },
];

const GOALS = [
  { value: 'Lose weight',      label: 'Lose Weight' },
  { value: 'Gain muscle',      label: 'Gain Muscle' },
  { value: 'Maintain weight',  label: 'Maintain Weight' },
  { value: 'Improve health',   label: 'Improve Overall Health' },
  { value: 'Eat healthier',    label: 'Eat Healthier' },
];

const ACTIVITY_LEVELS = [
  { value: 'Sedentary',         label: 'Sedentary (little or no exercise)' },
  { value: 'Lightly active',    label: 'Lightly Active (1-3 days/week)' },
  { value: 'Moderately active', label: 'Moderately Active (3-5 days/week)' },
  { value: 'Very active',       label: 'Very Active (6-7 days/week)' },
  { value: 'Extra active',      label: 'Extra Active (physical job)' },
];

const GENDERS = [
  { value: 'Male',   label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other',  label: 'Other' },
];

// --- Main Component ---
const QuestionnairePage = () => {
  const navigate = useNavigate();
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const [form, setForm] = useState({
    age: '', gender: '', weight: '', height: '',
    goal: '', activityLevel: '',
    medicalConditions: '', foodAllergies: '',
  });

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const validateStep = () => {
    if (step === 1) {
      if (!form.age || !form.gender || !form.weight || !form.height) {
        setError('Please fill in all fields.'); return false;
      }
    }
    if (step === 2) {
      if (!form.goal || !form.activityLevel) {
        setError('Please select your goal and activity level.'); return false;
      }
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError('');
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await updateQuestionnaire({
        goal:              form.goal,
        activityLevel:     form.activityLevel,
        weight:            parseFloat(form.weight),
        height:            parseFloat(form.height),
        age:               parseInt(form.age),
        gender:            form.gender,
        medicalConditions: form.medicalConditions || null,
        foodAllergies:     form.foodAllergies || null,
      });
      navigate('/dashboard?payment=pending');
    } catch (err) {
      setError(err?.detail || 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ReviewRow = ({ label, value }) => (
    <div className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 text-sm">{label}</span>
      <span className="font-medium text-slate-900 text-sm">{value || '—'}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-100 rounded-2xl mb-4">
            {(() => { const Icon = STEPS[step - 1].icon; return <Icon className="w-7 h-7 text-emerald-600" />; })()}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{STEPS[step - 1].title}</h1>
          <p className="text-slate-500 mt-1">{STEPS[step - 1].subtitle}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <ProgressBar current={step} total={4} />

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Step 1 — Personal Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Age" type="number" value={form.age} onChange={set('age')} placeholder="25" />
                <SelectField label="Gender" value={form.gender} onChange={set('gender')} options={GENDERS} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Weight (kg)" type="number" value={form.weight} onChange={set('weight')} placeholder="70" />
                <Field label="Height (cm)" type="number" value={form.height} onChange={set('height')} placeholder="175" />
              </div>
            </div>
          )}

          {/* Step 2 — Goals */}
          {step === 2 && (
            <div className="space-y-5">
              <SelectField label="What is your main goal?" value={form.goal} onChange={set('goal')} options={GOALS} />
              <SelectField label="Activity Level" value={form.activityLevel} onChange={set('activityLevel')} options={ACTIVITY_LEVELS} />
            </div>
          )}

          {/* Step 3 — Health Details */}
          {step === 3 && (
            <div className="space-y-5">
              <TextArea
                label="Medical Conditions (optional)"
                value={form.medicalConditions}
                onChange={set('medicalConditions')}
                placeholder="e.g. Diabetes, Hypertension..."
              />
              <TextArea
                label="Food Allergies (optional)"
                value={form.foodAllergies}
                onChange={set('foodAllergies')}
                placeholder="e.g. Nuts, Gluten, Dairy..."
              />
            </div>
          )}

          {/* Step 4 — Review */}
          {step === 4 && (
            <div>
              <ReviewRow label="Age"                value={form.age} />
              <ReviewRow label="Gender"             value={form.gender} />
              <ReviewRow label="Weight"             value={form.weight ? `${form.weight} kg` : ''} />
              <ReviewRow label="Height"             value={form.height ? `${form.height} cm` : ''} />
              <ReviewRow label="Goal"               value={form.goal} />
              <ReviewRow label="Activity Level"     value={form.activityLevel} />
              <ReviewRow label="Medical Conditions" value={form.medicalConditions || 'None'} />
              <ReviewRow label="Food Allergies"     value={form.foodAllergies || 'None'} />
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button onClick={handleBack}
                className="flex items-center px-5 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </button>
            ) : <div />}

            {step < 4 ? (
              <button onClick={handleNext}
                className="flex items-center px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors shadow-sm">
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="flex items-center px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-lg font-medium transition-colors shadow-sm">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Complete Setup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionnairePage;
