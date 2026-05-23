import { useState, useEffect } from 'react';
import { Search, Eye, Users, Loader2, X } from 'lucide-react';
import { getNutritionistClients, getClientQuestionnaire, getNutritionistAppointments, getMyPlansAsNutritionist } from '../../services/api';

const StatCard = ({ label, value, highlight = false }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
    <p className="text-sm text-slate-500 mb-2">{label}</p>
    <p className={`text-3xl font-bold ${highlight ? 'text-emerald-500' : 'text-slate-900'}`}>{value}</p>
  </div>
);

const ClientModal = ({ client, onClose }) => {
  const [q, setQ] = useState(null);
  useEffect(() => {
    getClientQuestionnaire(client.clientId).then(setQ).catch(console.error);
  }, [client.clientId]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              {client.firstName[0]}
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{client.firstName} {client.lastName}</h3>
              <p className="text-sm text-slate-500">{client.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {!q ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-emerald-500 animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Goal',              q.goal || '—'],
                ['Activity Level',    q.activityLevel || '—'],
                ['Weight',            q.weight ? `${q.weight} kg` : '—'],
                ['Height',            q.height ? `${q.height} cm` : '—'],
                ['Age',               q.age || '—'],
                ['Gender',            q.gender || '—'],
                ['Medical Conditions',q.medicalConditions || 'None'],
                ['Food Allergies',    q.foodAllergies || 'None'],
              ].map(([label, value]) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  <p className="font-semibold text-slate-900 text-sm">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const NutritionistDashboard = () => {
  const [clients, setClients]           = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [plans, setPlans]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    Promise.all([
      getNutritionistClients(),
      getNutritionistAppointments(),
      getMyPlansAsNutritionist(),
    ]).then(([c, a, p]) => { setClients(c); setAppointments(a); setPlans(p); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered     = clients.filter((c) =>
    !searchQuery ||
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const pendingAppts  = appointments.filter((a) => a.status === 'Pending').length;
  const approvedAppts = appointments.filter((a) => a.status === 'Approved').length;

  return (
    <div className="max-w-7xl mx-auto">
      {selectedClient && <ClientModal client={selectedClient} onClose={() => setSelectedClient(null)} />}
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">My Clients</h1>
            <p className="text-slate-500 mt-2">Manage and monitor your client progress</p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard label="Total Clients"        value={loading ? '—' : clients.length} />
            <StatCard label="Active Plans"          value={loading ? '—' : plans.length} />
            <StatCard label="Pending Appointments"  value={loading ? '—' : pendingAppts} />
            <StatCard label="Approved Sessions"     value={loading ? '—' : approvedAppts} highlight />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <h3 className="text-lg font-bold text-slate-900">Client List</h3>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input type="text" placeholder="Search clients..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all" />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No clients yet</p>
                <p className="text-sm mt-1">Clients appear once you assign them a nutrition plan</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((client) => (
                  <div key={client.clientId}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-emerald-200 transition-colors">
                    <div className="flex items-center mb-4 md:mb-0">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mr-4">
                        {client.firstName[0]}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{client.firstName} {client.lastName}</h4>
                        <p className="text-sm text-slate-500">{client.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-6 md:gap-10 text-sm">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Goal</p>
                        <p className="font-medium text-slate-900">{client.goal || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Activity</p>
                        <p className="font-medium text-slate-900">{client.activityLevel || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Questionnaire</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${client.questionnaireCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {client.questionnaireCompleted ? 'Complete' : 'Pending'}
                        </span>
                      </div>
                      <button onClick={() => setSelectedClient(client)}
                        className="flex items-center px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors">
                        <Eye className="w-4 h-4 mr-2" />View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          </div>
    </div>
  );
};

export default NutritionistDashboard;
