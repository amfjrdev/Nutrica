import { Clock, ChevronRight } from 'lucide-react';

const ArticleCard = ({ category, readTime, title, excerpt, imageUrl, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-lg transition-shadow duration-300 flex flex-col h-full cursor-pointer"
  >
    {/* Image */}
    <div className="h-48 bg-emerald-50 w-full relative group overflow-hidden">
      {imageUrl
        ? <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        : <div className="w-full h-full bg-emerald-50" />}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-emerald-100/50">
        <span className="bg-white px-4 py-2 rounded-full text-sm font-semibold text-emerald-600 shadow-sm">View Article</span>
      </div>
    </div>

    {/* Content */}
    <div className="p-6 flex flex-col flex-grow">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{category}</span>
        <div className="flex items-center text-slate-400 text-xs font-medium">
          <Clock className="w-3 h-3 mr-1" />
          {readTime}
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-900 mb-3 leading-tight">{title}</h3>

      <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-grow">{excerpt}</p>

      <span className="inline-flex items-center text-emerald-600 font-semibold text-sm hover:text-emerald-700 transition-colors group">
        Read Article
        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </span>
    </div>
  </div>
);

export default ArticleCard;
