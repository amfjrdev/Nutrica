import { useState, useEffect } from 'react';
import { Star, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getNutritionistProfile, updateNutritionistProfile, getNutritionistClients, getMyPlansAsNutritionist } from '../../services/api';

const InputField = ({ label, value, onChange, type = 'text', disabled }) => (
  <div className="mb-5">
    <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
    <input type={type} value={value} onChange={onChange} disabled={disabled}
      className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-60 transition-all" />
  </div>
);

const TextAreaField = ({ label, value, onChange, disabled }) => (
  <div className="mb-5">
    <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
    <textarea rows={4} value={value} onChange={onChange} disabled={disabled}
      className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-60 transition-all resize-none" />
  </div>
);

const StatItem = ({ label, value, isRating = false }) => (
  <div className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
    <span className="text-slate-600 font-medium">{label}</span>
    <div className="flex items-center font-bold text-slate-900">
      {value}
      {isRating && <Star className="w-5 h-5 text-yellow-400 fill-current ml-1" />}
    </div>
  </div>
);

const NutritionistProfile = () => {
  const { user }              = useAuth();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState('');
  const [isError, setIsError] = useState(false);
  const [stats, setStats]     = useState({ clients: '—', plans: '—' });
  const [form, setForm]       = useState({ bio: '', specialization: '', certificateUrl: '' });

  useEffect(() => {
    getNutritionistProfile()
      .then((p) => setForm({ bio: p.bio || '', specialization: p.specialization || '', certificateUrl: p.certificateUrl || '' }))
      .catch(console.error);

    Promise.all([getNutritionistClients(), getMyPlansAsNutritionist()])
      .then(([clients, plans]) => setStats({ clients: clients.length, plans: plans.length }))
      .catch(console.error);
  }, []);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      await updateNutritionistProfile({ bio: form.bio, specialization: form.specialization, certificateUrl: form.certificateUrl || null });
      setMsg('Profile updated successfully!');
      setIsError(false);
    } catch (err) {
      setMsg(err?.detail || 'Failed to update profile.');
      setIsError(true);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
            <p className="text-slate-500 mt-2">Manage your professional profile</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left: Professional Information */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Professional Information</h3>

              {msg && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm mb-6 ${isError ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                  {!isError && <CheckCircle className="w-4 h-4 flex-shrink-0" />}{msg}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Read-only from JWT */}
                <InputField label="Full Name"  value={`${user?.firstName || ''} ${user?.lastName || ''}`} disabled />
                <InputField label="Email"      value={user?.email || ''} type="email" disabled />

                {/* Editable */}
                <InputField label="Specialization" value={form.specialization} onChange={set('specialization')}
                  placeholder="e.g. Clinical Nutrition, Sports Nutrition" />
                <TextAreaField label="Bio" value={form.bio} onChange={set('bio')} />
                <InputField label="Certificate URL (optional)" value={form.certificateUrl} onChange={set('certificateUrl')}
                  placeholder="https://example.com/certificate.pdf" />

                <button type="submit" disabled={loading}
                  className="mt-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Update Profile
                </button>
              </form>
            </div>

            {/* Right: Statistics */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm h-fit">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Statistics</h3>
              <div className="space-y-1">
                <StatItem label="Total Clients"      value={stats.clients} />
                <StatItem label="Plans Created"      value={stats.plans} />
                <StatItem label="Average Rating"     value="—" isRating />
              </div>
            </div>

          </div>
    </div>
  );
};

export default NutritionistProfile;
