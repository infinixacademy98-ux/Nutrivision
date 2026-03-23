import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, Check, X, Info, ChevronLeft, ChevronRight, Scale, Search } from 'lucide-react';
import { analyzeFoodImage, getFoodAdvice, analyzeFoodText } from '../services/gemini';
import { UserProfile, FoodLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { checkAndIncrementAiUsage, getAiUsage } from '../services/aiQuotaService';

interface FoodScannerProps {
  profile: UserProfile;
  onLogFood: (log: FoodLog) => void;
}

export default function FoodScanner({ profile, onLogFood }: FoodScannerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [selectedFood, setSelectedFood] = useState<any | null>(null);
  const [advice, setAdvice] = useState<any | null>(null);
  const [portion, setPortion] = useState<'small' | 'medium' | 'large'>('medium');
  const [manualInput, setManualInput] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualFormData, setManualFormData] = useState({
    name: '',
    calories: '',
    protein: '',
    fat: '',
    carbs: '',
    fiber: ''
  });
  const [quotaInfo, setQuotaInfo] = useState<{ count: number; limit: number; remaining: number } | null>(null);
  const [cooldown, setCooldown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const fetchQuota = async () => {
      const info = await getAiUsage(profile.uid);
      setQuotaInfo(info);
    };
    fetchQuota();
  }, [profile.uid]);

  const portionMultipliers = {
    small: 0.7,
    medium: 1,
    large: 1.5
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (cooldown) {
      alert("Please wait a few seconds before scanning again.");
      return;
    }

    const { allowed, remaining } = await checkAndIncrementAiUsage(profile.uid);
    if (!allowed) {
      alert("You have reached your daily AI limit. Please use manual entry or try again tomorrow.");
      return;
    }
    setQuotaInfo(prev => prev ? { ...prev, remaining } : null);

    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        // Compress image before setting it to state and Firestore
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions for compression
          const MAX_SIZE = 800;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.7 quality
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setImage(compressedBase64);
          await analyze(compressedBase64.split(',')[1]);
        };
        img.src = base64;
      };
      reader.readAsDataURL(file);
    }
  };

  const analyze = async (base64: string) => {
    setLoading(true);
    setCooldown(true);
    setTimeout(() => setCooldown(false), 30000); // 30s cooldown

    try {
      const results = await analyzeFoodImage(base64);
      setPredictions(results);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    if (cooldown) {
      alert("Please wait a few seconds before scanning again.");
      return;
    }

    const { allowed, remaining } = await checkAndIncrementAiUsage(profile.uid);
    if (!allowed) {
      alert("You have reached your daily AI limit. Please use manual entry or try again tomorrow.");
      return;
    }
    setQuotaInfo(prev => prev ? { ...prev, remaining } : null);

    setLoading(true);
    setCooldown(true);
    setTimeout(() => setCooldown(false), 30000); // 30s cooldown

    // Set a placeholder image or just clear it
    setImage(null); 
    try {
      const results = await analyzeFoodText(manualInput);
      setPredictions(results);
      // If we got results, automatically select the first one since it's a text search
      if (results.length > 0) {
        handleSelectFood(results[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFood = async (food: any) => {
    setSelectedFood(food);
    
    if (cooldown) {
      // Don't alert here, just skip advice if on cooldown to avoid annoying user
      return;
    }

    const { allowed, remaining } = await checkAndIncrementAiUsage(profile.uid);
    if (!allowed) {
      // Don't alert here, just skip advice
      return;
    }
    setQuotaInfo(prev => prev ? { ...prev, remaining } : null);

    setLoading(true);
    setCooldown(true);
    setTimeout(() => setCooldown(false), 30000); // 30s cooldown

    try {
      const foodAdvice = await getFoodAdvice(food.name, profile, {});
      setAdvice(foodAdvice);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedFood) return;

    const multiplier = portionMultipliers[portion];
    
    const log: FoodLog = {
      uid: profile.uid,
      name: selectedFood.name,
      calories: Math.round(selectedFood.calories * multiplier),
      protein: Math.round(selectedFood.protein * multiplier),
      fat: Math.round(selectedFood.fat * multiplier),
      carbs: Math.round(selectedFood.carbs * multiplier),
      fiber: Math.round(selectedFood.fiber * multiplier),
      timestamp: new Date().toISOString(),
      portionSize: portion
    };

    onLogFood(log);
    reset();
  };

  const handleFullManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, calories, protein, fat, carbs, fiber } = manualFormData;
    if (!name || !calories) return;

    const log: FoodLog = {
      uid: profile.uid,
      name,
      calories: Number(calories),
      protein: Number(protein) || 0,
      fat: Number(fat) || 0,
      carbs: Number(carbs) || 0,
      fiber: Number(fiber) || 0,
      timestamp: new Date().toISOString(),
      portionSize: 'medium'
    };

    onLogFood(log);
    reset();
    setShowManualForm(false);
  };

  const reset = () => {
    setImage(null);
    setPredictions([]);
    setSelectedFood(null);
    setAdvice(null);
    setPortion('medium');
    setManualInput('');
    setManualFormData({
      name: '',
      calories: '',
      protein: '',
      fat: '',
      carbs: '',
      fiber: ''
    });
  };

  const currentCalories = selectedFood ? Math.round(selectedFood.calories * portionMultipliers[portion]) : 0;

  return (
    <div className="space-y-6 pb-10">
      <AnimatePresence mode="wait">
        {!image && !selectedFood && !loading ? (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-3xl p-10 border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
                <Camera className="w-10 h-10 text-brand-orange" />
              </div>
              <h2 className="text-xl font-bold text-stone-900 mb-2">Scan Your Food</h2>
              <p className="text-stone-400 text-sm mb-8 max-w-xs">Take a photo of your meal to automatically track nutrition.</p>
              
              {quotaInfo && (
                <div className="mb-6 px-4 py-2 bg-stone-50 rounded-xl border border-stone-100">
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                    AI Credits: {quotaInfo.remaining} / {quotaInfo.limit} remaining today
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-4 w-full max-w-xs">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 bg-brand-orange text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-100 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Upload className="w-5 h-5" />
                  Upload Photo
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest">Or Type Manually</h3>
                <button 
                  onClick={() => setShowManualForm(!showManualForm)}
                  className="text-[10px] font-black text-brand-orange uppercase tracking-widest hover:underline"
                >
                  {showManualForm ? 'Hide Manual Form' : 'Full Manual Entry'}
                </button>
              </div>

              {showManualForm ? (
                <form onSubmit={handleFullManualSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Food Name</label>
                    <input
                      required
                      type="text"
                      value={manualFormData.name}
                      onChange={(e) => setManualFormData({ ...manualFormData, name: e.target.value })}
                      placeholder="e.g. Protein Bar"
                      className="w-full bg-stone-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand-orange transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Calories</label>
                      <input
                        required
                        type="number"
                        value={manualFormData.calories}
                        onChange={(e) => setManualFormData({ ...manualFormData, calories: e.target.value })}
                        placeholder="kcal"
                        className="w-full bg-stone-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand-orange transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Protein (g)</label>
                      <input
                        type="number"
                        value={manualFormData.protein}
                        onChange={(e) => setManualFormData({ ...manualFormData, protein: e.target.value })}
                        placeholder="g"
                        className="w-full bg-stone-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand-orange transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Fat (g)</label>
                      <input
                        type="number"
                        value={manualFormData.fat}
                        onChange={(e) => setManualFormData({ ...manualFormData, fat: e.target.value })}
                        placeholder="g"
                        className="w-full bg-stone-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand-orange transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Carbs (g)</label>
                      <input
                        type="number"
                        value={manualFormData.carbs}
                        onChange={(e) => setManualFormData({ ...manualFormData, carbs: e.target.value })}
                        placeholder="g"
                        className="w-full bg-stone-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand-orange transition-all"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-brand-dark text-white font-black py-4 rounded-2xl shadow-lg hover:bg-black transition-all active:scale-95"
                  >
                    LOG MEAL MANUALLY
                  </button>
                </form>
              ) : (
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
                    <input
                      type="text"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="e.g. 2 eggs and toast"
                      className="w-full bg-stone-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-brand-orange transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!manualInput.trim()}
                    className="bg-brand-dark text-white p-4 rounded-2xl shadow-lg hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {image && (
              <div className="relative rounded-3xl overflow-hidden aspect-square shadow-lg border-4 border-white">
                <img src={image} alt="Food" className="w-full h-full object-cover" />
                <button 
                  onClick={reset}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            )}

            {loading && !selectedFood && (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-stone-100 shadow-sm">
                <Loader2 className="w-10 h-10 text-brand-orange animate-spin mb-4" />
                <p className="text-stone-500 font-medium">Analyzing your meal...</p>
              </div>
            )}

            {!loading && predictions.length > 0 && !selectedFood && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100"
              >
                <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5 text-brand-orange" />
                  Select the correct food
                </h3>
                <div className="space-y-3">
                  {predictions.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectFood(p)}
                      className="w-full flex items-center justify-between p-4 bg-stone-50 rounded-2xl hover:bg-orange-50 hover:border-orange-200 border border-transparent transition-all group"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-bold text-stone-900 group-hover:text-brand-orange transition-colors">{p.name}</span>
                        <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">{p.calories} kcal / 100g</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-brand-orange bg-orange-50 px-2 py-1 rounded-lg">
                          {Math.round(p.confidence * 100)}%
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {selectedFood && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 relative">
                  <button 
                    onClick={() => setSelectedFood(null)}
                    className="absolute -top-3 -left-3 w-8 h-8 bg-white border border-stone-200 rounded-full flex items-center justify-center text-stone-400 hover:text-brand-orange shadow-sm transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-stone-900 text-xl">{selectedFood.name}</h3>
                      <p className="text-xs text-stone-400 font-medium">Nutrition for selected portion</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-black text-brand-orange leading-none">{currentCalories}</span>
                      <span className="text-xs font-bold text-stone-400 block uppercase tracking-tighter">kcal</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-8">
                    {[
                      { label: 'Protein', val: selectedFood.protein, color: 'bg-brand-orange', unit: 'g' },
                      { label: 'Fat', val: selectedFood.fat, color: 'bg-amber-500', unit: 'g' },
                      { label: 'Carbs', val: selectedFood.carbs, color: 'bg-blue-500', unit: 'g' },
                      { label: 'Fiber', val: selectedFood.fiber, color: 'bg-purple-500', unit: 'g' }
                    ].map((m) => (
                      <div key={m.label} className="text-center p-3 bg-stone-50 rounded-2xl border border-stone-100">
                        <span className="text-[10px] font-black text-stone-400 uppercase block mb-1">{m.label.slice(0, 1)}</span>
                        <span className="text-sm font-black text-stone-900">{Math.round(m.val * portionMultipliers[portion])}{m.unit}</span>
                        <div className={`h-1 w-4 mx-auto mt-2 rounded-full ${m.color}`} />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                        <Scale className="w-4 h-4" />
                        Adjust Portion
                      </label>
                      <span className="text-xs font-bold text-brand-orange bg-orange-50 px-2 py-1 rounded-lg">
                        {portion === 'small' ? '0.7x' : portion === 'large' ? '1.5x' : '1.0x'} Size
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      {(['small', 'medium', 'large'] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPortion(p)}
                          className={`relative py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all overflow-hidden ${
                            portion === p 
                              ? 'bg-brand-orange text-white shadow-lg shadow-orange-100' 
                              : 'bg-stone-50 text-stone-400 border border-stone-100 hover:bg-stone-100'
                          }`}
                        >
                          {p}
                          {portion === p && (
                            <motion.div 
                              layoutId="portion-active"
                              className="absolute inset-0 bg-brand-orange/20"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-stone-400 text-center italic">
                      {portion === 'small' ? 'Approx. 70g portion' : portion === 'large' ? 'Approx. 150g portion' : 'Standard 100g portion'}
                    </p>
                  </div>
                </div>

                {loading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 text-brand-orange animate-spin mr-2" />
                    <span className="text-sm text-stone-400 font-medium">Getting AI advice...</span>
                  </div>
                )}

                {advice && !loading && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-3xl p-6 border-2 ${
                      advice.recommendation === 'Eat' ? 'bg-orange-50 border-orange-100' :
                      advice.recommendation === 'Limit' ? 'bg-amber-50 border-amber-100' :
                      'bg-rose-50 border-rose-100'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-2xl shadow-sm ${
                        advice.recommendation === 'Eat' ? 'bg-brand-orange' :
                        advice.recommendation === 'Limit' ? 'bg-amber-500' :
                        'bg-rose-500'
                      }`}>
                        <Info className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-black text-stone-900 uppercase text-xs tracking-widest">
                          Verdict: <span className={
                            advice.recommendation === 'Eat' ? 'text-brand-orange' :
                            advice.recommendation === 'Limit' ? 'text-amber-600' :
                            'text-rose-600'
                          }>{advice.recommendation}</span>
                        </h4>
                        <p className="text-sm text-stone-600 mt-2 leading-relaxed">{advice.reason}</p>
                      </div>
                    </div>
                    
                    {advice.alternatives.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-stone-200/50">
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Better Alternatives</span>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {advice.alternatives.map((alt: string, i: number) => (
                            <span key={i} className="bg-white text-stone-700 text-[10px] font-bold px-3 py-2 rounded-xl border border-stone-200 shadow-sm">
                              {alt}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                <button
                  onClick={handleConfirm}
                  className="w-full bg-brand-orange text-white font-black py-5 rounded-2xl shadow-xl shadow-orange-100 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                >
                  <Check className="w-6 h-6" />
                  LOG MEAL • {currentCalories} KCAL
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
