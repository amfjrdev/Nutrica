import { useEffect, useState } from 'react';
import { Target, Flame, Droplet, Trophy, TrendingUp, Calendar, CheckCircle2, Circle, Clock, FlaskConical, User } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getClientProfile, getMyPlansAsClient, getMyPayments } from '../services/api';
import { useNotifications } from '../hooks/useNotifications';
import NotificationPanel from '../components/NotificationPanel';

const StatCard = ({ icon: Icon, label, value, subValue }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-emerald-50 rounded-lg"><Icon className="w-5 h-5 text-emerald-600" /></div>
      <TrendingUp className="w-4 h-4 text-emerald-500" />
    </div>
    <p className="text-sm text-slate-500 mb-1">{label}</p>
    <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
    <p className="text-sm mt-1 font-medium text-emerald-500">{subValue}</p>
  </div>
);

const WeightChart = () => (
  <div className="w-full h-48 relative mt-4">
    <svg viewBox="0 0 400 150" className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" y1="30" x2="400" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
      <line x1="0" y1="75" x2="400" y2="75" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
      <line x1="0" y1="120" x2="400" y2="120" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
      <text x="-10" y="35" className="text-[10px] fill-slate-400">76</text>
      <text x="-10" y="80" className="text-[10px] fill-slate-400">74</text>
      <text x="-10" y="125" className="text-[10px] fill-slate-400">72</text>
      <path d="M 0 20 Q 50 25, 100 40 T 200 70 T 300 100 T 400 110 L 400 150 L 0 150 Z" fill="url(#chartGradient)" />
      <path d="M 0 20 Q 50 25, 100 40 T 200 70 T 300 100 T 400 110" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
    </svg>
    <div className="flex justify-between mt-2 px-1 text-xs text-slate-400">
      {['Week 1','Week 2','Week 3','Week 4','Week 5','Week 6'].map(w => <span key={w}>{w}</span>)}
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [client, setClient]   = useState(null);
  const [plans, setPlans]     = useState([]);
  const [payments, setPayments] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const showPendingBanner = searchParams.get('payment') === 'pending';
  const isTestMode        = searchParams.get('mode') === 'test';
  const { notifications, loading: nLoading, unreadCount, markRead, markAllRead } = useNotifications();

  useEffect(() => {
    getClientProfile().then(setClient).catch(console.error);
    getMyPlansAsClient().then(setPlans).catch(console.error);
    getMyPayments().then(setPayments).catch(console.error);
  }, []);

  const dismissBanner = () => {
    searchParams.delete('payment');
    searchParams.delete('mode');
    setSearchParams(searchParams);
  };

  const hasApprovedPayment = payments.some((p) => p.status === 'Succeeded');

  return (
    <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Welcome Back!</h1>
            <p className="text-slate-500 mt-1">Here's your health overview for today</p>
          </header>

          {showPendingBanner && (
            <div className={`mb-8 rounded-xl p-4 flex items-start justify-between gap-4 border ${
              isTestMode
                ? 'bg-violet-50 border-violet-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-start gap-3">
                {isTestMode
                  ? <FlaskConical className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
                  : <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />}
                <div>
                  <p className={`font-semibold text-sm ${isTestMode ? 'text-violet-800' : 'text-amber-800'}`}>
                    {isTestMode
                      ? 'Payment received (TEST MODE). Awaiting admin approval.'
                      : 'Payment successful. Awaiting admin approval.'}
                  </p>
                  <p className={`text-sm mt-0.5 ${isTestMode ? 'text-violet-700' : 'text-amber-700'}`}>
                    Your subscription is currently <span className="font-bold">Pending</span>. Premium features will be unlocked once an admin approves your payment.
                  </p>
                </div>
              </div>
              <button onClick={dismissBanner} className={`text-lg font-bold flex-shrink-0 ${isTestMode ? 'text-violet-400 hover:text-violet-600' : 'text-amber-400 hover:text-amber-600'}`}>&times;</button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={Target}  label="Current Weight"   value={client?.weight ? `${client.weight} kg` : '—'} subValue={client?.goal || '—'} />
            <StatCard icon={Flame}   label="Today's Calories" value="1,450"   subValue="350 remaining" />
            <StatCard icon={Droplet} label="Water Intake"     value="6 / 8"   subValue="glasses" />
            <StatCard icon={Trophy}  label="Active Plans"     value={plans.length || '0'} subValue="nutrition plans" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Weight Progress</h3>
              <WeightChart />
              <div className="mt-6 bg-emerald-50 p-4 rounded-lg flex items-start">
                <div className="bg-white p-1 rounded-full mr-3 shadow-sm">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-sm text-slate-700">
                  <span className="font-semibold text-emerald-700">Great progress!</span>{' '}
                  {client?.goal ? `Goal: ${client.goal}` : 'Keep tracking your progress!'}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Questionnaire Summary — shown after payment approved */}
              {hasApprovedPayment && client?.questionnaireCompleted && (
                <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-sm">
                  <h3 className="font-bold text-slate-900 flex items-center mb-4">
                    <User className="w-5 h-5 mr-2 text-emerald-500" />
                    My Health Profile
                  </h3>
                  <div className="space-y-2">
                    {[
                      ['Goal',           client.goal],
                      ['Activity',       client.activityLevel],
                      ['Weight',         client.weight ? `${client.weight} kg` : null],
                      ['Height',         client.height ? `${client.height} cm` : null],
                      ['Age',            client.age],
                      ['Gender',         client.gender],
                      ['Medical',        client.medicalConditions || 'None'],
                      ['Allergies',      client.foodAllergies || 'None'],
                    ].map(([label, value]) => value ? (
                      <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                        <span className="text-xs text-slate-500">{label}</span>
                        <span className="text-xs font-medium text-slate-900">{value}</span>
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}

              {/* Nutrition Plans */}
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-900 flex items-center mb-6">
                  <Calendar className="w-5 h-5 mr-2 text-slate-500" />
                  My Nutrition Plans
                </h3>
                {plans.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No plans assigned yet.</p>
                ) : (
                  <div className="space-y-3">
                    {plans.map((plan) => (
                      <Link to="/my-plan" key={plan.id}
                        className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-lg px-2 transition-colors">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${plan.status === 'Approved' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                            {plan.status === 'Approved'
                              ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              : <Circle className="w-5 h-5 text-slate-400" />}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{plan.title}</p>
                            <p className="text-xs text-slate-500">{plan.status}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <NotificationPanel
              notifications={notifications}
              loading={nLoading}
              unreadCount={unreadCount}
              markRead={markRead}
              markAllRead={markAllRead}
            />
          </div>
    </div>
  );
};

export default Dashboard;
