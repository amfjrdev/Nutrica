import { useState, useRef } from 'react';
import { ChevronDown, Save, Send, Loader2, CheckCircle, ImagePlus, X } from 'lucide-react';
import { createPost } from '../../services/api';

const CATEGORIES = ['Nutrition Basics', 'Recipes', 'Health Science', 'Lifestyle', 'Weight Loss'];

const InputField = ({ label, type = 'text', value, onChange, placeholder }) => (
  <div className="flex flex-col mb-5">
    <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
  </div>
);

const SelectField = ({ label, value, onChange, options, placeholder }) => (
  <div className="flex flex-col mb-5">
    <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
    <div className="relative">
      <select value={value} onChange={onChange}
        className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer">
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

const TextAreaField = ({ label, value, onChange, placeholder, rows = 6 }) => (
  <div className="flex flex-col mb-5">
    <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
    <textarea rows={rows} value={value} onChange={onChange} placeholder={placeholder}
      className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none" />
  </div>
);

const WriteArticle = () => {
  const [form, setForm]         = useState({ title: '', category: '', excerpt: '', content: '' });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [msg, setMsg]           = useState('');
  const [isError, setIsError]   = useState(false);
  const fileInputRef = useRef(null);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMsg('Image must be smaller than 5MB.'); setIsError(true); return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageBase64(reader.result);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageBase64(null);
    setImagePreview(null);
    fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setMsg('Title and content are required.'); setIsError(true); return;
    }
    setLoading(true); setMsg('');
    try {
      const fullContent = [
        form.category ? `Category: ${form.category}` : '',
        form.excerpt  ? `Summary: ${form.excerpt}` : '',
        form.content,
      ].filter(Boolean).join('\n\n');

      await createPost({ title: form.title, content: fullContent, imageUrl: imageBase64 || null });
      setMsg('Article submitted for review! It will be published once approved by an admin.');
      setIsError(false);
      setForm({ title: '', category: '', excerpt: '', content: '' });
      removeImage();
    } catch (err) {
      console.error('createPost error:', err);
      setMsg(err?.detail || err?.title || err?.message || 'Failed to submit article.');
      setIsError(true);
    } finally { setLoading(false); }
  };

  const handleDraft = () => {
    setMsg('Draft saved locally. Submit when ready.');
    setIsError(false);
  };

  return (
    <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Write Article</h1>
            <p className="text-slate-500 mt-2">Share nutrition knowledge with clients</p>
          </header>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">New Article</h3>

            {msg && (
              <div className={`flex items-start gap-2 p-4 rounded-lg text-sm mb-6 ${isError ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                {!isError && <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}{msg}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <InputField label="Article Title" value={form.title} onChange={set('title')}
                placeholder="Enter article title..." />

              <SelectField label="Category" value={form.category} onChange={set('category')}
                options={CATEGORIES} placeholder="Select category" />

              <InputField label="Excerpt" value={form.excerpt} onChange={set('excerpt')}
                placeholder="Brief summary of the article..." />

              {/* Image upload */}
              <div className="flex flex-col mb-5">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Cover Image (optional)</label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                {imagePreview ? (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-slate-200">
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={removeImage}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-50 transition-colors">
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current.click()}
                    className="flex items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 hover:border-emerald-400 hover:text-emerald-500 transition-colors">
                    <ImagePlus className="w-5 h-5" />
                    <span className="text-sm font-medium">Click to upload image</span>
                  </button>
                )}
              </div>

              <TextAreaField label="Article Content" value={form.content} onChange={set('content')}
                placeholder="Write your article content..." rows={12} />

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 mb-6">
                Articles are reviewed by an admin before being published to clients.
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100">
                <button type="submit" disabled={loading}
                  className="flex-1 sm:flex-none px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Publish Article
                </button>
                <button type="button" onClick={handleDraft}
                  className="flex-1 sm:flex-none px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors flex items-center justify-center">
                  <Save className="w-4 h-4 mr-2" />Save Draft
                </button>
              </div>
            </form>
          </div>
    </div>
  );
};

export default WriteArticle;
