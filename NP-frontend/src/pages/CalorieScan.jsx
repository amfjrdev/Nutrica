import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { estimateCalories } from '../services/api';

const TIPS = [
  "Ensure good lighting when taking photos",
  "Capture the entire meal in the frame",
  "Keep the camera parallel to the plate",
  "Include a reference object for portion size",
];

const TipItem = ({ number, text }) => (
  <div className="flex items-start mb-4 last:mb-0">
    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
      {number}
    </div>
    <p className="text-sm text-slate-700">{text}</p>
  </div>
);

const CalorieScanPage = () => {
  const [preview, setPreview]     = useState(null);
  const [file, setFile]           = useState(null);
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [history, setHistory]     = useState([]);
  const fileInputRef              = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const handleScan = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await estimateCalories(file);
      setResult(data);
      setHistory((prev) => [
        { ...data, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), preview },
        ...prev.slice(0, 4),
      ]);
    } catch (err) {
      setError(err?.detail || 'Failed to estimate calories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setFile(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">AI Calorie Estimation</h1>
            <p className="text-slate-500 mt-2">Upload a photo of your food to get instant nutritional information</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Upload + Result */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-6">Upload Food Image</h2>

                {/* Drop Zone */}
                {!preview ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-400 transition-all group cursor-pointer"
                  >
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                      <Camera className="w-8 h-8 text-slate-500 group-hover:text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Take or Upload a Photo</h3>
                    <p className="text-slate-500 mb-8">Get instant nutritional estimates for your meals</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button className="flex items-center justify-center px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors shadow-sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-4">or drag & drop · JPG, PNG, WEBP</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Preview */}
                    <div className="relative rounded-xl overflow-hidden border border-slate-200">
                      <img src={preview} alt="Food preview" className="w-full max-h-72 object-cover" />
                      <button onClick={handleClear}
                        className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-red-50 transition-colors">
                        <X className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>

                    <button onClick={handleScan} disabled={loading}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                      {loading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                        : <><Camera className="w-4 h-4" /> Estimate Calories</>}
                    </button>
                  </div>
                )}

                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])} />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-xl">{error}</div>
              )}

              {/* Result Card */}
              {result && (
                <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mr-3">
                      <Camera className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{result.foodName}</h3>
                      <p className="text-sm text-slate-500">AI Estimation Result</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-3xl font-extrabold text-emerald-600">{result.estimatedCalories}</p>
                      <p className="text-sm text-slate-500">calories</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 leading-relaxed">{result.details}</p>
                </div>
              )}
            </div>

            {/* Side Panel */}
            <div className="space-y-6">
              {/* Tips */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Tips for Best Results</h3>
                {TIPS.map((tip, idx) => <TipItem key={idx} number={idx + 1} text={tip} />)}
              </div>

              {/* Recent Scans */}
              {history.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Scans</h3>
                  <div className="space-y-2">
                    {history.map((scan, idx) => (
                      <div key={idx} className="flex items-center p-3 rounded-lg hover:bg-slate-50 transition-colors">
                        <img src={scan.preview} alt={scan.foodName}
                          className="w-10 h-10 rounded-lg object-cover mr-3 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 text-sm truncate">{scan.foodName}</p>
                          <p className="text-xs text-slate-500">{scan.time}</p>
                        </div>
                        <div className="text-right ml-2">
                          <p className="font-bold text-slate-900 text-sm">{scan.estimatedCalories}</p>
                          <p className="text-xs text-slate-500">cal</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
    </div>
  );
};

export default CalorieScanPage;
