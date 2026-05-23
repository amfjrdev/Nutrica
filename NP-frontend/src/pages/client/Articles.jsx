import { useState, useEffect } from 'react';
import { Loader2, BookOpen } from 'lucide-react';
import ArticleCard from '../../components/articles/ArticleCard';
import ArticleModal from '../../components/articles/ArticleModal';
import { getApprovedPosts } from '../../services/api';

const readTime = (content) => {
  const words = content?.split(' ').length || 0;
  return `${Math.max(1, Math.ceil(words / 200))} min`;
};

const ClientArticlesPage = () => {
  const [posts, setPosts]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [visibleCount, setVisibleCount] = useState(6);
  const [selected, setSelected]         = useState(null);

  useEffect(() => {
    getApprovedPosts()
      .then(setPosts)
      .catch((err) => setError(err?.message || err?.detail || 'Failed to load articles.'))
      .finally(() => setLoading(false));
  }, []);

  const visible = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Articles & Tips</h1>
        <p className="text-slate-500 mt-2">Expert advice and insights for your wellness journey</p>
      </header>

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">No articles found</p>
        </div>
      )}

      {!loading && visible.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {visible.map((post) => (
            <ArticleCard
              key={post.id}
              category={post.authorRole}
              readTime={readTime(post.content)}
              title={post.title}
              excerpt={post.content?.slice(0, 120) + (post.content?.length > 120 ? '...' : '')}
              imageUrl={post.imageUrl}
              onClick={() => setSelected(post)}
            />
          ))}
        </div>
      )}

      {!loading && hasMore && (
        <div className="flex justify-center">
          <button
            onClick={() => setVisibleCount((c) => c + 6)}
            className="px-8 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            Load More Articles
          </button>
        </div>
      )}

      {selected && <ArticleModal post={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default ClientArticlesPage;
