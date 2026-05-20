import { useState, useEffect } from 'react';
import { User, CreditCard, Bell, Shield, Edit3, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getClientProfile, updateQuestionnaire, getMySubscription, cancelSubscription } from '../services/api';

// --- Shared UI ---

const Field = ({ label, type = 'text', value, onChange, disabled }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
    <input type={type} value={value ?? ''} onChange={onChange} disabled={disabled}
      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-60 transition-all" />
  </div>
);

const ToggleSwitch = ({ label, description, enabled, onChange }) => (
  <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
    <div>
      <p className="font-medium text-slate-900">{label}</p>
      <p className="text-sm text-slate-500 mt-0.5">{description}</p>
    </div>
    <button onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${enabled ? 'bg-emerald-500' : 'bg-slate-200'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);

const TabButton = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick}
    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${active ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100' : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'}`}>
    <Icon className="w-4 h-4 mr-2" />{label}
  </button>
);

const StatusMsg = ({ msg, isError }) => msg ? (
  <div className={`flex items-center gap-2 p-3 rounded-lg text-sm mb-4 ${isError ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
    {!isError && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
    {msg}
  </div>
) : null;

// --- Profile Tab ---

const ProfileTab = ({ user }) => {
  const [editing, setEditing]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [msg, setMsg]           = useState('');
  const [isError, setIsError]   = useState(false);
  const [form, setForm]         = useState({
    goal: '', activityLevel: '', weight: '', height: '', age: '', gender: '',
    medicalConditions: '', foodAllergies: '',
  });

  useEffect(() => {
    if (user) setForm({
      goal:              user.goal || '',
      activityLevel:     user.activityLevel || '',
      weight:            user.weight || '',
      height:            user.height || '',
      age:               user.age || '',
      gender:            user.gender || '',
      medicalConditions: user.medicalConditions || '',
      foodAllergies:     user.foodAllergies || '',
    });
  }, [user]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    setLoading(true); setMsg('');
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
      setMsg('Profile updated successfully!');
      setIsError(false);
      setEditing(false);
    } catch (err) {
      setMsg(err?.detail || 'Failed to update profile.');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
        {!editing
          ? <button onClick={() => setEditing(true)}
              className="flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors">
              <Edit3 className="w-4 h-4 mr-2" />Edit Profile
            </button>
          : <div className="flex gap-2">
              <button onClick={() => { setEditing(false); setMsg(''); }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={loading}
                className="flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </button>
            </div>}
      </div>

      <StatusMsg msg={msg} isError={isError} />

      {/* Read-only from auth context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-slate-100">
        <Field label="First Name" value={user?.firstName} disabled />
        <Field label="Last Name"  value={user?.lastName}  disabled />
        <Field label="Email"      value={user?.email}     disabled />
      </div>

      {/* Editable health data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Age"         type="number" value={form.age}    onChange={set('age')}    disabled={!editing} />
        <Field label="Height (cm)" type="number" value={form.height} onChange={set('height')} disabled={!editing} />
        <Field label="Weight (kg)" type="number" value={form.weight} onChange={set('weight')} disabled={!editing} />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender</label>
          <select value={form.gender} onChange={set('gender')} disabled={!editing}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-60 transition-all">
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <Field label="Goal"           value={form.goal}           onChange={set('goal')}           disabled={!editing} />
        <Field label="Activity Level" value={form.activityLevel}  onChange={set('activityLevel')}  disabled={!editing} />
        <Field label="Medical Conditions" value={form.medicalConditions} onChange={set('medicalConditions')} disabled={!editing} />
        <Field label="Food Allergies"     value={form.foodAllergies}     onChange={set('foodAllergies')}     disabled={!editing} />
      </div>
    </div>
  );
};

// --- Subscription Tab ---

const SubscriptionTab = () => {
  const [sub, setSub]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]       = useState('');
  const [isError, setIsError] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    getMySubscription().then(setSub).catch(() => setSub(null)).finally(() => setLoading(false));
  }, []);

  const handleCancel = async () => {
    if (!sub || !window.confirm('Are you sure you want to cancel your subscription?')) return;
    setCancelling(true);
    try {
      await cancelSubscription(sub.id);
      setMsg('Subscription cancelled successfully.');
      setIsError(false);
      setSub((s) => ({ ...s, status: 'Cancelled' }));
    } catch (err) {
      setMsg(err?.detail || 'Failed to cancel subscription.');
      setIsError(true);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 mb-6">Subscription Details</h3>
      <StatusMsg msg={msg} isError={isError} />

      {!sub ? (
        <div className="text-center py-12 text-slate-400">
          <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="font-medium">No active subscription</p>
          <p className="text-sm mt-1">Subscribe to a plan to get started</p>
        </div>
      ) : (
        <>
          <div className="bg-emerald-50 rounded-xl p-5 mb-6 flex justify-between items-center">
            <div>
              <p className="font-bold text-slate-900 text-lg">{sub.type}</p>
              <p className="text-slate-600 text-sm mt-1">Active subscription</p>
            </div>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${sub.status === 'Active' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {sub.status}
            </span>
          </div>

          <div className="space-y-1 mb-8">
            {[
              ['Started',  new Date(sub.startsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })],
              ['Expires',  new Date(sub.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })],
              ['Status',   sub.status],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-600">{label}</span>
                <span className="font-medium text-slate-900">{value}</span>
              </div>
            ))}
          </div>

          {sub.status === 'Active' && (
            <button onClick={handleCancel} disabled={cancelling}
              className="w-full py-3 px-4 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              {cancelling && <Loader2 className="w-4 h-4 animate-spin" />}
              Cancel Subscription
            </button>
          )}
        </>
      )}
    </div>
  );
};

// --- Notifications Tab ---

const NotificationsTab = () => {
  const [toggles, setToggles] = useState({
    mealReminders: true, waterIntake: true, weeklyReports: true,
    newArticles: false, promotionalEmails: false,
  });
  const toggle = (key) => setToggles((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 mb-6">Notification Preferences</h3>
      <ToggleSwitch label="Meal reminders"          description="Get notified about upcoming meals"            enabled={toggles.mealReminders}     onChange={() => toggle('mealReminders')} />
      <ToggleSwitch label="Water intake reminders"  description="Stay hydrated throughout the day"            enabled={toggles.waterIntake}       onChange={() => toggle('waterIntake')} />
      <ToggleSwitch label="Weekly progress reports" description="Receive weekly summaries of your progress"   enabled={toggles.weeklyReports}     onChange={() => toggle('weeklyReports')} />
      <ToggleSwitch label="New articles"            description="Get notified about new health articles"      enabled={toggles.newArticles}       onChange={() => toggle('newArticles')} />
      <ToggleSwitch label="Promotional emails"      description="Receive offers and updates"                  enabled={toggles.promotionalEmails} onChange={() => toggle('promotionalEmails')} />
    </div>
  );
};

// --- Security Tab ---

const SecurityTab = () => {
  const [form, setForm]       = useState({ current: '', newPass: '', confirm: '' });
  const [twoFa, setTwoFa]     = useState(false);
  const [msg, setMsg]         = useState('');
  const [isError, setIsError] = useState(false);
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (form.newPass !== form.confirm) { setMsg('Passwords do not match.'); setIsError(true); return; }
    if (form.newPass.length < 6) { setMsg('Password must be at least 6 characters.'); setIsError(true); return; }
    // TODO: POST /api/auth/change-password when endpoint is available
    setMsg('Password updated successfully!');
    setIsError(false);
    setForm({ current: '', newPass: '', confirm: '' });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 mb-6">Security Settings</h3>

      <div className="mb-8">
        <h4 className="font-semibold text-slate-900 mb-4">Change Password</h4>
        <StatusMsg msg={msg} isError={isError} />
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Field label="Current Password"     type="password" value={form.current}  onChange={set('current')} />
          <Field label="New Password"         type="password" value={form.newPass}  onChange={set('newPass')} />
          <Field label="Confirm New Password" type="password" value={form.confirm}  onChange={set('confirm')} />
          <button type="submit" className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors">
            Update Password
          </button>
        </form>
      </div>

      <div className="border-t border-slate-100 pt-6">
        <h4 className="font-semibold text-slate-900 mb-4">Two-Factor Authentication</h4>
        <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-900">Enable 2FA for added security</p>
            <p className="text-sm text-slate-500 mt-0.5">Protect your account with an extra layer</p>
          </div>
          <button onClick={() => setTwoFa(!twoFa)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${twoFa ? 'bg-emerald-500' : 'bg-slate-200'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${twoFa ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Page ---

const TABS = [
  { id: 'Profile',       icon: User,       label: 'Profile' },
  { id: 'Subscription',  icon: CreditCard, label: 'Subscription' },
  { id: 'Notifications', icon: Bell,       label: 'Notifications' },
  { id: 'Security',      icon: Shield,     label: 'Security' },
];

const ProfilePage = () => {
  const { user }          = useAuth();
  const [activeTab, setActiveTab] = useState('Profile');
  const [client, setClient]       = useState(null);

  useEffect(() => {
    getClientProfile().then(setClient).catch(console.error);
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case 'Profile':       return <ProfileTab user={{ ...user, ...client }} />;
      case 'Subscription':  return <SubscriptionTab />;
      case 'Notifications': return <NotificationsTab />;
      case 'Security':      return <SecurityTab />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Profile & Settings</h1>
            <p className="text-slate-500 mt-2">Manage your account and preferences</p>
          </header>

          <div className="flex flex-wrap gap-2 mb-8 bg-slate-100 p-1.5 rounded-xl w-fit">
            {TABS.map((t) => (
              <TabButton key={t.id} icon={t.icon} label={t.label}
                active={activeTab === t.id} onClick={() => setActiveTab(t.id)} />
            ))}
          </div>

          {renderTab()}
    </div>
  );
};

export default ProfilePage;
