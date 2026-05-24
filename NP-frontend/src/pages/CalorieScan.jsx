import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Loader2, Flame, Beef, Wheat, Droplets, Trash2, Pencil, Check } from 'lucide-react';
import { estimateCalories, getCalorieScans, updateCalorieScan } from '../services/api';

const TIPS = [
  'Ensure good lighting when taking photos',
  'Capture the entire meal in the frame',
  'Keep the camera parallel to the plate',
  'Include a reference object for portion size',
];

const MacroBadge = ({ icon: Icon, label, value, color }) => (
  <div className={`flex flex-col items-center p-3 rounded-xl ${color}`}>
    <Icon className="w-4 h-4 mb-1" />
    <p className="text-lg font-bold">{value}g</p>
    <p className="text-xs opacity-80">{label}</p>
  </div>
);

const CalorieScanPage = () => {
  const [preview, setPreview]       = useState(null);
  const [file, setFile]             = useState(null);
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [history, setHistory]       = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editCal, setEditCal]       = useState('');
  const [editWeight, setEditWeight] = useState('');
  const fileInputRef                = useRef(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const data = await getCalorieScans();
        const mappedHistory = data.map(scan => {
          const d = new Date(scan.createdAt);
          return {
            id: scan.id,
            foodName: scan.foodName,
            estimatedCalories: scan.estimatedCalories,
            totalFat: scan.totalFat,
            totalCarbs: scan.totalCarbs,
            totalProtein: scan.totalProtein,
            itemsDetected: scan.itemsDetected,
            foods: scan.foods,
            details: scan.details,
            originalImageBase64: scan.originalImageBase64,
            segmentedImage: scan.segmentedImageBase64,
            preview: scan.originalImageBase64 ? `data:image/jpeg;base64,${scan.originalImageBase64}` : null,
            time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: d.toLocaleDateString(),
          };
        });
        setHistory(mappedHistory);
      } catch (err) {
        console.error('Failed to load calorie scan history:', err);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f); setResult(null); setError('');
    setPreview(URL.createObjectURL(f));
  };

  const handleScan = async () => {
    if (!file) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await estimateCalories(file);
      setResult(data);
      const entry = {
        id: data.id,
        foodName: data.foodName,
        estimatedCalories: data.estimatedCalories,
        totalFat: data.totalFat,
        totalCarbs: data.totalCarbs,
        totalProtein: data.totalProtein,
        itemsDetected: data.itemsDetected,
        foods: data.foods,
        details: data.details,
        segmentedImage: data.segmentedImage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString(),
        preview,
      };
      setHistory(prev => [entry, ...prev]);
    } catch (err) {
      setError(err?.detail || 'Failed to estimate calories. Please try again.');
    } finally { setLoading(false); }
  };

  const handleSaveEdit = async (idx) => {
    const calVal = parseFloat(editCal);
    const weightVal = parseFloat(editWeight);
    if (isNaN(calVal) || calVal < 0 || isNaN(weightVal) || weightVal < 0) return;

    const scanId = result.id;
    if (!scanId) {
      setResult(prev => {
        const foods = prev.foods.map((f, i) => i === idx ? { ...f, calories: calVal, weightG: weightVal } : f);
        const newTotal = foods.reduce((s, f) => s + (f.calories || 0), 0);
        return { ...prev, foods, estimatedCalories: Math.round(newTotal) };
      });
      setEditingIdx(null);
      return;
    }

    try {
      const updatedFoods = result.foods.map((f, i) =>
        i === idx ? { ...f, calories: calVal, weightG: weightVal } : f
      );
      const updatedData = await updateCalorieScan(scanId, updatedFoods);
      setResult(updatedData);
      setHistory(prev => prev.map(item => {
        if (item.id === scanId) {
          return {
            ...item,
            estimatedCalories: updatedData.estimatedCalories,
            totalFat: updatedData.totalFat,
            totalCarbs: updatedData.totalCarbs,
            totalProtein: updatedData.totalProtein,
            foods: updatedData.foods,
          };
        }
        return item;
      }));
    } catch (err) {
      setError(err?.detail || 'Failed to update calorie scan in database.');
    } finally {
      setEditingIdx(null);
    }
  };

  const handleClear = () => {
    setPreview(null); setFile(null); setResult(null); setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectHistory = (scan) => {
    setPreview(scan.preview || (scan.originalImageBase64 ? `data:image/jpeg;base64,${scan.originalImageBase64}` : null));
    setFile(null);
    setError('');
    setResult({
      id: scan.id,
      foodName: scan.foodName,
      estimatedCalories: scan.estimatedCalories,
      totalFat: scan.totalFat,
      totalCarbs: scan.totalCarbs,
      totalProtein: scan.totalProtein,
      itemsDetected: scan.itemsDetected,
      foods: scan.foods,
      details: scan.details,
      segmentedImage: scan.segmentedImage || scan.segmentedImageBase64,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">AI Calorie Estimation</h1>
        <p className="text-slate-500 mt-1 text-sm">Upload a photo of your food to get instant nutritional information</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Upload + Result */}
        <div className="lg:col-span-2 space-y-6">

          {/* Upload card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4">Upload Food Image</h2>

            {!preview ? (
              <div
                onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 hover:border-emerald-400 transition-all cursor-pointer"
              >
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <Camera className="w-7 h-7 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-900 mb-1">Take or Upload a Photo</p>
                <p className="text-sm text-slate-500 mb-4">Get instant nutritional estimates for your meals</p>
                <span className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium">
                  <Upload className="w-4 h-4" /> Upload Image
                </span>
                <p className="text-xs text-slate-400 mt-3">or drag & drop · JPG, PNG, WEBP</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-slate-200">
                  <img src={preview} alt="Food preview" className="w-full max-h-64 object-cover" />
                  <button onClick={handleClear}
                    className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center hover:bg-red-50">
                    <X className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
                {file && (
                  <button onClick={handleScan} disabled={loading}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Camera className="w-4 h-4" /> Estimate Calories</>}
                  </button>
                )}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-xl">{error}</div>}

          {/* Result card */}
          {result && (
            <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm space-y-5">

              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 capitalize">{result.foodName}</h3>
                  <p className="text-sm text-slate-500">{result.itemsDetected} item(s) detected</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-extrabold text-emerald-600">{result.estimatedCalories}</p>
                  <p className="text-xs text-slate-500">total kcal</p>
                </div>
              </div>

              {/* Side-by-side images */}
              {result.segmentedImage && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl overflow-hidden border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 px-3 py-1.5 bg-slate-50 border-b border-slate-100">Original</p>
                    <img src={preview} alt="Original" className="w-full object-cover max-h-48" />
                  </div>
                  <div className="rounded-xl overflow-hidden border border-emerald-200">
                    <p className="text-xs font-semibold text-emerald-600 px-3 py-1.5 bg-emerald-50 border-b border-emerald-100">Detection Result</p>
                    <img src={`data:image/jpeg;base64,${result.segmentedImage}`} alt="Segmented" className="w-full object-cover max-h-48" />
                  </div>
                </div>
              )}

              {/* Macros */}
              <div className="grid grid-cols-3 gap-3">
                <MacroBadge icon={Beef}     label="Protein" value={result.totalProtein?.toFixed(1) ?? 0} color="bg-blue-50 text-blue-700" />
                <MacroBadge icon={Wheat}    label="Carbs"   value={result.totalCarbs?.toFixed(1)   ?? 0} color="bg-amber-50 text-amber-700" />
                <MacroBadge icon={Droplets} label="Fat"     value={result.totalFat?.toFixed(1)      ?? 0} color="bg-rose-50 text-rose-700" />
              </div>

              {/* Per-item breakdown with editable calories */}
              {result.foods?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Breakdown per item <span className="text-xs font-normal text-slate-400">(tap ✏️ to correct calories)</span></h4>
                  <div className="space-y-2">
                    {result.foods.map((food, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Flame className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 text-sm capitalize truncate">{food.name}</p>
                            <p className="text-xs text-slate-500">{food.weightG}g · P:{food.proteinG?.toFixed(1)}g · C:{food.carbsG?.toFixed(1)}g · F:{food.fatG?.toFixed(1)}g</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {editingIdx === idx ? (
                            <div className="flex items-end gap-2">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] text-slate-400 font-bold uppercase">Weight (g)</span>
                                <input
                                  type="number" value={editWeight}
                                  onChange={e => setEditWeight(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleSaveEdit(idx)}
                                  className="w-14 text-xs border border-emerald-300 rounded-lg px-1.5 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                  autoFocus
                                />
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] text-slate-400 font-bold uppercase">Calories (kcal)</span>
                                <input
                                  type="number" value={editCal}
                                  onChange={e => setEditCal(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleSaveEdit(idx)}
                                  className="w-16 text-xs border border-emerald-300 rounded-lg px-1.5 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                />
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => handleSaveEdit(idx)}
                                  className="w-7 h-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center justify-center cursor-pointer">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditingIdx(null)}
                                  className="w-7 h-7 bg-slate-200 hover:bg-slate-300 rounded-lg flex items-center justify-center cursor-pointer">
                                  <X className="w-3.5 h-3.5 text-slate-600" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="text-right">
                                <p className="font-bold text-slate-900 text-sm">{food.calories?.toFixed(0)} kcal</p>
                                <p className="text-xs text-slate-400">{(food.confidence * 100).toFixed(0)}% conf.</p>
                              </div>
                              <button onClick={() => {
                                setEditingIdx(idx);
                                setEditCal(food.calories?.toFixed(0) ?? '0');
                                setEditWeight(food.weightG?.toFixed(0) ?? '0');
                              }}
                                className="w-7 h-7 bg-slate-100 hover:bg-emerald-100 rounded-lg flex items-center justify-center transition-colors cursor-pointer">
                                <Pencil className="w-3.5 h-3.5 text-slate-500" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-400 text-center">{result.details}</p>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Tips for Best Results</h3>
            {TIPS.map((tip, idx) => (
              <div key={idx} className="flex items-start mb-3 last:mb-0">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5">{idx + 1}</div>
                <p className="text-sm text-slate-700">{tip}</p>
              </div>
            ))}
          </div>

          {(historyLoading || history.length > 0) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Recent Scans</h3>
              </div>
              {historyLoading ? (
                <div className="flex items-center justify-center py-6 text-slate-400 text-sm gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                  <span>Loading history...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((scan) => (
                    <button key={scan.id} onClick={() => handleSelectHistory(scan)}
                      className="w-full flex items-center p-3 rounded-xl hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all text-left">
                      <img src={scan.preview || `data:image/jpeg;base64,${scan.originalImageBase64}`} alt={scan.foodName} className="w-10 h-10 rounded-lg object-cover mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate capitalize">{scan.foodName}</p>
                        <p className="text-xs text-slate-500">{scan.date} · {scan.time}</p>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <p className="font-bold text-emerald-600 text-sm">{scan.estimatedCalories}</p>
                        <p className="text-xs text-slate-500">kcal</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CalorieScanPage;
