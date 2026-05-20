import { useState, useEffect } from 'react';
import { Search, Ban, UserCheck, Loader2, Users } from 'lucide-react';
import { getAllUsers, suspendUser, activateUser } from '../../services/api';

const UserRow = ({ user, onToggle, actionId }) => {
  const isBusy = actionId === user.id;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-200 transition-colors">
      {/* Avatar + info */}
      <div className="flex items-center mb-4 sm:mb-0">
        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-4 flex-shrink-0">
          {user.firstName[0]}
        </div>
        <div>
          <h4 className="font-semibold text-slate-900">{user.firstName} {user.lastName}</h4>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
      </div>

      {/* Joined */}
      <div className="flex flex-col sm:items-end gap-1 mb-4 sm:mb-0">
        <p className="text-xs text-slate-500">Joined</p>
        <p className="text-sm font-medium text-slate-900">
          {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Status + action */}
      <div className="flex items-center gap-4">
        <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide ${user.isSuspended ? 'bg-red-100 text-red-600' : 'bg-emerald-500 text-white'}`}>
          {user.isSuspended ? 'Suspended' : 'Active'}
        </span>
        <button onClick={() => onToggle(user)} disabled={!!actionId || user.role === 'Admin'}
          className="flex items-center px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 rounded-lg text-sm font-medium transition-colors">
          {isBusy
            ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            : user.isSuspended
              ? <UserCheck className="w-4 h-4 mr-2" />
              : <Ban className="w-4 h-4 mr-2" />}
          {user.isSuspended ? 'Activate' : 'Suspend'}
        </button>
      </div>
    </div>
  );
};

const AdminUsers = () => {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [actionId, setActionId] = useState(null);
  const [search, setSearch]     = useState('');
  const [activeTab, setActiveTab] = useState('clients');

  useEffect(() => {
    getAllUsers()
      .then(setUsers)
      .catch((err) => {
        console.error(err);
        setError(err?.detail || err?.title || 'Failed to load users. Make sure you are logged in as Admin.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (user) => {
    setActionId(user.id);
    try {
      if (user.isSuspended) {
        await activateUser(user.id);
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isSuspended: false, isActive: true } : u));
      } else {
        await suspendUser(user.id);
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isSuspended: true, isActive: false } : u));
      }
    } catch (e) { console.error(e); }
    finally { setActionId(null); }
  };

  const clients       = users.filter((u) => u.role === 'Client');
  const nutritionists  = users.filter((u) => u.role === 'Nutritionist');
  const displayed    = (activeTab === 'clients' ? clients : nutritionists)
    .filter((u) => !search ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
            <p className="text-slate-500 mt-2">Manage clients and nutritionists</p>
          </header>

          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            {[
              { key: 'clients',      label: `Clients (${clients.length})` },
              { key: 'nutritionists', label: `Nutritionists (${nutritionists.length})` },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === key ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:bg-slate-100'}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <h3 className="text-lg font-bold text-slate-900 capitalize">{activeTab === 'clients' ? 'Client' : 'Nutritionist'} List</h3>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input type="text" placeholder={`Search ${activeTab}...`} value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all" />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-xl">{error}</div>
              </div>
            ) : displayed.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No {activeTab} found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayed.map((user) => (
                  <UserRow key={user.id} user={user} onToggle={handleToggle} actionId={actionId} />
                ))}
              </div>
            )}
          </div>
    </div>
  );
};

export default AdminUsers;
