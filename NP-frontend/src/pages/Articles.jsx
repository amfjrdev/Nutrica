import { useState, useEffect } from 'react';
import { Loader2, BookOpen } from 'lucide-react';
import TopBanner from '../components/articles/TopBanner';
import FilterButton from '../components/articles/FilterButton';
import ArticleCard from '../components/articles/ArticleCard';
import BottomCTA from '../components/articles/BottomCTA';
import { getApprovedPosts } from '../services/api';

const FILTERS = ['All', 'Nutritionist', 'Admin'];

const readTime = (content) => {
  const words = content?.split(' ').length || 0;
  return `${Math.max(1, Math.ceil(words / 200))} min`;
};

const ArticlesPage = () => {
  const [posts, setPosts]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    getApprovedPosts()
      .then(setPosts)
      .catch((err) => setError(err?.message || err?.detail || 'Failed to load articles.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeFilter === 'All'
    ? posts
    : posts.filter((p) => p.authorRole === activeFilter);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <>
      <TopBanner />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Nutrition Articles
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Free expert content to help you on your health journey
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {FILTERS.map((filter) => (
            <FilterButton
              key={filter}
              label={filter}
              active={activeFilter === filter}
              onClick={() => { setActiveFilter(filter); setVisibleCount(6); }}
            />
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">No articles found</p>
          </div>
        )}

        {/* Article Grid */}
        {!loading && visible.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {visible.map((post) => (
              <ArticleCard
                key={post.id}
                category={post.authorRole}
                readTime={readTime(post.content)}
                title={post.title}
                excerpt={post.content?.slice(0, 120) + (post.content?.length > 120 ? '...' : '')}
                imageUrl={post.imageUrl}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {!loading && hasMore && (
          <div className="flex justify-center mb-20">
            <button
              onClick={() => setVisibleCount((c) => c + 6)}
              className="px-8 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              Load More Articles
            </button>
          </div>
        )}

        {/* Bottom CTA */}
        {!loading && (
          <div className="border-t border-slate-200 pt-10">
            <BottomCTA />
          </div>
        )}
      </main>
    </>
  );
};

export default ArticlesPage;
