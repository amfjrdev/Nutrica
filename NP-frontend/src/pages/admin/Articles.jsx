import { useState, useEffect } from 'react';
import { Loader2, BookOpen, Trash2, Eye, Search, Filter } from 'lucide-react';
import { getApprovedPosts, deletePost } from '../../services/api';
import ArticleModal from '../../components/articles/ArticleModal';

const STATUS_COLOR = {
  Approved:        'bg-emerald-100 text-emerald-700',
  PendingApproval: 'bg-amber-100 text-amber-700',
  Rejected:        'bg-red-100 text-red-700',
};

const FILTERS = ['All', 'Approved', 'PendingApproval', 'Rejected'];

const ConfirmModal = ({ title, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Trash2 className="w-6 h-6 text-red-500" />
      </div>
      <h3 className="font-bold text-slate-900 text-center mb-2">Delete Article</h3>
      <p className="text-sm text-slate-500 text-center mb-6">
        Are you sure you want to delete <span className="font-semibold text-slate-700">"{title}"</span>? This cannot be undone.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Delete
        </button>
      </div>
    </div>
  </div>
);

const AdminArticles = () => {
  const [posts, setPosts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('All');
  const [selected, setSelected]   = useState(null);
  const [toDelete, setToDelete]   = useState(null);
  const [deleting, setDeleting]   = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    getApprovedPosts()
      .then(setPosts)
      .catch(() => setError('Failed to load articles.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePost(toDelete.id);
      setPosts(prev => prev.filter(p => p.id !== toDelete.id));
      setToDelete(null);
    } catch {
      setError('Failed to delete article.');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = posts
    .filter(p => filter === 'All' || p.status === filter)
    .filter(p =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.authorRole.toLowerCase().includes(search.toLowerCase())
    );

  const counts = {
    All:            posts.length,
    Approved:       posts.filter(p => p.status === 'Approved').length,
    PendingApproval:posts.filter(p => p.status === 'PendingApproval').length,
    Rejected:       posts.filter(p => p.status === 'Rejected').length,
  };

  return (
    <div className="max-w-6xl mx-auto">
      {toDelete && (
        <ConfirmModal
          title={toDelete.title}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
      {selected && <ArticleModal post={selected} onClose={() => setSelected(null)} />}

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Manage Articles</h1>
        <p className="text-slate-500 mt-2">View and delete all platform articles</p>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`p-4 rounded-2xl border text-left transition-all ${filter === f ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
            <p className={`text-2xl font-extrabold ${filter === f ? 'text-emerald-600' : 'text-slate-900'}`}>{counts[f]}</p>
            <p className="text-xs text-slate-500 mt-0.5">{f === 'PendingApproval' ? 'Pending' : f}</p>
          </button>
        ))}
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or author role..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white">
            {FILTERS.map(f => <option key={f} value={f}>{f === 'PendingApproval' ? 'Pending' : f} ({counts[f]})</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-xl mb-6">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No articles found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Article</th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Author</th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(post => (
                <tr key={post.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {post.imageUrl
                        ? <img src={post.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        : <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-emerald-400" />
                          </div>
                      }
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate max-w-xs">{post.title}</p>
                        <p className="text-xs text-slate-400 truncate max-w-xs">{post.content?.slice(0, 60)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <span className="text-sm text-slate-600">{post.authorRole}</span>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="text-sm text-slate-500">
                      {new Date(post.createdAt).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[post.status] || 'bg-slate-100 text-slate-600'}`}>
                      {post.status === 'PendingApproval' ? 'Pending' : post.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setSelected(post)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-emerald-100 flex items-center justify-center transition-colors group">
                        <Eye className="w-4 h-4 text-slate-500 group-hover:text-emerald-600" />
                      </button>
                      <button onClick={() => setToDelete(post)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-100 flex items-center justify-center transition-colors group">
                        <Trash2 className="w-4 h-4 text-slate-500 group-hover:text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
            Showing {filtered.length} of {posts.length} articles
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminArticles;
