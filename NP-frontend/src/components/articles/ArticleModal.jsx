import { X, Clock, User } from 'lucide-react';
import { useEffect } from 'react';

const readTime = (content) => {
  const words = content?.split(' ').length || 0;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
};

const ArticleModal = ({ post, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden">

        {/* Hero image */}
        {post.imageUrl && (
          <div className="h-64 w-full overflow-hidden">
            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Header */}
        <div className="p-8 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full">
                {post.authorRole}
              </span>
              <div className="flex items-center text-slate-400 text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {readTime(post.content)}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight mb-4">
            {post.title}
          </h1>

          <div className="flex items-center gap-2 pb-6 border-b border-slate-100">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{post.authorName || post.authorRole}</p>
              <p className="text-xs text-slate-400">
                {post.createdAt ? new Date(post.createdAt).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
            {post.content}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
          >
            Close Article
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArticleModal;
