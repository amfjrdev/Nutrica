import { useState, useEffect } from 'react';
import { Loader2, ClipboardList, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { getNutritionistClients, getClientQuestionnaire } from '../../services/api';

const FIELDS = [
  ['Goal',               'goal'],
  ['Activity Level',     'activityLevel'],
  ['Weight',             'weight',  (v) => v ? `${v} kg` : '—'],
  ['Height',             'height',  (v) => v ? `${v} cm` : '—'],
  ['Age',                'age'],
  ['Gender',             'gender'],
  ['Medical Conditions', 'medicalConditions'],
  ['Food Allergies',     'foodAllergies'],
];

const ClientRow = ({ client }) => {
  const [open, setOpen]         = useState(false);
  const [q, setQ]               = useState(null);
  const [loading, setLoading]   = useState(false);

  const handleToggle = async () => {
    if (!open && !q) {
      setLoading(true);
      try { setQ(await getClientQuestionnaire(client.clientId)); }
      catch { setQ({}); }
      finally { setLoading(false); }
    }
    setOpen((o) => !o);
  };

  return (
    <div className="border-b border-slate-100 last:border-0">
      <button onClick={handleToggle}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
            {client.firstName[0]}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{client.firstName} {client.lastName}</p>
            <p className="text-sm text-slate-500">{client.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            client.questionnaireCompleted
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-500'
          }`}>
            {client.questionnaireCompleted ? 'Completed' : 'Pending'}
          </span>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
            </div>
          ) : !client.questionnaireCompleted ? (
            <p className="text-sm text-slate-400 py-4 text-center">Client has not completed the questionnaire yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {FIELDS.map(([label, key, fmt]) => {
                const raw = q?.[key];
                const val = fmt ? fmt(raw) : (raw || '—');
                return (
                  <div key={key} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1">{label}</p>
                    <p className="font-semibold text-slate-900 text-sm">{val}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ClientAnswers = () => {
  const [clients, setClients]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showOnly, setShowOnly] = useState('all'); // 'all' | 'completed' | 'pending'

  useEffect(() => {
    getNutritionistClients()
      .then(setClients)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = clients.filter((c) => {
    if (showOnly === 'completed') return c.questionnaireCompleted;
    if (showOnly === 'pending')   return !c.questionnaireCompleted;
    return true;
  });

  const completedCount = clients.filter((c) => c.questionnaireCompleted).length;

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Client Answers</h1>
        <p className="text-slate-500 mt-2">View questionnaire submissions from your clients</p>
      </header>

      {/* Summary + filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-4 text-sm">
          <span className="text-slate-500">Total: <strong className="text-slate-900">{clients.length}</strong></span>
          <span className="text-emerald-600">Completed: <strong>{completedCount}</strong></span>
          <span className="text-slate-400">Pending: <strong>{clients.length - completedCount}</strong></span>
        </div>
        <div className="flex gap-2">
          {[['all', 'All'], ['completed', 'Completed'], ['pending', 'Pending']].map(([key, label]) => (
            <button key={key} onClick={() => setShowOnly(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                showOnly === key
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  : 'bg-white text-slate-600 border-transparent hover:bg-slate-50'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No clients found</p>
            <p className="text-sm mt-1">Clients appear once they complete the questionnaire</p>
          </div>
        ) : (
          filtered.map((client) => <ClientRow key={client.clientId} client={client} />)
        )}
      </div>
    </div>
  );
};

export default ClientAnswers;
